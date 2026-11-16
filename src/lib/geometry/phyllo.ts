import type { Vec2 } from "./matrix";
import { hashString, mulberry32 } from "./random";
import type { Polygon } from "./svg";

// Angle d'or : 2π / φ², environ 137,508°. Deux graines successives sont séparées de cet angle.
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233] as const;
const FIB_SET = new Set<number>(FIBONACCI);
export const isFibonacci = (n: number) => FIB_SET.has(n);

export const SEEDS = 233;
// Nombre de côtés des polygones : trois termes de la suite
export const SIDES = [3, 5, 8] as const;

// Graine i (0 ≤ i < n) sur le disque unité : rayon √((i + ½) / n), angle i × angle d'or.
// Chaque graine occupe la même aire (modèle de Vogel) ; i peut être fractionnaire.
export function phylloPoint(
  i: number,
  n: number,
): { r: number; theta: number; x: number; y: number } {
  const r = Math.sqrt((i + 0.5) / n);
  const theta = i * GOLDEN_ANGLE;
  return { r, theta, x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

export function regularPolygon(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rot: number,
): Polygon {
  return Array.from({ length: sides }, (_, k): Vec2 => {
    const a = rot + (k * 2 * Math.PI) / sides;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  });
}

// Bras visibles (parastiches) : relier la graine a à a + k, a + 2k… avec k dans la suite.
// k × angle d'or vaut presque un nombre entier de tours : l'écart résiduel donne la courbure du bras.
export function armTurn(k: number): number {
  const full = k * GOLDEN_ANGLE;
  return full - 2 * Math.PI * Math.round(full / (2 * Math.PI));
}

// Bras numéro a de la famille k, échantillonné finement (points du disque unité)
export function armPoints(a: number, k: number, n: number, sub = 3): Vec2[] {
  const turn = armTurn(k);
  const steps = Math.floor(((n - 1 - a) / k) * sub);
  return Array.from({ length: steps + 1 }, (_, j): Vec2 => {
    const s = j / sub;
    const r = Math.sqrt((a + k * s + 0.5) / n);
    const theta = a * GOLDEN_ANGLE + s * turn;
    return [r * Math.cos(theta), r * Math.sin(theta)];
  });
}

const r1 = (v: number) => String(Math.round(v * 10) / 10);
const r2 = (v: number) => String(Math.round(v * 100) / 100);
const closed = (p: Polygon) =>
  p.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("") + "Z";
const open = (p: readonly Vec2[]) =>
  p.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("");

const svgOpen = (size: number, cls: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false" class="${cls}" fill="none">`;

// Part du cadre occupée par le rayon du disque, et rayon d'une graine en fraction de l'écart moyen entre graines.
// La graine d'accent est plus grosse : elle porte son rang (spiralLabels).
const DISC = 0.47;
const seedRadius = (r: number, accent: boolean) => (accent ? 0.2 + 0.3 * r : 0.15 + 0.27 * r);

export const RINGS = 8;
export const ARMS = 21;

// Deux lectures du même semis de 233 graines.
// Sombre « Transformation » : polygones pleins (3, 5 ou 8 côtés) qui grossissent vers le bord.
// Clair « Traceur » : 21 bras tracés au trait, carrés au contour de plus en plus désordonnés vers le bord.
export function renderSpiral(size = 1000): { dark: string; light: string } {
  const c = size / 2;
  const R = size * DISC;
  const pitch = R * Math.sqrt(Math.PI / SEEDS); // distance moyenne entre deux graines

  let plain = "";
  let marked = "";
  for (let i = 0; i < SEEDS; i++) {
    const { r, theta, x, y } = phylloPoint(i, SEEDS);
    const accent = isFibonacci(i + 1);
    const poly = regularPolygon(
      c + x * R,
      c + y * R,
      pitch * seedRadius(r, accent),
      accent ? 8 : SIDES[i % 3]!,
      theta,
    );
    if (accent) marked += `<path style="--i:${i}" d="${closed(poly)}"/>`;
    else
      plain += `<path style="--i:${i}" fill-opacity="${r2(0.9 - 0.62 * r)}" d="${closed(poly)}"/>`;
  }
  const dark =
    svgOpen(size, "spiral-dark") +
    `<g fill="currentColor" class="text-line-strong">${plain}</g>` +
    `<g fill="currentColor" class="text-accent sp-accent">${marked}</g></svg>`;

  const rand = mulberry32(hashString("spirale:traceur"));
  const rings: string[] = Array.from({ length: RINGS }, () => "");
  let accents = "";
  for (let i = 0; i < SEEDS; i++) {
    const { r, theta, x, y } = phylloPoint(i, SEEDS);
    const accent = isFibonacci(i + 1);
    // désordre croissant vers le bord (Vera Molnár) : décalage et rotation tirés au sort, amplitude ∝ r².
    // Les carrés d'accent restent à leur place : ils portent leur rang (spiralLabels).
    const wild = r * r;
    const dx = (rand() - 0.5) * pitch * 0.5 * wild * (accent ? 0 : 1);
    const dy = (rand() - 0.5) * pitch * 0.5 * wild * (accent ? 0 : 1);
    const rot = theta + Math.PI / 4 + (rand() - 0.5) * 1.6 * wild;
    const d = closed(
      regularPolygon(
        c + x * R + dx,
        c + y * R + dy,
        pitch * (accent ? 0.2 + 0.3 * r : 0.14 + 0.24 * r),
        4,
        rot,
      ),
    );
    if (accent) accents += `<path d="${d}"/>`;
    else rings[Math.min(RINGS - 1, Math.floor(r * RINGS))] += `<path d="${d}"/>`;
  }
  let light = svgOpen(size, "spiral-light");
  for (let a = 0; a < ARMS; a++) {
    const pts = armPoints(a, ARMS, SEEDS).map(([x, y]): Vec2 => [c + x * R, c + y * R]);
    light += `<path class="sp-arm text-line-strong" style="--i:${a}" pathLength="1" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.55" stroke-linecap="round" d="${open(pts)}"/>`;
  }
  // un groupe par anneau : --i (l'ordre de pose) est hérité par chaque carré
  light +=
    `<g class="text-ink-muted" stroke="currentColor" stroke-width="0.9" stroke-opacity="0.75" stroke-linejoin="round">` +
    rings.map((d, k) => `<g style="--i:${k}">${d}</g>`).join("") +
    `</g><g class="text-accent sp-accent" style="--i:${RINGS}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">${accents}</g></svg>`;

  return { dark, light };
}

// Rang des graines d'accent (1, 2, 3, 5, 8… 233), à poser au centre de chaque graine.
// x, y : position en % du cadre ; size : corps du chiffre en % de la largeur du cadre.
export function spiralLabels(): { n: number; x: number; y: number; size: number }[] {
  const pitch = DISC * Math.sqrt(Math.PI / SEEDS);
  return FIBONACCI.map((n) => {
    const { r, x, y } = phylloPoint(n - 1, SEEDS);
    const rad = pitch * seedRadius(r, true); // en fraction du cadre
    return {
      n,
      x: Math.round((50 + x * DISC * 100) * 100) / 100,
      y: Math.round((50 + y * DISC * 100) * 100) / 100,
      size: Math.round(rad * (n > 99 ? 0.78 : n > 9 ? 0.95 : 1.15) * 1e4) / 100,
    };
  });
}
