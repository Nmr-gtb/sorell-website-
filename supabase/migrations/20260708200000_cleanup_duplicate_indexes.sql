-- ---------------------------------------------------------------------------
-- Nettoyage des index dupliqués/redondants + index manquant pour le webhook Resend
-- ---------------------------------------------------------------------------
-- Chaque doublon fait payer un coût d'écriture à chaque INSERT/UPDATE sans
-- bénéfice de lecture (un autre index couvre déjà la requête). Vérifié en live
-- via pg_indexes avant suppression. Opérations réversibles (les index peuvent
-- être recréés) et non destructrices de données.

-- demo_cache : idx non-unique redondant avec la contrainte UNIQUE(sector)
DROP INDEX IF EXISTS idx_demo_cache_sector;

-- lifecycle_emails : doublon exact de la contrainte UNIQUE(user_id,email_type)
-- + index (user_id) seul, déjà couvert en préfixe par l'index composite
DROP INDEX IF EXISTS idx_lifecycle_emails_user_type;
DROP INDEX IF EXISTS idx_lifecycle_emails_user_id;

-- newsletter_events : doublon exact sur (newsletter_id) + (newsletter_id,event_type)
-- déjà couvert en préfixe par idx_newsletter_events_lookup(newsletter_id,event_type,recipient_email)
DROP INDEX IF EXISTS idx_newsletter_events_newsletter;
DROP INDEX IF EXISTS idx_newsletter_events_nl_type;

-- referrals : doublons exacts (referee_id et referrer_id indexés deux fois)
DROP INDEX IF EXISTS idx_referrals_referee;
DROP INDEX IF EXISTS idx_referrals_referrer;

-- profiles : index partiel redondant avec la contrainte UNIQUE(referral_code)
DROP INDEX IF EXISTS idx_profiles_referral_code;

-- Index manquant : le webhook Resend matche les newsletters par subject + sent_at
-- (opened/clicked/delivered) — sans index c'était un seq scan à chaque ouverture.
CREATE INDEX IF NOT EXISTS idx_newsletters_subject_sent
  ON newsletters (subject, sent_at DESC)
  WHERE sent_at IS NOT NULL;
