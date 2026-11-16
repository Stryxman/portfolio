import type { Provenance } from "./families";
import { phylloPoint, regularPolygon } from "./phyllo";
import { hashString, mulberry32 } from "./random";
import { polygonsToPath, type Polygon } from "./svg";

const VIEW = 64;
const C = VIEW / 2;
const R = VIEW * 0.42;
export const SEAL_SEEDS = 34;

// La provenance choisit la forme des graines ; « claude » partage la famille de « claude-code » (les trois formes de l'accueil)
const SIDES: Record<Provenance, readonly number[]> = {
  "claude-code": [3, 5, 8],
  claude: [3, 5, 8],
  "hand-coded": [4],
  cms: [5],
  other: [8],
};

// Sceau d'un projet : la spirale de l'accueil en miniature (34 graines à l'angle d'or).
// Le slug choisit l'orientation et le bras qui porte l'accent : une famille de 5 ou de 8, à partir d'une graine tirée au sort.
export function sealGeometry(slug: string, provenance: Provenance) {
  const r = mulberry32(hashString(`sceau:${provenance}:${slug}`));
  const turn = r() * Math.PI * 2;
  const family = r() < 0.5 ? 5 : 8;
  const start = Math.floor(r() * family);
  const pitch = R * Math.sqrt(Math.PI / SEAL_SEEDS);
  const sides = SIDES[provenance];
  const seeds: Polygon[] = [];
  const squares: Polygon[] = [];
  const accents: number[] = [];
  for (let i = 0; i < SEAL_SEEDS; i++) {
    const p = phylloPoint(i, SEAL_SEEDS);
    const a = p.theta + turn;
    const [x, y] = [C + p.r * R * Math.cos(a), C + p.r * R * Math.sin(a)];
    const rad = pitch * (0.2 + 0.24 * p.r);
    seeds.push(regularPolygon(x, y, rad, sides[i % sides.length]!, a));
    // monde clair : carrés au contour, de plus en plus tournés vers le bord
    squares.push(
      regularPolygon(x, y, rad * 1.1, 4, a + Math.PI / 4 + (r() - 0.5) * 1.4 * p.r * p.r),
    );
    if (i % family === start) accents.push(i);
  }
  return { seeds, squares, accents };
}

const open = (cls: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true" focusable="false" class="${cls}" fill="none" stroke-linejoin="round">`;

export function renderSeal(slug: string, provenance: Provenance): { dark: string; light: string } {
  const g = sealGeometry(slug, provenance);
  const split = (polys: Polygon[]) => [
    polys.filter((_, i) => !g.accents.includes(i)),
    polys.filter((_, i) => g.accents.includes(i)),
  ];
  const [plain, marked] = split(g.seeds);
  const dark =
    open("seal-dark") +
    `<path d="${polygonsToPath(plain!)}" fill="currentColor" class="text-line-strong"/>` +
    `<path d="${polygonsToPath(marked!)}" fill="currentColor" class="text-accent"/></svg>`;
  const [outline, inked] = split(g.squares);
  const light =
    open("seal-light") +
    `<path d="${polygonsToPath(outline!)}" stroke="currentColor" stroke-width="0.7" class="text-ink-muted"/>` +
    `<path d="${polygonsToPath(inked!)}" stroke="currentColor" stroke-width="1.2" class="text-accent"/></svg>`;
  return { dark, light };
}
