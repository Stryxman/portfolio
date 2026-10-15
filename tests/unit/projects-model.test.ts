import { describe, it, expect } from "vitest";
import {
  domainOf,
  formatPeriod,
  neighbours,
  projectStatus,
  toCard,
} from "../../src/lib/projects/model";

const NOW = new Date("2026-10-15T12:00:00Z");

describe("formatPeriod", () => {
  it("ne renvoie rien sans dates", () => {
    expect(formatPeriod(undefined, undefined, "fr", NOW)).toBeUndefined();
  });
  it("donne une seule année quand tout tient dans l'année", () => {
    expect(formatPeriod("2025-03", "2025-11", "fr", NOW)).toBe("2025");
    expect(formatPeriod(undefined, "2024", "en", NOW)).toBe("2024");
    expect(formatPeriod("2026-10", undefined, "fr", NOW)).toBe("2026");
  });
  it("écrit une étendue avec un trait d'union simple", () => {
    expect(formatPeriod("2023", "2025-02", "fr", NOW)).toBe("2023-2025");
  });
  it("dit « Depuis » pour un projet en cours commencé une année passée", () => {
    expect(formatPeriod("2024-05", undefined, "fr", NOW)).toBe("Depuis 2024");
    expect(formatPeriod("2024-05", undefined, "en", NOW)).toBe("Since 2024");
  });
});

describe("projectStatus", () => {
  it("en cours sans fin, terminé avec une fin, inconnu sans dates", () => {
    expect(projectStatus("2026-10", undefined)).toBe("ongoing");
    expect(projectStatus("2024", "2025")).toBe("done");
    expect(projectStatus(undefined, undefined)).toBeUndefined();
  });
});

describe("toCard", () => {
  it("localise, avec repli sur le français signalé par la langue", () => {
    const card = toCard(
      {
        slug: "demo",
        title: { fr: "Démo", en: "" },
        summary: { fr: "Un site.", en: "A site." },
        category: "website",
        provenance: "cms",
        start: "2025",
      },
      "en",
      NOW,
    );
    expect(card.title).toEqual({ text: "Démo", lang: "fr" });
    expect(card.summary).toEqual({ text: "A site.", lang: "en" });
    expect(card.period).toBe("Since 2025");
    expect(card.image).toBeUndefined();
  });
});

describe("utilitaires", () => {
  it("donne les voisins sans boucler", () => {
    expect(neighbours(["a", "b", "c"], "a")).toEqual({ prev: undefined, next: "b" });
    expect(neighbours(["a", "b", "c"], "c")).toEqual({ prev: "b", next: undefined });
    expect(neighbours(["a"], "z")).toEqual({ prev: undefined, next: undefined });
  });
  it("extrait le domaine sans www", () => {
    expect(domainOf("https://www.exemple.fr/page")).toBe("exemple.fr");
  });
});
