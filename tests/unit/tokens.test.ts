import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse, wcagContrast } from "culori";

const css = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`); // « {» évite la ligne @custom-variant qui cite aussi le sélecteur
  if (start < 0) throw new Error(`bloc ${selector} introuvable`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
  );
}

const themes = {
  clair: block(':root, [data-theme="light"]'),
  sombre: block('[data-theme="dark"]'),
};

const ratio = (a: string, b: string) => wcagContrast(parse(a)!, parse(b)!);

// [premier plan, fond, ratio minimal] selon WCAG 2.2 AA (DESIGN_BRIEF §9)
const pairs: [string, string, number][] = [
  ["ink", "bg", 4.5],
  ["ink", "surface", 4.5],
  ["ink-muted", "bg", 4.5],
  ["ink-muted", "surface", 4.5],
  ["accent", "bg", 4.5], // liens texte
  ["accent-ink", "accent", 4.5], // texte des boutons principaux
  ["danger", "bg", 4.5],
  ["danger", "surface", 4.5],
  ["success", "bg", 4.5],
  ["line-strong", "bg", 3], // bordures des contrôles (boutons secondaires, champs)
];

describe.each(Object.entries(themes))("contrastes du thème %s", (_nom, tokens) => {
  it.each(pairs)("%s sur %s ≥ %d:1", (fg, bg, min) => {
    expect(ratio(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
