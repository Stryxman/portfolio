import { describe, it, expect } from "vitest";
import { fieldGeometry, renderField } from "../../src/lib/geometry/field";

describe("champ statique", () => {
  it("t = 0 : la grille sombre est l'identité (lignes parfaitement verticales ou horizontales)", () => {
    const { lines } = fieldGeometry("dark", 1440, 900, 0);
    for (const [x1, y1, x2, y2] of lines) expect(Math.abs(x1 - x2) < 1e-9 || Math.abs(y1 - y2) < 1e-9).toBe(true);
  });
  it("les vecteurs de base î et ĵ ont chacun une pointe de flèche (DESIGN_BRIEF §5.1)", () => {
    const { accents } = fieldGeometry("dark", 1440, 900, 0);
    expect(accents).toHaveLength(6); // 2 traits + 2 × 2 segments de pointe
    const [, , ix, iy] = accents[0]!;
    // chaque segment de pointe part de l'extrémité de son vecteur
    expect(accents.filter(([x1, y1]) => Math.abs(x1 - ix) < 1e-9 && Math.abs(y1 - iy) < 1e-9)).toHaveLength(2);
  });
  it("la grille claire compte 14 × 9 carrés dont 1 à 3 accents", () => {
    const g = fieldGeometry("light", 1440, 900, 0);
    expect(g.squares!.length + g.accents.length).toBe(14 * 9);
    expect(g.accents.length).toBeGreaterThanOrEqual(1);
    expect(g.accents.length).toBeLessThanOrEqual(3);
  });
  it("reste léger, décoratif et sans couleur en dur", () => {
    const { dark, light } = renderField();
    expect(new TextEncoder().encode(dark + light).length).toBeLessThan(20480);
    for (const svg of [dark, light]) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}"|oklch|rgb\(/i);
    }
  });
  it("deux instances n'ont aucun identifiant en commun", () => {
    const ids = (svg: string) => [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    const a = renderField(1440, 900, "a");
    const b = renderField(1440, 900, "b");
    const common = ids(a.dark + a.light).filter((id) => ids(b.dark + b.light).includes(id));
    expect(common).toEqual([]);
  });
  it("reste lisible en portrait : cadrage à droite, vecteurs et accents dans la zone visible", () => {
    // écran 390 × 844 : avec « xMaxYMid slice », seule la bande x ≥ 1440 - 900 × 390 / 844 reste visible
    const visibleFrom = 1440 - (900 * 390) / 844;
    const { accents } = fieldGeometry("dark", 1440, 900, 0);
    expect(accents[0]![0]).toBeGreaterThan(visibleFrom);
    const light = fieldGeometry("light", 1440, 900, 0);
    for (const sq of light.accents) expect(Math.min(...sq.map(([x]) => x))).toBeGreaterThan(visibleFrom);
    expect(renderField().dark).toContain('preserveAspectRatio="xMaxYMid slice"');
  });
  it("est identique d'un appel à l'autre", () => {
    expect(renderField()).toEqual(renderField());
  });
});
