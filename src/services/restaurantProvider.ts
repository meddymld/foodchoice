import { restaurants } from "../data/restaurants";
import { Restaurant, SearchCriteria } from "../types";

export interface RestaurantProvider {
  /** Recherche des restaurants correspondant aux criteres fournis. */
  search(criteria: SearchCriteria): Promise<Restaurant[]>;
}

/** Fournisseur local utilise pendant le MVP pour servir les restaurants factices. */
export class MockRestaurantProvider implements RestaurantProvider {
  /** Filtre les donnees factices par ville lorsque la recherche contient une ville connue. */
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

/** Fournisseur prevu pour isoler la future integration Google Places. */
export class GooglePlacesRestaurantProvider implements RestaurantProvider {
  /** Point d'entree de recherche Google Places, volontairement non implemente pour le MVP. */
  async search(_criteria: SearchCriteria): Promise<Restaurant[]> {
    throw new Error(
      "Google Places integration is intentionally isolated behind RestaurantProvider."
    );
  }
}

/** Normalise un texte pour comparer les villes sans tenir compte des accents ni de la casse. */
function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
