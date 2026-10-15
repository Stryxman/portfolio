# Phase 3 : géométrie

> Détail TDD de la Phase 3 de [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). Spec : [DESIGN_BRIEF §2, §5](../DESIGN_BRIEF.md). Branche `phase-3`. Exécution native, `/code-review` en fin de phase, puis revue visuelle (`impeccable` critique, sans CLI).

**Livrable :** la géométrie du monde « Ordre et transformation » existe en fonctions pures et déterministes : matrices, courbes, bruit, graine. Elle est rendue côté serveur en deux composants sans JavaScript :
- **`Seal.astro`**, le sceau d'un projet, en version sombre et claire ;
- **`FieldStatic.astro`**, la première image du champ, posée sur l'accueil.

Une planche de revue visible **en dev uniquement** montre tout cela. La Phase 5 (WebGL) réutilisera exactement ces fonctions, donc la première image animée sera identique à l'image statique.

**Préfixe shell (Claude) :** `export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"`.

## Décisions propres à cette phase

- **Convention de matrice :** `Mat2 = readonly [a, b, c, d]` pour `[[a, b], [c, d]]`, appliquée aux vecteurs colonnes (`x' = a·x + b·y`, `y' = c·x + d·y`). En SVG, l'axe y descend : les sommets sont transformés autour du centre de la vue.
- **Une seule source de géométrie :** `fieldGeometry()` et `sealGeometry()` renvoient des segments et polygones en coordonnées de vue. Le rendu SVG (`toPath`) n'est qu'un formateur, que le moteur WebGL remplacera en Phase 5.
- **Couleurs par `currentColor` :** le SVG ne contient aucune couleur en dur. Les classes Tailwind (`text-line`, `text-line-strong`, `text-accent`) appliquent les tokens, ce qui suit le thème sans dupliquer les valeurs.
- **Deux SVG par composant**, un par monde, alternés par `dark:hidden` / `hidden dark:block` : zéro JavaScript, et le changement de thème est instantané.
- **Coordonnées arrondies au dixième** pour garder les SVG légers. Budgets testés : sceau < 4 Ko par monde, champ < 20 Ko pour les deux mondes réunis.
- **Planche de revue :** la route `src/pages/dev/[planche].astro` a un `getStaticPaths()` qui renvoie `[]` hors dev. Rien n'est donc généré en production.

## Points de vigilance de la phase

1. **Déterminisme :** le même slug produit le même SVG à chaque build (test d'instantané), sinon chaque déploiement modifierait les images.
2. **Slug inconnu ou vide :** l'empreinte de `""` est stable et ne plante pas. Tâche 3.1.
3. **Lignes hors cadre :** une matrice qui étire la grille ne doit pas déborder du sceau (`clipPath`), ni produire de `NaN` dans le SVG. Tâche 3.3.
4. **Contraste des lignes du champ derrière le texte :** le champ s'atténue derrière la colonne de texte (masque en dégradé), et le texte du hero garde son contraste AA (test axe sur l'accueil). Tâche 3.4.
5. **Accessibilité :** les SVG sont décoratifs (`aria-hidden="true"`, `focusable="false"`) et n'ajoutent rien à l'arbre d'accessibilité. Tâches 3.3 et 3.4.

---

### Tâche 3.1 : matrices, courbe d'animation, graine et bruit

**Fichiers :** créer `src/lib/geometry/matrix.ts`, `src/lib/geometry/ease.ts`, `src/lib/geometry/random.ts`, `tests/unit/geometry-core.test.ts`.
**Produit :**
- `type Mat2 = readonly [number, number, number, number]` ; `type Vec2 = readonly [number, number]` ;
- `IDENTITY`, `rotation(rad)`, `shear(k)`, `scale(sx, sy)`, `reflection(angleRad)`, `multiply(m, n)`, `apply(m, v)`, `lerpMat(m, n, t)`, `det(m)` ;
- `cubicBezier(x1, y1, x2, y2): (t: number) => number` et `easeInOut` (= `cubicBezier(0.77, 0, 0.175, 1)`, DESIGN_BRIEF §4.1) ;
- `hashString(s): number` (FNV-1a, entier 32 bits non signé) ; `mulberry32(seed): () => number` dans `[0, 1)` ; `noise2D(seed): (x, y) => number` dans `[-1, 1]`, continu.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { IDENTITY, apply, det, lerpMat, multiply, reflection, rotation, scale, shear } from "../../src/lib/geometry/matrix";
  import { cubicBezier, easeInOut } from "../../src/lib/geometry/ease";
  import { hashString, mulberry32, noise2D } from "../../src/lib/geometry/random";

  const close = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));

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
  ```
- [ ] Implémentation `src/lib/geometry/matrix.ts`
  ```ts
  // Mat2 = [[a, b], [c, d]] appliquée aux vecteurs colonnes : x' = a·x + b·y, y' = c·x + d·y.
  export type Mat2 = readonly [number, number, number, number];
  export type Vec2 = readonly [number, number];

  export const IDENTITY: Mat2 = [1, 0, 0, 1];
  export const rotation = (r: number): Mat2 => [Math.cos(r), -Math.sin(r), Math.sin(r), Math.cos(r)];
  export const shear = (k: number): Mat2 => [1, k, 0, 1];
  export const scale = (sx: number, sy: number): Mat2 => [sx, 0, 0, sy];
  export const reflection = (r: number): Mat2 => [Math.cos(2 * r), Math.sin(2 * r), Math.sin(2 * r), -Math.cos(2 * r)];
  export const multiply = ([a, b, c, d]: Mat2, [e, f, g, h]: Mat2): Mat2 => [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
  export const apply = ([a, b, c, d]: Mat2, [x, y]: Vec2): Vec2 => [a * x + b * y, c * x + d * y];
  export const lerpMat = (m: Mat2, n: Mat2, t: number): Mat2 => [
    m[0] + (n[0] - m[0]) * t,
    m[1] + (n[1] - m[1]) * t,
    m[2] + (n[2] - m[2]) * t,
    m[3] + (n[3] - m[3]) * t,
  ];
  export const det = ([a, b, c, d]: Mat2) => a * d - b * c;
  ```
- [ ] Implémentation `src/lib/geometry/ease.ts`
  ```ts
  // Courbe de Bézier cubique CSS : on résout x(s) = t par Newton puis dichotomie, et on renvoie y(s).
  export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
    const bez = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3;
    const dBez = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * p1 + 6 * (1 - s) * s * (p2 - p1) + 3 * s ** 2 * (1 - p2);
    return (t: number) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let s = t;
      for (let i = 0; i < 8; i++) {
        const dx = dBez(s, x1, x2);
        if (Math.abs(dx) < 1e-6) break;
        s -= (bez(s, x1, x2) - t) / dx;
      }
      if (s < 0 || s > 1 || Math.abs(bez(s, x1, x2) - t) > 1e-5) {
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 40; i++) {
          s = (lo + hi) / 2;
          if (bez(s, x1, x2) < t) lo = s;
          else hi = s;
        }
      }
      return bez(s, y1, y2);
    };
  }

  // --ease-in-out du DESIGN_BRIEF §4.1 (déplacements et transformations du champ)
  export const easeInOut = cubicBezier(0.77, 0, 0.175, 1);
  ```
- [ ] Implémentation `src/lib/geometry/random.ts`
  ```ts
  // FNV-1a 32 bits : empreinte stable d'un slug (même entrée → même sceau à chaque build)
  export function hashString(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Bruit de valeur 2D lissé (interpolation smoothstep entre nœuds entiers), dans [-1, 1]
  export function noise2D(seed: number): (x: number, y: number) => number {
    const node = (ix: number, iy: number) => {
      const r = mulberry32(hashString(`${seed}:${ix}:${iy}`))();
      return r * 2 - 1;
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    return (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = smooth(x - ix);
      const fy = smooth(y - iy);
      const top = node(ix, iy) + (node(ix + 1, iy) - node(ix, iy)) * fx;
      const bottom = node(ix, iy + 1) + (node(ix + 1, iy + 1) - node(ix, iy + 1)) * fx;
      return top + (bottom - top) * fy;
    };
  }
  ```
- [ ] `pnpm test` → vert. Commit `feat(geometry): matrices, courbes, graine et bruit déterministes`.

### Tâche 3.2 : cycle de transformation et familles de matrices

**Fichiers :** créer `src/lib/geometry/cycle.ts`, `src/lib/geometry/families.ts`, `tests/unit/geometry-cycle.test.ts`.
**Produit :**
- `KEYFRAMES: Mat2[]` = identité → rotation 30° → cisaillement 0,6 → échelle sur vecteurs propres `[1.4, 0.4, 0.4, 0.8]` → identité ;
- `matrixAt(progress: number): Mat2` (`progress` modulo 1, avec `easeInOut` appliqué à chaque segment) ;
- `type Provenance = "claude-code" | "hand-coded" | "cms" | "other"` ;
- `sealMatrix(slug: string, provenance: Provenance): Mat2`.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { matrixAt, KEYFRAMES } from "../../src/lib/geometry/cycle";
  import { sealMatrix } from "../../src/lib/geometry/families";
  import { det, multiply, IDENTITY } from "../../src/lib/geometry/matrix";

  const close = (a: readonly number[], b: readonly number[], p = 6) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, p));

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
    it("varie sans saut (continuité)", () => {
      for (let i = 0; i < 400; i++) {
        const a = matrixAt(i / 400);
        const b = matrixAt((i + 1) / 400);
        a.forEach((v, k) => expect(Math.abs(v - b[k]!)).toBeLessThan(0.05));
      }
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
  ```
- [ ] Implémentation `src/lib/geometry/cycle.ts`
  ```ts
  import { easeInOut } from "./ease";
  import { IDENTITY, lerpMat, rotation, shear, type Mat2 } from "./matrix";

  // DESIGN_BRIEF §5.1 : identité → rotation 30° → cisaillement → échelle sur les vecteurs propres → identité
  export const KEYFRAMES: Mat2[] = [IDENTITY, rotation(Math.PI / 6), shear(0.6), [1.4, 0.4, 0.4, 0.8], IDENTITY];

  // progress est cyclique : 0, 1, 2… valent l'identité ; 1.25 équivaut à 0.25 ; une valeur négative est ramenée dans [0, 1)
  export function matrixAt(progress: number): Mat2 {
    const segments = KEYFRAMES.length - 1;
    const p = ((progress % 1) + 1) % 1;
    const i = Math.floor(p * segments);
    const local = easeInOut(p * segments - i);
    return lerpMat(KEYFRAMES[i]!, KEYFRAMES[i + 1]!, local);
  }
  ```
- [ ] Implémentation `src/lib/geometry/families.ts`
  ```ts
  import { hashString, mulberry32 } from "./random";
  import { multiply, reflection, rotation, scale, shear, type Mat2 } from "./matrix";

  export type Provenance = "claude-code" | "hand-coded" | "cms" | "other";

  const range = (r: () => number, min: number, max: number) => min + (max - min) * r();

  // DESIGN_BRIEF §5.3 : la provenance choisit la famille, le slug choisit les paramètres
  export function sealMatrix(slug: string, provenance: Provenance): Mat2 {
    const r = mulberry32(hashString(`${provenance}:${slug}`));
    switch (provenance) {
      case "claude-code": {
        const s = range(r, 0.75, 1.25);
        return multiply(scale(s, s), rotation(range(r, Math.PI / 12, Math.PI / 3)));
      }
      case "hand-coded":
        return shear((r() < 0.5 ? -1 : 1) * range(r, 0.3, 0.9));
      case "cms":
        return reflection(range(r, 0, Math.PI));
      case "other": {
        const rot = rotation(range(r, 0, 2 * Math.PI));
        return r() < 0.5 ? rot : multiply(reflection(range(r, 0, Math.PI)), rot);
      }
    }
  }
  ```
- [ ] `pnpm test` → vert. Commit `feat(geometry): cycle de transformation et familles de matrices des sceaux`.

### Tâche 3.3 : géométrie et rendu des sceaux

**Fichiers :** créer `src/lib/geometry/seal.ts`, `src/lib/geometry/svg.ts`, `src/components/Seal.astro`, `tests/unit/geometry-seal.test.ts`.
**Produit :**
- `type Segment = readonly [number, number, number, number]` (x1, y1, x2, y2) ; `type Polygon = readonly Vec2[]` ;
- `toPath(segments: Segment[]): string` (`M x y L x y`, au dixième, segments consécutifs fusionnés) ; `polygonsToPath(polys: Polygon[]): string` (`M … L … Z`) ;
- `sealDisorder(slug, provenance, n = 6): number[][]` (amplitude de désordre par carré, dans `[0, 1]`) ;
- `sealGeometry(slug, provenance): { lattice: Segment[]; basis: [Segment, Segment]; squares: Polygon[]; accentSquare: number }` dans une vue 64 × 64 ;
- `renderSeal(slug, provenance): { dark: string; light: string }` (balisage SVG complet, `aria-hidden="true"`, `focusable="false"`, couleurs en `currentColor`) ;
- `<Seal slug provenance size?={64} class? />`.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { renderSeal, sealDisorder, sealGeometry } from "../../src/lib/geometry/seal";
  import { toPath } from "../../src/lib/geometry/svg";

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  describe("toPath", () => {
    it("arrondit au dixième et enchaîne les segments contigus", () => {
      expect(toPath([[0, 0, 10.04, 0], [10.04, 0, 10, 5.55]])).toBe("M0 0L10 0L10 5.6");
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
    it("Autre : dispersé (plusieurs carrés agités non adjacents)", () => {
      const d = sealDisorder("compagnon", "other").flat();
      expect(d.filter((v) => v > 0.5).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("sceau", () => {
    it("ne produit aucun NaN et reste dans la vue 64 × 64 (avant découpe)", () => {
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
        expect(svg).not.toMatch(/#[0-9a-f]{3,6}|oklch|rgb\(/i);
        expect(new TextEncoder().encode(svg).length).toBeLessThan(4096);
      }
    });
    it("est stable d'un build à l'autre (instantané) et dépend du slug", () => {
      expect(renderSeal("compagnon", "claude-code")).toMatchSnapshot();
      expect(renderSeal("compagnon", "claude-code").dark).not.toBe(renderSeal("portfolio", "claude-code").dark);
    });
  });
  ```
- [ ] Implémentation `src/lib/geometry/svg.ts`
  ```ts
  import type { Vec2 } from "./matrix";

  export type Segment = readonly [number, number, number, number];
  export type Polygon = readonly Vec2[];

  const r1 = (v: number) => String(Math.round(v * 10) / 10);

  // Segments → attribut d de <path> ; un segment qui repart du point précédent continue le tracé (L)
  export function toPath(segments: readonly Segment[]): string {
    let d = "";
    let last = "";
    for (const [x1, y1, x2, y2] of segments) {
      const start = `${r1(x1)} ${r1(y1)}`;
      d += (start === last ? "" : `M${start}`) + `L${r1(x2)} ${r1(y2)}`;
      last = `${r1(x2)} ${r1(y2)}`;
    }
    return d;
  }

  export const polygonsToPath = (polys: readonly Polygon[]) =>
    polys.map((p) => p.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("") + "Z").join("");
  ```
- [ ] Implémentation `src/lib/geometry/seal.ts`
  ```ts
  import { sealMatrix, type Provenance } from "./families";
  import { apply, type Vec2 } from "./matrix";
  import { hashString, mulberry32, noise2D } from "./random";
  import { polygonsToPath, toPath, type Polygon, type Segment } from "./svg";

  const VIEW = 64;
  const C = VIEW / 2;
  const LINES = 7; // réseau 7 × 7 pour le monde sombre
  const SQUARES = 6; // grille 6 × 6 pour le monde clair

  export function sealDisorder(slug: string, provenance: Provenance, n = SQUARES): number[][] {
    const r = mulberry32(hashString(`desordre:${provenance}:${slug}`));
    const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    if (provenance === "hand-coded") return grid.map((row) => row.map(() => 0.08 + r() * 0.02));
    if (provenance === "cms") return grid.map((row, y) => row.map(() => 0.05 + (y / (n - 1)) * 0.6 + r() * 0.03));
    if (provenance === "claude-code") {
      const [fx, fy] = [r() * (n - 1), r() * (n - 1)];
      return grid.map((row, y) => row.map((_, x) => 0.05 + 0.85 * Math.exp(-((x - fx) ** 2 + (y - fy) ** 2) / 2)));
    }
    // other : quelques carrés agités, éparpillés
    const picks = new Set<number>();
    while (picks.size < 4) picks.add(Math.floor(r() * n * n));
    return grid.map((row, y) => row.map((_, x) => (picks.has(y * n + x) ? 0.6 + r() * 0.3 : 0.06)));
  }

  export function sealGeometry(slug: string, provenance: Provenance) {
    const m = sealMatrix(slug, provenance);
    const t = ([x, y]: Vec2): Vec2 => {
      const [u, v] = apply(m, [x - C, C - y]); // repère mathématique centré, y vers le haut
      return [C + u, C - v];
    };
    const step = VIEW / (LINES - 1);
    const lattice: Segment[] = [];
    for (let i = 0; i < LINES; i++) {
      const k = i * step;
      const [a, b] = [t([k, 0]), t([k, VIEW])];
      const [c, d] = [t([0, k]), t([VIEW, k])];
      lattice.push([a[0], a[1], b[0], b[1]], [c[0], c[1], d[0], d[1]]);
    }
    const o = t([C, C]);
    const i = t([C + step * 1.5, C]);
    const j = t([C, C - step * 1.5]);
    const basis: [Segment, Segment] = [[o[0], o[1], i[0], i[1]], [o[0], o[1], j[0], j[1]]];

    const amp = sealDisorder(slug, provenance);
    const n = noise2D(hashString(`carres:${slug}`));
    const cell = VIEW / SQUARES;
    const squares: Polygon[] = [];
    for (let y = 0; y < SQUARES; y++) {
      for (let x = 0; x < SQUARES; x++) {
        const a = amp[y]![x]! * cell * 0.35;
        const corner = (cx: number, cy: number, k: number): Vec2 => [cx + n(cx * 0.3 + k, cy * 0.3) * a, cy + n(cx * 0.3, cy * 0.3 + k) * a];
        const [x0, y0, x1, y1] = [x * cell + 1.5, y * cell + 1.5, (x + 1) * cell - 1.5, (y + 1) * cell - 1.5];
        squares.push([corner(x0, y0, 1), corner(x1, y0, 2), corner(x1, y1, 3), corner(x0, y1, 4)]);
      }
    }
    const accentSquare = Math.floor(mulberry32(hashString(`accent:${slug}`))() * SQUARES * SQUARES);
    return { lattice, basis, squares, accentSquare };
  }

  const open = (cls: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true" focusable="false" class="${cls}" fill="none" stroke-linecap="round" stroke-linejoin="round">`;

  export function renderSeal(slug: string, provenance: Provenance): { dark: string; light: string } {
    const g = sealGeometry(slug, provenance);
    const id = `s${hashString(`${provenance}:${slug}`).toString(36)}`;
    const dark =
      open("seal-dark") +
      `<clipPath id="${id}"><rect width="${VIEW}" height="${VIEW}" rx="4"/></clipPath>` +
      `<g clip-path="url(#${id})"><path d="${toPath(g.lattice)}" stroke="currentColor" stroke-width="0.6" class="text-line-strong"/>` +
      `<path d="${toPath(g.basis)}" stroke="currentColor" stroke-width="1.6" class="text-accent"/></g></svg>`;
    const others = g.squares.filter((_, k) => k !== g.accentSquare);
    const light =
      open("seal-light") +
      `<path d="${polygonsToPath(others)}" stroke="currentColor" stroke-width="0.7" class="text-ink"/>` +
      `<path d="${polygonsToPath([g.squares[g.accentSquare]!])}" stroke="currentColor" stroke-width="1.2" class="text-accent"/></svg>`;
    return { dark, light };
  }
  ```
- [ ] `src/components/Seal.astro`
  ```astro
  ---
  import { renderSeal } from "../lib/geometry/seal";
  import type { Provenance } from "../lib/geometry/families";
  interface Props {
    slug: string;
    provenance: Provenance;
    size?: number;
    class?: string;
  }
  const { slug, provenance, size = 64, class: cls = "" } = Astro.props;
  const { dark, light } = renderSeal(slug, provenance);
  ---

  <!-- sceau décoratif : monde clair « Traceur » ou sombre « Transformation » selon le thème -->
  <span class:list={["inline-block shrink-0", cls]} style={{ width: `${size}px`, height: `${size}px` }}>
    <span class="block size-full dark:hidden" set:html={light} />
    <span class="hidden size-full dark:block" set:html={dark} />
  </span>
  ```
- [ ] `pnpm test` → vert (l'instantané est créé au premier passage, puis committé). Commit `feat(geometry): sceaux de projet générés côté serveur`.

### Tâche 3.4 : première image du champ et planche de revue

**Fichiers :** créer `src/lib/geometry/field.ts`, `src/components/FieldStatic.astro`, `src/pages/dev/[planche].astro`, `tests/unit/geometry-field.test.ts`, `tests/e2e/geometry.spec.ts` ; modifier `src/views/ShellView.astro` (accueil : champ derrière le titre).
**Produit :**
- `fieldGeometry(theme: "dark" | "light", w: number, h: number, t: number): { lines: Segment[]; accents: Segment[] | Polygon[]; squares?: Polygon[] }` :
  - sombre : réseau de pas `max(w / 24, h / 16)` transformé par `matrixAt(t)` autour du centre, vecteurs î et ĵ ancrés aux deux tiers de la largeur ;
  - clair : grille 14 × 9 de carrés dont le désordre `0,06 + bruit` est déterministe (graine fixe `champ`), 1 à 3 carrés en accent ;
- `renderField(w = 1440, h = 900): { dark: string; light: string }` avec un masque en dégradé qui atténue le champ sur la colonne de texte, de 0 à 45 % de la largeur (opacité 0,25 → 1) ;
- `<FieldStatic class? />`.

- [ ] Tests unitaires (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { fieldGeometry, renderField } from "../../src/lib/geometry/field";

  describe("champ statique", () => {
    it("t = 0 : la grille sombre est l'identité (lignes parfaitement verticales ou horizontales)", () => {
      const { lines } = fieldGeometry("dark", 1440, 900, 0);
      for (const [x1, y1, x2, y2] of lines) expect(Math.abs(x1 - x2) < 1e-9 || Math.abs(y1 - y2) < 1e-9).toBe(true);
    });
    it("la grille claire compte 14 × 9 carrés et 1 à 3 accents", () => {
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
    it("est identique d'un appel à l'autre", () => {
      expect(renderField()).toEqual(renderField());
    });
  });
  ```
- [ ] Implémentation `src/lib/geometry/field.ts`
  ```ts
  import { matrixAt } from "./cycle";
  import { apply, type Vec2 } from "./matrix";
  import { hashString, mulberry32, noise2D } from "./random";
  import { polygonsToPath, toPath, type Polygon, type Segment } from "./svg";

  const COLS = 14;
  const ROWS = 9;

  export function fieldGeometry(theme: "dark" | "light", w: number, h: number, t: number) {
    if (theme === "dark") {
      const step = Math.max(w / 24, h / 16);
      const m = matrixAt(t);
      const [cx, cy] = [w / 2, h / 2];
      const tr = ([x, y]: Vec2): Vec2 => {
        const [u, v] = apply(m, [x - cx, cy - y]);
        return [cx + u, cy - v];
      };
      const lines: Segment[] = [];
      const ext = Math.max(w, h); // déborde pour couvrir l'écran une fois transformé
      for (let x = cx - ext; x <= cx + ext; x += step) {
        const [a, b] = [tr([x, cy - ext]), tr([x, cy + ext])];
        lines.push([a[0], a[1], b[0], b[1]]);
      }
      for (let y = cy - ext; y <= cy + ext; y += step) {
        const [a, b] = [tr([cx - ext, y]), tr([cx + ext, y])];
        lines.push([a[0], a[1], b[0], b[1]]);
      }
      const o = tr([w * (2 / 3), cy]);
      const i = tr([w * (2 / 3) + step * 2, cy]);
      const j = tr([w * (2 / 3), cy - step * 2]);
      const accents: Segment[] = [[o[0], o[1], i[0], i[1]], [o[0], o[1], j[0], j[1]]];
      return { lines, accents };
    }
    const n = noise2D(hashString("champ"));
    const r = mulberry32(hashString("champ:accents"));
    const cell = Math.min(w / COLS, h / ROWS);
    const [ox, oy] = [(w - cell * COLS) / 2, (h - cell * ROWS) / 2];
    const squares: Polygon[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const a = cell * (0.06 + 0.08 * Math.abs(n(x * 0.4, y * 0.4)));
        const c = (px: number, py: number, k: number): Vec2 => [px + n(px * 0.01 + k, py * 0.01) * a, py + n(px * 0.01, py * 0.01 + k) * a];
        const [x0, y0, x1, y1] = [ox + x * cell + cell * 0.12, oy + y * cell + cell * 0.12, ox + (x + 1) * cell - cell * 0.12, oy + (y + 1) * cell - cell * 0.12];
        squares.push([c(x0, y0, 1), c(x1, y0, 2), c(x1, y1, 3), c(x0, y1, 4)]);
      }
    }
    const count = 1 + Math.floor(r() * 3);
    const picks = new Set<number>();
    while (picks.size < count) picks.add(Math.floor(COLS * 0.5 + r() * COLS * 0.5) + Math.floor(r() * ROWS) * COLS);
    const accents = [...picks].map((k) => squares[k]!);
    return { lines: [] as Segment[], accents, squares: squares.filter((_, k) => !picks.has(k)) };
  }

  const svgOpen = (w: number, h: number, cls: string, maskId: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" class="${cls}" fill="none">` +
    `<defs><linearGradient id="${maskId}g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="white" stop-opacity="0.25"/><stop offset="0.45" stop-color="white" stop-opacity="1"/></linearGradient>` +
    `<mask id="${maskId}"><rect width="${w}" height="${h}" fill="url(#${maskId}g)"/></mask></defs><g mask="url(#${maskId})">`;

  export function renderField(w = 1440, h = 900): { dark: string; light: string } {
    const d = fieldGeometry("dark", w, h, 0);
    const l = fieldGeometry("light", w, h, 0);
    const dark =
      svgOpen(w, h, "field-dark", "fmd") +
      `<path d="${toPath(d.lines)}" stroke="currentColor" stroke-width="1" class="text-line"/>` +
      `<path d="${toPath(d.accents as Segment[])}" stroke="currentColor" stroke-width="2" class="text-accent"/></g></svg>`;
    const light =
      svgOpen(w, h, "field-light", "fml") +
      `<path d="${polygonsToPath(l.squares!)}" stroke="currentColor" stroke-width="1" class="text-line-strong"/>` +
      `<path d="${polygonsToPath(l.accents as Polygon[])}" stroke="currentColor" stroke-width="1.5" class="text-accent"/></g></svg>`;
    return { dark, light };
  }
  ```
- [ ] `src/components/FieldStatic.astro`
  ```astro
  ---
  import { renderField } from "../lib/geometry/field";
  interface Props {
    class?: string;
  }
  const { class: cls = "" } = Astro.props;
  const { dark, light } = renderField();
  ---

  <!-- première image du champ (DESIGN_BRIEF §5.2) : repli sans JS et en mouvement réduit ; le canvas WebGL (Phase 5) s'y superposera -->
  <div data-field class:list={["pointer-events-none absolute inset-0 overflow-hidden", cls]} aria-hidden="true">
    <div class="size-full dark:hidden [&>svg]:size-full" set:html={light} />
    <div class="hidden size-full dark:block [&>svg]:size-full" set:html={dark} />
  </div>
  ```
- [ ] Accueil provisoire (`ShellView`, `page === "home"`) : section `relative min-h-[calc(100dvh-4rem)]` avec `<FieldStatic />` derrière, et le `h1` dans une colonne à gauche (`relative z-10`). La vraie composition arrive en Phase 4.
- [ ] Planche `src/pages/dev/[planche].astro`
  ```astro
  ---
  import Base from "../../layouts/Base.astro";
  import Seal from "../../components/Seal.astro";
  import FieldStatic from "../../components/FieldStatic.astro";
  import { alternatesFor } from "../../i18n/routes";
  // planche de revue visuelle : générée en dev uniquement, aucune page en production
  export function getStaticPaths() {
    return import.meta.env.DEV ? [{ params: { planche: "geometrie" } }] : [];
  }
  const provenances = ["claude-code", "hand-coded", "cms", "other"] as const;
  const slugs = ["compagnon", "portfolio", "atelier-lumen"];
  ---

  <Base locale="fr" title="Planche géométrie" description="Revue visuelle" alternates={alternatesFor("home")}>
    <section class="relative h-[60vh] border-b border-line"><FieldStatic /></section>
    <section class="mx-auto grid max-w-[1240px] gap-10 px-6 py-16 md:px-10">
      {
        provenances.map((p) => (
          <div>
            <h2 class="text-meta text-ink-muted">{p}</h2>
            <div class="mt-4 flex gap-6">
              {slugs.map((s) => <Seal slug={s} provenance={p} size={96} />)}
            </div>
          </div>
        ))
      }
    </section>
  </Base>
  ```
- [ ] Tests E2E `tests/e2e/geometry.spec.ts` (doivent échouer avant l'accueil et la planche)
  ```ts
  import { test, expect } from "@playwright/test";
  import AxeBuilder from "@axe-core/playwright";

  test("l'accueil affiche le champ statique, décoratif, sans décaler la mise en page", async ({ page }) => {
    await page.goto("/fr/");
    const field = page.locator("[data-field]");
    await expect(field).toHaveAttribute("aria-hidden", "true");
    await expect(field.locator("svg:visible")).toHaveCount(1);
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
              if (!e.hadRecentInput) total += e.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 1000);
        }),
    );
    expect(cls).toBeLessThan(0.1);
  });

  test("le titre de l'accueil reste lisible sur le champ (axe, deux thèmes)", async ({ page }) => {
    for (const theme of ["light", "dark"]) {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/fr/");
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    }
  });

  test("la planche montre 12 sceaux, un seul monde visible par sceau", async ({ page }) => {
    await page.goto("/dev/geometrie/");
    await expect(page.locator("svg.seal-light:visible")).toHaveCount(12);
    await expect(page.locator("svg.seal-dark:visible")).toHaveCount(0);
  });
  ```
- [ ] Vérifier :
  - `pnpm test && pnpm check && pnpm build && pnpm e2e` → vert ;
  - `ls .vercel/output/static/dev 2>/dev/null || echo "aucune planche en production"` → « aucune planche en production ».
- [ ] Revue visuelle : captures Playwright de `/dev/geometrie/` et `/fr/` dans les deux thèmes, lues par Claude. On ajuste les épaisseurs, l'opacité du masque et le pas de la grille si le rendu s'éloigne de DESIGN_BRIEF §2, puis on consigne les réglages dans le ledger.
- [ ] Commit `feat(geometry): première image du champ et planche de revue`.

### Clôture de phase

`/code-review` sur `main...phase-3`, passe de correction en TDD, PR `Phase 3 : géométrie`, CI verte, captures de la planche jointes au récap, `PROGRESS.md` et `docs/REPRISE.md` à jour, puis fusion après accord de Richard.
