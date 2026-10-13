import { describe, it, expect } from "vitest";
import { checkProjects, checkProfile, checkPeriod, type ProjectInput } from "../../src/lib/content/rules";

const base = (over: Partial<ProjectInput> = {}, data: Partial<ProjectInput["data"]> = {}): ProjectInput => ({
  slug: "demo",
  file: "src/content/projects/demo/meta.yaml",
  hasFrBody: true,
  hasEnBody: true,
  hasCapture: true,
  ...over,
  data: {
    title: { fr: "Démo", en: "Demo" },
    summary: { fr: "Un site.", en: "A site." },
    status: "published",
    featured: false,
    ...data,
  },
});

describe("checkProjects", () => {
  it("accepte un projet publié complet", () => {
    expect(checkProjects([base()])).toEqual({ errors: [], warnings: [] });
  });
  it("exige fr.mdx pour un projet publié", () => {
    const { errors } = checkProjects([base({ hasFrBody: false })]);
    expect(errors).toContainEqual(expect.objectContaining({ field: "fr.mdx" }));
  });
  it("exige une image (cover ou capture) pour un projet publié", () => {
    const { errors } = checkProjects([base({ hasCapture: false })]);
    expect(errors).toContainEqual(expect.objectContaining({ field: "cover" }));
  });
  it("tolère un brouillon incomplet", () => {
    expect(checkProjects([base({ hasFrBody: false, hasCapture: false }, { status: "draft" })]).errors).toEqual([]);
  });
  it("refuse plus de 6 projets publiés mis en avant", () => {
    const many = Array.from({ length: 7 }, (_, i) => base({ slug: `p${i}`, file: `p${i}` }, { featured: true }));
    expect(checkProjects(many).errors).toContainEqual(expect.objectContaining({ field: "featured" }));
  });
  it("refuse un tiret cadratin ou demi-cadratin dans le titre ou le résumé", () => {
    const { errors } = checkProjects([
      base({}, { title: { fr: "Site — vitrine", en: "Site" }, summary: { fr: "A – B", en: "x" } }),
    ]);
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(["title.fr", "summary.fr"]));
  });
  it("avertit (sans bloquer) si l'anglais manque sur un projet publié", () => {
    const r = checkProjects([base({ hasEnBody: false }, { summary: { fr: "Un site.", en: "" } })]);
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.field)).toEqual(expect.arrayContaining(["summary.en", "en.mdx"]));
  });
  it("refuse une fin antérieure au début", () => {
    expect(checkProjects([base({}, { start: "2026-05", end: "2025-12" })]).errors).toContainEqual(
      expect.objectContaining({ field: "end" }),
    );
  });
});

describe("checkPeriod", () => {
  it("compare année seule et année-mois", () => {
    expect(checkPeriod("f", "2025", "2025-03")).toEqual([]);
    expect(checkPeriod("f", "2025-03", "2024")).toHaveLength(1);
    expect(checkPeriod("f", "2025-03", undefined)).toEqual([]);
  });
});

describe("checkProfile", () => {
  it("limite l'accroche à 20 mots par langue", () => {
    const long = Array.from({ length: 21 }, () => "mot").join(" ");
    expect(checkProfile("p", { tagline: { fr: long, en: "Short." } }).errors).toContainEqual(
      expect.objectContaining({ field: "tagline.fr" }),
    );
  });
  it("refuse un tiret cadratin dans l'accroche", () => {
    expect(checkProfile("p", { tagline: { fr: "Vite — et bien", en: "ok" } }).errors).toHaveLength(1);
  });
});
