# PRD — Portfolio

> Product Requirements Document · v1.0 · 2026-10-12
> Docs liés : [TRD](TRD.md) · [APP_FLOW](APP_FLOW.md) · [BACKEND_SCHEMA](BACKEND_SCHEMA.md) · [DESIGN_BRIEF](DESIGN_BRIEF.md) · [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md)

## 1. Vision

Un site unique, dynamique et soigné qui **centralise le profil de Richard et l'ensemble de ses projets**, quelle que soit leur origine : sites générés avec Claude Code, sites codés à la main, sites faits avec un CMS, outils et applications développés avec Claude Code (ex. `compagnon`). Le contenu se gère depuis une **interface d'administration**, sans toucher au code, et les données des dépôts GitHub se mettent à jour **automatiquement**.

## 2. Problème

- Les projets sont dispersés (GitHub, hébergeurs différents, CMS, machine locale) : aucun endroit ne montre l'ensemble.
- Mettre à jour un portfolio statique demande de modifier le code et de redéployer : il finit par ne plus refléter la réalité.
- Un portfolio générique « template » ne démarque pas face aux recruteurs ou aux clients.

## 3. Objectifs et indicateurs de succès

| Objectif | Indicateur | Cible V1 |
|---|---|---|
| Tout centraliser | Projets existants référencés | 100 % des projets publics de `Local/` et GitHub |
| Mise à jour sans code | Temps pour publier un nouveau projet depuis l'admin | < 5 min |
| Données fraîches | Âge max des stats GitHub affichées | ≤ 24 h (sync quotidienne) |
| Qualité perçue | Lighthouse (perf / a11y / SEO / bonnes pratiques) | ≥ 90 / ≥ 95 / ≥ 95 / ≥ 95 |
| Contact | Message du formulaire reçu par email | < 1 min, 0 perte |
| Coût | Coût mensuel d'hébergement | 0 € (offres gratuites) |

## 4. Publics cibles (personas)

1. **Recruteur·euse / employeur** — 2 à 3 minutes sur le site. Veut : stack et compétences, projets phares, parcours, CV téléchargeable, preuve de qualité (code, GitHub).
2. **Client potentiel** — veut voir des sites réels qu'il pourrait commander (vitrine, CMS), juger le rendu et la fiabilité, puis prendre contact facilement.
3. **Visiteur curieux / pair développeur** — veut explorer les projets, en particulier ceux faits avec Claude Code, et la manière dont ils ont été construits.
4. **Richard (administrateur)** — veut ajouter, modifier, ordonner et mettre en avant ses projets en quelques clics, depuis n'importe quel appareil.

## 5. Périmètre V1

### 5.1 Site public (bilingue FR/EN)

- **F1 — Accueil** : présentation courte (nom, rôle, accroche), projets mis en avant (3 à 6), appel à l'action vers Projets et Contact.
- **F2 — Liste des projets** : grille filtrable par **type** (Claude Code · codé main · CMS · autre), par **technologie** et par **tag** ; tri (récent, mis en avant) ; l'URL reflète les filtres (partageable).
- **F3 — Fiche projet** : titre, résumé, description riche, rôle, stack, dates, statut, liens (site, dépôt), galerie d'images, **aperçu live** (iframe si autorisé, sinon capture d'écran), **stats GitHub** (étoiles, langages, dernier commit) si le projet est lié à un dépôt.
- **F4 — À propos** : biographie, parcours (expériences, formations), compétences groupées, **CV PDF** téléchargeable en FR et en EN.
- **F5 — Contact** : formulaire (nom, email, type de demande, message) avec anti-spam ; email de notification à Richard ; confirmation à l'écran.
- **F6 — Bilingue** : toutes les pages en `/fr` et `/en`, sélecteur de langue conservant la page courante, détection de la langue du navigateur à la première visite.
- **F7 — SEO et partage** : métadonnées par page et par langue, images Open Graph générées, sitemap, robots, données structurées (Person, CreativeWork).
- **F8 — Identité en mouvement** : champ géométrique génératif sur l'accueil (grille transformée par des matrices en thème sombre, grille « traceur » en thème clair), sceau génératif par projet, thèmes clair/sombre (système par défaut + bascule). Aucun impact sur les performances cibles (voir [DESIGN_BRIEF §5](DESIGN_BRIEF.md#5-le-moteur-génératif--champ-)).

### 5.2 Administration (`/admin`, accès Richard uniquement)

- **A1 — Connexion** via GitHub, limitée au seul compte autorisé.
- **A2 — Projets** : créer, modifier, archiver, supprimer ; publier ou garder en brouillon ; ordonner (glisser-déposer) ; mettre en avant ; lier un dépôt GitHub ; choisir le mode d'aperçu.
- **A3 — Profil** : bio, accroche, liens sociaux, photo, CV FR/EN.
- **A4 — Compétences et expériences** : CRUD et ordre.
- **A5 — Médias** : téléverser images et PDF.
- **A6 — Sync GitHub** : état de la dernière sync, bouton « synchroniser maintenant », import d'un dépôt en tant que nouveau projet (brouillon pré-rempli).
- **A7 — Messages** : liste des messages reçus, marquer lu ou archivé.
- **A8 — Export** : exporter tout le contenu en JSON (sauvegarde versionnée dans Git).

## 6. Hors périmètre V1 (plus tard, peut-être)

Blog/journal · commentaires ou comptes visiteurs · paiement ou prise de rendez-vous · statistiques avancées maison · scènes 3D (Three.js) · multi-administrateurs · CMS headless externe · thèmes multiples · newsletter.

## 7. Exigences non fonctionnelles

- **Performance** : LCP < 2,5 s et CLS < 0,1 sur mobile 4G ; pages publiques rendues côté serveur et mises en cache.
- **Accessibilité** : WCAG 2.2 AA, navigation complète au clavier, `prefers-reduced-motion` respecté.
- **Sécurité** : admin protégée côté serveur (chaque fonction Convex d'écriture vérifie l'identité) ; secrets uniquement en variables d'environnement ; anti-spam et limite d'envoi sur le contact.
- **Fiabilité** : en cas d'échec de la sync GitHub ou des captures, le site affiche les dernières données valides.
- **Maintenabilité** : TypeScript strict, tests automatisés, CI, dépendances à jour.
- **Vie privée** : analytics sans cookie ; pas de bannière de consentement nécessaire ; mentions légales et politique de confidentialité (RGPD) pour le formulaire.

## 8. Contraintes

- Budget : **0 €/mois** en V1 (offres gratuites).
- Hébergement : **Vercel** (voir le risque d'usage commercial dans le [TRD](TRD.md#8-risques)).
- Un seul développeur (Richard + Claude Code).

## 9. Hypothèses à valider

- Nom de domaine : sous-domaine `*.vercel.app` en V1, domaine personnalisé plus tard.
- Contenu initial (bio, projets, CV) fourni par Richard lors de l'étape « contenu » du plan.
- La plupart des sites CMS clients refusent l'iframe : la capture d'écran sera le mode le plus courant.

## 10. Critères d'acceptation V1

- [ ] Toutes les pages F1 à F7 existent en FR et EN et passent les seuils Lighthouse.
- [ ] Un projet créé dans l'admin apparaît sur le site public en moins d'une minute après publication.
- [ ] Un dépôt GitHub lié affiche des stats datant de moins de 24 h.
- [ ] Un message envoyé via le formulaire arrive par email et dans l'admin.
- [ ] Aucun accès en écriture possible sans être connecté avec le compte autorisé (test automatisé).
- [ ] Export JSON complet téléchargeable depuis l'admin.
