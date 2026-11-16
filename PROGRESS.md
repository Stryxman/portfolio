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

## 2026-10-15 : Phase 4 (pages, version sobre)

- Premier plan détaillé (filtres, iframe live, stats GitHub, mosaïque) jugé démesuré pour 2 projets : Richard a choisi une version sobre, à étoffer avec l'arrivée des projets.
- Pages réelles FR/EN : accueil (hero sur le champ, projets choisis, profil court), grille des projets, fiche (cartel, image ou sceau en repli, description, projet voisin), à propos (bio, compétences, section contact), mentions légales, 404. La page Contact séparée disparaît.
- Contenu : `headline` du profil (≤ 6 mots), image manquante = avertissement (le sceau sert de repli), `compagnon` et `portfolio` publiés ; `compagnon` sans lien de code (dépôt privé).
- Hygiène : `.astro/` hors de Git, navigation partagée avec page courante, `getProfile()` sans assertion, liens sociaux en pied de page.
- Tests : 115 unitaires, 56 E2E (6 ignorés exprès).

## 2026-11-16 : mouvement de l'accueil (branche `motion-fibonacci`, non fusionnée)

- Audit du mouvement : grille sombre en boucle, clair figé, rien au défilement. Détail dans la note d'audit de la fiche du projet.
- Spirale de phyllotaxie rendue en SVG au build : 233 polygones (3, 5, 8 côtés) en sombre, 21 bras et carrés au trait en clair. Ouverture en CSS seul, le texte du hero reste visible sans JavaScript et en mouvement réduit.
- Sphère en treillis de Fibonacci sur canvas 2D : s'enroule depuis le disque (projection de Lambert), blob par somme de sinus, renflement vers le pointeur, en pause hors écran, image SVG en repli.
- Aucune dépendance ajoutée. Accueil : 13 Ko → 34,5 Ko compressée.
- Tests : 134 unitaires, 70 E2E (6 ignorés exprès). Pas encore de revue de code.

## 2026-11-16 : lot 2 (palette chaude, nombres, curseur, transition)

- Palette chaude dans les trois blocs de couleurs, contrastes recalculés (accent 4,9:1 en clair, 10:1 en sombre).
- Sceau réécrit : 34 graines à l'angle d'or, forme selon la provenance, accent sur un bras de 5 ou de 8. Sous le titre de la fiche, il ne lui prend plus de largeur.
- Spirale : rang inscrit sur les 12 graines de la suite (contenu généré, tenu droit par une rotation inverse), graines qui s'écartent et gonflent près du pointeur.
- Carte vers fiche : l'aperçu se soulève, grandit, et redescend à la fermeture (retour d'historique, lien vers la grille en repli).
- Sphère aussi sur À propos tant qu'il n'y a pas de portrait. Couvertures : trois rendus réels pour Ad Agent, renard en polygones pour Compagnon.
- Tests : 132 unitaires, 77 E2E (7 ignorés exprès). Accueil : 34,9 Ko compressée.

## 2026-11-16 : lot 3 (ordre, bio, ouverture des fiches)

- Mesure de l'à-coup à l'ouverture d'une fiche : la page arrive en moins de 100 ms, mais l'image de la fiche arrivait 110 à 190 ms après, en pleine animation, et l'ombre portée faisait sauter des images.
- Correctif : l'image de la fiche est demandée au survol ou au focus du lien (carte, projet précédent ou suivant) et la navigation lui laisse 250 ms au plus ; ombre retirée, transition ramenée à 380 ms. Image prête dès l'ouverture dans tous les cas mesurés.
- Contenu : ordre des projets, bio en deux phrases plus directes, MédiMatch décrit comme une landing page.
- Tests : 132 unitaires, 77 E2E.

