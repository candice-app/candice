// Identités typées du module de connaissance (lot A bis, correction 1).
//
// Deux natures de concept RÉSOLUBLES reçoivent une identité brandée, de sorte que
// le compilateur refuse de passer l'une là où l'autre est attendue. Les constructs
// canoniques (unions de littéraux fermées) N'EN reçoivent AUCUNE : PROFILE_OPENNESS
// est déjà son propre identifiant stable, lui donner un id serait l'aplatissement à
// éviter. Idem pour NEED/DRIVER/GUARDRAIL canoniques, modalités affectives, relations
// ENTITY, et pour les registres ouverts qui nomment des TYPES (classification), pas
// des instances.
//
// Deux identités d'ACTEURS alignées sur le schéma réel du dépôt (point d'arrêt 1,
// arbitré) — aucun troisième vocabulaire d'identité n'est créé :
//   - ContactId  → contacts.id      : le proche, SUJET de la connaissance.
//   - UserId     → auth.users.id    : le pilote, DÉTENTEUR (colonne user_id, dominante ;
//                                      pilot_id des 10 tables récentes = même rôle, dette
//                                      consignée au carnet).

declare const __brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [__brand]: B };

/** Concept descriptif open-world : « photographie argentique », « montres Art déco ». */
export type SubjectId = Branded<string, 'SubjectId'>;
/** Entité concrète : One Piece, Oda, un restaurant, une marque. */
export type EntityId = Branded<string, 'EntityId'>;
/** Le proche — contacts.id. Sujet de la connaissance. */
export type ContactId = Branded<string, 'ContactId'>;
/** Le pilote/détenteur — auth.users.id (colonne user_id). */
export type UserId = Branded<string, 'UserId'>;

export const asSubjectId = (s: string): SubjectId => s as SubjectId;
export const asEntityId = (s: string): EntityId => s as EntityId;
export const asContactId = (s: string): ContactId => s as ContactId;
export const asUserId = (s: string): UserId => s as UserId;

/**
 * Référence discriminée vers n'importe quelle nature de concept. Un code canonique
 * fermé est référencé tel quel (ns: 'canonical'), sans identité brandée.
 */
export type ConceptRef =
  | { readonly ns: 'subject'; readonly id: SubjectId }
  | { readonly ns: 'entity'; readonly id: EntityId }
  | { readonly ns: 'canonical'; readonly code: string };

/**
 * Ce vers quoi une décision future (Discovery, recommandation, portrait) pourra
 * pointer. Types seulement — aucune logique dans ce lot.
 */
export type KnowledgeRef =
  | { readonly kind: 'evidence'; readonly id: string }
  | { readonly kind: 'fact'; readonly id: string }
  | { readonly kind: 'open_knowledge'; readonly id: string }
  | { readonly kind: 'signal'; readonly key: string }
  | { readonly kind: 'source'; readonly id: string };

/**
 * Les deux colonnes d'identité portées par TOUTE structure persistée, comme
 * questionnaire_responses(contact_id, user_id). Redondance assumée : elle évite une
 * jointure sur chaque lecture RLS. La clé de signal, elle, est scopée sur contactId
 * SEUL (contacts.id est une PK qui détermine déjà son propriétaire ; une clé qui
 * contiendrait le propriétaire se casserait si la propriété changeait).
 */
export interface KnowledgeScope {
  /** Le proche — contacts.id. */
  readonly contactId: ContactId;
  /** Le pilote/détenteur — user_id. */
  readonly ownerId: UserId;
}
