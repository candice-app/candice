import { describe, it, expect } from 'vitest';
import { BANQUE, question } from '../banque';
import { ouvertParCategorie, ouvertParDomaineJournal, ALIAS_BRANCHES, SOUS_PARTIES } from '../correspondances';
import { estQuestionDOrientation, motifDExclusion } from '../selection';
import type { EtatDiscovery } from '../conditions';

const etat = (plus: Partial<EtatDiscovery>): EtatDiscovery => ({
  tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(), niveauParBranche: new Map(), dejaPosees: new Set(), attributsConnus: new Set(),
  sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(), aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, ...plus,
});

describe('catégories composites — elles ouvrent l’orientation, pas le détail', () => {
  it('« Mode & beauté » annonce la mode ET la beauté, sans ouvrir pleinement ni l’une ni l’autre', () => {
    expect(ouvertParCategorie('mode')).toMatchObject({ branches: [], orientation: ['fashion', 'fashion2', 'beauty', 'beauty2'] });
    expect(ouvertParCategorie('Mode & beauté').orientation).toContain('beauty');
  });
  it('« Tech & jeux » distingue jeux vidéo, jeux de société et autres jeux : une question d’orientation par famille', () => {
    const o = ouvertParCategorie('tech').orientation;
    for (const b of ['tech', 'gaming', 'Jeux de société', 'games']) expect(o).toContain(b);
    for (const b of o) expect(BANQUE.some((q) => q.branche === b && estQuestionDOrientation(q)), b).toBe(true);
  });
  it('« Nature & jardinage » ne démontre pas une pratique du jardinage ; `cinema_series` et `jewelry_watches` suivent la même règle', () => {
    expect(ouvertParCategorie('nature')).toMatchObject({ branches: [], orientation: ['nature', 'garden'] });
    expect(ouvertParDomaineJournal('cinema_series')).toMatchObject({ branches: [], orientation: ['cinema', 'cinema2', 'series', 'series2'] });
    expect(ouvertParDomaineJournal('jewelry_watches').orientation).toEqual(['jewelry', 'watch', 'Montres']);
  });
  it('une catégorie simple continue d’ouvrir sa branche', () => {
    expect(ouvertParCategorie('lecture')).toMatchObject({ branches: ['reading', 'reading2'], orientation: [] });
  });
  it('dans une branche en orientation seulement : la question d’orientation n’est pas écartée pour ce motif, la question spécialisée l’est', () => {
    const e = etat({ branchesOuvertes: new Set(['garden']), orientationSeulement: new Set(['garden']) });
    const orientation = question('garden.0557')!;
    const specialisee = BANQUE.find((q) => q.branche === 'garden' && !estQuestionDOrientation(q))!;
    expect(estQuestionDOrientation(orientation)).toBe(true);
    expect(motifDExclusion(orientation, e)).not.toBe('orientation_seulement');
    expect(motifDExclusion(specialisee, e)).toBe('orientation_seulement');
    // Ouverte par un signal propre (plus « orientation seulement ») : la question spécialisée n'est plus retenue pour ce motif.
    expect(motifDExclusion(specialisee, etat({ branchesOuvertes: new Set(['garden']) }))).not.toBe('orientation_seulement');
  });
});
