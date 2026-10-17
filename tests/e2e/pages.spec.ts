import { test, expect } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parse } from "yaml";

// Attentes calculées depuis src/content, pour que les tests suivent l'ajout de projets.
// Sans BASE_URL (serveur de dev), les brouillons sont visibles ; BASE_URL désigne la production.
const DIR = "src/content/projects";
const projects = readdirSync(DIR)
  .filter((d) => existsSync(`${DIR}/${d}/meta.yaml`))
  .map((slug) => ({ slug, ...parse(readFileSync(`${DIR}/${slug}/meta.yaml`, "utf8")) }))
  .filter(
    (m) => m.status === "published" || (!process.env.BASE_URL && (m.status ?? "draft") === "draft"),
  )
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.slug.localeCompare(b.slug));
// ordre de la grille : par catégorie (PROJECT_CATEGORIES), puis order et slug
const CATEGORIES = [
  "website",
  "artifact",
  "ai-agent",
  "automation",
  "application",
  "business-case",
];
const grid = [...projects].sort(
  (a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category),
);
const profile = parse(readFileSync("src/content/profile.yaml", "utf8")).main;
const linked = projects.find((m) => m.liveUrl && m.repo);
const bare = projects.find((m) => !m.liveUrl && !m.repo);

test("accueil : nom, rôle, accroche, actions et projets", async ({ page }) => {
  await page.goto("/fr/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(profile.headline.fr);
  await expect(page.getByText(profile.role.fr, { exact: true })).toBeVisible();
  await expect(page.getByText(profile.tagline.fr)).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir les projets" })).toHaveAttribute(
    "href",
    "/fr/projets/",
  );
  await expect(page.getByRole("link", { name: "Me contacter" })).toHaveAttribute(
    "href",
    "/fr/a-propos/#contact",
  );
  const featured = projects.filter((m) => m.featured);
  await expect(page.locator("[data-featured] [data-project]")).toHaveCount(
    (featured.length ? featured : projects).length,
  );
});

test("le titre du hero tient sur 2 lignes, en FR et en EN", async ({ page }) => {
  for (const path of ["/fr/", "/en/"]) {
    await page.goto(path);
    const box = await page.getByRole("heading", { level: 1 }).evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      line: parseFloat(getComputedStyle(el).lineHeight),
    }));
    expect(box.height, path).toBeLessThanOrEqual(box.line * 2 + 1);
  }
});

test("projets : une section par catégorie présente, tous les projets visibles, dans l'ordre", async ({
  page,
}) => {
  await page.goto("/fr/projets/");
  await expect(page.locator("[data-category]")).toHaveCount(
    new Set(projects.map((m) => m.category)).size,
  );
  const cards = page.locator("[data-grid] [data-project]");
  await expect(cards).toHaveCount(projects.length);
  await expect(cards.first().getByRole("link")).toHaveText(grid[0]!.title.fr);
});

test("une fiche avec image montre la capture, sans sceau en double", async ({ page }) => {
  const withCover = projects.find((m) => m.cover);
  test.skip(!withCover, "aucun projet avec cover");
  await page.goto(`/fr/projets/${withCover!.slug}/`);
  await expect(page.locator("[data-preview] img")).toBeVisible();
  await expect(page.locator("[data-preview] svg")).toHaveCount(0);
});

test("sans choix enregistré, le site s'ouvre en sombre, même si le système est clair", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("/fr/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await ctx.close();
});

test("fiche : cartel, liens externes, sceau en repli", async ({ page }) => {
  test.skip(!linked, "aucun projet avec site et dépôt");
  await page.goto(`/fr/projets/${linked!.slug}/`);
  await expect(page.getByRole("heading", { level: 1, name: linked!.title.fr })).toBeVisible();
  const cartel = page.locator("[data-cartel]");
  const site = cartel.getByRole("link", { name: /Ouvrir le site/ });
  await expect(site).toHaveAttribute("href", linked!.liveUrl);
  await expect(site).toHaveAttribute("target", "_blank");
  await expect(cartel.getByRole("link", { name: /Voir le code/ })).toHaveAttribute(
    "href",
    `https://github.com/${linked!.repo}`,
  );
  await expect(page.locator("[data-preview] figcaption")).toHaveText(
    new URL(linked!.liveUrl).hostname.replace(/^www\./, ""),
  );
  if (
    !linked!.cover && // l'image déclarée dans meta.yaml, quel que soit son format
    !existsSync(`src/assets/captures/${linked!.slug}.webp`)
  ) {
    await expect(page.locator("[data-preview] svg:visible")).toHaveCount(1);
  }
});

test("projet sans site ni dépôt : ni boutons ni barre de domaine", async ({ page }) => {
  test.skip(!bare, "tous les projets ont un site ou un dépôt");
  await page.goto(`/fr/projets/${bare!.slug}/`);
  await expect(page.getByRole("link", { name: /Ouvrir le site|Voir le code/ })).toHaveCount(0);
  await expect(page.locator("[data-preview] figcaption")).toHaveCount(0);
});

test("navigation vers le projet suivant, sans boucler", async ({ page }) => {
  test.skip(projects.length < 2, "un seul projet");
  const nav = page.getByRole("navigation", { name: "Autres projets" });
  await page.goto(`/fr/projets/${projects[0]!.slug}/`);
  await expect(nav.getByRole("link")).toHaveCount(1);
  await nav.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/fr/projets/${projects[1]!.slug}/$`));
});

test("la carte et le cadre de la fiche partagent leur nom de transition", async ({ page }) => {
  await page.goto("/fr/projets/");
  const card = page.locator("[data-grid] [data-project]").first();
  const name = await card
    .locator("[data-frame]")
    .evaluate((el) => getComputedStyle(el).viewTransitionName);
  await card.getByRole("link").click();
  await expect(page).toHaveURL(/\/fr\/projets\/[a-z0-9-]+\/$/);
  const frame = await page
    .locator("[data-preview]")
    .evaluate((el) => getComputedStyle(el).viewTransitionName);
  expect(name).not.toBe("none");
  expect(frame).toBe(name);
});

test("un projet inconnu renvoie la 404 bilingue", async ({ page }) => {
  const res = await page.goto("/fr/projets/inconnu/");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Projects" })).toHaveAttribute(
    "href",
    "/en/projects/",
  );
});

test("à propos : compétences groupées et section contact", async ({ page }) => {
  await page.goto("/fr/a-propos/");
  await expect(page.getByRole("heading", { level: 1, name: "À propos" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Langages" })).toBeVisible();
  const contact = page.locator("#contact");
  await expect(contact.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/Stryxman",
  );
  const cvs = ["fr", "en"].filter((l) => existsSync(`public/cv/cv-${l}.pdf`)).length;
  await expect(page.getByRole("link", { name: /Télécharger le CV|Download CV/ })).toHaveCount(cvs);
});

test("navigation : page courante et liens sociaux du pied de page", async ({ page, isMobile }) => {
  test.skip(isMobile, "navigation du bureau");
  await page.goto("/fr/projets/");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav.getByRole("link", { name: "Projets" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" })).toBeVisible();
});

test("mentions légales : hébergeur indiqué, dans les deux langues", async ({ page }) => {
  for (const path of ["/fr/mentions-legales/", "/en/legal/"]) {
    await page.goto(path);
    await expect(page.locator(".prose")).toContainText("Vercel Inc.");
  }
});

test("aucun défilement horizontal", async ({ page }) => {
  for (const path of [
    "/fr/",
    "/en/projects/",
    `/fr/projets/${projects[0]!.slug}/`,
    "/en/about/",
    "/en/legal/",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      path,
    ).toBe(true);
  }
});
