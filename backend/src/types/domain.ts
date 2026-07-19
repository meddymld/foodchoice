export type RestaurantRow = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_level: number | null;
  rating: string | number | null;
  cuisine_type: string | null;
  ambiance_tags: string[] | null;
  opening_hours: Record<string, unknown> | null;
  google_place_id: string | null;
  thefork_id: string | null;
  reservation_available: boolean;
  source: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string | null;
  distance_km?: number | null;
};

export type FavoriteRow = {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
};

export type UserPreferenceRow = {
  id: string;
  user_id: string;
  max_budget: number | null;
  favorite_cuisines: string[] | null;
  dietary_preferences: string[] | null;
  ambiance_preferences: string[] | null;
  default_radius_km: number | null;
  created_at: string;
  updated_at: string | null;
};

export type SearchHistoryRow = {
  id: string;
  user_id: string;
  query: string | null;
  filters: Record<string, unknown> | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};
