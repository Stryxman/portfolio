import { GOLDEN_ANGLE, isFibonacci } from "./phyllo";

export type Vec3 = readonly [number, number, number];

// Treillis de Fibonacci : n points presque équirépartis sur la sphère unité (z régulier, longitude i × angle d'or).
// Tableau plat [x0, y0, z0, x1…] : le moteur le parcourt à chaque image sans rien allouer.
export function sphereLattice(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const z = 1 - (2 * (i + 0.5)) / n;
    const s = Math.sqrt(1 - z * z);
    out[i * 3] = s * Math.cos(i * GOLDEN_ANGLE);
    out[i * 3 + 1] = s * Math.sin(i * GOLDEN_ANGLE);
    out[i * 3 + 2] = z;
  }
  return out;
}

// Spirale continue d'un pôle à l'autre (le trait du traceur) : m sommets, `turns` tours
export function sphereSpiral(m: number, turns: number): Float32Array {
  const out = new Float32Array(m * 3);
  for (let j = 0; j < m; j++) {
    const z = 1 - (2 * (j + 0.5)) / m;
    const s = Math.sqrt(1 - z * z);
    const a = (j / m) * turns * 2 * Math.PI;
    out[j * 3] = s * Math.cos(a);
    out[j * 3 + 1] = s * Math.sin(a);
    out[j * 3 + 2] = z;
  }
  return out;
}

// Projection azimutale équivalente de Lambert, vue du pôle nord, ramenée au disque unité.
// Appliquée au treillis, elle redonne exactement la spirale de l'accueil : rayon √((i + ½) / n).
export function lambertDisc([x, y, z]: Vec3): Vec3 {
  const s = Math.hypot(x, y);
  if (s < 1e-9) return [0, 0, 0];
  const rho = Math.sqrt((1 - z) / 2);
  return [(x / s) * rho, (y / s) * rho, 0];
}

// Rayon du blob dans la direction (x, y, z) à l'instant t : 1 ± amp, somme de sinus (lisse, sans tirage)
export function blobRadius(x: number, y: number, z: number, t: number, amp: number): number {
  const w =
    Math.sin(2.1 * x + t * 0.9) * Math.sin(1.7 * y - t * 0.6) +
    0.6 * Math.sin(2.6 * z + 1.3 * x + t * 0.75) +
    0.35 * Math.sin(3.4 * (x + y + z) - t * 1.1);
  return 1 + (amp * w) / 1.95;
}

export interface Pose {
  t: number; // secondes
  morph: number; // 0 = disque à plat (spirale de l'accueil), 1 = sphère
  amp: number; // amplitude du blob à morph = 1
  spin: number; // rotation autour de l'axe des pôles (radians)
  tilt: number; // bascule de l'axe à morph = 1 (radians)
  pull?: Vec3 | undefined; // direction du pointeur, en repère de vue
  pullK?: number | undefined; // force du renflement vers le pointeur
}

export const FOCAL = 3.4;

// Écrit dans `out` trois valeurs par point : x et y à l'écran (unité = rayon), puis la profondeur z (+1 = vers l'œil)
export function poseInto(base: Float32Array, out: Float32Array, p: Pose): void {
  const m = p.morph;
  const cs = Math.cos(p.spin);
  const sn = Math.sin(p.spin);
  const ct = Math.cos(p.tilt * m);
  const st = Math.sin(p.tilt * m);
  const k = (p.pullK ?? 0) * m;
  // le pointeur est ramené en repère du modèle (rotations inverses) pour un simple produit scalaire
  let ux = 0;
  let uy = 0;
  let uz = 0;
  if (p.pull && k !== 0) {
    const [vx, vy, vz] = p.pull;
    const ty = vy * ct + vz * st;
    uz = -vy * st + vz * ct;
    ux = vx * cs + ty * sn;
    uy = -vx * sn + ty * cs;
  }
  for (let i = 0; i < base.length; i += 3) {
    const x = base[i]!;
    const y = base[i + 1]!;
    const z = base[i + 2]!;
    let d = blobRadius(x, y, z, p.t, p.amp * m);
    if (k !== 0) {
      const dot = x * ux + y * uy + z * uz;
      if (dot > 0) d += k * dot * dot * dot;
    }
    const s = Math.hypot(x, y);
    const rho = s < 1e-9 ? 0 : Math.sqrt((1 - z) / 2) / s;
    const mx = x * rho + (x * d - x * rho) * m;
    const my = y * rho + (y * d - y * rho) * m;
    const mz = z * d * m;
    const rx = mx * cs - my * sn;
    const ry = mx * sn + my * cs;
    const vy = ry * ct - mz * st;
    const vz = ry * st + mz * ct;
    const persp = FOCAL / (FOCAL - vz);
    out[i] = rx * persp;
    out[i + 1] = -vy * persp; // à l'écran, y descend
    out[i + 2] = vz;
  }
}

export const LATTICE = 610;
export const SPIRAL_VERTICES = 1300;
export const SPIRAL_TURNS = 34;
export const REST: Pose = { t: 0, morph: 1, amp: 0.1, spin: 0.6, tilt: -1.05 };

const r1 = (v: number) => String(Math.round(v * 10) / 10);

// Image fixe de la sphère (repli sans JavaScript et en mouvement réduit), dans les deux mondes
export function renderSphere(size = 600): { dark: string; light: string } {
  const c = size / 2;
  const R = size * 0.36;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false" fill="none">`;

  // points : segments de longueur nulle à bout rond, le diamètre est l'épaisseur du trait
  const lattice = sphereLattice(LATTICE);
  const pts = new Float32Array(lattice.length);
  poseInto(lattice, pts, REST);
  let back = "";
  let front = "";
  let accent = "";
  for (let i = 0; i < pts.length; i += 3) {
    const d = `M${r1(c + pts[i]! * R)} ${r1(c + pts[i + 1]! * R)}h0`;
    if (isFibonacci(i / 3 + 1)) accent += d;
    else if (pts[i + 2]! < 0) back += d;
    else front += d;
  }
  const dots = (cls: string, width: number, d: string, opacity = 1) =>
    `<path stroke="currentColor" stroke-linecap="round" stroke-width="${width}" stroke-opacity="${opacity}" class="${cls}" d="${d}"/>`;
  const dark =
    open +
    dots("text-line-strong", 3, back, 0.4) +
    dots("text-ink-muted", 5, front) +
    dots("text-accent", 9, accent) +
    "</svg>";

  const spiral = sphereSpiral(SPIRAL_VERTICES / 2, SPIRAL_TURNS);
  const line = new Float32Array(spiral.length);
  poseInto(spiral, line, REST);
  let far = "";
  let near = "";
  let prev = 0;
  for (let i = 0; i < line.length; i += 3) {
    const side = line[i + 2]! < 0 ? -1 : 1;
    const xy = `${r1(c + line[i]! * R)} ${r1(c + line[i + 1]! * R)}`;
    if (side < 0) far += (prev === side ? "L" : "M") + xy;
    else near += (prev === side ? "L" : "M") + xy;
    prev = side;
  }
  const light =
    open +
    `<path stroke="currentColor" stroke-width="0.8" stroke-opacity="0.4" class="text-line-strong" d="${far}"/>` +
    `<path stroke="currentColor" stroke-width="1" class="text-ink-muted" d="${near}"/></svg>`;

  return { dark, light };
}
