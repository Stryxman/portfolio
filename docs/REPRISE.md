# Reprise

> Fichier court : où on en est et quoi faire ensuite. Mis à jour à chaque fin de session.

## État (2026-10-13)

- Cadrage terminé et révisé après le conseil LLM : PRD, TRD, APP_FLOW, BACKEND_SCHEMA, DESIGN_BRIEF (v1.1) dans `docs/`.
- Rapport du conseil : `docs/council/`.
- Phase 0 faite (Node 24 via fnm). Phase 1 codée et relue : PR https://github.com/Stryxman/portfolio/pull/1 (branche `phase-1`).
- Note : dans le shell de Claude, préfixer par `export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"`.

## Décisions clés

- **Astro 7 statique** + contenu en fichiers Git (YAML + MDX, schémas Zod), édité via Claude Code. Pas d'admin, pas de base, pas d'auth.
- Données externes par jobs GitHub Actions qui committent des instantanés (GitHub quotidien, captures hebdo) ; le build ne dépend d'aucune API.
- Une seule fonction serveur : contact (Turnstile + Resend). Hébergement Vercel Hobby (site personnel non commercial).
- Direction visuelle « Ordre et transformation » : sombre = grille transformée par matrices, clair = traceur (Vera Molnár). Accent outremer, Geist + Geist Mono, Phosphor. Champ WebGL2 ≤ 15 Ko, accueil seulement.
- V2 conditionnelle : Keystatic si édition hors Claude Code fréquente ; base seulement si une fonction l'exige.

## Prochaines actions

1. Richard : réautoriser le connecteur Vercel (ou importer le dépôt dans le tableau de bord), puis ajouter `SITE_URL`.
2. Vérifier l'aperçu : redirection `/` selon la langue et en-têtes de `vercel.json` (curl), `BASE_URL=<aperçu> pnpm e2e`.
3. Fusionner la PR #1 après accord de Richard.
4. Phase 2 : écrire `docs/plans/phase-2.md` (contenu et schémas), le faire valider, exécuter.

Reportés (mineurs) : liste des liens de navigation dupliquée Header/MobileMenu ; canonical/hreflang de la 404 (Phase 8).

## Décisions ouvertes

DESIGN_BRIEF §12 (accent, monogramme, portrait ; police tranchée : Geist).
