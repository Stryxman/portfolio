import { describe, it, expect } from "vitest";
import { ariaCurrent, contactHref, navLinks } from "../../src/i18n/nav";

describe("navigation", () => {
  it("liste Projets puis À propos (le contact vit dans À propos)", () => {
    expect(navLinks.map(([key]) => key)).toEqual(["projects", "about"]);
    expect(contactHref("fr")).toBe("/fr/a-propos/#contact");
    expect(contactHref("en")).toBe("/en/about/#contact");
  });
  it("marque la page courante et sa rubrique", () => {
    expect(ariaCurrent("/fr/projets/", "/fr/projets/")).toBe("page");
    expect(ariaCurrent("/fr/projets/compagnon/", "/fr/projets/")).toBe("true");
    expect(ariaCurrent("/fr/a-propos/", "/fr/projets/")).toBeUndefined();
  });
});
