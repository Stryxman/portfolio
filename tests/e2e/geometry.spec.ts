import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { finishIntro } from "./intro";

test("l'accueil affiche la spirale, décorative, sans décaler la mise en page", async ({ page }) => {
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
    await finishIntro(page);
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

test("la spirale tourne en CSS, et s'arrête en mouvement réduit", async ({ browser }) => {
  for (const [reducedMotion, attendu] of [
    ["no-preference", "spiral-spin"],
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

test("ouverture : le nom attend la spirale, puis s'affiche ; jamais masqué en mouvement réduit", async ({
  browser,
}) => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const ctx = await browser.newContext({ reducedMotion });
    const page = await ctx.newPage();
    await page.goto("/fr/");
    const h1 = page.getByRole("heading", { level: 1 });
    const anim = await h1.evaluate((el) => getComputedStyle(el).animationName);
    expect(anim, reducedMotion).toBe(reducedMotion === "reduce" ? "none" : "hero-in");
    // à la fin de la chorégraphie, tout le texte du hero est opaque et les 233 graines sont à leur place
    await finishIntro(page);
    await expect(h1).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-field] .spiral-dark path")).toHaveCount(233);
    await ctx.close();
  }
});

test("l'ouverture ne se rejoue pas en revenant sur l'accueil par navigation interne", async ({
  page,
}) => {
  await page.goto("/fr/");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "");
  await page.goto("/fr/projets/");
  await page.getByRole("banner").getByRole("link", { name: "Richard" }).click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-intro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("animation-name", "none");
});

for (const path of ["/fr/", "/fr/a-propos/"]) {
  test(`la sphère est décorative, dessinée sur canvas, avec une image fixe en repli (${path})`, async ({
    page,
  }) => {
    await page.goto(path);
    const sphere = page.locator("[data-sphere]");
    await expect(sphere).toHaveAttribute("aria-hidden", "true");
    await expect(sphere.locator("svg")).toHaveCount(2); // un repli par thème
    await sphere.scrollIntoViewIfNeeded();
    await expect(sphere).toHaveAttribute("data-live", "");
    // le canvas a bien reçu des pixels
    await expect
      .poll(() =>
        sphere.locator("canvas").evaluate((c: HTMLCanvasElement) => {
          const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < data.length; i += 4) if (data[i]) return true;
          return false;
        }),
      )
      .toBe(true);
  });
}

test("la spirale porte les nombres de la suite, en contenu décoratif", async ({ page }) => {
  await page.goto("/fr/");
  const labels = page.locator("[data-field] .sp-num");
  await expect(labels).toHaveCount(12);
  expect(await labels.evaluateAll((els) => els.map((el) => el.getAttribute("data-n")))).toEqual([
    "1",
    "2",
    "3",
    "5",
    "8",
    "13",
    "21",
    "34",
    "55",
    "89",
    "144",
    "233",
  ]);
  // aucun texte dans le DOM : les lecteurs d'écran et la recherche dans la page ne voient rien
  await expect(page.locator("[data-field]")).toHaveText("");
});

test("à la souris, les graines voisines du pointeur réagissent, puis reviennent", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "pointeur fin uniquement");
  await page.goto("/fr/");
  await finishIntro(page);
  const moved = () =>
    page
      .locator("[data-field] svg path")
      .evaluateAll((els) => els.filter((el) => (el as SVGElement).style.transform).length);
  const box = (await page.locator("[data-field-motion]").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 6 });
  await expect.poll(moved).toBeGreaterThan(3);
  await page.mouse.move(2, 2);
  await page.evaluate(() => document.documentElement.dispatchEvent(new Event("pointerleave")));
  await expect.poll(moved).toBe(0);
});
