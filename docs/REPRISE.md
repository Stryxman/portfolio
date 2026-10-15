# Reprise

> Fichier court : où on en est et quoi faire ensuite. Mis à jour à chaque fin de session.

## À lire en premier (mini récap, 2026-10-15)

- **Où on en est :** phases 0 à 3 terminées, fusionnées et en production (PR #1, #2, #3). Prod : https://portfolio-lac-nine-ql5m5f65wy.vercel.app
- **Question en attente de Richard :** pour la Phase 4, faire du **sceau l'image de repli** d'un projet sans capture (DESIGN_BRIEF §5.3), ce qui transforme l'erreur « publié sans image » de `src/lib/content/rules.ts` en avertissement, puis publier `compagnon` et `portfolio`. Ne rien coder avant sa réponse.
- **Ensuite :** écrire `docs/plans/phase-4.md` (pages), le faire valider, l'exécuter sur la branche `phase-4`.
- **Méthode, pour chaque phase :**
  - plan détaillé en TDD dans `docs/plans/phase-N.md`, validé par Richard ;
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

1. Phase 4 : écrire `docs/plans/phase-4.md` (pages : accueil, projets + filtres, fiche + aperçu, à propos, mentions, 404), le faire valider, exécuter.
2. Phase 5 : rendre `noise2D` sans allocation (hash entier) avant de l'utiliser dans la boucle d'animation.

Reportés (mineurs) : liens de navigation dupliqués Header/MobileMenu ; canonical/hreflang de la 404 (Phase 8) ; blocs de code indentés échappés par cleanReadme ; getEntry(profile) non-null en dev ; regex tiret dupliquée ; slug vide dans projet:nouveau ; carrés de bord du sceau clair rognés ; transformation centrée et ouverture SVG dupliquées (seal/field) ; helper de test close recopié.

## Décisions ouvertes

DESIGN_BRIEF §12 (accent, monogramme, portrait ; police tranchée : Geist).
