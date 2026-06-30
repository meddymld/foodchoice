export type BudgetLevel = 1 | 2 | 3 | 4;

export type RestaurantSort = "distance" | "rating" | "name" | "price";

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

export type WeeklyOpeningHour = {
  day: string;
  hours: string;
  closed?: boolean;
};

export type SearchCriteria = {
  locationLabel: string;
  coordinates?: Coordinates;
  contexts: MealContext[];
  budget: BudgetLevel[];
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
  weeklyHours?: WeeklyOpeningHour[];
  categories: string[];
  cuisines: string[];
  contexts: MealContext[];
  dietary: Record<DietaryKey, DietaryStatus>;
  photoUrl: string;
  phone?: string;
  website?: string;
  instagram?: string;
  tikTok?: string;
  source: "mock" | "googlePlaces";
};

export type ScoredRestaurant = Restaurant & {
  score: number;
  matchReasons: string[];
};
