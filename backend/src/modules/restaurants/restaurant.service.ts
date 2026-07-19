import { redis } from "../../config/redis.js";
import { query } from "../../config/database.js";
import { RestaurantRow } from "../../types/domain.js";
import { ApiError } from "../../utils/apiError.js";

export type RestaurantSearchParams = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  budget?: number;
  cuisine?: string;
  envie?: string;
  minRating?: number;
  limit?: number;
};

function getCacheKey(params: RestaurantSearchParams) {
  const normalized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right));

  return `restaurants:${JSON.stringify(normalized)}`;
}

export async function searchRestaurants(params: RestaurantSearchParams) {
  const cacheKey = getCacheKey(params);
  if (redis?.isOpen) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as RestaurantRow[];
  }

  const hasCoordinates = params.lat !== undefined && params.lng !== undefined;
  const values: unknown[] = [];
  const where: string[] = [];
  const orderBy: string[] = [];

  let distanceSql = "null::double precision as distance_km";
  if (hasCoordinates) {
    values.push(params.lng, params.lat);
    distanceSql = `
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 1000 as distance_km
    `;
    orderBy.push("distance_km asc");
  }

  function addValue(value: unknown) {
    values.push(value);
    return `$${values.length}`;
  }

  if (hasCoordinates) {
    const radiusKm = params.radiusKm ?? 5;
    where.push(`
      location is not null
      and ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ${addValue(radiusKm * 1000)}
      )
    `);
  }

  if (params.budget !== undefined) {
    where.push(`price_level <= ${addValue(params.budget)}`);
  }

  if (params.cuisine) {
    where.push(`cuisine_type ilike ${addValue(`%${params.cuisine}%`)}`);
  }

  if (params.envie) {
    const search = addValue(`%${params.envie}%`);
    where.push(`
      (
        name ilike ${search}
        or cuisine_type ilike ${search}
        or exists (
          select 1 from unnest(coalesce(ambiance_tags, array[]::text[])) tag
          where tag ilike ${search}
        )
      )
    `);
  }

  if (params.minRating !== undefined) {
    where.push(`rating >= ${addValue(params.minRating)}`);
  }

  orderBy.push("rating desc nulls last", "name asc");
  const limit = Math.min(params.limit ?? 30, 100);

  const result = await query<RestaurantRow>(
    `
      select
        id,
        name,
        address,
        latitude,
        longitude,
        price_level,
        rating,
        cuisine_type,
        ambiance_tags,
        opening_hours,
        google_place_id,
        thefork_id,
        reservation_available,
        source,
        last_synced_at,
        created_at,
        updated_at,
        ${distanceSql}
      from restaurants
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by ${orderBy.join(", ")}
      limit ${addValue(limit)}
    `,
    values
  );

  if (redis?.isOpen) {
    await redis.set(cacheKey, JSON.stringify(result.rows), {
      EX: 60 * 30
    });
  }

  return result.rows;
}

export async function getRestaurantById(restaurantId: string) {
  const result = await query<RestaurantRow>(
    `
      select
        id,
        name,
        address,
        latitude,
        longitude,
        price_level,
        rating,
        cuisine_type,
        ambiance_tags,
        opening_hours,
        google_place_id,
        thefork_id,
        reservation_available,
        source,
        last_synced_at,
        created_at,
        updated_at,
        null::double precision as distance_km
      from restaurants
      where id = $1
      limit 1
    `,
    [restaurantId]
  );

  const restaurant = result.rows[0];
  if (!restaurant) {
    throw new ApiError(404, "Restaurant introuvable", "RESTAURANT_NOT_FOUND");
  }

  return restaurant;
}
