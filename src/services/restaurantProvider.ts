import { restaurants } from "../data/restaurants";
import { Restaurant, SearchCriteria } from "../types";
import { calculateDistanceKm, normalizeLabel } from "../utils/restaurants";

interface RestaurantProvider {
  /** Recherche des restaurants correspondant aux criteres fournis. */
  search(criteria: SearchCriteria): Promise<Restaurant[]>;
}

/** Fournisseur local utilise pendant le MVP pour servir les restaurants factices. */
export class MockRestaurantProvider implements RestaurantProvider {
  /** Filtre les donnees factices par ville lorsque la recherche contient une ville connue. */
  async search(criteria: SearchCriteria): Promise<Restaurant[]> {
    const normalizedLocation = normalizeLabel(criteria.locationLabel);
    const searchedCity = ["paris", "toulouse", "marseille"].find((city) =>
      normalizedLocation.includes(city)
    );
    const cityRestaurants = searchedCity
      ? restaurants.filter((restaurant) =>
          normalizeLabel(restaurant.address).includes(searchedCity)
        )
      : restaurants;

    return cityRestaurants.map((restaurant) => ({
      ...restaurant,
      distanceKm: criteria.coordinates
        ? calculateDistanceKm(criteria.coordinates, restaurant.coordinates)
        : Math.max(0.3, restaurant.distanceKm)
    }));
  }
}
