import { describe, it, expect } from "vitest";

// CANARY CI — ÉCHEC VOLONTAIRE, temporaire. But : prouver que le filet (GitHub Actions)
// attrape un test cassé avant qu'il ne dorme sur main. Retiré immédiatement au commit suivant.
describe("canary CI (échec volontaire — doit faire ROUGIR la CI)", () => {
  it("1 vaut 2 (faux exprès)", () => {
    expect(1).toBe(2);
  });
});
