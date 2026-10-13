# Reprise

> Fichier court : où on en est et quoi faire ensuite. Mis à jour à chaque fin de session.

## État (2026-10-12)

- Cadrage terminé et révisé après le conseil LLM : PRD, TRD, APP_FLOW, BACKEND_SCHEMA, DESIGN_BRIEF (v1.1) dans `docs/`.
- Rapport du conseil : `docs/council/`.
- Aucun code. Node.js **pas encore installé** (TRD §10).

## Décisions clés

- **Astro 7 statique** + contenu en fichiers Git (YAML + MDX, schémas Zod), édité via Claude Code. Pas d'admin, pas de base, pas d'auth.
- Données externes par jobs GitHub Actions qui committent des instantanés (GitHub quotidien, captures hebdo) ; le build ne dépend d'aucune API.
- Une seule fonction serveur : contact (Turnstile + Resend). Hébergement Vercel Hobby (site personnel non commercial).
- Direction visuelle « Ordre et transformation » : sombre = grille transformée par matrices, clair = traceur (Vera Molnár). Accent outremer, Switzer + Geist Mono, Phosphor. Champ WebGL2 ≤ 15 Ko, accueil seulement.
- V2 conditionnelle : Keystatic si édition hors Claude Code fréquente ; base seulement si une fonction l'exige.

## Prochaines actions

- Les 6 docs sont validés (2026-10-13). Exécution native, `/code-review` en fin de phase.
1. **Phase 0** : installer Node 24 via fnm (accord de Richard requis pour le téléchargement), puis pnpm.
2. **Phase 1** : socle (tâches 1.1 à 1.6 de `docs/IMPLEMENTATION_PLAN.md`), sur la branche `phase-1`.

## Décisions ouvertes

DESIGN_BRIEF §12 (accent, police, monogramme, portrait).
