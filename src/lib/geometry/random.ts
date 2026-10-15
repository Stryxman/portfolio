// FNV-1a 32 bits : empreinte stable d'un slug (même entrée → même sceau à chaque build)
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit de valeur 2D lissé (smoothstep entre nœuds entiers), dans [-1, 1]
export function noise2D(seed: number): (x: number, y: number) => number {
  const node = (ix: number, iy: number) => mulberry32(hashString(`${seed}:${ix}:${iy}`))() * 2 - 1;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const top = node(ix, iy) + (node(ix + 1, iy) - node(ix, iy)) * fx;
    const bottom = node(ix, iy + 1) + (node(ix + 1, iy + 1) - node(ix, iy + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}
