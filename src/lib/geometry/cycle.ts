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
