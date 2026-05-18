# Prochaines décisions pour foodchoice

Ce document liste les indications à préciser avant de commencer le design UI/UX, l'architecture technique et le développement du MVP.

## 1. Promesse principale

La promesse doit être courte et différenciante. Proposition recommandée :

> foodchoice aide à choisir rapidement où manger selon le lieu, le budget, le contexte et les contraintes alimentaires.

À confirmer :

- le ton de marque : pratique, premium, fun, social ou familial ;
- le slogan final ;
- le bénéfice principal à mettre en avant dans les stores.

## 2. Parcours prioritaire du MVP

Le parcours le plus important doit être défini avant les maquettes.

Parcours recommandé :

1. ouvrir l'application ;
2. choisir la position actuelle ou saisir une adresse ;
3. sélectionner le contexte du repas ;
4. sélectionner un budget ;
5. sélectionner les envies culinaires et contraintes alimentaires ;
6. consulter une liste courte de résultats pertinents ;
7. ouvrir une fiche restaurant ;
8. lancer l'itinéraire dans Google Maps, Apple Plans ou Waze.

À confirmer :

- la liste de résultats doit-elle être l'écran principal après recherche ?
- la recommandation unique doit-elle être proposée dès le MVP ou après la liste ?
- faut-il afficher une carte dès le MVP ou uniquement une liste ?

## 3. Marché de lancement

Même si l'application vise un usage mondial, il est conseillé de choisir une zone de test pour valider le produit.

À définir :

- ville ou pays de lancement initial ;
- langue principale de la première version ;
- devise principale pour l'affichage des budgets ;
- contraintes locales importantes comme halal, végétarien, horaires tardifs ou restaurants familiaux.

## 4. Données et APIs

Google Places est l'option prioritaire, mais il faut préciser les règles techniques et financières avant le développement.

À vérifier :

- coût estimé des appels API ;
- quotas ;
- champs disponibles selon les pays ;
- règles de cache et de stockage ;
- disponibilité des photos, horaires, notes et niveaux de prix ;
- limites concernant les avis et données alimentaires.

Décision à prendre :

- utiliser uniquement Google Places au MVP ;
- ou prévoir dès le début une couche d'abstraction pour ajouter Yelp, OpenStreetMap, TheFork ou d'autres sources.

## 5. Gestion des régimes alimentaires

Les régimes alimentaires sont un élément différenciant, mais les données peuvent être incomplètes.

À définir :

- quels régimes sont prioritaires au MVP ;
- comment afficher une information confirmée, non confirmée ou inconnue ;
- si les utilisateurs peuvent signaler ou compléter les informations ;
- si les restaurants peuvent revendiquer une fiche plus tard.

Liste prioritaire proposée :

- halal ;
- vegan ;
- végétarien ;
- sans gluten ;
- sans lactose ;
- casher ;
- options healthy.

## 6. Compte utilisateur

Le mode invité doit être suffisant pour chercher un restaurant. Le compte doit rester optionnel au MVP.

À définir :

- faut-il proposer la création de compte dès le premier lancement ou plus tard ?
- quelles données sauvegarder : favoris, préférences, historique, adresse, régimes alimentaires ;
- quels fournisseurs d'authentification utiliser : Apple, Google, email, téléphone.

## 7. Critères de pertinence

Le classement des résultats doit être compréhensible et utile.

Score de pertinence proposé :

- correspondance avec les filtres ;
- distance ;
- statut ouvert maintenant ;
- note ;
- nombre d'avis ;
- budget ;
- compatibilité avec le contexte du repas ;
- disponibilité des informations alimentaires.

À définir :

- priorité exacte entre distance, note et budget ;
- seuil minimal de note ;
- traitement des restaurants sans prix ou sans horaires disponibles.

## 8. Design et expérience utilisateur

Avant le développement, il faut produire des maquettes simples.

Écrans à prévoir :

- accueil ;
- recherche par adresse ou géolocalisation ;
- filtres ;
- résultats en liste ;
- résultat recommandé ;
- fiche restaurant ;
- choix de l'application d'itinéraire ;
- favoris si le compte est inclus.

À définir :

- style visuel : minimaliste, moderne, coloré, premium ;
- nom final et logo ;
- icônes de budget, cuisine et régimes ;
- expérience d'onboarding.

## 9. Monétisation

La monétisation n'est pas nécessaire au tout premier MVP, mais elle doit être anticipée.

Pistes possibles :

- mise en avant sponsorisée de restaurants ;
- compte restaurateur ;
- commission sur réservation ;
- abonnement premium pour utilisateurs ;
- partenariats locaux.

À décider :

- aucune monétisation au lancement ;
- ou première expérimentation avec restaurants sponsorisés après validation de l'usage.

## 10. Indicateurs de succès

Pour savoir si l'application fonctionne, il faut mesurer les bons indicateurs.

Indicateurs MVP proposés :

- nombre de recherches ;
- taux de clic sur une fiche restaurant ;
- taux de lancement d'itinéraire ;
- temps moyen avant décision ;
- filtres les plus utilisés ;
- taux de retour utilisateur ;
- taux de création de compte après usage invité.

## Checklist avant développement

- [ ] Valider la promesse principale.
- [ ] Choisir la zone de test initiale.
- [ ] Choisir les langues du MVP.
- [ ] Valider Google Places comme source principale.
- [ ] Estimer les coûts API.
- [ ] Prioriser les régimes alimentaires.
- [ ] Définir le score de pertinence.
- [ ] Décider liste, carte ou recommandation unique au MVP.
- [ ] Créer les maquettes des écrans principaux.
- [ ] Choisir la stack mobile.
- [ ] Définir si le compte utilisateur est inclus dans la première version.
- [ ] Définir les métriques de succès.
