-- ---------------------------------------------------------------------------
-- Longueur de newsletter personnalisable (plans Business/Enterprise)
-- ---------------------------------------------------------------------------
-- article_count : nombre d'articles souhaité par newsletter (3 à 12).
-- NULL = défaut du plan (free/pro : 5, business : 8, enterprise : 10).
-- Le gating premium est appliqué côté serveur (resolveArticleCount dans
-- lib/plans.ts) : un plan non éligible retombe sur le défaut du plan même
-- si la colonne est renseignée.
--
-- RLS : policies existantes de newsletter_config (par propriétaire) — rien à ajouter.

ALTER TABLE newsletter_config
  ADD COLUMN IF NOT EXISTS article_count INT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_config_article_count_check'
  ) THEN
    ALTER TABLE newsletter_config
      ADD CONSTRAINT newsletter_config_article_count_check
      CHECK (article_count IS NULL OR (article_count >= 3 AND article_count <= 12));
  END IF;
END $$;
