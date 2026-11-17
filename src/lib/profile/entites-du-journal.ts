// LES ENTITÉS DE LA PAGE D'ANALYSE, LUES DANS LE JOURNAL.
//
// CE QU'ELLES ÉTAIENT AVANT. La page d'analyse finale ré-extrayait les entités des champs de
// singularité par un SECOND appel modèle (Haiku), indépendant de l'extraction qui alimente le
// journal. Les mêmes phrases étaient donc lues deux fois, par deux modèles, avec deux schémas —
// et c'est le second résultat qui s'affichait sur la fiche. Trois conséquences, toutes visibles :
//
//   · DIVERGENCE. Ce que la fiche montre pouvait contredire ce que Candice sait. Deux lecteurs
//     divergent toujours ; ici la divergence se voyait à l'écran.
//   · PERTE SILENCIEUSE. Le texte envoyé à Haiku était tronqué à 800 caractères. Au-delà, les
//     entités n'existaient pas pour la fiche — sans aucune trace de ce qui avait été coupé.
//   · POLARITÉ PERDUE. L'extraction nommait les entités sans leur relation. Une chose que la
//     personne REFUSE pouvait apparaître parmi ce qu'elle aime. Pour Sophie, « bijoux » et
//     « fleurs coupées » — deux refus explicites — étaient des entités nommées comme les autres.
//
// Ce module lit le journal, qui porte la relation, et sépare ce qui est aimé de ce qui est évité.
// Un évitement n'entre JAMAIS dans une liste de goûts : le perdre, c'est recommander ce que la
// personne fuit. `hasActiveAvoidance` sert de garde — une entité un jour évitée reste écartée des
// listes positives même si une mention plus tendre est venue après (LOVE + AVOID = tension, pas
// permission).
import { hasActiveAvoidance } from '@/lib/knowledge/consolidate';
import type { Portrait } from '@/lib/knowledge/portrait';

/** Forme attendue par `profile_analysis.entities` et par les puces de la fiche. */
export interface EntitesFiche {
  readonly brands: string[];
  readonly places: string[];
  readonly hobbies: string[];
  readonly events: string[];
  /** Sous-types sans case dédiée (livre, film, musique, artiste, personne, produit…).
   *  Présents pour que RIEN ne disparaisse en silence : une entité sans case serait une
   *  perte invisible, exactement le défaut qu'on corrige. */
  readonly autres: string[];
  /** Ce que la personne ÉVITE. Jamais mélangé aux listes ci-dessus. */
  readonly evites: string[];
}

const PLACES = new Set(['place', 'restaurant', 'hotel', 'destination']);
const MARQUES = new Set(['brand']);
const EVENEMENTS = new Set(['event']);

/** Relations qui dénotent un REFUS. Tout le reste est au mieux neutre, jamais un refus. */
const REFUS = new Set(['AVOID', 'DISLIKE']);

/**
 * Traduit le portrait en entités de fiche. Aucun appel modèle, aucune troncature, aucune
 * inférence : une projection de ce qui est déjà écrit.
 *
 * Les INTÉRÊTS deviennent les « hobbies » — c'est leur famille, et c'est ce que la case
 * attend. Leur DEGRÉ d'engagement n'est pas transporté ici : une puce ne porte pas de
 * nuance, et en inventer une serait affirmer plus que ce que le journal dit.
 */
export function entitesDuJournal(p: Portrait): EntitesFiche {
  const brands: string[] = [], places: string[] = [], events: string[] = [];
  const autres: string[] = [], evites: string[] = [];

  for (const e of p.entities) {
    const libelle = e.entityLabel?.trim();
    if (!libelle) continue;
    // Un évitement — actuel OU passé — n'entre dans aucune liste positive.
    if (REFUS.has(String(e.relation)) || hasActiveAvoidance(e)) { evites.push(libelle); continue; }
    const t = String(e.entityType ?? '').toLowerCase();
    if (MARQUES.has(t)) brands.push(libelle);
    else if (PLACES.has(t)) places.push(libelle);
    else if (EVENEMENTS.has(t)) events.push(libelle);
    else autres.push(libelle);
  }

  const hobbies = p.interests
    .map((i) => i.subjectLabel?.trim())
    .filter((l): l is string => Boolean(l));

  const unique = (xs: string[]) => [...new Set(xs)];
  return {
    brands: unique(brands), places: unique(places), events: unique(events),
    autres: unique(autres), hobbies: unique(hobbies), evites: unique(evites),
  };
}

/** Combien d'entités la fiche porte réellement — pour le journal de traitement. */
export function nbEntites(e: EntitesFiche): number {
  return e.brands.length + e.places.length + e.hobbies.length + e.events.length + e.autres.length + e.evites.length;
}
