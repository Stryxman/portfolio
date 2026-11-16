import { describe, it, expect } from "vitest";
import {
  ARMS,
  GOLDEN_ANGLE,
  RINGS,
  SEEDS,
  armPoints,
  armTurn,
  isFibonacci,
  phylloPoint,
  regularPolygon,
  renderSpiral,
} from "../../src/lib/geometry/phyllo";
import {
  LATTICE,
  REST,
  blobRadius,
  lambertDisc,
  poseInto,
  renderSphere,
  sphereLattice,
  sphereSpiral,
  type Vec3,
} from "../../src/lib/geometry/sphere";

const at = (a: Float32Array, i: number): Vec3 => [a[i * 3]!, a[i * 3 + 1]!, a[i * 3 + 2]!];

describe("spirale de phyllotaxie", () => {
  it("l'angle d'or vaut 2π / φ², environ 137,508°", () => {
    const phi = (1 + Math.sqrt(5)) / 2;
    expect(GOLDEN_ANGLE).toBeCloseTo((2 * Math.PI) / phi ** 2, 12);
    expect((GOLDEN_ANGLE * 180) / Math.PI).toBeCloseTo(137.508, 3);
  });
  it("les graines restent dans le disque unité, rayon croissant, aire égale par graine", () => {
    let last = 0;
    for (let i = 0; i < SEEDS; i++) {
      const { r, x, y } = phylloPoint(i, SEEDS);
      expect(r).toBeGreaterThan(last);
      expect(r).toBeLessThan(1);
      expect(Math.hypot(x, y)).toBeCloseTo(r, 12);
      // r² croît d'un pas constant : chaque anneau entre deux graines a la même aire
      expect(r * r - last * last).toBeCloseTo(i === 0 ? 0.5 / SEEDS : 1 / SEEDS, 12);
      last = r;
    }
  });
  it("un polygone régulier a ses sommets à distance égale du centre", () => {
    const p = regularPolygon(10, 20, 5, 8, 0.3);
    expect(p).toHaveLength(8);
    for (const [x, y] of p) expect(Math.hypot(x - 10, y - 20)).toBeCloseTo(5, 12);
  });
  it("un bras de la famille 21 passe par les graines a, a + 21, a + 42…", () => {
    expect(Math.abs(armTurn(21))).toBeLessThan(0.2); // 21 × angle d'or ≈ 8 tours : le bras tourne peu
    const sub = 3;
    const pts = armPoints(3, 21, SEEDS, sub);
    for (let j = 0; j * sub < pts.length; j++) {
      const { x, y } = phylloPoint(3 + 21 * j, SEEDS);
      expect(pts[j * sub]![0]).toBeCloseTo(x, 9);
      expect(pts[j * sub]![1]).toBeCloseTo(y, 9);
    }
  });
  it("le rendu compte 233 polygones sombres, 21 bras et 9 calques de carrés clairs", () => {
    const { dark, light } = renderSpiral();
    expect(dark.match(/class="sp"/g)).toHaveLength(SEEDS);
    expect(light.match(/class="sp-arm /g)).toHaveLength(ARMS);
    expect(light.match(/class="sp-ring /g)).toHaveLength(RINGS + 1);
  });
  it("les graines de rang 1, 2, 3, 5, 8… portent l'accent", () => {
    const { dark } = renderSpiral();
    const marked = dark.slice(dark.indexOf("sp-accent"));
    expect(marked.match(/class="sp"/g)).toHaveLength(12);
    expect(marked).toContain('style="--i:0"'); // la graine de rang 1
    expect(marked).toContain('style="--i:232"'); // la graine de rang 233
    expect([1, 2, 3, 5, 8, 13, 233].every(isFibonacci)).toBe(true);
    expect([4, 6, 7, 100].some(isFibonacci)).toBe(false);
  });
  it("reste léger, décoratif, déterministe, sans couleur en dur ni identifiant", () => {
    const a = renderSpiral();
    const b = renderSpiral();
    expect(a).toEqual(b);
    expect(new TextEncoder().encode(a.dark + a.light).length).toBeLessThan(56320);
    for (const svg of [a.dark, a.light]) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}"|oklch|rgb\(|NaN| id="/i);
    }
  });
});

describe("sphère en treillis de Fibonacci", () => {
  it("les points sont sur la sphère unité, du pôle nord au pôle sud", () => {
    const pts = sphereLattice(LATTICE);
    let last = 1;
    for (let i = 0; i < LATTICE; i++) {
      const [x, y, z] = at(pts, i);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5);
      expect(z).toBeLessThan(last);
      last = z;
    }
  });
  it("la projection de Lambert du treillis redonne la spirale de l'accueil", () => {
    const pts = sphereLattice(SEEDS);
    for (let i = 0; i < SEEDS; i++) {
      const [dx, dy] = lambertDisc(at(pts, i));
      const { x, y } = phylloPoint(i, SEEDS);
      expect(dx).toBeCloseTo(x, 5);
      expect(dy).toBeCloseTo(y, 5);
    }
  });
  it("le blob reste dans 1 ± amp, et vaut 1 sans amplitude", () => {
    for (let k = 0; k < 500; k++) {
      const [x, y, z] = [Math.sin(k), Math.cos(k * 1.7), Math.sin(k * 0.3)];
      const r = blobRadius(x, y, z, k * 0.37, 0.2);
      expect(r).toBeGreaterThanOrEqual(0.8);
      expect(r).toBeLessThanOrEqual(1.2);
      expect(blobRadius(x, y, z, k, 0)).toBe(1);
    }
  });
  it("morph = 0 : disque à plat face à l'œil, identique à la spirale", () => {
    const base = sphereLattice(SEEDS);
    const out = new Float32Array(base.length);
    poseInto(base, out, { ...REST, morph: 0, spin: 0 });
    for (let i = 0; i < SEEDS; i++) {
      const [sx, sy, z] = at(out, i);
      const { x, y } = phylloPoint(i, SEEDS);
      expect(z).toBeCloseTo(0, 6);
      expect(sx).toBeCloseTo(x, 5);
      expect(sy).toBeCloseTo(-y, 5); // y descend à l'écran
    }
  });
  it("morph = 1 sans blob : sphère de rayon 1, vue en perspective (bord projeté à moins de 1,1)", () => {
    const base = sphereLattice(LATTICE);
    const out = new Float32Array(base.length);
    poseInto(base, out, { ...REST, amp: 0 });
    for (let i = 0; i < LATTICE; i++) {
      const [sx, sy, z] = at(out, i);
      expect(Math.abs(z)).toBeLessThanOrEqual(1.0001);
      expect(Math.hypot(sx, sy)).toBeLessThan(1.1);
    }
  });
  it("le pointeur gonfle le côté visé, pas le côté opposé", () => {
    const base = new Float32Array([0, 0, 1, 0, 0, -1]); // pôle nord, pôle sud
    const flat = new Float32Array(6);
    const pulled = new Float32Array(6);
    const pose = { t: 0, morph: 1, amp: 0, spin: 0, tilt: 0 };
    poseInto(base, flat, pose);
    poseInto(base, pulled, { ...pose, pull: [0, 0, 1], pullK: 0.3 });
    expect(pulled[2]!).toBeCloseTo(1.3, 5);
    expect(pulled[5]!).toBeCloseTo(flat[5]!, 6);
  });
  it("la spirale du traceur est continue : deux sommets voisins restent proches", () => {
    const line = sphereSpiral(1300, 34);
    for (let j = 1; j < 1300; j++) {
      const [a, b] = [at(line, j - 1), at(line, j)];
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.2);
    }
  });
  it("l'image fixe reste légère et sans couleur en dur", () => {
    const { dark, light } = renderSphere();
    expect(new TextEncoder().encode(dark + light).length).toBeLessThan(20480);
    for (const svg of [dark, light]) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}"|oklch|rgb\(|NaN| id="/i);
    }
  });
});
