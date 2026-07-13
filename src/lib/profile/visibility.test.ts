// Phase D — tests de la matrice V2. Objectif inchangé : AUCUNE fuite
// possible, quel que soit le type de fiche et les cases cochées.

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

describe("VISIBILITY_MATRIX V2 — complétude", () => {
  it("couvre chaque type × chaque section (aucun trou)", () => {
    for (const view of ALL_VIEWS) {
      for (const section of ALL_SECTION_KEYS) {
        expect(VISIBILITY_MATRIX[view][section], `matrice incomplète : ${view} × ${section}`).toBeDefined();
      }
    }
  });

  it("le type lien_public n'existe pas (décision produit)", () => {
    expect(ALL_VIEWS).not.toContain("lien_public");
    expect(Object.keys(VISIBILITY_MATRIX)).toHaveLength(4);
  });
});

describe("pilote — tout visible sauf hors-écran", () => {
  it("modules de la fiche visibles en 2e personne", () => {
    for (const s of ["summary", "podium", "understood", "deep_touch", "deep_loved",
      "deep_pleasure", "deep_miss", "works", "monde_tables", "territoire", "univers",
      "facts_tailles", "art9", "viser", "bottom_ctas"] as SectionKey[]) {
      const r = resolveVisibility("pilote", s);
      expect(r.shown, s).toBe(true);
      expect(r.thirdPerson).toBe(false);
    }
  });

  it("wishlist vit sur son propre écran, constraints_row redondante", () => {
    expect(resolveVisibility("pilote", "wishlist").shown).toBe(false);
    expect(resolveVisibility("pilote", "constraints_row").shown).toBe(false);
  });
});

describe("invite_filtre — socle + intersection", () => {
  it("SOCLE = résumé + podium exactement (validé)", () => {
    expect(socleSections("invite_filtre").sort()).toEqual(["podium", "summary"]);
  });

  it("le socle reste visible même tout décoché", () => {
    expect(resolveVisibility("invite_filtre", "summary", []).shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "podium", []).shown).toBe(true);
  });

  it("défauts : deep_loved, wishlist et facts_* décochés ; le reste de l'analyse coché", () => {
    expect(resolveVisibility("invite_filtre", "deep_loved").shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "wishlist").shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "facts_tailles").shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "understood").shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "works").shown).toBe(true);
    expect(resolveVisibility("invite_filtre", "territoire").shown).toBe(true);
  });

  it("wishlist JAMAIS partagée aux tiers (retirée du partage — clôture V2)", () => {
    expect(checkableSections("invite_filtre")).not.toContain("wishlist");
    // never : invisible même explicitement « cochée » dans le scope
    expect(resolveVisibility("invite_filtre", "wishlist", ["wishlist"]).shown).toBe(false);
    expect(socleSections("invite_filtre")).not.toContain("wishlist");
  });

  it("never reste invisible MÊME COCHÉ (art9, adresse)", () => {
    const all = ALL_SECTION_KEYS;
    expect(resolveVisibility("invite_filtre", "art9", all).shown).toBe(false);
    expect(resolveVisibility("invite_filtre", "facts_adresse", all).shown).toBe(false);
  });

  it("hidden reste invisible même coché (viser, bottom_ctas, header_ring)", () => {
    const all = ALL_SECTION_KEYS;
    for (const s of ["viser", "bottom_ctas", "header_ring", "constraints_row"] as SectionKey[]) {
      expect(resolveVisibility("invite_filtre", s, all).shown, s).toBe(false);
    }
  });

  it("tout texte visible côté invité est en 3e personne (hors identité)", () => {
    for (const section of ALL_SECTION_KEYS) {
      const r = resolveVisibility("invite_filtre", section, ALL_SECTION_KEYS);
      if (r.shown && section !== "header_identity") {
        expect(r.thirdPerson, section).toBe(true);
      }
    }
  });
});

describe("invite_filtre — placeholders notShared (option A conservée)", () => {
  it("cochable refusée → notShared ; cochée → non ; never → jamais de placeholder", () => {
    const only: SectionKey[] = ["deep_pleasure"];
    expect(resolveVisibility("invite_filtre", "works", only).notShared).toBe(true);
    expect(resolveVisibility("invite_filtre", "deep_miss", only).notShared).toBe(true);
    expect(resolveVisibility("invite_filtre", "deep_pleasure", only).notShared).toBe(false);
    // wishlist (never) : ni montrée, ni placeholder « non partagé »
    expect(resolveVisibility("invite_filtre", "wishlist", only).notShared).toBe(false);
  });

  it("hidden/never n'ont JAMAIS de placeholder ; le socle non plus", () => {
    for (const s of ["art9", "facts_adresse", "viser", "summary", "podium"] as SectionKey[]) {
      expect(resolveVisibility("invite_filtre", s, []).notShared, s).toBe(false);
    }
  });

  it("hors invite_filtre, jamais de notShared", () => {
    for (const view of ["pilote", "contact_consulte", "aveugle"] as ProfileView[]) {
      for (const section of ALL_SECTION_KEYS) {
        expect(resolveVisibility(view, section, []).notShared, `${view}×${section}`).toBe(false);
      }
    }
  });
});

describe("contact_consulte — analyse seulement + sécurité", () => {
  it("analyse visible en 3e personne, podium/works agrégés visibles", () => {
    for (const s of ["summary", "deep_touch", "deep_miss", "univers"] as SectionKey[]) {
      const r = resolveVisibility("contact_consulte", s);
      expect(r.shown, s).toBe(true);
      expect(r.thirdPerson, s).toBe(true);
    }
    expect(resolveVisibility("contact_consulte", "podium").shown).toBe(true);
    expect(resolveVisibility("contact_consulte", "works").shown).toBe(true);
  });

  it("contraintes sécurité visibles, faits masqués, wishlist jamais", () => {
    expect(resolveVisibility("contact_consulte", "constraints_row").shown).toBe(true);
    expect(resolveVisibility("contact_consulte", "facts_tailles").shown).toBe(false);
    expect(resolveVisibility("contact_consulte", "wishlist", ALL_SECTION_KEYS).shown).toBe(false);
  });
});

describe("aveugle — AUCUN contenu sauf le message", () => {
  it("seul blind_message est visible, même tout coché", () => {
    for (const section of ALL_SECTION_KEYS) {
      expect(resolveVisibility("aveugle", section, ALL_SECTION_KEYS).shown, section)
        .toBe(section === "blind_message");
    }
  });
});

describe("garanties anti-fuite transverses", () => {
  it("l'adresse et l'Art.9 ne sont JAMAIS visibles pour un tiers", () => {
    for (const view of ["invite_filtre", "contact_consulte", "aveugle"] as ProfileView[]) {
      expect(resolveVisibility(view, "facts_adresse", ALL_SECTION_KEYS).shown).toBe(false);
      expect(resolveVisibility(view, "art9", ALL_SECTION_KEYS).shown).toBe(false);
      expect(checkableSections(view)).not.toContain("art9");
    }
  });

  it("les sections cochables sont exactement les filtered_*", () => {
    for (const view of ALL_VIEWS) {
      for (const s of checkableSections(view)) {
        expect(VISIBILITY_MATRIX[view][s]).toMatch(/^filtered_(on|off)$/);
      }
    }
  });

  it("les autres types n'ont pas de socle", () => {
    expect(socleSections("pilote")).toEqual([]);
    expect(socleSections("contact_consulte")).toEqual([]);
    expect(socleSections("aveugle")).toEqual([]);
  });
});
