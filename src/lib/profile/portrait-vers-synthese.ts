// LE RADAR, LES DIMENSIONS D'ATTENTION ET LES NIVEAUX « CE QUI MARCHE », DÉRIVÉS DU JOURNAL.
//
// CE QU'ILS ÉTAIENT. L'ossature de la page d'analyse se calculait depuis `my_profile` :
// `temperament_axes`, `lifestyle_axes`, `relational_filters`, `attention_reception` — la
// projection legacy, celle que `breath-tags.ts` interdit explicitement comme connaissance
// (§47bis / §47quater). Le journal, lui, portait les mêmes réponses sous forme canonique.
// Deux lecteurs de la même matière, donc deux vérités possibles sur le même écran.
//
// Ici, une seule : le portrait.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// R1 — UNKNOWN N'EST PAS LOW, et c'est la règle qui structure tout ce fichier.
//
// L'ancien calcul faisait tomber à 0 toute dimension qu'aucune donnée ne soutenait : un axe
// absent valait exactement « pas du tout ». Une absence devenait une affirmation, et la fiche
// pouvait dire « la surprise ne lui parle pas » d'une personne qui n'en avait jamais parlé.
//
// Chaque dimension vaut donc `null` quand RIEN dans le journal ne la fonde, et un nombre
// seulement quand quelque chose la fonde. La moyenne est pondérée sur les contributeurs
// PRÉSENTS, jamais sur la liste complète : une dimension appuyée sur une preuve au lieu de
// trois n'est pas « plus faible », elle est moins établie — et c'est `fondeSur` qui le dit.
// ─────────────────────────────────────────────────────────────────────────────────────
import type { Portrait } from '@/lib/knowledge/portrait';
import type { AffectionModality } from '@/lib/knowledge/vocabulary';

/** Sept dimensions, chacune `null` tant que le journal ne la fonde pas. */
export interface RadarJournal {
  readonly precision:  number | null;
  readonly emotion:    number | null;
  readonly surprise:   number | null;
  readonly esthetique: number | null;
  readonly utilite:    number | null;
  readonly temps:      number | null;
  readonly discretion: number | null;
  /** Nombre de preuves derrière chaque dimension. 0 = non déterminée, à ne jamais commenter. */
  readonly fondeSur: Readonly<Record<DimensionRadar, number>>;
}

export type DimensionRadar =
  | 'precision' | 'emotion' | 'surprise' | 'esthetique' | 'utilite' | 'temps' | 'discretion';

/* ────────────────────────────────────────────────────────────────────────────
 * Du signal au nombre. Jamais l'inverse : aucun nombre n'est inventé pour
 * combler un signal manquant.
 * ──────────────────────────────────────────────────────────────────────────── */

interface Mesure { readonly valeur: number; readonly preuves: number }

/** Force consolidée d'un signal, dans [0,1]. `null` si le journal ne dit rien. */
function force(s: { score: string; evidenceCount: number } | undefined): number | null {
  if (!s || s.evidenceCount === 0 || s.score === 'unknown') return null;
  if (s.score === 'high') return 1;
  if (s.score === 'medium') return 0.66;
  return 0.33; // low : établi, mais peu
}

/** Signal orienté (PROFILE) : la direction porte le SIGNE, la force porte l'ampleur.
 *  `mixed` vaut 0 — la personne a dit les deux, ce qui est une information, pas un vide. */
function oriente(s: { score: string; evidenceCount: number; direction?: string } | undefined): Mesure | null {
  const f = force(s);
  if (f === null || !s) return null;
  const signe = s.direction === 'negative' ? -1 : s.direction === 'mixed' ? 0 : 1;
  return { valeur: signe * f, preuves: s.evidenceCount };
}

/** Signal non orienté (AFFECTION, NEED, DRIVER, GUARDRAIL) : toujours positif. */
function simple(s: { score: string; evidenceCount: number } | undefined): Mesure | null {
  const f = force(s);
  if (f === null || !s) return null;
  return { valeur: f, preuves: s.evidenceCount };
}

/**
 * Moyenne pondérée des contributeurs PRÉSENTS, ramenée sur 0–100.
 *
 * Les absents ne comptent pas pour zéro : ils ne comptent pas du tout. Le poids sert à dire
 * qu'un contributeur pèse plus qu'un autre dans la dimension, pas à punir une absence.
 * Zéro contributeur → `null` : la dimension n'est pas déterminée, et l'écran doit se taire.
 */
function agrege(contributions: ReadonlyArray<readonly [Mesure | null, number]>): { v: number | null; n: number } {
  let somme = 0, poids = 0, preuves = 0;
  for (const [m, p] of contributions) {
    if (m === null) continue;
    somme += m.valeur * p;
    poids += Math.abs(p);  // un poids NÉGATIF oriente, il n'allège pas : c'est son AMPLEUR qui normalise
    preuves += m.preuves;
  }
  if (poids === 0) return { v: null, n: 0 };
  const centre = somme / poids;                    // ∈ [-1, 1]
  return { v: Math.round(Math.max(0, Math.min(100, 50 + centre * 50))), n: preuves };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Index d'accès au portrait, par code.
 * ──────────────────────────────────────────────────────────────────────────── */

type Indexable = { score: string; evidenceCount: number; direction?: string };

function indexer(p: Portrait) {
  const profil = new Map<string, Indexable>();
  let energieSociale: { position: number | null; evidenceCount: number } | null = null;
  for (const s of p.profile) {
    if ('position' in s) {
      energieSociale = { position: (s as { position: number | null }).position, evidenceCount: s.evidenceCount };
    } else {
      profil.set(String((s as { construct: string }).construct), s as unknown as Indexable);
    }
  }
  const besoin = new Map(p.needs.map((s) => [String(s.construct), s as unknown as Indexable]));
  const moteur = new Map(p.drivers.map((s) => [String(s.construct), s as unknown as Indexable]));
  // Un garde-fou est consolidé par (code, contexte) : plusieurs contextes, plusieurs signaux.
  // On garde le plus établi, et on cumule les preuves — un refus répété dans deux contextes
  // est mieux établi qu'un refus unique, jamais moins.
  const garde = new Map<string, Indexable>();
  for (const s of p.guardrails) {
    const k = String(s.code);
    const d = garde.get(k);
    if (!d) { garde.set(k, s as unknown as Indexable); continue; }
    const plusFort = (force(s as unknown as Indexable) ?? 0) >= (force(d) ?? 0) ? s.score : d.score;
    garde.set(k, { score: plusFort, evidenceCount: d.evidenceCount + s.evidenceCount });
  }
  const recoit = (m: AffectionModality) => p.affection.receive[m] as unknown as Indexable | undefined;
  const donne  = (m: AffectionModality) => p.affection.give[m] as unknown as Indexable | undefined;
  return { profil, energieSociale, besoin, moteur, garde, recoit, donne };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Le radar.
 *
 * Chaque dimension reprend la LECTURE de l'ancienne formule — ce qu'elle cherchait à
 * dire — en la rebranchant sur les constructs du journal, qui portent la même matière
 * sous forme canonique. Les poids disent l'importance relative d'un contributeur dans
 * la dimension ; ils ne remplacent jamais une absence.
 * ──────────────────────────────────────────────────────────────────────────── */

export function radarDuPortrait(p: Portrait): RadarJournal {
  const { profil, energieSociale, besoin, moteur, garde, recoit } = indexer(p);
  const P = (c: string) => oriente(profil.get(c));
  const B = (c: string) => simple(besoin.get(c));
  const D = (c: string) => simple(moteur.get(c));
  const R = (m: AffectionModality) => simple(recoit(m));
  /** Un garde-fou REFUSE : il tire la dimension vers le bas. D'où le signe négatif. */
  const G = (c: string): Mesure | null => {
    const m = simple(garde.get(c));
    return m === null ? null : { valeur: -m.valeur, preuves: m.preuves };
  };
  /** SOCIAL_ENERGY : continuum 0..4, 0 = a besoin de seul. Centré en 2, jamais recentré ailleurs. */
  const energie = (): Mesure | null =>
    energieSociale && energieSociale.position !== null && energieSociale.evidenceCount > 0
      ? { valeur: (energieSociale.position - 2) / 2, preuves: energieSociale.evidenceCount }
      : null;

  const precision = agrege([
    [P('PROFILE_EXACTINGNESS'), 3], [P('PROFILE_SENSITIVITY'), 2],
    [R('PERSONALIZED_GIFT'), 3], [R('MICRO_ATTENTIONS'), 2], [D('DRV_PERSONALIZATION'), 2],
  ]);
  const emotion = agrege([
    [R('SYMBOLIC_GIFT'), 3], [R('WORDS'), 3], [P('PROFILE_INTENSITY'), 2],
    [B('NEED_CONNECTION'), 2], [D('DRV_ATTENTIVENESS'), 2], [D('DRV_SYMBOLISM'), 2],
  ]);
  const surprise = agrege([
    [R('SURPRISE'), 3], [D('DRV_SURPRISE'), 2], [P('PROFILE_ADAPTABILITY'), 2],
    [P('PROFILE_STRUCTURE'), -2],  // structurée = moins ouverte à l'inattendu : poids NÉGATIF assumé
    [G('GRD_SCHEDULE_DISRUPTION'), 3], [G('GRD_LAST_MINUTE'), 2],
    [G('GRD_LOSS_OF_CONTROL'), 2], [G('GRD_PUBLIC_EXPOSURE'), 2],
  ]);
  const esthetique = agrege([
    [P('IMPORTANCE_AESTHETIC'), 3], [P('APPETENCE_PREMIUM'), 2],
    [D('DRV_AESTHETIC'), 2], [D('DRV_QUALITY'), 2], [R('PERSONALIZED_GIFT'), 1],
  ]);
  const utilite = agrege([
    [P('IMPORTANCE_FUNCTIONAL'), 3], [R('SERVICES'), 3], [R('MICRO_ATTENTIONS'), 1],
    [D('DRV_UTILITY'), 2], [D('DRV_RELIEF'), 1],
  ]);
  const temps = agrege([
    [R('QUALITY_TIME'), 3], [P('APPETENCE_EXPERIENCE'), 3],
    [D('DRV_SHARED_EXPERIENCE'), 2], [P('APPETENCE_OBJECT'), -1],
  ]);
  // Plus l'énergie sociale va vers « a besoin de seul », plus la discrétion monte : on INVERSE
  // le continuum une fois, ici, nommément — plutôt que de le faire dans un poids négatif où
  // personne ne verrait le sens.
  const e = energie();
  const besoinDeSeul: Mesure | null = e === null ? null : { valeur: -e.valeur, preuves: e.preuves };

  const discretion = agrege([
    [P('PROFILE_AUTONOMY'), 2], [P('PROFILE_RELATIONALITY'), -2], [besoinDeSeul, 2],
    [G('GRD_PUBLIC_EXPOSURE'), -3],      // le garde-fou POUSSE la discrétion : double négation assumée
    [G('GRD_TOO_MANY_PEOPLE'), -2], [G('GRD_FORCED_SOCIALIZATION'), -2],
  ]);

  return {
    precision: precision.v, emotion: emotion.v, surprise: surprise.v,
    esthetique: esthetique.v, utilite: utilite.v, temps: temps.v, discretion: discretion.v,
    fondeSur: {
      precision: precision.n, emotion: emotion.n, surprise: surprise.n,
      esthetique: esthetique.n, utilite: utilite.n, temps: temps.n, discretion: discretion.n,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Les dimensions d'attention, lues dans le journal.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface AttentionJournal {
  /** Modalités REÇUES les mieux établies, les plus fortes d'abord. Jamais déduites du donné (R5). */
  readonly recues: readonly AffectionModality[];
  /** Modalités DONNÉES les mieux établies. Jamais déduites du reçu (R5). */
  readonly donnees: readonly AffectionModality[];
  /** La 1ʳᵉ modalité reçue n'est pas parmi celles qu'elle donne. `null` si l'un des deux manque. */
  readonly contraste: boolean | null;
}

function classer(vec: (m: AffectionModality) => Indexable | undefined, modalites: readonly AffectionModality[]) {
  return modalites
    .map((m) => ({ m, f: force(vec(m)) }))
    .filter((x): x is { m: AffectionModality; f: number } => x.f !== null)
    .sort((a, b) => b.f - a.f)
    .map((x) => x.m);
}

export function attentionDuPortrait(p: Portrait): AttentionJournal {
  const { recoit, donne } = indexer(p);
  const modalites = Object.keys(p.affection.receive) as AffectionModality[];
  const recues = classer(recoit, modalites);
  const donnees = classer(donne, modalites);
  // Sans l'un des deux côtés, il n'y a PAS de contraste : il y a une question sans réponse.
  // Dire « non » reviendrait à affirmer une congruence qu'on n'a pas constatée.
  const contraste = recues.length === 0 || donnees.length === 0 ? null : !donnees.includes(recues[0]);
  return { recues, donnees, contraste };
}

/* ────────────────────────────────────────────────────────────────────────────
 * « Ce qui marche » — mêmes clés et mêmes niveaux qu'avant, autre source.
 * ──────────────────────────────────────────────────────────────────────────── */

export type CleCeQuiMarche = 'beau' | 'personnel' | 'experientiel' | 'utile' | 'premium';
export type NiveauCeQuiMarche = 'fort' | 'moyen' | 'faible';

/** `null` pour une clé que rien ne fonde : une case vide se tait, elle ne dit pas « faible ». */
export function ceQuiMarcheDuPortrait(p: Portrait): Record<CleCeQuiMarche, NiveauCeQuiMarche | null> {
  const r = radarDuPortrait(p);
  const { profil } = indexer(p);
  const niveau = (v: number | null): NiveauCeQuiMarche | null =>
    v === null ? null : v >= 66 ? 'fort' : v >= 40 ? 'moyen' : 'faible';
  const premium = oriente(profil.get('APPETENCE_PREMIUM'));
  return {
    beau:         niveau(r.esthetique),
    personnel:    niveau(r.precision),
    experientiel: niveau(r.temps),
    utile:        niveau(r.utilite),
    premium:      premium === null ? null : niveau(Math.round(50 + premium.valeur * 50)),
  };
}
