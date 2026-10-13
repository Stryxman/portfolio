// pnpm projet:nouveau owner/repo : crée src/content/projects/<slug>/ (brouillon) depuis GitHub.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parse } from "yaml";
import { scaffold } from "../src/lib/content/scaffold.ts";

const repo = process.argv[2];
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error("usage : pnpm projet:nouveau owner/repo");
  process.exit(2);
}

const gh = (...args: string[]) => execFileSync("gh", ["api", ...args], { encoding: "utf8" });
const root = fileURLToPath(new URL("..", import.meta.url));

const info = JSON.parse(gh(`repos/${repo}`)) as {
  full_name: string;
  name: string;
  description: string | null;
  homepage: string | null;
  topics?: string[];
  pushed_at: string;
  created_at: string;
};
const languages = Object.keys(JSON.parse(gh(`repos/${repo}/languages`)) as Record<string, number>);
let readme: string | null = null;
try {
  readme = gh(`repos/${repo}/readme`, "-H", "Accept: application/vnd.github.raw");
} catch {
  readme = null; // dépôt sans README : la description servira de texte
}

const skills = parse(readFileSync(join(root, "src/content/skills.yaml"), "utf8")) as { id: string }[];
const { slug, files } = scaffold(
  {
    fullName: info.full_name,
    name: info.name,
    description: info.description,
    homepage: info.homepage || null,
    languages,
    topics: info.topics ?? [],
    readme,
    pushedAt: info.pushed_at,
    createdAt: info.created_at,
  },
  new Set(skills.map((s) => s.id)),
);

const dir = join(root, "src/content/projects", slug);
if (existsSync(dir)) {
  console.error(`le projet « ${slug} » existe déjà (${dir}) : rien n'a été modifié`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
console.log(`brouillon créé : src/content/projects/${slug}/`);
console.log("à compléter : provenance, résumé et titre anglais, en.mdx, puis « pnpm check:content »");
