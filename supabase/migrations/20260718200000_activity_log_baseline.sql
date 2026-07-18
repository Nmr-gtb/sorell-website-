-- Baseline manquante : activity_log.
-- La table a été créée à la main dans Supabase sans migration versionnée : un
-- environnement recréé depuis les migrations (branche Supabase, dev local, PRA)
-- n'avait donc ni la table ni la journalisation d'activité. Cette migration est
-- idempotente (no-op en prod où tout existe déjà) et reproduit le schéma prod
-- exact relevé le 18/07/2026 : colonnes, index et policy RLS.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  action_type text not null,
  action_label text not null,
  details text,
  metadata jsonb default '{}'::jsonb,
  synced_to_notion boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_activity_log_user_id on public.activity_log (user_id);
create index if not exists idx_activity_log_action_type on public.activity_log (action_type);
create index if not exists idx_activity_log_created_at on public.activity_log (created_at desc);
create index if not exists idx_activity_log_not_synced on public.activity_log (synced_to_notion) where (synced_to_notion = false);

alter table public.activity_log enable row level security;

-- Policy service_role uniquement (les API routes écrivent via supabaseAdmin).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'activity_log'
      and policyname = 'Service role full access on activity_log'
  ) then
    create policy "Service role full access on activity_log"
      on public.activity_log for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
