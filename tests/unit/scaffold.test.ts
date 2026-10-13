import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import { compile } from "@mdx-js/mdx";
import { toSlug, cleanReadme, scaffold } from "../../src/lib/content/scaffold";

describe("toSlug", () => {
  it("produit du kebab-case sans accents", () => {
    expect(toSlug("Mon_Super Projet Été")).toBe("mon-super-projet-ete");
  });
});

describe("cleanReadme", () => {
  it("réécrit images et liens relatifs vers GitHub (sinon MDX tente d'importer le fichier)", () => {
    expect(cleanReadme("![logo](.github/logo.png) et [doc](docs/a.md) et [site](https://x.dev)", "o/r")).toBe(
      "![logo](https://raw.githubusercontent.com/o/r/HEAD/.github/logo.png) et [doc](https://github.com/o/r/blob/HEAD/docs/a.md) et [site](https://x.dev)",
    );
  });
  it("gère une image relative avec titre", () => {
    expect(cleanReadme("![Bannière](.github/b.jpg 'Le titre')", "o/r")).toBe(
      "![Bannière](https://raw.githubusercontent.com/o/r/HEAD/.github/b.jpg 'Le titre')",
    );
  });
  it("retire une image relative quand le dépôt est inconnu", () => {
    expect(cleanReadme("Avant ![logo](./logo.png) après")).toBe("Avant après");
  });
  it("garde l'indentation des listes imbriquées", () => {
    expect(cleanReadme("- un\n  - sous-élément")).toBe("- un\n  - sous-élément");
  });
  it("retire le H1, les badges et les commentaires HTML", () => {
    const md = "# Titre\n\n[![build](https://x/badge.svg)](https://x)\n<!-- note -->\nTexte utile.\n\n## Usage\nok";
    expect(cleanReadme(md)).toBe("Texte utile.\n\n## Usage\nok");
  });
});

describe("cleanReadme produit du MDX compilable", () => {
  it("neutralise le HTML et les accolades d'un README réel, en gardant les blocs de code", async () => {
    const md = [
      '<p align="center"><img src="logo.png" width="120"></p>',
      "Ligne<br>suivante, valeur {x} et a < b.",
      "",
      "```js",
      "const o = { a: 1 }; // <garde>",
      "```",
    ].join("\n");
    const out = cleanReadme(md);
    await expect(compile(out)).resolves.toBeDefined();
    expect(out).toContain("const o = { a: 1 }; // <garde>");
    expect(out).toContain("valeur \\{x\\}");
  });
});

describe("scaffold", () => {
  const input = {
    fullName: "Stryxman/compagnon",
    name: "compagnon",
    description: "Renard — compagnon",
    homepage: null,
    languages: ["Python", "Shell"],
    topics: ["Claude-Code"],
    readme: "# Compagnon\nUn renard.",
    pushedAt: "2026-10-11T18:22:00Z",
  };
  it("crée un brouillon valide avec la stack connue et le reste en tags", () => {
    const { slug, files } = scaffold(input, new Set(["python"]));
    expect(slug).toBe("compagnon");
    const meta = parse(files["meta.yaml"]!);
    expect(meta).toMatchObject({
      status: "draft",
      repo: "Stryxman/compagnon",
      stack: ["python"],
      tags: ["shell", "claude-code"],
      start: "2026-10",
    });
    expect(files["fr.mdx"]).toBe("Un renard.\n");
  });
  it("remplace le tiret cadratin de la description (règle de contenu)", () => {
    const meta = parse(scaffold(input, new Set()).files["meta.yaml"]!);
    expect(meta.summary.fr).toBe("Renard - compagnon");
  });
});
