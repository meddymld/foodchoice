import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { colors } from "../theme";
import { ScoredRestaurant } from "../types";
import { styles } from "../styles/appStyles";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Affiche la vraie carte native iOS/Android avec les restaurants sous forme de markers. */
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
  return (
    <MapView
      style={styles.nativeMap}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {restaurants.map((restaurant, index) => {
        const isSelected = restaurant.id === selectedRestaurantId;

        return (
          <Marker
            key={restaurant.id}
            coordinate={restaurant.coordinates}
            title={restaurant.name}
            description={restaurant.address}
            pinColor={isSelected ? colors.brand : colors.coral}
            onPress={() => onSelectRestaurant(restaurant.id)}
          >
            <View
              style={[
                styles.nativeMapPin,
                isSelected && styles.nativeMapPinSelected
              ]}
            >
              <Text
                style={[styles.mapPinText, isSelected && styles.mapPinTextSelected]}
              >
                {index + 1}
              </Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

export const supportsNativeRestaurantMap = true;
