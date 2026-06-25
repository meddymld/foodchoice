import { ScoredRestaurant } from "../types";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Fallback web : laisse App.tsx afficher la carte premium simulee sans charger le module natif. */
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
