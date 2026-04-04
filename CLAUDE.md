# CLAUDE.md — Projet Sorell

## Identité du projet

- **Nom** : Sorell
- **URL** : https://sorell.fr
- **Slogan** : "Plus besoin de faire votre veille. Sorell l'a déjà faite."
- **Pitch** : Un SaaS qui génère et envoie automatiquement des newsletters sectorielles personnalisées par IA
- **Cible** : Dirigeants PME, managers, équipes B2B qui veulent recevoir une veille sectorielle automatique sans effort
- **Positionnement** : Pas un outil d'email marketing (pas Mailchimp). Pas un outil pour écrire (pas Substack). C'est un outil pour RECEVOIR sans effort.

## Propriétaire

- **Nom** : Noé
- **Profil** : Freelance B2B marketing consultant et solo entrepreneur basé en France. Niveau novice en dev, à l'aise avec le terminal et Claude Code.
- **GitHub** : Nmr-gtb
- **Email** : noe@sorell.fr
- **Calendly** : calendly.com/mur-noe-celony/30min

## Stack technique

- **Frontend** : Next.js (App Router, "use client" pour la plupart des pages) + TypeScript + Tailwind CSS
- **Backend / BDD** : Supabase (auth, database, storage)
- **IA** : Claude API (Haiku 4.5 — modèle claude-haiku-4-5-20251001) avec web search
- **Email** : Resend (depuis noe@sorell.fr)
- **Paiement** : Stripe (mode production)
- **Hébergement** : Vercel (plan gratuit)
- **CRON** : cron-job.org (externe, chaque heure, https://www.sorell.fr/api/cron)
- **Domaine** : sorell.fr (OVH)
- **Email pro** : noe@sorell.fr (OVH Email Pro, pro2.mail.ovh.net)
- **Versioning** : GitHub (https://github.com/Nmr-gtb/sorell-website-)

## Projet local

- **Chemin** : ~/Desktop/CLAUDE-WORKSPACE/Projets/SORELL/sorell-website

## Direction artistique

### Couleurs
- Couleur principale : #005058 (teal sombre)
- Teal clair (accents) : #5EEAD4
- Dark mode accent : #0D9488
- Dark mode hover : #14B8A6
- Fond hero : #0f2b31
- Fond hero bloc arrondi : #00404A
- Fond footer : #0f2b31

### Logo
- Pictogramme : S. stylisé avec un point (public/icone.png) — utilisé comme favicon
- Wordmark : "Sorell" en police Quiglet (public/fonts/quiglet.otf) — utilisé dans la navbar
- En navbar : texte "Sorell" en Quiglet seul (sans pictogramme)
- En footer : pictogramme S. en watermark (opacity 0.15)

### Typographie
- Logo : Quiglet (custom, fichier OTF dans public/fonts/)
- Corps du site : Inter (Google Font)

## Stripe PRODUCTION

- Pro monthly (19€) : price_1TE3pa7A2mOEJEeWltqInvgW
- Pro annual (190€) : price_1TE3ps7A2mOEJEeW4m1wm00z
- Business monthly (49€) : price_1TE3qf7A2mOEJEeWiTAz8oWd
- Business annual (490€) : price_1TE3qv7A2mOEJEeWEB04fuCE
- Trial : 15 jours sur Pro et Business
- Webhook : app/api/webhooks/stripe/route.ts met à jour le plan dans la table profiles

## Variables d'environnement (Vercel)

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
CRON_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_WEBHOOK_SECRET
UNSUBSCRIBE_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ADMIN_JWT_SECRET
```

## Base de données (Supabase)

### Tables principales
- **profiles** : id, email, plan ("free"/"pro"/"business"/"enterprise"), full_name, stripe_customer_id, stripe_subscription_id, trial_ends_at, referral_code (VARCHAR UNIQUE), referred_by (UUID FK profiles), created_at
- **lifecycle_emails** : id, user_id, email_type, sent_at (tracking des emails lifecycle envoyés, UNIQUE user_id+email_type)
- **admin_sessions** : id, email, ip_address, user_agent, created_at, expires_at (audit trail des connexions admin)
- **newsletter_config** : user_id, topics (array), custom_brief, sources, recipients, frequency, send_day, send_hour, custom_topics (array)
- **newsletters** (historique) : id, user_id, content, subject, created_at, sent_at
- **referrals** : id (UUID), referrer_id (UUID FK profiles), referee_id (UUID FK profiles), code (VARCHAR UNIQUE), status ("pending"/"converted"), created_at, converted_at, expires_at (default NOW + 30 jours). RLS activée.

### Storage
- Bucket "logos" (public) pour les logos custom des utilisateurs Business+

### Auth
- Supabase Auth avec email/password
- Profil créé automatiquement à l'inscription

## Plans et limites

| | Free | Pro (19€/mois) | Business (49€/mois) | Enterprise |
|---|---|---|---|---|
| Newsletters auto/mois | 2 | 4 | Illimité | Illimité |
| Aperçus manuels/mois | 1 | 4 | Illimité | Illimité |
| Destinataires | 1 | 5 | 25 | Illimité |
| Sources custom | Non | Oui | Oui | Oui |
| Analytics | Non | Oui | Oui | Oui |
| Historique | Non | Oui | Oui | Oui |
| Logo personnalisé | Non | Non | Oui | Oui |
| Trial | - | 15 jours | 15 jours | - |

## Architecture du projet

```
sorell-website/
├── app/
│   ├── api/
│   │   ├── generate/route.ts         # Génération newsletter (Claude API + web search + rate limiting)
│   │   ├── send/route.ts             # Envoi newsletter (Resend + rate limiting)
│   │   ├── cron/route.ts             # CRON auto-envoi (chaque heure)
│   │   ├── checkout/route.ts         # Stripe checkout avec trial 15 jours
│   │   ├── welcome/route.ts          # Email bienvenue + notification admin
│   │   ├── webhooks/stripe/route.ts  # Webhook Stripe
│   │   ├── webhooks/resend/route.ts  # Webhook Resend (bounces/complaints)
│   │   ├── contact/route.ts          # Formulaire de contact
│   │   ├── analytics/route.ts        # Analytics
│   │   ├── delete-account/route.ts   # Suppression de compte
│   │   ├── portal/route.ts           # Portail Stripe
│   │   ├── unsubscribe/route.ts      # Désabonnement
│   │   ├── referral/route.ts         # Parrainage (GET code+stats, POST enregistrer filleul)
│   │   ├── export-data/route.ts      # Export données RGPD
│   │   ├── chat/route.ts             # Chatbot Soly (Claude Haiku 4.5, rate limiting double)
│   │   ├── cron/lifecycle/route.ts    # CRON lifecycle emails (onboarding, trial, limites)
│   │   └── track/                    # Tracking opens et clicks
│   ├── auth/                         # Pages d'authentification
│   ├── blog/                         # Blog (listing + [slug])
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard avec onboarding wizard 5 étapes
│   │   ├── config/page.tsx           # Configuration newsletter
│   │   ├── generate/page.tsx         # Aperçu/génération manuelle
│   │   ├── customization/page.tsx    # Personnalisation couleurs/logo
│   │   ├── analytics/page.tsx        # Analytics (Pro/Business)
│   │   ├── historique/page.tsx       # Historique (Pro/Business)
│   │   └── profile/page.tsx          # Profil + gestion abonnement
│   ├── tarifs/page.tsx               # Page tarification
│   ├── comment-ca-marche/page.tsx    # Page explicative
│   ├── contact/page.tsx              # Contact
│   ├── demo/page.tsx                 # Démo interactive
│   ├── connexion/page.tsx            # Connexion
│   ├── cgv/ confidentialite/ legal/  # Pages légales
│   ├── layout.tsx                    # Layout principal + Schema JSON-LD
│   ├── theme.css                     # Variables CSS (couleurs teal, dark mode)
│   └── globals.css
├── components/
│   ├── HomeContent.tsx               # Homepage (hero + features + étapes + métriques + tarifs)
│   ├── Navbar.tsx                    # Navbar (logo Quiglet, liens, toggles)
│   ├── Footer.tsx                    # Footer premium (#0f2b31)
│   ├── SorellLogo.tsx                # Logo wordmark Quiglet
│   ├── DashboardHeader.tsx           # Header dashboard
│   ├── DashboardSidebar.tsx          # Sidebar dashboard
│   ├── DemoGenerator.tsx             # Générateur de démo interactive
│   ├── NewsletterPreview.tsx         # Prévisualisation newsletter
│   ├── PricingCard.tsx               # Cartes tarifs
│   ├── FeatureCard.tsx               # Cartes features
│   ├── TrialBanner.tsx               # Bannière trial noire
│   ├── WaitlistForm.tsx              # Formulaire liste d'attente
│   ├── AnimateOnScroll.tsx           # Animations au scroll
│   ├── ReferralBlock.tsx             # Bloc parrainage dashboard (code, stats, copie lien)
│   ├── ChatWidget.tsx                # Chatbot Soly (bulle flottante, 2 modes: general + brief)
│   ├── CrownBadge.tsx                # Badge premium
│   ├── ThemeProvider.tsx             # Provider de thème
│   ├── LanguageToggle.tsx            # Switcher FR/EN
│   └── DevModeToggle.tsx             # Toggle mode dev
├── lib/
│   ├── AuthContext.tsx                # Contexte d'authentification
│   ├── translations/fr.ts, en.ts     # Toutes les traductions i18n
│   ├── blog-articles.ts              # 5 articles du blog
│   ├── topics.ts                     # Thématiques par défaut
│   ├── plans.ts                      # Configuration des plans et limites
│   ├── chat-system-prompt.ts          # Prompt systeme Soly (general + brief)
│   ├── stripe.ts                     # Configuration Stripe
│   ├── supabase.ts                   # Client Supabase (anon, côté client)
│   ├── supabase-admin.ts             # Client Supabase (service_role, côté serveur)
│   ├── ratelimit.ts                  # Rate limiting Upstash Redis
│   ├── auth.ts                       # getAuthenticatedUser() helper
│   └── database.ts                   # Helpers base de données
├── public/
│   ├── hero-visual.png               # Image hero
│   ├── icone.png                     # Pictogramme S. du logo
│   └── fonts/quiglet.otf             # Police du logo
└── CLAUDE.md                         # Ce fichier
```

## Système de génération de newsletters

### Flow
1. CRON tourne chaque heure (cron-job.org → /api/cron)
2. Vérifie pour chaque utilisateur si une newsletter doit être envoyée (selon fréquence, jour, heure)
3. Génère via Claude Haiku 4.5 avec web search (max 5 recherches)
4. Le contenu JSON est nettoyé (cleanCiteTags pour les balises cite de Claude)
5. L'email est envoyé via Resend à tous les destinataires
6. La newsletter est enregistrée dans l'historique

### Anti-doublons (3 niveaux)
1. Titres des 3 dernières newsletters injectés dans le prompt
2. Règles de diversité (min 3 catégories, varier les angles)
3. Stratégie de recherche web variée

### Auto-ajout destinataire
Si 0 destinataires, l'email de l'utilisateur est auto-ajouté

### Coût
Environ 0.10$/newsletter (Claude Haiku 4.5 + web search)

### Rate limiting (Upstash Redis)
- /api/generate : 30 requêtes/heure par utilisateur (Upstash Redis, sliding window)
- /api/send : 30 requêtes/heure (Upstash Redis)
- /api/welcome, /api/welcome-email : 5 emails/heure par adresse (Upstash Redis)
- /api/chat : 30 msg/h + 100 msg/jour (authentifie) / 15 msg/h + 40 msg/jour (anonyme)
- Le CRON n'est pas affecté (route séparée)
- Config centralisée dans lib/ratelimit.ts

### Sécurité serveur
- **supabaseAdmin** (lib/supabase-admin.ts) : client service_role qui bypass RLS, utilisé dans TOUTES les API routes
- **RLS activée** sur toutes les tables (profiles, newsletter_config, newsletters, recipients, newsletter_events, waitlist, demo_cache) avec 26 policies
- **Auth centralisée** : getAuthenticatedUser() dans lib/auth.ts, vérifie le Bearer token via Supabase

## Flux principaux

### Inscription → Onboarding (5 étapes)
1. Choix du plan (Free avance, Pro/Business → Stripe Checkout avec trial 15j)
2. Brief (description de l'activité)
3. Thématiques (prédéfinies + custom)
4. Email destinataire
5. Créneau d'envoi → génère et envoie la première newsletter

### Paiement
- Onboarding : Stripe Checkout → success URL /dashboard?onboarding=true → retour étape 2
- Upgrade depuis /tarifs : Stripe Checkout → success URL /dashboard/profile?upgraded=true
- Webhook met à jour le plan dans profiles

### Emails
- **Bienvenue** : envoyé à la fin de l'onboarding (3 étapes : enrichir brief, ajouter collaborateurs, laisser faire)
- **Notification admin** : email à noe@sorell.fr à chaque nouvel inscrit
- **Newsletters** : envoyées via Resend depuis noe@sorell.fr avec tracking opens/clicks

## Chatbot Soly

### Presentation
Soly est l'assistant IA integre a sorell.fr. Bulle flottante en bas a droite. Deux modes :
- **General** : FAQ sur Sorell (tarifs, fonctionnement, inscription) — accessible a tous les visiteurs
- **Brief** : guide l'utilisateur pour rediger un bon brief newsletter — accessible depuis Dashboard > Config

### Architecture
- **Widget unique** dans `app/layout.tsx` (global, jamais duplique)
- **Event system** : `soly:open-brief` pour ouvrir en mode brief depuis n'importe quel composant
- **`openSolyBrief(callback)`** : fonction exportee par ChatWidget, utilisee par la page config
- Le brief genere est injecte directement dans le champ `customBrief` de la config

### Fichiers
- `components/ChatWidget.tsx` : widget complet (bulle, fenetre chat, 2 modes)
- `lib/chat-system-prompt.ts` : prompt systeme Soly (contexte Sorell, regles par mode)
- `app/api/chat/route.ts` : API endpoint (Haiku 4.5, rate limiting, auth optionnelle)
- `app/dashboard/config/page.tsx` : bouton "Soly m'aide" qui appelle `openSolyBrief()`

### Modele IA
- Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- max_tokens: 500
- Cout estime : ~0.001$/message
- Prompt concis : 1-2 phrases par reponse, zero enthousiasme, tutoiement pro

### Rate limiting (anti-abus)
Double couche Upstash Redis :
- **Utilisateurs authentifies** : 30 msg/heure + 100 msg/jour
- **Visiteurs anonymes** : 15 msg/heure + 40 msg/jour
- Budget max par user : ~1$/jour (impossible de depasser avec les limites)

### Brief mode — flow
1. User clique "Soly m'aide" dans config
2. `openSolyBrief(callback)` dispatch event `soly:open-brief`
3. ChatWidget s'ouvre en mode brief, pose 5 questions (secteur, cible, sujets, ton, exclusions)
4. Apres les 5 reponses, Soly genere le brief avec marqueurs `---BRIEF_READY---` / `---END_BRIEF---`
5. Bouton "Utiliser ce brief" apparait → injecte le brief dans la config via le callback

### Comportement
- Auto-ouverture 5s apres la 1ere visite (localStorage `soly_shown`)
- Fermer en mode brief → reset vers general
- `modeRef` (useRef) garantit le bon mode meme avec le state batching React

## Homepage — Structure

1. Trial banner (noire, visible non-connectés + Free)
2. Navbar (logo Quiglet, liens gris, toggles FR/EN + dark mode + Dashboard)
3. Hero split (fond #00404A arrondi, texte + image hero-visual.png)
4. Features (6 cartes)
5. Définition GEO (paragraphe + logo watermark)
6. 3 étapes ("En ligne en 5 minutes")
7. Métriques (147+ sources, 12s génération, 30+ secteurs, 5min config)
8. Social proof (paragraphe neutre, pas de faux témoignage)
9. Tarifs (4 plans, toggle mensuel/annuel)
10. CTA final (fond #005058)
11. Footer premium (#0f2b31, 4 colonnes)

## GEO (Référencement IA)

- Schema JSON-LD : Organization, SoftwareApplication, HowTo
- FAQ JSON-LD sur /tarifs (12 Q&A) et /comment-ca-marche (4 Q&A)
- Article JSON-LD sur chaque article du blog
- Blog 5 articles optimisés GEO
- Product Hunt programmé
- Reddit r/SaaS posté, r/Entrepreneur à poster

## Problèmes résolus (NE PAS REFAIRE)

1. **Tirets longs "---"** : supprimés partout, remplacés par "-"
2. **framer-motion** : NE JAMAIS UTILISER, ça casse le build
3. **Build local** : NE JAMAIS tenter de build en local, push direct via git
4. **i18n** : les traductions dynamiques cassaient le build, corrigé avec imports statiques
5. **JSON truncation** : max_tokens à 4096 (pas 1500, ça tronquait le JSON de Haiku)
6. **Cite tags** : la fonction cleanCiteTags() nettoie les balises cite de Claude
7. **OVH Email Pro** : supprimer le MX Plan qui bloquait, serveur pro2.mail.ovh.net
8. **Newsletters similaires** : résolu avec la stratégie anti-doublons 3 niveaux
9. **Prix annuels** : afficher 190€/an et 490€/an (pas 15,8€/mois)
10. **Bannière trial** : visible pour non-connectés ET plan Free
11. **Couleur #2563EB → #005058** : migration complète sur tout le projet
12. **Dark mode bleu** : remplacé par teal (#0D9488 accent, #14B8A6 hover)
13. **Vercel plan gratuit** : fonctionne, le trial Pro Vercel expiré n'impacte rien
14. **Témoignage fictif** : supprimé (Laurent Mur, CEO Weenk), remplacé par social proof neutre
15. **Rate limiting in-memory** : migré vers Upstash Redis (compatible serverless multi-instance)
16. **RLS Supabase** : activée sur les 7 tables, API routes migrées vers supabaseAdmin (service_role)
17. **console.log en prod** : tous supprimés dans 16+ fichiers

## Failles de sécurité connues (à corriger)

### Failles CORRIGÉES (31 mars 2026)

- ✅ /api/delete-account : auth ajoutée (getAuthenticatedUser)
- ✅ /api/analytics : auth ajoutée
- ✅ /api/portal : auth ajoutée
- ✅ /api/checkout : priceId validé contre whitelist (VALID_PRICE_IDS)
- ✅ Rate limiting migré vers Upstash Redis (compatible multi-instance Vercel)
- ✅ RLS activée sur les 7 tables Supabase avec 26 policies
- ✅ Toutes les API routes migrées vers supabaseAdmin (service_role)
- ✅ console.log/error supprimés de 16+ fichiers
- ✅ Témoignage fictif supprimé, remplacé par social proof neutre
- ✅ Images optimisées (img → next/image)
- ✅ Dashboard i18n (textes hardcodés FR → t() avec clés FR/EN)
- ✅ Tests unitaires ajoutés (auth, checkout, contact, cron, stripe, delete-account)
- ✅ SEO : JSON-LD FAQPage, sitemap dynamique, focus-visible, font preload
- ✅ Erreur technique exposee dans /api/cron masquee (message generique)
- ✅ Rate limiter fail-close dans /api/demo
- ✅ Gestion invoice.payment_failed dans webhook Stripe
- ✅ Webhook Resend pour bounces/complaints
- ✅ getProfile() avec catch dans DashboardSidebar

### Failles CORRIGÉES (1 avril 2026)

- ✅ Webhook Resend : verification cryptographique HMAC-SHA256 de la signature svix (RESEND_WEBHOOK_SECRET)
- ✅ XSS : escapeHtml() applique sur tous les champs utilisateur dans /api/contact, /api/welcome, /api/welcome-email
- ✅ Validation email (isValidEmail) et limites de longueur (name: 200, email: 320, message: 5000) sur les routes contact/welcome
- ✅ Headers de securite dans next.config.ts (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS)
- ✅ /api/welcome et /api/welcome-email proteges par getAuthenticatedUser() (401 si non authentifie)
- ✅ Appelants mis a jour : dashboard utilise authFetch, auth/callback passe le Bearer token, connexion/page delegue au callback
- ✅ unsubscribe-token.ts : secret HMAC separe (UNSUBSCRIBE_SECRET prioritaire sur CRON_SECRET), throw si vide au lieu de fallback silencieux

## Règles de travail avec Claude Code

- Toujours /clear avant chaque nouveau prompt
- Ne JAMAIS tenter de build en local
- Toujours finir par : git add -A && git commit -m "message" && git push
- Ne pas utiliser framer-motion
- Ne pas utiliser de tirets longs "---"
- Spécifier les fichiers exacts à modifier
- Toujours préciser les clés de traduction FR et EN

## État actuel et prochaines étapes

### Priorité haute (acquisition)
- [ ] Lancer une séquence cold email vers dirigeants PME
- [ ] Contenu LinkedIn régulier sur la veille sectorielle
- [ ] Reddit r/Entrepreneur post
- [ ] G2, Capterra, Appvizer (quand inscriptions fonctionnent)

### Priorité moyenne (produit)
- [x] Corriger les failles de sécurité (fait le 31/03/2026)
- [x] Remplacer le témoignage fictif (supprimé, social proof neutre)
- [x] Emails de cycle de vie (onboarding J+1, trial J-3/J-1/J0, limite atteinte, alerte admin)
- [x] Alerte email si l'API de génération échoue (intégré au lifecycle CRON)
- [ ] Template email éditorial V3
- [ ] Collecter de vrais avis clients pour remplacer le social proof

### Priorité basse (évolution)
- [ ] GEO Phase 4 : PR, articles invités, Wikipedia/Wikidata
- [ ] Notifications Slack pour les inscriptions
- [ ] Dashboard analytics plus avancé

## Historique des décisions

| Date | Décision | Raison | Agent |
|------|----------|--------|-------|
| — | Next.js App Router | SSR + API Routes intégrées, déploiement Vercel natif | /architect |
| — | Supabase | Auth + BDD + RLS + Edge Functions, tout-en-un | /architect |
| — | Resend | API simple, bon deliverability, pricing accessible | /architect |
| — | Stripe | Standard SaaS, webhooks fiables | /architect |
| — | Claude Haiku 4.5 | Coût 0.10$/newsletter, web search intégré | /prompt |
| — | Teal #005058 | Migration depuis bleu #2563EB, DA plus premium | /designer |
| — | cron-job.org | Simple, externe, gratuit, évite Edge Functions complexes | /deploy |
| 31/03/2026 | Upstash Redis | Rate limiting distribué compatible Vercel serverless | /architect |
| 31/03/2026 | supabaseAdmin (service_role) | Bypass RLS dans les API routes, auth au niveau applicatif | /security |
| 31/03/2026 | Vitest | Tests unitaires rapides, compatible Next.js + TypeScript | /tester |
| 04/04/2026 | Dashboard Admin CEO | Auth JWT séparée, cookie httpOnly, Recharts, pipeline lifecycle | /architect + /security |
| 04/04/2026 | jsonwebtoken + bcryptjs | Auth admin indépendante de Supabase Auth, plus sûr pour un single admin | /security |
| 04/04/2026 | Recharts | Graphiques légers pour dashboard admin (pie chart, line chart) | /architect |

## Tests

- **Framework** : Vitest (vitest.config.ts)
- **Dossier** : `__tests__/`
- **Commande** : `npm test` ou `npx vitest run`
- **Tests existants** : auth, checkout, contact, cron-auth, delete-account, stripe-config (28 tests au total)
- **Mocking** : vi.mock() avec class syntax pour Resend/Anthropic/Stripe constructeurs

## Systeme de parrainage

### Regles
- Seuls les abonnes Pro et Business peuvent parrainer
- Parrain : +15 jours gratuits (extension du billing cycle Stripe via trial_end)
- Filleul : -20% sur le premier mois (coupon Stripe one-time, amount_off)
  - Pro : 19€ -> 15€ (1500 centimes)
  - Business : 49€ -> 39€ (3900 centimes)
- Max 3 parrainages convertis par mois par parrain
- Le lien de parrainage expire apres 30 jours
- Si coupon applique, pas de trial 15 jours (le -20% s'applique au 1er mois)

### Flow technique
1. Le parrain copie son lien `sorell.fr/?ref=CODE` depuis le dashboard (ReferralBlock)
2. Le filleul arrive sur la homepage, le code est stocke en localStorage (`sorell_ref`)
3. A l'inscription (email ou Google OAuth), le code est envoye a `POST /api/referral` pour creer un referral en status "pending"
4. Quand le filleul s'abonne (checkout Stripe), le checkout detecte le referral pending et cree un coupon Stripe -20%
5. Le webhook `checkout.session.completed` detecte le referralId dans les metadata, marque le referral comme "converted", et ajoute +15 jours au parrain via Stripe API

### Fichiers concernes
- `app/api/referral/route.ts` : GET (code+stats), POST (enregistrer filleul)
- `app/api/checkout/route.ts` : detection referral + coupon Stripe
- `app/api/webhooks/stripe/route.ts` : conversion referral + recompense parrain
- `app/auth/callback/route.ts` : capture ref code (Google OAuth)
- `app/connexion/page.tsx` : capture ref code (email signup)
- `components/HomeContent.tsx` : capture ref code depuis URL -> localStorage
- `components/ReferralBlock.tsx` : UI dashboard (lien, stats)

## Notes d'optimisation

- hero-visual.webp : hero convertie en WebP qualite 95, 240KB (-84% vs PNG 1.5MB)

## Dashboard Admin CEO

### Accès
- URL : /admin-login (page de connexion)
- Auth : JWT indépendant de Supabase Auth (bcrypt + jsonwebtoken)
- Cookie : admin_token (httpOnly, secure, sameSite strict, 7 jours)
- Rate limiting : 5 tentatives / 15 minutes sur /api/admin/login
- Session logging dans table admin_sessions

### Pages
- /admin — Dashboard KPIs (total users, new users, active users, MRR, conversion, plan distribution, graphiques Recharts)
- /admin/users — Liste paginée + filtres (plan, recherche) + détail par utilisateur
- /admin/users/[id] — Fiche complète (profil, config, newsletters, lifecycle, events, modifier plan, supprimer)
- /admin/newsletters — Toutes les newsletters de tous les utilisateurs avec taux d'ouverture/clic
- /admin/lifecycle — Pipeline lifecycle emails (étape actuelle de chaque utilisateur dans le funnel)
- /admin/prompts — Voir le prompt complet reconstruit pour chaque utilisateur + dernière génération

### API Routes Admin
- GET /api/admin/stats — KPIs globaux + MRR Stripe
- GET /api/admin/users — Liste paginée avec filtres
- GET /api/admin/users/[id] — Détail complet
- PATCH /api/admin/users/[id] — Modifier plan
- DELETE /api/admin/users/[id] — Supprimer utilisateur
- GET /api/admin/newsletters — Liste toutes newsletters
- GET /api/admin/newsletters/[id] — Détail newsletter + events
- GET /api/admin/lifecycle — Pipeline lifecycle complet
- GET /api/admin/prompts/[userId] — Prompt reconstruit + dernière génération
- POST /api/admin/login — Authentification admin
- POST /api/admin/logout — Déconnexion
- GET /api/admin/verify — Vérification token

### Sécurité
- Middleware protège /admin/* et /api/admin/* (sauf /admin-login et /api/admin/login)
- Toutes les API routes admin vérifient le JWT via getAuthenticatedAdmin()
- Utilise supabaseAdmin (service_role) pour bypass RLS
- Aucun lien admin dans la navigation publique/utilisateur
- Variables env : ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_JWT_SECRET

### Dépendances ajoutées
- jsonwebtoken + @types/jsonwebtoken
- bcryptjs + @types/bcryptjs
- recharts (graphiques)
