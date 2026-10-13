import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import { resolveSite } from "./src/lib/site";

export default defineConfig({
  site: resolveSite(process.env),
  trailingSlash: "always",
  adapter: vercel(),
  integrations: [mdx(), sitemap(), icon()],
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Geist",
      cssVariable: "--font-geist",
      options: {
        variants: [
          { weight: "100 900", style: "normal", src: ["./src/assets/fonts/Geist-Variable.woff2"] },
          { weight: "100 900", style: "italic", src: ["./src/assets/fonts/Geist-VariableItalic.woff2"] },
        ],
      },
    },
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
