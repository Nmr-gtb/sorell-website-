-- ---------------------------------------------------------------------------
-- Mode Auto vs Mode Éditeur pour les newsletters
-- ---------------------------------------------------------------------------
-- edit_mode        : "auto" (comportement historique : le cron génère ET envoie)
--                    ou "editor" (le cron génère un brouillon qui attend la
--                    validation manuelle — réservé aux plans Business/Enterprise).
-- pending_draft_id : ID du brouillon en attente de validation. Tant qu'il est
--                    renseigné, le cron ne regénère rien pour cette config.
--                    Remis à NULL par /api/send après validation, ou
--                    automatiquement si le brouillon est supprimé (ON DELETE SET NULL).
--
-- RLS : les policies existantes de newsletter_config (select/insert/update par
-- propriétaire, auth.uid() = user_id) s'appliquent aux nouvelles colonnes —
-- aucune policy supplémentaire n'est nécessaire.

ALTER TABLE newsletter_config
  ADD COLUMN IF NOT EXISTS edit_mode TEXT NOT NULL DEFAULT 'auto';

ALTER TABLE newsletter_config
  ADD COLUMN IF NOT EXISTS pending_draft_id UUID REFERENCES newsletters(id) ON DELETE SET NULL;

-- Garde-fou : seules les valeurs "auto" et "editor" sont acceptées.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_config_edit_mode_check'
  ) THEN
    ALTER TABLE newsletter_config
      ADD CONSTRAINT newsletter_config_edit_mode_check CHECK (edit_mode IN ('auto', 'editor'));
  END IF;
END $$;
