import { sealMatrix, type Provenance } from "./families";
import { apply, type Vec2 } from "./matrix";
import { hashString, mulberry32, noise2D } from "./random";
import { polygonsToPath, toPath, type Polygon, type Segment } from "./svg";

const VIEW = 64;
const C = VIEW / 2;
const LINES = 7; // réseau 7 × 7 du monde sombre
const SQUARES = 6; // grille 6 × 6 du monde clair

// Amplitude de désordre par carré (DESIGN_BRIEF §5.3, colonne « Désordre »)
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
  // repère mathématique centré (y vers le haut), puis retour en coordonnées SVG
  const t = ([x, y]: Vec2): Vec2 => {
    const [u, v] = apply(m, [x - C, C - y]);
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
  const basis: [Segment, Segment] = [
    [o[0], o[1], i[0], i[1]],
    [o[0], o[1], j[0], j[1]],
  ];

  const amp = sealDisorder(slug, provenance);
  const n = noise2D(hashString(`carres:${slug}`));
  const cell = VIEW / SQUARES;
  const squares: Polygon[] = [];
  for (let y = 0; y < SQUARES; y++) {
    for (let x = 0; x < SQUARES; x++) {
      const a = amp[y]![x]! * cell * 0.6; // assez marqué pour se lire à 64-96 px
      const corner = (cx: number, cy: number, k: number): Vec2 => [
        cx + n(cx * 0.3 + k, cy * 0.3) * a,
        cy + n(cx * 0.3, cy * 0.3 + k) * a,
      ];
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
