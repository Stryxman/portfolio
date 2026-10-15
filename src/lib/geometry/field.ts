import { matrixAt } from "./cycle";
import { apply, type Vec2 } from "./matrix";
import { hashString, mulberry32, noise2D } from "./random";
import { polygonsToPath, toPath, type Polygon, type Segment } from "./svg";

const COLS = 14;
const ROWS = 9;

type DarkField = { lines: Segment[]; accents: Segment[] };
type LightField = { lines: Segment[]; accents: Polygon[]; squares: Polygon[] };

// Géométrie du champ en coordonnées de vue (DESIGN_BRIEF §5.1) ; partagée avec le moteur WebGL (Phase 5)
export function fieldGeometry(theme: "dark", w: number, h: number, t: number): DarkField;
export function fieldGeometry(theme: "light", w: number, h: number, t: number): LightField;
export function fieldGeometry(
  theme: "dark" | "light",
  w: number,
  h: number,
  t: number,
): DarkField | LightField {
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
    for (let k = -Math.ceil(ext / step); k <= Math.ceil(ext / step); k++) {
      const x = cx + k * step;
      const y = cy + k * step;
      const [a, b] = [tr([x, cy - ext]), tr([x, cy + ext])];
      const [c, d] = [tr([cx - ext, y]), tr([cx + ext, y])];
      lines.push([a[0], a[1], b[0], b[1]], [c[0], c[1], d[0], d[1]]);
    }
    // vecteurs de base î et ĵ, ancrés aux deux tiers de la largeur (hors de la colonne de texte)
    const o = tr([w * (2 / 3), cy]);
    const i = tr([w * (2 / 3) + step * 2, cy]);
    const j = tr([w * (2 / 3), cy - step * 2]);
    // pointe de flèche : deux segments de longueur fixe à ±25° de la direction du vecteur, depuis son extrémité
    const head = (from: Vec2, tip: Vec2): Segment[] => {
      const ang = Math.atan2(from[1] - tip[1], from[0] - tip[0]);
      const len = step * 0.28;
      return [-0.44, 0.44].map(
        (da) =>
          [
            tip[0],
            tip[1],
            tip[0] + Math.cos(ang + da) * len,
            tip[1] + Math.sin(ang + da) * len,
          ] as const,
      );
    };
    return {
      lines,
      accents: [[o[0], o[1], i[0], i[1]], [o[0], o[1], j[0], j[1]], ...head(o, i), ...head(o, j)],
    };
  }
  const n = noise2D(hashString("champ"));
  const r = mulberry32(hashString("champ:accents"));
  const cell = Math.min(w / COLS, h / ROWS);
  const [ox, oy] = [(w - cell * COLS) / 2, (h - cell * ROWS) / 2];
  const all: Polygon[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const a = cell * (0.06 + 0.08 * Math.abs(n(x * 0.4, y * 0.4)));
      const c = (px: number, py: number, k: number): Vec2 => [
        px + n(px * 0.01 + k, py * 0.01) * a,
        py + n(px * 0.01, py * 0.01 + k) * a,
      ];
      const pad = cell * 0.12;
      const [x0, y0] = [ox + x * cell + pad, oy + y * cell + pad];
      const [x1, y1] = [ox + (x + 1) * cell - pad, oy + (y + 1) * cell - pad];
      all.push([c(x0, y0, 1), c(x1, y0, 2), c(x1, y1, 3), c(x0, y1, 4)]);
    }
  }
  // 1 à 3 carrés en accent, dans la moitié droite (hors de la colonne de texte)
  const count = 1 + Math.floor(r() * 3);
  const picks = new Set<number>();
  while (picks.size < count)
    picks.add(Math.floor(COLS / 2 + r() * (COLS / 2)) + Math.floor(r() * ROWS) * COLS);
  return {
    lines: [],
    accents: [...picks].map((k) => all[k]!),
    squares: all.filter((_, k) => !picks.has(k)),
  };
}

// Le champ s'atténue derrière la colonne de texte : masque en dégradé (opacité 0,15 → 1 sur 55 % de la largeur)
const svgOpen = (w: number, h: number, cls: string, maskId: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" class="${cls}" fill="none">` +
  `<defs><linearGradient id="${maskId}g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="white" stop-opacity="0.15"/><stop offset="0.55" stop-color="white" stop-opacity="1"/></linearGradient>` +
  `<mask id="${maskId}"><rect width="${w}" height="${h}" fill="url(#${maskId}g)"/></mask></defs><g mask="url(#${maskId})">`;

export function renderField(w = 1440, h = 900): { dark: string; light: string } {
  const d = fieldGeometry("dark", w, h, 0);
  const l = fieldGeometry("light", w, h, 0);
  const dark =
    svgOpen(w, h, "field-dark", "fmd") +
    `<path d="${toPath(d.lines)}" stroke="currentColor" stroke-width="1" class="text-line"/>` +
    `<path d="${toPath(d.accents)}" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-accent"/></g></svg>`;
  const light =
    svgOpen(w, h, "field-light", "fml") +
    `<path d="${polygonsToPath(l.squares)}" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.7" stroke-linejoin="round" class="text-line-strong"/>` +
    `<path d="${polygonsToPath(l.accents)}" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" class="text-accent"/></g></svg>`;
  return { dark, light };
}
