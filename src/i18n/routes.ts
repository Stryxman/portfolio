import type { Locale } from "./config";

export const routes = {
  home: { fr: "/fr/", en: "/en/" },
  projects: { fr: "/fr/projets/", en: "/en/projects/" },
  about: { fr: "/fr/a-propos/", en: "/en/about/" },
  legal: { fr: "/fr/mentions-legales/", en: "/en/legal/" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

export const pathFor = (key: RouteKey, locale: Locale): string => routes[key][locale];
export const projectPath = (slug: string, locale: Locale): string =>
  `${routes.projects[locale]}${slug}/`;
export const alternatesFor = (key: RouteKey): Record<Locale, string> => ({ ...routes[key] });
