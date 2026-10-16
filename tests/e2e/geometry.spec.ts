import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("l'accueil affiche le champ statique, décoratif, sans décaler la mise en page", async ({
  page,
}) => {
  await page.goto("/fr/");
  const field = page.locator("[data-field]");
  await expect(field).toHaveAttribute("aria-hidden", "true");
  await expect(field.locator("svg:visible")).toHaveCount(1);
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as {
            value: number;
            hadRecentInput: boolean;
          }[]) {
            if (!e.hadRecentInput) total += e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 1000);
      }),
  );
  expect(cls).toBeLessThan(0.1);
});

test("le titre de l'accueil reste lisible sur le champ (axe, deux thèmes)", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.goto("/fr/");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  }
});

test("la planche montre 14 sceaux (dont un doublon), un seul monde visible par sceau", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/dev/geometrie/");
  await expect(page.locator("svg.seal-light:visible")).toHaveCount(14);
  await expect(page.locator("svg.seal-dark:visible")).toHaveCount(0);
});

test("aucun identifiant en double sur l'accueil et la planche (sceau répété compris)", async ({
  page,
}) => {
  for (const path of ["/fr/", "/dev/geometrie/"]) {
    await page.goto(path);
    const dupes = await page.evaluate(() => {
      const seen = new Map<string, number>();
      document
        .querySelectorAll("[id]")
        .forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
      return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(dupes).toEqual([]);
  }
});

test("le champ sombre s'anime en CSS, et s'arrête en mouvement réduit", async ({ browser }) => {
  for (const [reducedMotion, attendu] of [
    ["no-preference", "field-cycle"],
    ["reduce", "none"],
  ] as const) {
    const ctx = await browser.newContext({ reducedMotion });
    const page = await ctx.newPage();
    await page.goto("/fr/");
    const name = await page
      .locator("[data-field-motion]")
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(name, reducedMotion).toBe(attendu);
    await ctx.close();
  }
});
