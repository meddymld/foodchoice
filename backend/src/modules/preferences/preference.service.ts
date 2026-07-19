import { query } from "../../config/database.js";
import { UserPreferenceRow } from "../../types/domain.js";

export type PreferenceInput = {
  max_budget?: number | null;
  favorite_cuisines?: string[] | null;
  dietary_preferences?: string[] | null;
  ambiance_preferences?: string[] | null;
  default_radius_km?: number | null;
};

export async function getPreferences(userId: string) {
  const result = await query<UserPreferenceRow>(
    `
      select
        id,
        user_id,
        max_budget,
        favorite_cuisines,
        dietary_preferences,
        ambiance_preferences,
        default_radius_km,
        created_at,
        updated_at
      from user_preferences
      where user_id = $1
      limit 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function upsertPreferences(userId: string, input: PreferenceInput) {
  const result = await query<UserPreferenceRow>(
    `
      insert into user_preferences (
        user_id,
        max_budget,
        favorite_cuisines,
        dietary_preferences,
        ambiance_preferences,
        default_radius_km
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (user_id) do update
        set max_budget = excluded.max_budget,
            favorite_cuisines = excluded.favorite_cuisines,
            dietary_preferences = excluded.dietary_preferences,
            ambiance_preferences = excluded.ambiance_preferences,
            default_radius_km = excluded.default_radius_km,
            updated_at = now()
      returning
        id,
        user_id,
        max_budget,
        favorite_cuisines,
        dietary_preferences,
        ambiance_preferences,
        default_radius_km,
        created_at,
        updated_at
    `,
    [
      userId,
      input.max_budget ?? null,
      input.favorite_cuisines ?? null,
      input.dietary_preferences ?? null,
      input.ambiance_preferences ?? null,
      input.default_radius_km ?? 5
    ]
  );

  return result.rows[0];
}
