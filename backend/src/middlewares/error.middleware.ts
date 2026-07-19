import { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/apiError.js";

export function notFound(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, `Route introuvable: ${request.method} ${request.path}`, "NOT_FOUND"));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      message: error.message,
      code: error.code
    });
  }

  console.error(error);
  return response.status(500).json({
    message: "Erreur interne du serveur",
    code: "INTERNAL_SERVER_ERROR"
  });
}
