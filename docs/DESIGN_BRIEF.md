# DESIGN BRIEF : Portfolio

> v1.0 · 2026-10-12
> Construit avec les skills `taste-skill`, `minimalist-skill`, `emil-design-eng` et `impeccable` (méthode *shape*), complétés par `design:*`.
> Docs liés : [PRD](PRD.md) · [APP_FLOW](APP_FLOW.md) · [TRD](TRD.md)

## 0. Lecture du brief

**Lecture (taste-skill)** : portfolio de développeur pour un public mixte (recruteurs, clients, pairs), dans un langage minimal et mathématique où le mouvement est la signature, reposant sur Tailwind v4 + Motion + un moteur génératif WebGL maison très léger.

| Surface | Mode (impeccable) | Ce que réussir veut dire |
|---|---|---|
| Accueil, Projets, Fiche projet | **Experience** | Le travail mène dès le premier écran ; l'interface s'efface |
| Contact | **Persuade** | Le visiteur écrit, sans friction |
| À propos | **Read** | On comprend le parcours en 2 minutes |
| Admin | **Operate** | Publier vite, sans erreur ; aucune expression gratuite |

**Réglages (taste-skill)**

| Réglage | Valeur | Raison |
|---|---|---|
| `DESIGN_VARIANCE` | 6 | Asymétrie maîtrisée ; un portfolio de dev doit rester lisible |
| `MOTION_INTENSITY` | 7 | Le mouvement géométrique est l'identité, mais il est **concentré** sur le champ génératif ; l'interface reste sobre |
| `VISUAL_DENSITY` | 3 | Beaucoup d'air, comme une galerie |

## 1. Rôle et publics

Arrivée typique : un recruteur sur ordinateur en journée (lien depuis un CV ou LinkedIn), un client sur téléphone le soir (lien depuis un message), un développeur curieux (lien GitHub). Tous doivent comprendre en 10 secondes **qui**, **ce qu'il fabrique**, **comment il le fabrique**, puis trouver un projet qui leur parle.

**Vérité propre à ce produit** (ce qu'aucun gabarit ne peut revendiquer) : chaque projet a une **provenance** (Claude Code, codé à la main, CMS) et il est montré **vivant** (aperçu réel, stats GitHub à jour). Le design rend cette provenance visible et belle.

## 2. Direction : « Ordre et transformation »

**THÈSE.** Une grille mathématique est le fil du site. En sombre, elle se **transforme** sous l'effet de matrices (rotation, cisaillement, changement d'échelle), à la manière des visualisations d'algèbre linéaire. En clair, elle est **dérangée** par un désordre contrôlé, à la manière des dessins au traceur de Vera Molnár. Même grille, deux lois. On refuse le portfolio par défaut : hero centré, trois cartes égales, dégradé violet.

**MONDE SOMBRE « Transformation ».** Fond graphite quasi noir, lignes de 1 px gris acier, deux vecteurs de base dans l'accent outremer clair, petites matrices affichées en chiffres tabulaires. Aucune lueur, aucun néon : des traits nets.

**MONDE CLAIR « Traceur ».** Fond blanc froid (jamais crème), encre presque noire, grilles de carrés tracés à la plume dont certains se déforment, accent outremer profond utilisé avec parcimonie.

**HISTOIRE.** Le visiteur voit d'abord un champ en mouvement et une phrase claire. Il comprend que chaque projet a sa fabrication. Il ouvre un projet, voit le site réel, puis écrit.

**PREMIER ÉCRAN (Accueil, desktop).** Le champ occupe tout le fond, à `min-height: 100dvh` moins l'en-tête. Colonne de texte alignée à gauche sur 5/12 colonnes, verticalement centrée, avec, du haut vers le bas : nom et rôle en petit, titre sur 2 lignes maximum, sous-titre de 20 mots maximum, puis deux actions (« Voir les projets » en principal, « Me contacter » en secondaire). Le champ **s'éclaircit** derrière la colonne de texte (densité et opacité réduites) pour garantir la lisibilité. Dans le coin bas droit, la matrice courante s'affiche en petits chiffres (décoratif, `aria-hidden`).

**SIGNATURES (3 moments mémorables).**
1. **Le champ réagit** : le défilement fait passer la grille d'une transformation à la suivante ; le pointeur déforme localement le champ, avec un amortissement de type ressort.
2. **Changer de thème change de loi** : la grille passe de la transformation au traceur, en fondu de 400 ms avec un flou de 4 px qui fait le pont entre les deux états (principe d'Emil Kowalski).
3. **Chaque projet a son sceau** : une petite figure générée à partir de son identifiant ; la famille de matrice dépend de sa provenance (voir §5.3).

## 3. Design tokens

Toutes les couleurs sont en OKLCH, déclarées dans `@theme` (Tailwind v4) via des variables CSS. Thème par défaut : celui du système, avec un bouton de bascule mémorisé.

### 3.1 Couleurs

| Token | Clair « Traceur » | Sombre « Transformation » | Usage |
|---|---|---|---|
| `--bg` | `oklch(0.985 0.002 265)` | `oklch(0.165 0.006 265)` | Fond de page |
| `--surface` | `oklch(0.995 0.001 265)` | `oklch(0.205 0.007 265)` | Panneaux, champs de formulaire |
| `--ink` | `oklch(0.20 0.006 265)` | `oklch(0.95 0.004 265)` | Texte principal |
| `--ink-muted` | `oklch(0.47 0.010 265)` | `oklch(0.73 0.010 265)` | Texte secondaire (contraste AA vérifié) |
| `--line` | `oklch(0.91 0.004 265)` | `oklch(0.30 0.008 265)` | Bordures, séparateurs, lignes du champ |
| `--line-strong` | `oklch(0.78 0.006 265)` | `oklch(0.43 0.010 265)` | Bordures actives, lignes proches du pointeur |
| `--accent` | `oklch(0.47 0.21 264)` (outremer) | `oklch(0.74 0.14 264)` (outremer clair) | Action principale, vecteurs, liens, focus |
| `--accent-ink` | `oklch(0.985 0.002 265)` | `oklch(0.165 0.006 265)` | Texte posé sur l'accent |
| `--danger` | `oklch(0.55 0.19 25)` | `oklch(0.70 0.15 25)` | Erreurs (formulaires, admin) |
| `--success` | `oklch(0.55 0.12 155)` | `oklch(0.75 0.12 155)` | Confirmations (admin, contact) |

Règles : **un seul accent**, utilisé partout de la même façon (taste-skill, *color consistency lock*) ; ni noir ni blanc purs ; pas de dégradé décoratif ; le danger et le succès ne servent qu'aux états.

### 3.2 Typographie

| Rôle | Police | Détails |
|---|---|---|
| Titres et texte | **Switzer** (Fontshare, licence gratuite y compris commerciale, auto-hébergée via `next/font/local`, fichier variable) | Néo-grotesque précise, avec du caractère dans les graisses de titre ; évite Inter et les polices « par défaut d'IA » listées par impeccable |
| Chiffres, matrices, métadonnées | **Geist Mono** (OFL, paquet `geist`) | Usage strictement fonctionnel : matrices, stats GitHub, dates, raccourcis clavier |

| Niveau | Taille | Graisse / interlignage / approche |
|---|---|---|
| Display (hero) | `clamp(2.5rem, 1.2rem + 4.2vw, 4.5rem)` | 600 · 1.04 · -0.035em |
| H1 page | `clamp(2rem, 1.3rem + 2.6vw, 3.25rem)` | 600 · 1.08 · -0.03em |
| H2 | `clamp(1.5rem, 1.2rem + 1.2vw, 2.125rem)` | 600 · 1.15 · -0.02em |
| H3 | `1.25rem` | 600 · 1.3 · -0.01em |
| Corps | `1.0625rem` | 400 · 1.6 · 0 · `max-width: 65ch` |
| Petit | `0.875rem` | 450 · 1.5 |
| Méta (mono) | `0.8125rem` | 400 · 1.4 · chiffres tabulaires |

L'emphase se fait par la graisse ou l'italique de la **même** famille ; jamais d'empattement injecté.

### 3.3 Espace, formes, profondeur

- **Grille** : 12 colonnes, conteneur `max-width: 1240px`, marges de 24 px sur mobile et 40 px sur desktop.
- **Espacement** : base 4 px. Sections : `py-28` (desktop), `py-16` (mobile).
- **Rayons (règle documentée)** : boutons et champs 6 px ; cadres d'aperçu et panneaux 10 px ; étiquettes en pilule. Rien d'autre.
- **Profondeur** : pas d'ombres. La hiérarchie se fait par bordures de 1 px (`--line`), changement de surface et espace. Seule exception : l'en-tête au défilement (fond `--bg` à 80 % + flou de 12 px).
- **Couches (z-index)** : champ génératif 0, contenu 10, en-tête 40, menu mobile 50, toasts 60, modales 70. Constantes dans `lib/z.ts`.
- **Points de rupture** : 640 / 768 / 1024 / 1280 px.

## 4. Mouvement (principes d'Emil Kowalski)

### 4.1 Tokens

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entrées, retours UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* déplacements à l'écran, transformations du champ */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* menu mobile, panneaux */
--dur-press: 140ms;  --dur-hover: 180ms;  --dur-popover: 200ms;
--dur-page: 280ms;   --dur-panel: 320ms;  --dur-reveal: 600ms;
```

### 4.2 Ce qui bouge, et pourquoi

| Élément | Animation | Durée / courbe | But |
|---|---|---|---|
| Champ génératif | Transformation continue, réaction au pointeur | Cycles de 1,2 à 2,4 s par transformation, ressort sur le pointeur | Identité (décoratif, jamais porteur d'information) |
| Boutons, cartes cliquables | `scale(0.97)` à l'appui | 140 ms, ease-out | Retour tactile |
| Survol des cartes | Bordure qui passe à `--line-strong`, capture qui monte de 2 px | 180 ms, ease | Indique ce qui est cliquable (uniquement si `hover: hover`) |
| Navigation entre pages | View Transitions : fondu, et la capture de la carte devient le cadre de la fiche (élément partagé) | 280 ms, ease-out | Continuité spatiale |
| Apparition des sections | Opacité 0 → 1, `translateY(12px)` → 0, une seule fois | 600 ms, ease-out, décalage de 50 ms (6 éléments maximum) | Rythme de lecture |
| Filtres de la grille | Réorganisation animée (`layout` de Motion) | 220 ms, ease-in-out | Montrer ce qui a changé |
| Aperçu live | La capture laisse place à l'iframe, fondu avec un flou de 4 px | 300 ms | Transition d'état |
| Toasts (admin) | Sonner (paramètres par défaut) | Défauts Sonner | Retour d'action |

### 4.3 Règles

- Jamais d'animation sur une action clavier (`⌘K`, changement de langue, raccourcis de l'admin).
- Jamais d'apparition depuis `scale(0)` : partir de `0.95` avec opacité 0.
- La sortie est plus rapide que l'entrée.
- Pas de `transition: all` : nommer les propriétés. Animer uniquement `transform`, `opacity` et `filter`.
- Avec Motion, utiliser la chaîne `transform` (accélérée par le GPU) plutôt que les raccourcis `x`/`y` pour tout ce qui joue pendant un chargement.
- Pas de `window.addEventListener('scroll')` : utiliser `useScroll` de Motion ou IntersectionObserver.
- **Réduction des animations** (`prefers-reduced-motion`) : le champ devient une image SVG fixe ; plus de déplacement ni de décalage ; les fondus courts sont conservés.
- Revoir les animations au ralenti (×4) avant chaque fin d'étape, avec le skill `review-animations`.

## 5. Le moteur génératif « Champ »

### 5.1 Programmes

| | Sombre « Transformation » | Clair « Traceur » |
|---|---|---|
| Géométrie | Réseau de lignes (environ 24 × 16, adapté à la taille de l'écran) | Grille de carrés (environ 14 × 9), chaque carré tracé en 4 segments |
| Loi | Sommets multipliés par une matrice M(t) interpolée entre des étapes clés : identité → rotation 30° → cisaillement → échelle sur les vecteurs propres → identité | Chaque sommet est décalé d'un bruit déterministe ; l'amplitude du désordre « respire » lentement (cycle de 8 s) |
| Défilement | Fait avancer le cycle de transformation dans le hero | Augmente légèrement le désordre global |
| Pointeur | Déformation locale (gaussienne, rayon d'environ 140 px), avec un amortissement de type ressort | Le désordre augmente autour du pointeur, puis l'ordre revient |
| Accent | Vecteurs de base î et ĵ avec pointes de flèche | 1 à 3 carrés tracés en accent, choisis selon la graine |
| Entrée | La grille part de l'identité et commence à se transformer après 400 ms | Les lignes se tracent progressivement, comme au traceur (1,6 s, une seule fois) |

### 5.2 Budget de performance (non négociable)

- Rendu en **WebGL2**, quads de lignes instanciés, ~1 ms par image sur un mobile moyen. Repli en Canvas 2D si WebGL2 est absent. Pas de Three.js.
- Poids : **≤ 15 Ko gzip** pour tout le moteur, chargé par `import()` dynamique **après** le premier affichage (`requestIdleCallback`).
- **Le contenu le plus grand affiché à l'écran (LCP) est le texte du hero, jamais le canvas.** Le serveur rend une image SVG de la première image du champ : pas de saut visuel, et c'est aussi le repli sans JavaScript et en mouvement réduit. Le canvas apparaît par-dessus en fondu de 400 ms.
- Densité de pixels plafonnée à 1,5 (à 1 si `hardwareConcurrency ≤ 4`) ; 60 images par seconde au maximum.
- Pause hors de l'écran (IntersectionObserver) et quand l'onglet est caché (`visibilitychange`). Après 60 s sans interaction, passage à 30 images par seconde.
- Le champ joue en direct **uniquement sur l'accueil**. Les autres pages affichent une bande SVG statique du même monde dans l'en-tête.
- Accessibilité : `aria-hidden="true"`, aucun clignotement au-delà de 3 Hz, aucune information transmise uniquement par le champ.

### 5.3 Sceaux de projet

Petite figure SVG (1:1) **générée côté serveur** à partir d'une empreinte du `slug` : zéro JavaScript, rendue dans les deux thèmes (le CSS choisit laquelle afficher).

| Provenance | Famille de matrice (sombre) | Désordre (clair) |
|---|---|---|
| Claude Code | Rotation + échelle | Moyen, regroupé |
| Codé main | Cisaillement | Faible, régulier |
| CMS | Réflexion / échelle diagonale | Par rangées |
| Autre | Orthogonale aléatoire | Dispersé |

Utilisé dans le cartel de la fiche projet, comme image de repli quand une capture manque, et dans la composition des images Open Graph.

## 6. Pages et composants

Chaque page utilise des familles de mise en page **différentes** (taste-skill : jamais deux fois la même famille, pas de zigzag au-delà de 2 sections).

### 6.1 Accueil

1. **Hero** : texte à gauche sur le champ (voir §2).
2. **Projets phares** : mosaïque asymétrique avec **exactement** autant de cases que de projets mis en avant (1 grande + 2 moyennes pour 3 projets ; un autre agencement pour 4 à 6). Chaque case montre la vraie capture, le titre, la provenance et l'année.
3. **Fabrications** : pile verticale de 3 lignes larges, une par provenance. Chaque ligne affiche le nombre réel de projets en grand (chiffres mono), le nom de la fabrication, une phrase, le sceau type et un lien vers la grille filtrée. On refuse les trois cartes égales.
4. **Profil court** : portrait (photo réelle à fournir) et 2 phrases, puis compétences clés en étiquettes ; lien vers À propos.
5. **Contact** : une phrase et le bouton « Me contacter ».

### 6.2 Projets

- Titre de page et nombre de projets.
- **Barre de filtres** collante :
  - contrôle segmenté pour la provenance (Tous · Claude Code · Codé main · CMS · Autre) ;
  - menu déroulant pour la stack ;
  - étiquettes pour les tags ;
  - tri (Récents ou Sélection).
  L'URL reflète les filtres.
- **Grille 2 colonnes** sur desktop (grandes captures en 16:10), 1 colonne sur mobile.
- **État vide** : sceau, « Aucun projet pour ces filtres » et le bouton « Réinitialiser les filtres ».

### 6.3 Fiche projet

- **Cartel** à gauche (4/12, collant) :
  - titre, année, sceau ;
  - lignes clé-valeur : Fabrication, Stack, Rôle, Statut ;
  - liens « Ouvrir le site » et « Voir le code ».
- **Cadre d'aperçu** à droite (8/12) :
  - bordure de 1 px, rayon de 10 px, et une fine barre supérieure qui affiche le domaine ;
  - **pas** de fausses pastilles macOS ;
  - la capture s'affiche d'abord. Le bouton « Activer l'aperçu live » charge l'iframe **à la demande**, ce qui évite de charger des sites tiers sans action du visiteur.
- **Stats GitHub** en ligne de chiffres mono : étoiles, langages (barre empilée **sans** piste de fond), dernier commit en date relative.
- Corps en Markdown (65ch), galerie, puis navigation vers le projet précédent ou suivant.
- **Sur mobile** : le cartel passe au-dessus, l'aperçu prend toute la largeur.

### 6.4 À propos

- **Bio** sur 65ch avec le portrait.
- **Parcours** : liste verticale groupée par type (Expériences, Formations, Missions), avec les dates en mono à gauche.
- **Compétences** groupées par catégorie (étiquettes).
- Deux boutons « Télécharger le CV (FR) » et « Download CV (EN) ».

### 6.5 Contact

- **Mise en page** : texte et liens directs à gauche (5/12), formulaire à droite (7/12).
- **Formulaire** :
  - libellé **au-dessus** de chaque champ, aide sous le champ, erreur en dessous (`--danger`) ;
  - pas de texte indicatif servant de libellé ;
  - Turnstile en mode invisible.
- **Succès** : le formulaire est remplacé par un message de confirmation, en fondu.

### 6.6 Éléments communs

- **En-tête** :
  - 64 px de haut, toujours sur une seule ligne ;
  - nom à gauche ; Projets, À propos et Contact au centre ou à droite ; FR/EN et bouton de thème à droite ;
  - menu plein écran sur mobile, avec ouverture et fermeture `--ease-drawer` en 320 ms.
- **Pied de page** : liens sociaux (icônes), mentions légales, © année. Pas de numéro de version ni de bandeau décoratif.
- **Boutons** :
  - principal : fond `--accent` et texte `--accent-ink` ;
  - secondaire : bordure `--line-strong` ;
  - rayon de 6 px, libellé sur une seule ligne, 3 mots au maximum.
- **Étiquettes** : pilules, petit texte, fond `--surface` et bordure `--line`. La provenance est la seule étiquette accentuée.
- **Icônes** : **Phosphor** uniquement (graisse Regular, épaisseur uniforme). Ni Lucide, ni icônes dessinées à la main.
- **Focus** : anneau de 2 px `--accent` avec un décalage de 2 px, visible partout.

### 6.7 Admin (mode Operate)

- shadcn/ui **personnalisé** avec les mêmes tokens (couleurs, rayons, Switzer), densité 6, **aucun champ génératif**, sauf une bande statique sur la page de connexion.
- Barre latérale ; tableaux denses avec chiffres mono ; toasts Sonner.
- **Champs bilingues** : FR et EN côte à côte sur desktop, empilés sur mobile, avec une alerte « Traduction manquante » quand l'EN est vide.
- **Éditeur de projet** : enregistrement automatique avec indicateur « Enregistré il y a 3 s », aperçu de la carte publique en direct, bouton « Publier » unique.

## 7. Textes et voix

- Première personne, simple et précise. FR et EN rédigés séparément, pas de traduction mot à mot.
- **Un libellé par intention**, identique partout :

| Intention | FR | EN |
|---|---|---|
| Voir les projets | Voir les projets | See projects |
| Contact | Me contacter | Get in touch |
| Site externe | Ouvrir le site | Open site |
| Code | Voir le code | View code |
| Aperçu | Activer l'aperçu live | Load live preview |
| CV | Télécharger le CV | Download CV |

- **Interdits dans l'interface** :
  - le tiret cadratin (règle taste-skill) ;
  - les mots creux (« sublimer », « révolutionner », « seamless », « next-gen ») ;
  - les chiffres inventés ;
  - les étiquettes numérotées (« 01 / Projets ») ;
  - les incitations à défiler ;
  - plus d'un surtitre pour 3 sections.
- Messages d'erreur : ce qui s'est passé et quoi faire, sans jargon. Relecture avec `design:ux-copy` à l'étape contenu.

## 8. Images et contenu à fournir

| Élément | Source | Statut |
|---|---|---|
| Portrait | Photo réelle de Richard (3:4, fond neutre) | **À fournir** |
| Captures des projets | Automatiques (Microlink) ou ajoutées dans l'admin | Automatique |
| Images de galerie | Ajoutées dans l'admin | À fournir par projet |
| Images Open Graph | Générées (`next/og`) : titre, sceau, champ statique | Automatique |
| Favicon / monogramme | Sceau dérivé du nom « Richard » | À valider |

Pas de photos de banque d'images, pas de fausses captures construites en `div`.

## 9. Accessibilité (WCAG 2.2 AA)

- Contrastes vérifiés pour chaque paire de tokens dans les deux thèmes (texte ≥ 4,5:1, grands textes et éléments d'interface ≥ 3:1).
- Navigation complète au clavier, lien d'évitement, focus visible, menu mobile qui retient le focus et se ferme avec Échap.
- Le contenu de l'iframe est titré (`title`) ; la capture a un texte alternatif.
- Mouvement réduit respecté (§4.3) ; zones tactiles ≥ 44 px.
- Audit avec `design:accessibility-review` puis axe-core en CI.

## 10. À éviter absolument

Hero centré sur un fond de dégradé · trois cartes égales · violet d'IA · néons et halos · Inter ou Space Grotesk par défaut · fond crème avec accent terracotta · numérotation des sections · fausses fenêtres macOS · faux tableaux de bord en `div` · curseur personnalisé · défilement détourné · plus d'un bandeau défilant · animation sans raison énonçable en une phrase.

## 11. Contrôle avant livraison (extrait de la liste de taste-skill)

- [ ] Premier écran : titre sur 2 lignes maximum, sous-titre de 20 mots maximum, bouton visible sans défiler, 4 éléments de texte maximum.
- [ ] Un accent, une règle de rayons, un thème par page (pas de section inversée).
- [ ] Zéro tiret cadratin dans l'interface ; un libellé par intention.
- [ ] Contrastes des boutons et formulaires conformes AA dans les deux thèmes.
- [ ] Champ génératif : ≤ 15 Ko, chargé après l'affichage, en pause hors de l'écran, SVG en mouvement réduit.
- [ ] LCP < 2,5 s, INP < 200 ms, CLS < 0,1 (Lighthouse mobile).
- [ ] États vide, chargement et erreur présents ; `min-height: 100dvh`, jamais `h-screen`.
- [ ] Revues `review-animations`, `break-ui` (noms longs, textes EN plus longs, zéro projet) et `impeccable audit` passées.

## 12. Décisions ouvertes (à trancher par Richard)

1. Teinte exacte de l'accent : outremer proposé, à confirmer sur une maquette.
2. Police : Switzer proposée (alternatives : Satoshi, General Sans).
3. Monogramme : sceau génératif ou simple texte « Richard ».
4. Portrait : disponible ou à prendre.
