import { describe, it, expect } from "vitest";
import {
  IDENTITY,
  apply,
  det,
  lerpMat,
  multiply,
  reflection,
  rotation,
  scale,
  shear,
} from "../../src/lib/geometry/matrix";
import { cubicBezier, easeInOut } from "../../src/lib/geometry/ease";
import { hashString, mulberry32, noise2D } from "../../src/lib/geometry/random";

const close = (a: readonly number[], b: readonly number[]) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));

describe("matrices", () => {
  it("applique rotation, cisaillement et échelle aux vecteurs colonnes", () => {
    close(apply(rotation(Math.PI / 2), [1, 0]), [0, 1]);
    close(apply(shear(0.5), [0, 2]), [1, 2]);
    close(apply(scale(2, 3), [1, 1]), [2, 3]);
  });
  it("compose dans l'ordre mathématique (multiply(m, n) applique n puis m)", () => {
    close(apply(multiply(scale(2, 1), rotation(Math.PI / 2)), [1, 0]), [0, 1]);
    close(apply(multiply(rotation(Math.PI / 2), scale(2, 1)), [1, 0]), [0, 2]);
  });
  it("une réflexion a un déterminant -1, une rotation +1", () => {
    expect(det(reflection(0.3))).toBeCloseTo(-1, 6);
    expect(det(rotation(1.1))).toBeCloseTo(1, 6);
  });
  it("interpole composante par composante", () => {
    close(lerpMat(IDENTITY, scale(3, 3), 0.5), [2, 0, 0, 2]);
  });
});

describe("courbes", () => {
  it("part de 0 et arrive à 1", () => {
    expect(easeInOut(0)).toBeCloseTo(0, 6);
    expect(easeInOut(1)).toBeCloseTo(1, 6);
  });
  it("est monotone et symétrique pour une courbe symétrique", () => {
    const ease = cubicBezier(0.42, 0, 0.58, 1);
    expect(ease(0.5)).toBeCloseTo(0.5, 3);
    let prev = -1;
    for (let i = 0; i <= 50; i++) {
      const v = easeInOut(i / 50);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("aléatoire déterministe", () => {
  it("même entrée, même empreinte ; chaîne vide stable", () => {
    expect(hashString("compagnon")).toBe(hashString("compagnon"));
    expect(hashString("compagnon")).not.toBe(hashString("portfolio"));
    expect(Number.isInteger(hashString(""))).toBe(true);
  });
  it("le PRNG est reproductible et reste dans [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("le bruit reste dans [-1, 1] et varie continûment", () => {
    const n = noise2D(7);
    for (let i = 0; i < 200; i++) {
      const x = i * 0.137;
      const v = n(x, 1.3);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
      expect(Math.abs(n(x + 0.001, 1.3) - v)).toBeLessThan(0.02);
    }
  });
});
