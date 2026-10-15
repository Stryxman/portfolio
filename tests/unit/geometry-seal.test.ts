import { describe, it, expect } from "vitest";
import { renderSeal, sealDisorder, sealGeometry } from "../../src/lib/geometry/seal";
import { toPath } from "../../src/lib/geometry/svg";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("toPath", () => {
  it("arrondit au dixième et enchaîne les segments contigus", () => {
    expect(
      toPath([
        [0, 0, 10.04, 0],
        [10.04, 0, 10, 5.55],
      ]),
    ).toBe("M0 0L10 0L10 5.6");
  });
});

describe("désordre des carrés (monde clair)", () => {
  it("Codé main : faible et régulier", () => {
    const d = sealDisorder("x", "hand-coded").flat();
    expect(Math.max(...d)).toBeLessThan(0.2);
    expect(Math.max(...d) - Math.min(...d)).toBeLessThan(0.05);
  });
  it("CMS : croît avec les rangées", () => {
    const rows = sealDisorder("x", "cms").map(mean);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!).toBeGreaterThan(rows[i - 1]!);
  });
  it("Claude Code : regroupé (un foyer nettement plus agité que la moyenne)", () => {
    const d = sealDisorder("x", "claude-code").flat();
    expect(Math.max(...d)).toBeGreaterThan(mean(d) * 2);
  });
  it("Autre : dispersé (plusieurs carrés agités)", () => {
    const d = sealDisorder("compagnon", "other").flat();
    expect(d.filter((v) => v > 0.5).length).toBeGreaterThanOrEqual(3);
  });
});

describe("sceau", () => {
  it("ne produit aucun NaN", () => {
    for (const p of ["claude-code", "hand-coded", "cms", "other"] as const) {
      const g = sealGeometry("compagnon", p);
      const nums = [...g.lattice.flat(), ...g.basis.flat(), ...g.squares.flat(2)];
      expect(nums.every(Number.isFinite)).toBe(true);
    }
  });
  it("est décoratif, sans couleur en dur, et léger", () => {
    const { dark, light } = renderSeal("compagnon", "claude-code");
    for (const svg of [dark, light]) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}"|oklch|rgb\(/i);
      expect(new TextEncoder().encode(svg).length).toBeLessThan(4096);
    }
  });
  it("est stable d'un build à l'autre (instantané) et dépend du slug", () => {
    expect(renderSeal("compagnon", "claude-code")).toMatchSnapshot();
    expect(renderSeal("compagnon", "claude-code").dark).not.toBe(renderSeal("portfolio", "claude-code").dark);
  });
});
