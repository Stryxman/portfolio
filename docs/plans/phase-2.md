# Phase 2 : contenu et schémas

> Détail TDD de la Phase 2 de [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). Spec : [BACKEND_SCHEMA §2-3, §6](../BACKEND_SCHEMA.md), [PRD §5.2](../PRD.md). Branche `phase-2`. Exécution native, `/code-review` en fin de phase.

**Livrable :** le contenu vit en fichiers validés. Un fichier invalide fait échouer le build avec un message qui cite le fichier et le champ, et `pnpm projet:nouveau owner/repo` crée un brouillon pré-rempli. Le site lit le nom depuis `profile.yaml`.

**Préfixe shell (Claude) :** `export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"`.

## Décisions propres à cette phase

- **Validation hors d'Astro.** Les règles (BACKEND_SCHEMA §3) sont des fonctions pures, et `scripts/check-content.ts` les applique en lisant les fichiers sur disque, avant `astro build`. Cette solution est testable sans Astro et donne des messages clairs ; elle est plus simple qu'une intégration Astro qui n'a pas accès aux collections.
- **Schémas partagés.** `src/lib/content/schemas.ts` fabrique les schémas Zod. Ils sont utilisés par `content.config.ts`, avec le vrai `image()` et `reference()`, et par le script de vérification, avec un `image()` réduit à un chemin de fichier vérifié.
- **Pas d'email dans le dépôt.** Le dépôt est public, donc `profile.email` devient optionnel et reste vide. L'adresse de contact vivra dans la variable Vercel `CONTACT_TO_EMAIL` (Phase 7). C'est un écart à BACKEND_SCHEMA §3, à reporter dans ce document.
- **Scripts TypeScript exécutés par Node 24** (suppression native des types) : imports avec l'extension `.ts`, syntaxe effaçable uniquement (pas d'`enum`, pas de `namespace`).
- **Projets en brouillon** tant qu'ils n'ont pas d'image (les captures arrivent en Phase 6). Règle : un projet publié doit avoir une image.

## Points de vigilance de la phase

1. **EN vide** : `localize()` renvoie le FR accompagné de `lang: "fr"` (vigilance 1 du plan). Tâche 2.4.
2. **`end` avant `start`** dans un projet ou une expérience : c'est une erreur, pas un affichage absurde. Tâche 2.2.
3. **Slug déjà existant** pour `projet:nouveau` : refus, rien n'est écrasé. Tâche 2.6.
4. **README contenant des badges, des commentaires HTML ou un titre H1** : nettoyés avant d'en faire `fr.mdx`. Tâche 2.6.
5. **Stack qui cite un skill inexistant** : erreur qui nomme le skill. Tâche 2.3.

---

### Tâche 2.1 : URL du site sans réglage manuel

**Fichiers :** créer `src/lib/site.ts`, `tests/unit/site.test.ts` ; renommer `astro.config.mjs` → `astro.config.ts`.
**Produit :** `resolveSite(env: Record<string, string | undefined>): string`.

- [ ] Test (doit échouer : module absent)
  ```ts
  import { describe, it, expect } from "vitest";
  import { resolveSite } from "../../src/lib/site";

  describe("resolveSite", () => {
    it("prend SITE_URL en priorité, sans slash final", () => {
      expect(resolveSite({ SITE_URL: "https://exemple.dev/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://exemple.dev");
    });
    it("sinon le domaine de production fourni par Vercel", () => {
      expect(resolveSite({ VERCEL_PROJECT_PRODUCTION_URL: "portfolio-x.vercel.app" })).toBe("https://portfolio-x.vercel.app");
    });
    it("sinon localhost", () => {
      expect(resolveSite({})).toBe("http://localhost:4321");
    });
  });
  ```
- [ ] Implémentation
  ```ts
  // Ordre : SITE_URL (domaine personnalisé) > domaine de production Vercel (variable système) > dev local.
  export function resolveSite(env: Record<string, string | undefined>): string {
    if (env.SITE_URL) return env.SITE_URL.replace(/\/+$/, "");
    if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return "http://localhost:4321";
  }
  ```
- [ ] `git mv astro.config.mjs astro.config.ts`, puis `import { resolveSite } from "./src/lib/site";` et `site: resolveSite(process.env),`.
- [ ] `pnpm test && pnpm check && pnpm build` → vert ; `grep -o 'canonical" href="[^"]*' .vercel/output/static/fr/a-propos/index.html` → `http://localhost:4321/...` en local (normal).
- [ ] Commit `fix(site): URL canonique déduite du domaine de production Vercel`.

### Tâche 2.2 : règles de contenu (fonctions pures)

**Fichiers :** créer `src/lib/content/rules.ts`, `tests/unit/content-rules.test.ts`.
**Produit :**
```ts
export type Issue = { file: string; field: string; message: string };
export type Report = { errors: Issue[]; warnings: Issue[] };
export type Localized = { fr: string; en: string };
export interface ProjectInput {
  slug: string;
  file: string; // ex. "src/content/projects/compagnon/meta.yaml"
  data: { title: Localized; summary: Localized; status: "draft" | "published" | "archived"; featured: boolean; start?: string; end?: string; cover?: string };
  hasFrBody: boolean;
  hasEnBody: boolean;
  hasCapture: boolean;
}
export function checkProjects(projects: ProjectInput[]): Report;
export function checkProfile(file: string, data: { tagline: Localized }): Report;
export function checkPeriod(file: string, start?: string, end?: string): Issue[];
export const MAX_FEATURED = 6;
```

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { checkProjects, checkProfile, checkPeriod, type ProjectInput } from "../../src/lib/content/rules";

  const base = (over: Partial<ProjectInput> = {}, data: Partial<ProjectInput["data"]> = {}): ProjectInput => ({
    slug: "demo",
    file: "src/content/projects/demo/meta.yaml",
    hasFrBody: true,
    hasEnBody: true,
    hasCapture: true,
    ...over,
    data: { title: { fr: "Démo", en: "Demo" }, summary: { fr: "Un site.", en: "A site." }, status: "published", featured: false, ...data },
  });

  describe("checkProjects", () => {
    it("accepte un projet publié complet", () => {
      expect(checkProjects([base()])).toEqual({ errors: [], warnings: [] });
    });
    it("exige fr.mdx pour un projet publié", () => {
      const { errors } = checkProjects([base({ hasFrBody: false })]);
      expect(errors).toContainEqual(expect.objectContaining({ field: "fr.mdx" }));
    });
    it("exige une image (cover ou capture) pour un projet publié", () => {
      const { errors } = checkProjects([base({ hasCapture: false })]);
      expect(errors).toContainEqual(expect.objectContaining({ field: "cover" }));
    });
    it("tolère un brouillon incomplet", () => {
      expect(checkProjects([base({ hasFrBody: false, hasCapture: false }, { status: "draft" })]).errors).toEqual([]);
    });
    it("refuse plus de 6 projets publiés mis en avant", () => {
      const many = Array.from({ length: 7 }, (_, i) => base({ slug: `p${i}`, file: `p${i}` }, { featured: true }));
      expect(checkProjects(many).errors).toContainEqual(expect.objectContaining({ field: "featured" }));
    });
    it("refuse un tiret cadratin ou demi-cadratin dans le titre ou le résumé", () => {
      const { errors } = checkProjects([base({}, { title: { fr: "Site — vitrine", en: "Site" }, summary: { fr: "A – B", en: "x" } })]);
      expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(["title.fr", "summary.fr"]));
    });
    it("avertit (sans bloquer) si l'anglais manque sur un projet publié", () => {
      const r = checkProjects([base({ hasEnBody: false }, { summary: { fr: "Un site.", en: "" } })]);
      expect(r.errors).toEqual([]);
      expect(r.warnings.map((w) => w.field)).toEqual(expect.arrayContaining(["summary.en", "en.mdx"]));
    });
    it("refuse une fin antérieure au début", () => {
      expect(checkProjects([base({}, { start: "2026-05", end: "2025-12" })]).errors).toContainEqual(expect.objectContaining({ field: "end" }));
    });
  });

  describe("checkPeriod", () => {
    it("compare année seule et année-mois", () => {
      expect(checkPeriod("f", "2025", "2025-03")).toEqual([]);
      expect(checkPeriod("f", "2025-03", "2024")).toHaveLength(1);
      expect(checkPeriod("f", "2025-03", undefined)).toEqual([]);
    });
  });

  describe("checkProfile", () => {
    it("limite l'accroche à 20 mots par langue", () => {
      const long = Array.from({ length: 21 }, () => "mot").join(" ");
      expect(checkProfile("p", { tagline: { fr: long, en: "Short." } }).errors).toContainEqual(expect.objectContaining({ field: "tagline.fr" }));
    });
    it("refuse un tiret cadratin dans l'accroche", () => {
      expect(checkProfile("p", { tagline: { fr: "Vite — et bien", en: "ok" } }).errors).toHaveLength(1);
    });
  });
  ```
- [ ] Implémentation
  ```ts
  export type Issue = { file: string; field: string; message: string };
  export type Report = { errors: Issue[]; warnings: Issue[] };
  export type Localized = { fr: string; en: string };
  export interface ProjectInput {
    slug: string;
    file: string;
    data: { title: Localized; summary: Localized; status: "draft" | "published" | "archived"; featured: boolean; start?: string; end?: string; cover?: string };
    hasFrBody: boolean;
    hasEnBody: boolean;
    hasCapture: boolean;
  }

  export const MAX_FEATURED = 6;
  const DASH = /[—–]/; // DESIGN_BRIEF §7 : aucun tiret cadratin ou demi-cadratin dans l'interface

  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  // « 2025 » < « 2025-01 » : une année seule vaut janvier pour le début et décembre pour la fin
  const asMonth = (v: string, bound: "start" | "end") => (v.length === 4 ? `${v}-${bound === "start" ? "01" : "12"}` : v);

  export function checkPeriod(file: string, start?: string, end?: string): Issue[] {
    if (!start || !end) return [];
    return asMonth(end, "end") < asMonth(start, "start")
      ? [{ file, field: "end", message: `la fin (${end}) précède le début (${start})` }]
      : [];
  }

  function dashes(file: string, fields: Record<string, string>): Issue[] {
    return Object.entries(fields)
      .filter(([, v]) => DASH.test(v))
      .map(([field]) => ({ file, field, message: "tiret cadratin ou demi-cadratin interdit (utiliser « - », une virgule ou deux phrases)" }));
  }

  export function checkProjects(projects: ProjectInput[]): Report {
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    for (const p of projects) {
      const { data, file } = p;
      errors.push(...dashes(file, { "title.fr": data.title.fr, "title.en": data.title.en, "summary.fr": data.summary.fr, "summary.en": data.summary.en }));
      errors.push(...checkPeriod(file, data.start, data.end));
      if (data.status !== "published") continue;
      if (!p.hasFrBody) errors.push({ file, field: "fr.mdx", message: "un projet publié doit avoir fr.mdx" });
      if (!data.cover && !p.hasCapture) errors.push({ file, field: "cover", message: "un projet publié doit avoir une image (cover.webp ou capture automatique)" });
      if (!data.title.en) warnings.push({ file, field: "title.en", message: "titre anglais manquant (repli sur le français)" });
      if (!data.summary.en) warnings.push({ file, field: "summary.en", message: "résumé anglais manquant (repli sur le français)" });
      if (!p.hasEnBody) warnings.push({ file, field: "en.mdx", message: "description anglaise manquante (repli sur le français)" });
    }
    const featured = projects.filter((p) => p.data.status === "published" && p.data.featured);
    if (featured.length > MAX_FEATURED) {
      errors.push({ file: featured.map((p) => p.slug).join(", "), field: "featured", message: `${featured.length} projets mis en avant, maximum ${MAX_FEATURED}` });
    }
    return { errors, warnings };
  }

  export function checkProfile(file: string, data: { tagline: Localized }): Report {
    const errors: Issue[] = dashes(file, { "tagline.fr": data.tagline.fr, "tagline.en": data.tagline.en });
    for (const lang of ["fr", "en"] as const) {
      if (words(data.tagline[lang]) > 20) errors.push({ file, field: `tagline.${lang}`, message: "accroche limitée à 20 mots (DESIGN_BRIEF §2)" });
    }
    return { errors, warnings: [] };
  }
  ```
- [ ] `pnpm test` → vert (les 28 tests précédents + les nouveaux).
- [ ] Commit `feat(content): règles de validation du contenu`.

### Tâche 2.3 : schémas Zod partagés et collections Astro

**Fichiers :** créer `src/lib/content/schemas.ts`, `src/content.config.ts`, `tests/unit/content-schemas.test.ts`.
**Produit :** `localized`, `slug`, `yearMonth`, `skillSchema`, `experienceSchema`, `profileSchema(image)`, `projectSchema(image, skillRef)`, avec `type ImageFn = () => z.ZodType`.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { z } from "astro/zod";
  import { profileSchema, projectSchema, skillSchema, experienceSchema } from "../../src/lib/content/schemas";

  const img = () => z.string();
  const project = projectSchema(img, z.string());

  describe("schémas", () => {
    it("complète les valeurs par défaut d'un projet minimal", () => {
      const p = project.parse({ title: { fr: "Démo" }, summary: { fr: "Un site." }, provenance: "cms" });
      expect(p).toMatchObject({ status: "draft", featured: false, order: 100, stack: [], tags: [], gallery: [], preview: { mode: "auto" }, title: { en: "" } });
    });
    it("refuse une provenance inconnue", () => {
      expect(() => project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "wix" })).toThrow();
    });
    it("refuse un dépôt mal formé et une URL invalide", () => {
      expect(() => project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", repo: "pas un repo" })).toThrow();
      expect(() => project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", liveUrl: "exemple.fr" })).toThrow();
    });
    it("met les tags en minuscules", () => {
      expect(project.parse({ title: { fr: "x" }, summary: { fr: "x" }, provenance: "other", tags: ["Astro"] }).tags).toEqual(["astro"]);
    });
    it("accepte un profil sans email (dépôt public)", () => {
      const p = profileSchema(img).parse({
        fullName: "Richard", role: { fr: "Développeur web" }, tagline: { fr: "Accroche." }, bio: { fr: "Bio." },
        githubLogin: "Stryxman", socials: [{ kind: "github", url: "https://github.com/Stryxman" }],
      });
      expect(p.email).toBeUndefined();
      expect(p.showEmail).toBe(false);
    });
    it("valide un skill et une expérience", () => {
      expect(skillSchema.parse({ id: "astro", name: "Astro", category: "framework", order: 1 }).showOnAbout).toBe(true);
      expect(() => experienceSchema.parse({ id: "x", kind: "work", title: { fr: "x" }, organization: "o", start: "2026-13", order: 1 })).toThrow();
    });
  });
  ```
- [ ] Implémentation `src/lib/content/schemas.ts`
  ```ts
  import { z } from "astro/zod";

  // Fabriques partagées par content.config.ts (vrais image() et reference()) et par scripts/check-content.ts.
  export type ImageFn = () => z.ZodType;

  export const localized = z.object({ fr: z.string().min(1), en: z.string().default("") });
  export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case attendu (a-z, 0-9, tirets)");
  export const yearMonth = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "format AAAA ou AAAA-MM");

  export const skillSchema = z.object({
    id: slug,
    name: z.string().min(1),
    category: z.enum(["language", "framework", "cms", "tool", "design", "other"]),
    showOnAbout: z.boolean().default(true),
    order: z.number().int(),
  });

  export const experienceSchema = z.object({
    id: slug,
    kind: z.enum(["work", "education", "freelance"]),
    title: localized,
    organization: z.string().min(1),
    location: localized.optional(),
    description: localized.optional(),
    start: yearMonth,
    end: yearMonth.optional(),
    order: z.number().int(),
  });

  export const profileSchema = (image: ImageFn) =>
    z.object({
      fullName: z.string().min(1),
      role: localized,
      tagline: localized,
      bio: localized,
      location: localized.optional(),
      portrait: image().optional(),
      email: z.email().optional(), // dépôt public : l'adresse de contact vit dans CONTACT_TO_EMAIL (Vercel)
      showEmail: z.boolean().default(false),
      githubLogin: z.string().min(1),
      socials: z.array(
        z.object({
          kind: z.enum(["github", "linkedin", "x", "bluesky", "website", "other"]),
          url: z.url(),
          label: z.string().optional(),
        }),
      ),
    });

  export const projectSchema = (image: ImageFn, skillRef: z.ZodType) =>
    z.object({
      title: localized,
      summary: localized,
      role: localized.optional(),
      provenance: z.enum(["claude-code", "hand-coded", "cms", "other"]),
      platform: z.string().optional(),
      stack: z.array(skillRef).default([]),
      tags: z.array(z.string().toLowerCase()).default([]),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      featured: z.boolean().default(false),
      order: z.number().int().default(100),
      start: yearMonth.optional(),
      end: yearMonth.optional(),
      liveUrl: z.url().optional(),
      repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "format owner/nom").optional(),
      cover: image().optional(),
      gallery: z.array(z.object({ src: image(), alt: localized })).default([]),
      preview: z.object({ mode: z.enum(["auto", "iframe", "screenshot", "none"]).default("auto") }).default({ mode: "auto" }),
    });
  ```
- [ ] `src/content.config.ts`
  ```ts
  import { defineCollection, reference } from "astro:content";
  import { glob, file } from "astro/loaders";
  import { experienceSchema, profileSchema, projectSchema, skillSchema } from "./lib/content/schemas";

  const profile = defineCollection({ loader: file("src/content/profile.yaml"), schema: ({ image }) => profileSchema(image) });
  const skills = defineCollection({ loader: file("src/content/skills.yaml"), schema: skillSchema });
  const experiences = defineCollection({ loader: file("src/content/experiences.yaml"), schema: experienceSchema });
  const projects = defineCollection({
    loader: glob({ pattern: "*/meta.yaml", base: "src/content/projects", generateId: ({ entry }) => entry.split("/")[0]! }),
    schema: ({ image }) => projectSchema(image, reference("skills")),
  });
  const projectBodies = defineCollection({ loader: glob({ pattern: "*/{fr,en}.mdx", base: "src/content/projects" }) });

  export const collections = { profile, skills, experiences, projects, projectBodies };
  ```
  Le profil est un objet YAML avec une seule clé `main:` (le loader `file()` transforme chaque clé de premier niveau en entrée), lu par `getEntry("profile", "main")`.
- [ ] `pnpm test && pnpm check` → vert (le contenu arrive en 2.5 ; `check` peut avertir que les collections sont vides, ce n'est pas une erreur).
- [ ] Commit `feat(content): schémas Zod partagés et collections Astro`.

### Tâche 2.4 : sélection et langue (fonctions pures pour les pages)

**Fichiers :** créer `src/lib/content/select.ts`, `tests/unit/content-select.test.ts`.
**Produit :** `localize(field: { fr: string; en: string }, locale: Locale): { text: string; lang: Locale }` ; `visibleProjects<T extends { data: { status: string; order: number } }>(entries: T[], opts: { includeDrafts: boolean }): T[]`.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { localize, visibleProjects } from "../../src/lib/content/select";

  describe("localize", () => {
    it("renvoie la langue demandée", () => {
      expect(localize({ fr: "Bonjour", en: "Hello" }, "en")).toEqual({ text: "Hello", lang: "en" });
    });
    it("retombe sur le français, signalé par lang=fr, si l'anglais est vide", () => {
      expect(localize({ fr: "Bonjour", en: "" }, "en")).toEqual({ text: "Bonjour", lang: "fr" });
      expect(localize({ fr: "Bonjour", en: "   " }, "en")).toEqual({ text: "Bonjour", lang: "fr" });
    });
  });

  describe("visibleProjects", () => {
    const e = (id: string, status: string, order: number) => ({ id, data: { status, order } });
    const all = [e("b", "published", 2), e("a", "published", 1), e("d", "draft", 0), e("z", "archived", 0)];
    it("garde les publiés, triés par ordre", () => {
      expect(visibleProjects(all, { includeDrafts: false }).map((x) => x.id)).toEqual(["a", "b"]);
    });
    it("inclut les brouillons en dev, jamais les archivés", () => {
      expect(visibleProjects(all, { includeDrafts: true }).map((x) => x.id)).toEqual(["d", "a", "b"]);
    });
  });
  ```
- [ ] Implémentation
  ```ts
  import type { Locale } from "../../i18n/config";

  export function localize(field: { fr: string; en: string }, locale: Locale): { text: string; lang: Locale } {
    if (locale === "en" && field.en.trim()) return { text: field.en, lang: "en" };
    return { text: field.fr, lang: "fr" };
  }

  export function visibleProjects<T extends { data: { status: string; order: number } }>(entries: T[], opts: { includeDrafts: boolean }): T[] {
    return entries
      .filter((e) => e.data.status === "published" || (opts.includeDrafts && e.data.status === "draft"))
      .sort((a, b) => a.data.order - b.data.order);
  }
  ```
- [ ] `pnpm test` → vert. Commit `feat(content): repli FR et filtrage des projets visibles`.

### Tâche 2.5 : vérification du contenu au build, contenu initial, nom depuis le profil

**Fichiers :** créer `scripts/check-content.ts`, `src/lib/content/load.ts`, `tests/unit/content-load.test.ts`, `tests/fixtures/content-ok/…`, `tests/fixtures/content-bad/…`, `src/content/profile.yaml`, `src/content/skills.yaml`, `src/content/experiences.yaml`, `src/content/projects/{compagnon,portfolio}/{meta.yaml,fr.mdx,en.mdx}` ; modifier `package.json` (scripts), `src/components/Header.astro`, `src/components/Footer.astro`, `docs/BACKEND_SCHEMA.md` (email optionnel).
**Produit :** `loadAndCheck(root: string): Report` (lit `<root>/src/content`, `<root>/src/assets/captures`) ; scripts `check:content` et `build`.

- [ ] Ajouter la dépendance `yaml` : `pnpm add -D yaml`.
- [ ] Fixtures. `tests/fixtures/content-ok/` contient un profil valide, `skills.yaml` (avec `astro`), `experiences.yaml` (`[]`) et un projet `demo` en brouillon. `tests/fixtures/content-bad/` contient le même profil et les mêmes skills, plus deux projets :
  - `demo` en `published`, sans `fr.mdx`, avec `stack: [inconnu]` ;
  - `dates` en brouillon, avec `start: 2021` et `end: 2020`.
- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { fileURLToPath } from "node:url";
  import { loadAndCheck } from "../../src/lib/content/load";

  const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

  describe("loadAndCheck", () => {
    it("ne signale rien sur un contenu valide", () => {
      expect(loadAndCheck(fixture("content-ok")).errors).toEqual([]);
    });
    it("cite le fichier et le champ fautifs", () => {
      const { errors } = loadAndCheck(fixture("content-bad"));
      const fields = errors.map((e) => `${e.file}#${e.field}`);
      expect(fields).toEqual(expect.arrayContaining([
        "src/content/projects/demo/meta.yaml#fr.mdx",
        "src/content/projects/demo/meta.yaml#stack",
        "src/content/projects/dates/meta.yaml#end",
      ]));
    });
    it("nomme le skill inconnu", () => {
      const { errors } = loadAndCheck(fixture("content-bad"));
      expect(errors.find((e) => e.field === "stack")?.message).toBe("skill inconnu : inconnu");
    });
  });
  ```
- [ ] Implémentation `src/lib/content/load.ts` (lecture disque + schémas + règles ; `image()` = chemin relatif qui doit exister)
  ```ts
  import { existsSync, readFileSync, readdirSync } from "node:fs";
  import { join, dirname } from "node:path";
  import { parse } from "yaml";
  import { z } from "astro/zod";
  import { experienceSchema, profileSchema, projectSchema, skillSchema, slug as slug_ } from "./schemas.ts";
  import { checkPeriod, checkProfile, checkProjects, type Issue, type ProjectInput, type Report } from "./rules.ts";

  const rel = (root: string, p: string) => p.slice(root.length + 1);
  const zodIssues = (file: string, error: z.ZodError): Issue[] =>
    error.issues.map((i) => ({ file, field: i.path.join(".") || "(fichier)", message: i.message }));

  export function loadAndCheck(root: string): Report {
    const content = join(root, "src/content");
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    const read = (p: string): unknown => parse(readFileSync(p, "utf8"));

    // profil (une seule clé « main »)
    const profileFile = join(content, "profile.yaml");
    const imageAt = (base: string) => () => z.string().refine((p) => existsSync(join(base, p)), "image introuvable");
    const profile = profileSchema(imageAt(content)).safeParse((read(profileFile) as { main?: unknown })?.main);
    if (!profile.success) errors.push(...zodIssues(rel(root, profileFile), profile.error));
    else errors.push(...checkProfile(rel(root, profileFile), profile.data).errors);

    // skills et expériences
    const skillsFile = join(content, "skills.yaml");
    const skills = z.array(skillSchema).safeParse(read(skillsFile));
    if (!skills.success) errors.push(...zodIssues(rel(root, skillsFile), skills.error));
    const skillIds = new Set(skills.success ? skills.data.map((s) => s.id) : []);
    const expFile = join(content, "experiences.yaml");
    const exps = z.array(experienceSchema).safeParse(read(expFile));
    if (!exps.success) errors.push(...zodIssues(rel(root, expFile), exps.error));
    else for (const e of exps.data) errors.push(...checkPeriod(`${rel(root, expFile)}#${e.id}`, e.start, e.end));

    // projets
    const projectsDir = join(content, "projects");
    const inputs: ProjectInput[] = [];
    for (const slug of existsSync(projectsDir) ? readdirSync(projectsDir) : []) {
      const metaPath = join(projectsDir, slug, "meta.yaml");
      if (!existsSync(metaPath)) continue;
      const file = rel(root, metaPath);
      const parsed = projectSchema(imageAt(dirname(metaPath)), slug_).safeParse(read(metaPath));
      if (!parsed.success) {
        errors.push(...zodIssues(file, parsed.error));
        continue;
      }
      for (const id of parsed.data.stack) {
        if (!skillIds.has(id as string)) errors.push({ file, field: "stack", message: `skill inconnu : ${id}` });
      }
      inputs.push({
        slug,
        file,
        data: parsed.data,
        hasFrBody: existsSync(join(projectsDir, slug, "fr.mdx")),
        hasEnBody: existsSync(join(projectsDir, slug, "en.mdx")),
        hasCapture: existsSync(join(root, "src/assets/captures", `${slug}.webp`)),
      });
    }
    const report = checkProjects(inputs);
    return { errors: [...errors, ...report.errors], warnings: [...warnings, ...report.warnings] };
  }
  ```
- [ ] `scripts/check-content.ts`
  ```ts
  import { fileURLToPath } from "node:url";
  import { loadAndCheck } from "../src/lib/content/load.ts";

  const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
  const { errors, warnings } = loadAndCheck(root);
  for (const w of warnings) console.warn(`avertissement  ${w.file} › ${w.field} : ${w.message}`);
  for (const e of errors) console.error(`erreur         ${e.file} › ${e.field} : ${e.message}`);
  console.log(`contenu : ${errors.length} erreur(s), ${warnings.length} avertissement(s)`);
  process.exit(errors.length ? 1 : 0);
  ```
- [ ] `package.json` : `"check:content": "node scripts/check-content.ts"` et `"build": "node scripts/check-content.ts && astro build"`.
- [ ] Contenu initial (brouillons, sans email) :
  - `src/content/profile.yaml` : `main:` avec
    - `fullName: Richard`, rôle FR/EN « Développeur web » / « Web developer » ;
    - accroche FR « Je conçois et je construis des sites rapides, à la main, avec Claude Code ou un CMS. », EN « I design and build fast websites, by hand, with Claude Code or a CMS. » ;
    - une bio d'une phrase par langue, à réécrire en Phase 9 ;
    - `githubLogin: Stryxman`, `socials: [{ kind: github, url: https://github.com/Stryxman }]`.
  - `skills.yaml` : `astro`, `typescript`, `javascript`, `html-css`, `tailwindcss`, `python`, `claude-code` (catégories language / framework / tool).
  - `experiences.yaml` : `[]` (à remplir en Phase 9).
  - `projects/compagnon` : `status: draft`, `provenance: claude-code`, `repo: Stryxman/compagnon`, `stack: [python, claude-code]`, `start: 2026-10`. Titre « Compagnon », résumé FR « Un petit renard animé qui accompagne les sessions de travail sur le bureau, en local. », résumé EN équivalent. `fr.mdx` et `en.mdx` de 2 à 3 phrases tirées du README.
  - `projects/portfolio` : `status: draft`, `provenance: claude-code`, `repo: Stryxman/portfolio`, `stack: [astro, typescript, tailwindcss, claude-code]`, `start: 2026-10`, `liveUrl` = URL de production.
- [ ] Header et Footer : remplacer « Richard » par `(await getEntry("profile", "main"))!.data.fullName`.
- [ ] `docs/BACKEND_SCHEMA.md` §3 : `email: z.email().optional()` avec la note « dépôt public ».
- [ ] Vérifier :
  - `pnpm test && pnpm check:content && pnpm check && pnpm build && pnpm e2e` → vert ;
  - casser volontairement `profile.yaml` (accroche de 25 mots) puis `pnpm build` → échec avec `src/content/profile.yaml › tagline.fr` ;
  - restaurer le fichier.
- [ ] Commit `feat(content): vérification au build, contenu initial, nom depuis le profil`.

### Tâche 2.6 : `pnpm projet:nouveau`

**Fichiers :** créer `scripts/new-project.ts`, `src/lib/content/scaffold.ts`, `tests/unit/scaffold.test.ts` ; modifier `package.json`.
**Produit :** `toSlug(name: string): string` ; `cleanReadme(md: string): string` ; `scaffold(input: RepoInput, knownSkills: Set<string>): { slug: string; files: Record<string, string> }`, avec `type RepoInput = { fullName: string; name: string; description: string | null; homepage: string | null; languages: string[]; topics: string[]; readme: string | null; pushedAt: string }`.

- [ ] Tests (doivent échouer)
  ```ts
  import { describe, it, expect } from "vitest";
  import { parse } from "yaml";
  import { toSlug, cleanReadme, scaffold } from "../../src/lib/content/scaffold";

  describe("toSlug", () => {
    it("produit du kebab-case sans accents", () => {
      expect(toSlug("Mon_Super Projet Été")).toBe("mon-super-projet-ete");
    });
  });

  describe("cleanReadme", () => {
    it("retire le H1, les badges et les commentaires HTML", () => {
      const md = "# Titre\n\n[![build](https://x/badge.svg)](https://x)\n<!-- note -->\nTexte utile.\n\n## Usage\nok";
      expect(cleanReadme(md)).toBe("Texte utile.\n\n## Usage\nok");
    });
  });

  describe("scaffold", () => {
    const input = {
      fullName: "Stryxman/compagnon", name: "compagnon", description: "Renard — compagnon", homepage: null,
      languages: ["Python", "Shell"], topics: ["Claude-Code"], readme: "# Compagnon\nUn renard.", pushedAt: "2026-10-11T18:22:00Z",
    };
    it("crée un brouillon valide avec la stack connue et le reste en tags", () => {
      const { slug, files } = scaffold(input, new Set(["python"]));
      expect(slug).toBe("compagnon");
      const meta = parse(files["meta.yaml"]!);
      expect(meta).toMatchObject({ status: "draft", repo: "Stryxman/compagnon", stack: ["python"], tags: ["shell", "claude-code"], start: "2026-10" });
      expect(files["fr.mdx"]).toBe("Un renard.\n");
    });
    it("remplace le tiret cadratin de la description (règle de contenu)", () => {
      const meta = parse(scaffold(input, new Set()).files["meta.yaml"]!);
      expect(meta.summary.fr).toBe("Renard - compagnon");
    });
  });
  ```
- [ ] Implémentation `src/lib/content/scaffold.ts`
  ```ts
  import { stringify } from "yaml";

  export type RepoInput = { fullName: string; name: string; description: string | null; homepage: string | null; languages: string[]; topics: string[]; readme: string | null; pushedAt: string };

  export const toSlug = (name: string) =>
    name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  export function cleanReadme(md: string): string {
    return md
      .replace(/<!--[\s\S]*?-->/g, "")
      .split("\n")
      .filter((line, i, all) => !(line.startsWith("# ") && all.slice(0, i).every((l) => !l.trim())))
      .filter((line) => !/^\s*\[!\[.*\]\(.*\)\]\(.*\)\s*$/.test(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");

  export function scaffold(input: RepoInput, knownSkills: Set<string>): { slug: string; files: Record<string, string> } {
    const slug = toSlug(input.name);
    const techs = [...input.languages, ...input.topics].map(toSlug);
    const stack = techs.filter((t) => knownSkills.has(t));
    const tags = [...new Set(techs.filter((t) => !knownSkills.has(t)))];
    const summary = noDash(input.description ?? input.name);
    const meta = {
      title: { fr: input.name, en: input.name },
      summary: { fr: summary, en: "" },
      provenance: "other",
      stack,
      tags,
      status: "draft",
      repo: input.fullName,
      ...(input.homepage ? { liveUrl: input.homepage } : {}),
      start: input.pushedAt.slice(0, 7),
    };
    const body = input.readme ? cleanReadme(input.readme) : summary;
    return { slug, files: { "meta.yaml": stringify(meta), "fr.mdx": `${body}\n` } };
  }
  ```
- [ ] `scripts/new-project.ts` : il lit l'argument `owner/repo`, appelle `gh api repos/<r>`, `gh api repos/<r>/languages` et `gh api repos/<r>/readme -H "Accept: application/vnd.github.raw"` via `execFileSync` (README absent : `null`), et lit les ids de `src/content/skills.yaml`. Il **refuse** si `src/content/projects/<slug>/` existe déjà (code de sortie 1, message « existe déjà »). Sinon il écrit les fichiers et affiche le chemin ainsi que la consigne « compléter provenance, résumés EN, puis pnpm check:content ».
- [ ] `package.json` : `"projet:nouveau": "node scripts/new-project.ts"`.
- [ ] Vérifier :
  - `pnpm test` → vert ;
  - `pnpm projet:nouveau Stryxman/compagnon` → refus « existe déjà » (le dossier a été créé en 2.5) ;
  - `pnpm projet:nouveau Stryxman/<autre dépôt public>` dans un dossier jetable, puis `pnpm check:content` → 0 erreur, puis suppression du dossier jetable.
- [ ] Commit `feat(content): commande projet:nouveau`.

### Clôture de phase

`/code-review` sur `main...phase-2`, passe de correction en TDD, PR `Phase 2 : contenu et schémas`, CI verte, `PROGRESS.md` et `docs/REPRISE.md` à jour, puis fusion après accord de Richard.
