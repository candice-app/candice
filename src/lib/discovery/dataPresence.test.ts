// Chantier 2.2 — tests de la garde par présence de donnée.
// Cas couverts : donnée présente en fiche → question exclue ;
// donnée absente → question proposée.

import { describe, it, expect } from "vitest";
import {
  questionDataPresent,
  GUARDED_QUESTION_KEYS,
  type ProfileDataSnapshot,
} from "./dataPresence";

const EMPTY: ProfileDataSnapshot = {
  practical_info: null,
  singularity_answers: null,
  relational_filters: null,
  discovery_answers: null,
};

describe("questionDataPresent — donnée ABSENTE → question proposée", () => {
  for (const key of GUARDED_QUESTION_KEYS) {
    it(`${key} : profil vide → false`, () => {
      expect(questionDataPresent(key, EMPTY)).toBe(false);
      expect(questionDataPresent(key, null)).toBe(false);
    });
  }

  it("une question non gardée n'est jamais bloquée", () => {
    expect(questionDataPresent("attention.reception", EMPTY)).toBe(false);
    expect(questionDataPresent("clé.inconnue", EMPTY)).toBe(false);
  });
});

describe("questionDataPresent — donnée PRÉSENTE → question exclue", () => {
  it("fragrance.families : parfums structurés en fiche (le bug d'Estelle)", () => {
    const p: ProfileDataSnapshot = {
      ...EMPTY,
      practical_info: { parfums: ["poudre"], odeurs_detestees: "Trop sucrés Patchouli" },
    };
    expect(questionDataPresent("fragrance.families", p)).toBe(true);
  });

  it("fragrance.families : une réponse legacy fragrance.family suffit", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, discovery_answers: { "fragrance.family": ["poudre"] } };
    expect(questionDataPresent("fragrance.families", p)).toBe(true);
  });

  it("fragrance.scent_deal_breakers : odeurs détestées suffisent", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { odeurs_detestees: "patchouli" } };
    expect(questionDataPresent("fragrance.scent_deal_breakers", p)).toBe(true);
  });

  it("fragrance.perfume_risk : parfums en fiche ne suffisent PAS (question manquante posée)", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { parfums: ["poudre"] } };
    expect(questionDataPresent("fragrance.perfume_risk", p)).toBe(false);
  });

  it("practical.constraints : allergies renseignées", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { allergies: ["fruits_a_coque"] } };
    expect(questionDataPresent("practical.constraints", p)).toBe(true);
  });

  it("practical.constraints : allergies=['aucune'] ne compte PAS comme donnée", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { allergies: ["aucune"] } };
    expect(questionDataPresent("practical.constraints", p)).toBe(false);
  });

  it("practical.dietary : régime en fiche OU ancienne réponse discovery fusionnée", () => {
    expect(questionDataPresent("practical.dietary", { ...EMPTY, practical_info: { regime: "vegan" } })).toBe(true);
    expect(questionDataPresent("practical.dietary", { ...EMPTY, discovery_answers: { "practical.constraints": ["vegetarian"] } })).toBe(true);
  });

  it("practical.mobility : mobilite_sante en fiche", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { mobilite_sante: "genou fragile" } };
    expect(questionDataPresent("practical.mobility", p)).toBe(true);
  });

  it("practical.important_dates : au moins une date stockée (même sans date précisée)", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { dates_importantes: [{ date: "" }] } };
    expect(questionDataPresent("practical.important_dates", p)).toBe(true);
  });

  it("style.clothing : couleurs_matieres en fiche", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, practical_info: { couleurs_matieres: "tons terreux, lin" } };
    expect(questionDataPresent("style.clothing", p)).toBe(true);
  });

  it("brands.favorites : marques_lieux en fiche", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, singularity_answers: { marques_lieux: "Aesop, Itoya" } };
    expect(questionDataPresent("brands.favorites", p)).toBe(true);
  });

  it("hobbies.main : adore_faire OU centres d'intérêt structurés", () => {
    expect(questionDataPresent("hobbies.main", { ...EMPTY, singularity_answers: { adore_faire: "poterie" } })).toBe(true);
    expect(questionDataPresent("hobbies.main", { ...EMPTY, singularity_answers: { interests: { items: [{ id: "lecture", rank: 1 }] } } })).toBe(true);
  });

  it("dreams.current : envies_reves en fiche", () => {
    const p: ProfileDataSnapshot = { ...EMPTY, singularity_answers: { envies_reves: "le Japon en automne" } };
    expect(questionDataPresent("dreams.current", p)).toBe(true);
  });

  it("gifts.to_avoid : cadeaux_non OU q17Text", () => {
    expect(questionDataPresent("gifts.to_avoid", { ...EMPTY, singularity_answers: { cadeaux_non: "bougies" } })).toBe(true);
    expect(questionDataPresent("gifts.to_avoid", { ...EMPTY, relational_filters: { q17Text: "les surprises publiques" } })).toBe(true);
  });

  it("les textes trop courts (≤2 caractères) ne comptent pas comme donnée", () => {
    expect(questionDataPresent("dreams.current", { ...EMPTY, singularity_answers: { envies_reves: "a" } })).toBe(false);
  });
});
