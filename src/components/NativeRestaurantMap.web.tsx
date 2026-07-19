import { LocateFixed } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";

import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { NativeRestaurantMapProps } from "./NativeRestaurantMap.types";

const TILE_SIZE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;

function clampTile(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapTileX(x: number, tileCount: number) {
  return ((x % tileCount) + tileCount) % tileCount;
}

function longitudeToTileX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * 2 ** zoom;
}

function latitudeToTileY(latitude: number, zoom: number) {
  const latitudeRadians = (clampTile(latitude, -85.05112878, 85.05112878) * Math.PI) / 180;
  return (
    ((1 -
      Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
      2) *
    2 ** zoom
  );
}

function getTileZoom(longitudeDelta: number, latitudeDelta: number, width: number) {
  const horizontalTiles = Math.max(width / TILE_SIZE, 1);
  const targetDelta = Math.max(longitudeDelta, latitudeDelta * 1.35, 0.01);
  const zoom = Math.floor(Math.log2((horizontalTiles * 360) / targetDelta));

  return clampTile(zoom, MIN_ZOOM, MAX_ZOOM);
}

/** Carte web OpenStreetMap sans module natif, avec les pins FoodChoice superposes. */
export function NativeRestaurantMap({
  restaurants,
  selectedRestaurantId,
  initialRegion,
  isNightMode,
  mapPadding,
  onSelectRestaurant
}: NativeRestaurantMapProps) {
  const { width, height } = useWindowDimensions();
  const [centerRegion, setCenterRegion] = useState(initialRegion);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapWidth = Math.max(width, TILE_SIZE);
  const mapHeight = Math.max(height, TILE_SIZE);
  const region = centerRegion;

  const zoom = getTileZoom(
    region.longitudeDelta,
    region.latitudeDelta,
    mapWidth
  );
  const tileCount = 2 ** zoom;
  const centerTileX = longitudeToTileX(region.longitude, zoom);
  const centerTileY = latitudeToTileY(region.latitude, zoom);
  const centerPixelX = centerTileX * TILE_SIZE;
  const centerPixelY = centerTileY * TILE_SIZE;
  const viewportLeft = centerPixelX - mapWidth / 2;
  const viewportTop = centerPixelY - mapHeight / 2;
  const bottomAttributionOffset = Math.max(12, (mapPadding?.bottom ?? 0) - 56);

  useEffect(() => {
    setCenterRegion(initialRegion);
  }, [initialRegion]);

  async function centerOnCurrentPosition() {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setUserCoordinates(nextCoordinates);
      setCenterRegion({
        ...region,
        ...nextCoordinates,
        latitudeDelta: Math.min(region.latitudeDelta, 0.025),
        longitudeDelta: Math.min(region.longitudeDelta, 0.025)
      });
    } finally {
      setIsLocating(false);
    }
  }

  const tiles = useMemo(() => {
    const startTileX = Math.floor(viewportLeft / TILE_SIZE) - 1;
    const endTileX = Math.ceil((viewportLeft + mapWidth) / TILE_SIZE) + 1;
    const startTileY = Math.max(0, Math.floor(viewportTop / TILE_SIZE) - 1);
    const endTileY = Math.min(
      tileCount - 1,
      Math.ceil((viewportTop + mapHeight) / TILE_SIZE) + 1
    );
    const nextTiles: Array<{
      key: string;
      uri: string;
      left: number;
      top: number;
    }> = [];

    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
        const wrappedTileX = wrapTileX(tileX, tileCount);
        nextTiles.push({
          key: `${wrappedTileX}-${tileY}-${zoom}`,
          uri: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
          left: tileX * TILE_SIZE - viewportLeft,
          top: tileY * TILE_SIZE - viewportTop
        });
      }
    }

    return nextTiles;
  }, [mapHeight, mapWidth, tileCount, viewportLeft, viewportTop, zoom]);

  return (
    <View style={styles.nativeMap}>
      <View style={styles.osmTileLayer}>
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            style={[
              styles.osmTile,
              {
                left: tile.left,
                top: tile.top
              }
            ]}
          />
        ))}
      </View>
      {isNightMode && <View pointerEvents="none" style={styles.osmNightOverlay} />}

      {restaurants.map((restaurant, index) => {
        const pinPixelX = longitudeToTileX(restaurant.coordinates.longitude, zoom) * TILE_SIZE;
        const pinPixelY = latitudeToTileY(restaurant.coordinates.latitude, zoom) * TILE_SIZE;
        const isSelected = restaurant.id === selectedRestaurantId;

        return (
          <Pressable
            key={restaurant.id}
            style={[
              styles.mapPin,
              isSelected && styles.mapPinSelected,
              {
                left: pinPixelX - viewportLeft,
                top: pinPixelY - viewportTop,
                zIndex: isSelected ? 3 : 2
              }
            ]}
            onPress={() => onSelectRestaurant(restaurant.id)}
          >
            <Text style={[styles.mapPinText, isSelected && styles.mapPinTextSelected]}>
              {index + 1}
            </Text>
          </Pressable>
        );
      })}

      {userCoordinates && (
        <View
          pointerEvents="none"
          style={[
            styles.osmUserDot,
            {
              left:
                longitudeToTileX(userCoordinates.longitude, zoom) * TILE_SIZE -
                viewportLeft,
              top:
                latitudeToTileY(userCoordinates.latitude, zoom) * TILE_SIZE -
                viewportTop
            }
          ]}
        >
          <View style={styles.osmUserDotCore} />
        </View>
      )}

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
          { bottom: bottomAttributionOffset }
        ]}
      >
        {"\u00A9 OpenStreetMap contributors"}
      </Text>
    </View>
  );
}

export const supportsNativeRestaurantMap = true;
