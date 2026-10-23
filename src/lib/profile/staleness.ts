// PÉREMPTION PAR REQUÊTE (hsg §48septies) — fonctions PURES, pas de drapeau stocké (un dérivé stocké
// finit par mentir). Un texte (analyse profil ou fiche proche) porte `source_evidence_ids` + `generated_at`.
// On en déduit, À L'AFFICHAGE, deux choses DISTINCTES (ne jamais les confondre) :
//
//   needsRegeneration — le texte est hors d'âge et doit être RÉÉCRIT : une connaissance du sujet est
//     postérieure (passé/correction = fates a/b), ou une source a disparu / n'est plus autorisée (fate c).
//
//   mustNotDisplay — SÉCURITÉ non négociable (fate c) : une source a été SUPPRIMÉE ou N'EST PLUS AUTORISÉE
//     → le texte peut porter une donnée qu'on a demandé d'effacer, il ne s'affiche PLUS, même avant réécriture.
//     Pendant l'intervalle, les éléments CALCULÉS (barres/niveaux/tags, lus en direct) tiennent la fiche.
//
// (Les fates a « passé » et b « corrigé » déclenchent une réécriture paresseuse à l'ouverture ; elles ne
//  relèvent pas de la sécurité. a part en section HISTORIQUE à la réécriture ; b est remplacé, pas archivé.)

export interface StoredText {
  readonly sourceEvidenceIds: readonly string[];
  readonly generatedAt: string; // ISO
}
export interface CurrentEvidence {
  readonly id: string;
  readonly createdAt: string; // ISO
  readonly authorized: boolean; // visibilité/consentement courant
}

/** Le texte doit-il être RÉÉCRIT ? (postérieure OU supprimée OU non autorisée). */
export function needsRegeneration(text: StoredText, current: readonly CurrentEvidence[]): boolean {
  for (const e of current) if (e.createdAt > text.generatedAt) return true; // passé / correction arrivés après
  return mustNotDisplay(text, current); // suppression / retrait d'autorisation l'exigent aussi
}

/** SÉCURITÉ : une source supprimée ou non autorisée → le texte ne s'affiche plus (même non régénéré). */
export function mustNotDisplay(text: StoredText, current: readonly CurrentEvidence[]): boolean {
  const byId = new Map(current.map((e) => [e.id, e]));
  for (const id of text.sourceEvidenceIds) {
    const e = byId.get(id);
    if (!e) return true;            // supprimée : source disparue du journal
    if (!e.authorized) return true; // non autorisée : visibilité/consentement révoqués
  }
  return false;
}

/** Une section (détail) et sa date d'écriture — pour la péremption des synthèses (hsg §48octies). */
export interface SectionStamp {
  readonly sectionKey: string;
  readonly generatedAt: string; // ISO
}

/**
 * SECTION DE SYNTHÈSE (résumé, carrousel, mode d'emploi du duo) — périmée si l'une des sections de DÉTAIL
 * dont elle dépend a été RÉÉCRITE après sa propre date (`synth.generatedAt < max(dépendances.generatedAt)`).
 * S'ajoute aux trois sorts : une détail qui change → se réécrit → les synthèses qui en dépendent périssent.
 * Cascade à un seul niveau (détail → synthèse). `details` = l'état courant des sections de détail du sujet.
 */
export function synthesisNeedsRegeneration(
  synth: { readonly generatedAt: string; readonly dependsOnSections: readonly string[] },
  details: readonly SectionStamp[],
): boolean {
  const byKey = new Map(details.map((d) => [d.sectionKey, d]));
  for (const key of synth.dependsOnSections) {
    const d = byKey.get(key);
    if (d && d.generatedAt > synth.generatedAt) return true; // une dépendance réécrite après la synthèse
  }
  return false;
}
