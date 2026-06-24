# Sorell — Détail infrastructure & intégrations

Contexte chargé à la demande pour travailler sur les intégrations externes.

## Système de newsletters

### Flow
1. CRON chaque heure (cron-job.org → /api/cron)
2. Vérifie fréquence/jour/heure par utilisateur
3. Génère via Claude Haiku 4.5 + web search (max 5 recherches)
4. Contenu JSON nettoyé (cleanCiteTags)
5. Envoi via Resend à tous les destinataires
6. Sauvegarde dans table newsletters

### Anti-doublons (3 niveaux)
1. Titres des 3 dernières newsletters dans le prompt
2. Règles de diversité (min 3 catégories)
3. Stratégie de recherche web variée

### Rate limiting
- /api/generate : 30 req/h par user
- /api/send : 30 req/h
- /api/welcome : 5 emails/h par adresse
- /api/chat : 30 msg/h + 100/jour (auth) / 15 msg/h + 40/jour (anon)
- Config dans lib/ratelimit.ts

## Chatbot Soly

- Widget dans app/layout.tsx — 2 modes : general (FAQ) et brief (guide rédaction)
- Event system : `soly:open-brief` + `openSolyBrief(callback)`
- API : /api/chat (Haiku 4.5, max_tokens: 500)
- Brief mode : 5 questions → génère brief avec marqueurs `---BRIEF_READY---` / `---END_BRIEF---`
- Auto-ouverture 5s première visite (localStorage `soly_shown`)

## Parrainage

- Pro/Business uniquement
- Parrain : +15 jours gratuits (extension billing Stripe via trial_end)
- Filleul : -20% premier mois (coupon Stripe — Pro: 1500 centimes, Business: 3900 centimes)
- Max 3 conversions/mois par parrain — lien expire après 30 jours
- Flow : URL `?ref=CODE` → localStorage `sorell_ref` → POST /api/referral (pending) → checkout crée coupon → webhook convertit + récompense parrain
- Fichiers : api/referral, api/checkout, api/webhooks/stripe, auth/callback, connexion/page, ReferralBlock

## Notion CRM

- 3 databases : Utilisateurs (NOTION_USERS_DB_ID), Activité (NOTION_ACTIVITY_DB_ID), Tâches (NOTION_DATABASE_ID)
- Source vérité : Supabase (activity_log) → sync fire-and-forget vers Notion
- CRON quotidien 11h : syncPendingActivities() + syncAllUsersToNotion()
- 15 types d'actions : inscription, verification_email, changement_plan, paiement_echoue, generation_newsletter, envoi_newsletter, ouverture_email, clic_email, bounce, ajout_destinataire, suppression_destinataire, changement_config, email_lifecycle, conversion_parrainage, suppression_compte
- Fichiers : lib/activity-log.ts, lib/notion-sync.ts, api/activity

## Bots Telegram

### Eva (principal)
- Tâches Notion (CRUD), stats business (MRR, signups, conversion), conversation libre
- Messages proactifs : résumé 8h, alertes deadline 9h, alertes business 10h
- Fichiers : lib/notion-tasks.ts, lib/task-parser.ts, lib/eva-chat.ts, lib/eva-stats.ts

### Jade (monitoring)
- Check sorell.fr toutes les 15 min, alerte si DOWN
- Rapport hebdo dimanche 9h
- Fichier : lib/eva-monitor.ts

### CRON Telegram
- GET /api/cron/telegram?secret=CRON_SECRET (cron-job.org, toutes les 15 min)
- 6 actions : site check, résumé quotidien, rappels deadline, rapport hebdo, alertes business, sync Notion

## Dashboard Admin

- Accès : /admin-login — Auth JWT indépendante (bcrypt + jsonwebtoken)
- Cookie : admin_token (httpOnly, secure, sameSite strict, 7j)
- Rate limiting : 5 tentatives / 15 min
- Pages : /admin (KPIs + Recharts), /admin/users (liste + détail), /admin/newsletters, /admin/lifecycle, /admin/prompts
- Middleware protège /admin/* et /api/admin/*
- Dépendances : jsonwebtoken, bcryptjs, recharts

## Emails — Adresses par usage

| Adresse | Usage |
|---------|-------|
| newsletters@sorell.fr | Newsletters automatiques |
| noreply@sorell.fr | Transactionnel (bienvenue, vérification, lifecycle, paiement) |
| noe@sorell.fr | Support, replyTo |
| laurent@sorell-group.fr | Cold email (Emelia) |
| matis@sorell-group.fr | Cold email (Emelia) |

Anti-spam : SPF, DKIM, DMARC sur sorell.fr et sorell-group.fr. Domaine cold email isolé.
