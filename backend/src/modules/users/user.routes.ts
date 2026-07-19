import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMeController } from "./user.controller.js";

export const userRoutes = Router();

userRoutes.get("/me", requireAuth, asyncHandler(getMeController));
