import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { z } from "astro/zod";
import { experienceSchema, profileSchema, projectSchema, skillSchema, slug } from "./schemas.ts";
import { checkPeriod, checkProfile, checkProjects, type Issue, type ProjectInput, type Report } from "./rules.ts";

// Lit le contenu sur disque, applique les schémas puis les règles : utilisé avant `astro build`
// (scripts/check-content.ts) pour échouer tôt avec le fichier et le champ fautifs.
export function loadAndCheck(root: string): Report {
  const content = join(root, "src/content");
  const rel = (p: string) => p.slice(root.length + 1);
  const read = (p: string): unknown => parse(readFileSync(p, "utf8"));
  const zodIssues = (file: string, error: z.ZodError): Issue[] =>
    error.issues.map((i) => ({ file, field: i.path.join(".") || "(fichier)", message: i.message }));
  // image() du script : un chemin relatif au fichier qui le déclare, qui doit exister
  const imageAt = (base: string) => () =>
    z.string().refine((p) => existsSync(join(base, p)), { message: "image introuvable" });
  const errors: Issue[] = [];

  const profileFile = join(content, "profile.yaml");
  const profile = profileSchema(imageAt(content)).safeParse((read(profileFile) as { main?: unknown } | null)?.main);
  if (profile.success) errors.push(...checkProfile(rel(profileFile), profile.data).errors);
  else errors.push(...zodIssues(rel(profileFile), profile.error));

  const skillsFile = join(content, "skills.yaml");
  const skills = z.array(skillSchema).safeParse(read(skillsFile));
  if (!skills.success) errors.push(...zodIssues(rel(skillsFile), skills.error));
  const skillIds = new Set(skills.success ? skills.data.map((s) => s.id) : []);

  const expFile = join(content, "experiences.yaml");
  const exps = z.array(experienceSchema).safeParse(read(expFile));
  if (!exps.success) errors.push(...zodIssues(rel(expFile), exps.error));
  else for (const e of exps.data) errors.push(...checkPeriod(`${rel(expFile)}#${e.id}`, e.start, e.end));

  const projectsDir = join(content, "projects");
  const inputs: ProjectInput[] = [];
  for (const dir of existsSync(projectsDir) ? readdirSync(projectsDir) : []) {
    const metaPath = join(projectsDir, dir, "meta.yaml");
    if (!existsSync(metaPath)) continue;
    const file = rel(metaPath);
    const parsed = projectSchema(imageAt(dirname(metaPath)), slug).safeParse(read(metaPath));
    if (!parsed.success) {
      errors.push(...zodIssues(file, parsed.error));
      continue;
    }
    for (const id of parsed.data.stack as string[]) {
      if (!skillIds.has(id)) errors.push({ file, field: "stack", message: `skill inconnu : ${id}` });
    }
    inputs.push({
      slug: dir,
      file,
      data: parsed.data,
      hasFrBody: existsSync(join(projectsDir, dir, "fr.mdx")),
      hasEnBody: existsSync(join(projectsDir, dir, "en.mdx")),
      hasCapture: existsSync(join(root, "src/assets/captures", `${dir}.webp`)),
    });
  }
  const report = checkProjects(inputs);
  return { errors: [...errors, ...report.errors], warnings: report.warnings };
}
