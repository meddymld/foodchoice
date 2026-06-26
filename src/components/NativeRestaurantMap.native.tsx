import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "../theme";
import { ScoredRestaurant } from "../types";
import { styles } from "../styles/appStyles";

type NativeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const googleMapsNightStyle = [
  { elementType: "geometry", stylers: [{ color: "#1D2C3A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8EC3B9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1A3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4B6878" }]
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6F9BA5" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#023E58" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7680" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304A5D" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98A5BE" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2C6675" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#B0D5CE" }]
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98A5BE" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0E1626" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4E6D70" }]
  }
];

/** Affiche la vraie carte native iOS/Android avec les restaurants sous forme de marqueurs. */
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
  return (
    <MapView
      style={styles.nativeMap}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      customMapStyle={isNightMode ? googleMapsNightStyle : []}
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
