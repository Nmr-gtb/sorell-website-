Ce workflow s'applique à TOUT travail de design : composant, page, section, landing page, dashboard, UI mobile.
Suis ces étapes dans l'ordre — n'en saute aucune.

## Prérequis
- Vérifier que le contexte est clair : quel composant/page, pour quel objectif, quelle audience

---

## Étape 1 — Chercher des références
- Chercher sur le web des références de design pertinentes au contexte (Dribbble, Behance, Awwwards, landing pages de concurrents)
- Trouver au minimum **3 références visuelles**
- Varier les styles pour donner du choix

## Étape 2 — 🛑 STOP — Validation obligatoire
- Présenter les références trouvées avec un bref résumé de ce qui les rend pertinentes
- Poser EXACTEMENT cette question : **"Ces références te conviennent ? (oui = je continue / non = je cherche d'autres)"**
- Si la réponse est "non" ou mitigée → relancer la recherche avec de nouveaux termes
- Ne JAMAIS passer à l'étape suivante sans un "oui" explicite
- Répéter jusqu'à validation — pas de limite de tentatives

## Étape 3 — Analyser les références validées
- Identifier les patterns qui reviennent (layout, espacement, typographie)
- Noter les palettes de couleurs dominantes
- Repérer les micro-interactions et détails qui font la différence
- Résumer en 3-5 observations concrètes

## Étape 4 — Lire le code existant
- Lire les fichiers de configuration du projet (Tailwind config, tokens, thème)
- Lire les composants existants pour rester cohérent avec ce qui est déjà en place
- Ne jamais inventer des valeurs qui n'existent pas dans le projet
- Respecter le système de design existant (couleurs, typo, espacements déjà utilisés)

## Étape 5 — Générer le composant final
- Produire un code propre, lisible et maintenable
- Composant fonctionnel et responsive (mobile-first)
- Gérer les états : vide, loading, erreur, succès
- Tailwind CSS uniquement — pas de CSS custom
- Accessibilité : aria-label, contraste 4.5:1, focus visible
- Tester visuellement avant de livrer

## Étape 6 — 🛑 Nommage — Ne jamais écraser
- Chaque nouvelle version doit avoir un suffixe incrémental : `_v1`, `_v2`, `_v3`...
- Lire d'abord le dossier pour identifier la dernière version existante et incrémenter
- L'ancienne version reste toujours intacte
- C'est l'utilisateur qui décide quand archiver ou supprimer

---

## Standards de qualité
- Le résultat doit pouvoir être montré à un client ou investisseur
- Responsive mobile-first obligatoire
- Pas de valeurs hardcodées en dehors des tokens du projet
- Les composants doivent fonctionner de manière indépendante

## Ce qu'il ne faut JAMAIS faire
- Créer sans avoir cherché de références d'abord
- Passer à la création sans validation explicite de l'utilisateur
- Écraser un fichier existant
- Livrer un composant qui casse sur mobile
- Ignorer les états d'erreur ou loading
- Utiliser des couleurs ou polices qui ne sont pas dans le thème du projet
