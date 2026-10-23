// UN REJET DÉCLARÉ EST MÉCANIQUEMENT EXCLUANT (hsg §48bis / règle rejet) — quelle que soit la FAMILLE qui
// le porte : un GUARDRAIL (avoid) OU une ENTITY dont la relation est DISLIKE/AVOID. Prédicat PUR que le
// moteur de reco consommera (il lit aujourd'hui l'ancienne projection ; le brancher sur le journal =
// étape « reco minimum »). Severity SOFT par défaut — un rejet n'est jamais une interdiction absolue ;
// HARD seulement pour une allergie ou un rejet déclaré comme tel.

export interface JournalRejection {
  readonly label: string;                 // ex. « fleurs coupées »
  readonly family: 'GUARDRAIL' | 'ENTITY';
  readonly relation?: string;             // ENTITY : DISLIKE | AVOID (sinon ce n'est pas un rejet)
  readonly severity: 'SOFT' | 'HARD';
}

const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'à', 'au', "d'", 'en']);
const terms = (s: string): string[] =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Garde les rejets réels : GUARDRAIL, ou ENTITY en relation DISLIKE/AVOID. */
export function isRejection(r: { family: string; relation?: string }): boolean {
  return r.family === 'GUARDRAIL' || (r.family === 'ENTITY' && (r.relation === 'DISLIKE' || r.relation === 'AVOID'));
}

/**
 * Un candidat (idée de cadeau/attention) est-il écarté par un rejet déclaré ? Recoupement de termes
 * significatifs (« fleurs coupées » écarte « un bouquet de fleurs »). Renvoie le rejet qui exclut, ou null.
 */
export function candidateRejectedBy(candidateLabel: string, rejections: readonly JournalRejection[]): JournalRejection | null {
  const cand = new Set(terms(candidateLabel));
  for (const r of rejections) {
    if (!isRejection(r)) continue;
    const rt = terms(r.label);
    if (rt.length > 0 && rt.some((t) => cand.has(t))) return r; // un terme-clé du rejet dans le candidat → exclu
  }
  return null;
}
