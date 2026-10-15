// Identifiants SVG uniques par instance (masques, clipPath) : plusieurs sceaux ou champs peuvent
// cohabiter sur une page. Compteur de module : l'ordre de rendu d'un build statique est stable.
let counter = 0;
export const nextId = (prefix: string) => `${prefix}${(counter++).toString(36)}`;
