# APP FLOW — Portfolio

> v1.0 · 2026-10-12
> Docs liés : [PRD](PRD.md) · [TRD](TRD.md) · [BACKEND_SCHEMA](BACKEND_SCHEMA.md) · [DESIGN_BRIEF](DESIGN_BRIEF.md)

## 1. Plan du site (routes)

| Route | Accès | Contenu | Données |
|---|---|---|---|
| `/` | public | Redirection vers `/fr` ou `/en` selon `Accept-Language` | — |
| `/[locale]` | public | Accueil : hero, projets mis en avant, compétences clés, CTA | `profile`, `projects` (featured) |
| `/[locale]/projets` (`/en/projects`) | public | Grille filtrable | `projects` publiés + `githubRepos` |
| `/[locale]/projets/[slug]` | public | Fiche projet | `project` + `githubRepo` lié |
| `/[locale]/a-propos` (`/en/about`) | public | Bio, parcours, compétences, CV | `profile`, `experiences`, `skills` |
| `/[locale]/contact` | public | Formulaire | — (écrit `messages`) |
| `/[locale]/mentions-legales` (`/en/legal`) | public | Mentions légales et confidentialité | statique (messages i18n) |
| `/admin/connexion` | public | Bouton « Continuer avec GitHub » | — |
| `/admin` | admin | Tableau de bord : état de la sync, derniers messages, raccourcis | `syncRuns`, `messages` |
| `/admin/projets` | admin | Liste triable (glisser-déposer), filtres statut | `projects` |
| `/admin/projets/nouveau` · `/admin/projets/[id]` | admin | Éditeur de projet (onglets FR/EN) | `projects`, `githubRepos`, fichiers |
| `/admin/profil` | admin | Profil, liens, CV FR/EN | `profile` |
| `/admin/competences` · `/admin/experiences` | admin | Listes ordonnables | `skills`, `experiences` |
| `/admin/github` | admin | Dépôts synchronisés, import en projet, « synchroniser » | `githubRepos`, `syncRuns` |
| `/admin/messages` | admin | Boîte de réception | `messages` |
| `/admin/export` | admin | Télécharger le JSON complet | toutes les tables |
| `/api/revalidate` | secret | Invalidation du cache Next.js | — |
| `/sitemap.xml` · `/robots.txt` · `opengraph-image` | public | SEO | `projects` publiés |

Les slugs d'URL publiques sont traduits via la configuration `pathnames` de next-intl.

## 2. Parcours visiteur

### 2.1 Recruteur (objectif : juger le profil en < 3 min)

```mermaid
flowchart LR
  A[Arrivée /fr] --> B[Hero : nom, rôle, accroche]
  B --> C[Projets mis en avant]
  C -->|clic carte| D[Fiche projet]
  D -->|« Voir le code »| E[(GitHub)]
  D -->|« Retour aux projets »| F[/projets/]
  B -->|menu| G[À propos]
  G --> H[Télécharger le CV PDF]
  G --> I[Contact]
```

### 2.2 Client potentiel (objectif : voir des sites réels puis écrire)

```mermaid
flowchart LR
  A[Arrivée] --> B[/projets/]
  B -->|filtre type = CMS ou Site| C[Grille filtrée, URL mise à jour]
  C --> D[Fiche projet]
  D --> E{Aperçu}
  E -->|iframe autorisée| F[Capture + « Activer l'aperçu live »]
  F -->|clic| F2[Iframe chargée à la demande]
  E -->|sinon| G[Capture + « Ouvrir le site »]
  D -->|CTA « Un projet similaire ? »| H[Contact, type de demande pré-rempli]
  H --> I[Envoi → confirmation]
```

### 2.3 Changement de langue

Sélecteur dans l'en-tête → même page dans l'autre langue (slug traduit) ; préférence mémorisée par cookie `NEXT_LOCALE`.

## 3. Parcours admin

### 3.1 Connexion

```mermaid
sequenceDiagram
  participant R as Richard
  participant N as Next.js /admin
  participant BA as Better Auth (Convex)
  participant GH as GitHub OAuth
  R->>N: ouvre /admin
  N-->>R: redirige /admin/connexion (pas de session)
  R->>BA: « Continuer avec GitHub »
  BA->>GH: OAuth
  GH-->>BA: profil (id numérique)
  BA->>BA: id ∈ ADMIN_GITHUB_IDS ?
  alt autorisé
    BA-->>N: session créée
    N-->>R: tableau de bord
  else refusé
    BA-->>R: « Accès réservé » (aucune session)
  end
```

### 3.2 Créer et publier un projet

1. `/admin/projets/nouveau` → saisie : titre FR/EN, slug (généré, modifiable), type, résumé, description (Markdown), stack, tags, dates, liens, dépôt GitHub (optionnel, autocomplétion depuis `githubRepos`).
2. Upload de la couverture et de la galerie (compression côté client avant envoi).
3. **URL du site renseignée** → action `previews.inspect` : vérifie `X-Frame-Options` et la CSP `frame-ancestors` → propose `iframe` ou `capture` ; si `capture`, lance `previews.capture` (Microlink) → image stockée.
4. Enregistrement automatique en **brouillon** (debounce 1 s, indicateur « Enregistré »).
5. « Publier » → `status = "published"`, `publishedAt` → action `revalidate.trigger(["projects", "project:<slug>"])` → visible publiquement en quelques secondes.
6. Toast de confirmation avec lien « Voir sur le site ».

### 3.3 Importer un dépôt GitHub comme projet

`/admin/github` → liste des dépôts synchronisés (ceux déjà liés sont marqués) → « Créer un projet » → brouillon pré-rempli (titre, description, langages en stack, URL homepage, lien dépôt) → éditeur de projet.

### 3.4 Messages

Nouveau message → badge dans la navigation admin (temps réel) → lecture = `read` → archivage possible. L'email de notification contient un lien direct vers le message.

## 4. Flux système

### 4.1 Sync GitHub

```mermaid
flowchart TD
  T1[Cron quotidien 04:00 UTC] --> S
  T2[Bouton admin « Synchroniser »] --> S
  S[action github.sync] --> L{Sync déjà en cours ?}
  L -->|oui| X[Ignorer]
  L -->|non| R[syncRuns: running]
  R --> Q[GraphQL GitHub : dépôts publics du compte]
  Q -->|succès| U[upsert githubRepos]
  U --> V[revalidate tags projects + project:* liés]
  V --> OK[syncRuns: success, nb dépôts]
  Q -->|erreur / rate limit| KO[syncRuns: error + message]
  KO --> K[Données précédentes conservées ; affichage de l'erreur dans l'admin]
```

### 4.2 Formulaire de contact

```mermaid
flowchart TD
  A[Envoi du formulaire] --> B{Validation Zod client}
  B -->|invalide| B1[Erreurs inline]
  B -->|ok| C[action contact.submit]
  C --> D{Turnstile valide ? champ piège vide ?}
  D -->|non| D1[Refus générique « réessayez »]
  D -->|oui| E{Rate limit OK ?}
  E -->|non| E1[« Trop d'envois, réessayez dans 10 min »]
  E -->|oui| F[Insert messages]
  F --> G[Resend : email à Richard]
  G -->|échec| G1[messages.emailStatus = failed ; visible dans l'admin]
  F --> H[Écran de confirmation]
```

Le message est **toujours enregistré avant** l'envoi de l'email : aucune perte même si Resend échoue.

### 4.3 Captures d'écran

À la création, quand l'URL change, sur demande (bouton « Recapturer »), et par cron hebdomadaire pour les projets en mode `capture`. En cas d'échec : la capture précédente est conservée, l'erreur est affichée dans l'éditeur.

## 5. États d'interface à prévoir

| Écran | Chargement | Vide | Erreur |
|---|---|---|---|
| Grille projets | Squelettes de cartes (aucun saut de mise en page) | « Aucun projet pour ces filtres » + bouton « Réinitialiser » | Page d'erreur de route avec « Réessayer » |
| Fiche projet | Rendu serveur (pas de chargement) | — | 404 dédiée si slug inconnu ou non publié |
| Aperçu iframe | Capture affichée en fond pendant le chargement | — | Bascule sur la capture si l'iframe ne charge pas en 8 s |
| Stats GitHub | — | Bloc masqué si pas de dépôt lié | « Données du JJ/MM » si la dernière sync a échoué |
| Contact | Bouton en état d'envoi, désactivé | — | Message d'erreur conservant la saisie |
| Admin (toutes listes) | Squelettes | État vide avec action principale | Toast d'erreur + valeur précédente restaurée |

## 6. Navigation

- **Public** : en-tête fixe compact (logo/nom · Projets · À propos · Contact · sélecteur FR/EN · thème clair/sombre), pied de page (liens sociaux, mentions légales, © année). Changer de thème change aussi la loi du champ génératif (transformation ↔ traceur), voir [DESIGN_BRIEF](DESIGN_BRIEF.md).
- **Mobile** : menu plein écran accessible (focus piégé, fermeture Échap).
- **Admin** : barre latérale (Tableau de bord, Projets, Profil, Compétences, Expériences, GitHub, Messages, Export) + lien « Voir le site ».
- **Clavier** : lien « Aller au contenu », ordre de focus logique, `⌘K` / `Ctrl+K` dans l'admin pour la recherche rapide (V1.1 si le temps manque).
