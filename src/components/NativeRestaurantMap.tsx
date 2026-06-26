import { ScoredRestaurant } from "../types";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Solution de repli TypeScript lorsque Metro ne choisit pas encore une variante native ou web. */
export function NativeRestaurantMap({
  restaurants,
  selectedRestaurantId,
  initialRegion,
  isNightMode,
  onSelectRestaurant
}: {
  restaurants: ScoredRestaurant[];
  selectedRestaurantId?: string;
  initialRegion: NativeMapRegion;
  isNightMode: boolean;
  onSelectRestaurant: (restaurantId: string) => void;
}) {
  void restaurants;
  void selectedRestaurantId;
  void initialRegion;
  void isNightMode;
  void onSelectRestaurant;

  return null;
}

export const supportsNativeRestaurantMap = false;
