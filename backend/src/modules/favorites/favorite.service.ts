import { query } from "../../config/database.js";
import { FavoriteRow, RestaurantRow } from "../../types/domain.js";

export async function listFavorites(userId: string) {
  const result = await query<RestaurantRow & { favorite_created_at: string }>(
    `
      select
        r.id,
        r.name,
        r.address,
        r.latitude,
        r.longitude,
        r.price_level,
        r.rating,
        r.cuisine_type,
        r.ambiance_tags,
        r.opening_hours,
        r.google_place_id,
        r.thefork_id,
        r.reservation_available,
        r.source,
        r.last_synced_at,
        r.created_at,
        r.updated_at,
        null::double precision as distance_km,
        f.created_at as favorite_created_at
      from favorites f
      join restaurants r on r.id = f.restaurant_id
      where f.user_id = $1
      order by f.created_at desc
    `,
    [userId]
  );

  return result.rows;
}

export async function addFavorite(userId: string, restaurantId: string) {
  const result = await query<FavoriteRow>(
    `
      insert into favorites (user_id, restaurant_id)
      values ($1, $2)
      on conflict (user_id, restaurant_id) do update
        set created_at = favorites.created_at
      returning id, user_id, restaurant_id, created_at
    `,
    [userId, restaurantId]
  );

  return result.rows[0];
}

export async function deleteFavorite(userId: string, restaurantId: string) {
  await query(
    `
      delete from favorites
      where user_id = $1 and restaurant_id = $2
    `,
    [userId, restaurantId]
  );
}
