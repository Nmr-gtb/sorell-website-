Tu lances un audit complet du projet. Chaque section doit être analysée en profondeur. Ne résume pas, sois précis.

## 1. Backend & Base de données (/architect + /security)
- Lire toutes les API routes dans `app/api/`
- Vérifier que chaque route a une gestion d'erreur (try/catch)
- Lister toutes les tables Supabase utilisées
- Vérifier que RLS est activée sur chaque table
- Vérifier qu'il n'y a aucun `SUPABASE_SERVICE_ROLE_KEY` exposé côté client
- Vérifier les migrations SQL dans `supabase/migrations/`
- Checker les index sur les colonnes filtrées fréquemment

## 2. Frontend & UI (/designer)
- Lire tous les composants dans `components/`
- Vérifier l'accessibilité : aria-label, contraste, focus visible
- Vérifier que tout est responsive (pas de largeurs fixes en px)
- Vérifier qu'il n'y a pas de texte hardcodé en français (doit passer par les traductions)
- Checker les états : loading, error, empty pour chaque composant qui fetch des données

## 3. Sécurité (/security)
- Scanner TOUS les fichiers pour des clés API, tokens, secrets en dur
- Vérifier `.env.local` n'est PAS dans le git (checker `.gitignore`)
- Vérifier les signatures webhooks (Stripe)
- Vérifier la validation des inputs côté serveur
- Vérifier qu'aucune erreur technique n'est exposée à l'utilisateur

## 4. Tests (/tester)
- Lister les tests existants
- Identifier les flux critiques sans tests (inscription, paiement, génération newsletter)
- Vérifier que le build passe sans erreur TypeScript
- Checker les console.log qui traînent

## 5. Performance (/architect)
- Identifier les composants lourds sans lazy loading
- Vérifier les requêtes Supabase : N+1, requêtes inutiles
- Checker la taille du bundle (dépendances lourdes ?)
- Vérifier le caching des données statiques

## 6. SEO & Marketing (/product)
- Vérifier robots.ts et sitemap.ts
- Checker les meta tags (title, description, og:image) sur chaque page
- Vérifier la structure des headings (h1, h2, h3)
- Checker les performances web (images non optimisées, fonts lourdes)

## 7. Stripe & Paiement (/security + /architect)
- Vérifier le flow complet : checkout → webhook → mise à jour BDD
- Checker la gestion des erreurs Stripe (paiement échoué, carte expirée)
- Vérifier que les montants sont en centimes
- Vérifier la sécurité du webhook (signature)

## 8. Email & Resend (/architect)
- Vérifier la config Resend
- Checker les templates email (responsive ?)
- Vérifier la gestion des bounces et unsubscribes
- Vérifier le rate limiting

## Format de sortie

Pour chaque section, donne :
- ✅ Ce qui est bien fait
- ⚠️ Ce qui peut être amélioré (non critique)
- 🚨 Ce qui est critique et doit être corrigé immédiatement

À la fin, donne un **score global sur 100** et une **liste priorisée des 5 actions les plus urgentes**.
