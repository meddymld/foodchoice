import { ScoredRestaurant } from "../types";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Solution de repli web : laisse App.tsx afficher la carte premium simulee sans charger le module natif. */
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
