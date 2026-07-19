import * as Location from "expo-location";
import { LocateFixed } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

import { colors } from "../theme";
import { styles } from "../styles/appStyles";
import { NativeRestaurantMapProps } from "./NativeRestaurantMap.types";

const openStreetMapTileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Affiche la vraie carte native iOS/Android avec les restaurants sous forme de marqueurs. */
export function NativeRestaurantMap({
  restaurants,
  selectedRestaurantId,
  initialRegion,
  isNightMode,
  mapPadding,
  onSelectRestaurant
}: NativeRestaurantMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const attributionBottomOffset = Math.max(12, (mapPadding?.bottom ?? 0) - 56);

  async function centerOnCurrentPosition() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: Math.min(initialRegion.latitudeDelta, 0.025),
          longitudeDelta: Math.min(initialRegion.longitudeDelta, 0.025)
        },
        450
      );
    } finally {
      setIsLocating(false);
    }
  }

  return (
    <View style={styles.nativeMap}>
      <MapView
        ref={mapRef}
        style={styles.nativeMap}
        initialRegion={initialRegion}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        mapPadding={mapPadding}
        legalLabelInsets={mapPadding}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile
          maximumZ={19}
          tileSize={256}
          urlTemplate={openStreetMapTileUrl}
          zIndex={1}
        />
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
      {isNightMode && <View pointerEvents="none" style={styles.osmNightOverlay} />}
      <Pressable
        accessibilityLabel="Aller vers ma position"
        disabled={isLocating}
        onPress={centerOnCurrentPosition}
        style={[
          styles.mapLocationButton,
          isNightMode && styles.darkPanel,
          isLocating && styles.mapLocationButtonLoading,
          { top: Math.max(14, mapPadding?.top ?? 0) }
        ]}
      >
        <LocateFixed
          size={21}
          color={isNightMode ? "#D8FFE0" : colors.brand}
          strokeWidth={2.5}
        />
      </Pressable>
      <Text
        pointerEvents="none"
        style={[
          styles.osmAttribution,
          isNightMode && styles.osmAttributionDark,
          { bottom: attributionBottomOffset }
        ]}
      >
        {"\u00A9 OpenStreetMap contributors"}
      </Text>
    </View>
  );
}

export const supportsNativeRestaurantMap = true;
