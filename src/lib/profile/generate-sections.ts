// ORCHESTRATION DE LA GÉNÉRATION PAR SECTION (ligne 4 du chantier) — consomme le cœur déterministe
// (profile-sections.ts : selectSectionInputs / verifySection) et y ajoute :
//   • la TRAÇABILITÉ À L'AFFIRMATION (§30.2 bis) : chaque affirmation du modèle cite les CLÉS de matière
//     qu'elle a traitées → on résout ces clés en sourceIds (knowledge_sources.id) ; l'affirmation porte le
//     SOUS-ENSEMBLE EXACT des sources qui la soutiennent ;
//   • la RÈGLE D'ENSEMBLE VIDE (condition Estelle) : une affirmation dont la résolution rend ZÉRO source
//     (clé fantôme, ou clé sans source) est RETIRÉE — jamais publiée telle quelle — et c'est BRUYANT dans
//     les logs (le modèle qui cite des constructs fantômes doit se voir, pas se découvrir sur la fiche) ;
//   • l'UNION EXACTE : source_evidence_ids de la section = union des evidence_ids de ses affirmations
//     survivantes (ce que la CHECK de la migration 97 vérifie en base) ;
//   • la frontière MODÈLE injectable (SectionModelCaller) → cette logique est pure et testable sans réseau.
//
// Le modèle N'ÉLIT RIEN : il reçoit la matière déjà sélectionnée+ordonnée, il rédige et déclare ce qu'il a
// traité. verifySection (7a mécanique) reste le juge d'omission/invention/forme.

import type { AttentionBreathTag, SocleFact } from '../questionnaire/breath-tags';
import {
  SECTION_SPECS, selectSectionInputs, verifySection,
  type SectionInput, type SectionTier, type SectionVerdict, type MatterItem,
} from './profile-sections';

/** Affirmation telle que le MODÈLE la rend (sortie structurée) : ce qu'elle dit + les clés qu'elle a traitées. */
export interface ModelAffirmation {
  readonly id: string;
  readonly type: 'declaration' | 'tendance' | 'hypothese' | 'implication';
  readonly text: string;
  readonly treatedKeys: readonly string[];
}

/** Affirmation RÉSOLUE et stockable : son sous-ensemble exact de sources (knowledge_sources.id). */
export interface ResolvedAffirmation {
  readonly id: string;
  readonly type: ModelAffirmation['type'];
  readonly text: string;
  readonly evidence_ids: readonly string[]; // clé JSONB attendue par la CHECK (migration 97) ; unité = source_id
}

export interface GeneratedSection {
  readonly key: string;
  readonly tier: SectionTier;
  readonly text: string;
  readonly affirmations: readonly ResolvedAffirmation[];
  readonly sourceEvidenceIds: readonly string[]; // union exacte des evidence_ids des affirmations
  readonly dependsOnSections?: readonly string[];
  readonly verdict: SectionVerdict;
}

/** La frontière modèle : reçoit la matière d'UNE section, rend des affirmations brutes. Injectable. */
export interface SectionModelCaller {
  (req: {
    readonly sectionKey: string;
    readonly tier: SectionTier;
    readonly matter: readonly { readonly key: string; readonly content: string; readonly confidence: string | null }[];
    readonly dependencies?: readonly { readonly sectionKey: string; readonly text: string }[];
  }): Promise<readonly ModelAffirmation[]>;
}

export interface GenLogger { warn(msg: string): void; }
const defaultLogger: GenLogger = { warn: (m) => console.warn(m) };

/**
 * CONTRÔLE DE PROPORTIONNALITÉ (§30.2.6 + décision Estelle 5 nov) : une section ne publie JAMAIS plus
 * d'affirmations qu'elle n'a d'EVIDENCES DISTINCTES. Au-delà, des affirmations sont des inférences habillées
 * en observations (« plusieurs reformulations d'une même réponse ne comptent pas comme preuves indépendantes »).
 * Mécaniquement vérifiable, comme l'union exacte. Pur et testable.
 */
export function proportionalityViolation(affirmationCount: number, distinctEvidenceCount: number): boolean {
  return affirmationCount > distinctEvidenceCount;
}

/** Dédoublonne en conservant l'ordre de première apparition (l'ordre n'importe pas pour la CHECK, qui trie). */
function uniq(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) if (id && !seen.has(id)) { seen.add(id); out.push(id); }
  return out;
}

/**
 * Résout les affirmations brutes du modèle contre la matière réellement fournie :
 *   affirmation.treatedKeys → union des sourceIds des MatterItem correspondants.
 * RÈGLE D'ENSEMBLE VIDE : une affirmation sans aucune source survivante est RETIRÉE + log bruyant.
 * Les clés fantômes (citées mais absentes de la matière) sont nommées dans le log (le modèle a inventé).
 */
export function resolveAffirmations(
  sectionKey: string,
  matter: readonly MatterItem[],
  raw: readonly ModelAffirmation[],
  logger: GenLogger = defaultLogger,
): { readonly affirmations: ResolvedAffirmation[]; readonly sourceEvidenceIds: string[] } {
  const byKey = new Map(matter.map((m) => [m.key, m]));
  const kept: ResolvedAffirmation[] = [];
  for (const a of raw) {
    const phantom = a.treatedKeys.filter((k) => !byKey.has(k));
    if (phantom.length) {
      logger.warn(`[generate-sections] section "${sectionKey}" : affirmation "${a.id}" cite des constructs FANTÔMES (absents de la matière) : ${phantom.join(', ')}`);
    }
    const evidenceIds = uniq(a.treatedKeys.flatMap((k) => byKey.get(k)?.sourceIds ?? []));
    if (evidenceIds.length === 0) {
      // Ensemble vide : « pourquoi dis-tu ça ? » n'aurait pas de réponse → jamais publiée telle quelle.
      logger.warn(`[generate-sections] section "${sectionKey}" : affirmation "${a.id}" RETIRÉE — zéro source (clés: ${a.treatedKeys.join(', ') || '∅'}). Jamais publiée sans justification.`);
      continue;
    }
    kept.push({ id: a.id, type: a.type, text: a.text, evidence_ids: evidenceIds });
  }
  const sourceEvidenceIds = uniq(kept.flatMap((a) => a.evidence_ids));
  // Détecteur BRUYANT, NON mutant ici : la stratégie de réduction (relance plafonnée / fusion / retrait des
  // moins soutenues) est une décision produit — tant qu'elle n'est pas arrêtée, on SIGNALE sans trancher.
  if (proportionalityViolation(kept.length, sourceEvidenceIds.length)) {
    logger.warn(`[generate-sections] section "${sectionKey}" : PROPORTIONNALITÉ VIOLÉE (§30.2) — ${kept.length} affirmations pour ${sourceEvidenceIds.length} evidence(s) distincte(s) ; ${kept.length - sourceEvidenceIds.length} affirmation(s) sans preuve propre.`);
  }
  return { affirmations: kept, sourceEvidenceIds };
}

/** Assemble le texte d'une section à partir de ses affirmations survivantes (ordre du modèle, conservé). */
export function assembleText(affirmations: readonly ResolvedAffirmation[]): string {
  return affirmations.map((a) => a.text.trim()).filter(Boolean).join(' ');
}

/**
 * Génère UNE section de détail : appelle le modèle (≤1 relance si le verdict mécanique échoue), résout les
 * affirmations, assemble, vérifie. `matterKeys` = clés fournies (pour verifySection). Le modèle n'élit rien.
 */
export async function generateDetailSection(
  input: SectionInput,
  call: SectionModelCaller,
  logger: GenLogger = defaultLogger,
): Promise<GeneratedSection> {
  const matterForModel = input.items.map((m) => ({ key: m.key, content: m.content, confidence: m.confidence }));
  const inputKeys = input.items.map((m) => m.key);

  const once = async (): Promise<GeneratedSection> => {
    const raw = await call({ sectionKey: input.key, tier: 'detail', matter: matterForModel });
    const { affirmations, sourceEvidenceIds } = resolveAffirmations(input.key, input.items, raw, logger);
    const text = assembleText(affirmations);
    const treated = uniq(affirmations.flatMap((a) => raw.find((r) => r.id === a.id)?.treatedKeys ?? []))
      .filter((k) => inputKeys.includes(k)); // treated ∩ entrée (les fantômes ne comptent pas comme traités)
    const verdict = verifySection(inputKeys, treated, text);
    return { key: input.key, tier: 'detail', text, affirmations, sourceEvidenceIds, verdict };
  };

  let section = await once();
  if (!section.verdict.ok && inputKeys.length > 0) section = await once(); // une relance par section
  return section;
}

/**
 * Génère TOUTES les sections d'un périmètre : les DÉTAILS d'abord, puis les SYNTHÈSES (qui reçoivent les
 * textes de détail dont elles dépendent, et héritent de l'UNION de leurs sources). Les sections freeTextOnly
 * restent vides (signalées, jamais masquées) tant que l'extraction n'existe pas.
 */
export async function generateAllSections(
  tags: readonly AttentionBreathTag[],
  facts: readonly SocleFact[],
  call: SectionModelCaller,
  logger: GenLogger = defaultLogger,
): Promise<GeneratedSection[]> {
  const inputs = selectSectionInputs(tags, facts);
  const byKey = new Map(inputs.map((i) => [i.key, i]));
  const out: GeneratedSection[] = [];

  // ── DÉTAILS ──
  for (const input of inputs) {
    if (input.freeTextOnly) {
      out.push({ key: input.key, tier: 'detail', text: '', affirmations: [], sourceEvidenceIds: [], verdict: { ok: true, omission: [], invention: [], formFault: null } });
      continue;
    }
    out.push(await generateDetailSection(input, call, logger));
  }
  const detailByKey = new Map(out.map((s) => [s.key, s]));

  // ── SYNTHÈSES ── (reçoivent les textes de détail ; clés traitées = clés de section ; sources = union)
  for (const spec of SECTION_SPECS) {
    if (spec.tier !== 'synthesis') continue;
    const deps = (spec.dependsOn ?? []).map((k) => detailByKey.get(k)).filter((s): s is GeneratedSection => !!s);
    const depMatter: MatterItem[] = deps.map((d) => ({ key: d.key, content: d.text, confidence: null, sourceIds: d.sourceEvidenceIds }));
    const raw = await call({
      sectionKey: spec.key, tier: 'synthesis',
      matter: depMatter.map((m) => ({ key: m.key, content: m.content, confidence: m.confidence })),
      dependencies: deps.map((d) => ({ sectionKey: d.key, text: d.text })),
    });
    const { affirmations, sourceEvidenceIds } = resolveAffirmations(spec.key, depMatter, raw, logger);
    const text = assembleText(affirmations);
    const inputKeys = depMatter.map((m) => m.key);
    const treated = uniq(affirmations.flatMap((a) => raw.find((r) => r.id === a.id)?.treatedKeys ?? [])).filter((k) => inputKeys.includes(k));
    const verdict = verifySection(inputKeys, treated, text);
    out.push({ key: spec.key, tier: 'synthesis', text, affirmations, sourceEvidenceIds, dependsOnSections: spec.dependsOn, verdict });
  }
  return out;
}
