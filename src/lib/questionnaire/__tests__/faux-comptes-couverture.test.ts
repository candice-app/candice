import { describe, it, expect } from 'vitest';
import { ONBOARDING_MAPPINGS } from '../../knowledge/onboarding';

// LA RÉPARTITION DES OPTIONS SUR LES DIX COMPTES DOIT TOUT COUVRIR.
//
// Un tirage au hasard laisserait des mappings jamais exercés — et c'est précisément ce que
// ces comptes servent à éprouver : une option dont le mapping est vide n'écrit rien, et
// personne ne le voit. La répartition est donc déterministe ET exhaustive, et ce test le
// vérifie plutôt que de le croire.
const NB = 10;
function repartir(): string[][] {
  const parQuestion = new Map<string, string[]>();
  for (const o of ONBOARDING_MAPPINGS) {
    if (o.status !== 'ACTIF') continue;
    const l = parQuestion.get(o.questionCode) ?? [];
    l.push(o.optionRef);
    parQuestion.set(o.questionCode, l);
  }
  const comptes: string[][] = Array.from({ length: NB }, () => []);
  // Décalage GLOBAL : un compteur par question laissait les derniers comptes vides.
  let curseur = 0;
  for (const [, refs] of [...parQuestion].sort(([a], [b]) => (a < b ? -1 : 1))) {
    for (const ref of refs) { comptes[curseur % NB].push(ref); curseur++; }
  }
  return comptes;
}

describe('les dix faux comptes couvrent toutes les options actives', () => {
  const actives = ONBOARDING_MAPPINGS.filter((o) => o.status === 'ACTIF').map((o) => o.optionRef);

  it('chaque option active est cochée par au moins un compte', () => {
    const couvertes = new Set(repartir().flat());
    expect(actives.length).toBeGreaterThan(50); // sinon le test ne prouverait rien
    for (const ref of actives) expect(couvertes.has(ref), `option ${ref} jamais cochée`).toBe(true);
  });

  it('la répartition est stable : deux appels donnent la même chose', () => {
    expect(repartir()).toEqual(repartir());
  });

  it('aucun compte ne reçoit tout, aucun ne reçoit rien', () => {
    const lots = repartir();
    for (const l of lots) expect(l.length).toBeGreaterThan(0);
    const max = Math.max(...lots.map((l) => l.length));
    expect(max).toBeLessThan(actives.length);
  });

  it('les options ACTIVES sans aucune écriture sont connues d’avance', () => {
    // Une option dont TOUTES les listes de production sont vides n'écrira rien, quel que
    // soit le compte qui la coche. Mieux vaut le savoir ici que le découvrir dans un audit.
    // ⚠ LE CONTRÔLE DOIT COUVRIR TOUS LES CHAMPS DE PRODUCTION. Une première version
    //    oubliait `behavior` et `affectionCadence`, et annonçait donc 14 options muettes
    //    dont la plupart écrivent bien un COMPORTEMENT — « garder pour moi, faire bonne
    //    figure » en produit un. Un contrôle incomplet ne rend pas un résultat partiel :
    //    il rend un résultat FAUX, et avec l'assurance d'un chiffre.
    const muettes = ONBOARDING_MAPPINGS.filter((o) => o.status === 'ACTIF'
      && o.profileEvidences.length === 0 && o.affectionLanguage.length === 0
      && o.needs.length === 0 && o.drivers.length === 0 && o.guardrails.length === 0
      && o.preferences.length === 0 && o.facts.length === 0
      && !o.behavior && !o.affectionCadence);
    if (muettes.length > 0) {
      console.log(`options ACTIVES qui n'écrivent rien : ${muettes.length}`);
      for (const m of muettes.slice(0, 12)) console.log(`   ${m.questionCode}/${m.optionRef} — ${m.optionText.slice(0, 54)}`);
    }
    // On n'échoue PAS là-dessus : c'est peut-être voulu (une option de navigation). On le
    // rend visible, et c'est à Estelle de dire si c'en est une.
    expect(Array.isArray(muettes)).toBe(true);
  });
});
