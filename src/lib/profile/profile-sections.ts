// GÉNÉRATION PAR SECTION — CŒUR DÉTERMINISTE (hsg §48octies, §7a bis, §7e bis).
// Deux pièces, pures et testables, qui portent les règles dures :
//   selectSectionInputs — LE MODÈLE N'ÉLIT RIEN : la matière de chaque section est choisie et ORDONNÉE
//     ici (force puis rang), avec sa confiance. Le modèle reçoit cette sélection figée et l'écrit.
//   verifySection — 7a DEVENUE MÉCANIQUE : double contrôle OMISSION (treated ⊇ entrée) et INVENTION
//     (treated ⊆ entrée), plus la faute de forme (vide-avec-matière / tronqué). Aucune limite de longueur.
// L'orchestration (2 appels modèle, relance par section, stockage profile_analysis_sections) consomme ces
// deux pièces — elle ne décide RIEN par elle-même.

import type { AttentionBreathTag, SocleFact } from '../questionnaire/breath-tags';

export type SectionTier = 'detail' | 'synthesis';

type SourceSelector =
  | { readonly kind: 'family'; readonly family: string; readonly direction?: string }
  | { readonly kind: 'construct'; readonly constructs: readonly string[] }
  | { readonly kind: 'fact'; readonly factTypes: readonly string[] };

export interface SectionSpec {
  readonly key: string;
  readonly tier: SectionTier;
  readonly sources?: readonly SourceSelector[]; // détail : d'où vient sa matière
  readonly dependsOn?: readonly string[];        // synthèse : clés de détail reçues
  readonly freeTextOnly?: boolean;               // vide tant que l'extraction n'existe pas (signalé, jamais masqué)
}

// Mapping tag/fact → section (le « calculé » de 7a bis). À RELIRE par Estelle (classement maquette).
export const SECTION_SPECS: readonly SectionSpec[] = [
  // ── DÉTAIL ──
  { key: 'attention_insights', tier: 'detail', sources: [{ kind: 'family', family: 'AFFECTION_LANGUAGE' }] },
  { key: 'deep_touch',   tier: 'detail', sources: [{ kind: 'family', family: 'AFFECTION_LANGUAGE', direction: 'receive' }] },
  { key: 'deep_loved',   tier: 'detail', sources: [{ kind: 'family', family: 'NEED' }] },
  { key: 'deep_pleasure',tier: 'detail', sources: [{ kind: 'family', family: 'PREFERENCE' }, { kind: 'construct', constructs: ['APPETENCE_EXPERIENCE', 'APPETENCE_OBJECT', 'APPETENCE_PREMIUM'] }] },
  { key: 'deep_miss',    tier: 'detail', sources: [{ kind: 'family', family: 'GUARDRAIL' }] },
  { key: 'works',        tier: 'detail', sources: [{ kind: 'family', family: 'AFFECTION_LANGUAGE' }] }, // phrase par ligne (les barres sont calculées ailleurs)
  { key: 'territoire',   tier: 'detail', sources: [{ kind: 'construct', constructs: ['APPETENCE_EXPERIENCE', 'IMPORTANCE_FUNCTIONAL', 'IMPORTANCE_AUTHENTICITY', 'APPETENCE_PREMIUM'] }] },
  { key: 'monde_passions', tier: 'detail', sources: [{ kind: 'fact', factTypes: ['singularity.adore_faire', 'singularity.sujets_stimulants'] }] },
  { key: 'monde_gouts',  tier: 'detail', sources: [{ kind: 'construct', constructs: ['IMPORTANCE_AESTHETIC', 'IMPORTANCE_AUTHENTICITY'] }] },
  { key: 'univers_matieres', tier: 'detail', sources: [{ kind: 'construct', constructs: ['IMPORTANCE_AESTHETIC', 'IMPORTANCE_AUTHENTICITY'] }] },
  { key: 'univers_marques',  tier: 'detail', sources: [{ kind: 'fact', factTypes: ['singularity.marques_lieux'] }] },
  { key: 'univers_reves',    tier: 'detail', sources: [{ kind: 'fact', factTypes: ['singularity.envies_reves'] }] },
  // texte libre — vides et signalées tant que l'extraction n'existe pas :
  { key: 'monde_tables',  tier: 'detail', freeTextOnly: true },
  { key: 'monde_voyages', tier: 'detail', freeTextOnly: true },
  // ── SYNTHÈSE (reçoivent les détails, jamais d'autres synthèses) ──
  { key: 'resume',     tier: 'synthesis', dependsOn: ['deep_touch', 'deep_loved', 'deep_pleasure', 'deep_miss', 'attention_insights', 'territoire', 'monde_passions', 'monde_gouts', 'univers_matieres', 'univers_marques', 'univers_reves'] },
  { key: 'analyse',    tier: 'synthesis', dependsOn: ['deep_touch', 'deep_loved', 'deep_pleasure', 'deep_miss', 'attention_insights', 'territoire', 'monde_passions', 'monde_gouts', 'univers_matieres', 'univers_marques', 'univers_reves'] },
  { key: 'understood', tier: 'synthesis', dependsOn: ['deep_touch', 'deep_loved', 'deep_pleasure', 'deep_miss'] },
];

/** Un élément de matière fourni au modèle : sa clé de provenance (pour le double contrôle), son contenu, sa confiance. */
export interface MatterItem { readonly key: string; readonly content: string; readonly confidence: string | null; }
export interface SectionInput { readonly key: string; readonly tier: SectionTier; readonly items: readonly MatterItem[]; readonly freeTextOnly: boolean; }

const STRENGTH_RANK: Record<string, number> = { strong: 3, moderate: 2, weak: 1 };

/** Ordre DÉTERMINISTE : force décroissante puis rang croissant. C'est l'ordre que le modèle reçoit et garde. */
function orderItems(items: MatterItem[], meta: Map<string, { strength: string | null; rank: number | null }>): MatterItem[] {
  return [...items].sort((a, b) => {
    const ma = meta.get(a.key) ?? { strength: null, rank: null };
    const mb = meta.get(b.key) ?? { strength: null, rank: null };
    const s = (STRENGTH_RANK[mb.strength ?? ''] ?? 0) - (STRENGTH_RANK[ma.strength ?? ''] ?? 0);
    if (s !== 0) return s;
    return (ma.rank ?? 99) - (mb.rank ?? 99);
  });
}

/**
 * LE MODÈLE N'ÉLIT RIEN : sélectionne et ordonne la matière de chaque section de DÉTAIL depuis le journal
 * (tags + facts restituables), avec la confiance. Renvoie une entrée par section de détail (les synthèses
 * reçoivent ensuite les textes de détail, pas des tags).
 */
export function selectSectionInputs(tags: readonly AttentionBreathTag[], facts: readonly SocleFact[]): SectionInput[] {
  const meta = new Map<string, { strength: string | null; rank: number | null }>();
  for (const t of tags) meta.set(t.construct, { strength: t.strength, rank: t.rank });

  const matchTag = (sel: Extract<SourceSelector, { kind: 'family' } | { kind: 'construct' }>, t: AttentionBreathTag) =>
    sel.kind === 'family' ? (t.family === sel.family && (!sel.direction || t.direction === sel.direction)) : sel.constructs.includes(t.construct);

  const out: SectionInput[] = [];
  for (const spec of SECTION_SPECS) {
    if (spec.tier !== 'detail') continue;
    if (spec.freeTextOnly) { out.push({ key: spec.key, tier: 'detail', items: [], freeTextOnly: true }); continue; }
    const items: MatterItem[] = [];
    const seen = new Set<string>();
    for (const sel of spec.sources ?? []) {
      if (sel.kind === 'fact') {
        for (const f of facts) if (sel.factTypes.includes(f.factType) && !seen.has(f.factType)) { items.push({ key: f.factType, content: f.value, confidence: null }); seen.add(f.factType); }
      } else {
        for (const t of tags) if (matchTag(sel, t) && !seen.has(t.construct)) { items.push({ key: t.construct, content: t.construct, confidence: t.confidence }); seen.add(t.construct); }
      }
    }
    out.push({ key: spec.key, tier: 'detail', items: orderItems(items, meta), freeTextOnly: false });
  }
  return out;
}

export interface SectionVerdict { readonly ok: boolean; readonly omission: readonly string[]; readonly invention: readonly string[]; readonly formFault: 'empty_with_matter' | 'truncated' | null; }

/** 7a MÉCANIQUE + forme. `treated` = clés que le modèle déclare avoir traitées (sortie structurée). */
export function verifySection(inputKeys: readonly string[], treated: readonly string[], text: string): SectionVerdict {
  const inSet = new Set(inputKeys);
  const trSet = new Set(treated);
  const omission = inputKeys.filter((k) => !trSet.has(k));   // treated ⊇ entrée
  const invention = treated.filter((k) => !inSet.has(k));    // treated ⊆ entrée
  const trimmed = text.trim();
  let formFault: SectionVerdict['formFault'] = null;
  if (inputKeys.length > 0 && trimmed.length === 0) formFault = 'empty_with_matter';
  else if (trimmed.length > 0 && !/[.!?…"»)\]]$/.test(trimmed)) formFault = 'truncated'; // finit en plein milieu
  return { ok: omission.length === 0 && invention.length === 0 && formFault === null, omission, invention, formFault };
}
