import React from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { colors } from "../theme";
import { styles } from "../styles/appStyles";
// Etat vide generique pour les onglets qui dependent d'une action utilisateur precedente.
export function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  isDarkMode = false,
  onAction
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
  isDarkMode?: boolean;
  onAction: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDarkMode && styles.darkPanel]}>{icon}</View>
      <Text style={[styles.emptyTitle, isDarkMode && styles.darkText]}>{title}</Text>
      <Text style={[styles.emptyText, isDarkMode && styles.darkMutedText]}>{text}</Text>
      <Pressable style={styles.emptyButton} onPress={onAction}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

// En-tete superieur partage par les ecrans secondaires.
export function Header({
  title,
  subtitle,
  isDarkMode = false,
  onBack
}: {
  title: string;
  subtitle: string;
  isDarkMode?: boolean;
  onBack: () => void;
}) {
  return (
    <View style={[styles.header, isDarkMode && styles.darkHeader]}>
      <Pressable style={[styles.backButton, isDarkMode && styles.darkSurface]} onPress={onBack}>
        <ArrowLeft size={22} color={isDarkMode ? "#F3F6EF" : colors.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} style={[styles.headerTitle, isDarkMode && styles.darkText]}>
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.headerSubtitle, isDarkMode && styles.darkMutedText]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}


