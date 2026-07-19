import { Request, Response } from "express";

import { getRestaurantById, searchRestaurants } from "./restaurant.service.js";
import { ApiError } from "../../utils/apiError.js";

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalNumber(value: unknown, field: string) {
  const raw = firstValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;

  const numberValue = Number(raw);
  if (!Number.isFinite(numberValue)) {
    throw new ApiError(400, `Parametre numerique invalide: ${field}`, "INVALID_QUERY");
  }

  return numberValue;
}

function optionalString(value: unknown) {
  const raw = firstValue(value);
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
}

export async function searchRestaurantsController(request: Request, response: Response) {
  const restaurants = await searchRestaurants({
    lat: optionalNumber(request.query.lat, "lat"),
    lng: optionalNumber(request.query.lng, "lng"),
    radiusKm: optionalNumber(request.query.radius, "radius"),
    budget: optionalNumber(request.query.budget, "budget"),
    cuisine: optionalString(request.query.cuisine),
    envie: optionalString(request.query.envie ?? request.query.query),
    minRating: optionalNumber(request.query.minRating, "minRating"),
    limit: optionalNumber(request.query.limit, "limit")
  });

  response.json({ data: restaurants });
}

export async function getRestaurantController(request: Request, response: Response) {
  const restaurant = await getRestaurantById(request.params.id);
  response.json({ data: restaurant });
}
