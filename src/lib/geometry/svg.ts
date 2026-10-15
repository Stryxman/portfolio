import type { Vec2 } from "./matrix";

export type Segment = readonly [number, number, number, number];
export type Polygon = readonly Vec2[];

const r1 = (v: number) => String(Math.round(v * 10) / 10);

// Segments → attribut d de <path> ; un segment qui repart du point précédent prolonge le tracé (L)
export function toPath(segments: readonly Segment[]): string {
  let d = "";
  let last = "";
  for (const [x1, y1, x2, y2] of segments) {
    const start = `${r1(x1)} ${r1(y1)}`;
    const end = `${r1(x2)} ${r1(y2)}`;
    d += (start === last ? "" : `M${start}`) + `L${end}`;
    last = end;
  }
  return d;
}

export const polygonsToPath = (polys: readonly Polygon[]) =>
  polys.map((p) => p.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("") + "Z").join("");
