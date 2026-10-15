export type Issue = { file: string; field: string; message: string };
export type Report = { errors: Issue[]; warnings: Issue[] };
export type Localized = { fr: string; en: string };
export interface ProjectInput {
  slug: string;
  file: string; // ex. « src/content/projects/compagnon/meta.yaml »
  data: {
    title: Localized;
    summary: Localized;
    status: "draft" | "published" | "archived";
    featured: boolean;
    start?: string | undefined;
    end?: string | undefined;
    cover?: unknown;
  };
  hasFrBody: boolean;
  hasEnBody: boolean;
  hasCapture: boolean;
}

export const MAX_FEATURED = 6;
const DASH = /[—–]/; // DESIGN_BRIEF §7 : aucun tiret cadratin ou demi-cadratin dans l'interface

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
// « 2025 » seul vaut janvier pour un début et décembre pour une fin
const asMonth = (v: string, bound: "start" | "end") =>
  v.length === 4 ? `${v}-${bound === "start" ? "01" : "12"}` : v;

export function checkPeriod(file: string, start?: string, end?: string): Issue[] {
  if (!start || !end) return [];
  return asMonth(end, "end") < asMonth(start, "start")
    ? [{ file, field: "end", message: `la fin (${end}) précède le début (${start})` }]
    : [];
}

function dashes(file: string, fields: Record<string, string>): Issue[] {
  return Object.entries(fields)
    .filter(([, v]) => DASH.test(v))
    .map(([field]) => ({
      file,
      field,
      message: "tiret cadratin ou demi-cadratin interdit (utiliser « - », une virgule ou deux phrases)",
    }));
}

export function checkProjects(projects: ProjectInput[]): Report {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  for (const p of projects) {
    const { data, file } = p;
    errors.push(
      ...dashes(file, {
        "title.fr": data.title.fr,
        "title.en": data.title.en,
        "summary.fr": data.summary.fr,
        "summary.en": data.summary.en,
      }),
    );
    errors.push(...checkPeriod(file, data.start, data.end));
    if (data.status !== "published") continue;
    if (!p.hasFrBody) errors.push({ file, field: "fr.mdx", message: "un projet publié doit avoir fr.mdx" });
    if (!data.cover && !p.hasCapture) {
      warnings.push({ file, field: "cover", message: "aucune image (cover.webp ou capture) : le sceau sert de repli" });
    }
    if (!data.title.en) warnings.push({ file, field: "title.en", message: "titre anglais manquant (repli sur le français)" });
    if (!data.summary.en) warnings.push({ file, field: "summary.en", message: "résumé anglais manquant (repli sur le français)" });
    if (!p.hasEnBody) warnings.push({ file, field: "en.mdx", message: "description anglaise manquante (repli sur le français)" });
  }
  const featured = projects.filter((p) => p.data.status === "published" && p.data.featured);
  if (featured.length > MAX_FEATURED) {
    errors.push({
      file: featured.map((p) => p.slug).join(", "),
      field: "featured",
      message: `${featured.length} projets mis en avant, maximum ${MAX_FEATURED}`,
    });
  }
  return { errors, warnings };
}

export function checkProfile(file: string, data: { tagline: Localized; headline: Localized }): Report {
  const errors: Issue[] = dashes(file, {
    "tagline.fr": data.tagline.fr,
    "tagline.en": data.tagline.en,
    "headline.fr": data.headline.fr,
    "headline.en": data.headline.en,
  });
  for (const lang of ["fr", "en"] as const) {
    if (words(data.tagline[lang]) > 20) {
      errors.push({ file, field: `tagline.${lang}`, message: "accroche limitée à 20 mots (DESIGN_BRIEF §2)" });
    }
    if (words(data.headline[lang]) > 6) {
      errors.push({ file, field: `headline.${lang}`, message: "titre du hero limité à 6 mots (2 lignes, DESIGN_BRIEF §2)" });
    }
  }
  return { errors, warnings: [] };
}
