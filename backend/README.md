# FoodChoice Backend

Backend TypeScript/Express pour FoodChoice.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Architecture

- Supabase Auth gere l'identite utilisateur.
- Le backend verifie les JWT Supabase sur les routes privees.
- PostgreSQL/PostGIS stocke les restaurants, favoris, preferences et historique.
- Redis est optionnel pour le cache des recherches publiques.
- Le mobile ne doit appeler que ce backend pour les donnees metier.

## Routes

- `GET /health`
- `GET /restaurants`
- `GET /restaurants/:id`
- `GET /me` avec `Authorization: Bearer <token>`
- `GET /favorites` avec token
- `POST /favorites` avec token et body `{ "restaurant_id": "uuid" }`
- `DELETE /favorites/:restaurantId` avec token
- `GET /preferences` avec token
- `PUT /preferences` avec token
- `GET /search-history` avec token
- `DELETE /search-history` avec token

Le schema SQL est dans `database/schema.sql`.
