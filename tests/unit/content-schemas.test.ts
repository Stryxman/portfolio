import { describe, it, expect } from "vitest";
import { z } from "astro/zod";
import { profileSchema, projectSchema, skillSchema, experienceSchema } from "../../src/lib/content/schemas";

const img = () => z.string();
const project = projectSchema(img, z.string());

describe("schémas", () => {
  it("complète les valeurs par défaut d'un projet minimal", () => {
    const p = project.parse({ title: { fr: "Démo" }, summary: { fr: "Un site." }, provenance: "cms" });
    expect(p).toMatchObject({
      status: "draft",
      featured: false,
      order: 100,
      stack: [],
      tags: [],
      gallery: [],
      preview: { mode: "auto" },
      title: { en: "" },
    });
  });
  it("refuse une provenance inconnue", () => {
    expect(() => project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "wix" })).toThrow();
  });
  it("refuse un dépôt mal formé et une URL invalide", () => {
    expect(() =>
      project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", repo: "pas un repo" }),
    ).toThrow();
    expect(() =>
      project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", liveUrl: "exemple.fr" }),
    ).toThrow();
  });
  it("met les tags en minuscules", () => {
    expect(
      project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", tags: ["Astro"] }).tags,
    ).toEqual(["astro"]);
  });
  it("accepte un profil sans email (dépôt public)", () => {
    const p = profileSchema(img).parse({
      fullName: "Richard",
      role: { fr: "Développeur web" },
      tagline: { fr: "Accroche." },
      bio: { fr: "Bio." },
      githubLogin: "Stryxman",
      socials: [{ kind: "github", url: "https://github.com/Stryxman" }],
    });
    expect(p.email).toBeUndefined();
    expect(p.showEmail).toBe(false);
  });
  it("valide un skill et une expérience", () => {
    expect(skillSchema.parse({ id: "astro", name: "Astro", category: "framework", order: 1 }).showOnAbout).toBe(true);
    expect(() =>
      experienceSchema.parse({ id: "x", kind: "work", title: { fr: "x" }, organization: "o", start: "2026-13", order: 1 }),
    ).toThrow();
  });
});
