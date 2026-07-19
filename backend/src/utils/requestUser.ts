import { Request } from "express";

import { ApiError } from "./apiError.js";

export function getAuthenticatedUser(request: Request) {
  if (!request.user) {
    throw new ApiError(401, "Non connecte", "AUTH_REQUIRED");
  }

  return request.user;
}
