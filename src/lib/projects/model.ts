import type { ImageMetadata } from "astro";
import type { Locale } from "../../i18n/config";
import { fmt } from "../../i18n/ui";
import { localize } from "../content/select";
import type { Provenance } from "../geometry/families";
import type { PROJECT_CATEGORIES } from "../content/schemas";

export type Text = { text: string; lang: Locale };
export type Category = (typeof PROJECT_CATEGORIES)[number];
type Localized = { fr: string; en: string };

// Ce que la couche de requêtes fournit, sans dépendre d'astro:content (testable sous Vitest)
export interface ProjectInput {
  slug: string;
  title: Localized;
  summary: Localized;
  category: Category;
  provenance: Provenance;
  start?: string | undefined;
  end?: string | undefined;
  image?: ImageMetadata | undefined;
}

export interface ProjectCard {
  slug: string;
  title: Text;
  summary: Text;
  category: Category;
  provenance: Provenance;
  period: string | undefined;
  image: ImageMetadata | undefined;
}

const year = (v: string) => Number(v.slice(0, 4));

// « 2026 », « 2023-2025 » (trait d'union simple, DESIGN_BRIEF §7) ou « Depuis 2024 »
export function formatPeriod(
  start: string | undefined,
  end: string | undefined,
  locale: Locale,
  now = new Date(),
): string | undefined {
  if (!end) {
    if (!start) return undefined;
    const y = year(start);
    return y >= now.getFullYear() ? String(y) : fmt(locale, "period.since", { y });
  }
  if (!start || year(start) === year(end)) return String(year(end));
  return `${year(start)}-${year(end)}`;
}

export function projectStatus(
  start: string | undefined,
  end: string | undefined,
): "ongoing" | "done" | undefined {
  if (end) return "done";
  return start ? "ongoing" : undefined;
}

export function toCard(p: ProjectInput, locale: Locale, now = new Date()): ProjectCard {
  return {
    slug: p.slug,
    title: localize(p.title, locale),
    summary: localize(p.summary, locale),
    category: p.category,
    provenance: p.provenance,
    period: formatPeriod(p.start, p.end, locale, now),
    image: p.image,
  };
}

export function neighbours(
  slugs: string[],
  slug: string,
): { prev: string | undefined; next: string | undefined } {
  const i = slugs.indexOf(slug);
  if (i < 0) return { prev: undefined, next: undefined };
  return { prev: slugs[i - 1], next: slugs[i + 1] };
}

export const domainOf = (url: string): string => new URL(url).hostname.replace(/^www\./, "");
