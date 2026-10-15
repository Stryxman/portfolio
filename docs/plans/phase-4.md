# Phase 4 : pages (version sobre)

> Validé par Richard le 2026-10-15 : « quelque chose de concret très rapidement, avec peu de ressources ; on ajustera avec l'arrivée des projets ». Remplace un premier plan détaillé (filtres, iframe live, stats GitHub, mosaïque) jugé démesuré pour 2 projets. Branche `phase-4`, exécution native, `/code-review` en fin de phase.

**Livrable :** de vraies pages à la place de la coquille, en FR et EN :
- **Accueil :** hero sur le champ statique (nom et rôle, titre, accroche, « Voir les projets » et « Me contacter »), projets mis en avant, profil court.
- **Projets :** grille simple (2 colonnes sur ordinateur), triée par `order`.
- **Fiche projet :** cartel (titre, période, sceau, fabrication, stack, rôle, statut, « Ouvrir le site », « Voir le code »), image (cover, capture ou sceau en repli), description, projet précédent et suivant.
- **À propos :** bio, compétences par catégorie, parcours et CV s'ils existent, section Contact (liens directs). La page Contact séparée disparaît.
- **Mentions légales** et **404**.

## Reporté (à rouvrir quand le contenu le justifiera)

Filtres de la grille, aperçu live en iframe, stats GitHub et captures automatiques (Phase 6), section Fabrications, mosaïque asymétrique, apparitions au défilement, planche de dev des projets, formulaire de contact (Phase 7). Le champ animé WebGL (Phase 5) reste optionnel.

## Décisions

- **Sceau en repli :** un projet publié sans image affiche son sceau ; la règle devient un avertissement.
- **`compagnon` :** dépôt privé, donc pas de `repo` (ni « Voir le code »).
- **Titre du hero :** champ `headline` du profil (6 mots maximum) : « Je fabrique des sites. » / « I build websites. » Accroche : « Rapides et soignés, codés à la main, avec Claude Code ou sur un CMS. »
- **Mise en avant :** `compagnon` (order 1) et `portfolio` (order 2) en `featured`. Tri partout : `order`, puis slug.
- **Contact :** section `#contact` de la page À propos ; « Me contacter » y mène ; la navigation devient Projets · À propos.
- **Brouillons :** visibles en dev et sur les aperçus Vercel, absents en production.
- **Hygiène :** `.astro/` sort du suivi Git ; nav dédupliquée (`src/i18n/nav.ts`) ; `getProfile()` remplace `getEntry(…)!`.

## Tâches

### 4.1 Contenu
- `rules.ts` : image manquante → avertissement ; `checkProfile` vérifie `headline` (≤ 6 mots, pas de tiret cadratin).
- `schemas.ts` : `headline: localized` ; `select.ts` : départage par `id` ; fixtures et `profile.yaml` mis à jour ; `compagnon` et `portfolio` publiés.
- Tests : `content-rules`, `content-select`. `pnpm check:content` → 0 erreur, 2 avertissements.

### 4.2 Socle
- `src/lib/projects/model.ts` : `toCard`, `formatPeriod`, `projectStatus`, `neighbours`, `domainOf` (purs, testés).
- `src/lib/content/queries.ts` : `getProfile`, `getProjectEntries`, `cardOf`, `getProjectCards`, `getSkills`, `getProjectBody` (repli FR).
- `src/i18n/nav.ts` (`navLinks`, `ariaCurrent`) ; composants `Button`, `Tag`, `SocialLinks` (pied de page), `ProjectImage`, `ProjectCard` ; `Seal` à taille libre ; `ui.ts` : `fmt`, nouvelles clés.
- Tests : `projects-model`, `nav`, `i18n`.

### 4.3 Pages
- Vues `HomeView`, `ProjectsView`, `ProjectView` (+ routes `[slug]`), `AboutView` ; suppression de `ShellView` et des pages Contact ; route `contact` retirée.
- Styles de prose (65ch) pour les descriptions.

### 4.4 Mentions légales, 404, tests et clôture
- Collection `legal` (`fr.mdx`, `en.mdx`) et `LegalView` ; 404 avec sceau et liens de retour.
- E2E `tests/e2e/pages.spec.ts` : hero et liens, grille complète, fiche (liens, sceau en repli, voisin), projet sans lien, 404 sur slug inconnu, À propos (compétences, contact), mentions légales, aucun défilement horizontal ; liste axe mise à jour.
- `/code-review`, captures desktop et mobile dans les deux thèmes, PR, fusion après accord, vérification en production, `PROGRESS.md` et `docs/REPRISE.md`.
