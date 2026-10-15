// Mat2 = [[a, b], [c, d]] appliquée aux vecteurs colonnes : x' = a·x + b·y, y' = c·x + d·y.
export type Mat2 = readonly [number, number, number, number];
export type Vec2 = readonly [number, number];

export const IDENTITY: Mat2 = [1, 0, 0, 1];
export const rotation = (r: number): Mat2 => [Math.cos(r), -Math.sin(r), Math.sin(r), Math.cos(r)];
export const shear = (k: number): Mat2 => [1, k, 0, 1];
export const scale = (sx: number, sy: number): Mat2 => [sx, 0, 0, sy];
export const reflection = (r: number): Mat2 => [
  Math.cos(2 * r),
  Math.sin(2 * r),
  Math.sin(2 * r),
  -Math.cos(2 * r),
];
export const multiply = ([a, b, c, d]: Mat2, [e, f, g, h]: Mat2): Mat2 => [
  a * e + b * g,
  a * f + b * h,
  c * e + d * g,
  c * f + d * h,
];
export const apply = ([a, b, c, d]: Mat2, [x, y]: Vec2): Vec2 => [a * x + b * y, c * x + d * y];
export const lerpMat = (m: Mat2, n: Mat2, t: number): Mat2 => [
  m[0] + (n[0] - m[0]) * t,
  m[1] + (n[1] - m[1]) * t,
  m[2] + (n[2] - m[2]) * t,
  m[3] + (n[3] - m[3]) * t,
];
export const det = ([a, b, c, d]: Mat2) => a * d - b * c;
