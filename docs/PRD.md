# PRD — Portfolio

> Product Requirements Document · v1.1 · 2026-10-12 (révisé après le conseil LLM : architecture statique)
> Docs liés : [TRD](TRD.md) · [APP_FLOW](APP_FLOW.md) · [BACKEND_SCHEMA](BACKEND_SCHEMA.md) · [DESIGN_BRIEF](DESIGN_BRIEF.md) · [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md)

## 1. Vision

Un site unique, rapide et soigné qui **centralise le profil de Richard et l'ensemble de ses projets**, quelle que soit leur origine : sites générés avec Claude Code, sites codés à la main, sites faits avec un CMS, outils et applications développés avec Claude Code (ex. `compagnon`). Il renvoie vers chaque projet en ligne. Le contenu vit **en fichiers dans le dépôt Git** et se met à jour en demandant à Claude Code ; les données GitHub et les captures se rafraîchissent **automatiquement**. Le site est **personnel et non commercial** : il présente et relie, il ne vend pas de prestations.

## 2. Problème

- Les projets sont dispersés (GitHub, hébergeurs différents, CMS, machine locale) : aucun endroit ne montre l'ensemble ni ne relie vers tout.
- Un portfolio qui demande du travail manuel pour rester à jour finit par ne plus refléter la réalité (stats, captures, nouveaux projets).
- Un portfolio générique « template » ne démarque pas.

## 3. Objectifs et indicateurs de succès

| Objectif | Indicateur | Cible V1 |
|---|---|---|
| Tout centraliser | Projets publics de `Local/` et GitHub référencés | 100 % |
| Publication simple | Temps pour ajouter un projet (demande à Claude Code → en ligne) | < 5 min |
| Données fraîches | Âge max des stats GitHub et des captures | ≤ 24 h (stats) · ≤ 7 jours (captures) |
| Qualité perçue | Lighthouse mobile (perf / a11y / SEO / bonnes pratiques) | ≥ 95 / ≥ 95 / ≥ 95 / ≥ 95 |
| Contact | Message du formulaire reçu par email | < 1 min |
| Coût | Coût mensuel | 0 € |
| Durabilité | Services externes indispensables à l'affichage du site | 1 (l'hébergeur) |

## 4. Publics (personas)

1. **Recruteur·euse / employeur** — 2 à 3 minutes. Veut : stack et compétences, projets phares, parcours, CV, preuve de qualité (code, GitHub).
2. **Personne qui découvre les réalisations** (partenaire, client existant, curieux) — veut voir les sites réels, juger le rendu et suivre les liens vers eux.
3. **Pair développeur** — veut explorer les projets, en particulier ceux faits avec Claude Code, et comment ils ont été construits.
4. **Richard (éditeur)** — ajoute ou modifie un projet quelques fois par mois, depuis son PC, en demandant à Claude Code ; aucune interface d'administration nécessaire.

## 5. Périmètre V1

### 5.1 Site public (bilingue FR/EN)

- **F1 — Accueil** : présentation courte (nom, rôle, accroche), projets mis en avant (3 à 6), accès à Projets et Contact.
- **F2 — Liste des projets** : grille filtrable par **provenance** (Claude Code · codé main · CMS · autre), par **technologie** et par **tag** ; tri ; l'URL reflète les filtres.
- **F3 — Fiche projet** : titre, résumé, description, rôle, stack, dates, statut, liens (site, dépôt), galerie, **aperçu live** (iframe à la demande si le site l'autorise, sinon capture), **stats GitHub** si un dépôt est lié.
- **F4 — À propos** : biographie, parcours, compétences groupées, **CV PDF** FR et EN.
- **F5 — Contact** : formulaire (nom, email, sujet, message) avec anti-spam ; email envoyé à Richard ; confirmation à l'écran.
- **F6 — Bilingue** : `/fr` et `/en`, sélecteur conservant la page courante, redirection initiale selon la langue du navigateur.
- **F7 — SEO et partage** : métadonnées par page et par langue, images Open Graph générées (sceau du projet), sitemap, robots, données structurées (Person, CreativeWork).
- **F8 — Identité en mouvement** : champ géométrique génératif sur l'accueil (grille transformée par des matrices en sombre, grille « traceur » en clair), sceau génératif par projet, thèmes clair/sombre (système par défaut + bascule), sans impact sur les cibles de performance (voir [DESIGN_BRIEF §5](DESIGN_BRIEF.md#5-le-moteur-génératif--champ-)).

### 5.2 Gestion du contenu (sans admin)

- **C1 — Contenu en fichiers** : un dossier par projet (métadonnées YAML + textes FR/EN en MDX + images), profil, compétences et parcours en YAML ; validation stricte au build (un champ manquant casse le build avec un message clair).
- **C2 — Ajout assisté** : commande `pnpm projet:nouveau <owner/repo | url>` qui crée un brouillon pré-rempli depuis le README et les métadonnées GitHub ; Claude Code complète, Richard relit, push → en ligne.
- **C3 — Brouillons** : `status: draft` exclut un projet du site publié (visible en local et sur les aperçus de branche).
- **C4 — Rafraîchissement automatique** : reconstruction quotidienne (stats GitHub), captures hebdomadaires, sans intervention.

## 6. Hors périmètre V1

Interface d'administration · base de données · comptes ou authentification · blog · paiement ou prise de rendez-vous · offre de prestations · statistiques maison · scènes 3D (Three.js) · newsletter.
**V2 conditionnelle** : une admin (Keystatic, sans base) seulement si l'édition hors Claude Code devient fréquente ; une base (Convex) seulement si une fonction l'exige (comptes, espace client).

## 7. Exigences non fonctionnelles

- **Performance** : HTML statique servi par CDN ; LCP < 2,5 s, CLS < 0,1, INP < 200 ms sur mobile 4G ; JavaScript limité aux îlots interactifs.
- **Accessibilité** : WCAG 2.2 AA, clavier complet, `prefers-reduced-motion` respecté.
- **Sécurité** : surface serveur réduite à la seule fonction de contact (Turnstile, champ piège, validation, limite de taille) ; secrets en variables d'environnement.
- **Fiabilité** : si GitHub ou la capture échoue au build, le site garde les dernières données valides (cache versionné) et le build ne casse pas.
- **Maintenabilité** : TypeScript strict, schémas de contenu typés, tests, CI, peu de dépendances.
- **Vie privée** : analytics sans cookie, pas de bannière de consentement ; mentions légales et confidentialité (RGPD) pour le formulaire ; les messages ne sont pas stockés (envoi par email uniquement).

## 8. Contraintes

- Budget **0 €/mois**.
- Hébergement **Vercel Hobby** : usage personnel non commercial, donc pas d'offre de prestations ni de vente sur le site (voir [TRD §8](TRD.md#8-risques)).
- Un seul développeur (Richard + Claude Code).

## 9. Hypothèses à valider

- Domaine : `*.vercel.app` en V1, domaine personnalisé plus tard.
- Contenu initial (bio, projets, CV, portrait) fourni par Richard à l'étape « contenu ».
- La plupart des sites CMS refusent l'iframe : la capture sera le mode d'aperçu le plus courant.

## 10. Critères d'acceptation V1

- [ ] Toutes les pages F1 à F8 existent en FR et EN et passent les seuils Lighthouse.
- [ ] Ajouter un projet avec `pnpm projet:nouveau` + Claude Code + push le met en ligne en moins de 5 min.
- [ ] Un projet en `draft` n'apparaît pas en production.
- [ ] Les stats GitHub affichées datent de moins de 24 h ; une panne GitHub ne casse pas le build.
- [ ] Un message envoyé via le formulaire arrive par email ; un envoi sans Turnstile valide est refusé (test automatisé).
- [ ] Un fichier de contenu invalide fait échouer le build avec un message explicite.
