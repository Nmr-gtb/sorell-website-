-- =============================================================================
-- MIGRATION : Backfill lifecycle_emails pour la refonte 2026-05
-- =============================================================================
-- Date    : 2026-05-19
-- But     : Empecher les users existants d'etre spammes avec les nouveaux
--           email_types introduits par la refonte lifecycle event-based.
--           Les nouveaux signups apres cette migration recevront normalement
--           les nouveaux emails (ils ne sont pas dans le SELECT).
--           Les emails a cle mensuelle sont bloques uniquement pour le mois
--           courant. Le mois suivant, le tracking redemarre normalement.
-- IMPORTANT : appliquer cette migration JUSTE AVANT de flipper le flag
--             LIFECYCLE_EMAILS_PAUSED = false. Si applique trop tot, la cle
--             mensuelle ne correspondra plus au mois reel d'activation.
-- =============================================================================

-- ─── 1. activation_no_verify ────────────────────────────────────────────
-- One-shot. On marque tous les users qui sont DEJA passes la fenetre 24h
-- ou qui ont deja verifie. Les inscrits dans les dernieres 25h restent
-- eligibles pour recevoir cette relance.
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT id, 'activation_no_verify', NOW()
FROM profiles
WHERE email_verified = true
   OR created_at < NOW() - INTERVAL '25 hours'
ON CONFLICT (user_id, email_type) DO NOTHING;

-- ─── 2. activation_no_config ────────────────────────────────────────────
-- One-shot. On marque les users qui ont DEJA configure leur newsletter
-- (donc plus eligibles) OU ceux qui ont verifie leur email depuis +49h
-- (donc passes la fenetre de declenchement de toute facon).
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT p.id, 'activation_no_config', NOW()
FROM profiles p
WHERE EXISTS (
        SELECT 1
        FROM newsletter_config nc
        WHERE nc.user_id = p.id
          AND nc.topics IS NOT NULL
          AND jsonb_array_length(nc.topics) > 0
      )
   OR (
        p.email_verified = true
        AND p.email_verified_at IS NOT NULL
        AND p.email_verified_at < NOW() - INTERVAL '49 hours'
      )
ON CONFLICT (user_id, email_type) DO NOTHING;

-- ─── 3. engagement_after_3nl ────────────────────────────────────────────
-- One-shot. On marque tous les users qui ont DEJA recu >= 3 newsletters.
-- Les nouveaux qui n'ont pas encore atteint 3 newsletters recevront
-- l'email normalement quand ils franchiront le seuil.
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT user_id, 'engagement_after_3nl', NOW()
FROM (
  SELECT user_id
  FROM newsletters
  WHERE sent_at IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) >= 3
) AS engaged_users
ON CONFLICT (user_id, email_type) DO NOTHING;

-- ─── 4. conversion_limit_reached (cle mensuelle) ────────────────────────
-- On marque le mois courant pour tous les users existants. Le mois suivant,
-- la cle change automatiquement et le tracking redemarre.
-- Format de la cle : conversion_limit_reached_YYYY_M (M en 0-indexed,
-- pour matcher JS getMonth()).
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT
  id,
  'conversion_limit_reached_'
    || EXTRACT(YEAR FROM NOW())::int
    || '_'
    || (EXTRACT(MONTH FROM NOW())::int - 1)::text,
  NOW()
FROM profiles
ON CONFLICT (user_id, email_type) DO NOTHING;

-- ─── 5. retention_no_newsletter_30d (cle mensuelle) ─────────────────────
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT
  id,
  'retention_no_newsletter_30d_'
    || EXTRACT(YEAR FROM NOW())::int
    || '_'
    || (EXTRACT(MONTH FROM NOW())::int - 1)::text,
  NOW()
FROM profiles
ON CONFLICT (user_id, email_type) DO NOTHING;

-- ─── 6. retention_unopened_5nl (cle mensuelle) ──────────────────────────
INSERT INTO lifecycle_emails (user_id, email_type, sent_at)
SELECT
  id,
  'retention_unopened_5nl_'
    || EXTRACT(YEAR FROM NOW())::int
    || '_'
    || (EXTRACT(MONTH FROM NOW())::int - 1)::text,
  NOW()
FROM profiles
ON CONFLICT (user_id, email_type) DO NOTHING;

-- =============================================================================
-- FIN DE LA MIGRATION
-- Note : trial_j3 / trial_j1 / trial_j0 n'ont PAS besoin de backfill car
-- les email_types n'ont pas change entre l'ancienne et la nouvelle version.
-- La contrainte UNIQUE(user_id, email_type) empeche deja les doublons.
-- =============================================================================
