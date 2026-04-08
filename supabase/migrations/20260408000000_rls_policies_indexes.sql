-- =============================================================================
-- MIGRATION : RLS Policies + Index + Colonnes manquantes
-- =============================================================================
-- Date    : 2026-04-08
-- But     : Documenter les RLS policies existantes, ajouter les index manquants,
--           et les colonnes/tables qui ont ete creees manuellement.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. Colonnes manquantes dans profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- ---------------------------------------------------------------------------
-- B. Colonnes manquantes dans newsletter_config
-- ---------------------------------------------------------------------------
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS text_color TEXT;
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS body_text_color TEXT;
ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- C. Colonnes manquantes dans newsletters
-- ---------------------------------------------------------------------------
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

-- ---------------------------------------------------------------------------
-- D. Colonne manquante dans recipients
-- ---------------------------------------------------------------------------
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';

-- Contrainte UNIQUE pour upsert (user_id, email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'recipients_user_id_email_unique'
  ) THEN
    CREATE UNIQUE INDEX recipients_user_id_email_unique ON recipients (user_id, email);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- E. Table promo_codes (manquante dans les migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT UNIQUE NOT NULL,
    type             TEXT NOT NULL CHECK (type IN ('free_months', 'percentage', 'fixed')),
    value            INT NOT NULL,
    applicable_plans TEXT[] DEFAULT '{}',
    max_uses         INT,
    current_uses     INT DEFAULT 0,
    expires_at       TIMESTAMPTZ,
    active           BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access (same as admin_sessions)

-- ---------------------------------------------------------------------------
-- F. RLS Policies
-- ---------------------------------------------------------------------------

-- profiles : les utilisateurs voient et modifient uniquement leur propre profil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own') THEN
    CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert_own') THEN
    CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- newsletter_config : acces par proprietaire
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletter_config_select_own') THEN
    CREATE POLICY newsletter_config_select_own ON newsletter_config FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletter_config_update_own') THEN
    CREATE POLICY newsletter_config_update_own ON newsletter_config FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletter_config_insert_own') THEN
    CREATE POLICY newsletter_config_insert_own ON newsletter_config FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- newsletters : acces par proprietaire
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletters_select_own') THEN
    CREATE POLICY newsletters_select_own ON newsletters FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletters_insert_own') THEN
    CREATE POLICY newsletters_insert_own ON newsletters FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletters_update_own') THEN
    CREATE POLICY newsletters_update_own ON newsletters FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletters_delete_own') THEN
    CREATE POLICY newsletters_delete_own ON newsletters FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- recipients : acces par proprietaire
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'recipients_select_own') THEN
    CREATE POLICY recipients_select_own ON recipients FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'recipients_insert_own') THEN
    CREATE POLICY recipients_insert_own ON recipients FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'recipients_update_own') THEN
    CREATE POLICY recipients_update_own ON recipients FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'recipients_delete_own') THEN
    CREATE POLICY recipients_delete_own ON recipients FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- newsletter_events : acces en lecture par proprietaire de la newsletter
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletter_events_select_own') THEN
    CREATE POLICY newsletter_events_select_own ON newsletter_events FOR SELECT
    USING (
      newsletter_id IN (SELECT id FROM newsletters WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'newsletter_events_insert_any') THEN
    CREATE POLICY newsletter_events_insert_any ON newsletter_events FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- lifecycle_emails : acces par proprietaire
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lifecycle_emails_select_own') THEN
    CREATE POLICY lifecycle_emails_select_own ON lifecycle_emails FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- referrals : acces par parrain ou filleul
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'referrals_select_own') THEN
    CREATE POLICY referrals_select_own ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'referrals_insert_any') THEN
    CREATE POLICY referrals_insert_any ON referrals FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'referrals_update_own') THEN
    CREATE POLICY referrals_update_own ON referrals FOR UPDATE
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
  END IF;
END $$;

-- demo_cache : lecture publique (contenu demo non sensible)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'demo_cache_select_any') THEN
    CREATE POLICY demo_cache_select_any ON demo_cache FOR SELECT USING (true);
  END IF;
END $$;

-- waitlist : insertion publique
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waitlist_insert_any') THEN
    CREATE POLICY waitlist_insert_any ON waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- G. Index sur les colonnes filtrees frequemment
-- ---------------------------------------------------------------------------

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles (referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles (plan);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles (email_verified);

-- newsletters
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters (user_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters (status);
CREATE INDEX IF NOT EXISTS idx_newsletters_user_status ON newsletters (user_id, status);
CREATE INDEX IF NOT EXISTS idx_newsletters_sent_at ON newsletters (sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletters_generated_at ON newsletters (generated_at DESC) WHERE generated_at IS NOT NULL;

-- recipients
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients (user_id);

-- newsletter_events
CREATE INDEX IF NOT EXISTS idx_newsletter_events_newsletter_id ON newsletter_events (newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_events_type ON newsletter_events (event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_events_nl_type ON newsletter_events (newsletter_id, event_type);

-- lifecycle_emails
CREATE INDEX IF NOT EXISTS idx_lifecycle_emails_user_id ON lifecycle_emails (user_id);

-- referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals (referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals (code);

-- demo_cache
CREATE INDEX IF NOT EXISTS idx_demo_cache_sector ON demo_cache (sector);

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================
