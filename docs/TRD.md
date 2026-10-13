# TRD — Portfolio

> Technical Requirements Document · v1.1 · 2026-10-12 (révisé : Astro statique, contenu en fichiers Git)
> Docs liés : [PRD](PRD.md) · [APP_FLOW](APP_FLOW.md) · [BACKEND_SCHEMA](BACKEND_SCHEMA.md) · [DESIGN_BRIEF](DESIGN_BRIEF.md) · [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md)

## 1. Architecture

```
 Richard ── demande à Claude Code ──▶ fichiers de contenu (YAML + MDX + images)
                                              │ git push
                                              ▼
 ┌──────────────────────────── Dépôt GitHub « portfolio » ────────────────────────────┐
 │ src/content/…  contenu          src/data/github.json   instantané GitHub (bot)       │
 │ src/assets/captures/…  captures (bot)   src/data/previews.json  iframe ok ? (bot)     │
 │                                                                                       │
 │ GitHub Actions : ci.yml (PR) · sync-github.yml (quotidien) · captures.yml (hebdo)     │
 │   les jobs planifiés écrivent les instantanés et committent seulement si changement   │
 └───────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ chaque push sur main → build Vercel
                                         ▼
 ┌──────────────────────────── Vercel (Hobby) ────────────────────────────────────────┐
 │ Astro build : HTML statique (toutes les pages, FR/EN), images optimisées, OG images │
 │ + 1 fonction serveur : action « contact » (Turnstile → Resend)                       │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

**Principes**
- **Le build ne dépend d'aucune API externe** : il lit uniquement des fichiers du dépôt. Les données externes (GitHub, captures) sont récupérées par des jobs planifiés qui committent des instantanés. Le site se reconstruit à l'identique, même si GitHub ou un site tiers est en panne.
- **Une seule fonction serveur** (contact). Tout le reste est du HTML statique servi par le CDN.
- **JavaScript minimal** : îlots ciblés (champ génératif, filtres, formulaire, thème). Aucun framework UI côté client.

## 2. Stack et versions (relevées sur npm le 2026-10-12)

| Domaine | Choix | Version | Rôle |
|---|---|---|---|
| Runtime | Node.js LTS « Krypton » | 24.x | Build et outils |
| Paquets | pnpm (via corepack) | 10.x | Installation, lockfile strict |
| Langage | TypeScript strict | 7.0 | Typage ; `astro check` en CI |
| Framework | **Astro** (sortie statique + routes à la demande) | 7.3 | Pages, content layer, i18n, View Transitions, actions |
| Adaptateur | `@astrojs/vercel` | 11.0 | Déploiement + fonction de contact |
| Contenu | Content layer Astro (`glob`, `file`) + Zod intégré | — | Collections typées et validées |
| MDX | `@astrojs/mdx` | 8.0 | Textes riches des projets |
| Styles | Tailwind CSS via `@tailwindcss/vite` | 4.3 | Utilitaires, tokens dans `@theme` |
| Mouvement UI | CSS, WAAPI, View Transitions natives (`<ClientRouter />`) ; `motion` (mini `animate`) seulement si nécessaire | 14.1 | Micro-interactions sans framework |
| Champ génératif | WebGL2 maison (repli Canvas 2D) | — | ≤ 15 Ko gzip, voir [DESIGN_BRIEF §5](DESIGN_BRIEF.md#5-le-moteur-génératif--champ-) |
| Icônes | `astro-icon` + `@iconify-json/ph` (Phosphor) | 1.2 | SVG en ligne au build, zéro JS |
| Polices | Geist + Geist Mono (OFL, via fontsource), auto-hébergées | — | API Fonts d'Astro, préchargement de Geist |
| Images OG | `satori` + `@resvg/resvg-js` (endpoint prérendu) | 0.51 / 2.6 | Image de partage par page/projet |
| SEO | `@astrojs/sitemap` | 3.7 | Sitemap multilingue |
| Email | Resend | 6.x | Envoi du message de contact |
| Anti-spam | Cloudflare Turnstile | — | Vérifié côté serveur |
| Analytics | `@vercel/analytics` (composant Astro) | 2.0 | Audience sans cookie |
| Captures | Playwright (dans GitHub Actions) | 1.64 | Captures hebdomadaires des sites |
| Tests | Vitest, Playwright + axe-core, Lighthouse CI | 5.0 / 1.64 / 0.15 | Unitaires, E2E, a11y, perf |
| Qualité | ESLint (+ plugin Astro), Prettier (+ plugin Astro) | — | Lint et format |

## 3. Rendu, données et fraîcheur

| Donnée | Source | Mise à jour | Lue par |
|---|---|---|---|
| Profil, projets, compétences, parcours | Fichiers `src/content/` | Push de Richard | Build |
| Stats GitHub (étoiles, langages, dernier commit) | `src/data/github.json` | Job quotidien `sync-github` (API GitHub GraphQL, jeton `GITHUB_TOKEN` d'Actions) | Build |
| Captures des sites | `src/assets/captures/<slug>.webp` | Job hebdomadaire `captures` (Playwright, 1440×900, attente du réseau) | Build (`astro:assets`, optimisées) |
| Autorisation iframe | `src/data/previews.json` | Même job : lecture de `X-Frame-Options` et CSP `frame-ancestors` | Build |
| Message de contact | Formulaire | À la demande | Fonction Vercel → Resend |

- Les jobs planifiés committent **uniquement si le contenu change** (comparaison d'empreinte ; captures : seuil de différence de pixels) → un push → un build Vercel. Le bot signe ses commits `chore(data): …`.
- Une capture ou une donnée manuelle dans le dossier du projet **prime** sur l'automatique (`cover` défini, `preview.mode` forcé).
- Pages : 100 % prérendues. Seule la route de l'action de contact est à la demande (`prerender = false`).

## 4. Internationalisation

- Routage i18n natif d'Astro : `defaultLocale: "fr"`, `locales: ["fr", "en"]`, préfixe pour les deux langues ; `/` redirige selon `Accept-Language` (middleware Vercel léger ou redirection statique vers `/fr` + lien vers `/en`).
- Textes d'interface : `src/i18n/fr.ts`, `src/i18n/en.ts` (objets typés, clés identiques vérifiées par le type).
- Contenu : champs courts localisés `{ fr, en }` dans le YAML ; corps des projets en `fr.mdx` / `en.mdx`. Si l'EN manque, le build affiche un avertissement et la page EN utilise le FR avec `lang="fr"`.
- Slugs de pages traduits (`/fr/projets`, `/en/projects`) ; `hreflang` + `alternate` générés.

## 5. Sécurité

- **Surface serveur unique** : l'action de contact. Validation Zod (longueurs max, email), champ piège, vérification Turnstile côté serveur **avant** tout envoi, réponse générique en cas d'échec.
- **Limitation** : Turnstile + plafond Resend (100/jour) ; règle de limitation du pare-feu Vercel si le spam apparaît.
- **Pas de stockage** de messages ni de données personnelles côté site.
- **En-têtes** (`vercel.json`) : CSP statique (`script-src 'self'` + domaines Turnstile et Vercel Analytics ; `frame-src https:` pour les aperçus), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Iframes d'aperçu** : chargées à la demande, `sandbox="allow-scripts allow-same-origin allow-popups"`, `referrerpolicy="no-referrer"`, `loading="lazy"`.
- **Secrets** uniquement dans Vercel et GitHub Actions ; jamais dans le dépôt. Dependabot + `pnpm audit` en CI.

## 6. Qualité et tests

| Niveau | Outil | Ce qu'on teste |
|---|---|---|
| Contenu | Schémas Zod + `astro check` | Tout fichier invalide casse le build avec un message clair |
| Unitaire | Vitest | Maths du champ (matrices, bruit, graine déterministe), générateur de sceaux, script `sync-github` (API simulée, repli si erreur), détection iframe, action de contact (Turnstile simulé), script `projet:nouveau` |
| E2E | Playwright | Accueil → projets → filtre → fiche → aperçu à la demande ; contact (Turnstile en mode test) ; bascule de langue et de thème ; brouillons absents |
| Accessibilité | axe-core dans Playwright + revue clavier | 0 violation sérieuse |
| Performance | Lighthouse CI sur l'aperçu Vercel | Seuils du [PRD §3](PRD.md#3-objectifs-et-indicateurs-de-succès) ; budget JS du champ ≤ 15 Ko |
| Design | Skills `review-animations`, `break-ui`, `impeccable` (audit) | Revue à la fin de chaque étape UI |

Revue de code (`/code-review`) avant chaque fusion ; `PROGRESS.md` mis à jour à chaque étape.

## 7. CI/CD

- **Dépôt** GitHub `portfolio`, branche `main` protégée, travail en branches + PR.
- **`ci.yml`** (PR) : `astro check` → lint → Vitest → build → Playwright + axe sur l'aperçu Vercel → Lighthouse CI.
- **`sync-github.yml`** (cron quotidien 04:00 UTC + manuel) : `pnpm sync:github` → commit si changement.
- **`captures.yml`** (cron lundi 05:00 UTC + manuel) : `pnpm captures` → commit si changement.
- **Vercel** : intégration Git ; aperçu par PR, production sur `main`.

## 8. Risques

| Risque | Impact | Parade |
|---|---|---|
| **Vercel Hobby = usage non commercial.** | Suspension si le site devient commercial | Le site reste un portfolio personnel : pas d'offre de prestations, pas de vente. Si cela change : Vercel Pro ou bascule vers Cloudflare/Netlify (changement d'adaptateur Astro, ~1 h). |
| Sites qui bloquent les captures (bannière cookies, anti-bot) | Capture laide ou absente | Capture manuelle déposée dans le dossier du projet (prioritaire) ; options Playwright (masquer les bannières connues). |
| Sites qui interdisent l'iframe | Pas d'aperçu live | Détection automatique → capture + « Ouvrir le site ». |
| Commits du bot trop fréquents | Historique bruité | Commit seulement si changement significatif ; préfixe `chore(data)` filtrable. |
| Montées de version majeures d'Astro (≈ 1 par an) | Migration | Peu de dépendances, aucune intégration exotique ; suivre le guide de migration ; Renovate groupé mensuel. |
| Resend sans domaine vérifié | Envoi limité à sa propre adresse | Suffisant (notification à Richard). |

## 9. Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `SITE_URL` | Vercel | URL publique (canonical, OG, sitemap) |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` | Vercel | Envoi du message de contact |
| `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Vercel | Anti-spam (clé publique côté client, secrète côté fonction) |
| `GITHUB_TOKEN` | GitHub Actions (fourni automatiquement) | Sync GitHub, commits du bot |
| `GITHUB_LOGIN` | Dépôt (`src/content/profile.yaml`) | Compte à synchroniser (non secret) |

## 10. Prérequis sur la machine

- **Node.js n'est pas installé.** Installer Node 24 LTS via `fnm`, puis `corepack enable` (pnpm).
- Comptes gratuits à créer **par Richard** : Vercel, Resend, Cloudflare (Turnstile). GitHub existe déjà (`gh` configuré).

## 11. Liste des outils gratuits

### 11.1 Services (V1)

| Outil | Usage | Offre gratuite (oct. 2026) |
|---|---|---|
| **Vercel** (Hobby) | Hébergement statique, CDN, aperçus par PR, 1 fonction | Gratuit, usage non commercial |
| **GitHub** | Dépôt, Actions (CI + jobs planifiés), API, Dependabot | Actions gratuites sur dépôt public ; 2 000 min/mois en privé |
| **Resend** | Email du formulaire | 3 000 emails/mois, 100/jour |
| **Cloudflare Turnstile** | Anti-spam sans CAPTCHA visible | Gratuit |
| **Vercel Web Analytics / Speed Insights** | Audience sans cookie, Web Vitals | Quota Hobby inclus |
| **Google Search Console / Bing Webmaster Tools** | Indexation | Gratuit |

### 11.2 Outils de développement

Node.js · pnpm · TypeScript · Astro (+ `@astrojs/vercel`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/check`) · Tailwind CSS · astro-icon + Phosphor · satori + resvg · Playwright · Vitest · axe-core · Lighthouse CI · ESLint · Prettier · Renovate ou Dependabot.

### 11.3 Design

- **Skills Claude Code** : `taste-skill`, `minimalist-skill`, `emil-design-eng`, `impeccable`, `animate`, `review-animations`, `break-ui`, `design:*`.
- **Figma** (gratuit) si maquettes ; **OKLCH picker**, **WebAIM Contrast Checker**.

### 11.4 Surveillance (optionnel)

**Sentry** (Developer, gratuit) pour la fonction de contact · **UptimeRobot** ou **Better Stack** (gratuit) pour la disponibilité.

### 11.5 Outillage Claude Code (cache et contexte)

- **Natif** : cache de conversation, `CLAUDE.md` avec carte des docs, `docs/REPRISE.md`, mémoire persistante.
- **Serena MCP** : lecture du code par symboles, à activer quand le code existe.
- **claude-mem** : mémoire de sessions compressée (optionnel ; enregistre tout).
- **Context7 MCP** : documentation à jour d'Astro, Tailwind, etc.

### 11.6 Alternatives et évolutions

| Besoin | Option |
|---|---|
| Hébergement commercial gratuit | Cloudflare (adaptateur `@astrojs/cloudflare`), Netlify |
| Éditer sans Claude Code | Keystatic (admin qui écrit dans Git, sans base) |
| Base de données | Convex ou Neon, seulement si une fonction l'exige |
| Analytics | Umami Cloud, Cloudflare Web Analytics |
| Captures sans Playwright | Microlink (50/jour sans clé) |
