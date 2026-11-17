import { describe, it, expect } from 'vitest';
import { stripProfileV2Data } from '../v2-tiers';
import { SHARE_GROUPS, sanitizeScope } from '../share-sections';
import { ALL_SECTION_KEYS } from '../visibility';
import type { ProfileV2Data } from '../v2-data';

// LE PARTAGE SE DÉCIDE ÉLÉMENT PAR ÉLÉMENT.
//
// Une seule case décidait autrefois des trois : allergies, régime, alcool. Partager une
// allergie parce qu'un proche organise un dîner obligeait à partager aussi un régime — et
// un régime peut dire une conviction religieuse.
//
// Ces tests existent pour que personne ne les regroupe à nouveau « pour simplifier
// l'écran ». Ils échouent si une seule clé rouvre l'accès aux autres.

const base = {
  facts: {
    tailles: '38 · 39',
    allergies: 'Arachides — réaction forte',
    regime: 'Halal',
    alcool: 'Ne boit pas',
    parfums: undefined,
    adresseRenseignee: false,
    animaux: undefined,
    datesCles: undefined,
    mobilite: undefined,
  },
  mobiliteDetail: null,
  summary: 'texte', summaryChips: [], summaryLong: null, podiumIntro: null, podium: [],
  insights: [], understoodCards: [], sections: {}, worksLevels: null, worksPhrases: {},
  territory: null, universe: null, brandsCategorized: [], practicalEdit: {},
} as unknown as ProfileV2Data;

/** Ce que voit le proche quand SEULES ces portées ont été accordées. */
const partage = (portees: string[]) =>
  stripProfileV2Data(base, 'invite_filtre', sanitizeScope(portees) as never).facts;

describe('partage des infos sensibles — une porte par information', () => {
  it('partager les ALLERGIES ne révèle ni le régime ni l’alcool', () => {
    const f = partage(['facts_allergies']);
    expect(f.allergies).toBe('Arachides — réaction forte');
    expect(f.regime).toBeUndefined();
    expect(f.alcool).toBeUndefined();
  });

  it('partager le RÉGIME ne révèle pas les allergies', () => {
    const f = partage(['facts_regime']);
    expect(f.regime).toBe('Halal');
    expect(f.allergies).toBeUndefined();
    expect(f.alcool).toBeUndefined();
  });

  it('partager l’ALCOOL ne révèle ni allergie ni régime', () => {
    const f = partage(['facts_alcool']);
    expect(f.alcool).toBe('Ne boit pas');
    expect(f.allergies).toBeUndefined();
    expect(f.regime).toBeUndefined();
  });

  it('ne rien accorder ne laisse rien passer', () => {
    const f = partage([]);
    expect(f.allergies).toBeUndefined();
    expect(f.regime).toBeUndefined();
    expect(f.alcool).toBeUndefined();
  });

  it('les trois ensemble se partagent bien ensemble quand c’est voulu', () => {
    const f = partage(['facts_allergies', 'facts_regime', 'facts_alcool']);
    expect(f.allergies).toBeTruthy();
    expect(f.regime).toBe('Halal');
    expect(f.alcool).toBe('Ne boit pas');
  });
});

describe('les consentements donnés sous l’ancienne case ne sont pas reportés', () => {
  // Quand la QUESTION change, l'ancienne réponse n'y répond plus. Reporter le groupe sur
  // les trois clés ferait partager une conviction religieuse au titre d'une case où
  // personne n'a lu le mot « religion ». Le report va vers MOINS de partage, jamais vers plus.
  it('une portée « facts_alimentaire » stockée ne donne plus aucun accès', () => {
    expect(sanitizeScope(['facts_alimentaire'])).toEqual([]);
    const f = partage(['facts_alimentaire']);
    expect(f.allergies).toBeUndefined();
    expect(f.regime).toBeUndefined();
    expect(f.alcool).toBeUndefined();
  });

  it('l’ancienne clé n’existe plus nulle part dans la matrice', () => {
    expect(ALL_SECTION_KEYS).not.toContain('facts_alimentaire' as never);
  });
});

describe('l’écran de partage propose bien trois cases distinctes', () => {
  it('chacune est proposée séparément, avec son propre libellé', () => {
    const items = SHARE_GROUPS.flatMap((g) => g.items);
    for (const cle of ['facts_allergies', 'facts_regime', 'facts_alcool']) {
      const item = items.find((i) => i.keys.length === 1 && i.keys[0] === (cle as never));
      expect(item, `${cle} doit être une case à elle seule`).toBeDefined();
      expect(item!.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('aucune case ne regroupe deux de ces trois informations', () => {
    const sensibles = new Set(['facts_allergies', 'facts_regime', 'facts_alcool']);
    for (const item of SHARE_GROUPS.flatMap((g) => g.items)) {
      const dedans = item.keys.filter((k) => sensibles.has(k as string));
      expect(dedans.length, `« ${item.label} » en regroupe ${dedans.length}`).toBeLessThanOrEqual(1);
    }
  });
});
