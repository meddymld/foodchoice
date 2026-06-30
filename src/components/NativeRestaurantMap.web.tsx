import { NativeRestaurantMapProps } from "./NativeRestaurantMap.types";

/** Solution de repli web : laisse App.tsx afficher la carte premium simulee sans charger le module natif. */
export function NativeRestaurantMap(_props: NativeRestaurantMapProps) {
  return null;
}

export const supportsNativeRestaurantMap = false;
