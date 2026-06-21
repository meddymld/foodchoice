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
  ListFilter,
  LocateFixed,
  Map,
  MapPin,
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
  "desserts"
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
type MainTab = "search" | "map" | "favorites" | "profile";
type FavoriteSort = "distance" | "criteria";

export default function App() {
  const [screen, setScreen] = useState<Screen>("search");
  const [activeTab, setActiveTab] = useState<MainTab>("search");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [selected, setSelected] = useState<ScoredRestaurant | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteSort, setFavoriteSort] = useState<FavoriteSort>("criteria");
  const [decisionMode, setDecisionMode] = useState<DecisionMode>("list");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const topPick = useMemo(() => results[0], [results]);
  const favorites = useMemo(
    () =>
      results
        .filter((restaurant) => favoriteIds.includes(restaurant.id))
        .sort((a, b) =>
          favoriteSort === "distance"
            ? a.distanceKm - b.distanceKm
            : b.score - a.score
        ),
    [favoriteIds, favoriteSort, results]
  );

  async function runSearch(mode: DecisionMode = decisionMode) {
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

  async function useCurrentLocation() {
    const resolvedCriteria = await resolveCriteriaLocation(criteria, true);
    if (resolvedCriteria) setCriteria(resolvedCriteria);
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

  function toggleFavorite(restaurantId: string) {
    setFavoriteIds((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId]
    );
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
      {screen !== "detail" && screen !== "route" && (
        <View style={styles.tabShell}>
          <View style={styles.tabContent}>
            {activeTab === "search" && screen === "search" && (
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

            {activeTab === "search" && screen === "results" && (
              <ResultsScreen
                criteria={criteria}
                results={results}
                topPick={topPick}
                decisionMode={decisionMode}
                favoriteIds={favoriteIds}
                onDecisionModeChange={setDecisionMode}
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
                favoriteSort={favoriteSort}
                onFavoriteSortChange={setFavoriteSort}
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
              />
            )}
          </View>

          <BottomTabs
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        </View>
      )}

      {screen === "detail" && selected && (
        <DetailScreen
          restaurant={selected}
          isFavorite={favoriteIds.includes(selected.id)}
          onBack={() => setScreen(activeTab === "search" ? "results" : "search")}
          onOpenRoute={() => setScreen("route")}
          onToggleFavorite={() => toggleFavorite(selected.id)}
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
        <NumberSliderField
          icon={<Star size={18} color={colors.gold} fill={colors.gold} />}
          label="Note minimale"
          value={criteria.minRating}
          min={1}
          max={5}
          step={0.1}
          suffix="/5"
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
  favoriteIds,
  onDecisionModeChange,
  onBack,
  onOpenDetail,
  onToggleFavorite
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  topPick?: ScoredRestaurant;
  decisionMode: DecisionMode;
  favoriteIds: string[];
  onDecisionModeChange: (mode: DecisionMode) => void;
  onBack: () => void;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
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
            <FeaturedRestaurantCard
              restaurant={topPick}
              isFavorite={favoriteIds.includes(topPick.id)}
              onPress={onOpenDetail}
              onToggleFavorite={onToggleFavorite}
            />
          </View>
        ) : (
          <View style={styles.listGap}>
            <Text style={styles.resultCount}>{results.length} adresses pertinentes</Text>
            {results.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite={favoriteIds.includes(restaurant.id)}
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

function DetailScreen({
  restaurant,
  isFavorite,
  onBack,
  onOpenRoute,
  onToggleFavorite,
  onShare
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
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

      <View style={styles.bottomBar}>
        <Pressable style={styles.iconButton} onPress={onShare}>
          <Share2 size={21} color={colors.brand} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onToggleFavorite}>
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

function MapScreen({
  criteria,
  results,
  favoriteIds,
  onOpenDetail,
  onToggleFavorite,
  onGoSearch
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  favoriteIds: string[];
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
  onGoSearch: () => void;
}) {
  const visibleResults = results.slice(0, 8);

  return (
    <View style={styles.flex}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Carte</Text>
        <Text style={styles.tabSubtitle}>
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
          onAction={onGoSearch}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.mapContent}>
          <View style={styles.mapCanvas}>
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapAreaOne} />
            <View style={styles.mapAreaTwo} />
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

function FavoritesScreen({
  favorites,
  favoriteSort,
  onFavoriteSortChange,
  onOpenDetail,
  onToggleFavorite,
  onGoSearch
}: {
  favorites: ScoredRestaurant[];
  favoriteSort: FavoriteSort;
  onFavoriteSortChange: (sort: FavoriteSort) => void;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
  onGoSearch: () => void;
}) {
  return (
    <View style={styles.flex}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Favoris</Text>
        <Text style={styles.tabSubtitle}>
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
          onAction={onGoSearch}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.sortBar}>
            <Pressable
              style={[
                styles.sortButton,
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
                  favoriteSort === "criteria" && styles.sortButtonTextActive
                ]}
              >
                Critères
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.sortButton,
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

function ProfileScreen({
  criteria,
  favoriteCount,
  resultsCount
}: {
  criteria: SearchCriteria;
  favoriteCount: number;
  resultsCount: number;
}) {
  return (
    <ScrollView contentContainerStyle={styles.profileContent}>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <UserRound size={30} color={colors.surface} />
        </View>
        <View style={styles.profileHeroCopy}>
          <Text style={styles.profileName}>Mode invité</Text>
          <Text style={styles.profileSubtext}>
            Connectez-vous plus tard pour synchroniser vos favoris.
          </Text>
        </View>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatValue}>{favoriteCount}</Text>
          <Text style={styles.profileStatLabel}>favoris</Text>
        </View>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatValue}>{resultsCount}</Text>
          <Text style={styles.profileStatLabel}>résultats</Text>
        </View>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatValue}>{budgetLabels[criteria.budget]}</Text>
          <Text style={styles.profileStatLabel}>budget</Text>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Connexion</Text>
        <ProfileRow icon={<UserRound size={20} color={colors.brand} />} label="Se connecter ou créer un compte" />
        <ProfileRow icon={<Heart size={20} color={colors.coral} />} label="Synchroniser les favoris" />
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Préférences</Text>
        <ProfileRow icon={<SlidersHorizontal size={20} color={colors.brand} />} label={`Budget par défaut ${budgetLabels[criteria.budget]}`} />
        <ProfileRow icon={<ShieldCheck size={20} color={colors.success} />} label="Régimes alimentaires" />
        <ProfileRow icon={<LocateFixed size={20} color={colors.coral} />} label="Localisation et confidentialité" />
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Paramètres</Text>
        <ProfileRow icon={<UserCog size={20} color={colors.blue} />} label="Notifications et langue" />
        <ProfileRow icon={<Compass size={20} color={colors.brand} />} label="Applications d'itinéraire" />
      </View>
    </ScrollView>
  );
}

function ProfileRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable style={styles.profileRow}>
      <View style={styles.profileRowIcon}>{icon}</View>
      <Text style={styles.profileRowText}>{label}</Text>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      <Pressable style={styles.emptyButton} onPress={onAction}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function BottomTabs({
  activeTab,
  onTabChange
}: {
  activeTab: MainTab;
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
        <Search size={21} color={active ? colors.brand : colors.muted} />
      )
    },
    {
      id: "map",
      label: "Carte",
      icon: (active) => (
        <Map size={21} color={active ? colors.brand : colors.muted} />
      )
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: (active) => (
        <Heart
          size={21}
          color={active ? colors.brand : colors.muted}
          fill={active ? colors.brand : "transparent"}
        />
      )
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active) => (
        <UserRound size={21} color={active ? colors.brand : colors.muted} />
      )
    }
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.bottomTab}
            onPress={() => onTabChange(tab.id)}
          >
            {tab.icon(active)}
            <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function NumberSliderField({
  icon,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
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

  function commitValue(rawValue: string) {
    const parsed = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setDraftValue(formatDecimal(value));
      return;
    }

    const nextValue = roundToStep(clamp(parsed, min, max), step);
    onChangeRef.current(Number(nextValue.toFixed(1)));
  }

  function normalizeValue(rawValue: number) {
    return Number(
      roundToStep(
        clamp(rawValue, minRef.current, maxRef.current),
        stepRef.current
      ).toFixed(1)
    );
  }

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
          <Text style={styles.filterLabel}>{label}</Text>
        </View>
        <View style={styles.numberInputWrap}>
          <TextInput
            value={draftValue}
            onChangeText={(text) => {
              setDraftValue(text);
            }}
            onBlur={() => commitValue(draftValue)}
            onSubmitEditing={() => commitValue(draftValue)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={styles.numberInput}
          />
          <Text style={styles.numberSuffix}>{suffix}</Text>
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
        <View style={styles.sliderBase} />
        <View style={[styles.sliderFill, { width: `${clamp(percent, 0, 100)}%` }]} />
        <View
          style={[
            styles.sliderThumb,
            { left: `${clamp(percent, 0, 100)}%` }
          ]}
        />
      </View>
      <View style={styles.sliderBounds}>
        <Text style={styles.sliderBoundText}>
          {formatDecimal(min)}
          {suffix}
        </Text>
        <Text style={styles.sliderBoundText}>
          {formatDecimal(max)}
          {suffix}
        </Text>
      </View>
    </View>
  );
}

function RestaurantCard({
  restaurant,
  isFavorite,
  onPress,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  onPress: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable style={styles.restaurantCard} onPress={() => onPress(restaurant)}>
      <Image source={{ uri: restaurant.photoUrl }} style={styles.restaurantImage} />
      <View style={styles.restaurantCopy}>
        <View style={styles.cardTopline}>
          <Text numberOfLines={1} style={styles.restaurantName}>
            {restaurant.name}
          </Text>
          <Pressable
            style={styles.favoriteButton}
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
  isFavorite,
  onPress,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  onPress: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable style={styles.featuredCard} onPress={() => onPress(restaurant)}>
      <Image source={{ uri: restaurant.photoUrl }} style={styles.featuredImage} />
      <View style={styles.featuredBody}>
        <View style={styles.featuredTitleRow}>
          <Text style={styles.featuredName}>{restaurant.name}</Text>
          <Pressable
            style={styles.favoriteButtonLarge}
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
  tabShell: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabContent: {
    flex: 1,
    paddingBottom: 78
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
  }
});
