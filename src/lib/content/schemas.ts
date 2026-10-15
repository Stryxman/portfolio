import { z } from "astro/zod";

// Fabriques partagées par content.config.ts (vrais image() et reference()) et par scripts/check-content.ts.
// Génériques : les types d'image et de référence d'Astro remontent jusqu'aux vues.
export type ImageFn<I extends z.ZodType = z.ZodType> = () => I;

export const localized = z.object({ fr: z.string().min(1), en: z.string().default("") });
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case attendu (a-z, 0-9, tirets)");
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

export const profileSchema = <I extends z.ZodType>(image: ImageFn<I>) =>
  z.object({
    fullName: z.string().min(1),
    role: localized,
    headline: localized, // titre du hero (6 mots maximum, vérifié par checkProfile)
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

export const projectSchema = <I extends z.ZodType, R extends z.ZodType>(
  image: ImageFn<I>,
  skillRef: R,
) =>
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
    repo: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, "format owner/nom")
      .optional(),
    cover: image().optional(),
    gallery: z.array(z.object({ src: image(), alt: localized })).default([]),
    preview: z
      .object({ mode: z.enum(["auto", "iframe", "screenshot", "none"]).default("auto") })
      .default({ mode: "auto" }),
  });
