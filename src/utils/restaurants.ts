import {
  Coordinates,
  RestaurantSort,
  ScoredRestaurant,
  SearchCriteria,
  WeeklyOpeningHour
} from "../types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function formatDecimal(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function sortRestaurants(
  restaurants: ScoredRestaurant[],
  sort: RestaurantSort
) {
  return [...restaurants].sort((first, second) => {
    if (sort === "distance") return first.distanceKm - second.distanceKm;
    if (sort === "rating") return second.rating - first.rating;
    if (sort === "name") return first.name.localeCompare(second.name, "fr");
    return first.budget - second.budget;
  });
}

export function getCurrentSearchCoordinates(
  criteria: SearchCriteria
): Coordinates | undefined {
  if (criteria.coordinates) return criteria.coordinates;

  const normalizedLocation = normalizeLabel(criteria.locationLabel);
  if (normalizedLocation.includes("toulouse")) {
    return { latitude: 43.6047, longitude: 1.4442 };
  }
  if (normalizedLocation.includes("marseille")) {
    return { latitude: 43.2965, longitude: 5.3698 };
  }
  if (normalizedLocation.includes("paris")) {
    return { latitude: 48.8566, longitude: 2.3522 };
  }

  return undefined;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return (
    Math.round(
      earthRadiusKm *
        2 *
        Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) *
        10
    ) / 10
  );
}

export function getWeeklyOpeningHours(
  restaurant: ScoredRestaurant
): WeeklyOpeningHour[] {
  if (restaurant.weeklyHours?.length) return restaurant.weeklyHours;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const isClosedNow = normalizeLabel(restaurant.closesAt).includes("ferme");
  const defaultClose = isClosedNow ? "22:00" : restaurant.closesAt;
  const isBrunch = restaurant.categories.includes("brunch");
  const isLate = restaurant.categories.includes("late");

  return days.map((day, index) => {
    if (isBrunch) {
      return {
        day,
        hours: index < 5 ? "09:00 - 16:00" : "10:00 - 17:00"
      };
    }

    if (index === 6 && !isLate) {
      return { day, hours: "Fermé", closed: true };
    }

    return {
      day,
      hours: `${index === 5 ? "12:00" : "11:30"} - ${defaultClose}`
    };
  });
}

export function getCurrentFrenchWeekday() {
  return ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][new Date().getDay()];
}
