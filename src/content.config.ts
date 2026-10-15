import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { experienceSchema, profileSchema, projectSchema, skillSchema } from "./lib/content/schemas";

// Le profil est un objet YAML à une seule clé « main » : getEntry("profile", "main").
const profile = defineCollection({
  loader: file("src/content/profile.yaml"),
  schema: ({ image }) => profileSchema(image),
});
const skills = defineCollection({ loader: file("src/content/skills.yaml"), schema: skillSchema });
const experiences = defineCollection({
  loader: file("src/content/experiences.yaml"),
  schema: experienceSchema,
});
const projects = defineCollection({
  loader: glob({
    pattern: "*/meta.yaml",
    base: "src/content/projects",
    generateId: ({ entry }) => entry.split("/")[0]!,
  }),
  schema: ({ image }) => projectSchema(image, reference("skills")),
});
const projectBodies = defineCollection({
  loader: glob({ pattern: "*/{fr,en}.mdx", base: "src/content/projects" }),
});

// Mentions légales : src/content/legal/{fr,en}.mdx, ids « fr » et « en »
const legal = defineCollection({ loader: glob({ pattern: "*.mdx", base: "src/content/legal" }) });

export const collections = { profile, skills, experiences, projects, projectBodies, legal };
