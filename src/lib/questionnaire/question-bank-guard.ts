// GARDE D'UNICITÉ DE LA BANQUE (décision Estelle 2 nov) — le `factType` d'un champ est la CLÉ DE
// SUPERSESSION (voir knowledge-write/supersede.ts). Si deux champs distincts portaient le même factType,
// corriger l'un supersèderait silencieusement les lignes de l'autre : une collision ne doit JAMAIS passer
// inaperçue. On ne s'en remet pas à un test qu'on pourrait oublier de lancer — on ÉCHOUE AU CHARGEMENT de
// la banque, bruyamment, en NOMMANT les deux champs en conflit.
//
// Pur (aucun import de banque → aucun cycle) : la banque socle appelle cette garde au bas de son module
// (socle-facts-fields.ts), donc dès qu'elle est chargée. Réutilisable pour toute autre banque.
//
// Autres espaces de question_code, gardés AILLEURS (hors de cette garde, et pourquoi) :
//  • Discovery (~1760 questions) : `discovery_questions.question_key` est NOT NULL UNIQUE en base
//    (migration 29) — un doublon ne peut pas être inséré, échec bruyant au niveau DB ;
//  • mappings d'onboarding (q1…q19, q4a-d, qe, soutien, moteurs) : un même questionCode se RÉPÈTE par
//    conception (une question → plusieurs lignes de mapping d'options) — ce n'est pas une clé à unicité
//    par ligne.

export interface BankEntry {
  readonly factType: string;
  readonly where: string; // d'où vient le champ (pour nommer les deux côtés d'une collision)
}

/**
 * Lève si deux entrées partagent un `factType`, en nommant les DEUX emplacements. Pure et réutilisable :
 * on peut la nourrir de n'importe quelle banque (socle aujourd'hui, Discovery servi depuis la DB demain).
 */
export function assertUniqueFactTypes(entries: readonly BankEntry[]): void {
  const seen = new Map<string, string>();
  for (const e of entries) {
    const prev = seen.get(e.factType);
    if (prev !== undefined) {
      throw new Error(
        `[banque de questions] COLLISION de factType « ${e.factType} » — clé de supersession non unique : ` +
          `${prev} ET ${e.where}. Deux questions distinctes ne peuvent pas partager un factType (corriger ` +
          `l'une supersèderait l'autre). Renomme l'un des deux.`,
      );
    }
    seen.set(e.factType, e.where);
  }
}
