# Planning de Recette - SORELL

**Site** : https://sorell.fr
**Date** : 6 avril 2026
**Testeurs** : Maman (Testeur A) + Papa (Testeur B)

---

## Comment utiliser ce document

1. Chaque testeur suit les scenarios qui lui sont attribues
2. Pour chaque etape, cochez OK ou notez le probleme rencontre
3. Testez sur **votre telephone** (pas d'ordinateur sauf si indique)
4. Testez en conditions reelles : utilisez votre vraie adresse email
5. Ne sautez aucune etape, meme si ca parait evident
6. Notez tout ce qui vous semble bizarre, meme si ca "marche"

---

## TESTEUR A (Maman) - Parcours "Nouveau visiteur qui decouvre et s'inscrit"

**Appareil** : Telephone (Safari ou Chrome)

### Scenario 1 : Decouverte du site (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 1.1 | Ouvrir https://sorell.fr sur votre telephone | Le site s'affiche, pas d'ecran blanc ni d'erreur | | |
| 1.2 | Lire le haut de la page (le "hero") | Vous comprenez en 5 secondes ce que fait Sorell. Si non, notez ce qui n'est pas clair | | |
| 1.3 | Scroller vers le bas lentement jusqu'en bas de page | Tout s'affiche bien, pas de texte coupe, pas de zone blanche bizarre | | |
| 1.4 | Le footer (bas de page) est-il visible ? | Oui, avec les liens Produit, Ressources, Legal, Contact | | |
| 1.5 | Cliquer sur le menu hamburger (les 3 barres en haut a droite) | Un menu s'ouvre avec les liens : Accueil, Tarifs, Demo, Contact | | |
| 1.6 | Cliquer sur "Tarifs" dans le menu | La page des tarifs s'affiche avec 4 plans (Free, Pro, Business, Enterprise) | | |
| 1.7 | Les prix sont-ils clairs ? Free = 0, Pro = 19/mois, Business = 49/mois | Oui, les prix sont lisibles et comprenhensibles | | |
| 1.8 | Basculer sur "Annuel" (bouton au-dessus des prix) | Pro passe a 190/an, Business passe a 490/an, badge "-20%" visible | | |
| 1.9 | Scroller vers le bas de la page tarifs | Il y a une section FAQ avec des questions/reponses | | |
| 1.10 | Cliquer sur une question de la FAQ | La reponse s'affiche en dessous | | |

### Scenario 2 : Pages publiques (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 2.1 | Aller sur la page "Comment ca marche" (via le footer ou le menu) | La page s'affiche et explique le fonctionnement en etapes | | |
| 2.2 | Aller sur la page "Blog" | La liste des articles s'affiche (au moins 5 articles) | | |
| 2.3 | Cliquer sur un article du blog | L'article complet s'affiche, lisible sur telephone | | |
| 2.4 | Aller sur la page "Contact" | Un formulaire avec : Nom, Email, Objet, Message | | |
| 2.5 | Remplir le formulaire avec des vraies infos et envoyer | Message de succes "Message envoye" (ou similaire) | | |
| 2.6 | Aller sur la page "CGV" (lien dans le footer) | La page s'affiche avec du texte legal | | |
| 2.7 | Aller sur la page "Mentions legales" (lien dans le footer) | La page s'affiche | | |
| 2.8 | Aller sur la page "Confidentialite" (lien dans le footer) | La page s'affiche | | |

### Scenario 3 : Demo sans compte (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 3.1 | Aller sur la page "Demo" | La page s'affiche avec un choix de secteur | | |
| 3.2 | Choisir un secteur (ex: "Tech" ou "Finance") | La generation demarre, un indicateur de chargement s'affiche | | |
| 3.3 | Attendre la fin de la generation (30 secondes environ) | Des articles de newsletter s'affichent avec titres, resumes, sources | | |
| 3.4 | Les articles sont-ils en francais et ont-ils l'air credibles ? | Oui, les titres sont pros, les sources sont reelles | | |

### Scenario 4 : Inscription (10 min)

**IMPORTANT : Utilisez votre vraie adresse email !**

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 4.1 | Cliquer sur "Commencer gratuitement" ou "Connexion" | La page de connexion s'affiche | | |
| 4.2 | Cliquer sur "S'inscrire" (onglet ou lien) | Le formulaire d'inscription s'affiche : Nom, Email, Mot de passe | | |
| 4.3 | Remplir avec votre vrai nom et email, choisir un mot de passe | Le formulaire se soumet | | |
| 4.4 | Un message vous dit de verifier votre email ? | Oui, message type "Verifiez votre boite email" | | |
| 4.5 | Ouvrir votre boite email. Avez-vous recu un email de Sorell ? | Oui, un email de confirmation (verifiez aussi les spams) | | |
| 4.6 | Cliquer sur le lien de confirmation dans l'email | Vous etes redirige vers le dashboard de Sorell | | |
| 4.7 | Le dashboard affiche un assistant de configuration (onboarding) ? | Oui, on vous propose de choisir un plan | | |

### Scenario 5 : Onboarding - Configuration (10 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 5.1 | **Etape 1 - Plan** : Choisir "Free" (Commencer gratuitement) | L'onboarding passe a l'etape suivante | | |
| 5.2 | **Etape 2 - Brief** : Decrire une activite fictive (ex: "Je suis fleuriste a Lyon, je veux suivre les tendances du marche des fleurs") | Le champ accepte votre texte | | |
| 5.3 | **Etape 3 - Thematiques** : Choisir 2-3 thematiques qui correspondent | Les thematiques se selectionnent (couleur change) | | |
| 5.4 | **Etape 4 - Destinataire** : Entrer votre adresse email | L'email est accepte | | |
| 5.5 | **Etape 5 - Creneau** : Choisir un jour et une heure d'envoi | La selection fonctionne | | |
| 5.6 | Valider la derniere etape | Un message de succes s'affiche, votre premiere newsletter se genere | | |
| 5.7 | Attendez 1-2 minutes. Avez-vous recu un email de bienvenue ? | Oui, un email de bienvenue Sorell | | |

### Scenario 6 : Dashboard apres configuration (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 6.1 | Vous etes sur le dashboard. Voyez-vous un resume de votre config ? | Oui, vos thematiques et votre creneau sont affiches | | |
| 6.2 | Cliquer sur "Configuration" dans le menu lateral | La page de config s'affiche avec vos choix | | |
| 6.3 | Modifier une thematique et sauvegarder | La modification est enregistree sans erreur | | |
| 6.4 | Cliquer sur "Generer un apercu" ou aller sur la page Generation | La page de generation manuelle s'affiche | | |
| 6.5 | Lancer une generation | La newsletter se genere (30s-1min), le contenu s'affiche | | |
| 6.6 | Cliquer sur "Profil" dans le menu | Votre profil s'affiche avec nom, email, plan Free | | |

### Scenario 7 : Chatbot Soly (3 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 7.1 | Revenir sur la homepage (sorell.fr). Apres 5 secondes, une bulle de chat apparait en bas a droite ? | Oui, une petite bulle ronde apparait | | |
| 7.2 | Cliquer sur la bulle | Une fenetre de chat s'ouvre avec un message d'accueil | | |
| 7.3 | Ecrire "C'est quoi Sorell ?" et envoyer | Soly repond avec une explication courte | | |
| 7.4 | Ecrire "Combien ca coute ?" | Soly repond avec les prix | | |
| 7.5 | Fermer le chat (croix) | La fenetre se ferme, la bulle reste | | |

---

## TESTEUR B (Papa) - Parcours "Utilisateur qui paye et utilise le produit"

**Appareil** : Ordinateur (Chrome ou Firefox)

### Scenario 8 : Inscription + Paiement Pro (15 min)

**IMPORTANT : Utilisez votre vraie adresse email et la carte de test Stripe ci-dessous**

**Carte de test Stripe (PAS une vraie carte, c'est pour tester) :**
- Numero : 4242 4242 4242 4242
- Expiration : 12/29
- CVC : 123
- Nom : votre nom

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 8.1 | Aller sur https://sorell.fr/connexion | La page de connexion s'affiche | | |
| 8.2 | S'inscrire avec votre email et un mot de passe | Message "Verifiez votre email" | | |
| 8.3 | Confirmer votre email (cliquer le lien recu) | Redirige vers le dashboard | | |
| 8.4 | **Etape 1 - Plan** : Choisir "Pro" (19/mois) | Redirection vers la page de paiement Stripe | | |
| 8.5 | Remplir avec la carte de test ci-dessus | Le paiement est accepte (essai gratuit 15 jours) | | |
| 8.6 | Vous etes redirige vers le dashboard, etape 2 ? | Oui, l'onboarding continue | | |
| 8.7 | Completer les etapes 2 a 5 (brief, thematiques, destinataire, creneau) | Tout se passe sans erreur | | |
| 8.8 | La premiere newsletter se genere ? | Oui, un apercu s'affiche | | |

### Scenario 9 : Fonctionnalites Pro (10 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 9.1 | Aller sur "Analytics" dans le menu | La page Analytics s'affiche (peut etre vide si pas encore d'envoi) | | |
| 9.2 | Aller sur "Historique" dans le menu | La page Historique s'affiche avec votre premiere newsletter | | |
| 9.3 | Cliquer sur une newsletter dans l'historique | Le detail s'affiche avec le contenu | | |
| 9.4 | Aller sur "Personnalisation" dans le menu | La page s'affiche avec un choix de couleurs | | |
| 9.5 | Changer la couleur principale et sauvegarder | La couleur est enregistree | | |
| 9.6 | Aller sur "Configuration" | Tout est bien configure | | |
| 9.7 | Ajouter un 2e destinataire (email de Maman par ex.) | Le destinataire est ajoute | | |

### Scenario 10 : Envoi manuel d'une newsletter (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 10.1 | Aller sur "Generer un apercu" | La page s'affiche | | |
| 10.2 | Cliquer pour generer une newsletter | La generation demarre (30s-1min) | | |
| 10.3 | L'apercu s'affiche avec des articles ? | Oui, articles avec titres, resumes, sources | | |
| 10.4 | Cliquer "Envoyer" | La newsletter est envoyee | | |
| 10.5 | Verifier votre email : avez-vous recu la newsletter ? | Oui, email avec les articles, bien formate | | |
| 10.6 | Dans l'email, cliquer sur un lien d'article | Le lien ouvre le vrai article dans le navigateur | | |
| 10.7 | En bas de l'email, y a-t-il un lien "Se desabonner" ? | Oui, le lien est present | | |

### Scenario 11 : Desabonnement (3 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 11.1 | Dans la newsletter recue par email, cliquer sur "Se desabonner" | Une page de confirmation s'affiche | | |
| 11.2 | Confirmer le desabonnement | Message de succes | | |

### Scenario 12 : Gestion du profil et abonnement (5 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 12.1 | Aller sur "Profil" dans le menu | Votre profil s'affiche avec plan "Pro" | | |
| 12.2 | Le nombre de jours de trial restant est-il affiche ? | Oui (14 jours ou similaire) | | |
| 12.3 | Y a-t-il un bouton "Gerer mon abonnement" ? | Oui | | |
| 12.4 | Cliquer dessus | Le portail Stripe s'ouvre (page de gestion abonnement) | | |
| 12.5 | Revenir sur Sorell (bouton retour) | Retour au profil sans probleme | | |

### Scenario 13 : Export des donnees RGPD (2 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 13.1 | Sur la page Profil, chercher "Exporter mes donnees" | Le bouton est present | | |
| 13.2 | Cliquer dessus | Un fichier JSON se telecharge avec vos donnees | | |

### Scenario 14 : Dark mode + responsive (3 min)

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 14.1 | Activer le mode sombre (bouton lune/soleil dans la navbar) | Tout le site passe en mode sombre, textes lisibles | | |
| 14.2 | Naviguer dans le dashboard en mode sombre | Tout est lisible, pas de texte invisible | | |
| 14.3 | Reduire la fenetre du navigateur a la taille d'un telephone | Le site s'adapte, menu hamburger apparait | | |

---

## TESTEUR A + B ENSEMBLE - Scenario final

### Scenario 15 : Suppression de compte (5 min)

**A faire EN DERNIER, une fois tous les autres tests termines**

| # | Action | Resultat attendu | OK ? | Probleme |
|---|--------|-------------------|------|----------|
| 15.1 | Testeur A : Aller sur Profil | La page s'affiche | | |
| 15.2 | Scroller en bas, trouver "Supprimer mon compte" (zone rouge) | Le bouton est present | | |
| 15.3 | Cliquer et confirmer la suppression | Message de confirmation, deconnexion automatique | | |
| 15.4 | Essayer de se reconnecter avec le meme email | Echec : le compte n'existe plus | | |
| 15.5 | Testeur B : Meme chose, supprimer le compte | Idem, compte supprime | | |

---

## Fiche de synthese

A remplir apres tous les tests :

**Testeur A (Maman) :**
- Appareil utilise : _______________
- Navigateur : _______________
- Nombre de problemes trouves : ___
- Le site est-il comprehensible sans aide ? Oui / Non
- Donnez une note de 1 a 10 : ___
- Commentaire libre : _______________

**Testeur B (Papa) :**
- Appareil utilise : _______________
- Navigateur : _______________
- Nombre de problemes trouves : ___
- Le paiement a-t-il fonctionne sans stress ? Oui / Non
- Donnez une note de 1 a 10 : ___
- Commentaire libre : _______________

---

## Notes pour Noe

- Les tests avec carte Stripe 4242... sont en mode test, aucun vrai debit
- Penser a mettre Stripe en mode test AVANT les tests du Testeur B (ou utiliser la carte test en mode production qui ne debite pas)
- Recuperer les retours des 2 testeurs et creer une liste de bugs a corriger
- Les comptes de test doivent etre supprimes a la fin (scenario 15)
