import { Router } from "express";

import {
  getRestaurantController,
  searchRestaurantsController
} from "./restaurant.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const restaurantRoutes = Router();

restaurantRoutes.get("/", asyncHandler(searchRestaurantsController));
restaurantRoutes.get("/:id", asyncHandler(getRestaurantController));
