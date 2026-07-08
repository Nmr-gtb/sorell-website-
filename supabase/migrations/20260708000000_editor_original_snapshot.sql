-- ---------------------------------------------------------------------------
-- Mode Éditeur : instantané de la version générée d'origine
-- ---------------------------------------------------------------------------
-- original_content / original_subject : copie figée du contenu tel que généré
-- par le cron (branche éditeur). Jamais modifiés par les éditions de brouillon.
-- Permettent le bouton "Réinitialiser" de l'éditeur (retour à la forme de base).
--
-- RLS : policies existantes de newsletters (par propriétaire) — rien à ajouter.

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS original_content JSONB;

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS original_subject TEXT;
