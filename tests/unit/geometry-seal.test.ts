import { describe, it, expect } from "vitest";
import { SEAL_SEEDS, renderSeal, sealGeometry } from "../../src/lib/geometry/seal";
import { toPath } from "../../src/lib/geometry/svg";

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

describe("sceau", () => {
  const provenances = ["claude-code", "claude", "hand-coded", "cms", "other"] as const;
  it("compte 34 graines dans le cadre, sans NaN", () => {
    for (const p of provenances) {
      const g = sealGeometry("compagnon", p);
      expect(g.seeds).toHaveLength(SEAL_SEEDS);
      expect(g.squares).toHaveLength(SEAL_SEEDS);
      const nums = [...g.seeds.flat(2), ...g.squares.flat(2)];
      expect(nums.every((v) => Number.isFinite(v) && v >= 0 && v <= 64)).toBe(true);
    }
  });
  it("la provenance choisit la forme : carrés pour Codé main, trois formes pour Claude Code", () => {
    expect(new Set(sealGeometry("x", "hand-coded").seeds.map((s) => s.length))).toEqual(
      new Set([4]),
    );
    expect(new Set(sealGeometry("x", "claude-code").seeds.map((s) => s.length))).toEqual(
      new Set([3, 5, 8]),
    );
  });
  it("l'accent suit un bras de la spirale : graines espacées de 5 ou de 8", () => {
    for (const slug of ["compagnon", "portfolio", "adpulse", "veille-ia"]) {
      const { accents } = sealGeometry(slug, "claude-code");
      expect(accents.length).toBeGreaterThanOrEqual(4);
      const step = accents[1]! - accents[0]!;
      expect([5, 8]).toContain(step);
      accents.slice(1).forEach((a, k) => expect(a - accents[k]!).toBe(step));
    }
  });
  it("est décoratif, sans couleur en dur, sans identifiant, et léger", () => {
    const { dark, light } = renderSeal("compagnon", "claude-code");
    for (const svg of [dark, light]) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}"|oklch|rgb\(| id="/i);
      expect(new TextEncoder().encode(svg).length).toBeLessThan(4096);
    }
  });
  it("est stable d'un build à l'autre (instantané) et dépend du slug", () => {
    expect(renderSeal("compagnon", "claude-code")).toMatchSnapshot();
    expect(renderSeal("compagnon", "claude-code").dark).not.toBe(
      renderSeal("portfolio", "claude-code").dark,
    );
  });
});
