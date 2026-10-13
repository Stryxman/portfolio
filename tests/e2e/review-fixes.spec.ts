import { test, expect } from "@playwright/test";

test("la police de repli est une sans empattement tant que Switzer est absente", async ({ page }) => {
  await page.goto("/fr/");
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toContain("ui-sans-serif");
});

test("stockage bloqué : la préférence système sombre est quand même appliquée", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  await ctx.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("bloqué", "SecurityError");
      },
    });
  });
  const page = await ctx.newPage();
  await page.goto("/fr/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await ctx.close();
});

test("sans JavaScript, le thème sombre du système s'applique", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark", javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/fr/");
  const [bg, darkBg] = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "oklch(0.165 0.006 265)";
    document.body.append(probe);
    return [getComputedStyle(document.body).backgroundColor, getComputedStyle(probe).color];
  });
  expect(bg).toBe(darkBg);
  await ctx.close();
});

test.describe("menu mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile uniquement");

  test("donne accès à la langue et au thème", async ({ page }) => {
    await page.goto("/fr/");
    await page.getByRole("banner").getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "English" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Thème sombre" })).toBeVisible();
  });

  test("en mouvement réduit, l'ouverture est un simple fondu", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/fr/");
    await page.getByRole("banner").getByRole("button", { name: "Menu" }).click();
    const anim = await page.evaluate(() => {
      const d = document.querySelector("dialog[data-menu]")!;
      const s = getComputedStyle(d);
      return { name: s.animationName, duration: parseFloat(s.animationDuration) };
    });
    expect(anim.name).toBe("menu-fade");
    expect(anim.duration).toBeGreaterThan(0.1);
    await ctx.close();
  });
});
