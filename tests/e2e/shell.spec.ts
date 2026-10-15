import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("redirection initiale", () => {
  for (const [locale, attendu] of [
    ["fr-FR", /\/fr\/$/],
    ["en-US", /\/en\/$/],
  ] as const) {
    test(`navigateur ${locale}`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page).toHaveURL(attendu);
      await ctx.close();
    });
  }
});

test("chaque page déclare sa langue", async ({ page }) => {
  for (const [path, lang] of [
    ["/fr/", "fr"],
    ["/en/about/", "en"],
    ["/fr/mentions-legales/", "fr"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
  }
});

test("le sélecteur de langue garde la page courante", async ({ page }) => {
  await page.goto("/fr/a-propos/");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/about\/$/);
});

test("le thème choisi persiste, sans flash, à la navigation et au rechargement", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "navigation testée sur desktop ; le menu mobile a son propre test");
  await page.goto("/fr/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: "Thème sombre" });
  const initial = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  const choisi = initial === "true" ? "light" : "dark";
  await expect(html).toHaveAttribute("data-theme", choisi);
  // navigation ClientRouter : le swap remplace les attributs de <html> ; sans le rattrapage
  // « astro:after-swap » de Base.astro, data-theme serait absent ici (flash).
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Projets" })
    .click();
  await expect(page).toHaveURL(/\/fr\/projets\/$/);
  await expect(html).toHaveAttribute("data-theme", choisi);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", choisi);
});

test("le lien d'évitement mène au contenu", async ({ page, isMobile }) => {
  test.skip(isMobile, "clavier");
  await page.goto("/fr/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("le menu mobile s'ouvre et se ferme avec Échap", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile uniquement");
  await page.goto("/fr/");
  const bouton = page.getByRole("banner").getByRole("button", { name: "Menu" });
  await bouton.click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(bouton).toBeFocused();
});

for (const theme of ["light", "dark"] as const) {
  test(`aucune violation d'accessibilité sérieuse (thème ${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    for (const path of [
      "/fr/",
      "/en/projects/",
      "/fr/projets/portfolio/",
      "/en/projects/compagnon/",
      "/fr/a-propos/",
      "/en/legal/",
      "/fr/nulle-part/",
    ]) {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual(
        [],
      );
    }
  });
}
