import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  deleteSearchHistoryController,
  listSearchHistoryController
} from "./searchHistory.controller.js";

export const searchHistoryRoutes = Router();

searchHistoryRoutes.use(requireAuth);
searchHistoryRoutes.get("/", asyncHandler(listSearchHistoryController));
searchHistoryRoutes.delete("/", asyncHandler(deleteSearchHistoryController));
