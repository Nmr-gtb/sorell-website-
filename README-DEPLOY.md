# Déploiement Sorell

## Variables d'environnement Vercel

Ajouter ces variables dans Vercel > Settings > Environment Variables :

- NEXT_PUBLIC_SUPABASE_URL = (voir Supabase > Settings > API > URL)
- NEXT_PUBLIC_SUPABASE_ANON_KEY = (voir Supabase > Settings > API > anon public)

## Supabase Auth Configuration

Dans Supabase > Authentication > URL Configuration :
- Site URL : https://sorell.fr
- Redirect URLs :
  - https://sorell.fr/auth/callback
  - https://sorell.fr/login
  - http://localhost:3000/auth/callback (pour le dev local)
