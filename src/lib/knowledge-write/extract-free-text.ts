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
import { createSourceRecord } from '../knowledge/sources';
import { createOpenKnowledge } from '../knowledge/open-knowledge';
import { asSubjectId, asEntityId, type AboutRef, type UserId } from '../knowledge/identity';
import { normalizeLabel } from '../knowledge/normalize';
import { persistKnowledge, type WriteClient } from './persist';
import { evidenceId, openKnowledgeId } from './ids';
import { JOURNAL_VERSION_STAMP } from '../knowledge/version';
import type { Evidence, OpenKnowledge, EntityRelation } from '../knowledge';

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
            family: { type: 'string', enum: ['INTEREST', 'ENTITY', 'OTHER'] },
            label: { type: 'string', description: 'formulation PRÉCISE, verbatim, jamais généralisée' },
            parentDomain: { type: 'string', description: 'INTEREST : domaine parent (ex. photography, music, food_gastronomy)' },
            relationship: { type: 'string', enum: ['passion', 'appreciation', 'curiosity', 'aversion'], description: 'INTEREST : rapport au sujet (laisse vide si non évident)' },
            entityType: { type: 'string', enum: ['brand', 'place', 'restaurant', 'hotel', 'product', 'food', 'drink', 'book', 'film_series', 'music', 'artist', 'destination', 'event', 'person'], description: 'ENTITY : sous-type exact' },
            relation: { type: 'string', enum: ['LOVE', 'LIKE', 'CURIOUS', 'WANT_TO_TRY', 'WANT_TO_OWN', 'WANT_TO_VISIT', 'NEUTRAL', 'DISLIKE', 'AVOID'], description: 'ENTITY : relation à la chose (DISLIKE/AVOID pour un rejet)' },
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

interface Unit { family: 'INTEREST' | 'ENTITY' | 'OTHER'; label: string; parentDomain?: string; relationship?: string; entityType?: string; relation?: EntityRelation; relation_label?: string; sensitive?: boolean; }

export interface ExtractResult { readonly evidences: readonly Evidence[]; readonly openKnowledge: readonly OpenKnowledge[] }
export interface ExtractBuild extends ExtractResult { readonly source: ReturnType<typeof createSourceRecord> | null }

/**
 * Extrait une réponse libre et PERSISTE le résultat (source niveau 5 + evidences canoniques + OpenKnowledge).
 * Le FACT verbatim (étape 3) est écrit séparément (A3). persistKnowledge exige la migration 93 (CHECK source_type).
 */
export async function extractFreeText(
  client: WriteClient,
  input: { about: AboutRef; ownerId: UserId; rawText: string; fieldContext: string; timestamp: string },
): Promise<ExtractResult> {
  const built = await buildFromFreeText(input);
  if (built.source) await persistKnowledge(client, { source: built.source, evidences: [...built.evidences], facts: [], openKnowledge: [...built.openKnowledge] });
  return { evidences: built.evidences, openKnowledge: built.openKnowledge };
}

/**
 * Appel modèle + construction des deux sorties, SANS persistance (testable/prouvable sans base).
 * §27 étapes 1-2-4-5-6. Renvoie aussi la source (null si rien à extraire).
 */
export async function buildFromFreeText(
  input: { about: AboutRef; ownerId: UserId; rawText: string; fieldContext: string; timestamp: string },
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
  } catch { return { source: null, evidences: [], openKnowledge: [] }; } // échec modèle → zéro, jamais d'invention

  const sourceId = globalThis.crypto.randomUUID();
  const source = createSourceRecord({
    about: input.about, ownerId: input.ownerId, id: sourceId,
    sourceType: 'extraction_inferred', questionText: input.fieldContext, rawText: text, timestamp: input.timestamp,
  });
  const common = {
    about: input.about, ownerId: input.ownerId, source_id: sourceId, source_type: 'extraction_inferred' as const,
    confidence: 'low' as const, context: 'GLOBAL', timestamp: input.timestamp, stability: 'contextual' as const,
    evidence_role: 'primary' as const, assertionBasis: 'self_report' as const, assertionStatus: 'inferred' as const,
    version: JOURNAL_VERSION_STAMP,
  };

  const evidences: Evidence[] = [];
  const openKnowledge: OpenKnowledge[] = [];
  for (const u of units) {
    const label = u.label.trim();
    if (u.family === 'INTEREST') {
      evidences.push({ ...common, evidence_id: evidenceId(sourceId, `INTEREST:${normalizeLabel(label)}`), raw_information: label,
        target_family: 'INTEREST', subject: asSubjectId(normalizeLabel(label)), target_construct: asSubjectId(normalizeLabel(label)),
        subjectLabel: label, ...(u.parentDomain ? { parent_domain: normalizeLabel(u.parentDomain) } : {}),
        ...(u.relationship ? { relationship: normalizeLabel(u.relationship) } : {}), strength: 'moderate' } as Evidence);
    } else if (u.family === 'ENTITY') {
      evidences.push({ ...common, evidence_id: evidenceId(sourceId, `ENTITY:${normalizeLabel(label)}`), raw_information: label,
        target_family: 'ENTITY', entity_id: asEntityId(normalizeLabel(label)), target_construct: asEntityId(normalizeLabel(label)),
        entityLabel: label, entityType: normalizeLabel(u.entityType ?? 'unknown'), relation: (u.relation ?? 'LOVE'), strength: 'moderate' } as Evidence);
    } else {
      // §27.6 : conservé en connaissance ouverte, verbatim, jamais jeté.
      openKnowledge.push(createOpenKnowledge({
        about: input.about, ownerId: input.ownerId, open_knowledge_id: openKnowledgeId(sourceId, normalizeLabel(label)),
        type: 'descriptive', subject: asSubjectId(normalizeLabel(label)), subjectLabel: label, relation: u.relation_label ?? 'évoqué',
        context: 'GLOBAL', source: sourceId, timestamp: input.timestamp, confidence: 'low', assertionStatus: 'inferred',
        // Sensibilité jugée par le MODÈLE (zéro appel de plus) ; le lexique dans createOpenKnowledge est la 2e couche.
        ...(u.sensitive ? { sensitive: true } : {}),
      }));
    }
  }

  return { source, evidences, openKnowledge };
}
