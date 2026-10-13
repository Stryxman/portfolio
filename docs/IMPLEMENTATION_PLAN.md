# Plan d'implémentation : Portfolio

> **Pour les agents d'exécution :** SOUS-SKILL REQUIS : `superpowers:executing-plans` (exécution native) ou `superpowers:subagent-driven-development`. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** mettre en ligne le portfolio bilingue de Richard (Astro statique, contenu en fichiers Git, champ génératif), conforme aux 5 docs validés.

**Architecture :** Astro 7 en sortie statique sur Vercel Hobby. Le contenu est en YAML/MDX validé par Zod. Des instantanés GitHub et des captures sont committés par des jobs GitHub Actions. Une seule fonction serveur (contact). Le build ne dépend d'aucune API externe.

**Stack :** Node 24 LTS, pnpm, TypeScript strict, Astro 7.3, `@astrojs/vercel` 11, `@astrojs/mdx` 8, Tailwind 4.3 (`@tailwindcss/vite`), astro-icon + Phosphor, Vitest 5, Playwright 1.64 + axe-core, culori (tests de contraste).

**Spec :** `portfolio/docs/PRD.md`, `TRD.md`, `APP_FLOW.md`, `BACKEND_SCHEMA.md`, `DESIGN_BRIEF.md` (v1.1). L'exécutant lit la spec **et** ce plan.

## Contexte

Richard veut un site durable, rapide et gratuit qui centralise son profil et ses projets (Claude Code, codés main, CMS) et renvoie vers eux. Les 5 docs de cadrage sont validés (2026-10-13), après révision par le conseil LLM : pas d'admin, pas de base, contenu édité via Claude Code. Ce plan est le 6e document. Il découpe la construction en **phases livrables**, chacune testable et déployée. Le dépôt `portfolio/` ne contient pour l'instant que les docs, et Node.js n'est pas installé.

**Découpage (règle de scope de writing-plans) :** la spec couvre plusieurs sous-systèmes indépendants (socle, contenu, géométrie, pages, moteur WebGL, pipelines, contact, SEO). Ce plan donne donc :
- la **feuille de route complète** (phases 0 à 9 : livrables, fichiers, tests d'acceptation) ;
- le **détail TDD des phases 0 et 1**.

Le détail TDD de chaque phase suivante sera écrit au début de cette phase (`docs/plans/phase-N.md`), contre le code réellement en place. Astro 7 vient de sortir : figer maintenant le code des phases 2 à 9 produirait des API fausses.

## Contraintes globales (valeurs copiées de la spec)

- Node ≥ 22.12 (minimum Astro 6+) ; on installe Node 24 LTS.
- Coût 0 €/mois ; un seul service indispensable à l'affichage (l'hébergeur).
- Le build ne lit **que** des fichiers du dépôt ; aucune API externe au build.
- Lighthouse mobile ≥ 95 en performance, accessibilité, SEO et bonnes pratiques ; LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
- WCAG 2.2 AA : texte ≥ 4,5:1, grand texte et éléments d'interface ≥ 3:1 ; `prefers-reduced-motion` respecté.
- Champ génératif ≤ 15 Ko gzip, chargé après l'affichage, accueil seulement, densité de pixels ≤ 1,5.
- Bilingue : préfixe `/fr` et `/en` ; slugs traduits (`/fr/projets` ↔ `/en/projects`, `/fr/a-propos` ↔ `/en/about`, `/fr/mentions-legales` ↔ `/en/legal`).
- **Zéro tiret cadratin (—) ni demi-cadratin (–) dans les textes d'interface** ; un libellé par intention (DESIGN_BRIEF §7).
- Tokens de couleur et typographie exactement ceux de DESIGN_BRIEF §3 ; icônes Phosphor uniquement.
- Animations : uniquement `transform`, `opacity`, `filter` ; jamais `transition: all` ; aucune animation sur action clavier.
- Secrets uniquement dans Vercel ou GitHub Actions ; jamais de secret dans le dépôt.
- Site personnel non commercial (Vercel Hobby) : aucune offre de prestations.
- Imports Astro : `z` depuis `astro/zod` (Zod 4 : `z.email()`, `z.url()`), loaders depuis `astro/loaders`, `<ClientRouter />` depuis `astro:transitions`, `<Font />` depuis `astro:assets`.

## Points de vigilance (Review Focus)

Cas que la spec implique mais qu'aucun test « nominal » ne couvre, du plus probable au moins probable :

1. **Texte EN manquant ou 40 % plus long que le FR** (cartes, boutons, titres) : la page EN retombe sur le FR avec `lang="fr"`, rien ne déborde, aucun bouton ne passe sur 2 lignes. Test → Phase 2 (repli) et Phase 4 (`break-ui` + E2E « libellés EN longs »).
2. **Projet sans capture, sans dépôt et sans URL** (vieux site CMS hors ligne) : carte et fiche s'affichent avec le sceau, sans bloc GitHub ni bouton « Ouvrir le site ». Test → Phase 4.
3. **Changer de langue sur une grille filtrée** : les filtres (`?provenance=cms`) sont conservés. Test → Phase 4.
4. **WebGL2 absent, onglet caché, mouvement réduit, mobile modeste** : SVG statique ou pause, aucune erreur console, aucun coût CPU onglet caché. Test → Phase 5.
5. **Contact : double clic sur Envoyer, Turnstile pas encore prêt, Resend en panne** : un seul email, message clair, saisie conservée. Test → Phase 7.

Plus, dès la Phase 1 : **pas de flash de thème** lors d'une navigation `ClientRouter` (l'attribut `data-theme` de `<html>` est remplacé au swap). Test → Tâche 1.4.

## Méthode de travail (pour chaque phase)

**Exécution : native** (choix de Richard, 2026-10-13). Claude exécute les tâches dans la session avec `superpowers:executing-plans`, puis `/code-review` en fin de phase.

1. Écrire le plan détaillé de la phase (`docs/plans/phase-N.md`, TDD, sans placeholder), puis le valider avec Richard.
2. Exécuter les tâches en TDD, avec un commit par tâche, sur la branche `phase-N`.
3. Pour les phases UI : revues `review-animations`, `break-ui` et `impeccable audit` (sans lancer son CLI).
4. Lancer `/code-review` sur la branche, corriger, puis ouvrir une PR vers `main` (aperçu Vercel + CI vertes).
5. Mettre à jour `PROGRESS.md` (récap court) et `docs/REPRISE.md`, puis fusionner après accord de Richard.

---

## Feuille de route

| Phase | Livrable déployé | Dépend de | Tests d'acceptation clés |
|---|---|---|---|
| **0. Environnement** | Node 24 + pnpm opérationnels | — | `node -v` ≥ 22.12, `pnpm -v` |
| **1. Socle** | Coquille bilingue (5 pages × 2 langues) avec tokens, polices, thème, en-tête et pied de page, CI, aperçu Vercel | 0 | Tâches 1.1 à 1.6 ci-dessous |
| **2. Contenu** | `src/content.config.ts` (BACKEND_SCHEMA §3), intégration `validateContent()`, contenu réel minimal (profil + `compagnon` + `portfolio`), `pnpm check:content`, `pnpm projet:nouveau` | 1 | Fichier invalide → build en échec avec chemin et champ ; brouillon absent du build prod ; `featured` > 6 → erreur ; tiret cadratin dans `title` → erreur ; EN manquant → avertissement + repli FR |
| **3. Géométrie** | `src/lib/geometry/` (matrices 2×2, interpolation, bruit déterministe, PRNG à graine, empreinte de slug), `Seal.astro` (sceau SVG 2 thèmes), `FieldStatic.astro` (SVG de la 1re image du champ) | 1 | Même slug → même SVG (snapshot) ; famille de matrice selon la provenance (DESIGN_BRIEF §5.3) ; SVG valide < 4 Ko |
| **4. Pages** | Accueil (champ statique), Projets (grille + filtres + View Transitions), Fiche (cartel, aperçu à la demande, stats GitHub), À propos (CV), Mentions légales, 404 | 2, 3 | Vigilance 1, 2, 3 ; filtre → URL ; iframe chargée seulement au clic, repli sur la capture après 8 s ; axe sans violation sérieuse ; Lighthouse ≥ 95 |
| **5. Champ** | `src/lib/champ/` WebGL2 (programmes « Transformation » et « Traceur »), repli Canvas 2D, îlot de l'accueil, fondu au changement de thème | 3, 4 | Vigilance 4 ; budget ≤ 15 Ko gzip (test CI sur le bundle) ; LCP = texte du hero ; pause hors écran ; 0 erreur console |
| **6. Données auto** | `scripts/sync-github.ts`, `scripts/captures.ts`, `src/data/*.json`, `src/assets/captures/`, workflows `sync-github.yml` et `captures.yml` | 2 | API simulée → JSON attendu ; erreur API → fichier inchangé et sortie ≠ 0 ; pas de commit si aucun changement ; détection `X-Frame-Options`/`frame-ancestors` |
| **7. Contact** | Action `contact` (BACKEND_SCHEMA §5), formulaire, Turnstile, Resend | 4 | Vigilance 5 ; Turnstile invalide → refus ; champ piège rempli → refus silencieux ; validation Zod (longueurs) |
| **8. SEO et sécurité** | Images OG (satori), sitemap, JSON-LD, en-têtes CSP dans `vercel.json`, Vercel Analytics | 4 | Chaque page a un titre, une description, un canonical et des `hreflang` ; la CSP n'empêche ni Turnstile ni Analytics (E2E sans erreur CSP) |
| **9. Contenu réel et mise en ligne** | Tous les projets, bio, CV, portrait ; relecture `design:ux-copy` et `design:accessibility-review` ; Lighthouse CI ; domaine | 1 à 8 | Critères d'acceptation du PRD §10 au complet |

---

## Arborescence cible (vue d'ensemble)

```
portfolio/
  astro.config.mjs · package.json · tsconfig.json · vercel.json
  vitest.config.ts · playwright.config.ts · eslint.config.js · .prettierrc
  .github/workflows/ ci.yml · sync-github.yml · captures.yml
  scripts/ sync-github.ts · captures.ts · new-project.ts
  src/
    assets/fonts/ · assets/captures/
    content/ profile.yaml · skills.yaml · experiences.yaml · projects/<slug>/…
    content.config.ts
    data/ github.json · previews.json
    i18n/ config.ts · routes.ts · ui.ts
    lib/ geometry/ · champ/ · content/ (règles validateContent)
    actions/ index.ts
    components/ Header · Footer · LanguageSwitch · ThemeToggle · MobileMenu · Seal · FieldStatic · ProjectCard · …
    layouts/ Base.astro
    views/ HomeView · ProjectsView · ProjectView · AboutView · ContactView · LegalView
    pages/ index.astro · 404.astro · fr/… · en/…   (fichiers fins qui appellent une vue)
    styles/ global.css
  tests/ unit/ · e2e/
```

Patron des pages : chaque route est un fichier fin par langue (`src/pages/fr/a-propos.astro`, `src/pages/en/about.astro`) qui rend la vue partagée (`<AboutView locale="fr" />`). Cela suffit pour les slugs traduits, sans route dynamique.

---

## Phase 0 : Environnement

### Tâche 0.1 : installer Node 24 et pnpm

**Fichiers :** aucun (machine).

- [ ] **Étape 1 : vérifier l'absence actuelle**
  Run : `command -v node || echo absent`
  Attendu : `absent`

- [ ] **Étape 2 : installer fnm.** Le script d'installation est téléchargé depuis `https://fnm.vercel.app/install`. **Demander l'accord explicite de Richard avant le téléchargement.**
  ```bash
  curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
  ```
  Puis ajouter à `~/.bashrc` : `eval "$(fnm env --use-on-cd --shell bash)"` (Richard confirme la modification du fichier).

- [ ] **Étape 3 : installer Node 24 LTS et activer pnpm**
  ```bash
  fnm install 24 && fnm default 24
  corepack enable
  ```

- [ ] **Étape 4 : vérifier**
  Run : `node -v && pnpm -v`
  Attendu : `v24.x.x` puis une version 10.x de pnpm.

---

## Phase 1 : Socle

Branche : `phase-1`. Fin de phase : `/code-review`, PR, aperçu Vercel.

### Tâche 1.1 : squelette Astro et outillage

**Fichiers :**
- Créer : `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc`, `src/env.d.ts`
- Modifier : `.gitignore` (déjà présent, rien à changer sauf ajout de `dist/`)

**Interfaces :** produit les scripts `pnpm dev | build | check | test | e2e | lint | format` utilisés par toutes les tâches.

- [ ] **Étape 1 : créer `package.json`**
  ```json
  {
    "name": "portfolio",
    "private": true,
    "type": "module",
    "engines": { "node": ">=22.12" },
    "scripts": {
      "dev": "astro dev",
      "build": "astro build",
      "check": "astro check",
      "test": "vitest run",
      "test:watch": "vitest",
      "e2e": "playwright test",
      "lint": "eslint .",
      "format": "prettier --write ."
    }
  }
  ```
- [ ] **Étape 2 : installer les dépendances** (versions résolues par pnpm, puis figées par le lockfile)
  ```bash
  corepack use pnpm@latest
  pnpm add astro @astrojs/vercel @astrojs/mdx @astrojs/sitemap tailwindcss @tailwindcss/vite astro-icon @iconify-json/ph
  pnpm add -D typescript @astrojs/check vitest @playwright/test @axe-core/playwright culori @types/culori eslint typescript-eslint eslint-plugin-astro prettier prettier-plugin-astro geist
  pnpm exec playwright install chromium
  ```
- [ ] **Étape 3 : créer `astro.config.mjs`** (la partie `fonts` est ajoutée en Tâche 1.3)
  ```js
  import { defineConfig } from "astro/config";
  import vercel from "@astrojs/vercel";
  import mdx from "@astrojs/mdx";
  import sitemap from "@astrojs/sitemap";
  import icon from "astro-icon";
  import tailwindcss from "@tailwindcss/vite";

  export default defineConfig({
    site: process.env.SITE_URL ?? "http://localhost:4321",
    trailingSlash: "always",
    adapter: vercel(),
    integrations: [mdx(), sitemap(), icon()],
    i18n: {
      defaultLocale: "fr",
      locales: ["fr", "en"],
      routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
    },
    vite: { plugins: [tailwindcss()] },
  });
  ```
- [ ] **Étape 4 : créer `tsconfig.json`**
  ```json
  {
    "extends": "astro/tsconfigs/strictest",
    "include": [".astro/types.d.ts", "**/*"],
    "exclude": ["dist"]
  }
  ```
- [ ] **Étape 5 : créer `vitest.config.ts`**
  ```ts
  import { defineConfig } from "vitest/config";
  export default defineConfig({ test: { include: ["tests/unit/**/*.test.ts"], environment: "node" } });
  ```
- [ ] **Étape 6 : créer `playwright.config.ts`**
  ```ts
  import { defineConfig, devices } from "@playwright/test";

  const baseURL = process.env.BASE_URL ?? "http://localhost:4321";

  export default defineConfig({
    testDir: "tests/e2e",
    retries: process.env.CI ? 1 : 0,
    use: { baseURL, trace: "on-first-retry" },
    projects: [
      { name: "desktop", use: { ...devices["Desktop Chrome"] } },
      { name: "mobile", use: { ...devices["Pixel 7"] } },
    ],
    webServer: process.env.BASE_URL
      ? undefined
      : { command: "pnpm dev --port 4321", url: baseURL, reuseExistingServer: !process.env.CI },
  });
  ```
- [ ] **Étape 7 : créer `eslint.config.js` et `.prettierrc`**
  ```js
  import tseslint from "typescript-eslint";
  import astro from "eslint-plugin-astro";

  export default [
    { ignores: ["dist/", ".astro/", ".vercel/", "node_modules/", "playwright-report/"] },
    ...tseslint.configs.recommended,
    ...astro.configs.recommended,
  ];
  ```
  ```json
  { "plugins": ["prettier-plugin-astro"], "printWidth": 100 }
  ```
- [ ] **Étape 8 : vérifier que l'outillage tourne à vide**
  Run : `pnpm check && pnpm lint`
  Attendu : 0 erreur. Vitest ne trouve encore aucun test, c'est normal.
- [ ] **Étape 9 : commit**
  ```bash
  git checkout -b phase-1
  git add -A && git commit -m "chore: squelette Astro 7 et outillage (Vitest, Playwright, ESLint, Prettier)"
  ```

### Tâche 1.2 : i18n (routes et textes d'interface)

**Fichiers :**
- Créer : `src/i18n/config.ts`, `src/i18n/routes.ts`, `src/i18n/ui.ts`
- Test : `tests/unit/i18n.test.ts`

**Interfaces :**
- Produit : `type Locale = "fr" | "en"` ; `locales` ; `pathFor(key: RouteKey, locale: Locale): string` ; `projectPath(slug: string, locale: Locale): string` ; `alternatesFor(key: RouteKey): Record<Locale, string>` ; `t(locale: Locale, key: UiKey): string` ; `otherLocale(locale: Locale): Locale`.

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**
  ```ts
  import { describe, it, expect } from "vitest";
  import { pathFor, projectPath, alternatesFor } from "../../src/i18n/routes";
  import { ui, t } from "../../src/i18n/ui";
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
      for (const dict of [ui.fr, ui.en]) for (const v of Object.values(dict)) expect(v.trim()).not.toBe("");
    });
    it("ne contiennent ni tiret cadratin ni demi-cadratin", () => {
      for (const dict of [ui.fr, ui.en]) for (const v of Object.values(dict)) expect(v).not.toMatch(/[—–]/);
    });
    it("traduit une clé", () => {
      expect(t("fr", "cta.contact")).toBe("Me contacter");
      expect(t("en", "cta.contact")).toBe("Get in touch");
    });
  });
  ```
- [ ] **Étape 2 : lancer**
  Run : `pnpm test`
  Attendu : FAIL (modules introuvables).
- [ ] **Étape 3 : implémenter `src/i18n/config.ts`**
  ```ts
  export const locales = ["fr", "en"] as const;
  export type Locale = (typeof locales)[number];
  export const defaultLocale: Locale = "fr";
  export const otherLocale = (locale: Locale): Locale => (locale === "fr" ? "en" : "fr");
  ```
- [ ] **Étape 4 : implémenter `src/i18n/routes.ts`**
  ```ts
  import type { Locale } from "./config";

  export const routes = {
    home: { fr: "/fr/", en: "/en/" },
    projects: { fr: "/fr/projets/", en: "/en/projects/" },
    about: { fr: "/fr/a-propos/", en: "/en/about/" },
    contact: { fr: "/fr/contact/", en: "/en/contact/" },
    legal: { fr: "/fr/mentions-legales/", en: "/en/legal/" },
  } as const satisfies Record<string, Record<Locale, string>>;

  export type RouteKey = keyof typeof routes;

  export const pathFor = (key: RouteKey, locale: Locale): string => routes[key][locale];
  export const projectPath = (slug: string, locale: Locale): string => `${routes.projects[locale]}${slug}/`;
  export const alternatesFor = (key: RouteKey): Record<Locale, string> => ({ ...routes[key] });
  ```
- [ ] **Étape 5 : implémenter `src/i18n/ui.ts`** (libellés de DESIGN_BRIEF §7)
  ```ts
  import type { Locale } from "./config";

  const fr = {
    "nav.projects": "Projets",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.skip": "Aller au contenu",
    "nav.menu": "Menu",
    "nav.close": "Fermer le menu",
    "nav.primary": "Navigation principale",
    "theme.dark": "Thème sombre",
    "lang.switch": "English",
    "footer.legal": "Mentions légales",
    "cta.projects": "Voir les projets",
    "cta.contact": "Me contacter",
    "page.home.title": "Accueil",
    "page.projects.title": "Projets",
    "page.about.title": "À propos",
    "page.contact.title": "Contact",
    "page.legal.title": "Mentions légales",
    "page.notFound.title": "Page introuvable",
  } as const;

  const en: Record<keyof typeof fr, string> = {
    "nav.projects": "Projects",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.skip": "Skip to content",
    "nav.menu": "Menu",
    "nav.close": "Close menu",
    "nav.primary": "Main navigation",
    "theme.dark": "Dark theme",
    "lang.switch": "Français",
    "footer.legal": "Legal notice",
    "cta.projects": "See projects",
    "cta.contact": "Get in touch",
    "page.home.title": "Home",
    "page.projects.title": "Projects",
    "page.about.title": "About",
    "page.contact.title": "Contact",
    "page.legal.title": "Legal notice",
    "page.notFound.title": "Page not found",
  };

  export type UiKey = keyof typeof fr;
  export const ui: Record<Locale, Record<UiKey, string>> = { fr, en };
  export const t = (locale: Locale, key: UiKey): string => ui[locale][key];
  ```
- [ ] **Étape 6 : lancer**
  Run : `pnpm test`
  Attendu : PASS (7 tests).
- [ ] **Étape 7 : commit**
  `git add src/i18n tests/unit/i18n.test.ts && git commit -m "feat(i18n): routes traduites et textes d'interface FR/EN"`

### Tâche 1.3 : tokens, typographie et polices

**Fichiers :**
- Créer : `src/styles/global.css`, `src/assets/fonts/` (Geist + Geist Mono)
- Modifier : `astro.config.mjs` (bloc `fonts`)
- Test : `tests/unit/tokens.test.ts`

**Interfaces :**
- Produit : les classes Tailwind `bg-bg`, `bg-surface`, `text-ink`, `text-ink-muted`, `border-line`, `border-line-strong`, `bg-accent`, `text-accent`, `text-accent-ink`, `text-danger`, `text-success`, `font-sans`, `font-mono`, `rounded-control`, `rounded-panel`, `ease-out`, `ease-in-out`, `ease-drawer` ; les utilitaires `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-small`, `text-meta` ; les variables `--dur-press` (140 ms), `--dur-hover` (180 ms), `--dur-popover` (200 ms), `--dur-page` (280 ms), `--dur-panel` (320 ms), `--dur-reveal` (600 ms) ; la variante `dark:` liée à `[data-theme="dark"]`.

- [ ] **Étape 1 : écrire le test de contraste (il doit échouer, faute de CSS)**
  ```ts
  import { describe, it, expect } from "vitest";
  import { readFileSync } from "node:fs";
  import { parse, wcagContrast } from "culori";

  const css = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8");

  function block(selector: string): Record<string, string> {
    const start = css.indexOf(`${selector} {`); // « {» évite la ligne @custom-variant qui cite aussi le sélecteur
    if (start < 0) throw new Error(`bloc ${selector} introuvable`);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  }

  const themes = {
    clair: block(':root, [data-theme="light"]'),
    sombre: block('[data-theme="dark"]'),
  };

  const ratio = (a: string, b: string) => wcagContrast(parse(a)!, parse(b)!);

  // [premier plan, fond, ratio minimal] selon WCAG 2.2 AA (DESIGN_BRIEF §9)
  const pairs: [string, string, number][] = [
    ["ink", "bg", 4.5], ["ink", "surface", 4.5],
    ["ink-muted", "bg", 4.5], ["ink-muted", "surface", 4.5],
    ["accent", "bg", 4.5],            // liens texte
    ["accent-ink", "accent", 4.5],    // texte des boutons principaux
    ["danger", "bg", 4.5], ["danger", "surface", 4.5],
    ["success", "bg", 4.5],
    ["line-strong", "bg", 3],         // bordures des contrôles (boutons secondaires, champs)
  ];

  describe.each(Object.entries(themes))("contrastes du thème %s", (_nom, tokens) => {
    it.each(pairs)("%s sur %s ≥ %d:1", (fg, bg, min) => {
      expect(ratio(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
    });
  });
  ```
- [ ] **Étape 2 : lancer**
  Run : `pnpm test tests/unit/tokens.test.ts`
  Attendu : FAIL (`global.css` introuvable).
- [ ] **Étape 3 : écrire `src/styles/global.css`** (valeurs de DESIGN_BRIEF §3)
  ```css
  @import "tailwindcss";
  @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

  :root, [data-theme="light"] {
    --bg: oklch(0.985 0.002 265);
    --surface: oklch(0.995 0.001 265);
    --ink: oklch(0.20 0.006 265);
    --ink-muted: oklch(0.47 0.010 265);
    --line: oklch(0.91 0.004 265);
    --line-strong: oklch(0.78 0.006 265);
    --accent: oklch(0.47 0.21 264);
    --accent-ink: oklch(0.985 0.002 265);
    --danger: oklch(0.55 0.19 25);
    --success: oklch(0.55 0.12 155);
    color-scheme: light;
  }

  [data-theme="dark"] {
    --bg: oklch(0.165 0.006 265);
    --surface: oklch(0.205 0.007 265);
    --ink: oklch(0.95 0.004 265);
    --ink-muted: oklch(0.73 0.010 265);
    --line: oklch(0.30 0.008 265);
    --line-strong: oklch(0.43 0.010 265);
    --accent: oklch(0.74 0.14 264);
    --accent-ink: oklch(0.165 0.006 265);
    --danger: oklch(0.70 0.15 25);
    --success: oklch(0.75 0.12 155);
    color-scheme: dark;
  }

  :root {
    --dur-press: 140ms;
    --dur-hover: 180ms;
    --dur-popover: 200ms;
    --dur-page: 280ms;
    --dur-panel: 320ms;
    --dur-reveal: 600ms;
  }

  @theme inline {
    --color-bg: var(--bg);
    --color-surface: var(--surface);
    --color-ink: var(--ink);
    --color-ink-muted: var(--ink-muted);
    --color-line: var(--line);
    --color-line-strong: var(--line-strong);
    --color-accent: var(--accent);
    --color-accent-ink: var(--accent-ink);
    --color-danger: var(--danger);
    --color-success: var(--success);
    --font-sans: var(--font-switzer), ui-sans-serif, system-ui, sans-serif;
    --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  }

  @theme {
    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
    --radius-control: 6px;
    --radius-panel: 10px;
  }

  @utility text-display { font-size: clamp(2.5rem, 1.2rem + 4.2vw, 4.5rem); font-weight: 600; line-height: 1.04; letter-spacing: -0.035em; }
  @utility text-h1 { font-size: clamp(2rem, 1.3rem + 2.6vw, 3.25rem); font-weight: 600; line-height: 1.08; letter-spacing: -0.03em; }
  @utility text-h2 { font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.125rem); font-weight: 600; line-height: 1.15; letter-spacing: -0.02em; }
  @utility text-h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; }
  @utility text-small { font-size: 0.875rem; font-weight: 450; line-height: 1.5; }
  @utility text-meta { font-family: var(--font-mono); font-size: 0.8125rem; line-height: 1.4; font-variant-numeric: tabular-nums; }

  @layer base {
    html { background: var(--bg); color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
    body { font-size: 1.0625rem; line-height: 1.6; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    ::selection { background: var(--accent); color: var(--accent-ink); }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
  ```
- [ ] **Étape 4 : lancer**
  Run : `pnpm test tests/unit/tokens.test.ts`
  Attendu : PASS. **Si une paire échoue, on corrige la valeur du token, pas le test.** C'est probable pour `line-strong` en clair (0.78 risque de rester sous 3:1 : descendre la luminosité jusqu'à ce que le test passe, vers 0.62). On reporte ensuite la nouvelle valeur dans DESIGN_BRIEF §3.1, dans le même commit.
- [ ] **Étape 5 : obtenir les polices**
  - Geist Mono, déjà installé via le paquet `geist` : `find node_modules/geist -name "GeistMono*Variable*.woff2"`, puis copier le fichier trouvé vers `src/assets/fonts/GeistMono-Variable.woff2`.
  - Switzer : **demander l'accord de Richard** avant de télécharger l'archive depuis `https://www.fontshare.com/fonts/switzer` (licence ITF Free Font License, usage commercial autorisé). Copier `Switzer-Variable.woff2` et `Switzer-VariableItalic.woff2` dans `src/assets/fonts/`, puis le fichier de licence dans `src/assets/fonts/LICENSE-Switzer.txt`.
- [ ] **Étape 6 : déclarer les polices dans `astro.config.mjs`**
  ```js
  import { defineConfig, fontProviders } from "astro/config";
  // … imports existants …
  export default defineConfig({
    // … config existante …
    fonts: [
      {
        provider: fontProviders.local(),
        name: "Switzer",
        cssVariable: "--font-switzer",
        options: {
          variants: [
            { weight: "100 900", style: "normal", src: ["./src/assets/fonts/Switzer-Variable.woff2"] },
            { weight: "100 900", style: "italic", src: ["./src/assets/fonts/Switzer-VariableItalic.woff2"] },
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Geist Mono",
        cssVariable: "--font-geist-mono",
        options: { variants: [{ weight: "100 900", style: "normal", src: ["./src/assets/fonts/GeistMono-Variable.woff2"] }] },
      },
    ],
  });
  ```
- [ ] **Étape 7 : vérifier**
  Run : `pnpm check && pnpm test`
  Attendu : 0 erreur, tous les tests au vert.
- [ ] **Étape 8 : commit**
  `git add -A && git commit -m "feat(design): tokens OKLCH clair/sombre, échelle typographique, polices locales"`

### Tâche 1.4 : layout de base, thème sans flash, en-tête et pied de page

**Fichiers :**
- Créer : `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/ThemeToggle.astro`, `src/components/LanguageSwitch.astro`, `src/components/MobileMenu.astro`, `src/components/Footer.astro`
- Test : `tests/e2e/shell.spec.ts`

**Interfaces :**
- Consomme : `Locale`, `t`, `pathFor`, `otherLocale` (Tâche 1.2) ; tokens (Tâche 1.3).
- Produit : `<Base locale title description alternates>` (`alternates: Record<Locale, string>`), avec slot pour le contenu ; tout le site l'utilise.

- [ ] **Étape 1 : écrire les tests E2E du socle** (ils échoueront tant que les pages n'existent pas, Tâche 1.5)
  ```ts
  import { test, expect } from "@playwright/test";
  import AxeBuilder from "@axe-core/playwright";

  test.describe("redirection initiale", () => {
    for (const [locale, attendu] of [["fr-FR", /\/fr\/$/], ["en-US", /\/en\/$/]] as const) {
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
    for (const [path, lang] of [["/fr/", "fr"], ["/en/about/", "en"], ["/fr/mentions-legales/", "fr"]] as const) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
    }
  });

  test("le sélecteur de langue garde la page courante", async ({ page }) => {
    await page.goto("/fr/a-propos/");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/about\/$/);
  });

  test("le thème choisi persiste, sans flash, à la navigation et au rechargement", async ({ page, isMobile }) => {
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
    await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Projets" }).click();
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
    const bouton = page.getByRole("button", { name: "Menu" });
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
      for (const path of ["/fr/", "/en/projects/", "/fr/a-propos/", "/en/contact/", "/fr/mentions-legales/"]) {
        await page.goto(path);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
      }
    });
  }
  ```
- [ ] **Étape 2 : créer `src/layouts/Base.astro`**
  ```astro
  ---
  import "../styles/global.css";
  import { Font } from "astro:assets";
  import { ClientRouter } from "astro:transitions";
  import type { Locale } from "../i18n/config";
  import { t } from "../i18n/ui";
  import Header from "../components/Header.astro";
  import Footer from "../components/Footer.astro";

  interface Props {
    locale: Locale;
    title: string;
    description: string;
    alternates: Record<Locale, string>;
  }
  const { locale, title, description, alternates } = Astro.props;
  const site = Astro.site!;
  ---
  <!doctype html>
  <html lang={locale}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={new URL(alternates[locale], site)} />
      <link rel="alternate" hreflang="fr" href={new URL(alternates.fr, site)} />
      <link rel="alternate" hreflang="en" href={new URL(alternates.en, site)} />
      <link rel="alternate" hreflang="x-default" href={new URL(alternates.fr, site)} />
      <meta name="color-scheme" content="light dark" />
      <script is:inline>
        (() => {
          const apply = () => {
            let theme = "light";
            try {
              const saved = localStorage.getItem("theme");
              theme = saved === "light" || saved === "dark"
                ? saved
                : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            } catch {}
            document.documentElement.dataset.theme = theme;
          };
          apply();
          // ClientRouter remplace les attributs de <html> au swap : on réapplique avant le rendu
          document.addEventListener("astro:after-swap", apply);
        })();
      </script>
      <Font cssVariable="--font-switzer" preload />
      <Font cssVariable="--font-geist-mono" />
      <ClientRouter />
    </head>
    <body class="min-h-dvh bg-bg text-ink">
      <a href="#contenu" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] rounded-control bg-accent px-4 py-2 text-accent-ink">
        {t(locale, "nav.skip")}
      </a>
      <Header locale={locale} alternates={alternates} />
      <main id="contenu" tabindex="-1" class="outline-none">
        <slot />
      </main>
      <Footer locale={locale} />
    </body>
  </html>
  ```
- [ ] **Étape 3 : créer `src/components/ThemeToggle.astro`**
  ```astro
  ---
  import { Icon } from "astro-icon/components";
  import type { Locale } from "../i18n/config";
  import { t } from "../i18n/ui";
  interface Props { locale: Locale }
  const { locale } = Astro.props;
  ---
  <button type="button" data-theme-toggle aria-pressed="false" aria-label={t(locale, "theme.dark")}
    class="inline-flex size-11 items-center justify-center rounded-control text-ink-muted transition-[color,transform] duration-[var(--dur-hover)] ease-out hover:text-ink active:scale-[0.97]">
    <Icon name="ph:moon" class="size-5 dark:hidden" aria-hidden="true" />
    <Icon name="ph:sun" class="hidden size-5 dark:block" aria-hidden="true" />
  </button>
  <script>
    function sync(btn: HTMLButtonElement) {
      btn.setAttribute("aria-pressed", String(document.documentElement.dataset.theme === "dark"));
    }
    function init() {
      document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
        sync(btn);
        btn.addEventListener("click", () => {
          const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem("theme", next); } catch {}
          sync(btn);
        });
      });
    }
    document.addEventListener("astro:page-load", init);
  </script>
  ```
- [ ] **Étape 4 : créer `src/components/LanguageSwitch.astro`**
  ```astro
  ---
  import type { Locale } from "../i18n/config";
  import { otherLocale } from "../i18n/config";
  import { t } from "../i18n/ui";
  interface Props { locale: Locale; alternates: Record<Locale, string> }
  const { locale, alternates } = Astro.props;
  const target = otherLocale(locale);
  ---
  <!-- le texte visible est le nom accessible (WCAG 2.5.3), écrit dans la langue cible -->
  <a href={alternates[target]} hreflang={target} lang={target}
    class="inline-flex h-11 items-center rounded-control px-2 text-small text-ink-muted transition-colors duration-[var(--dur-hover)] hover:text-ink">
    {t(locale, "lang.switch")}
  </a>
  ```
  > Le maintien des filtres (`?provenance=…`) lors du changement de langue est ajouté en Phase 4 (vigilance 3), avec son test.
- [ ] **Étape 5 : créer `src/components/MobileMenu.astro`** (`<dialog>` natif : focus retenu et Échap gérés par le navigateur)
  ```astro
  ---
  import { Icon } from "astro-icon/components";
  import type { Locale } from "../i18n/config";
  import { t } from "../i18n/ui";
  import { pathFor } from "../i18n/routes";
  interface Props { locale: Locale }
  const { locale } = Astro.props;
  const links = [["projects", "nav.projects"], ["about", "nav.about"], ["contact", "nav.contact"]] as const;
  ---
  <button type="button" data-menu-open aria-haspopup="dialog" aria-label={t(locale, "nav.menu")}
    class="inline-flex size-11 items-center justify-center rounded-control md:hidden active:scale-[0.97]">
    <Icon name="ph:list" class="size-6" aria-hidden="true" />
  </button>
  <dialog data-menu aria-label={t(locale, "nav.menu")}
    class="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-6 text-ink backdrop:bg-transparent">
    <div class="flex justify-end">
      <button type="button" data-menu-close aria-label={t(locale, "nav.close")} class="inline-flex size-11 items-center justify-center rounded-control">
        <Icon name="ph:x" class="size-6" aria-hidden="true" />
      </button>
    </div>
    <nav aria-label={t(locale, "nav.primary")} class="mt-8 flex flex-col gap-6">
      {links.map(([key, label]) => <a href={pathFor(key, locale)} class="text-h1">{t(locale, label)}</a>)}
    </nav>
  </dialog>
  <style>
    dialog[open] { animation: menu-in var(--dur-panel) var(--ease-drawer); }
    @keyframes menu-in { from { opacity: 0; transform: translateY(-8px); } }
  </style>
  <script>
    function init() {
      const dialog = document.querySelector<HTMLDialogElement>("[data-menu]");
      const open = document.querySelector<HTMLButtonElement>("[data-menu-open]");
      if (!dialog || !open) return;
      open.addEventListener("click", () => dialog.showModal());
      dialog.querySelector("[data-menu-close]")?.addEventListener("click", () => dialog.close());
      dialog.addEventListener("close", () => open.focus());
      dialog.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => dialog.close()));
    }
    document.addEventListener("astro:page-load", init);
  </script>
  ```
- [ ] **Étape 6 : créer `src/components/Header.astro`**
  ```astro
  ---
  import type { Locale } from "../i18n/config";
  import { t } from "../i18n/ui";
  import { pathFor } from "../i18n/routes";
  import ThemeToggle from "./ThemeToggle.astro";
  import LanguageSwitch from "./LanguageSwitch.astro";
  import MobileMenu from "./MobileMenu.astro";
  interface Props { locale: Locale; alternates: Record<Locale, string> }
  const { locale, alternates } = Astro.props;
  const links = [["projects", "nav.projects"], ["about", "nav.about"], ["contact", "nav.contact"]] as const;
  ---
  <header class="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6 md:px-10">
      <a href={pathFor("home", locale)} class="font-semibold tracking-tight">Richard</a>
      <nav aria-label={t(locale, "nav.primary")} class="hidden items-center gap-8 md:flex">
        {links.map(([key, label]) => (
          <a href={pathFor(key, locale)} class="text-small text-ink-muted transition-colors duration-[var(--dur-hover)] hover:text-ink">{t(locale, label)}</a>
        ))}
      </nav>
      <div class="flex items-center gap-1">
        <LanguageSwitch locale={locale} alternates={alternates} />
        <ThemeToggle locale={locale} />
        <MobileMenu locale={locale} />
      </div>
    </div>
  </header>
  ```
  > Le nom « Richard » est provisoire. Il viendra de `profile.yaml` en Phase 2.
- [ ] **Étape 7 : créer `src/components/Footer.astro`**
  ```astro
  ---
  import type { Locale } from "../i18n/config";
  import { t } from "../i18n/ui";
  import { pathFor } from "../i18n/routes";
  interface Props { locale: Locale }
  const { locale } = Astro.props;
  ---
  <footer class="border-t border-line">
    <div class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-10 text-small text-ink-muted md:px-10">
      <p>© {new Date().getFullYear()} Richard</p>
      <a href={pathFor("legal", locale)} class="hover:text-ink">{t(locale, "footer.legal")}</a>
    </div>
  </footer>
  ```
- [ ] **Étape 8 : commit** (les tests E2E passeront après la Tâche 1.5)
  `git add -A && git commit -m "feat(ui): layout de base, thème sans flash, en-tête, menu mobile, pied de page"`

### Tâche 1.5 : pages de la coquille et redirection initiale

**Fichiers :**
- Créer : `src/views/ShellView.astro`, `src/pages/index.astro`, `src/pages/404.astro`, puis pour chaque langue `src/pages/fr/index.astro`, `fr/projets/index.astro`, `fr/a-propos.astro`, `fr/contact.astro`, `fr/mentions-legales.astro` et `src/pages/en/index.astro`, `en/projects/index.astro`, `en/about.astro`, `en/contact.astro`, `en/legal.astro`
- Créer : `vercel.json`

**Interfaces :**
- Consomme : `Base`, `alternatesFor`, `t`.
- Produit : `<ShellView locale page>` avec `page: "home" | "projects" | "about" | "contact" | "legal"`. Elle sera remplacée par les vraies vues en Phase 4.

- [ ] **Étape 1 : créer `src/views/ShellView.astro`**
  ```astro
  ---
  import Base from "../layouts/Base.astro";
  import type { Locale } from "../i18n/config";
  import { t, type UiKey } from "../i18n/ui";
  import { alternatesFor, type RouteKey } from "../i18n/routes";
  interface Props { locale: Locale; page: RouteKey }
  const { locale, page } = Astro.props;
  const titleKey = `page.${page}.title` as UiKey;
  const title = t(locale, titleKey);
  ---
  <Base locale={locale} title={`${title} | Richard`} description={title} alternates={alternatesFor(page)}>
    <section class="mx-auto max-w-[1240px] px-6 py-16 md:px-10 md:py-28">
      <h1 class="text-h1">{title}</h1>
    </section>
  </Base>
  ```
- [ ] **Étape 2 : créer les 10 pages fines.** Patron (exemple `src/pages/fr/a-propos.astro`) :
  ```astro
  ---
  import ShellView from "../../views/ShellView.astro";
  ---
  <ShellView locale="fr" page="about" />
  ```
  Correspondance :

  | Fichier | locale | page |
  |---|---|---|
  | `src/pages/fr/index.astro` | fr | home |
  | `src/pages/fr/projets/index.astro` | fr | projects |
  | `src/pages/fr/a-propos.astro` | fr | about |
  | `src/pages/fr/contact.astro` | fr | contact |
  | `src/pages/fr/mentions-legales.astro` | fr | legal |
  | `src/pages/en/index.astro` | en | home |
  | `src/pages/en/projects/index.astro` | en | projects |
  | `src/pages/en/about.astro` | en | about |
  | `src/pages/en/contact.astro` | en | contact |
  | `src/pages/en/legal.astro` | en | legal |

  Imports : les fichiers directement dans `src/pages/fr/` ou `src/pages/en/` importent `../../views/ShellView.astro` ; `fr/projets/index.astro` et `en/projects/index.astro` importent `../../../views/ShellView.astro`.
- [ ] **Étape 3 : créer `src/pages/index.astro`** (repli local ; en production, `vercel.json` redirige avant)
  ```astro
  ---
  ---
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Richard</title>
      <script is:inline>
        const first = (navigator.languages && navigator.languages[0]) || navigator.language || "fr";
        location.replace(/^en\b/i.test(first) ? "/en/" : "/fr/");
      </script>
      <meta http-equiv="refresh" content="2;url=/fr/" />
    </head>
    <body>
      <a href="/fr/">Français</a>
      <a href="/en/">English</a>
    </body>
  </html>
  ```
- [ ] **Étape 4 : créer `src/pages/404.astro`** (bilingue, sans dépendance à la langue d'URL)
  ```astro
  ---
  import Base from "../layouts/Base.astro";
  import { alternatesFor } from "../i18n/routes";
  ---
  <Base locale="fr" title="Page introuvable | Page not found" description="404" alternates={alternatesFor("home")}>
    <section class="mx-auto max-w-[1240px] px-6 py-16 md:px-10 md:py-28">
      <h1 class="text-h1">Page introuvable</h1>
      <p lang="en" class="mt-2 text-h3 text-ink-muted">Page not found</p>
      <p class="mt-8 flex gap-6"><a href="/fr/" class="text-accent underline">Accueil</a><a href="/en/" lang="en" class="text-accent underline">Home</a></p>
    </section>
  </Base>
  ```
- [ ] **Étape 5 : créer `vercel.json`** (redirection selon la langue, en-têtes de base ; la CSP arrive en Phase 8)
  ```json
  {
    "redirects": [
      { "source": "/", "has": [{ "type": "header", "key": "accept-language", "value": "^en.*" }], "destination": "/en/", "permanent": false },
      { "source": "/", "destination": "/fr/", "permanent": false }
    ],
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ]
  }
  ```
- [ ] **Étape 6 : lancer toute la suite**
  Run : `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm e2e`
  Attendu : tout au vert sur desktop et mobile.
  - Si le test « sans flash » échoue, vérifier que l'événement s'appelle toujours `astro:after-swap` dans Astro 7 : https://docs.astro.build/en/guides/view-transitions/ (lifecycle events).
  - Si axe signale un contraste, corriger le token concerné (Tâche 1.3, étape 4).
  - Si le test du lien d'évitement échoue (ClientRouter qui intercepte l'ancre), ajouter dans `Base.astro` un script qui donne le focus à `#contenu` au clic sur ce lien.
- [ ] **Étape 7 : commit**
  `git add -A && git commit -m "feat: coquille bilingue (10 pages), 404, redirection initiale"`

### Tâche 1.6 : CI et premier déploiement

**Fichiers :**
- Créer : `.github/workflows/ci.yml`

- [ ] **Étape 1 : créer `.github/workflows/ci.yml`**
  ```yaml
  name: ci
  on:
    pull_request:
    push:
      branches: [main]
  jobs:
    verify:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 24
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - run: pnpm check
        - run: pnpm lint
        - run: pnpm test
        - run: pnpm build
        - run: pnpm exec playwright install --with-deps chromium
        - run: pnpm e2e
  ```
- [ ] **Étape 2 : créer le dépôt GitHub et pousser.** C'est une action visible publiquement : **demander l'accord de Richard** (dépôt public ou privé ?) avant d'exécuter :
  ```bash
  gh repo create portfolio --source . --private --push
  git push -u origin phase-1
  ```
- [ ] **Étape 3 : Vercel** (fait par Richard dans le tableau de bord) : importer le dépôt, framework détecté Astro, variable `SITE_URL` = URL de production. Aucune autre variable en Phase 1.
- [ ] **Étape 4 : ouvrir la PR et vérifier l'aperçu**
  ```bash
  gh pr create --base main --head phase-1 --title "Phase 1 : socle" --body "Coquille bilingue, tokens, thème, CI."
  ```
  Puis, sur l'URL d'aperçu Vercel :
  ```bash
  curl -sI -H "Accept-Language: en-US,en;q=0.9" https://<apercu>/ | grep -i location
  ```
  Attendu : `location: /en/`. Si la redirection `vercel.json` n'est pas appliquée par l'adaptateur, le repli `src/pages/index.astro` fonctionne quand même ; noter le constat dans `PROGRESS.md`.
  Et : `BASE_URL=https://<apercu> pnpm e2e` → vert.
- [ ] **Étape 5 : clôture de phase**
  - lancer `/code-review` sur la branche et corriger les points retenus ;
  - ajouter le récap dans `PROGRESS.md` et mettre à jour `docs/REPRISE.md` (« Phase 1 terminée ; prochaine : plan détaillé de la Phase 2 ») ;
  - fusionner après accord de Richard.

---

## Vérification de bout en bout (fin de projet)

1. `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm e2e` : tout est vert en local et en CI.
2. `BASE_URL=<aperçu Vercel> pnpm e2e` : vert sur desktop et mobile, dans les deux thèmes.
3. Lighthouse CI (Phase 9) : ≥ 95 sur les 4 catégories, en mobile, pour `/fr/`, `/en/projects/` et une fiche projet.
4. Parcours PRD §10 rejoué à la main : ajouter un projet avec `pnpm projet:nouveau` + Claude Code + push, puis chronométrer la mise en ligne (< 5 min).
5. Lancer `sync-github.yml` et `captures.yml` à la main (workflow_dispatch) : un commit seulement si quelque chose a changé, et le site est reconstruit.
6. Contact : envoi réel vers `CONTACT_TO_EMAIL`, puis test du refus Turnstile avec la clé de test « toujours échouer ».

## Après validation de ce plan

Copier ce fichier dans `portfolio/docs/IMPLEMENTATION_PLAN.md`, le committer, ajouter le lien dans `README.md` et `CLAUDE.md`, mettre à jour `docs/REPRISE.md`, puis démarrer la Phase 0.
