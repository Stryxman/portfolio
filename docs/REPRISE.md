# Reprise

> Fichier court : où on en est et quoi faire ensuite. Mis à jour à chaque fin de session.

## Branche en attente (2026-11-16) : `motion-fibonacci`

- **Quoi :** refonte du mouvement de l'accueil, faite par Claude en autonomie. Spirale de phyllotaxie (233 graines à l'angle d'or) à l'ouverture, qui laisse place au nom ; sphère en treillis de Fibonacci qui s'enroule puis respire comme un blob dans la section « En bref ». Clair et sombre ont chacun leur lecture (polygones pleins / trait du traceur).
- **État :** commitée en local, **non poussée**. Types, lint, 134 unitaires, 70 E2E et build verts. Pas de revue de code ni de PR.
- **Fichiers :** `src/lib/geometry/phyllo.ts`, `src/lib/geometry/sphere.ts`, `src/components/SpiralField.astro`, `src/components/BlobSphere.astro`, `src/views/HomeView.astro`, `tests/e2e/intro.ts`. `FieldStatic` (ancienne grille) reste pour la planche de dev.
- **À faire par Richard :** regarder en mouvement réel (`pnpm dev`), puis trancher les 4 décisions listées dans la note d'audit de la fiche du projet.
- **Ensuite, si validé :** `/code-review`, commit, PR, fusion après accord, vérification de la production. Mettre à jour `DESIGN_BRIEF.md` §5 (le champ n'est plus la grille).
- **Lot 2 (même soir, commité en local, non poussé) :** palette chaude (accent cuivre en clair, ambre en sombre, gris teintés vers 70°) ; sceau des fiches refait en mini spirale et placé sous le titre ; nombres de la suite sur les graines d'accent ; graines réactives à la souris ; aperçu qui sort de sa carte et y redescend (bouton « Fermer » sur la fiche) ; sphère sur la page À propos ; couvertures Ad Agent et Compagnon ; rôle et accroche du profil réécrits. `DESIGN_BRIEF.md` §3 (accent outremer) et §5 sont donc périmés.
- **Piège du serveur de dev :** après l'ajout d'un `cover` dans un `meta.yaml`, relancer `pnpm dev` (le contenu reste en cache et l'image échoue avec `LocalImageUsedWrongly`). Le build n'est pas touché.
- **Pour tester un écran animé :** `finishIntro(page)` de `tests/e2e/intro.ts` avant toute mesure de contraste ou d'opacité sur l'accueil.

## À lire en premier (mini récap, 2026-10-15)

- **Où on en est :** en production : 8 projets publiés (compagnon, Orbit Lab, Vertige, MédiMatch avec galerie, veille IA, ETL, Ad Agent) et champ animé. Branche `contenu-3` : AdPulse. Prod : https://portfolio-lac-nine-ql5m5f65wy.vercel.app
- **Champ de l'accueil :** animé en CSS seul (cycle de 12 s, calque composé par le GPU, arrêt en mouvement réduit) ; la version WebGL réactive au pointeur reste optionnelle.
- **Cap fixé par Richard :** du concret vite, avec peu de ressources ; périmètre proportionné au contenu. Pas de filtres, stats, captures auto, formulaire ni WebGL tant que le contenu ne le justifie pas.
- **Ensuite :** confirmer la provenance Claude Code (veille-ia, ETL, Ad Agent, AdPulse) et l'intitulé du cours ; partager l'artefact Orbit Lab en public ; publier AdPulse (dépôt et/ou Vercel) si Richard le veut ; CV, bio, portrait.
- **Méthode, pour chaque phase :**
  - plan **court** dans `docs/plans/phase-N.md` (tâches et tests, pas tout le code), validé par Richard ;
  - exécution native (skill `superpowers:executing-plans`, journal dans `.superpowers/sdd/phase-N/progress.md`, `task-done` du skill pour consigner chaque tâche) ;
  - `/code-review high main...phase-N`, puis correction en TDD des constats importants, et `ReportFindings` avec leur statut ;
  - revue visuelle sur captures pour les phases UI ;
  - PR, correction automatique activée (`mcp__ccd_pr__set_monitor`), fusion **après accord de Richard**, vérification de la production ;
  - mise à jour de `PROGRESS.md` et de ce fichier.
- **Outils :**
  - préfixe obligatoire pour le shell de Claude : `export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"` ;
  - CLI Vercel connectée (`--scope stryxman`) ; le MCP Vercel reste en 403 ;
  - E2E : Playwright lance `astro dev --ignore-lock`. Ne pas utiliser `pkill -f` avec un motif présent dans sa propre commande (il se tue lui-même).
- **Style des réponses :** brèves, en français, sans tiret cadratin. Demander l'accord avant tout téléchargement, push sur `main` ou action publique.

## État (2026-10-15)

- Cadrage terminé et révisé après le conseil LLM : PRD, TRD, APP_FLOW, BACKEND_SCHEMA, DESIGN_BRIEF (v1.1) dans `docs/`.
- Rapport du conseil : `docs/council/`.
- Phases 0 et 1 terminées et fusionnées (PR #1). **Production : https://portfolio-lac-nine-ql5m5f65wy.vercel.app** (redirection langue + en-têtes vérifiés, 25 E2E verts). Aperçus Vercel protégés par authentification.
- Phase 2 fusionnée (PR #2) : vérification du contenu confirmée dans les journaux Vercel, canonical de production correct.
- Phase 3 (géométrie) fusionnée (PR #3) et en production ; planche de revue en dev uniquement sur /dev/geometrie/ (404 en prod, vérifié).
- Shell de Claude : préfixer par `export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"`.
- Vercel : CLI 63 installée et connectée (`vercel ... --scope stryxman`) ; le connecteur MCP reste en 403 tant qu'il n'est pas réautorisé avec l'équipe.

## Décisions clés

- **Astro 7 statique** + contenu en fichiers Git (YAML + MDX, schémas Zod), édité via Claude Code. Pas d'admin, pas de base, pas d'auth.
- Données externes par jobs GitHub Actions qui committent des instantanés (GitHub quotidien, captures hebdo) ; le build ne dépend d'aucune API.
- Une seule fonction serveur : contact (Turnstile + Resend). Hébergement Vercel Hobby (site personnel non commercial).
- Direction visuelle « Ordre et transformation » : sombre = grille transformée par matrices, clair = traceur (Vera Molnár). Accent outremer, Geist + Geist Mono, Phosphor. Champ WebGL2 ≤ 15 Ko, accueil seulement.
- V2 conditionnelle : Keystatic si édition hors Claude Code fréquente ; base seulement si une fonction l'exige.

## Prochaines actions

1. Fusionner la PR de la Phase 4 (accord de Richard), vérifier la production.
2. Contenu réel : ajouter les projets (`pnpm projet:nouveau owner/repo`), compléter la bio, déposer `public/cv/cv-fr.pdf` et `cv-en.pdf`, éventuellement un portrait et des `cover.webp`.
3. Plus tard, seulement si le contenu le justifie : filtres de la grille, stats GitHub, captures auto, formulaire de contact, champ WebGL (rendre alors `noise2D` sans allocation).

Reportés (mineurs) : canonical/hreflang de la 404 ; blocs de code indentés échappés par cleanReadme ; regex tiret dupliquée ; slug vide dans projet:nouveau ; carrés de bord du sceau clair rognés ; transformation centrée et ouverture SVG dupliquées (seal/field) ; helper de test close recopié ; ancienne URL /fr/contact/ désormais en 404 (ajouter une redirection si un lien externe y pointe).

## Décisions ouvertes

DESIGN_BRIEF §12 (accent, monogramme, portrait ; police tranchée : Geist).
