import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Check, Clock3, Heart, MapPin, Sparkles, Star } from "lucide-react-native";

import { budgetLabels, colors } from "../theme";
import { ScoredRestaurant } from "../types";
import { styles } from "../styles/appStyles";
// Compact restaurant card shared by results, map and favorites tabs.
export function RestaurantCard({
  restaurant,
  isFavorite,
  isDarkMode,
  onPress,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  isDarkMode: boolean;
  onPress: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable
      style={[styles.restaurantCard, isDarkMode && styles.darkSurfaceRaised]}
      onPress={() => onPress(restaurant)}
    >
      <Image source={{ uri: restaurant.photoUrl }} style={styles.restaurantImage} />
      <View style={styles.restaurantCopy}>
        <View style={styles.cardTopline}>
          <Text
            numberOfLines={1}
            style={[styles.restaurantName, isDarkMode && styles.darkText]}
          >
            {restaurant.name}
          </Text>
          <Pressable
            style={[styles.favoriteButton, isDarkMode && styles.darkPanel]}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite(restaurant.id);
            }}
          >
            <Heart
              size={18}
              color={isFavorite ? colors.coral : colors.muted}
              fill={isFavorite ? colors.coral : "transparent"}
            />
          </Pressable>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.restaurantMeta, isDarkMode && styles.darkMutedText]}
        >
          {restaurant.cuisines.slice(0, 2).join(", ")} · {budgetLabels[restaurant.budget]}
        </Text>
        <View style={styles.cardMetrics}>
          <Metric
            icon={<Star size={14} color={colors.gold} fill={colors.gold} />}
            text={restaurant.rating.toFixed(1)}
            isDarkMode={isDarkMode}
          />
          <Metric
            icon={<MapPin size={14} color={colors.coral} />}
            text={`${restaurant.distanceKm.toFixed(1)} km`}
            isDarkMode={isDarkMode}
          />
          <Metric
            icon={
              <Clock3
                size={14}
                color={restaurant.openNow ? colors.brand : colors.danger}
              />
            }
            text={restaurant.openNow ? "Ouvert" : "Fermé"}
            isDarkMode={isDarkMode}
            isClosed={!restaurant.openNow}
          />
        </View>
        <View style={styles.reasonWrap}>
          {restaurant.matchReasons.slice(0, 2).map((reason) => (
            <Text
              key={reason}
              style={[styles.compactReason, isDarkMode && styles.darkCompactReason]}
            >
              {reason}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

// Larger recommendation card used by the "Reco" decision mode.
export function FeaturedRestaurantCard({
  restaurant,
  isFavorite,
  isDarkMode,
  onPress,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  isDarkMode: boolean;
  onPress: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable
      style={[styles.featuredCard, isDarkMode && styles.darkSurfaceRaised]}
      onPress={() => onPress(restaurant)}
    >
      <Image source={{ uri: restaurant.photoUrl }} style={styles.featuredImage} />
      <View style={styles.featuredBody}>
        <View style={styles.featuredTitleRow}>
          <Text style={[styles.featuredName, isDarkMode && styles.darkText]}>
            {restaurant.name}
          </Text>
          <Pressable
            style={[styles.favoriteButtonLarge, isDarkMode && styles.darkPanel]}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite(restaurant.id);
            }}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.coral : colors.muted}
              fill={isFavorite ? colors.coral : "transparent"}
            />
          </Pressable>
        </View>
        <Text style={[styles.featuredMeta, isDarkMode && styles.darkMutedText]}>
          {restaurant.cuisines.join(", ")} · {budgetLabels[restaurant.budget]}
        </Text>
        <View style={styles.featuredScore}>
          <Sparkles size={17} color={colors.brand} />
          <Text style={styles.featuredScoreText}>Score {restaurant.score}</Text>
        </View>
        <View style={styles.reasonWrap}>
          {restaurant.matchReasons.map((reason) => (
              <View key={reason} style={[styles.reasonPill, isDarkMode && styles.darkPanel]}>
                <Check size={13} color={colors.brand} />
              <Text style={[styles.reasonText, isDarkMode && styles.darkReasonText]}>
                {reason}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

// Small icon/value pair for restaurant metadata.
export function Metric({
  icon,
  text,
  isDarkMode = false,
  isClosed = false
}: {
  icon: React.ReactNode;
  text: string;
  isDarkMode?: boolean;
  isClosed?: boolean;
}) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text
        style={[
          styles.metricText,
          isDarkMode && styles.darkText,
          isClosed && styles.metricTextClosed
        ]}
      >
        {text}
      </Text>
    </View>
  );
}







