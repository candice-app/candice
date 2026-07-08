// Refonte Profil V2 — tests des métriques déterministes (jamais de LLM).

import { describe, it, expect } from "vitest";
import { computePodium, computeWorksLevels, PODIUM_LABELS } from "./v2-metrics";
import type { FaceResult } from "./sheet-data";
import type { StyleRadar } from "./synthesis";

const reception: FaceResult = {
  dominant: ["MOT"],
  secondaire: ["CAD_C", "EXP"],
  tertiaire: ["GES", "SER"],
};

describe("computePodium — arbitrages 1 + 2", () => {
  it("7 barres, toutes les dimensions RÉELLES, jamais « Présence »", () => {
    const rows = computePodium(reception);
    expect(rows).toHaveLength(7);
    expect(rows.map(r => r.dim).sort()).toEqual(["CAD_C", "CAD_S", "EXP", "GES", "MOT", "SER", "SUR"]);
    expect(rows.every(r => r.label !== "Présence")).toBe(true);
  });

  it("libellés verrouillés (dont GES = « Esthétique · qualité »)", () => {
    expect(PODIUM_LABELS.GES).toBe("Esthétique · qualité");
    expect(PODIUM_LABELS.MOT).toBe("Mots justes");
    expect(PODIUM_LABELS.CAD_S).toBe("Attentions symboliques");
  });

  it("barème de largeurs validé : 96 · 84/74 · 58/46/40 · 24", () => {
    const rows = computePodium(reception);
    const byDim = Object.fromEntries(rows.map(r => [r.dim, r]));
    expect(byDim.MOT.width).toBe(96);
    expect(byDim.MOT.intensityLabel).toBe("Dominant");
    expect([byDim.CAD_C.width, byDim.EXP.width].sort((a, b) => b - a)).toEqual([84, 74]);
    expect(byDim.GES.width).toBe(58);
    expect(byDim.SER.width).toBe(46);
    expect(byDim.CAD_S.width).toBe(24);
    expect(byDim.CAD_S.intensityLabel).toBe("À doser");
    expect(byDim.SUR.width).toBe(24);
  });

  it("tri : dominant → très présent → présent → à doser", () => {
    const rows = computePodium(reception);
    expect(rows[0].dim).toBe("MOT");
    expect(rows[rows.length - 1].intensity).toBe("a_doser");
  });

  it("null → vide (jamais de podium fabriqué)", () => {
    expect(computePodium(null)).toEqual([]);
  });
});

describe("computeWorksLevels — arbitrage 9 (niveaux jamais décidés par le LLM)", () => {
  const radar: StyleRadar = {
    precision: 80, emotion: 60, surprise: 30, esthetique: 70,
    utilite: 50, temps: 66, discretion: 40,
  };

  it("6 niveaux dérivés du radar + exigenceStanding", () => {
    const levels = computeWorksLevels(radar, { exigenceStanding: { score: 60, intensity: 1 } });
    expect(levels).toEqual({
      beau: "tres_fort",        // esthetique 70
      personnel: "tres_fort",   // precision 80
      experientiel: "tres_fort",// temps 66
      utile: "fort",            // utilite 50
      premium: "tres_fort",     // 50 + 60*0.35 = 71
      surprise: "a_doser",      // surprise 30
    });
  });

  it("sans radar → null (jamais de niveaux fabriqués)", () => {
    expect(computeWorksLevels(null, null)).toBeNull();
  });

  it("exigence simplicité → premium à doser", () => {
    const levels = computeWorksLevels(radar, { exigenceStanding: { score: -80, intensity: 1 } });
    expect(levels?.premium).toBe("a_doser"); // 50 - 28 = 22
  });
});
