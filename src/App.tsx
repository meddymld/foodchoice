import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import {
  ArrowLeft,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound
} from "lucide-react-native";

import { rankRestaurants } from "./domain/scoring";
import { MockRestaurantProvider } from "./services/restaurantProvider";
import {
  BudgetLevel,
  DietaryKey,
  MealContext,
  NavigationApp,
  ScoredRestaurant,
  SearchCriteria
} from "./types";
import {
  budgetLabels,
  colors,
  contextLabels,
  dietaryLabels,
  radii,
  shadow
} from "./theme";

const provider = new MockRestaurantProvider();

const cuisineOptions = [
  "Française",
  "Italienne",
  "Japonaise",
  "Indienne",
  "Libanaise",
  "Mexicaine",
  "Méditerranéenne",
  "Vegan",
  "Pizza",
  "Sushi",
  "Burgers"
];

const dietaryOptions: DietaryKey[] = [
  "halal",
  "vegan",
  "vegetarian",
  "glutenFree",
  "lactoseFree",
  "kosher",
  "healthy"
];

const contextOptions: MealContext[] = [
  "quick",
  "friends",
  "date",
  "family",
  "solo",
  "travel"
];

const defaultCriteria: SearchCriteria = {
  locationLabel: "Paris, centre",
  context: "friends",
  budget: 2,
  cuisines: ["Méditerranéenne"],
  dietary: [],
  minRating: 4,
  openNowOnly: true,
  maxDistanceKm: 5
};

type Screen = "search" | "results" | "detail" | "route";
type DecisionMode = "list" | "pick";

export default function App() {
  const [screen, setScreen] = useState<Screen>("search");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [selected, setSelected] = useState<ScoredRestaurant | null>(null);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>("list");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const topPick = useMemo(() => results[0], [results]);

  async function runSearch(mode: DecisionMode = decisionMode) {
    setLoading(true);
    try {
      const restaurants = await provider.search(criteria);
      const ranked = rankRestaurants(restaurants, criteria);
      setResults(ranked);
      setDecisionMode(mode);
      setScreen("results");
    } finally {
      setLoading(false);
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Localisation refusée",
          "Vous pouvez quand même saisir une adresse ou un quartier."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCriteria((current) => ({
        ...current,
        locationLabel: "Position actuelle",
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      }));
    } catch {
      Alert.alert(
        "Position indisponible",
        "La recherche par adresse reste disponible."
      );
    } finally {
      setLocating(false);
    }
  }

  function toggleCuisine(cuisine: string) {
    setCriteria((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine]
    }));
  }

  function toggleDiet(diet: DietaryKey) {
    setCriteria((current) => ({
      ...current,
      dietary: current.dietary.includes(diet)
        ? current.dietary.filter((item) => item !== diet)
        : [...current.dietary, diet]
    }));
  }

  function openDetail(restaurant: ScoredRestaurant) {
    setSelected(restaurant);
    setScreen("detail");
  }

  async function openRoute(app: NavigationApp) {
    if (!selected) return;

    const { latitude, longitude } = selected.coordinates;
    const encodedName = encodeURIComponent(selected.name);
    const urls: Record<NavigationApp, string> = {
      google: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodedName}`,
      apple:
        Platform.OS === "ios"
          ? `maps://?q=${encodedName}&ll=${latitude},${longitude}`
          : `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    };

    const supported = await Linking.canOpenURL(urls[app]);
    if (!supported) {
      Alert.alert("Application indisponible", "Essayez Google Maps ou Apple Plans.");
      return;
    }

    await Linking.openURL(urls[app]);
  }

  async function shareRestaurant() {
    if (!selected) return;
    await Share.share({
      message: `${selected.name} - ${selected.address}`
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {screen === "search" && (
        <SearchScreen
          criteria={criteria}
          locating={locating}
          loading={loading}
          onCriteriaChange={setCriteria}
          onUseLocation={useCurrentLocation}
          onToggleCuisine={toggleCuisine}
          onToggleDiet={toggleDiet}
          onSearch={() => runSearch("list")}
          onPick={() => runSearch("pick")}
        />
      )}

      {screen === "results" && (
        <ResultsScreen
          criteria={criteria}
          results={results}
          topPick={topPick}
          decisionMode={decisionMode}
          onDecisionModeChange={setDecisionMode}
          onBack={() => setScreen("search")}
          onOpenDetail={openDetail}
        />
      )}

      {screen === "detail" && selected && (
        <DetailScreen
          restaurant={selected}
          onBack={() => setScreen("results")}
          onOpenRoute={() => setScreen("route")}
          onShare={shareRestaurant}
        />
      )}

      {screen === "route" && selected && (
        <RouteScreen
          restaurant={selected}
          onBack={() => setScreen("detail")}
          onOpenRoute={openRoute}
        />
      )}
    </SafeAreaView>
  );
}

function SearchScreen({
  criteria,
  locating,
  loading,
  onCriteriaChange,
  onUseLocation,
  onToggleCuisine,
  onToggleDiet,
  onSearch,
  onPick
}: {
  criteria: SearchCriteria;
  locating: boolean;
  loading: boolean;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  onUseLocation: () => void;
  onToggleCuisine: (cuisine: string) => void;
  onToggleDiet: (diet: DietaryKey) => void;
  onSearch: () => void;
  onPick: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Compass size={24} color={colors.surface} strokeWidth={2.4} />
        </View>
        <View>
          <Text style={styles.brand}>foodchoice</Text>
          <Text style={styles.tagline}>Trouver où manger, sans débat.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Point de départ</Text>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.muted} />
          <TextInput
            value={criteria.locationLabel}
            onChangeText={(locationLabel) =>
              onCriteriaChange({ ...criteria, locationLabel })
            }
            placeholder="Adresse, ville, quartier"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
          />
        </View>
        <Pressable style={styles.secondaryButton} onPress={onUseLocation}>
          {locating ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <LocateFixed size={18} color={colors.brand} />
          )}
          <Text style={styles.secondaryButtonText}>Utiliser ma position</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contexte</Text>
        <View style={styles.gridChips}>
          {contextOptions.map((context) => (
            <Chip
              key={context}
              label={contextLabels[context]}
              active={criteria.context === context}
              onPress={() => onCriteriaChange({ ...criteria, context })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.segmented}>
          {([1, 2, 3, 4] as BudgetLevel[]).map((budget) => (
            <Pressable
              key={budget}
              style={[
                styles.segment,
                criteria.budget === budget && styles.segmentActive
              ]}
              onPress={() => onCriteriaChange({ ...criteria, budget })}
            >
              <Text
                style={[
                  styles.segmentText,
                  criteria.budget === budget && styles.segmentTextActive
                ]}
              >
                {budgetLabels[budget]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Envies</Text>
        <View style={styles.gridChips}>
          {cuisineOptions.map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              active={criteria.cuisines.includes(cuisine)}
              onPress={() => onToggleCuisine(cuisine)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contraintes alimentaires</Text>
        <View style={styles.gridChips}>
          {dietaryOptions.map((diet) => (
            <Chip
              key={diet}
              label={dietaryLabels[diet]}
              active={criteria.dietary.includes(diet)}
              onPress={() => onToggleDiet(diet)}
            />
          ))}
        </View>
      </View>

      <View style={styles.filtersPanel}>
        <View style={styles.filterRow}>
          <View style={styles.iconLabel}>
            <Clock3 size={18} color={colors.brand} />
            <Text style={styles.filterLabel}>Ouvert maintenant</Text>
          </View>
          <Switch
            value={criteria.openNowOnly}
            onValueChange={(openNowOnly) =>
              onCriteriaChange({ ...criteria, openNowOnly })
            }
            trackColor={{ false: colors.line, true: colors.brand }}
            thumbColor={colors.surface}
          />
        </View>
        <View style={styles.filterRow}>
          <View style={styles.iconLabel}>
            <Star size={18} color={colors.gold} fill={colors.gold} />
            <Text style={styles.filterLabel}>Note minimale</Text>
          </View>
          <View style={styles.stepper}>
            {[3.5, 4, 4.5].map((rating) => (
              <Pressable
                key={rating}
                style={[
                  styles.smallStep,
                  criteria.minRating === rating && styles.smallStepActive
                ]}
                onPress={() => onCriteriaChange({ ...criteria, minRating: rating })}
              >
                <Text
                  style={[
                    styles.smallStepText,
                    criteria.minRating === rating && styles.smallStepTextActive
                  ]}
                >
                  {rating.toFixed(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.filterRow}>
          <View style={styles.iconLabel}>
            <MapPin size={18} color={colors.coral} />
            <Text style={styles.filterLabel}>Distance max.</Text>
          </View>
          <View style={styles.stepper}>
            {[2, 5, 10].map((distance) => (
              <Pressable
                key={distance}
                style={[
                  styles.smallStep,
                  criteria.maxDistanceKm === distance && styles.smallStepActive
                ]}
                onPress={() =>
                  onCriteriaChange({ ...criteria, maxDistanceKm: distance })
                }
              >
                <Text
                  style={[
                    styles.smallStepText,
                    criteria.maxDistanceKm === distance && styles.smallStepTextActive
                  ]}
                >
                  {distance} km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={onSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <SlidersHorizontal size={20} color={colors.surface} />
          )}
          <Text style={styles.primaryButtonText}>Voir la liste</Text>
        </Pressable>
        <Pressable style={styles.pickButton} onPress={onPick} disabled={loading}>
          <Sparkles size={20} color={colors.brand} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ResultsScreen({
  criteria,
  results,
  topPick,
  decisionMode,
  onDecisionModeChange,
  onBack,
  onOpenDetail
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  topPick?: ScoredRestaurant;
  decisionMode: DecisionMode;
  onDecisionModeChange: (mode: DecisionMode) => void;
  onBack: () => void;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
}) {
  return (
    <View style={styles.flex}>
      <Header title="Résultats" subtitle={criteria.locationLabel} onBack={onBack} />
      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, decisionMode === "list" && styles.modeTabActive]}
          onPress={() => onDecisionModeChange("list")}
        >
          <Text
            style={[
              styles.modeTabText,
              decisionMode === "list" && styles.modeTabTextActive
            ]}
          >
            Liste
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, decisionMode === "pick" && styles.modeTabActive]}
          onPress={() => onDecisionModeChange("pick")}
        >
          <Text
            style={[
              styles.modeTabText,
              decisionMode === "pick" && styles.modeTabTextActive
            ]}
          >
            Reco
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.resultsContent}>
        {decisionMode === "pick" && topPick ? (
          <View>
            <Text style={styles.kicker}>Meilleur choix maintenant</Text>
            <FeaturedRestaurantCard restaurant={topPick} onPress={onOpenDetail} />
          </View>
        ) : (
          <View style={styles.listGap}>
            <Text style={styles.resultCount}>{results.length} adresses pertinentes</Text>
            {results.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={onOpenDetail}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailScreen({
  restaurant,
  onBack,
  onOpenRoute,
  onShare
}: {
  restaurant: ScoredRestaurant;
  onBack: () => void;
  onOpenRoute: () => void;
  onShare: () => void;
}) {
  const confirmedDiet = Object.entries(restaurant.dietary).filter(
    ([, status]) => status === "confirmed"
  ) as [DietaryKey, string][];
  const unknownDiet = Object.entries(restaurant.dietary).filter(
    ([, status]) => status === "unknown"
  ) as [DietaryKey, string][];

  return (
    <View style={styles.flex}>
      <Header title={restaurant.name} subtitle={restaurant.address} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Image source={{ uri: restaurant.photoUrl }} style={styles.detailImage} />
        <View style={styles.detailStats}>
          <Metric icon={<Star size={17} color={colors.gold} fill={colors.gold} />} text={`${restaurant.rating} (${restaurant.reviewCount})`} />
          <Metric icon={<MapPin size={17} color={colors.coral} />} text={`${restaurant.distanceKm.toFixed(1)} km`} />
          <Metric icon={<Clock3 size={17} color={colors.brand} />} text={restaurant.openNow ? `Ouvert · ${restaurant.closesAt}` : "Fermé"} />
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailTitle}>Cuisine et budget</Text>
          <Text style={styles.detailText}>
            {restaurant.cuisines.join(", ")} · {budgetLabels[restaurant.budget]} ·{" "}
            {restaurant.pricePerPerson}
          </Text>
          <View style={styles.reasonWrap}>
            {restaurant.matchReasons.map((reason) => (
              <View key={reason} style={styles.reasonPill}>
                <Check size={13} color={colors.brand} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailTitle}>Informations alimentaires</Text>
          <View style={styles.dietGrid}>
            {confirmedDiet.map(([diet]) => (
              <View key={diet} style={styles.dietConfirmed}>
                <ShieldCheck size={15} color={colors.success} />
                <Text style={styles.dietConfirmedText}>{dietaryLabels[diet]}</Text>
              </View>
            ))}
            {unknownDiet.slice(0, 4).map(([diet]) => (
              <View key={diet} style={styles.dietUnknown}>
                <Text style={styles.dietUnknownText}>{dietaryLabels[diet]} inconnu</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.detailTitle}>Contact</Text>
          <Text style={styles.detailText}>{restaurant.address}</Text>
          {restaurant.phone && <Text style={styles.detailText}>{restaurant.phone}</Text>}
          {restaurant.website && <Text style={styles.linkText}>{restaurant.website}</Text>}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.iconButton} onPress={onShare}>
          <Share2 size={21} color={colors.brand} />
        </Pressable>
        <Pressable style={styles.routeButton} onPress={onOpenRoute}>
          <Navigation size={20} color={colors.surface} />
          <Text style={styles.routeButtonText}>Itinéraire</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RouteScreen({
  restaurant,
  onBack,
  onOpenRoute
}: {
  restaurant: ScoredRestaurant;
  onBack: () => void;
  onOpenRoute: (app: NavigationApp) => void;
}) {
  return (
    <View style={styles.flex}>
      <Header title="Itinéraire" subtitle={restaurant.name} onBack={onBack} />
      <View style={styles.routeContent}>
        <MapPin size={34} color={colors.coral} />
        <Text style={styles.routeTitle}>{restaurant.address}</Text>
        <View style={styles.routeOptions}>
          <RouteOption
            label="Google Maps"
            icon={<Navigation size={22} color={colors.brand} />}
            onPress={() => onOpenRoute("google")}
          />
          <RouteOption
            label="Apple Plans"
            icon={<MapPin size={22} color={colors.blue} />}
            onPress={() => onOpenRoute("apple")}
          />
          <RouteOption
            label="Waze"
            icon={<CarFront size={22} color={colors.coral} />}
            onPress={() => onOpenRoute("waze")}
          />
        </View>
      </View>
    </View>
  );
}

function Header({
  title,
  subtitle,
  onBack
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.headerSubtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.headerAvatar}>
        <UserRound size={19} color={colors.brand} />
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RestaurantCard({
  restaurant,
  onPress
}: {
  restaurant: ScoredRestaurant;
  onPress: (restaurant: ScoredRestaurant) => void;
}) {
  return (
    <Pressable style={styles.restaurantCard} onPress={() => onPress(restaurant)}>
      <Image source={{ uri: restaurant.photoUrl }} style={styles.restaurantImage} />
      <View style={styles.restaurantCopy}>
        <View style={styles.cardTopline}>
          <Text numberOfLines={1} style={styles.restaurantName}>
            {restaurant.name}
          </Text>
          <ChevronRight size={18} color={colors.muted} />
        </View>
        <Text numberOfLines={1} style={styles.restaurantMeta}>
          {restaurant.cuisines.slice(0, 2).join(", ")} · {budgetLabels[restaurant.budget]}
        </Text>
        <View style={styles.cardMetrics}>
          <Metric icon={<Star size={14} color={colors.gold} fill={colors.gold} />} text={restaurant.rating.toFixed(1)} />
          <Metric icon={<MapPin size={14} color={colors.coral} />} text={`${restaurant.distanceKm.toFixed(1)} km`} />
          <Metric icon={<Clock3 size={14} color={colors.brand} />} text={restaurant.openNow ? "Ouvert" : "Fermé"} />
        </View>
        <View style={styles.reasonWrap}>
          {restaurant.matchReasons.slice(0, 2).map((reason) => (
            <Text key={reason} style={styles.compactReason}>
              {reason}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function FeaturedRestaurantCard({
  restaurant,
  onPress
}: {
  restaurant: ScoredRestaurant;
  onPress: (restaurant: ScoredRestaurant) => void;
}) {
  return (
    <Pressable style={styles.featuredCard} onPress={() => onPress(restaurant)}>
      <Image source={{ uri: restaurant.photoUrl }} style={styles.featuredImage} />
      <View style={styles.featuredBody}>
        <Text style={styles.featuredName}>{restaurant.name}</Text>
        <Text style={styles.featuredMeta}>
          {restaurant.cuisines.join(", ")} · {budgetLabels[restaurant.budget]}
        </Text>
        <View style={styles.featuredScore}>
          <Sparkles size={17} color={colors.brand} />
          <Text style={styles.featuredScoreText}>Score {restaurant.score}</Text>
        </View>
        <View style={styles.reasonWrap}>
          {restaurant.matchReasons.map((reason) => (
            <View key={reason} style={styles.reasonPill}>
              <Check size={13} color={colors.brand} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={styles.metricText}>{text}</Text>
    </View>
  );
}

function RouteOption({
  label,
  icon,
  onPress
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.routeOption} onPress={onPress}>
      <View style={styles.routeOptionIcon}>{icon}</View>
      <Text style={styles.routeOptionText}>{label}</Text>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background
  },
  screen: {
    padding: 20,
    paddingBottom: 34,
    gap: 18
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 6
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center"
  },
  brand: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.ink
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2
  },
  section: {
    gap: 10
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  searchBox: {
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    minHeight: 44
  },
  secondaryButton: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  secondaryButtonText: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 15
  },
  gridChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  chipText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 14
  },
  chipTextActive: {
    color: colors.surface
  },
  segmented: {
    flexDirection: "row",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 5,
    gap: 5
  },
  segment: {
    flex: 1,
    height: 42,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.softCoral
  },
  segmentText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.coral
  },
  filtersPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 13,
    ...shadow
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
  },
  filterLabel: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 14
  },
  stepper: {
    flexDirection: "row",
    gap: 6
  },
  smallStep: {
    height: 34,
    minWidth: 48,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center"
  },
  smallStepActive: {
    backgroundColor: colors.brand
  },
  smallStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  smallStepTextActive: {
    color: colors.surface
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2
  },
  primaryButton: {
    flex: 1,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900"
  },
  pickButton: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line
  },
  headerCopy: {
    flex: 1
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900"
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center"
  },
  modeTabs: {
    marginHorizontal: 16,
    padding: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    backgroundColor: colors.surface
  },
  modeTab: {
    flex: 1,
    height: 40,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  modeTabActive: {
    backgroundColor: colors.ink
  },
  modeTabText: {
    fontWeight: "900",
    color: colors.muted
  },
  modeTabTextActive: {
    color: colors.surface
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 28
  },
  resultCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  listGap: {
    gap: 12
  },
  restaurantCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    flexDirection: "row",
    gap: 12,
    ...shadow
  },
  restaurantImage: {
    width: 96,
    height: 118,
    borderRadius: radii.md,
    backgroundColor: colors.panel
  },
  restaurantCopy: {
    flex: 1,
    gap: 7,
    paddingVertical: 3
  },
  cardTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  restaurantName: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  restaurantMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  cardMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metricText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  reasonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  compactReason: {
    overflow: "hidden",
    color: colors.brandDark,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800"
  },
  kicker: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow
  },
  featuredImage: {
    width: "100%",
    height: 230,
    backgroundColor: colors.panel
  },
  featuredBody: {
    padding: 16,
    gap: 10
  },
  featuredName: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900"
  },
  featuredMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  featuredScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  featuredScoreText: {
    color: colors.brand,
    fontWeight: "900"
  },
  reasonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.panel
  },
  reasonText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800"
  },
  detailContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16
  },
  detailImage: {
    width: "100%",
    height: 230,
    borderRadius: radii.lg,
    backgroundColor: colors.panel
  },
  detailStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line
  },
  detailBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  detailText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600"
  },
  linkText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "800"
  },
  dietGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  dietConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.panel
  },
  dietConfirmedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "900"
  },
  dietUnknown: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.softBlue
  },
  dietUnknownText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "800"
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    gap: 12
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  routeButton: {
    flex: 1,
    height: 54,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10
  },
  routeButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900"
  },
  routeContent: {
    flex: 1,
    padding: 20,
    gap: 18
  },
  routeTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900"
  },
  routeOptions: {
    gap: 12
  },
  routeOption: {
    minHeight: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  routeOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center"
  },
  routeOptionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  }
});
