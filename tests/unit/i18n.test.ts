import { describe, it, expect } from "vitest";
import { pathFor, projectPath, alternatesFor } from "../../src/i18n/routes";
import { ui, t, fmt } from "../../src/i18n/ui";
import { otherLocale } from "../../src/i18n/config";

describe("routes", () => {
  it("traduit les slugs de page", () => {
    expect(pathFor("about", "fr")).toBe("/fr/a-propos/");
    expect(pathFor("about", "en")).toBe("/en/about/");
    expect(pathFor("legal", "en")).toBe("/en/legal/");
  });
  it("garde le même slug de projet dans les deux langues", () => {
    expect(projectPath("atelier-lumen", "fr")).toBe("/fr/projets/atelier-lumen/");
    expect(projectPath("atelier-lumen", "en")).toBe("/en/projects/atelier-lumen/");
  });
  it("fournit les alternates d'une page", () => {
    expect(alternatesFor("projects")).toEqual({ fr: "/fr/projets/", en: "/en/projects/" });
  });
  it("bascule de langue", () => {
    expect(otherLocale("fr")).toBe("en");
    expect(otherLocale("en")).toBe("fr");
  });
});

describe("textes d'interface", () => {
  it("ont les mêmes clés et aucune valeur vide", () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.fr).sort());
    for (const dict of [ui.fr, ui.en])
      for (const v of Object.values(dict)) expect(v.trim()).not.toBe("");
  });
  it("ne contiennent ni tiret cadratin ni demi-cadratin", () => {
    for (const dict of [ui.fr, ui.en])
      for (const v of Object.values(dict)) expect(v).not.toMatch(/[—–]/);
  });
  it("traduit une clé", () => {
    expect(t("fr", "cta.contact")).toBe("Me contacter");
    expect(t("en", "cta.contact")).toBe("Get in touch");
  });
});

describe("fmt", () => {
  it("remplace les variables", () => {
    expect(fmt("fr", "period.since", { y: 2024 })).toBe("Depuis 2024");
    expect(fmt("en", "period.since", { y: 2024 })).toBe("Since 2024");
  });
});
