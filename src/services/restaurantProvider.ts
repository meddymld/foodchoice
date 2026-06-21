import { restaurants } from "../data/restaurants";
import { Restaurant, SearchCriteria } from "../types";

export interface RestaurantProvider {
  search(criteria: SearchCriteria): Promise<Restaurant[]>;
}

export class MockRestaurantProvider implements RestaurantProvider {
  async search(criteria: SearchCriteria): Promise<Restaurant[]> {
    const normalizedLocation = normalizeText(criteria.locationLabel);
    const searchedCity = ["paris", "toulouse", "marseille"].find((city) =>
      normalizedLocation.includes(city)
    );
    const cityRestaurants = searchedCity
      ? restaurants.filter((restaurant) =>
          normalizeText(restaurant.address).includes(searchedCity)
        )
      : restaurants;

    return cityRestaurants.map((restaurant) => ({
      ...restaurant,
      distanceKm: Math.max(0.3, restaurant.distanceKm)
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

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
