import { restaurants } from "../data/restaurants";
import { Restaurant, SearchCriteria } from "../types";

export interface RestaurantProvider {
  search(criteria: SearchCriteria): Promise<Restaurant[]>;
}

export class MockRestaurantProvider implements RestaurantProvider {
  async search(criteria: SearchCriteria): Promise<Restaurant[]> {
    const normalizedLocation = criteria.locationLabel.trim().toLowerCase();
    const locationBoost = normalizedLocation.length > 0 ? 0 : 0;

    return restaurants.map((restaurant) => ({
      ...restaurant,
      distanceKm: Math.max(0.3, restaurant.distanceKm - locationBoost)
    }));
  }
}

export class GooglePlacesRestaurantProvider implements RestaurantProvider {
  async search(_criteria: SearchCriteria): Promise<Restaurant[]> {
    throw new Error(
      "Google Places integration is intentionally isolated behind RestaurantProvider."
    );
  }
}
