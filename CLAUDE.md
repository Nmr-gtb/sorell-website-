# CLAUDE.md — Projet Sorell

## Identité

- **Nom** : Sorell — **URL** : https://sorell.fr
- **Pitch** : SaaS qui génère et envoie automatiquement des newsletters sectorielles personnalisées par IA
- **Cible** : Dirigeants PME, managers B2B — veille sectorielle automatique sans effort
- **Positionnement** : Pas Mailchimp (email marketing), pas Substack (écrire). C'est un outil pour RECEVOIR sans effort.

## Stack

- **Frontend** : Next.js App Router + TypeScript + Tailwind CSS
- **Backend** : Supabase (auth email/password, PostgreSQL, RLS, storage)
- **IA** : Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) avec web search — ~0.10$/newsletter
- **Email** : Resend — newsletters@sorell.fr (newsletters), noreply@sorell.fr (transactionnel), noe@sorell.fr (support/replyTo)
- **Paiement** : Stripe production — **Cold email** : sorell-group.fr via Emelia
- **Hébergement** : Vercel (gratuit) — **CRON** : cron-job.org (chaque heure → /api/cron)
- **Tests** : Vitest (`npm test`, pool threads) — 29 fichiers / ~265 tests dans `__tests__/`
- **GitHub** : https://github.com/Nmr-gtb/sorell-website-

## Direction artistique

- Principale : #005058 (teal sombre) — Accent : #5EEAD4 — Dark accent : #0D9488 — Dark hover : #14B8A6
- Fonds : hero #0f2b31, bloc arrondi #00404A, footer #0f2b31
- Logo : "Sorell" en Quiglet (`public/fonts/quiglet.otf`), pictogramme S. (`public/icone.png`)
- Corps : Inter (Google Font)

## Stripe PRODUCTION

Source de vérité UNIQUE des price IDs : `lib/price-ids.ts` (constantes sans SDK, importées par lib/stripe.ts, app/api/checkout, app/dashboard/page.tsx et app/tarifs/page.tsx). Ne jamais hardcoder un price ID ailleurs.

- Pro monthly (9,99€) : `price_1Tlm577A2mOEJEeWRGeMx6YD` (actif)
- Pro annual (99€) : `price_1Tlm5T7A2mOEJEeWw4ggdmWU` (actif)
- Business monthly (49€) : `price_1TE3qf7A2mOEJEeWiTAz8oWd` (actif)
- Business annual (490€) : `price_1TE3qv7A2mOEJEeWEB04fuCE` (actif)
- Anciens Pro 19€ (`price_1TE3pa...` archivé, `price_1TE3ps...` supprimé) : mappés vers "pro" dans LEGACY_PRICE_TO_PLAN (garde-fou anti-downgrade).
- Trial : 15 jours sur Pro et Business

## Variables d'environnement

ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CRON_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, RESEND_WEBHOOK_SECRET, UNSUBSCRIBE_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_JWT_SECRET, NOTION_API_KEY, NOTION_DATABASE_ID, NOTION_USERS_DB_ID, NOTION_ACTIVITY_DB_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_USER_ID, TELEGRAM_JADE_BOT_TOKEN, TELEGRAM_JADE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL

## Base de données

- **profiles** : id, email, plan (free/pro/business/enterprise), full_name, email_verified, email_verified_at, stripe_customer_id, stripe_subscription_id, stripe_subscription_status (dernier statut Stripe connu, NULL = pas d'abonnement), trial_ends_at, referral_code, referred_by, created_at
- **newsletter_config** : user_id, topics, custom_brief, sources, recipients, frequency, send_day, send_hour, custom_topics, edit_mode (auto/editor), pending_draft_id, article_count (3-12, NULL = défaut du plan)
- **newsletters** : id, user_id, content, subject, status, generated_at, created_at, sent_at, recipient_count, original_content, original_subject (instantané pour le Réinitialiser de l'éditeur)

### Mode Éditeur (relecture avant envoi — Business/Enterprise)
- edit_mode="editor" : le cron génère un brouillon (pending_draft_id), n'envoie rien, attend la validation dans /dashboard/editor
- /api/send libère pending_draft_id ; /api/generate/article régénère un bloc ; /api/newsletters/draft sauvegarde/reset
- Script de secours : node scripts/trigger-editor-draft.js <user_id> [--force] (contourne le timeout Vercel 60s)
- Longueur : article_count (3-12) via resolveArticleCount(plan, configured) — gating serveur canCustomizeLength
- **Plafond serverless (anti-timeout Vercel 60s)** : la génération serverless (cron + /api/generate) est plafonnée par MODÈLE via resolveServerlessArticleCount(plan, configured, model). Opus (Business/Enterprise) = 4 articles max (mesuré : 10 art = 101s, 4 art = ~43s ; ~9,7s/article). Sonnet/Haiku non plafonnés. Conséquence : les newsletters AUTO Business/Enterprise sortent à 4 articles ; l'utilisateur complète jusqu'à sa longueur voulue via l'éditeur (bouton "Ajouter un article" → /api/generate/article target="new_article", 1 article/appel). Le script trigger-editor-draft.js n'est PAS plafonné.
- **newsletter_events** : id, newsletter_id, recipient_email, event_type (opened/clicked/delivered/bounced/complained), created_at
- **referrals** : id, referrer_id, referee_id, code, status (pending/converted), created_at, converted_at, expires_at
- **activity_log** : id, user_id, user_email, action_type, action_label, details, metadata, synced_to_notion, created_at
- **lifecycle_emails** : id, user_id, email_type, sent_at (UNIQUE user_id+email_type)
- **admin_sessions** : id, email, ip_address, user_agent, created_at, expires_at
- **telegram_messages** : id, bot_name, chat_id, role, content, intent, created_at
- **stripe_webhook_events** : id (= Stripe event.id, PK), type, received_at — dédup/idempotence des webhooks Stripe (RLS activée, service_role only, aucune policy)
- Storage : bucket "logos" (public) pour logos custom Business+
- RLS activée sur TOUTES les tables — API routes utilisent supabaseAdmin (service_role)

## Plans et limites

| | Free | Pro (19€) | Business (49€) | Enterprise |
|---|---|---|---|---|
| Newsletters/mois | 1 | Illimité | Illimité | Illimité |
| Fréquence | Mensuelle | Hebdo-mensuelle | Quotidienne-mensuelle | Quotidienne-mensuelle |
| Destinataires | 1 | 10 | 50 | Illimité |
| Custom topics/sources | Non | Oui | Oui | Oui |
| Logo personnalisé | Non | Non | Oui | Oui |
| Trial | - | 15j | 15j | - |

## Lifecycle emails — Map event-based

Refonte 2026-05 : déclencheurs basés sur l'expérience produit vécue (et non sur le calendrier absolu depuis l'inscription). Cron horaire dans `app/api/cron/lifecycle/route.ts`. Flag `LIFECYCLE_EMAILS_PAUSED` pour mise en pause manuelle.

| ID | Déclencheur | Template |
|---|---|---|
| `activation_no_verify` | 24h après signup, email non vérifié | `VerifyReminderEmail` |
| `activation_no_config` | 48h après vérif, aucun topic configuré | `ConfigReminderEmail` |
| `engagement_after_3nl` | Après 3 newsletters envoyées au user | `EngagementFeedbackEmail` (pas de CTA, reply-to noe@) |
| `conversion_limit_reached` | Free/Pro qui atteint sa quota mensuelle (clé mensuelle) | `LimitReachedEmail` |
| `trial_j3` / `j1` / `j0` | 3j / 1j / 0j avant fin trial (transactionnel Stripe) | `TrialReminderEmail` |
| `retention_no_newsletter_30d` | Dernière NL > 30j (clé mensuelle) | `RetentionInactiveEmail` |
| `retention_unopened_5nl` | 5 dernières NL non ouvertes par owner (clé mensuelle) | `RetentionUnopenedEmail` |

**Email de bienvenue** : `WelcomeEmail` envoyé via `/api/welcome-email` à l'inscription, HORS du cron lifecycle.

**Tracking opens** : webhook Resend `/api/webhooks/resend` enregistre `email.opened/clicked/delivered` dans `newsletter_events` (matching newsletter via subject + sent_at desc).

**Route de test** : `POST /api/admin/test-lifecycle` (auth admin requise) envoie n'importe quel template à l'admin sans toucher à `lifecycle_emails`.

## Sécurité — Règles critiques

- supabaseAdmin (service_role) dans TOUTES les API routes — jamais le client anon côté serveur
- getAuthenticatedUser() (lib/auth.ts) pour vérifier le Bearer token
- Double opt-in HMAC-SHA256 obligatoire avant accès dashboard
- Rate limiting Upstash Redis sur toutes les routes publiques
- Webhooks Stripe/Resend : vérification signature cryptographique
- Emails jetables bloqués (isDisposableEmail)

## Problèmes résolus (NE PAS REFAIRE)

1. **framer-motion** : NE JAMAIS UTILISER — casse le build
2. **Build local** : NE JAMAIS tenter — push direct via git
3. **Tirets longs "---"** : remplacés par "-" partout
4. **i18n** : imports statiques uniquement (les dynamiques cassent le build)
5. **JSON truncation** : max_tokens à 4096 pour Haiku (pas 1500)
6. **Cite tags** : cleanCiteTags() nettoie les balises cite de Claude
7. **Couleur** : tout le projet est en #005058 teal (plus de bleu #2563EB)
8. **console.log** : tous supprimés en prod
9. **Rate limiting** : Upstash Redis (pas in-memory, incompatible serverless)
10. **RLS** : activée sur les 7 tables avec 26 policies
11. **Prix annuels** : afficher 190€/an et 490€/an (pas mensuel divisé)
12. **retention_no_newsletter_30d** : fenêtre à 35-36j (pas 30-31). Le cron lifecycle (minuit) tournait avant le cron newsletter (6-7h), envoyant un faux email de rétention aux plans mensuels le jour même de leur envoi. 35j donne une marge de 5 jours.
13. **REFERRAL_PRICES = amount_off (remise), PAS prix cible** : dans app/api/checkout, la valeur est le montant DÉDUIT en centimes (Stripe coupon amount_off), pas le prix payé par le filleul. Doit rester < prix plein sinon 1er mois à 0€. Valeurs actuelles : Pro 299 (9,99€→7€), Business 1000 (49€→39€). Tests verrouillent ces montants dans checkout.test.ts.
14. **Envoi des newsletters = batch Resend** : toujours passer par sendNewsletterEmails (lib/send-newsletter-batch), jamais une boucle resend.emails.send par destinataire (timeout Vercel 60s + rate limit Resend 2 req/s). Le helper rend le HTML par destinataire en parallèle, envoie par tranches de 100, pose les tags newsletter_id/user_id (attribution webhooks) et retourne sentCount (à utiliser pour recipient_count).
15. **Plan Stripe = f(statut, prix), pas f(prix)** : planForSubscriptionStatus (lib/price-ids) — grâce sur active/trialing/past_due, coupure free sur unpaid/canceled/paused. Ne jamais réécrire plan depuis le seul price ID dans un webhook.
16. **Attribution webhooks Resend par tags** : le webhook lit le tag newsletter_id (objet plat côté webhook, tableau côté API d'envoi). Fallback subject scopé par destinataire, jamais global ; si ambigu, ne rien insérer. Vocabulaire : pixel écrit "open"/"click" (lu par analytics), webhook écrit "opened"/"clicked" (lu par retention) — deux paires cohérentes, NE PAS unifier sans gérer le double comptage.
17. **Variant dark Tailwind recâblé** : @custom-variant dark sur [data-theme="dark"] dans globals.css — les classes dark: suivent le toggle du site, pas la préférence OS. UI admin : tokens du thème (--success/--error/--accent), pas de teintes Tailwind multi-couleurs.

## Règles de travail

- Ne JAMAIS build en local — push via git, vérifier Vercel
- Ne pas utiliser framer-motion ni tirets longs "---"
- Toujours préciser les clés de traduction FR et EN
- Vérifier les déploiements Vercel après chaque push
- Pour le détail des intégrations (Notion, Telegram, admin, parrainage) → `/infra`

## Priorités actuelles

### Haute (acquisition)
- [ ] Séquence cold email dirigeants PME
- [ ] Contenu LinkedIn régulier
- [ ] Reddit r/Entrepreneur post
- [ ] G2, Capterra, Appvizer

### Moyenne (produit)
- [ ] Template email éditorial V3
- [ ] Collecter de vrais avis clients

### Basse (évolution)
- [ ] GEO Phase 4 : PR, articles invités
- [ ] Dashboard analytics avancé
