# TRD — Portfolio

> Technical Requirements Document · v1.0 · 2026-10-12
> Docs liés : [PRD](PRD.md) · [APP_FLOW](APP_FLOW.md) · [BACKEND_SCHEMA](BACKEND_SCHEMA.md) · [DESIGN_BRIEF](DESIGN_BRIEF.md) · [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md)

## 1. Architecture

```
                 ┌──────────────────────── Vercel (Hobby) ─────────────────────────┐
 Visiteur ──────▶│ Next.js 16 (App Router)                                         │
                 │  ├─ /[locale]/…  pages publiques — Server Components + 'use cache'│
                 │  ├─ /admin/…     admin — Client Components (temps réel Convex)    │
                 │  └─ /api/revalidate  route protégée par secret → revalidateTag    │
                 └───────────────┬─────────────────────────────────▲───────────────┘
                     fetchQuery / useQuery (WebSocket)              │ webhook après publication
                 ┌───────────────▼─────────────────────────────────┴───────────────┐
                 │ Convex Cloud (Free)                                              │
                 │  queries · mutations · actions · crons · stockage fichiers       │
                 │  Better Auth (composant @convex-dev/better-auth, OAuth GitHub)    │
                 └──────┬───────────────┬──────────────────┬───────────────────────┘
                        ▼               ▼                  ▼
                  API GitHub       Microlink API        Resend (email)
                 (GraphQL, PAT)    (captures d'écran)   + Cloudflare Turnstile (anti-spam)
```

**Principes**
- Une seule application Next.js ; le dossier `convex/` contient tout le back-end (schéma, fonctions, crons). Pas de serveur à maintenir.
- Les visiteurs ne déclenchent **jamais** d'appel GitHub ou Microlink : ils lisent des données déjà en cache dans Convex, elles-mêmes mises en cache par Next.js.
- Toute écriture passe par une mutation Convex qui **vérifie l'identité** de l'admin côté serveur.

## 2. Stack et versions (relevées sur npm le 2026-10-12)

| Domaine | Choix | Version | Rôle |
|---|---|---|---|
| Runtime | Node.js LTS « Krypton » | 24.x | Exécution locale et build |
| Gestionnaire de paquets | pnpm | 10.x | Installation rapide, lockfile strict |
| Langage | TypeScript (strict) | 7.0 | Typage de bout en bout (Convex génère les types) |
| Framework | Next.js (App Router, Cache Components) | 16.4 | Rendu serveur, routing, cache, SEO |
| UI | React | 19.3 | Composants |
| Back-end | Convex | 1.46 | Base temps réel, fonctions, crons, fichiers |
| Auth | Better Auth + `@convex-dev/better-auth` | 1.7 / 0.12 | OAuth GitHub, sessions stockées dans Convex |
| Styles | Tailwind CSS | 4.3 | Utilitaires CSS, design tokens via `@theme` |
| Composants admin | shadcn/ui | CLI 4.21 | Composants accessibles (Radix) copiés dans le dépôt |
| Animations | Motion (`motion/react`) | 14.1 | Micro-interactions, layout animations ; View Transitions natives pour les pages |
| Champ génératif | WebGL2 maison (repli Canvas 2D), sans librairie | — | Moteur « Champ » ≤ 15 Ko gzip, chargé après l'affichage (voir [DESIGN_BRIEF §5](DESIGN_BRIEF.md#5-le-moteur-génératif--champ-)) |
| Thèmes | next-themes | dernière | Clair/sombre, système par défaut, sans flash au chargement |
| Polices | Switzer (Fontshare, `next/font/local`) + Geist Mono (paquet `geist`) | — | Auto-hébergées, `font-display: swap` |
| Icônes | Phosphor (`@phosphor-icons/react`) | dernière | Famille unique |
| i18n | next-intl | 4.14 | Routage `/fr` `/en`, messages, formats |
| Validation | Zod | 4.6 | Schémas des formulaires (contact, admin) |
| Formulaires | React Hook Form | dernière | Formulaires admin |
| Notifications UI | Sonner | dernière | Toasts dans l'admin |
| Email | Resend + React Email | 6.32 / 1.0 | Envoi de la notification de contact |
| Anti-spam | Cloudflare Turnstile (`@marsidev/react-turnstile`) | 1.6 | Défi invisible sur le formulaire |
| Limitation | `@convex-dev/rate-limiter` | 0.4 | Limite d'envoi par IP/empreinte |
| Analytics | `@vercel/analytics` + Speed Insights | 2.0 | Audience sans cookie, Core Web Vitals |
| Tests unitaires | Vitest + `convex-test` + Testing Library | 5.0 / 0.0.61 | Fonctions Convex et composants |
| Tests E2E | Playwright | 1.64 | Parcours visiteur et admin |
| Qualité | ESLint, Prettier, Lighthouse CI (`@lhci/cli`), axe-core | — | Lint, format, budgets perf/a11y |

> **Pourquoi Better Auth et pas Convex Auth** : Convex Auth est resté en 0.0.x et Convex oriente désormais vers le composant Better Auth, qu'il maintient. Même résultat pour nous (connexion GitHub mono-compte), sur une base plus pérenne.

## 3. Rendu et stratégie de cache

| Zone | Rendu | Cache | Invalidation |
|---|---|---|---|
| Pages publiques | Server Components, données via `fetchQuery` (`convex/nextjs`) | `'use cache'` + `cacheTag('projects' \| 'profile' \| …)` + `cacheLife('hours')` | Après chaque publication, une action Convex appelle `POST /api/revalidate` (secret partagé) → `revalidateTag(tag)` |
| Fiche projet | Idem, `generateStaticParams` pour les projets publiés | Tag `project:<slug>` | Idem |
| Admin | Client Components, `useQuery` / `useMutation` | Aucun (temps réel WebSocket) | — |
| Images | `next/image` sur les URLs du stockage Convex | CDN Vercel | Nouvelle URL à chaque upload |
| Images OG | `next/og` (`opengraph-image.tsx`) | Mise en cache par route | Tag du projet |

Résultat attendu : un projet publié depuis l'admin est visible publiquement en quelques secondes, sans redéploiement.

## 4. Internationalisation

- next-intl, préfixe obligatoire `/fr` et `/en` ; `/` redirige selon `Accept-Language` (défaut `fr`).
- Textes d'interface : `messages/fr.json`, `messages/en.json`.
- Contenu dynamique : chaque champ traduisible est stocké en `{ fr: string, en: string }` (voir [BACKEND_SCHEMA](BACKEND_SCHEMA.md)). Si la traduction EN manque, on affiche le FR avec un attribut `lang="fr"`.
- `hreflang` et `alternates` générés dans les métadonnées.

## 5. Sécurité

- **Auth** : OAuth GitHub via Better Auth. Une liste blanche (`ADMIN_GITHUB_IDS`, identifiant numérique GitHub) est vérifiée **à la connexion et dans chaque fonction admin** (helper `requireAdmin(ctx)`).
- **Fonctions Convex** : les fonctions publiques ne renvoient que des documents `status = "published"` ; les fonctions admin sont distinctes et toutes gardées. Validation des arguments par validateurs Convex (`v.*`).
- **Secrets** (jamais dans le dépôt) : variables d'environnement Vercel et Convex (voir §9).
- **Contact** : Turnstile vérifié côté serveur (action Convex), champ piège, rate limit (ex. 3 messages / 10 min par empreinte), longueur max des champs, échappement à l'affichage.
- **Iframes d'aperçu** : `sandbox="allow-scripts allow-same-origin"`, `loading="lazy"`, `referrerpolicy="no-referrer"`.
- **En-têtes** : CSP **statique** sur les pages publiques (`script-src 'self'` + domaines Turnstile et Vercel Analytics, `frame-src` limité aux domaines des projets via `https:`), car une CSP à nonce force le rendu dynamique et annulerait le cache ; CSP à nonce réservée à `/admin` (déjà dynamique). Plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` via `next.config`.
- **Dépendances** : Dependabot + `pnpm audit` en CI.

## 6. Qualité et tests

| Niveau | Outil | Ce qu'on teste |
|---|---|---|
| Unitaire back-end | Vitest + `convex-test` | Gardes d'accès admin, filtres publics, sync GitHub (API mockée), détection iframe, rate limit contact |
| Unitaire front | Vitest + Testing Library | Filtres de projets, sélecteur de langue, formulaire de contact |
| E2E | Playwright | Visiteur : accueil → projets → filtre → fiche → contact. Admin : connexion simulée → créer → publier → visible côté public |
| Accessibilité | axe-core (Playwright) + revue manuelle clavier | 0 violation sérieuse |
| Performance | Lighthouse CI sur les aperçus Vercel | Seuils du [PRD](PRD.md#3-objectifs-et-indicateurs-de-succès) |
| Design | Skills `review-animations`, `break-ui`, `impeccable` (audit) | Revue à la fin de chaque étape UI |
| Champ génératif | Vitest (maths pures : matrices, bruit, graine) + Playwright (canvas présent, pause hors écran, SVG en mouvement réduit) + budget de taille du bundle en CI | Déterminisme et budget ≤ 15 Ko |

Revue de code (`/code-review`) avant chaque fusion ; `PROGRESS.md` mis à jour à chaque étape.

## 7. CI/CD et environnements

- **Dépôt** GitHub `portfolio` (branche `main` protégée, travail en branches + PR).
- **GitHub Actions** : `lint` → `typecheck` → `test` (Vitest) → `e2e` (Playwright sur l'aperçu Vercel) → `lighthouse`.
- **Vercel** : un aperçu par PR, production sur `main`. `npx convex deploy` exécuté dans la commande de build Vercel (déploiement Convex prod synchronisé).
- **Convex** : un déploiement `dev` (local) et un `prod`. Les aperçus Vercel pointent vers le déploiement `dev` ou un déploiement de preview Convex.
- **Sauvegarde** : export JSON depuis l'admin + `npx convex export` planifié manuellement (mensuel) dans un dossier privé.

## 8. Risques

| Risque | Impact | Parade |
|---|---|---|
| **Vercel Hobby = usage non commercial uniquement.** Un portfolio qui sollicite des clients est en zone grise. | Suspension possible | Pas de vente ni paiement sur le site. Si l'activité freelance devient réelle : passer en Pro (20 $/mois) **ou** migrer vers Cloudflare Workers (adaptateur OpenNext) ou Netlify, dont les offres gratuites autorisent l'usage commercial. L'app n'a aucune dépendance propre à Vercel hormis Analytics (remplaçable par Umami/Cloudflare Web Analytics). |
| Composant Better Auth/Convex maintenu par peu de personnes | Mises à jour lentes | Auth isolée dans `convex/auth.ts` + `lib/auth-client.ts` ; remplaçable par Clerk (offre gratuite) sans toucher au reste. |
| Quota Microlink (50 captures/jour sans clé) | Captures manquantes | Captures uniquement à la demande ou hebdomadaires ; upload manuel possible. |
| Sites qui interdisent l'iframe | Pas d'aperçu live | Détection automatique → bascule en capture. |
| Resend sans domaine vérifié | Envoi limité à sa propre adresse | Suffisant en V1 (notification à Richard) ; vérifier un domaine plus tard. |
| Quotas Convex Free (1 M appels/mois, 0,5 Go base, 1 Go fichiers) | Blocage si dépassement | Cache Next.js devant Convex : les visites ne génèrent quasiment aucun appel. Images compressées avant upload. |

## 9. Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel | URL du déploiement Convex |
| `CONVEX_DEPLOY_KEY` | Vercel (build) | Déploiement Convex prod |
| `SITE_URL` | Vercel + Convex | URL publique (callbacks, OG, sitemap) |
| `BETTER_AUTH_SECRET` | Convex | Signature des sessions |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Convex | App OAuth GitHub (connexion admin) |
| `ADMIN_GITHUB_IDS` | Convex | Liste blanche des comptes admin |
| `GITHUB_SYNC_TOKEN` | Convex | Token « fine-grained » en lecture seule pour la sync |
| `REVALIDATE_SECRET` | Vercel + Convex | Protège `/api/revalidate` |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` | Convex | Envoi de la notification |
| `TURNSTILE_SITE_KEY` (public) / `TURNSTILE_SECRET_KEY` | Vercel / Convex | Anti-spam |
| `MICROLINK_API_KEY` (optionnel) | Convex | Quota de captures supérieur |

## 10. Prérequis sur la machine

- **Node.js n'est pas installé actuellement.** Installer Node 24 LTS via `fnm` ou `nvm`, puis activer pnpm avec `corepack enable`.
- Comptes gratuits à créer **par Richard** : Vercel, Convex, Resend, Cloudflare (Turnstile). Un compte GitHub existe déjà (`gh` est configuré).

## 11. Liste des outils gratuits

### 11.1 Hébergement et services (utilisés en V1)

| Outil | Usage | Offre gratuite (oct. 2026) |
|---|---|---|
| **Vercel** (Hobby) | Hébergement Next.js, CDN, aperçus par PR | Gratuit, usage non commercial |
| **Convex** (Free) | Base, fonctions, crons, fichiers, auth | 1 M appels/mois, 0,5 Go base, 1 Go fichiers, sans mise en pause |
| **GitHub** | Dépôt, Actions, Dependabot, API | Actions gratuites (dépôt public) ou 2 000 min/mois (privé) |
| **Resend** | Email transactionnel | 3 000 emails/mois, 100/jour |
| **Cloudflare Turnstile** | Anti-spam sans CAPTCHA visible | Gratuit |
| **Microlink** | Captures d'écran des sites | 50 requêtes/jour sans clé |
| **Vercel Web Analytics / Speed Insights** | Audience sans cookie, Web Vitals | Quota Hobby inclus |
| **Google Search Console / Bing Webmaster Tools** | Indexation, SEO | Gratuit |

### 11.2 Outils de développement

Node.js · pnpm · TypeScript · Next.js · React · Tailwind CSS · shadcn/ui · Motion · next-intl · Zod · React Hook Form · Sonner · React Email · Better Auth · ESLint · Prettier · Vitest · Testing Library · Playwright · axe-core · Lighthouse CI · Fontsource / `next/font` (polices auto-hébergées).

### 11.3 Design

- **Figma** (offre gratuite) : maquettes si besoin.
- **Skills Claude Code** : `taste-skill`, `minimalist-skill`, `emil-design-eng`, `impeccable`, `animate`, `review-animations`, `break-ui`, `design:*`.
- **Realtime Colors / OKLCH picker / Contrast checker (WebAIM)** : palette et contrastes.

### 11.4 Surveillance (optionnel V1)

- **Sentry** (Developer, gratuit) : erreurs front et back.
- **UptimeRobot** ou **Better Stack** (gratuit) : disponibilité du site.

### 11.5 Outillage Claude Code (cache et contexte)

- **Natif** : cache de conversation automatique, `CLAUDE.md` projet avec carte des docs, `docs/REPRISE.md`, mémoire persistante.
- **Serena MCP** : navigation dans le code par symboles (moins de fichiers lus en entier). À activer quand le code existe.
- **claude-mem** : mémoire de sessions compressée et réinjectée. Optionnel ; enregistre tout ce qui se passe en session.
- **Context7 MCP** : documentation à jour des librairies (Next.js 16, Convex…) injectée à la demande.

### 11.6 Alternatives de repli

| Besoin | Alternative gratuite |
|---|---|
| Hébergement commercial gratuit | Cloudflare Workers + OpenNext, Netlify |
| Auth | Clerk (offre gratuite) |
| Base Postgres | Neon (gratuit, pas de mise en pause des données), Supabase |
| Analytics | Umami Cloud, Cloudflare Web Analytics |
| Captures | Playwright dans GitHub Actions (capture puis upload vers Convex) |
