# Déploiement Sorell

## Variables d'environnement Vercel

Ajouter ces variables dans Vercel > Settings > Environment Variables :

- NEXT_PUBLIC_SUPABASE_URL = https://clekdnuhidvfpdoytmso.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZWtkbnVoaWR2ZnBkb3l0bXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjM5MDEsImV4cCI6MjA4OTM5OTkwMX0.GMcGg6slt5H9paHhiHPZK6zZGJV1fReebvBBHoxy9GI

## Supabase Auth Configuration

Dans Supabase > Authentication > URL Configuration :
- Site URL : https://sorell.fr
- Redirect URLs :
  - https://sorell.fr/auth/callback
  - https://sorell.fr/login
  - http://localhost:3000/auth/callback (pour le dev local)
