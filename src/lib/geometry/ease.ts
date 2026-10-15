// Courbe de Bézier cubique CSS : on résout x(s) = t par Newton (repli par dichotomie), puis on renvoie y(s).
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const bez = (s: number, p1: number, p2: number) =>
    3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3;
  const dBez = (s: number, p1: number, p2: number) =>
    3 * (1 - s) ** 2 * p1 + 6 * (1 - s) * s * (p2 - p1) + 3 * s ** 2 * (1 - p2);
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
