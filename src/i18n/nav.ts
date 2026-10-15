import type { Locale } from "./config";
import { pathFor, type RouteKey } from "./routes";
import type { UiKey } from "./ui";

// Liens de l'en-tête et du menu mobile (une seule liste). Le contact vit dans la page À propos.
export const navLinks = [
  ["projects", "nav.projects"],
  ["about", "nav.about"],
] as const satisfies readonly (readonly [RouteKey, UiKey])[];

export const contactHref = (locale: Locale): string => `${pathFor("about", locale)}#contact`;

// « page » sur la page elle-même, « true » dans sa rubrique (ex. une fiche projet sous Projets)
export function ariaCurrent(pathname: string, href: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  return pathname.startsWith(href) ? "true" : undefined;
}
