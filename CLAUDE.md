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

- **Chemin** : ~/Desktop/SORELL/sorell-website

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
```

## Base de données (Supabase)

### Tables principales
- **profiles** : id, email, plan ("free"/"pro"/"business"/"enterprise"), full_name, stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at
- **lifecycle_emails** : id, user_id, email_type, sent_at (tracking des emails lifecycle envoyés, UNIQUE user_id+email_type)
- **newsletter_config** : user_id, topics (array), custom_brief, sources, recipients, frequency, send_day, send_hour, custom_topics (array)
- **newsletters** (historique) : id, user_id, content, subject, created_at, sent_at

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
│   │   ├── contact/route.ts          # Formulaire de contact
│   │   ├── analytics/route.ts        # Analytics
│   │   ├── delete-account/route.ts   # Suppression de compte
│   │   ├── portal/route.ts           # Portail Stripe
│   │   ├── unsubscribe/route.ts      # Désabonnement
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

- 🚨 next.config.ts : ignoreBuildErrors: true (erreurs TypeScript ignorées)

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

## Tests

- **Framework** : Vitest (vitest.config.ts)
- **Dossier** : `__tests__/`
- **Commande** : `npm test` ou `npx vitest run`
- **Tests existants** : auth, checkout, contact, cron-auth, delete-account, stripe-config (28 tests au total)
- **Mocking** : vi.mock() avec class syntax pour Resend/Anthropic/Stripe constructeurs
