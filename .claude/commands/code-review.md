Tu lances une code review complète avant livraison. Passe en revue chaque point systématiquement.

## Checklist obligatoire

### 1. Build & TypeScript
- [ ] `npm run build` passe sans erreur
- [ ] Zéro erreur TypeScript
- [ ] Pas de `any` dans le code ajouté/modifié
- [ ] Pas de `@ts-ignore` ou `@ts-nocheck`

### 2. Sécurité
- [ ] Aucune clé API, token, ou secret dans le code
- [ ] Aucun `console.log` avec des données sensibles
- [ ] Inputs validés côté serveur (pas seulement côté client)
- [ ] RLS activée sur les nouvelles tables Supabase
- [ ] Signatures webhooks vérifiées
- [ ] Erreurs génériques côté client (pas de stack trace exposée)

### 3. Qualité du code
- [ ] Pas de code dupliqué (DRY)
- [ ] Fonctions < 50 lignes (sinon découper)
- [ ] Fichiers < 200 lignes (sinon découper)
- [ ] Nommage clair et cohérent (camelCase variables, PascalCase composants)
- [ ] Pas de magic numbers — utiliser des constantes nommées
- [ ] Imports propres — pas d'imports inutilisés

### 4. Composants React
- [ ] États gérés : loading, error, empty, success
- [ ] Pas de re-renders inutiles (useCallback, useMemo si nécessaire)
- [ ] Props typées correctement
- [ ] Composants accessibles (aria-label, alt, role)
- [ ] Responsive mobile-first vérifié

### 5. API & Base de données
- [ ] Gestion d'erreur sur chaque appel API (try/catch)
- [ ] Pas de requêtes N+1
- [ ] Données sensibles filtrées avant envoi au client
- [ ] Rate limiting sur les endpoints publics
- [ ] Pas de données utilisateur exposées à d'autres utilisateurs

### 6. Tests
- [ ] Tests existants toujours au vert
- [ ] Nouveaux tests ajoutés pour les nouvelles fonctionnalités
- [ ] Flux critiques couverts (inscription, paiement, actions principales)
- [ ] Cas limites testés

### 7. Performance
- [ ] Pas de requêtes lourdes côté client
- [ ] Images optimisées (next/image, formats modernes)
- [ ] Lazy loading sur les composants lourds
- [ ] Pas de dépendances inutilement lourdes importées

### 8. Git & Déploiement
- [ ] `.env.local` dans `.gitignore`
- [ ] `.env.example` à jour avec les nouvelles variables
- [ ] Pas de fichiers de build commités (.next, node_modules)
- [ ] Commit messages clairs et descriptifs

## Format de sortie

Pour chaque section :
- ✅ **Validé** — rien à signaler
- ⚠️ **À améliorer** — non bloquant mais à corriger (détail + suggestion)
- 🚨 **Bloquant** — à corriger AVANT de livrer (détail + correction proposée)

**Verdict final** : PRÊT À LIVRER ✅ ou CORRECTIONS NÉCESSAIRES 🚨

Si corrections nécessaires, liste les actions par ordre de priorité.
