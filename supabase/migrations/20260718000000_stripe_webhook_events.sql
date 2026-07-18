-- Idempotence des webhooks Stripe.
-- Stripe rejoue un événement tant qu'il n'a pas reçu de réponse 200 (timeout,
-- erreur transitoire...). Sans déduplication, un même event.id peut être traité
-- plusieurs fois (double notification, double conversion de parrainage, etc.).
-- Cette table sert de registre : le webhook réserve l'event.id avant traitement
-- et court-circuite les rejeux déjà enregistrés.

create table if not exists public.stripe_webhook_events (
  id text primary key,               -- Stripe event.id (ex: evt_1A2b3C...)
  type text not null,                -- event.type (ex: checkout.session.completed)
  received_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Déduplication/idempotence des webhooks Stripe. id = Stripe event.id.';

-- RLS activée sans policy : seul le service_role (utilisé côté serveur par le
-- webhook via supabaseAdmin) contourne RLS. anon et authenticated n'ont aucun
-- accès à cette table.
alter table public.stripe_webhook_events enable row level security;
