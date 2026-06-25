# Cadrage produit foodchoice

## Objectif

foodchoice est une application mobile mondiale qui aide les utilisateurs à trouver où manger dehors selon leur localisation, leur contexte, leur budget, leurs envies culinaires et leurs régimes alimentaires.

L'application doit être simple d'utilisation et disponible à terme sur l'Apple App Store et le Google Play Store.

## Positionnement

> Trouver où manger, sans débat.

foodchoice doit réduire le temps nécessaire pour choisir un restaurant en proposant soit une liste filtrée par pertinence, soit une recommandation directe lorsque l'utilisateur souhaite une décision rapide.

## Utilisateurs cibles

L'application doit être utile pour plusieurs contextes :

- repas entre amis ;
- date ou sortie romantique ;
- repas en famille ;
- repas individuel ;
- voyageurs et touristes ;
- utilisateurs qui cherchent un restaurant dans une zone qu'ils ne connaissent pas.

## Portée géographique

L'application est conçue pour être mondiale. Elle doit pouvoir être utilisée depuis n'importe quelle ville ou pays, à condition que les données restaurant soient disponibles via les APIs connectées.

## Modes de localisation

L'utilisateur doit pouvoir lancer une recherche de deux façons :

1. utiliser la géolocalisation en temps réel ;
2. saisir manuellement une adresse, une ville, un quartier ou un lieu de rendez-vous.

## Données restaurants

Google Places est l'API prioritaire envisagée pour obtenir des données restaurant en temps réel, notamment :

- nom du restaurant ;
- adresse ;
- coordonnées géographiques ;
- horaires ;
- note moyenne ;
- nombre d'avis ;
- photos ;
- catégories ;
- statut d'ouverture ;
- niveau de prix lorsque disponible.
- pages réseaux sociaux (insta, tiktok, facebook? ) lorsque disponible

Le produit doit garder une architecture suffisamment flexible pour ajouter plus tard d'autres sources comme Yelp, OpenStreetMap, TripAdvisor, TheFork ou des données internes.

## Modes d'accès utilisateur

L'application doit supporter deux usages :

- mode invité sans création de compte ;
- compte utilisateur optionnel.

Le mode invité doit permettre les recherches essentielles. Le compte utilisateur peut débloquer des fonctionnalités de personnalisation comme les favoris, préférences sauvegardées, historique ou recommandations plus adaptées.

## Fonctionnalités principales du MVP



### Recherche

L'utilisateur peut rechercher des restaurants :

- autour de sa position actuelle ;
- autour d'une adresse saisie ;
- dans une ville ou un quartier précis.

### Fonctionnalités supplémentaires

L'utilisateur peut aussi créer sa liste de favoris:

- possible lorsque le compte est crée
- ajout soit par la fiche, par la liste ou clic sur la carte

### Filtres

Les résultats doivent pouvoir être filtrés par :

- distance ;
- budget ;
- type de cuisine ;
- catégorie de restaurant ;
- contexte de sortie ;
- régimes alimentaires ;
- note minimale ;
- restaurants ouverts maintenant.

### Budget

Le budget peut être représenté avec des niveaux simples :

- € : économique ;
- €€ : modéré ;
- €€€ : élevé ;
- €€€€ : premium.

Une évolution future peut permettre d'indiquer un budget maximum par personne.

### Types de restaurants

L'application doit couvrir tous les types de restaurants lorsque les données sont disponibles, par exemple :

- fast-food ;
- restaurant classique ;
- gastronomique ;
- bistrot ;
- café ;
- brunch ;
- buffet ;
- food truck ;
- street food ;
- bar à tapas ;
- restaurant familial ;
- restaurant romantique ;
- restaurant avec terrasse.

### Types de cuisine

Le catalogue de cuisine doit être large et extensible, par exemple :

- française ;
- italienne ;
- japonaise ;
- chinoise ;
- coréenne ;
- thaïlandaise ;
- indienne ;
- libanaise ;
- mexicaine ;
- américaine ;
- africaine ;
- méditerranéenne ;
- végétarienne ;
- vegan ;
- burgers ;
- pizza ;
- sushi ;
- fruits de mer ;
- barbecue ;
- desserts.

### Régimes et contraintes alimentaires

L'application doit intégrer un maximum de régimes et contraintes alimentaires :

- halal ;
- casher ;
- vegan ;
- végétarien ;
- pescétarien ;
- sans gluten ;
- sans lactose ;
- options healthy ;
- allergies courantes lorsque l'information est disponible.

Les données de régimes alimentaires peuvent être incomplètes selon les APIs. L'interface doit donc distinguer les informations confirmées des informations non disponibles.

## Présentation des résultats

foodchoice doit proposer deux modes de décision :

1. une liste filtrée et triée par pertinence ;
2. une recommandation unique pour les utilisateurs qui veulent choisir rapidement.

Le tri par pertinence peut combiner :

- proximité ;
- correspondance avec les filtres ;
- note ;
- nombre d'avis ;
- statut ouvert maintenant ;
- budget ;
- popularité ;
- adéquation avec le contexte de sortie.

## Fiche restaurant

Chaque restaurant doit avoir une fiche détaillée comprenant :

- nom ;
- photos ;
- adresse ;
- note ;
- nombre d'avis ;
- budget estimé ;
- type de cuisine ;
- régimes alimentaires connus ;
- horaires ;
- distance ;
- téléphone ou site web lorsque disponible ;
- instagram et tiktok si possible ;
- bouton d'itinéraire ;
- bouton de partage.

## Itinéraire

Depuis une fiche restaurant, l'utilisateur doit pouvoir lancer un itinéraire dans l'application de navigation de son choix :

- Google Maps ;
- Apple Plans ;
- Waze.

## Fonctionnalités non prioritaires pour le MVP

La fonctionnalité de vote entre amis n'est pas prioritaire pour la première version.

Elle peut être envisagée plus tard si le produit évolue vers une expérience de décision de groupe.

## Fonctionnalités futures possibles

- historique des restaurants consultés ;
- recommandations personnalisées ;
- préférences sauvegardées ;
- mode « surprends-moi » ;
- partage d'une sélection de restaurants ;
- réservation ;
- offres partenaires ;
- comptes restaurateurs ;
- menus et prix détaillés ;
- avis internes à foodchoice.
- social pour les listes (ajout amis etc)

## Contraintes produit

- L'application doit rester très simple pour un usage rapide.
- Le mode invité doit être réellement utilisable.
- Les données doivent être affichées avec prudence lorsque certaines informations ne sont pas garanties par les APIs.
- Les filtres doivent être extensibles car les catégories et régimes peuvent varier selon les pays.
- L'expérience doit être pensée mobile-first pour iOS et Android.

## Recommandation de MVP

La première version devrait se concentrer sur le parcours suivant :

1. l'utilisateur ouvre l'application ;
2. il choisit sa position actuelle ou saisit une adresse ;
3. il sélectionne un budget, un type de cuisine et des contraintes alimentaires ;
4. il consulte une liste de restaurants pertinents ou demande une recommandation unique ;
5. il ouvre une fiche restaurant ;
6. il lance l'itinéraire avec Google Maps, Apple Plans ou Waze.
