-- Statut d'abonnement Stripe persisté sur le profil.
-- Sert au gating du plan effectif (grâce past_due vs coupure unpaid/canceled)
-- et à l'audit support ("pourquoi ce compte est-il repassé en free ?").
-- Renseigné par le webhook customer.subscription.updated ; NULL pour les
-- comptes sans abonnement (free) ou créés avant cette migration.

alter table public.profiles
  add column if not exists stripe_subscription_status text;

comment on column public.profiles.stripe_subscription_status is
  'Dernier statut Stripe connu de l''abonnement (active, trialing, past_due, unpaid, canceled...). NULL = pas d''abonnement suivi.';
