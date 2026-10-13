import type { Locale } from "./config";

// Libellés d'interface (DESIGN_BRIEF §7) : un libellé par intention, aucun tiret cadratin.
const fr = {
  "nav.projects": "Projets",
  "nav.about": "À propos",
  "nav.contact": "Contact",
  "nav.skip": "Aller au contenu",
  "nav.menu": "Menu",
  "nav.close": "Fermer le menu",
  "nav.primary": "Navigation principale",
  "theme.dark": "Thème sombre",
  "lang.switch": "English",
  "footer.legal": "Mentions légales",
  "cta.projects": "Voir les projets",
  "cta.contact": "Me contacter",
  "page.home.title": "Accueil",
  "page.projects.title": "Projets",
  "page.about.title": "À propos",
  "page.contact.title": "Contact",
  "page.legal.title": "Mentions légales",
  "page.notFound.title": "Page introuvable",
} as const;

const en: Record<keyof typeof fr, string> = {
  "nav.projects": "Projects",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.skip": "Skip to content",
  "nav.menu": "Menu",
  "nav.close": "Close menu",
  "nav.primary": "Main navigation",
  "theme.dark": "Dark theme",
  "lang.switch": "Français",
  "footer.legal": "Legal notice",
  "cta.projects": "See projects",
  "cta.contact": "Get in touch",
  "page.home.title": "Home",
  "page.projects.title": "Projects",
  "page.about.title": "About",
  "page.contact.title": "Contact",
  "page.legal.title": "Legal notice",
  "page.notFound.title": "Page not found",
};

export type UiKey = keyof typeof fr;
export const ui: Record<Locale, Record<UiKey, string>> = { fr, en };
export const t = (locale: Locale, key: UiKey): string => ui[locale][key];
