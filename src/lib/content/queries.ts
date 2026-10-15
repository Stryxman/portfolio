import { getCollection, getEntry, render } from "astro:content";
import type { ImageMetadata } from "astro";
import type { Locale } from "../../i18n/config";
import { visibleProjects } from "./select";
import { toCard, type ProjectCard } from "../projects/model";

// Accès au contenu pour les vues ; la logique testable vit dans lib/projects.
// Brouillons : visibles en dev et sur les aperçus Vercel, jamais en production (PRD C3).
const includeDrafts = import.meta.env.DEV || process.env.VERCEL_ENV === "preview";
// Captures automatiques (Phase 6, reportée) : dossier absent = aucune capture
const captures = import.meta.glob<ImageMetadata>("/src/assets/captures/*.webp", {
  eager: true,
  import: "default",
});

export async function getProfile() {
  const entry = await getEntry("profile", "main");
  if (!entry) throw new Error("src/content/profile.yaml : entrée « main » introuvable");
  return entry.data;
}

export const getProjectEntries = async () =>
  visibleProjects(await getCollection("projects"), { includeDrafts });
export type ProjectEntry = Awaited<ReturnType<typeof getProjectEntries>>[number];

// cover.webp prime ; sinon la capture auto (sauf aperçu « none ») ; sinon rien, et le sceau prend le relais
export function imageOf(e: ProjectEntry): ImageMetadata | undefined {
  if (e.data.cover) return e.data.cover;
  return e.data.preview.mode === "none" ? undefined : captures[`/src/assets/captures/${e.id}.webp`];
}

export const cardOf = (e: ProjectEntry, locale: Locale): ProjectCard =>
  toCard(
    {
      slug: e.id,
      title: e.data.title,
      summary: e.data.summary,
      category: e.data.category,
      provenance: e.data.provenance,
      start: e.data.start,
      end: e.data.end,
      image: imageOf(e),
    },
    locale,
  );

export const getSkills = async () =>
  (await getCollection("skills")).map((e) => e.data).sort((a, b) => a.order - b.order);

// Description longue : la langue demandée, sinon le français (la vue balise alors lang="fr")
export async function getProjectBody(slug: string, locale: Locale) {
  const entry =
    (await getEntry("projectBodies", `${slug}/${locale}`)) ??
    (await getEntry("projectBodies", `${slug}/fr`));
  if (!entry) return undefined;
  const { Content } = await render(entry);
  return { Content, lang: (entry.id.endsWith("/en") ? "en" : "fr") as Locale };
}
