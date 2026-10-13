import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  trailingSlash: "always",
  // la barre d'outils de dev ajoute ses propres boutons (« Menu ») qui faussent les tests E2E
  devToolbar: { enabled: false },
  adapter: vercel(),
  integrations: [mdx(), sitemap(), icon()],
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  // Switzer (Fontshare) sera ajoutée ici dès que le fichier est téléchargé (accord de Richard requis).
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      options: {
        variants: [
          { weight: "100 900", style: "normal", src: ["./src/assets/fonts/GeistMono-Variable.woff2"] },
        ],
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
