// Lot A bis — identité conceptuelle, normalisation, résolveur par namespace.

import { describe, expect, it } from 'vitest';
import { normalizeLabel } from '../normalize';
import { createConceptResolver } from '../resolver';
import { asEntityId, asSubjectId, type EntityId, type SubjectId } from '../identity';
import {
  BEHAVIOR_CONTEXTS,
  BEHAVIOR_PATTERNS,
  CONTEXT_CODES,
  ENTITY_TYPES,
  INTEREST_PARENT_DOMAINS,
} from '../vocabulary';

describe('1 — la normalisation est pure et déterministe', () => {
  it('même entrée → même clé, quel que soit l’ordre', () => {
    const inputs = ['Photographie Argentique', 'photographie  argentique', 'photographie-argentique'];
    const keys = inputs.map(normalizeLabel);
    expect(new Set(keys).size).toBe(1);
    // idempotente
    for (const k of keys) expect(normalizeLabel(k)).toBe(k);
  });
  it('minuscule, accents dépliés, ponctuation et articles retirés, pas de traduction/stemming', () => {
    expect(normalizeLabel('Les Montres Art-Déco !')).toBe('montres art deco');
    // « photo » et « photographie » restent distincts (aucun stemming sémantique).
    expect(normalizeLabel('photo argentique')).not.toBe(normalizeLabel('photographie argentique'));
  });
});

describe('2 — variantes de surface résolvent vers le même SubjectId', () => {
  it('case / espaces / tiret collapsent ; photo↔photographie via alias EXPLICITE (jamais stemming)', () => {
    const r = createConceptResolver<SubjectId>(asSubjectId);
    const a = r.resolveOrRegister('photo argentique');
    r.addAlias(a.id, 'photographie argentique'); // lien explicite, pas une devinette
    for (const variant of ['photo argentique', 'Photographie Argentique', 'photographie  argentique', 'photographie-argentique']) {
      expect(r.resolve(variant)?.id).toBe(a.id);
    }
  });
});

describe('3 — analog photography ne résout QUE via un alias explicite', () => {
  it('sans alias → concept distinct ; avec alias → même concept (aucune traduction auto)', () => {
    const r = createConceptResolver<SubjectId>(asSubjectId);
    const a = r.resolveOrRegister('photographie argentique');
    expect(r.resolve('analog photography')).toBeNull();
    r.addAlias(a.id, 'analog photography');
    expect(r.resolve('analog photography')?.id).toBe(a.id);
    expect(r.resolve('analog photography')?.matchedBy).toBe('alias');
  });
});

describe('4 — aucun chemin de code n’écrase une formulation source', () => {
  it('resolveOrRegister ne touche pas le subjectLabel verbatim de l’appelant', () => {
    const r = createConceptResolver<SubjectId>(asSubjectId);
    const evidenceLabel = 'photo argentique'; // ce que la personne a dit
    r.resolveOrRegister('photographie argentique'); // libellé canonique différent
    r.addAlias(r.resolve('photographie argentique')!.id, evidenceLabel);
    const res = r.resolve(evidenceLabel)!;
    // Le résolveur rend l'identité + le libellé canonique ; l'appelant garde SON verbatim.
    expect(res.canonicalLabel).toBe('photographie argentique');
    expect(evidenceLabel).toBe('photo argentique'); // inchangé
  });
});

describe('5 — merge déplace le pointeur, conserve le perdant en alias', () => {
  it('le perdant devient alias du gagnant, aucune formulation perdue', () => {
    const r = createConceptResolver<SubjectId>(asSubjectId);
    const winner = r.resolveOrRegister('montres mécaniques');
    const loser = r.resolveOrRegister('horlogerie mecanique');
    r.merge(winner.id, loser.id);
    // Les deux formulations résolvent désormais vers le gagnant.
    expect(r.resolve('montres mécaniques')?.id).toBe(winner.id);
    expect(r.resolve('horlogerie mecanique')?.id).toBe(winner.id);
    const entry = r.entries().find((e) => e.id === winner.id)!;
    expect(entry.aliases).toContain('horlogerie mecanique'); // verbatim conservé
    expect(r.entries().some((e) => e.id === loser.id)).toBe(false); // le perdant n'existe plus comme concept
  });
});

describe('6 — un SubjectId n’est pas un EntityId (test de type)', () => {
  it('le compilateur refuse de croiser les deux namespaces', () => {
    const s: SubjectId = asSubjectId('x');
    // @ts-expect-error un SubjectId n'est pas assignable à un EntityId
    const e: EntityId = s;
    expect(typeof e).toBe('string'); // à l'exécution ce sont des chaînes
  });
});

describe('7 — 5 registres normalisés sur 5 (normalisation à l’enregistrement)', () => {
  it('les 4 registres de types normalisent à l’enregistrement', () => {
    INTEREST_PARENT_DOMAINS.register('Aquariophilie');
    expect(INTEREST_PARENT_DOMAINS.has('aquariophilie')).toBe(true);
    ENTITY_TYPES.register('Ma Nouvelle  Marque');
    expect(ENTITY_TYPES.has('ma nouvelle-marque')).toBe(true); // variante collapsée
    CONTEXT_CODES.register('Nouveau Contexte');
    expect(CONTEXT_CODES.has('nouveau  contexte')).toBe(true);
    BEHAVIOR_CONTEXTS.register('grief_response');
    expect(BEHAVIOR_CONTEXTS.has('grief_response')).toBe(true);
  });
  it('BEHAVIOR_PATTERNS (5ᵉ) normalise via ses alias HSG', () => {
    expect(BEHAVIOR_PATTERNS.has('withdraw_seek_calm')).toBe(true); // alias → withdraw
    expect(BEHAVIOR_PATTERNS.has('withdraw')).toBe(true);
  });
});
