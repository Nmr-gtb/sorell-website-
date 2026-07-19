-- Attribution d'acquisition des inscrits (SEO / IA / social / direct...).
-- Le client capture le premier contact (referrer, landing, UTM) dans
-- localStorage, le passe dans les métadonnées du signUp, et le trigger
-- handle_new_user le copie ici. Répond à « d'où viennent mes utilisateurs ? ».

alter table public.profiles
  add column if not exists acquisition jsonb;

comment on column public.profiles.acquisition is
  'Premier contact avant inscription : {source, referrer, landing, utm, captured_at}. NULL = inscrit avant la mise en place (juillet 2026) ou localStorage indisponible.';

-- Le trigger copie désormais aussi l''acquisition depuis les métadonnées.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, full_name, email, acquisition)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->'acquisition'
  );
  return new;
end;
$function$;
