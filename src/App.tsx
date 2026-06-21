import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  Linking,
  PanResponder,
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
  Bookmark,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  Languages,
  ListFilter,
  LocateFixed,
  Map,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserCog,
  UserRound
} from "lucide-react-native";

import { rankRestaurants, scoreRestaurant } from "./domain/scoring";
import { restaurants as allRestaurants } from "./data/restaurants";
import { MockRestaurantProvider } from "./services/restaurantProvider";
import {
  BudgetLevel,
  Coordinates,
  DietaryKey,
  MealContext,
  NavigationApp,
  ScoredRestaurant,
  SearchCriteria,
  WeeklyOpeningHour
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
  "française",
  "italienne",
  "japonaise",
  "chinoise",
  "coréenne",
  "thaïlandaise",
  "indienne",
  "libanaise",
  "mexicaine",
  "américaine",
  "africaine",
  "méditerranéenne",
  "végétarienne",
  "vegan",
  "burgers",
  "pizza",
  "sushi",
  "fruits de mer",
  "barbecue",
  "desserts",
  "café",
  "brunch",
  "street food",
  "fast food",
  "gastronomique"
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
  locationLabel: "",
  contexts: [],
  budget: null,
  cuisines: [],
  dietary: [],
  minRating: 4,
  openNowOnly: true,
  maxDistanceKm: 5
};

type Screen = "search" | "results" | "detail" | "route";
type DecisionMode = "list" | "pick";
type MainTab = "search" | "map" | "favorites" | "profile";
type FavoriteSort = "distance" | "criteria";

export default function App() {
  const [screen, setScreen] = useState<Screen>("search");
  const [activeTab, setActiveTab] = useState<MainTab>("search");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [selected, setSelected] = useState<ScoredRestaurant | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>("list");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Best match used by the recommendation mode.
  const topPick = useMemo(() => results[0], [results]);

  const currentLocation = useMemo(
    () => getCurrentSearchCoordinates(criteria),
    [criteria]
  );

  // Favorites are rebuilt from the full restaurant dataset so they are kept even
  // after changing city or launching a new search.
  const favorites = useMemo(
    () =>
      favoriteIds
        .map((id) => {
          const currentResult = results.find((restaurant) => restaurant.id === id);
          const baseRestaurant =
            currentResult ?? allRestaurants.find((restaurant) => restaurant.id === id);
          if (!baseRestaurant) return null;

          const distanceKm = currentLocation
            ? calculateDistanceKm(currentLocation, baseRestaurant.coordinates)
            : baseRestaurant.distanceKm;

          return {
            ...scoreRestaurant(baseRestaurant, criteria),
            distanceKm
          };
        })
        .filter((restaurant): restaurant is ScoredRestaurant => restaurant !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [criteria, currentLocation, favoriteIds, results]
  );

  // Executes the main restaurant search after required fields are filled, then
  // ranks the provider results with the product scoring rules.
  async function runSearch(mode: DecisionMode = decisionMode) {
    if (criteria.locationLabel.trim().length === 0) {
      setSearchError("Les champs requis ne sont pas remplis.");
      return;
    }

    setSearchError(null);
    setLoading(true);
    try {
      const resolvedCriteria = await resolveCriteriaLocation(criteria);
      if (!resolvedCriteria) return;

      const restaurants = await provider.search(resolvedCriteria);
      const ranked = rankRestaurants(restaurants, resolvedCriteria);
      setCriteria(resolvedCriteria);
      setResults(ranked);
      setDecisionMode(mode);
      setScreen("results");
    } finally {
      setLoading(false);
    }
  }

  async function resolveCriteriaLocation(
    baseCriteria: SearchCriteria,
    forceCurrentLocation = false
  ): Promise<SearchCriteria | null> {
    if (!forceCurrentLocation && baseCriteria.locationLabel.trim().length > 0) {
      return baseCriteria;
    }

    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Localisation refusée",
          "Vous pouvez quand même saisir une adresse ou un quartier."
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        ...baseCriteria,
        locationLabel: "Position actuelle",
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      };
    } catch {
      Alert.alert(
        "Position indisponible",
        "La recherche par adresse reste disponible."
      );
      return null;
    } finally {
      setLocating(false);
    }
  }

  // In the mock app, the current-position shortcut fills a deterministic test
  // location so the Toulouse dataset can be tested without real GPS.
  function useCurrentLocation() {
    setCriteria((current) => ({
      ...current,
      locationLabel: "Toulouse",
      coordinates: {
        latitude: 43.6047,
        longitude: 1.4442
      }
    }));
    setSearchError(null);
  }

  // Updates criteria from the search form and clears validation once location exists.
  function updateCriteria(nextCriteria: SearchCriteria) {
    setCriteria(nextCriteria);
    if (nextCriteria.locationLabel.trim().length > 0) setSearchError(null);
  }

  // Adds or removes a meal context. With no selected context, this filter is ignored.
  function toggleContext(context: MealContext) {
    setCriteria((current) => ({
      ...current,
      contexts: current.contexts.includes(context)
        ? current.contexts.filter((item) => item !== context)
        : [...current.contexts, context]
    }));
  }

  // Adds or removes a cuisine filter while preserving the rest of the criteria.
  function toggleCuisine(cuisine: string) {
    setCriteria((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine]
    }));
  }

  // Adds or removes a dietary constraint from the search filters.
  function toggleDiet(diet: DietaryKey) {
    setCriteria((current) => ({
      ...current,
      dietary: current.dietary.includes(diet)
        ? current.dietary.filter((item) => item !== diet)
        : [...current.dietary, diet]
    }));
  }

  // Opens the restaurant detail screen and stores the selected card context.
  function openDetail(restaurant: ScoredRestaurant) {
    setSelected(restaurant);
    setScreen("detail");
  }

  // Keeps favorites lightweight for the MVP by storing restaurant ids locally.
  function toggleFavorite(restaurantId: string) {
    setFavoriteIds((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId]
    );
  }

  // Builds deep links for the supported navigation apps.
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

  // Shares the selected restaurant through the native share sheet.
  async function shareRestaurant() {
    if (!selected) return;
    await Share.share({
      message: `${selected.name} - ${selected.address}`
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {screen !== "detail" && screen !== "route" && (
        <View style={[styles.tabShell, isDarkMode && styles.darkTabShell]}>
          <View style={[styles.tabContent, isDarkMode && styles.darkTabContent]}>
            {activeTab === "search" && screen === "search" && (
              <SearchScreen
                criteria={criteria}
                searchError={searchError}
                locating={locating}
                loading={loading}
                isDarkMode={isDarkMode}
                onCriteriaChange={updateCriteria}
                onUseLocation={useCurrentLocation}
                onToggleContext={toggleContext}
                onToggleCuisine={toggleCuisine}
                onToggleDiet={toggleDiet}
                onSearch={() => runSearch("list")}
                onPick={() => runSearch("pick")}
              />
            )}

            {activeTab === "search" && screen === "results" && (
              <ResultsScreen
                criteria={criteria}
                results={results}
                topPick={topPick}
                decisionMode={decisionMode}
                favoriteIds={favoriteIds}
                isDarkMode={isDarkMode}
                onBack={() => setScreen("search")}
                onOpenDetail={openDetail}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {activeTab === "map" && (
              <MapScreen
                criteria={criteria}
                results={results}
                favoriteIds={favoriteIds}
                isDarkMode={isDarkMode}
                onOpenDetail={openDetail}
                onToggleFavorite={toggleFavorite}
                onGoSearch={() => {
                  setActiveTab("search");
                  setScreen("search");
                }}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesScreen
                favorites={favorites}
                isDarkMode={isDarkMode}
                onOpenDetail={openDetail}
                onToggleFavorite={toggleFavorite}
                onGoSearch={() => {
                  setActiveTab("search");
                  setScreen("search");
                }}
              />
            )}

            {activeTab === "profile" && (
              <ProfileScreen
                criteria={criteria}
                favoriteCount={favoriteIds.length}
                resultsCount={results.length}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
              />
            )}
          </View>

          <BottomTabs
            activeTab={activeTab}
            isDarkMode={isDarkMode}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        </View>
      )}

      {screen === "detail" && selected && (
        <DetailScreen
          restaurant={selected}
          criteria={criteria}
          isFavorite={favoriteIds.includes(selected.id)}
          isDarkMode={isDarkMode}
          onBack={() => setScreen(activeTab === "search" ? "results" : "search")}
          onOpenRoute={() => setScreen("route")}
          onToggleFavorite={() => toggleFavorite(selected.id)}
          onShare={shareRestaurant}
        />
      )}

      {screen === "route" && selected && (
        <RouteScreen
          restaurant={selected}
          isDarkMode={isDarkMode}
          onBack={() => setScreen("detail")}
          onOpenRoute={openRoute}
        />
      )}
    </SafeAreaView>
  );
}

// Main filter screen: location, context, budget, cuisines and constraints.
function SearchScreen({
  criteria,
  searchError,
  locating,
  loading,
  isDarkMode,
  onCriteriaChange,
  onUseLocation,
  onToggleContext,
  onToggleCuisine,
  onToggleDiet,
  onSearch,
  onPick
}: {
  criteria: SearchCriteria;
  searchError: string | null;
  locating: boolean;
  loading: boolean;
  isDarkMode: boolean;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  onUseLocation: () => void;
  onToggleContext: (context: MealContext) => void;
  onToggleCuisine: (cuisine: string) => void;
  onToggleDiet: (diet: DietaryKey) => void;
  onSearch: () => void;
  onPick: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.screen, isDarkMode && styles.darkScreen]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Compass size={24} color={colors.surface} strokeWidth={2.4} />
        </View>
        <View>
          <Text style={[styles.brand, isDarkMode && styles.darkText]}>foodchoice</Text>
          <Text style={[styles.tagline, isDarkMode && styles.darkMutedText]}>
            Trouver où manger, sans débat.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          Point de départ
        </Text>
        <View style={[styles.searchBox, isDarkMode && styles.darkSurface]}>
          <Search size={20} color={colors.muted} />
          <TextInput
            value={criteria.locationLabel}
            onChangeText={(locationLabel) =>
              onCriteriaChange({ ...criteria, locationLabel })
            }
            placeholder="Adresse, ville, quartier"
            placeholderTextColor={colors.muted}
            style={[styles.input, isDarkMode && styles.darkText]}
            returnKeyType="search"
          />
        </View>
        <Pressable
          style={[styles.secondaryButton, isDarkMode && styles.darkSurface]}
          onPress={onUseLocation}
        >
          {locating ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <LocateFixed size={18} color={colors.brand} />
          )}
          <Text style={styles.secondaryButtonText}>Utiliser ma position</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Contexte</Text>
        <View style={styles.gridChips}>
          {contextOptions.map((context) => (
            <Chip
              key={context}
              label={contextLabels[context]}
              active={criteria.contexts.includes(context)}
              isDarkMode={isDarkMode}
              onPress={() => onToggleContext(context)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Budget</Text>
        <View style={[styles.segmented, isDarkMode && styles.darkSurface]}>
          {([1, 2, 3, 4] as BudgetLevel[]).map((budget) => (
            <Pressable
              key={budget}
              style={[
                styles.segment,
                criteria.budget === budget && styles.segmentActive,
                isDarkMode &&
                  criteria.budget === budget &&
                  styles.darkSegmentActive
              ]}
              onPress={() =>
                onCriteriaChange({
                  ...criteria,
                  budget: criteria.budget === budget ? null : budget
                })
              }
            >
              <Text
                style={[
                  styles.segmentText,
                  isDarkMode && styles.darkMutedText,
                  criteria.budget === budget && styles.segmentTextActive,
                  isDarkMode &&
                    criteria.budget === budget &&
                    styles.darkChipTextActive
                ]}
              >
                {budgetLabels[budget]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Type de cuisine</Text>
        <View style={styles.gridChips}>
          {cuisineOptions.map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              active={criteria.cuisines.includes(cuisine)}
              isDarkMode={isDarkMode}
              onPress={() => onToggleCuisine(cuisine)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          Contraintes alimentaires
        </Text>
        <View style={styles.gridChips}>
          {dietaryOptions.map((diet) => (
            <Chip
              key={diet}
              label={dietaryLabels[diet]}
              active={criteria.dietary.includes(diet)}
              isDarkMode={isDarkMode}
              onPress={() => onToggleDiet(diet)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.filtersPanel, isDarkMode && styles.darkSurfaceRaised]}>
        <View style={styles.filterRow}>
          <View style={styles.iconLabel}>
            <Clock3 size={18} color={colors.brand} />
            <Text style={[styles.filterLabel, isDarkMode && styles.darkText]}>
              Ouvert maintenant
            </Text>
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
        <NumberSliderField
          icon={<Star size={18} color={colors.gold} fill={colors.gold} />}
          label="Note minimale"
          value={criteria.minRating}
          min={1}
          max={5}
          step={0.1}
          suffix="/5"
          isDarkMode={isDarkMode}
          onChange={(minRating) => onCriteriaChange({ ...criteria, minRating })}
        />
        <NumberSliderField
          icon={<MapPin size={18} color={colors.coral} />}
          label="Distance max."
          value={criteria.maxDistanceKm}
          min={1}
          max={10}
          step={0.1}
          suffix=" km"
          isDarkMode={isDarkMode}
          onChange={(maxDistanceKm) =>
            onCriteriaChange({ ...criteria, maxDistanceKm })
          }
        />
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
        <Pressable
          style={[styles.pickButton, isDarkMode && styles.darkSurface]}
          onPress={onPick}
          disabled={loading}
        >
          <Sparkles size={20} color={colors.brand} />
        </Pressable>
      </View>
      {searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}
    </ScrollView>
  );
}

// Shows the ranked list or the single recommendation after a search.
function ResultsScreen({
  criteria,
  results,
  topPick,
  decisionMode,
  favoriteIds,
  isDarkMode,
  onBack,
  onOpenDetail,
  onToggleFavorite
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  topPick?: ScoredRestaurant;
  decisionMode: DecisionMode;
  favoriteIds: string[];
  isDarkMode: boolean;
  onBack: () => void;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <Header
        title="Résultats"
        subtitle={criteria.locationLabel}
        isDarkMode={isDarkMode}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.resultsContent}>
        {results.length === 0 ? (
          <EmptyState
            icon={<Search size={30} color={colors.brand} />}
            title="Aucun restaurant ne correspond"
            text="Essayez d'élargir la distance, de baisser la note minimale ou de retirer une contrainte."
            actionLabel="Modifier les critères"
            isDarkMode={isDarkMode}
            onAction={onBack}
          />
        ) : decisionMode === "pick" && topPick ? (
          <View>
            <Text style={styles.kicker}>Meilleur choix maintenant</Text>
            <FeaturedRestaurantCard
              restaurant={topPick}
              isFavorite={favoriteIds.includes(topPick.id)}
              isDarkMode={isDarkMode}
              onPress={onOpenDetail}
              onToggleFavorite={onToggleFavorite}
            />
          </View>
        ) : (
          <View style={styles.listGap}>
            <Text style={[styles.resultCount, isDarkMode && styles.darkMutedText]}>
              {results.length} adresses pertinentes
            </Text>
            {results.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite={favoriteIds.includes(restaurant.id)}
                isDarkMode={isDarkMode}
                onPress={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Restaurant detail view with contact actions, food information and routing.
function DetailScreen({
  restaurant,
  criteria,
  isFavorite,
  isDarkMode,
  onBack,
  onOpenRoute,
  onToggleFavorite,
  onShare
}: {
  restaurant: ScoredRestaurant;
  criteria: SearchCriteria;
  isFavorite: boolean;
  isDarkMode: boolean;
  onBack: () => void;
  onOpenRoute: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  const confirmedDiet = Object.entries(restaurant.dietary).filter(
    ([, status]) => status === "confirmed"
  ) as [DietaryKey, string][];
  const unknownDiet = Object.entries(restaurant.dietary).filter(
    ([, status]) => status === "unknown"
  ) as [DietaryKey, string][];
  const matchedCuisineCriteria =
    criteria.cuisines.length > 0
      ? restaurant.cuisines.filter((cuisine) =>
          criteria.cuisines.some(
            (selectedCuisine) =>
              normalizeLabel(selectedCuisine) === normalizeLabel(cuisine)
          )
        )
      : restaurant.cuisines;
  const weeklyOpeningHours = getWeeklyOpeningHours(restaurant);

  // Opens the native phone app with the restaurant number.
  async function callRestaurant(phoneNumber: string) {
    const callUrl = `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
    const supported = await Linking.canOpenURL(callUrl);

    if (!supported) {
      Alert.alert(
        "Appel indisponible",
        "Votre appareil ne peut pas lancer d'appel depuis ce numéro."
      );
      return;
    }

    await Linking.openURL(callUrl);
  }

  // Opens the restaurant website, adding a protocol when the API returns a bare domain.
  async function openWebsite(websiteUrl: string) {
    const normalizedUrl = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const supported = await Linking.canOpenURL(normalizedUrl);

    if (!supported) {
      Alert.alert(
        "Lien indisponible",
        "Impossible d'ouvrir ce site depuis votre appareil."
      );
      return;
    }

    await Linking.openURL(normalizedUrl);
  }

  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <Header
        title={restaurant.name}
        subtitle={restaurant.address}
        isDarkMode={isDarkMode}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Image source={{ uri: restaurant.photoUrl }} style={styles.detailImage} />
        <View style={[styles.detailStats, isDarkMode && styles.darkSurface]}>
          <Metric
            icon={<Star size={17} color={colors.gold} fill={colors.gold} />}
            text={`${restaurant.rating} (${restaurant.reviewCount})`}
            isDarkMode={isDarkMode}
          />
          <Metric
            icon={<MapPin size={17} color={colors.coral} />}
            text={`${restaurant.distanceKm.toFixed(1)} km`}
            isDarkMode={isDarkMode}
          />
          <Metric
            icon={<Clock3 size={17} color={colors.brand} />}
            text={restaurant.openNow ? `Ouvert · ${restaurant.closesAt}` : "Fermé"}
            isDarkMode={isDarkMode}
          />
        </View>

        <View style={styles.hoursBlock}>
          <View style={styles.hoursHeader}>
            <Clock3 size={17} color={colors.brand} />
            <Text style={[styles.hoursTitle, isDarkMode && styles.darkText]}>
              Horaires d'ouverture
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hoursScroller}
          >
            {weeklyOpeningHours.map((opening) => (
              <View
                key={opening.day}
                style={[
                  styles.hourCard,
                  isDarkMode && styles.darkPanel,
                  opening.closed && styles.hourCardClosed,
                  isDarkMode && opening.closed && styles.darkClosedPanel
                ]}
              >
                <Text style={[styles.hourDay, isDarkMode && styles.darkText]}>
                  {opening.day}
                </Text>
                <Text
                  style={[
                    styles.hourText,
                    isDarkMode && styles.darkReasonText,
                    opening.closed && styles.hourTextClosed
                  ]}
                >
                  {opening.hours}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={[styles.addressAction, isDarkMode && styles.darkSurfaceRaised]}
          onPress={onOpenRoute}
        >
          <Map size={22} color={colors.coral} />
          <Text
            numberOfLines={2}
            style={[styles.addressActionText, isDarkMode && styles.darkText]}
          >
            {restaurant.address}
          </Text>
          <ChevronRight size={20} color={isDarkMode ? "#AEB9AD" : colors.muted} />
        </Pressable>

        <View style={[styles.detailBlock, isDarkMode && styles.darkSurfaceRaised]}>
          <Text style={[styles.detailTitle, isDarkMode && styles.darkText]}>
            Cuisine et budget
          </Text>
          <Text style={[styles.detailText, isDarkMode && styles.darkMutedText]}>
            {restaurant.cuisines.join(", ")} · {budgetLabels[restaurant.budget]} ·{" "}
            {restaurant.pricePerPerson}
          </Text>
          <View style={styles.criteriaBlock}>
            <View style={styles.reasonWrap}>
              {matchedCuisineCriteria.map((cuisine) => (
                <View
                  key={cuisine}
                  style={[
                    styles.criteriaPill,
                    isDarkMode && styles.darkCriteriaPill
                  ]}
                >
                  <Text
                    style={[
                      styles.criteriaPillText,
                      isDarkMode && styles.darkCriteriaPillText
                    ]}
                  >
                    {cuisine}
                  </Text>
                </View>
              ))}
            </View>
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

        <View style={[styles.detailBlock, isDarkMode && styles.darkSurfaceRaised]}>
          <Text style={[styles.detailTitle, isDarkMode && styles.darkText]}>
            Informations alimentaires
          </Text>
          <View style={styles.dietGrid}>
            {confirmedDiet.map(([diet]) => (
              <View key={diet} style={[styles.dietConfirmed, isDarkMode && styles.darkPanel]}>
                <ShieldCheck size={15} color={colors.success} />
                <Text style={styles.dietConfirmedText}>{dietaryLabels[diet]}</Text>
              </View>
            ))}
            {unknownDiet.slice(0, 4).map(([diet]) => (
              <View key={diet} style={[styles.dietUnknown, isDarkMode && styles.darkPanel]}>
                <Text style={styles.dietUnknownText}>{dietaryLabels[diet]} inconnu</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.detailBlock, isDarkMode && styles.darkSurfaceRaised]}>
          <Text style={[styles.detailTitle, isDarkMode && styles.darkText]}>Contact</Text>
          {restaurant.phone && (
            <Pressable
              style={styles.phoneLink}
              onPress={() => callRestaurant(restaurant.phone!)}
            >
              <Phone size={17} color={colors.blue} />
              <Text style={styles.phoneLinkText}>{restaurant.phone}</Text>
            </Pressable>
          )}
          {restaurant.website && (
            <Pressable
              style={styles.websiteLink}
              onPress={() => openWebsite(restaurant.website!)}
            >
              <Text style={styles.linkText}>{restaurant.website}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, isDarkMode && styles.darkBottomBar]}>
        <Pressable style={[styles.iconButton, isDarkMode && styles.darkSurface]} onPress={onShare}>
          <Share2 size={21} color={colors.brand} />
        </Pressable>
        <Pressable
          style={[styles.iconButton, isDarkMode && styles.darkSurface]}
          onPress={onToggleFavorite}
        >
          <Heart
            size={21}
            color={isFavorite ? colors.coral : colors.brand}
            fill={isFavorite ? colors.coral : "transparent"}
          />
        </Pressable>
        <Pressable style={styles.routeButton} onPress={onOpenRoute}>
          <Navigation size={20} color={colors.surface} />
          <Text style={styles.routeButtonText}>Itinéraire</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Lets the user choose their preferred external navigation app.
function RouteScreen({
  restaurant,
  isDarkMode,
  onBack,
  onOpenRoute
}: {
  restaurant: ScoredRestaurant;
  isDarkMode: boolean;
  onBack: () => void;
  onOpenRoute: (app: NavigationApp) => void;
}) {
  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <Header
        title="Itinéraire"
        subtitle={restaurant.name}
        isDarkMode={isDarkMode}
        onBack={onBack}
      />
      <View style={styles.routeContent}>
        <MapPin size={34} color={colors.coral} />
        <Text style={[styles.routeTitle, isDarkMode && styles.darkText]}>
          {restaurant.address}
        </Text>
        <View style={styles.routeOptions}>
          <RouteOption
            label="Apple Plans"
            icon={<MapPin size={22} color={colors.blue} />}
            isDarkMode={isDarkMode}
            onPress={() => onOpenRoute("apple")}
          />
          <RouteOption
            label="Google Maps"
            icon={<Navigation size={22} color={colors.brand} />}
            isDarkMode={isDarkMode}
            onPress={() => onOpenRoute("google")}
          />
          <RouteOption
            label="Waze"
            icon={<CarFront size={22} color={colors.coral} />}
            isDarkMode={isDarkMode}
            onPress={() => onOpenRoute("waze")}
          />
        </View>
      </View>
    </View>
  );
}

// Map tab fed by the previous search. The visual map is a lightweight placeholder
// until a native map provider is connected.
function MapScreen({
  criteria,
  results,
  favoriteIds,
  isDarkMode,
  onOpenDetail,
  onToggleFavorite,
  onGoSearch
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  favoriteIds: string[];
  isDarkMode: boolean;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
  onGoSearch: () => void;
}) {
  const visibleResults = results.slice(0, 8);

  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, isDarkMode && styles.darkText]}>Carte</Text>
        <Text style={[styles.tabSubtitle, isDarkMode && styles.darkMutedText]}>
          {results.length > 0
            ? `${results.length} restaurants autour de ${criteria.locationLabel}`
            : "Lancez une recherche pour remplir la carte."}
        </Text>
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon={<Map size={30} color={colors.brand} />}
          title="Aucune recherche pour l'instant"
          text="La carte affichera les restaurants issus de votre dernière recherche."
          actionLabel="Faire une recherche"
          isDarkMode={isDarkMode}
          onAction={onGoSearch}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.mapContent}>
          <View style={[styles.mapCanvas, isDarkMode && styles.darkMapCanvas]}>
            <View
              style={[
                styles.mapRoadHorizontal,
                isDarkMode && styles.darkMapRoad
              ]}
            />
            <View
              style={[
                styles.mapRoadVertical,
                isDarkMode && styles.darkMapRoad
              ]}
            />
            <View style={[styles.mapAreaOne, isDarkMode && styles.darkMapAreaOne]} />
            <View style={[styles.mapAreaTwo, isDarkMode && styles.darkMapAreaTwo]} />
            {visibleResults.map((restaurant, index) => (
              <Pressable
                key={restaurant.id}
                style={[
                  styles.mapPin,
                  {
                    left: `${18 + ((index * 23) % 66)}%`,
                    top: `${16 + ((index * 31) % 62)}%`
                  }
                ]}
                onPress={() => onOpenDetail(restaurant)}
              >
                <Text style={styles.mapPinText}>{index + 1}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.listGap}>
            {visibleResults.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite={favoriteIds.includes(restaurant.id)}
                isDarkMode={isDarkMode}
                onPress={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Favorites tab sorted by distance from the current user/search location.
function FavoritesScreen({
  favorites,
  isDarkMode,
  onOpenDetail,
  onToggleFavorite,
  onGoSearch
}: {
  favorites: ScoredRestaurant[];
  isDarkMode: boolean;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
  onGoSearch: () => void;
}) {
  const [favoriteSort] = useState<FavoriteSort>("distance");
  const onFavoriteSortChange = (_sort: FavoriteSort) => undefined;

  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, isDarkMode && styles.darkText]}>Favoris</Text>
        <Text style={[styles.tabSubtitle, isDarkMode && styles.darkMutedText]}>
          {favorites.length > 0
            ? `${favorites.length} restaurants sauvegardés`
            : "Gardez vos meilleures adresses sous la main."}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={30} color={colors.brand} />}
          title="Aucun favori"
          text="Ajoutez des restaurants avec le cœur depuis les résultats ou une fiche."
          actionLabel="Explorer les restaurants"
          isDarkMode={isDarkMode}
          onAction={onGoSearch}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.favoriteSortInfo}>
            <Pressable
              style={[
                styles.sortButton,
                isDarkMode && styles.darkSurface,
                styles.hidden,
                favoriteSort === "criteria" && styles.sortButtonActive
              ]}
              onPress={() => onFavoriteSortChange("criteria")}
            >
              <ListFilter
                size={16}
                color={favoriteSort === "criteria" ? colors.surface : colors.brand}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  isDarkMode && styles.darkSortButtonText,
                  favoriteSort === "criteria" && styles.sortButtonTextActive
                ]}
              >
                Critères
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.sortButton,
                isDarkMode && styles.darkSurface,
                favoriteSort === "distance" && styles.sortButtonActive
              ]}
              onPress={() => onFavoriteSortChange("distance")}
            >
              <MapPin
                size={16}
                color={favoriteSort === "distance" ? colors.surface : colors.brand}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  isDarkMode && styles.darkSortButtonText,
                  favoriteSort === "distance" && styles.sortButtonTextActive
                ]}
              >
                Distance
              </Text>
            </Pressable>
          </View>

          <View style={styles.listGap}>
            {favorites.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite
                isDarkMode={isDarkMode}
                onPress={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Profile tab for account entry points and saved preference settings.
function ProfileScreen({
  criteria,
  favoriteCount,
  resultsCount,
  isDarkMode,
  onDarkModeChange
}: {
  criteria: SearchCriteria;
  favoriteCount: number;
  resultsCount: number;
  isDarkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.profileContent,
        isDarkMode && styles.darkProfileContent
      ]}
    >
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <UserRound size={30} color={colors.surface} />
        </View>
        <View style={styles.profileHeroCopy}>
          <Text style={styles.profileName}>Mode invité</Text>
          <Text style={styles.profileSubtext}>
            Connectez-vous pour synchroniser vos favoris.
          </Text>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Connexion
        </Text>
        <ProfileRow
          icon={<UserRound size={20} color={colors.brand} />}
          label="Se connecter ou créer un compte"
          isDarkMode={isDarkMode}
        />
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Préférences
        </Text>
        <ProfileRow
          icon={<ShieldCheck size={20} color={colors.success} />}
          label="Régimes alimentaires"
          isDarkMode={isDarkMode}
        />
        <ProfileRow
          icon={<LocateFixed size={20} color={colors.coral} />}
          label="Localisation et confidentialité"
          isDarkMode={isDarkMode}
        />
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Paramètres
        </Text>
        <ProfileRow
          icon={<Languages size={20} color={colors.blue} />}
          label="Langue"
          isDarkMode={isDarkMode}
        />
        <ProfileRow
          icon={<UserCog size={20} color={colors.blue} />}
          label="Notifications"
          isDarkMode={isDarkMode}
        />
        <ThemeSwitchRow
          isDarkMode={isDarkMode}
          onDarkModeChange={onDarkModeChange}
        />
      </View>
    </ScrollView>
  );
}

// Reusable row used by the profile settings sections.
function ProfileRow({
  icon,
  label,
  isDarkMode
}: {
  icon: React.ReactNode;
  label: string;
  isDarkMode: boolean;
}) {
  return (
    <Pressable style={[styles.profileRow, isDarkMode && styles.darkProfileCard]}>
      <View style={[styles.profileRowIcon, isDarkMode && styles.darkProfileIcon]}>
        {icon}
      </View>
      <Text style={[styles.profileRowText, isDarkMode && styles.darkText]}>
        {label}
      </Text>
      <ChevronRight size={18} color={isDarkMode ? colors.line : colors.muted} />
    </Pressable>
  );
}

// Switch row dedicated to light/dark appearance in profile settings.
function ThemeSwitchRow({
  isDarkMode,
  onDarkModeChange
}: {
  isDarkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
}) {
  return (
    <View style={[styles.profileRow, isDarkMode && styles.darkProfileCard]}>
      <View style={[styles.profileRowIcon, isDarkMode && styles.darkProfileIcon]}>
        <Moon size={20} color={isDarkMode ? colors.gold : colors.blue} />
      </View>
      <View style={styles.themeSwitchCopy}>
        <Text style={[styles.profileRowText, isDarkMode && styles.darkText]}>
          Mode sombre
        </Text>
      </View>
      <Switch
        value={isDarkMode}
        onValueChange={onDarkModeChange}
        trackColor={{ false: colors.line, true: colors.brand }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

// Generic empty state used by tabs that depend on prior user activity.
function EmptyState({
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

// Bottom navigation between the four main app areas.
function BottomTabs({
  activeTab,
  isDarkMode,
  onTabChange
}: {
  activeTab: MainTab;
  isDarkMode: boolean;
  onTabChange: (tab: MainTab) => void;
}) {
  const tabs: Array<{
    id: MainTab;
    label: string;
    icon: (active: boolean) => React.ReactNode;
  }> = [
    {
      id: "search",
      label: "Recherche",
      icon: (active) => (
        <Search
          size={21}
          color={active ? colors.brand : isDarkMode ? "#AEB9AD" : colors.muted}
        />
      )
    },
    {
      id: "map",
      label: "Carte",
      icon: (active) => (
        <Map
          size={21}
          color={active ? colors.brand : isDarkMode ? "#AEB9AD" : colors.muted}
        />
      )
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: (active) => (
        <Heart
          size={21}
          color={active ? colors.brand : isDarkMode ? "#AEB9AD" : colors.muted}
          fill={active ? colors.brand : "transparent"}
        />
      )
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active) => (
        <UserRound
          size={21}
          color={active ? colors.brand : isDarkMode ? "#AEB9AD" : colors.muted}
        />
      )
    }
  ];

  return (
    <View style={[styles.bottomTabs, isDarkMode && styles.darkBottomTabs]}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.bottomTab}
            onPress={() => onTabChange(tab.id)}
          >
            {tab.icon(active)}
            <Text
              style={[
                styles.bottomTabText,
                isDarkMode && styles.darkMutedText,
                active && styles.bottomTabTextActive
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Shared top header for secondary screens.
function Header({
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

// Toggle pill used for context, cuisine and dietary filters.
function Chip({
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

// Restricts numeric values to the allowed filter range.
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Keeps slider and typed values aligned on the configured increment.
function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

// Avoids showing unnecessary decimals in number inputs and slider bounds.
function formatDecimal(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

// Normalizes labels before comparing cuisine criteria with restaurant tags.
function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Returns the best available user/search location for distance-based sorting.
function getCurrentSearchCoordinates(criteria: SearchCriteria): Coordinates | undefined {
  if (criteria.coordinates) return criteria.coordinates;

  const normalizedLocation = normalizeLabel(criteria.locationLabel);
  if (normalizedLocation.includes("toulouse")) {
    return { latitude: 43.6047, longitude: 1.4442 };
  }
  if (normalizedLocation.includes("marseille")) {
    return { latitude: 43.2965, longitude: 5.3698 };
  }
  if (normalizedLocation.includes("paris")) {
    return { latitude: 48.8566, longitude: 2.3522 };
  }

  return undefined;
}

// Calculates distance in kilometers between two coordinates with Haversine.
function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Builds a full-week schedule when the data source only provides "open now".
function getWeeklyOpeningHours(restaurant: ScoredRestaurant): WeeklyOpeningHour[] {
  if (restaurant.weeklyHours?.length) return restaurant.weeklyHours;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const isClosedNow = normalizeLabel(restaurant.closesAt).includes("ferme");
  const defaultClose = isClosedNow ? "22:00" : restaurant.closesAt;
  const isBrunch = restaurant.categories.includes("brunch");
  const isLate = restaurant.categories.includes("late");

  return days.map((day, index) => {
    if (isBrunch) {
      return {
        day,
        hours: index < 5 ? "09:00 - 16:00" : "10:00 - 17:00"
      };
    }

    if (index === 6 && !isLate) {
      return { day, hours: "Fermé", closed: true };
    }

    return {
      day,
      hours: `${index === 5 ? "12:00" : "11:30"} - ${defaultClose}`
    };
  });
}

// Hybrid number control: users can either drag the slider or type a value.
function NumberSliderField({
  icon,
  label,
  value,
  min,
  max,
  step,
  suffix,
  isDarkMode,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  isDarkMode: boolean;
  onChange: (value: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [draftValue, setDraftValue] = useState(formatDecimal(value));
  const onChangeRef = useRef(onChange);
  const trackWidthRef = useRef(trackWidth);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const dragStartValue = useRef(value);
  const percent = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    setDraftValue(formatDecimal(value));
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
    trackWidthRef.current = trackWidth;
    minRef.current = min;
    maxRef.current = max;
    stepRef.current = step;
  }, [onChange, trackWidth, min, max, step]);

  // Validates typed values and applies the same min/max rules as the slider.
  function commitValue(rawValue: string) {
    const parsed = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setDraftValue(formatDecimal(value));
      return;
    }

    const nextValue = roundToStep(clamp(parsed, min, max), step);
    onChangeRef.current(Number(nextValue.toFixed(1)));
  }

  // Centralizes slider clamping and rounding so drag and text input behave alike.
  function normalizeValue(rawValue: number) {
    return Number(
      roundToStep(
        clamp(rawValue, minRef.current, maxRef.current),
        stepRef.current
      ).toFixed(1)
    );
  }

  // Converts the initial touch position on the track into a filter value.
  function valueFromPosition(event: GestureResponderEvent) {
    const width = trackWidthRef.current;
    const x = clamp(event.nativeEvent.locationX, 0, width);
    return normalizeValue(
      minRef.current + (x / width) * (maxRef.current - minRef.current)
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const nextValue = valueFromPosition(event);
        dragStartValue.current = nextValue;
        onChangeRef.current(nextValue);
      },
      onPanResponderMove: (_event, gestureState) => {
        const width = trackWidthRef.current;
        const deltaValue =
          (gestureState.dx / width) * (maxRef.current - minRef.current);
        const nextValue = normalizeValue(dragStartValue.current + deltaValue);

        onChangeRef.current(nextValue);
      }
    })
  ).current;

  return (
    <View style={styles.numberField}>
      <View style={styles.numberFieldHeader}>
        <View style={styles.iconLabel}>
          {icon}
          <Text style={[styles.filterLabel, isDarkMode && styles.darkText]}>{label}</Text>
        </View>
        <View style={[styles.numberInputWrap, isDarkMode && styles.darkNumberInputWrap]}>
          <TextInput
            value={draftValue}
            onChangeText={(text) => {
              setDraftValue(text);
            }}
            onBlur={() => commitValue(draftValue)}
            onSubmitEditing={() => commitValue(draftValue)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={[styles.numberInput, isDarkMode && styles.darkText]}
          />
          <Text style={[styles.numberSuffix, isDarkMode && styles.darkMutedText]}>
            {suffix}
          </Text>
        </View>
      </View>
      <View
        style={styles.sliderTrack}
        onLayout={(event: LayoutChangeEvent) => {
          const nextTrackWidth = Math.max(1, event.nativeEvent.layout.width);
          trackWidthRef.current = nextTrackWidth;
          setTrackWidth(nextTrackWidth);
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderBase, isDarkMode && styles.darkSliderBase]} />
        <View style={[styles.sliderFill, { width: `${clamp(percent, 0, 100)}%` }]} />
        <View
          style={[
            styles.sliderThumb,
            isDarkMode && styles.darkSliderThumb,
            { left: `${clamp(percent, 0, 100)}%` }
          ]}
        />
      </View>
      <View style={styles.sliderBounds}>
        <Text style={[styles.sliderBoundText, isDarkMode && styles.darkMutedText]}>
          {formatDecimal(min)}
          {suffix}
        </Text>
        <Text style={[styles.sliderBoundText, isDarkMode && styles.darkMutedText]}>
          {formatDecimal(max)}
          {suffix}
        </Text>
      </View>
    </View>
  );
}

// Compact restaurant card shared by results, map and favorites tabs.
function RestaurantCard({
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
            icon={<Clock3 size={14} color={colors.brand} />}
            text={restaurant.openNow ? "Ouvert" : "Fermé"}
            isDarkMode={isDarkMode}
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
function FeaturedRestaurantCard({
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
function Metric({
  icon,
  text,
  isDarkMode = false
}: {
  icon: React.ReactNode;
  text: string;
  isDarkMode?: boolean;
}) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={[styles.metricText, isDarkMode && styles.darkText]}>{text}</Text>
    </View>
  );
}

// One tappable option in the external route picker.
function RouteOption({
  label,
  icon,
  isDarkMode,
  onPress
}: {
  label: string;
  icon: React.ReactNode;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.routeOption, isDarkMode && styles.darkSurfaceRaised]}
      onPress={onPress}
    >
      <View style={[styles.routeOptionIcon, isDarkMode && styles.darkPanel]}>
        {icon}
      </View>
      <Text style={[styles.routeOptionText, isDarkMode && styles.darkText]}>
        {label}
      </Text>
      <ChevronRight size={20} color={isDarkMode ? "#AEB9AD" : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  darkSafeArea: {
    backgroundColor: "#111712"
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background
  },
  darkFlex: {
    backgroundColor: "#111712"
  },
  tabShell: {
    flex: 1,
    backgroundColor: colors.background
  },
  darkTabShell: {
    backgroundColor: "#111712"
  },
  tabContent: {
    flex: 1,
    paddingBottom: 78
  },
  darkTabContent: {
    backgroundColor: "#111712"
  },
  screen: {
    padding: 20,
    paddingBottom: 34,
    gap: 18
  },
  darkScreen: {
    backgroundColor: "#111712"
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
  numberField: {
    gap: 10
  },
  numberFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  numberInputWrap: {
    minWidth: 86,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  numberInput: {
    minWidth: 34,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    padding: 0
  },
  numberSuffix: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 3
  },
  sliderTrack: {
    height: 40,
    justifyContent: "center"
  },
  sliderBase: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand
  },
  sliderThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.brand,
    ...shadow
  },
  sliderBounds: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sliderBoundText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
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
  searchErrorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "900",
    marginTop: -8
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
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
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
  featuredTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  featuredName: {
    flex: 1,
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900"
  },
  favoriteButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
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
  criteriaBlock: {
    gap: 8
  },
  criteriaLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  criteriaPill: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.softCoral
  },
  criteriaPillText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  hoursBlock: {
    gap: 12
  },
  hoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14
  },
  hoursTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  hoursScroller: {
    paddingHorizontal: 0,
    gap: 9
  },
  hourCard: {
    width: 112,
    minHeight: 72,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    padding: 10,
    justifyContent: "space-between"
  },
  hourCardClosed: {
    backgroundColor: colors.softCoral,
    borderColor: colors.softCoral
  },
  hourDay: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  hourText: {
    color: colors.brandDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800"
  },
  hourTextClosed: {
    color: colors.coral
  },
  addressAction: {
    minHeight: 70,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadow
  },
  addressActionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
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
    fontWeight: "800",
    textDecorationLine: "underline"
  },
  websiteLink: {
    alignSelf: "flex-start",
    paddingVertical: 6
  },
  phoneLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6
  },
  phoneLinkText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900"
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
  bottomTabs: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    ...shadow
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  bottomTabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  bottomTabTextActive: {
    color: colors.brand
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
  },
  tabHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 4
  },
  tabTitle: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900"
  },
  tabSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  mapContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14
  },
  mapCanvas: {
    height: 310,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    overflow: "hidden",
    ...shadow
  },
  mapRoadHorizontal: {
    position: "absolute",
    left: -30,
    right: -30,
    top: "48%",
    height: 26,
    backgroundColor: colors.surface,
    transform: [{ rotate: "-10deg" }]
  },
  mapRoadVertical: {
    position: "absolute",
    top: -40,
    bottom: -40,
    left: "52%",
    width: 24,
    backgroundColor: colors.surface,
    transform: [{ rotate: "18deg" }]
  },
  mapAreaOne: {
    position: "absolute",
    width: 120,
    height: 96,
    borderRadius: 18,
    backgroundColor: colors.softBlue,
    left: 22,
    top: 24
  },
  mapAreaTwo: {
    position: "absolute",
    width: 142,
    height: 112,
    borderRadius: 20,
    backgroundColor: colors.softCoral,
    right: 20,
    bottom: 24
  },
  mapPin: {
    position: "absolute",
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow
  },
  mapPinText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "900"
  },
  sortBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  favoriteSortInfo: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  hidden: {
    display: "none"
  },
  sortButton: {
    flex: 1,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  sortButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  sortButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "900"
  },
  sortButtonTextActive: {
    color: colors.surface
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center"
  },
  emptyButton: {
    minHeight: 46,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  emptyButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900"
  },
  profileContent: {
    padding: 20,
    paddingBottom: 102,
    gap: 16
  },
  darkHeader: {
    backgroundColor: "#111712",
    borderBottomWidth: 1,
    borderBottomColor: "#2C3A30"
  },
  darkBottomTabs: {
    backgroundColor: "#172018",
    borderTopColor: "#2C3A30"
  },
  darkBottomBar: {
    backgroundColor: "#111712",
    borderTopColor: "#2C3A30"
  },
  darkSurface: {
    backgroundColor: "#1B241D",
    borderColor: "#36503D"
  },
  darkSurfaceRaised: {
    backgroundColor: "#1B241D",
    borderColor: "#36503D"
  },
  darkPanel: {
    backgroundColor: "#243328",
    borderColor: "#4E6B55"
  },
  darkChip: {
    backgroundColor: "#223127",
    borderColor: "#5B7A62"
  },
  darkChipActive: {
    backgroundColor: "#7BE495",
    borderColor: "#A6F2B8"
  },
  darkChipText: {
    color: "#F3F6EF"
  },
  darkChipTextActive: {
    color: "#102016"
  },
  darkSegmentActive: {
    backgroundColor: "#7BE495"
  },
  darkNumberInputWrap: {
    backgroundColor: "#111712",
    borderColor: "#4E6B55"
  },
  darkSliderBase: {
    backgroundColor: "#36503D"
  },
  darkSliderThumb: {
    backgroundColor: "#F3F6EF",
    borderColor: "#7BE495"
  },
  darkCompactReason: {
    color: "#D8FFE0",
    backgroundColor: "#254733"
  },
  darkReasonText: {
    color: "#D8FFE0"
  },
  darkCriteriaPill: {
    backgroundColor: "#34261C",
    borderWidth: 1,
    borderColor: "#FFB39F"
  },
  darkCriteriaPillText: {
    color: "#FFB39F"
  },
  darkClosedPanel: {
    backgroundColor: "#3B2421",
    borderColor: "#74443D"
  },
  darkMapCanvas: {
    backgroundColor: "#172018",
    borderColor: "#36503D"
  },
  darkMapRoad: {
    backgroundColor: "#26362B"
  },
  darkMapAreaOne: {
    backgroundColor: "#203A45"
  },
  darkMapAreaTwo: {
    backgroundColor: "#3B2421"
  },
  darkSortButtonText: {
    color: "#7BE495"
  },
  darkProfileContent: {
    backgroundColor: "#111712"
  },
  profileHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.ink
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center"
  },
  profileHeroCopy: {
    flex: 1,
    gap: 3
  },
  profileName: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "900"
  },
  profileSubtext: {
    color: colors.line,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700"
  },
  profileStats: {
    flexDirection: "row",
    gap: 10
  },
  profileStat: {
    flex: 1,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  profileStatValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  profileStatLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  profileSection: {
    gap: 9
  },
  profileSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  profileRow: {
    minHeight: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  profileRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center"
  },
  profileRowText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  themeSwitchCopy: {
    flex: 1,
    gap: 2
  },
  themeSwitchHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  darkProfileCard: {
    backgroundColor: "#1B241D",
    borderColor: "#2C3A30"
  },
  darkProfileIcon: {
    backgroundColor: "#243328"
  },
  darkText: {
    color: "#F3F6EF"
  },
  darkMutedText: {
    color: "#AEB9AD"
  }
});
