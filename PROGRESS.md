# Progression

## 2026-10-12 : cadrage

- Brainstorming (superpowers) : public mixte, admin + sync GitHub + fichiers + animations, V1 bilingue/contact/aperçus, style minimal.
- Choix techniques : Next.js + Convex (au lieu de Keystatic/Supabase/Firebase), Better Auth (Convex Auth resté en 0.0.x).
- Skills design installés en global : emil-design-eng (+14 skills Emil), impeccable, taste-skill, minimalist-skill.
- Direction visuelle : « Ordre et transformation », deux mondes liés au thème.
- Docs rédigés : PRD, TRD, APP_FLOW, BACKEND_SCHEMA, DESIGN_BRIEF.
- Conseil LLM (mode léger, 5 conseillers) : convergence 5/5 contre l'admin + Convex en V1. Décision : Astro statique + fichiers Git + jobs d'instantanés + 1 fonction de contact, Vercel Hobby (site non commercial). Docs révisés en v1.1.

## 2026-10-13 : Phases 0 et 1 (socle)

- Phase 0 : fnm 1.39, Node 24.21, pnpm 12.11.
- Phase 1 : Astro 7.3 + TS 6.0 (TS 7 pas encore supporté par typescript-eslint), Tailwind 4, i18n FR/EN, tokens OKLCH (3 ajustés pour WCAG AA), Geist + Geist Mono, thème sans flash, en-tête, menu mobile, 404, CI.
- Tests : 28 unitaires, 25 E2E (desktop + mobile), axe sans violation sérieuse.
- Revue `/code-review` : 9 constats, 6 corrigés (police invalide, thème sans stockage, sombre sans JS, mouvement réduit, menu mobile, barre de dev), 2 mineurs reportés, 1 à vérifier au déploiement (vercel.json).
- Police : Switzer écartée (licence interdit un dépôt public) → Geist.
- Dépôt public https://github.com/Stryxman/portfolio, PR #1.
- Vercel : projet importé par Richard (MCP en 403). PR #1 fusionnée ; production https://portfolio-lac-nine-ql5m5f65wy.vercel.app : 307 selon la langue, en-têtes vercel.json appliqués, 25 E2E verts.
- Emails des commits passés au noreply GitHub (historique réécrit, push forcé).

## 2026-10-13 : Phase 2 (contenu et schémas)

- URL canonique automatique (`VERCEL_PROJECT_PRODUCTION_URL`), `SITE_URL` devient optionnel.
- Schémas Zod partagés (Astro + script), règles de contenu, vérification avant chaque build (`pnpm check:content`, aussi lancé par Vercel via `buildCommand`).
- Contenu initial : profil (sans email, dépôt public), 7 compétences, projets compagnon et portfolio en brouillon.
- `pnpm projet:nouveau owner/repo` : brouillon depuis GitHub, README rendu compilable en MDX (testé sur le vrai README d'Astro).
- Tests : 68 unitaires, 25 E2E. Revue : 9 constats, 5 corrigés, 4 mineurs reportés.

## 2026-10-15 : Phase 3 (géométrie)

- Bases mathématiques pures et déterministes : matrices 2×2, courbe ease-in-out du brief, graine FNV-1a + mulberry32, bruit lissé.
- Cycle du champ sombre (identité → rotation → cisaillement → échelle → identité) et familles de sceaux par provenance, vérifiées par leurs propriétés.
- Sceaux SVG serveur (< 4 Ko, instantané), première image du champ sur l'accueil (masque derrière le titre, cadrage mobile), planche /dev/geometrie/ en dev uniquement.
- Revue visuelle sur captures (desktop + mobile, deux thèmes) : flèches î ĵ, trait du traceur allégé, désordre des sceaux lisible.
- Tests : 101 unitaires, 33 E2E. Revue : 8 constats, 3 corrigés, 1 reporté en Phase 5 (coût du bruit), 4 mineurs.
