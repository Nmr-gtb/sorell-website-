-- =============================================================================
-- BASELINE MIGRATION - Sorell SaaS
-- =============================================================================
-- Date    : 2026-04-03
-- Auteur  : Claude Code (baseline snapshot)
-- But     : Documenter le schema existant de la base de donnees Supabase.
--           Cette migration est un snapshot de l'etat actuel de la BDD.
--           Elle est conçue pour etre idempotente (CREATE TABLE IF NOT EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
-- Profil utilisateur, cree automatiquement a l'inscription via Supabase Auth.
-- La colonne id correspond a auth.uid().
CREATE TABLE IF NOT EXISTS profiles (
    id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email                   TEXT,
    plan                    TEXT DEFAULT 'free',
    full_name               TEXT,
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    trial_ends_at           TIMESTAMPTZ,
    referral_code           VARCHAR UNIQUE,
    referred_by             UUID REFERENCES profiles(id),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. newsletter_config
-- ---------------------------------------------------------------------------
-- Configuration de la newsletter pour chaque utilisateur (1:1 avec profiles).
CREATE TABLE IF NOT EXISTS newsletter_config (
    user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    topics          TEXT[],
    custom_brief    TEXT,
    sources         TEXT,
    recipients      JSONB,
    frequency       TEXT,
    send_day        TEXT,
    send_hour       INT,
    custom_topics   TEXT[]
);

ALTER TABLE newsletter_config ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. newsletters
-- ---------------------------------------------------------------------------
-- Historique des newsletters generees et envoyees.
CREATE TABLE IF NOT EXISTS newsletters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content         JSONB,
    subject         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,
    recipient_count INT
);

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. recipients
-- ---------------------------------------------------------------------------
-- Liste des destinataires par utilisateur.
CREATE TABLE IF NOT EXISTS recipients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. newsletter_events
-- ---------------------------------------------------------------------------
-- Tracking des evenements (opens, clicks, bounces, complaints) par newsletter.
CREATE TABLE IF NOT EXISTS newsletter_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id   UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    recipient_email TEXT,
    event_type      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. lifecycle_emails
-- ---------------------------------------------------------------------------
-- Suivi des emails de cycle de vie envoyes (onboarding, trial, limites).
-- La contrainte UNIQUE empeche d'envoyer deux fois le meme type a un utilisateur.
CREATE TABLE IF NOT EXISTS lifecycle_emails (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_type  TEXT,
    sent_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, email_type)
);

ALTER TABLE lifecycle_emails ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7. referrals
-- ---------------------------------------------------------------------------
-- Systeme de parrainage : parrain (referrer) invite un filleul (referee).
-- Le lien expire apres 30 jours. Statuts : pending, converted.
CREATE TABLE IF NOT EXISTS referrals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referee_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    code         VARCHAR UNIQUE,
    status       TEXT DEFAULT 'pending',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. demo_cache
-- ---------------------------------------------------------------------------
-- Cache des demos generees pour eviter de regenerer a chaque visite.
CREATE TABLE IF NOT EXISTS demo_cache (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector       TEXT,
    lang         TEXT,
    content      JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE demo_cache ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 9. waitlist
-- ---------------------------------------------------------------------------
-- Liste d'attente pour les inscriptions.
CREATE TABLE IF NOT EXISTS waitlist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FIN DE LA MIGRATION BASELINE
-- =============================================================================
