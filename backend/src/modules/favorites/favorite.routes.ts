import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addFavoriteController,
  deleteFavoriteController,
  listFavoritesController
} from "./favorite.controller.js";

export const favoriteRoutes = Router();

favoriteRoutes.use(requireAuth);
favoriteRoutes.get("/", asyncHandler(listFavoritesController));
favoriteRoutes.post("/", asyncHandler(addFavoriteController));
favoriteRoutes.delete("/:restaurantId", asyncHandler(deleteFavoriteController));
