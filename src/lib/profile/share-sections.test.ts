// B.2 Phase 6 — garde anti-dérive : les groupes de l'écran de partage
// couvrent EXACTEMENT les sections cochables de la matrice invite_filtre.

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

describe("SHARE_GROUPS ↔ matrice", () => {
  it("couvre exactement les sections cochables (ni trou, ni extra)", () => {
    expect(allShareGroupKeys().sort()).toEqual(checkableSections("invite_filtre").sort());
  });

  it("aucune clé dupliquée entre items", () => {
    const keys = allShareGroupKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("les défauts cochés = filtered_on uniquement", () => {
    const defaults = defaultCheckedKeys();
    expect(defaults).toContain("radar");
    expect(defaults).toContain("gifts");
    expect(defaults).toContain("avoid");
    expect(defaults).not.toContain("temperament_axes");
    expect(defaults).not.toContain("points_fixes");
    expect(defaults).not.toContain("facts_tailles");
  });
});

describe("sanitizeScope — intersection stricte", () => {
  it("filtre tout ce qui n'est pas cochable (blind, socle, never, inconnu)", () => {
    expect(sanitizeScope([SCOPE_BLIND, SCOPE_SOCLE, "wishlist", "art9", "facts_adresse", "n_importe_quoi", "gifts"]))
      .toEqual(["gifts"]);
  });

  it("['socle'] (essentiel seulement) → sharedSections vide : le socle seul s'affiche", () => {
    expect(sanitizeScope([SCOPE_SOCLE])).toEqual([]);
  });

  it("null/undefined → vide", () => {
    expect(sanitizeScope(null)).toEqual([]);
    expect(sanitizeScope(undefined)).toEqual([]);
  });
});

describe("scopeForSelection — source unique des deux gestes (réponse + lien)", () => {
  it("all → snapshot de toutes les sections cochables", () => {
    expect(scopeForSelection("all").sort()).toEqual(checkableSections("invite_filtre").sort());
  });

  it("blind → ['blind']", () => {
    expect(scopeForSelection("blind")).toEqual([SCOPE_BLIND]);
  });

  it("sections cochées → sections assainies", () => {
    expect(scopeForSelection("sections", ["gifts", "wishlist", "n_importe_quoi"])).toEqual(["gifts"]);
  });

  it("ZÉRO case cochée → ['socle'] (jamais un scope vide)", () => {
    expect(scopeForSelection("sections", [])).toEqual([SCOPE_SOCLE]);
    expect(scopeForSelection("sections", undefined)).toEqual([SCOPE_SOCLE]);
    expect(scopeForSelection("sections", ["wishlist"])).toEqual([SCOPE_SOCLE]); // rien de cochable ne survit
  });

  it("aucun mode ne peut produire un scope vide (CHECK ≥ 1 en base)", () => {
    for (const mode of ["all", "sections", "blind"] as const) {
      expect(scopeForSelection(mode, []).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("SHARE_GROUPS — structure", () => {
  it("3 groupes : Analyse, Univers, Infos pratiques", () => {
    expect(SHARE_GROUPS.map(g => g.title)).toEqual(["Analyse", "Univers", "Infos pratiques"]);
  });

  it("le tempérament groupe axes + modes sous un seul choix", () => {
    const temperament = SHARE_GROUPS[0].items.find(i => i.label === "Tempérament");
    expect(temperament?.keys.sort()).toEqual(["temperament_axes", "temperament_modes"]);
  });
});
