export type BudgetLevel = 1 | 2 | 3 | 4;

export type DietaryKey =
  | "halal"
  | "kosher"
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "glutenFree"
  | "lactoseFree"
  | "healthy";

export type DietaryStatus = "confirmed" | "unknown" | "notAvailable";

export type MealContext =
  | "quick"
  | "friends"
  | "date"
  | "family"
  | "solo"
  | "travel";

export type NavigationApp = "google" | "apple" | "waze";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SearchCriteria = {
  locationLabel: string;
  coordinates?: Coordinates;
  context: MealContext;
  budget: BudgetLevel;
  cuisines: string[];
  dietary: DietaryKey[];
  minRating: number;
  openNowOnly: boolean;
  maxDistanceKm: number;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  budget: BudgetLevel;
  pricePerPerson: string;
  openNow: boolean;
  closesAt: string;
  categories: string[];
  cuisines: string[];
  contexts: MealContext[];
  dietary: Record<DietaryKey, DietaryStatus>;
  photoUrl: string;
  phone?: string;
  website?: string;
  source: "mock" | "googlePlaces";
};

export type ScoredRestaurant = Restaurant & {
  score: number;
  matchReasons: string[];
};
