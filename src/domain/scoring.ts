import {
  DietaryKey,
  Restaurant,
  ScoredRestaurant,
  SearchCriteria
} from "../types";
import { budgetLabels, contextLabels, dietaryLabels } from "../theme";

const confirmedDietScore = 14;
const unknownDietScore = 3;

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cuisineMatches(restaurant: Restaurant, cuisine: string) {
  const normalizedCuisine = normalizeText(cuisine);

  return restaurant.cuisines.some(
    (item) => normalizeText(item) === normalizedCuisine
  );
}

function contextMatches(restaurant: Restaurant, criteria: SearchCriteria) {
  if (criteria.contexts.length === 0) return true;
  return criteria.contexts.some((context) => restaurant.contexts.includes(context));
}

function cuisinesMatch(restaurant: Restaurant, criteria: SearchCriteria) {
  if (criteria.cuisines.length === 0) return true;
  return criteria.cuisines.some((cuisine) => cuisineMatches(restaurant, cuisine));
}

function dietaryMatches(restaurant: Restaurant, criteria: SearchCriteria) {
  return criteria.dietary.every((diet) => restaurant.dietary[diet] === "confirmed");
}

export function matchesSearchCriteria(
  restaurant: Restaurant,
  criteria: SearchCriteria
) {
  if (criteria.openNowOnly && !restaurant.openNow) return false;
  if (restaurant.rating < criteria.minRating) return false;
  if (restaurant.distanceKm > criteria.maxDistanceKm) return false;
  if (criteria.budget !== null && restaurant.budget !== criteria.budget) return false;
  if (!contextMatches(restaurant, criteria)) return false;
  if (!cuisinesMatch(restaurant, criteria)) return false;
  if (!dietaryMatches(restaurant, criteria)) return false;

  return true;
}

function formatDietReason(diet: DietaryKey) {
  return `${dietaryLabels[diet]} confirmé`;
}

export function scoreRestaurant(
  restaurant: Restaurant,
  criteria: SearchCriteria
): ScoredRestaurant {
  let score = 0;
  const matchReasons: string[] = [];

  if (!criteria.openNowOnly || restaurant.openNow) {
    score += restaurant.openNow ? 12 : 0;
    if (restaurant.openNow) matchReasons.push("Ouvert maintenant");
  } else {
    score -= 80;
  }

  const distanceScore = Math.max(0, 18 - restaurant.distanceKm * 3);
  score += distanceScore;
  if (restaurant.distanceKm <= 2) matchReasons.push("Proche");

  const ratingScore = Math.max(0, (restaurant.rating - criteria.minRating) * 12);
  score += ratingScore;
  if (restaurant.rating >= 4.5) matchReasons.push("Très bien noté");

  score += Math.min(12, Math.log10(restaurant.reviewCount + 1) * 4);

  if (criteria.budget !== null) {
    const budgetGap = Math.abs(restaurant.budget - criteria.budget);
    score += budgetGap === 0 ? 14 : budgetGap === 1 ? 7 : -8;
    if (budgetGap === 0) {
      matchReasons.push(`Budget ${budgetLabels[restaurant.budget]}`);
    }
  }

  const contextHits = criteria.contexts.filter((context) =>
    restaurant.contexts.includes(context)
  );
  score += contextHits.length * 12;
  if (contextHits.length > 0) {
    matchReasons.push(
      `Adapté ${contextLabels[contextHits[0]].toLowerCase()}`
    );
  }

  const cuisineHits = criteria.cuisines.filter((cuisine) =>
    cuisineMatches(restaurant, cuisine)
  );
  score += cuisineHits.length * 15;
  if (cuisineHits.length > 0) {
    matchReasons.push(cuisineHits.slice(0, 2).join(", "));
  }

  criteria.dietary.forEach((diet) => {
    const status = restaurant.dietary[diet];
    if (status === "confirmed") {
      score += confirmedDietScore;
      matchReasons.push(formatDietReason(diet));
    } else if (status === "unknown") {
      score += unknownDietScore;
    } else {
      score -= 20;
    }
  });

  if (restaurant.rating < criteria.minRating) score -= 50;
  if (restaurant.distanceKm > criteria.maxDistanceKm) score -= 50;

  return {
    ...restaurant,
    score: Math.round(score),
    matchReasons: [...new Set(matchReasons)].slice(0, 4)
  };
}

export function rankRestaurants(
  restaurants: Restaurant[],
  criteria: SearchCriteria
): ScoredRestaurant[] {
  return restaurants
    .filter((restaurant) => matchesSearchCriteria(restaurant, criteria))
    .map((restaurant) => scoreRestaurant(restaurant, criteria))
    .sort((a, b) => b.score - a.score);
}
