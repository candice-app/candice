// B.2.1 Phase 3 — tests de la matrice de visibilité.
// Objectif : garantir qu'AUCUNE fuite n'est possible, quel que soit
// le type de fiche et les cases cochées au partage.

import { describe, it, expect } from "vitest";
import {
  VISIBILITY_MATRIX,
  ALL_SECTION_KEYS,
  resolveVisibility,
  checkableSections,
  socleSections,
  type ProfileView,
  type SectionKey,
} from "./visibility";

const ALL_VIEWS: ProfileView[] = ["pilote", "invite_filtre", "contact_consulte", "aveugle"];

describe("VISIBILITY_MATRIX — complétude", () => {
  it("couvre chaque type × chaque section (aucun trou)", () => {
    for (const view of ALL_VIEWS) {
      for (const section of ALL_SECTION_KEYS) {
        expect(
          VISIBILITY_MATRIX[view][section],
          `matrice incomplète : ${view} × ${section}`,
        ).toBeDefined();
      }
    }
  });

  it("le type lien_public n'existe pas (décision produit)", () => {
    expect(ALL_VIEWS).not.toContain("lien_public");
    expect(Object.keys(VISIBILITY_MATRIX)).toHaveLength(4);
  });
});

describe("pilote — tout visible sauf hors-écran", () => {
  const expected: Record<SectionKey, boolean> = {
    header_identity: true, header_ring: true, header_actions: true, header_share_chips: true,
    lead: true, topchips: true, donut: true,
    radar: true, what_touches: true, insights: true,
    temperament_axes: true, temperament_modes: true, lifestyle_axes: true,
    gifts: true, restaurants: true, travel: true, hobbies: true,
    brands: true, style: true, parfums: true, points_fixes: true, avoid: true,
    facts_tailles: true, facts_alimentaire: true, facts_parfums: true,
    facts_adresse: true, facts_animaux: true, facts_dates: true, art9: true,
    constraints_row: false, // redondant avec facts_alimentaire
    discovery: true, edit_button: true, bottom_nav: true,
    wishlist: false,        // vit sur son propre écran
    not_shared_notice: false, blind_message: false,
  };

  for (const section of ALL_SECTION_KEYS) {
    it(`${section} → ${expected[section] ? "visible" : "masqué"}`, () => {
      const r = resolveVisibility("pilote", section);
      expect(r.shown).toBe(expected[section]);
    });
  }

  it("le pilote lit ses textes en 2e personne (jamais de conversion)", () => {
    for (const section of ALL_SECTION_KEYS) {
      expect(resolveVisibility("pilote", section).thirdPerson).toBe(false);
    }
  });
});

describe("invite_filtre — défauts (aucun choix enregistré)", () => {
  const expectedDefaults: Record<SectionKey, boolean> = {
    header_identity: true, header_ring: false, header_actions: false, header_share_chips: false,
    lead: true, topchips: true, donut: true,       // SOCLE
    radar: true, what_touches: true, insights: true,
    temperament_axes: false, temperament_modes: false, // intime → OFF
    lifestyle_axes: true,
    gifts: true, restaurants: true, travel: true, hobbies: true,
    brands: true, style: true, parfums: true,
    points_fixes: false,                            // le plus intime → OFF
    avoid: true,
    facts_tailles: false, facts_alimentaire: false, facts_parfums: false,
    facts_adresse: false, facts_animaux: false, facts_dates: false, art9: false,
    constraints_row: false,
    discovery: false, edit_button: false, bottom_nav: false,
    wishlist: false, not_shared_notice: true, blind_message: false,
  };

  for (const section of ALL_SECTION_KEYS) {
    it(`${section} → ${expectedDefaults[section] ? "visible" : "masqué"} par défaut`, () => {
      const r = resolveVisibility("invite_filtre", section);
      expect(r.shown).toBe(expectedDefaults[section]);
    });
  }
});

describe("invite_filtre — règle d'INTERSECTION (jamais union)", () => {
  it("le SOCLE reste visible même si tout est décoché", () => {
    const nothingChecked: SectionKey[] = [];
    expect(resolveVisibility("invite_filtre", "lead", nothingChecked).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "topchips", nothingChecked).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "donut", nothingChecked).shown).toBe(true);
  });

  it("une section 'never' reste invisible MÊME COCHÉE (wishlist, Art.9, adresse)", () => {
    const maliciouslyChecked = ALL_SECTION_KEYS; // tout coché, y compris l'interdit
    expect(resolveVisibility("invite_filtre", "wishlist", maliciouslyChecked).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "art9", maliciouslyChecked).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "facts_adresse", maliciouslyChecked).shown).toBe(false);
  });

  it("une section 'hidden' reste invisible même cochée (discovery, edit, nav…)", () => {
    const all = ALL_SECTION_KEYS;
    expect(resolveVisibility("invite_filtre", "discovery", all).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "edit_button", all).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "header_ring", all).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "constraints_row", all).shown).toBe(false);
  });

  it("cocher une section filtered_off la rend visible (dans la limite matrice)", () => {
    const checked: SectionKey[] = ["temperament_axes", "points_fixes", "facts_alimentaire"];
    expect(resolveVisibility("invite_filtre", "temperament_axes", checked).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "points_fixes", checked).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "facts_alimentaire", checked).shown).toBe(true);
  });

  it("décocher une section filtered_on la masque", () => {
    const onlyGifts: SectionKey[] = ["gifts"];
    expect(resolveVisibility("invite_filtre", "gifts", onlyGifts).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "radar", onlyGifts).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "avoid", onlyGifts).shown).toBe(false);
  });

  it("tout texte visible côté invite est en 3e personne", () => {
    for (const section of ALL_SECTION_KEYS) {
      const r = resolveVisibility("invite_filtre", section, ALL_SECTION_KEYS);
      if (r.shown && !["header_identity", "not_shared_notice"].includes(section)) {
        expect(r.thirdPerson, `${section} devrait être en 3e personne`).toBe(true);
      }
    }
  });
});

describe("contact_consulte — analyse seulement + contraintes sécurité", () => {
  it("l'analyse est visible, en 3e personne", () => {
    for (const s of ["lead", "gifts", "avoid", "points_fixes", "what_touches", "insights"] as SectionKey[]) {
      const r = resolveVisibility("contact_consulte", s);
      expect(r.shown).toBe(true);
      expect(r.thirdPerson).toBe(true);
    }
  });

  it("les visualisations agrégées sont visibles", () => {
    for (const s of ["donut", "radar", "temperament_axes", "temperament_modes", "lifestyle_axes"] as SectionKey[]) {
      expect(resolveVisibility("contact_consulte", s).shown).toBe(true);
    }
  });

  it("la rangée contraintes (allergies + régime) est VISIBLE — sécurité", () => {
    expect(resolveVisibility("contact_consulte", "constraints_row").shown).toBe(true);
  });

  it("les autres faits pratiques du proche sont masqués", () => {
    for (const s of ["facts_tailles", "facts_alimentaire", "facts_parfums", "facts_adresse", "facts_animaux", "facts_dates", "art9"] as SectionKey[]) {
      expect(resolveVisibility("contact_consulte", s).shown, `${s} devrait être masqué`).toBe(false);
    }
  });

  it("la wishlist du proche n'est JAMAIS visible", () => {
    expect(resolveVisibility("contact_consulte", "wishlist").shown).toBe(false);
    expect(resolveVisibility("contact_consulte", "wishlist", ALL_SECTION_KEYS).shown).toBe(false);
  });
});

describe("aveugle — AUCUN contenu sauf le message", () => {
  it("seul blind_message est visible", () => {
    for (const section of ALL_SECTION_KEYS) {
      const r = resolveVisibility("aveugle", section, ALL_SECTION_KEYS); // même tout coché
      expect(r.shown, `aveugle ne doit montrer que blind_message, pas ${section}`)
        .toBe(section === "blind_message");
    }
  });
});

describe("garanties anti-fuite transverses", () => {
  it("la wishlist n'est visible pour AUCUN type sur la fiche", () => {
    for (const view of ALL_VIEWS) {
      expect(
        resolveVisibility(view, "wishlist", ALL_SECTION_KEYS).shown,
        `wishlist ne doit jamais apparaître sur la fiche (${view})`,
      ).toBe(false);
    }
  });

  it("l'adresse de livraison n'est jamais visible pour un tiers", () => {
    for (const view of ["invite_filtre", "contact_consulte", "aveugle"] as ProfileView[]) {
      expect(resolveVisibility(view, "facts_adresse", ALL_SECTION_KEYS).shown).toBe(false);
    }
  });

  it("Art.9 n'est jamais visible ni cochable pour un tiers", () => {
    for (const view of ["invite_filtre", "contact_consulte", "aveugle"] as ProfileView[]) {
      expect(resolveVisibility(view, "art9", ALL_SECTION_KEYS).shown).toBe(false);
      expect(checkableSections(view)).not.toContain("art9");
    }
  });

  it("les sections never ne sont jamais dans les cochables", () => {
    for (const view of ALL_VIEWS) {
      const checkable = checkableSections(view);
      for (const s of checkable) {
        expect(VISIBILITY_MATRIX[view][s]).toMatch(/^filtered_(on|off)$/);
      }
    }
  });

  it("le socle invite_filtre = lead + topchips + donut exactement", () => {
    expect(socleSections("invite_filtre").sort()).toEqual(["donut", "lead", "topchips"]);
  });

  it("les autres types n'ont pas de socle (concept propre au partage)", () => {
    expect(socleSections("pilote")).toEqual([]);
    expect(socleSections("contact_consulte")).toEqual([]);
    expect(socleSections("aveugle")).toEqual([]);
  });
});
