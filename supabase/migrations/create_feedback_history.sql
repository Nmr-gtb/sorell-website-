ALTER TABLE newsletter_config ADD COLUMN IF NOT EXISTS feedback_history JSONB DEFAULT '[]';
