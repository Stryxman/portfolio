import { describe, it, expect } from "vitest";
import { matrixAt, KEYFRAMES } from "../../src/lib/geometry/cycle";
import { sealMatrix } from "../../src/lib/geometry/families";
import { det, multiply, IDENTITY } from "../../src/lib/geometry/matrix";

const close = (a: readonly number[], b: readonly number[], p = 6) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, p));

describe("cycle du champ sombre", () => {
  it("commence et finit à l'identité, passe par chaque étape clé", () => {
    close(matrixAt(0), IDENTITY);
    close(matrixAt(1), IDENTITY);
    close(matrixAt(0.25), KEYFRAMES[1]!);
    close(matrixAt(0.5), KEYFRAMES[2]!);
  });
  it("est cyclique, y compris au-delà de 1 et en négatif", () => {
    close(matrixAt(1.25), KEYFRAMES[1]!);
    close(matrixAt(-0.75), KEYFRAMES[1]!);
  });
  it("varie sans saut (continuité) : l'écart entre deux pas diminue avec le pas", () => {
    const maxStep = (n: number) => {
      let max = 0;
      for (let i = 0; i < n; i++) {
        const a = matrixAt(i / n);
        const b = matrixAt((i + 1) / n);
        a.forEach((v, k) => (max = Math.max(max, Math.abs(v - b[k]!))));
      }
      return max;
    };
    // un saut garderait le même écart quel que soit le pas ; ici il est divisé par ~5
    expect(maxStep(2000)).toBeLessThan(0.02);
    expect(maxStep(2000)).toBeLessThan(maxStep(400) / 3);
  });
});

describe("familles de sceaux (DESIGN_BRIEF §5.3)", () => {
  const slugs = ["compagnon", "portfolio", "atelier-lumen", "x", ""];
  it("Claude Code : rotation et échelle (conforme, déterminant positif)", () => {
    for (const s of slugs) {
      const [a, b, c, d] = sealMatrix(s, "claude-code");
      expect(a).toBeCloseTo(d, 6);
      expect(b).toBeCloseTo(-c, 6);
      expect(det([a, b, c, d])).toBeGreaterThan(0);
    }
  });
  it("Codé main : cisaillement pur", () => {
    for (const s of slugs) {
      const [a, b, c, d] = sealMatrix(s, "hand-coded");
      expect([a, c, d]).toEqual([1, 0, 1]);
      expect(Math.abs(b)).toBeGreaterThanOrEqual(0.3);
    }
  });
  it("CMS : réflexion (déterminant négatif)", () => {
    for (const s of slugs) expect(det(sealMatrix(s, "cms"))).toBeLessThan(0);
  });
  it("Autre : orthogonale (M·Mᵀ = I)", () => {
    for (const s of slugs) {
      const [a, b, c, d] = sealMatrix(s, "other");
      close(multiply([a, b, c, d], [a, c, b, d]), IDENTITY, 6);
    }
  });
  it("est déterministe et dépend du slug", () => {
    expect(sealMatrix("compagnon", "claude-code")).toEqual(sealMatrix("compagnon", "claude-code"));
    expect(sealMatrix("compagnon", "claude-code")).not.toEqual(sealMatrix("portfolio", "claude-code"));
  });
});
