import React from "react";
import { Pressable, ScrollView, Text, TouchableOpacity } from "react-native";
import { ArrowDownAZ, Euro, MapPin, Star } from "lucide-react-native";

import { colors } from "../theme";
import { RestaurantSort } from "../types";
import { styles } from "../styles/appStyles";
// Pastille activable utilisee pour les filtres de contexte, cuisine et regime.
export function Chip({
  label,
  active,
  isDarkMode,
  onPress
}: {
  label: string;
  active: boolean;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        isDarkMode && styles.darkChip,
        active && styles.chipActive,
        isDarkMode && active && styles.darkChipActive
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          isDarkMode && styles.darkChipText,
          active && styles.chipTextActive,
          isDarkMode && active && styles.darkChipTextActive
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Controle de tri compact partage par les resultats et les favoris.
export function SortControls({
  value,
  isDarkMode,
  onChange
}: {
  value: RestaurantSort;
  isDarkMode: boolean;
  onChange: (sort: RestaurantSort) => void;
}) {
  const options: Array<{
    id: RestaurantSort;
    label: string;
    icon: (active: boolean) => React.ReactNode;
  }> = [
    {
      id: "distance",
      label: "Distance",
      icon: (active) => <MapPin size={15} color={active ? colors.surface : colors.brand} />
    },
    {
      id: "rating",
      label: "Note",
      icon: (active) => (
        <Star size={15} color={active ? colors.surface : colors.gold} fill={active ? colors.surface : colors.gold} />
      )
    },
    {
      id: "name",
      label: "Nom",
      icon: (active) => <ArrowDownAZ size={15} color={active ? colors.surface : colors.brand} />
    },
    {
      id: "price",
      label: "Prix",
      icon: (active) => <Euro size={15} color={active ? colors.surface : colors.brand} />
    }
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sortControls}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortButton,
              isDarkMode && styles.darkSurface,
              active && styles.sortButtonActive
            ]}
            onPress={() => onChange(option.id)}
            activeOpacity={0.72}
          >
            {option.icon(active)}
            <Text
              style={[
                styles.sortButtonText,
                isDarkMode && styles.darkSortButtonText,
                active && styles.sortButtonTextActive
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}


