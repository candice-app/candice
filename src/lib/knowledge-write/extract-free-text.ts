// EXTRACTION D'UNE RÉPONSE LIBRE — les 6 étapes de §27 (hsg). L'étape 3 (conserver le brut) est faite
// ailleurs (produceSocleFact = FACT verbatim) ; ici les étapes 1-2-4-5-6. Le modèle lit la réponse
// ENTIÈRE d'abord (§27.1), identifie les unités, et renvoie DEUX sorties : les signaux canoniques
// justifiés (INTEREST/ENTITY — 0 ou plusieurs) ET le reliquat en connaissance ouverte (rien de perdu).
//
// Règles verrouillées (§48bis/§48quinquies) appliquées ici :
//  - provenance NIVEAU 5 : sourceType 'extraction_inferred', assertionStatus 'inferred', confiance 'low'
//    → toujours plus faible qu'une déclaration, jamais promue.
//  - sujet PRÉCIS conservé (« photographie argentique » ≠ « photographie ») : subjectLabel verbatim.
//  - JAMAIS un trait psy (PROFILE/NEED/DRIVER) déduit d'un fait — interdit dans le prompt.
//  - RIEN PERDU faute de tag → OpenKnowledge. Si rien d'exploitable → zéro (tableau vide), normal.
//  - sortie VALIDÉE par schéma (tool Anthropic) ; identité = slug normalisé (la déduplication cross-mentions
//    est un raffinement futur, pas un prérequis — comme I7).

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { createSourceRecord } from '../knowledge/sources';
import { createOpenKnowledge } from '../knowledge/open-knowledge';
import { asSubjectId, asEntityId, type AboutRef, type UserId } from '../knowledge/identity';
import { ENTITY_RELATIONS, INTEREST_PARENT_DOMAINS, INTEREST_RELATIONSHIPS, type InterestRelationship } from '../knowledge/vocabulary';
import { normalizeLabel } from '../knowledge/normalize';
import { persistKnowledge, type WriteClient } from './persist';
import { evidenceId, openKnowledgeId } from './ids';
import { JOURNAL_VERSION_STAMP } from '../knowledge/version';
import type { Evidence, OpenKnowledge, EntityRelation } from '../knowledge';
import { cibleDUneEntite } from '../knowledge/cible-appreciation';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Tu es le moteur d'extraction de Candice. On te donne UNE réponse libre d'une personne sur elle-même. Procédure (ne commence jamais par chercher des tags) :
1. Lis la réponse ENTIÈRE et comprends-la dans son ensemble.
2. Identifie ses unités d'information : intérêts, entités concrètes (marques, lieux, œuvres, aliments, personnes), envies, rejets.
3. Pour chaque unité, décide sa famille : INTEREST (un sujet/univers qui l'intéresse), ENTITY (une chose réelle identifiable), ou OTHER (tout le reste : à conserver tel quel, sans famille).
INTERDICTIONS ABSOLUES :
- Ne JAMAIS inférer un trait psychologique (personnalité, besoin, motivation) à partir d'un fait. Une allergie, une passion, une contrainte ne produisent jamais de trait.
- Ne JAMAIS généraliser un sujet précis : « photographie argentique japonaise » reste tel quel, pas « photographie ».
- Si la réponse ne porte aucune connaissance exploitable, renvoie une liste VIDE. C'est normal.
- Tu N'INVENTES rien qui ne soit pas dans la réponse.

SENSIBILITÉ (champ \`sensitive\` de chaque unité) : mets \`sensitive: true\` dès qu'une unité touche la SANTÉ, une allergie/intolérance, une situation ou un traitement MÉDICAL, une grossesse, ou une ADRESSE — y compris formulé de façon implicite (« je ne peux pas manger de pain », « depuis mon opération », « mon traitement me fatigue »). Une info sensible est conservée (Candice doit savoir pour agir) mais ne sera JAMAIS nommée dans un texte généré. Dans le doute, \`sensitive: true\`.`;

const TOOL = {
  name: 'units',
  description: 'Unités d\'information extraites de la réponse libre.',
  input_schema: {
    type: 'object' as const,
    properties: {
      units: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            family: { type: 'string', enum: ['INTEREST', 'ENTITY', 'OTHER'], description: "INTEREST : un intérêt ÉTABLI par les propos pour un sujet. ENTITY : une chose nommée (marque, lieu, œuvre, plat…). OTHER : tout le reste — dont un REJET ou un désintérêt (« j'ai détesté ») et une ACTION PONCTUELLE dont aucun intérêt durable ne ressort. Leur formulation part verbatim dans relation_label ; un rejet ne s'encode JAMAIS dans l'échelle d'engagement." },
            label: { type: 'string', description: 'formulation PRÉCISE, verbatim, jamais généralisée' },
            parentDomain: { type: 'string', description: `INTEREST : domaine parent. Prends-le dans cette liste dès qu'un terme convient : ${INTEREST_PARENT_DOMAINS.seed.join(', ')}. Si aucun ne convient, laisse vide plutôt que de forcer un domaine voisin.` },
            relationship: { type: 'string', enum: [...INTEREST_RELATIONSHIPS], description: "INTEREST : DEGRÉ D'ENGAGEMENT, et seulement s'il est établi par les propos — casual (occasionnel), curious (curieux), enthusiast (passionné amateur), passion, expert. LAISSE VIDE si l'intérêt est établi mais pas son degré : l'absence est une information juste, jamais un degré faible." },
            entityType: { type: 'string', enum: ['brand', 'place', 'restaurant', 'hotel', 'product', 'food', 'drink', 'book', 'film_series', 'music', 'artist', 'destination', 'event', 'person'], description: 'ENTITY : sous-type exact' },
            relation: { type: 'string', enum: [...ENTITY_RELATIONS], description: 'ENTITY : relation explicitement exprimée envers la chose ; laisse vide pour une simple mention' },
            cible: { type: 'string', enum: ['referent', 'aspect'], description: "ENTITY avec relation (obligatoire) : referent si la relation porte sur la chose ELLE-MÊME (« j'adore Patagonia », « j'aimerais aller au Japon ») ; aspect si elle porte sur une de ses parties ou qualités (« j'adore l'ambiance du Café de Flore », « la cuisine du Japon »). Une appréciation d'un aspect n'est JAMAIS une relation envers la chose : déclare aspect." },
            relation_label: { type: 'string', description: 'OTHER : la nature du lien, en mots (ex. « passion », « collectionne »)' },
            sensitive: { type: 'boolean', description: 'true si l\'unité touche la SANTÉ, une allergie/intolérance, une situation/traitement MÉDICAL, une grossesse, ou une ADRESSE (même implicite). Dans le doute, true.' },
          },
          required: ['family', 'label'],
        },
      },
    },
    required: ['units'],
  },
};

interface Unit { family: 'INTEREST' | 'ENTITY' | 'OTHER'; label: string; parentDomain?: string; relationship?: InterestRelationship; entityType?: string; relation?: EntityRelation; cible?: string; relation_label?: string; sensitive?: boolean; }

export interface ExtractResult {
  readonly evidences: readonly Evidence[];
  readonly openKnowledge: readonly OpenKnowledge[];
  /** L'extraction de CETTE réponse existait déjà : rien n'a été rappelé ni réécrit. */
  readonly dejaFaite?: boolean;
}

/**
 * LE MODÈLE N'A PAS RÉPONDU. Ce n'est PAS « rien à extraire ».
 *
 * La première version rendait une liste vide dans les deux cas : une panne passait pour une
 * réponse sans contenu, la route la comptait « extraite », l'écran l'affichait terminée. Le
 * verbatim était bien sauvegardé (il est écrit AVANT, ailleurs), mais rien ne signalait que
 * sa lecture restait à faire. Une panne LÈVE donc cette erreur : la route la compte en échec,
 * l'écran marque le champ « à rejouer », et aucune source d'extraction n'est écrite — c'est
 * l'absence de cette source qui dit, à la relance, qu'il faut recommencer.
 */
export class ExtractionIndisponibleError extends Error {
  constructor(cause: unknown) {
    super(`extraction indisponible : ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'ExtractionIndisponibleError';
  }
}

type EntreeExtraction = {
  about: AboutRef; ownerId: UserId; rawText: string; fieldContext: string; timestamp: string;
  questionCode?: string; correctionEventId?: string;
  /** La source du VERBATIM dont cette extraction est la lecture, quand l'appelant la connaît. */
  verbatimSourceId?: string;
  /**
   * Les relations que le CONTRAT de la question admet pour une entité (onglet 9 du référentiel
   * Discovery). Absent = pas de contrat particulier. Une entité lue avec une relation hors de
   * cette liste n'est pas écrite comme entité : elle rejoint la connaissance ouverte, verbatim.
   */
  relationsAdmises?: readonly string[];
};

/**
 * L'IDENTITÉ D'UNE EXTRACTION EST CELLE DE CE QU'ELLE LIT. Même personne, même question, même
 * texte, même évènement de correction → même identifiant de source. Rejouer après une panne,
 * ou deux fois de suite, ne peut donc pas créer une seconde lecture de la même phrase.
 * Sans identifiant stable de question, l'identité reste aléatoire (comportement antérieur).
 */
export function extractionSourceId(input: EntreeExtraction): string {
  if (!input.questionCode?.trim()) return globalThis.crypto.randomUUID();
  const texte = createHash('sha256').update(input.rawText.trim()).digest('hex');
  return evidenceId('extraction', [
    input.ownerId, input.about.kind, input.about.id, input.questionCode,
    input.verbatimSourceId ?? '', input.correctionEventId ?? '', texte,
  ].join(':'));
}
export interface ExtractBuild extends ExtractResult { readonly source: ReturnType<typeof createSourceRecord> | null }

interface LectureSources {
  from(t: string): { select(c: string): { eq(c: string, v: string): { maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }> } } };
}

/**
 * Extrait une réponse libre et PERSISTE le résultat (source niveau 5 + evidences canoniques + OpenKnowledge).
 * Le FACT verbatim (étape 3) est écrit séparément (A3). persistKnowledge exige la migration 93 (CHECK source_type).
 */
export async function extractFreeText(
  client: WriteClient,
  input: EntreeExtraction,
): Promise<ExtractResult> {
  // ── DÉJÀ LUE ? On regarde AVANT d'appeler le modèle : une relance après une panne, un
  //    double envoi, deux onglets — aucun ne doit produire une seconde lecture.
  if (input.questionCode?.trim() && input.rawText.trim()) {
    const id = extractionSourceId(input);
    try {
      const { data } = await (client as unknown as LectureSources)
        .from('knowledge_sources').select('id').eq('id', id).maybeSingle();
      if (data) return { evidences: [], openKnowledge: [], dejaFaite: true };
    } catch { /* lecture impossible : on continue, l'identifiant stable empêche le doublon de source */ }
  }
  const built = await buildFromFreeText(input);
  if (built.source) await persistKnowledge(client, { source: built.source, evidences: [...built.evidences], facts: [], openKnowledge: [...built.openKnowledge] });
  return { evidences: built.evidences, openKnowledge: built.openKnowledge };
}

/**
 * Appel modèle + construction des deux sorties, SANS persistance (testable/prouvable sans base).
 * §27 étapes 1-2-4-5-6. Renvoie aussi la source (null si rien à extraire).
 */
export async function buildFromFreeText(
  input: EntreeExtraction,
): Promise<ExtractBuild> {
  const text = input.rawText.trim();
  if (!text) return { source: null, evidences: [], openKnowledge: [] }; // rien à extraire → zéro

  let units: Unit[] = [];
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1024,
      system: SYSTEM, tools: [TOOL], tool_choice: { type: 'tool', name: 'units' },
      messages: [{ role: 'user', content: `Champ : ${input.fieldContext}\nRéponse : « ${text} »` }],
    });
    const block = msg.content.find((b) => b.type === 'tool_use');
    if (block && block.type === 'tool_use') units = ((block.input as { units?: Unit[] }).units ?? []).filter((u) => u.label?.trim());
  } catch (e) { throw new ExtractionIndisponibleError(e); } // échec modèle → ERREUR : jamais d'invention, et jamais « rien à extraire »

  const sourceId = extractionSourceId(input);
  const source = createSourceRecord({
    about: input.about, ownerId: input.ownerId, id: sourceId,
    sourceType: 'extraction_inferred', questionText: input.fieldContext, rawText: text, timestamp: input.timestamp,
    ...(input.questionCode ? { questionCode: input.questionCode } : {}), // IDENTIFIANT STABLE (= factType du champ) — même clé que le verbatim, survit au changement de libellé
    ...(input.correctionEventId ? { correctionEventId: input.correctionEventId } : {}), // 3ᵉ forme : la source inférée porte l'id de l'évènement de correction (comme le verbatim déclaré)
  });
  const common = {
    about: input.about, ownerId: input.ownerId, source_id: sourceId, source_type: 'extraction_inferred' as const,
    confidence: 'low' as const, context: 'GLOBAL', timestamp: input.timestamp, stability: 'contextual' as const,
    evidence_role: 'primary' as const, assertionBasis: 'self_report' as const, assertionStatus: 'inferred' as const,
    version: JOURNAL_VERSION_STAMP,
  };

/** Degré d'engagement : vocabulaire FERMÉ (INTEREST_RELATIONSHIPS, arbitrage 13 nov).
 *  Une valeur hors vocabulaire n'est JAMAIS convertie — « curiosity » ne devient pas
 *  « curious », « appreciation » et « aversion » ne deviennent pas des degrés : ce sont
 *  des axes différents. Elle est écartée, et l'absence de degré est enregistrée telle
 *  quelle (relationship NULL), ce qui est juste ; une conversion serait une invention. */
function degreCanonique(v: string | undefined): InterestRelationship | undefined {
  if (v === undefined) return undefined;
  const t = v.trim().toLowerCase();
  return (INTEREST_RELATIONSHIPS as readonly string[]).includes(t) ? (t as InterestRelationship) : undefined;
}

  const evidences: Evidence[] = [];
  const openKnowledge: OpenKnowledge[] = [];
  for (const u of units) {
    const label = u.label.trim();
    if (u.family === 'INTEREST') {
      evidences.push({ ...common, evidence_id: evidenceId(sourceId, `INTEREST:${normalizeLabel(label)}`), raw_information: label,
        target_family: 'INTEREST', subject: asSubjectId(normalizeLabel(label)), target_construct: asSubjectId(normalizeLabel(label)),
        subjectLabel: label, ...(u.parentDomain ? { parent_domain: normalizeLabel(u.parentDomain) } : {}),
        ...(degreCanonique(u.relationship) ? { relationship: degreCanonique(u.relationship) } : {}), strength: 'moderate' } as Evidence);
    } else if (u.family === 'ENTITY' && u.relation && ENTITY_RELATIONS.includes(u.relation)
      && (!input.relationsAdmises || input.relationsAdmises.includes(u.relation))
      // La cible (19 nov., 19h56) : le modèle dit « la chose elle-même », ET les mots le vérifient.
      && u.cible === 'referent' && cibleDUneEntite(text, label).cible === 'referent') {
      evidences.push({ ...common, evidence_id: evidenceId(sourceId, `ENTITY:${normalizeLabel(label)}`), raw_information: label,
        target_family: 'ENTITY', entity_id: asEntityId(normalizeLabel(label)), target_construct: asEntityId(normalizeLabel(label)),
        entityLabel: label, entityType: normalizeLabel(u.entityType ?? 'unknown'), relation: u.relation, strength: 'moderate' } as Evidence);
    } else {
      // §27.6 : conservé en connaissance ouverte, verbatim, jamais jeté.
      openKnowledge.push(createOpenKnowledge({
        about: input.about, ownerId: input.ownerId, open_knowledge_id: openKnowledgeId(sourceId, normalizeLabel(label)),
        type: 'descriptive', subject: asSubjectId(normalizeLabel(label)), subjectLabel: label, relation: u.relation_label ?? (u.family === 'ENTITY' && u.relation ? `${u.relation.toLowerCase()}, cible non établie` : 'évoqué'),
        context: 'GLOBAL', source: sourceId, timestamp: input.timestamp, confidence: 'low', assertionStatus: 'inferred',
        // Sensibilité jugée par le MODÈLE (zéro appel de plus) ; le lexique dans createOpenKnowledge est la 2e couche.
        ...(u.sensitive ? { sensitive: true } : {}),
      }));
    }
  }

  return { source, evidences, openKnowledge };
}
