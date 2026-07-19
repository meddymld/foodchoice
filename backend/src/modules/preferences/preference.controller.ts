import { Request, Response } from "express";

import { getPreferences, PreferenceInput, upsertPreferences } from "./preference.service.js";
import { ApiError } from "../../utils/apiError.js";
import { getAuthenticatedUser } from "../../utils/requestUser.js";

function optionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new ApiError(400, `${field} doit etre un nombre`, "INVALID_BODY");
  }

  return numberValue;
}

function optionalStringArray(value: unknown, field: string) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new ApiError(400, `${field} doit etre un tableau de textes`, "INVALID_BODY");
  }

  return value;
}

export async function getPreferencesController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const preferences = await getPreferences(user.id);

  response.json({ data: preferences });
}

export async function updatePreferencesController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const body = request.body ?? {};
  const input: PreferenceInput = {
    max_budget: optionalNumber(body.max_budget, "max_budget"),
    favorite_cuisines: optionalStringArray(body.favorite_cuisines, "favorite_cuisines"),
    dietary_preferences: optionalStringArray(
      body.dietary_preferences,
      "dietary_preferences"
    ),
    ambiance_preferences: optionalStringArray(
      body.ambiance_preferences,
      "ambiance_preferences"
    ),
    default_radius_km: optionalNumber(body.default_radius_km, "default_radius_km")
  };

  const preferences = await upsertPreferences(user.id, input);
  response.json({ data: preferences });
}
