import { stringify } from "yaml";

export type RepoInput = {
  fullName: string;
  name: string;
  description: string | null;
  homepage: string | null;
  languages: string[];
  topics: string[];
  readme: string | null;
  pushedAt: string;
  createdAt: string;
};

export const toSlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Hors code, le MDX interprète « < » et les accolades comme du JSX : un README réel (badges HTML,
// <br>, {variables}) ferait échouer le build. On retire les balises et on échappe le reste.
const mdxSafe = (text: string) =>
  text
    .split(/(`[^`]*`)/) // les morceaux impairs sont du code en ligne, laissé intact
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, "[$1]($1)") // MDX ne gère pas les autoliens
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<\/?[A-Za-z][\w-]*(?:\s[^>]*)?\/?>/g, "")
            .replace(/[{}<]/g, (c) => `\\${c}`)
            // une ligne de prose qui commence par import/export serait lue comme de l'ESM
            .replace(/^(\s*)import(\s)/, "$1&#105;mport$2")
            .replace(/^(\s*)export(\s)/, "$1&#101;xport$2"),
    )
    .join("");

const isAbsolute = (url: string) => /^(https?:|mailto:|#|data:)/i.test(url);

// Une image relative serait importée comme un fichier par MDX (build en échec) : on la pointe vers
// GitHub quand le dépôt est connu, sinon on la retire. Les liens relatifs suivent la même logique.
const absolutize = (text: string, repo?: string) =>
  text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)((?:\s+["'][^"')]*["'])?)\)/g, (all, alt: string, url: string, title: string) =>
      isAbsolute(url) ? all : repo ? `![${alt}](https://raw.githubusercontent.com/${repo}/HEAD/${url.replace(/^\.\//, "")}${title})` : "",
    )
    .replace(/(?<!!)\[([^\]]*)\]\(([^)\s]+)((?:\s+["'][^"')]*["'])?)\)/g, (all, label: string, url: string, title: string) =>
      isAbsolute(url) || !repo ? all : `[${label}](https://github.com/${repo}/blob/HEAD/${url.replace(/^\.\//, "")}${title})`,
    );

// README → description de projet : sans le titre principal (déjà dans meta.yaml), sans badges ni commentaires
export function cleanReadme(md: string, repo?: string): string {
  let inFence = false;
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((line) => !/^\s*\[!\[.*\]\(.*\)\]\(.*\)\s*$/.test(line))
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence
        ? line
        : mdxSafe(absolutize(line, repo))
            .replace(/ {2,}(?=\S)/g, (sp, i) => (i === 0 ? sp : " "))
            .trimEnd();
    })
    .filter((line, i, all) => !(line.startsWith("# ") && all.slice(0, i).every((l) => !l.trim())))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");

export function scaffold(input: RepoInput, knownSkills: Set<string>): { slug: string; files: Record<string, string> } {
  const slug = toSlug(input.name);
  const techs = [...input.languages, ...input.topics].map(toSlug);
  const stack = [...new Set(techs.filter((t) => knownSkills.has(t)))];
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
    start: input.createdAt.slice(0, 7), // date de création du dépôt, pas du dernier push
  };
  const body = input.readme ? cleanReadme(input.readme, input.fullName) : summary;
  return { slug, files: { "meta.yaml": stringify(meta), "fr.mdx": `${body}\n` } };
}
