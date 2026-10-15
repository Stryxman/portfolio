import { hashString, mulberry32 } from "./random";
import { multiply, reflection, rotation, scale, shear, type Mat2 } from "./matrix";

// « claude » (fait avec Claude, ex. un artefact) partage la famille de « claude-code »
export type Provenance = "claude-code" | "claude" | "hand-coded" | "cms" | "other";

const range = (r: () => number, min: number, max: number) => min + (max - min) * r();

// DESIGN_BRIEF §5.3 : la provenance choisit la famille de matrice, le slug en choisit les paramètres
export function sealMatrix(slug: string, provenance: Provenance): Mat2 {
  const r = mulberry32(hashString(`${provenance}:${slug}`));
  switch (provenance) {
    case "claude":
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
