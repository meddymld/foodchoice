import { ScoredRestaurant } from "../types";

export type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapEdgePadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// Contrat commun aux variantes native, web et fallback de la carte restaurant.
export type NativeRestaurantMapProps = {
  restaurants: ScoredRestaurant[];
  selectedRestaurantId?: string;
  initialRegion: NativeMapRegion;
  isNightMode: boolean;
  mapPadding?: MapEdgePadding;
  onSelectRestaurant: (restaurantId: string) => void;
};
