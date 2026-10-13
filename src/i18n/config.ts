export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const otherLocale = (locale: Locale): Locale => (locale === "fr" ? "en" : "fr");
