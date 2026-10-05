// Résolveur de concepts PAR NAMESPACE (lot A bis, correction 1).
//
// Un résolveur par nature (subject, entity), jamais partagé : un SubjectId et un
// EntityId ne vivent jamais dans le même registre. Il résout une formulation brute
// vers une identité conceptuelle existante, et n'enregistre un nouveau concept que
// sur demande explicite (resolveOrRegister). Il ne devine JAMAIS : `analog
// photography` ne rejoint `photographie argentique` que par un alias ajouté à la
// main. La formulation d'origine n'est jamais remplacée — l'appelant conserve son
// verbatim ; le résolveur ne rend que l'identité et le libellé canonique.

import { normalizeLabel } from './normalize';

export interface ConceptResolution<I> {
  readonly id: I;
  /** Libellé canonique affichable du concept (verbatim du premier enregistrement). */
  readonly canonicalLabel: string;
  /** Comment la correspondance a été établie — jamais deviné, toujours tracé. */
  readonly matchedBy: 'exact' | 'normalized' | 'alias';
}

export interface ConceptResolver<I> {
  /** Cherche un concept existant. Ne crée rien. */
  resolve(rawLabel: string): ConceptResolution<I> | null;
  /** Résout, et enregistre un nouveau concept si aucun ne correspond. */
  resolveOrRegister(rawLabel: string): ConceptResolution<I>;
  /** Ajoute un alias vers un concept existant. */
  addAlias(id: I, alias: string): void;
  /** Fusionne deux concepts : le perdant devient un alias du gagnant. */
  merge(winner: I, loser: I): void;
  entries(): readonly { id: I; canonicalLabel: string; aliases: readonly string[] }[];
}

interface ConceptEntry<I> {
  id: I;
  canonicalLabel: string;
  /** Clé normalisée du libellé canonique. */
  canonicalKey: string;
  /** Formulations alias verbatim (sans le libellé canonique). */
  aliases: string[];
}

/**
 * Crée un résolveur pour un namespace donné.
 * `brand` convertit une chaîne en identité typée du namespace (ex. asSubjectId).
 * L'id d'un concept est DÉRIVÉ de sa clé normalisée → déterministe et stable au
 * recalcul (indispensable pour signalKey et l'historique des SignalSnapshot). Deux
 * concepts distincts ont des clés distinctes, donc des ids distincts.
 */
export function createConceptResolver<I extends string>(brand: (s: string) => I): ConceptResolver<I> {
  /** clé normalisée → id. Alimentée par le libellé canonique ET chaque alias. */
  const keyToId = new Map<string, I>();
  /** id → entrée. */
  const byId = new Map<I, ConceptEntry<I>>();

  function find(rawLabel: string): { entry: ConceptEntry<I>; matchedBy: ConceptResolution<I>['matchedBy'] } | null {
    const key = normalizeLabel(rawLabel);
    const id = keyToId.get(key);
    if (id === undefined) return null;
    const entry = byId.get(id);
    if (!entry) return null;
    let matchedBy: ConceptResolution<I>['matchedBy'];
    if (rawLabel === entry.canonicalLabel) matchedBy = 'exact';
    else if (key === entry.canonicalKey) matchedBy = 'normalized';
    else matchedBy = 'alias';
    return { entry, matchedBy };
  }

  function resolve(rawLabel: string): ConceptResolution<I> | null {
    const hit = find(rawLabel);
    if (!hit) return null;
    return { id: hit.entry.id, canonicalLabel: hit.entry.canonicalLabel, matchedBy: hit.matchedBy };
  }

  function resolveOrRegister(rawLabel: string): ConceptResolution<I> {
    const existing = resolve(rawLabel);
    if (existing) return existing;
    const key = normalizeLabel(rawLabel);
    const id = brand(key); // dérivé de la clé normalisée → déterministe
    const entry: ConceptEntry<I> = { id, canonicalLabel: rawLabel, canonicalKey: key, aliases: [] };
    byId.set(id, entry);
    keyToId.set(key, id);
    return { id, canonicalLabel: rawLabel, matchedBy: 'exact' };
  }

  function addAlias(id: I, alias: string): void {
    const entry = byId.get(id);
    if (!entry) throw new Error(`[knowledge] alias vers un concept inconnu: ${String(id)}`);
    const key = normalizeLabel(alias);
    keyToId.set(key, id);
    if (alias !== entry.canonicalLabel && !entry.aliases.includes(alias)) entry.aliases.push(alias);
  }

  function merge(winner: I, loser: I): void {
    if (winner === loser) return;
    const w = byId.get(winner);
    const l = byId.get(loser);
    if (!w || !l) throw new Error('[knowledge] merge sur un concept inconnu');
    // Toutes les clés du perdant pointent désormais vers le gagnant.
    for (const [key, id] of keyToId.entries()) {
      if (id === loser) keyToId.set(key, winner);
    }
    // Le perdant et ses alias deviennent des alias du gagnant (verbatim conservés).
    for (const label of [l.canonicalLabel, ...l.aliases]) {
      if (label !== w.canonicalLabel && !w.aliases.includes(label)) w.aliases.push(label);
    }
    byId.delete(loser);
  }

  function entries() {
    return [...byId.values()].map((e) => ({
      id: e.id,
      canonicalLabel: e.canonicalLabel,
      aliases: [...e.aliases] as readonly string[],
    }));
  }

  return { resolve, resolveOrRegister, addAlias, merge, entries };
}
