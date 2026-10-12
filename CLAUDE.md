# Portfolio : consignes Claude

Site profil + projets de Richard. Next.js 16 + Convex + Vercel. Phase actuelle : voir `docs/REPRISE.md`.

## Démarrage de session (économie de contexte)

1. Lire **uniquement** `docs/REPRISE.md` (état, prochaine action).
2. Ouvrir ensuite le seul document utile à la tâche (carte ci-dessous). Ne pas relire tous les docs.

## Carte des documents

| Tâche | Lire |
|---|---|
| Comprendre le besoin, une fonctionnalité, le périmètre | `docs/PRD.md` (§5 périmètre, §10 critères) |
| Stack, versions, cache, sécurité, env, outils | `docs/TRD.md` |
| Routes, parcours, états d'interface | `docs/APP_FLOW.md` |
| Tables, fonctions Convex, crons, export | `docs/BACKEND_SCHEMA.md` |
| Couleurs, typo, mouvement, champ génératif, composants | `docs/DESIGN_BRIEF.md` |
| Ordre des étapes, tâche en cours | `docs/IMPLEMENTATION_PLAN.md` + fin de `PROGRESS.md` |

## Règles

- Plan validé avant de coder ; revue de code (`/code-review`) avant de clore une étape ; récap court dans `PROGRESS.md` ; mettre à jour `docs/REPRISE.md` en fin de session.
- UI : skills `taste-skill`, `emil-design-eng`, `impeccable` ; revues `review-animations` et `break-ui` sur chaque composant animé ou à données variables.
- Ne jamais lancer le CLI `impeccable` (télécharge un binaire) sans accord explicite.
- Zéro tiret cadratin dans les textes d'interface ; un libellé par intention (DESIGN_BRIEF §7).
- Secrets uniquement en variables d'environnement Vercel/Convex, jamais dans le dépôt.
- Réponses brèves et directes.
