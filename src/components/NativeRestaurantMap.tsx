import { ScoredRestaurant } from "../types";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Fallback TypeScript lorsque Metro ne choisit pas encore une variante native ou web. */
export function NativeRestaurantMap({
  restaurants,
  selectedRestaurantId,
  initialRegion,
  onSelectRestaurant
}: {
  restaurants: ScoredRestaurant[];
  selectedRestaurantId?: string;
  initialRegion: NativeMapRegion;
  onSelectRestaurant: (restaurantId: string) => void;
}) {
  void restaurants;
  void selectedRestaurantId;
  void initialRegion;
  void onSelectRestaurant;

  return null;
}

export const supportsNativeRestaurantMap = false;
