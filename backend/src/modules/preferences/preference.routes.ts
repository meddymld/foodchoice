import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getPreferencesController,
  updatePreferencesController
} from "./preference.controller.js";

export const preferenceRoutes = Router();

preferenceRoutes.use(requireAuth);
preferenceRoutes.get("/", asyncHandler(getPreferencesController));
preferenceRoutes.put("/", asyncHandler(updatePreferencesController));
