import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("l'accueil affiche le champ statique, décoratif, sans décaler la mise en page", async ({ page }) => {
  await page.goto("/fr/");
  const field = page.locator("[data-field]");
  await expect(field).toHaveAttribute("aria-hidden", "true");
  await expect(field.locator("svg:visible")).toHaveCount(1);
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
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

test("la planche montre 12 sceaux, un seul monde visible par sceau", async ({ page }) => {
  await page.goto("/dev/geometrie/");
  await expect(page.locator("svg.seal-light:visible")).toHaveCount(12);
  await expect(page.locator("svg.seal-dark:visible")).toHaveCount(0);
});
