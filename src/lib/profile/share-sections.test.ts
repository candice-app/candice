// Phase D — garde anti-dérive : les groupes de l'écran de partage couvrent
// EXACTEMENT les sections cochables de la matrice V2.

import { describe, it, expect } from "vitest";
import { checkableSections } from "./visibility";
import {
  SHARE_GROUPS,
  allShareGroupKeys,
  defaultCheckedKeys,
  sanitizeScope,
  scopeForSelection,
  SCOPE_BLIND,
  SCOPE_SOCLE,
} from "./share-sections";

describe("SHARE_GROUPS ↔ matrice V2", () => {
  it("couvre exactement les sections cochables (ni trou, ni extra)", () => {
    expect(allShareGroupKeys().sort()).toEqual(checkableSections("invite_filtre").sort());
  });

  it("aucune clé dupliquée entre items", () => {
    const keys = allShareGroupKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("défauts = filtered_on : analyse cochée, deep_loved/wishlist/facts décochées", () => {
    const defaults = defaultCheckedKeys();
    expect(defaults).toContain("understood");
    expect(defaults).toContain("works");
    expect(defaults).toContain("territoire");
    expect(defaults).not.toContain("deep_loved");
    expect(defaults).not.toContain("wishlist");
    expect(defaults).not.toContain("facts_tailles");
  });

  it("3 groupes : Analyse, Mondes & univers, Infos pratiques", () => {
    expect(SHARE_GROUPS.map(g => g.title)).toEqual(["Analyse", "Mondes & univers", "Infos pratiques"]);
  });

  it("la wishlist n'est JAMAIS proposée au partage (clôture V2)", () => {
    expect(allShareGroupKeys()).not.toContain("wishlist");
  });
});

describe("sanitizeScope / scopeForSelection — intersection stricte", () => {
  it("filtre les sentinelles, never et inconnues", () => {
    expect(sanitizeScope([SCOPE_BLIND, SCOPE_SOCLE, "art9", "facts_adresse", "radar", "deep_pleasure"]))
      .toEqual(["deep_pleasure"]);
  });

  it("['socle'] → sharedSections vide : le socle seul s'affiche", () => {
    expect(sanitizeScope([SCOPE_SOCLE])).toEqual([]);
  });

  it("aucun mode ne produit un scope vide (CHECK ≥ 1)", () => {
    for (const mode of ["all", "sections", "blind"] as const) {
      expect(scopeForSelection(mode, []).length).toBeGreaterThanOrEqual(1);
    }
    expect(scopeForSelection("sections", [])).toEqual([SCOPE_SOCLE]);
    expect(scopeForSelection("blind")).toEqual([SCOPE_BLIND]);
    // « Tout partager » ne comprend AUCUNE allergie : chacune se choisit (décision du 18 nov.).
    expect(scopeForSelection("all").sort()).toEqual(checkableSections("invite_filtre").filter((k) => k !== "facts_allergies").sort());
  });
});

describe("allergies : une clé par allergie, validée contre ce que la personne a réellement", () => {
  it("une clé d'allergie que la personne n'a pas est écartée du consentement", () => {
    expect(scopeForSelection("sections", ["facts_allergies:gluten", "facts_allergies:inventee", "facts_regime"], ["facts_allergies:gluten"]))
      .toEqual(["facts_allergies:gluten", "facts_regime"]);
  });
  it("la clé de section seule ne vaut plus rien", () => {
    expect(scopeForSelection("sections", ["facts_allergies"], ["facts_allergies:gluten"])).toEqual([SCOPE_SOCLE]);
  });
});
