import type { Locale } from "../../i18n/config";

// Typographie française : espace insécable avant « : ; ? ! » et à l'intérieur des guillemets,
// pour qu'une ligne ne commence jamais par un deux-points ou un guillemet fermant.
const frenchSpacing = (text: string) =>
  text.replace(/ ([:;?!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");

// Repli : un texte anglais vide affiche le français, et la page balise ce passage en lang="fr".
export function localize(
  field: { fr: string; en: string },
  locale: Locale,
): { text: string; lang: Locale } {
  if (locale === "en" && field.en.trim()) return { text: field.en, lang: "en" };
  return { text: frenchSpacing(field.fr), lang: "fr" };
}

export function visibleProjects<T extends { id: string; data: { status: string; order: number } }>(
  entries: T[],
  opts: { includeDrafts: boolean },
): T[] {
  return entries
    .filter(
      (e) => e.data.status === "published" || (opts.includeDrafts && e.data.status === "draft"),
    )
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
