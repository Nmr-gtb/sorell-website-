-- Historique des conversations Telegram (Eva + Jade)
-- Permet le multi-turn et la mémoire conversationnelle

CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name VARCHAR(20) NOT NULL CHECK (bot_name IN ('eva', 'jade')),
  chat_id BIGINT NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour charger les derniers messages rapidement
CREATE INDEX idx_telegram_messages_bot_chat ON telegram_messages (bot_name, chat_id, created_at DESC);

-- Nettoyage automatique des messages > 30 jours (évite l'accumulation)
-- À lancer via un CRON mensuel ou manuellement
-- DELETE FROM telegram_messages WHERE created_at < NOW() - INTERVAL '30 days';

-- RLS : pas nécessaire car accédé uniquement via supabaseAdmin (service_role)
-- La table n'est jamais accédée côté client
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
