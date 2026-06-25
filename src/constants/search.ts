import { BudgetLevel, DietaryKey, MealContext, SearchCriteria } from "../types";

export const cuisineOptions = [
  "française",
  "italienne",
  "japonaise",
  "chinoise",
  "coréenne",
  "thaïlandaise",
  "indienne",
  "libanaise",
  "mexicaine",
  "américaine",
  "africaine",
  "méditerranéenne",
  "végétarienne",
  "vegan",
  "burgers",
  "pizza",
  "sushi",
  "fruits de mer",
  "barbecue",
  "desserts",
  "café",
  "brunch",
  "street food",
  "fast food",
  "gastronomique"
];

export const dietaryOptions: DietaryKey[] = [
  "halal",
  "vegan",
  "vegetarian",
  "glutenFree",
  "lactoseFree",
  "kosher",
  "healthy"
];

export const contextOptions: MealContext[] = [
  "quick",
  "friends",
  "date",
  "family",
  "solo",
  "travel"
];

export const contextEmojis: Record<MealContext, string> = {
  quick: "⚡",
  friends: "🥂",
  date: "💘",
  family: "👨‍👩‍👧",
  solo: "🙋",
  travel: "🧳"
};

export const budgetOptions: BudgetLevel[] = [1, 2, 3, 4];

export const defaultCriteria: SearchCriteria = {
  locationLabel: "",
  contexts: [],
  budget: [],
  cuisines: [],
  dietary: [],
  minRating: 1,
  openNowOnly: true,
  maxDistanceKm: 25
};
