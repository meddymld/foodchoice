import {
  DietaryKey,
  Restaurant,
  ScoredRestaurant,
  SearchCriteria
} from "../types";
import { budgetLabels, contextLabels, dietaryLabels } from "../theme";

const confirmedDietScore = 14;
const unknownDietScore = 3;

function cuisineMatches(restaurant: Restaurant, cuisine: string) {
  return restaurant.cuisines.some(
    (item) => item.toLowerCase() === cuisine.toLowerCase()
  );
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

  const budgetGap = Math.abs(restaurant.budget - criteria.budget);
  score += budgetGap === 0 ? 14 : budgetGap === 1 ? 7 : -8;
  if (budgetGap === 0) matchReasons.push(`Budget ${budgetLabels[restaurant.budget]}`);

  if (restaurant.contexts.includes(criteria.context)) {
    score += 12;
    matchReasons.push(`Adapté ${contextLabels[criteria.context].toLowerCase()}`);
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
    .map((restaurant) => scoreRestaurant(restaurant, criteria))
    .filter((restaurant) => restaurant.score > -20)
    .sort((a, b) => b.score - a.score);
}
