-- =============================================================================
-- MIGRATION : Lifecycle event-based triggers (email_verified_at + open tracking)
-- =============================================================================
-- Date    : 2026-05-19
-- But     : Pre-requis infra pour la refonte des emails lifecycle :
--           - activation_no_config : declencher 48h apres verification email
--             (au lieu de 24h apres creation du compte, qui ignore le double opt-in)
--           - retention_unopened_5nl : detecter les users dont les 5 dernieres
--             newsletters n'ont pas ete ouvertes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ajouter email_verified_at sur profiles
-- ---------------------------------------------------------------------------
-- Permet de savoir QUAND un user a verifie son email, pas juste s'il l'a fait.
-- Necessaire pour declencher activation_no_config (48h apres verification).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 2. Backfill : users deja verifies heritent de created_at comme proxy
-- ---------------------------------------------------------------------------
-- Approximation acceptable car en pratique la verification arrive dans les
-- minutes/heures suivant l'inscription. Les users deja passes le J+2 ne
-- declencheront de toute facon plus la relance activation_no_config.
UPDATE profiles
SET email_verified_at = created_at
WHERE email_verified = true AND email_verified_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Index sur email_verified_at pour les queries du cron lifecycle
-- ---------------------------------------------------------------------------
-- Index partiel : on n'index que les users verifies (les autres ne sont jamais
-- requetes par cette colonne).
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified_at
  ON profiles (email_verified_at)
  WHERE email_verified = true;

-- ---------------------------------------------------------------------------
-- 4. Index sur newsletter_events pour les queries d'ouvertures
-- ---------------------------------------------------------------------------
-- Composite : permet de checker rapidement "est-ce que ce destinataire a
-- ouvert cette newsletter" pour le calcul de retention_unopened_5nl.
CREATE INDEX IF NOT EXISTS idx_newsletter_events_lookup
  ON newsletter_events (newsletter_id, event_type, recipient_email);

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================
