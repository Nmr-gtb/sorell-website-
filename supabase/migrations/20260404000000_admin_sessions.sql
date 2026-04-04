-- Admin sessions table for login audit trail
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS enabled: block all access via anon/authenticated roles
-- Only service_role (supabaseAdmin) can read/write this table
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated roles
-- service_role bypasses RLS by default

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_admin_sessions_created_at ON admin_sessions (created_at DESC);
