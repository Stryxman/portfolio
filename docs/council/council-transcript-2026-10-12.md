# Conseil LLM : transcript (2026-10-12)

**Mode** : léger (5 conseillers en parallèle, sans peer review).
**Modèles** : Contrarian et First Principles = Opus · Expansionist et Executor = Sonnet · Outsider = Haiku.

## Inclination de l'utilisateur (cachée aux conseillers)

Richard a choisi Next.js + Convex + admin maison, a demandé explicitement une « interface admin » et un site « entièrement dynamique », et a choisi la direction à deux mondes liés au thème.

## Question cadrée

Richard, développeur seul (sites via Claude Code, à la main, CMS ; Node.js non installé), veut un site personnel durable, rapide, gratuit, qui centralise profil et projets pour un public mixte. Plan : (1) Next.js 16 + Convex + admin maison (alternatives : Keystatic/fichiers, Payload, Astro) ; (2) Better Auth sur Convex (alt. Clerk ou pas d'auth) ; (3) Vercel Hobby malgré la clause non commerciale (alt. Cloudflare, Netlify, Vercel Pro) ; (4) direction « Ordre et transformation » à deux mondes + moteur WebGL2 ≤ 15 Ko (alt. un monde, minimal statique) ; (5) V1 : bilingue, contact, CV, aperçus live, sync GitHub, export JSON, admin complet (alt. V1 réduite). Le plan est-il le bon, que changer ?

## Avis

### Contrarian (Opus, pre-mortem)
Échec à 12 mois : 3 mois à monter Convex, Better Auth et 8 modules d'admin, sortie tardive, fiches EN vides, admin cassée au mois 9 par une mise à jour d'auth, jamais réparée. Hypothèse fragile : PRD §2 « modifier le code freine les mises à jour », fausse pour quelqu'un qui édite via Claude Code. L'admin + l'auth + le webhook + Convex constituent l'essentiel du périmètre ; plusieurs briques en 0.x ; six services avec clés et quotas ; sauvegarde manuelle ; Vercel Hobby exclut le persona client. Info manquante : rythme d'ajout de projets (< 2/mois → l'admin ne s'amortit jamais). Test : une journée chronométrée Astro + Markdown + 5 vrais projets sur Netlify ; ajout d'un 6e projet via Claude Code < 5 min et Lighthouse mobile ≥ 95, sinon position réfutée (> 15 min).

### First Principles (Opus, base rates)
Le vrai problème : être compris en quelques secondes puis contacté (base rate : 7,4 s pour le premier tri d'un CV, étude Ladders 2018 ; pas de chiffre fiable pour un portfolio). L'admin, près de la moitié de la V1, n'est vue par aucun visiteur. Durabilité = peu de dépendances ; 7 services gratuits empilés ; des offres gratuites ont disparu (Heroku 2022, PlanetScale Hobby 2024). Info manquante : nombre de projets et fréquence de publication (`Local/` n'en contient que 2). Test : Astro + fichiers + Cloudflare Pages avec 2 projets réels ; ajout d'un 3e < 5 min et Lighthouse ≥ 95 → Convex, admin et auth sortent de la V1 ; réfuté si > 5 min ou si ≥ 4 publications/mois depuis un téléphone sont prévues.

### Expansionist (Sonnet)
L'effort est mal placé : l'admin ne démarque pas Richard. Son meilleur CMS existe déjà (dépôts Git + README + CLAUDE.md + `gh`) ; un script peut générer les fiches depuis l'index de `Local/`, donc le portfolio suit le travail réel. Le moteur « Champ » et les sceaux sont l'actif rare : chaque sceau peut devenir l'image OG partageable, le moteur une micro-bibliothèque ou un « sceau » vendu avec chaque site client ; le portfolio devient démo et gabarit commercial. Statique sur Cloudflare/Netlify supprime le risque Vercel. Test : 1 jour, Astro + MDX depuis 3 README + Champ ; ajout d'un projet en un prompt < 2 min et Lighthouse ≥ 95 avec moteur actif.

### Outsider (Haiku)
Le plan sacrifie la durabilité à l'ambition technique. Vercel Hobby + clients = risque de suspension qui ruinerait la crédibilité ; Netlify règle le problème sans coût. « Durable + seul + stack custom » est contradictoire : qui maintient l'admin et la sync dans 6 mois ? Test : lire la clause Vercel (5 min) ; prototype V0 Next.js + MD + Keystatic + contact, sans WebGL ni sync ; si un changement prend > 4 h, la stack est trop complexe.

### Executor (Sonnet)
C'est un projet d'ingénierie, pas un portfolio : couper en deux. Le goulot est « mettre en ligne », pas « choisir la stack » : 0 ligne de code, ~6 800 mots de docs, Node absent, 7 services externes pour un seul éditeur. Prédiction : le plan actuel ne sera pas en ligne et fonctionnel dans 6 semaines. Le moteur visuel est ce qui démarque : lot séparé après la mise en ligne. Test : lundi, fnm + Astro + 3 projets en Markdown + Cloudflare Pages ; en ligne en ≤ 4 h avec Lighthouse ≥ 95, et ajout d'un 4e projet < 5 min ; sinon le plan Convex est justifié.

## Synthèse du Chairman

Voir le rapport HTML (`council-report-2026-10-12.html`) : convergence très élevée (drapeau), recommandation « V1 statique en fichiers Git + Keystatic optionnel, Champ conservé, hébergement à usage commercial gratuit ; Convex reporté à une V2 conditionnée », confiance moyenne.
