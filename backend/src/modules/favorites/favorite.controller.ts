import { Request, Response } from "express";

import { addFavorite, deleteFavorite, listFavorites } from "./favorite.service.js";
import { ApiError } from "../../utils/apiError.js";
import { getAuthenticatedUser } from "../../utils/requestUser.js";

export async function listFavoritesController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const favorites = await listFavorites(user.id);

  response.json({ data: favorites });
}

export async function addFavoriteController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const restaurantId = request.body?.restaurant_id;
  if (typeof restaurantId !== "string" || restaurantId.trim().length === 0) {
    throw new ApiError(400, "restaurant_id est requis", "INVALID_BODY");
  }

  const favorite = await addFavorite(user.id, restaurantId.trim());
  response.status(201).json({ data: favorite });
}

export async function deleteFavoriteController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  await deleteFavorite(user.id, request.params.restaurantId);

  response.status(204).send();
}
