import { NextFunction, Request, Response } from "express";

import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/apiError.js";

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError(401, "Non connecte", "AUTH_REQUIRED");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new ApiError(401, "Non connecte", "AUTH_REQUIRED");
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new ApiError(401, "Token invalide", "INVALID_TOKEN");
    }

    request.user = data.user;
    request.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
