import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ActionSheetIOS,
  Animated,
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
  TouchableOpacity,
  View
} from "react-native";
import {
  ArrowDownAZ,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Euro,
  Heart,
  Languages,
  Lightbulb,
  LocateFixed,
  Lock,
  Map,
  MapPin,
  Mail,
  Moon,
  Navigation,
  Phone,
  Search,
  Share2,
  Send,
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

const contextEmojis: Record<MealContext, string> = {
  quick: "⚡",
  friends: "🥂",
  date: "💘",
  family: "👨‍👩‍👧",
  solo: "🙋",
  travel: "🧳"
};

const defaultCriteria: SearchCriteria = {
  locationLabel: "",
  contexts: [],
  budget: [],
  cuisines: [],
  dietary: [],
  minRating: 1,
  openNowOnly: true,
  maxDistanceKm: 25,
};

type Screen = "search" | "results" | "detail" | "auth";
type DecisionMode = "list" | "pick";
type MainTab = "search" | "map" | "favorites" | "profile";
type RestaurantSort = "distance" | "rating" | "name" | "price";
type AuthMode = "signIn" | "signUp";
type Account = {
  name: string;
  email: string;
  provider: "email" | "google";
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("search");
  const [activeTab, setActiveTab] = useState<MainTab>("search");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [selected, setSelected] = useState<ScoredRestaurant | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [registeredAccount, setRegisteredAccount] = useState<
    (Account & { password: string }) | null
  >(null);
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
    () => {
      if (!account) return [];

      return favoriteIds
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
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
    [account, criteria, currentLocation, favoriteIds, results]
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

  // Adds or removes one budget level. With none selected, every budget is allowed.
  function toggleBudget(budget: BudgetLevel) {
    setCriteria((current) => ({
      ...current,
      budget: current.budget.includes(budget)
        ? current.budget.filter((item) => item !== budget)
        : [...current.budget, budget]
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
    if (!account) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour enregistrer vos restaurants favoris.",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Se connecter",
            onPress: () => {
              setActiveTab("profile");
              setScreen("auth");
            }
          }
        ]
      );
      return;
    }

    setFavoriteIds((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId]
    );
  }

  // Stores a prototype account in memory until a real authentication backend exists.
  function submitCredentials({
    mode,
    name,
    email,
    password
  }: {
    mode: AuthMode;
    name: string;
    email: string;
    password: string;
  }) {
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signUp") {
      const nextAccount = {
        name: name.trim(),
        email: normalizedEmail,
        provider: "email" as const
      };
      setRegisteredAccount({ ...nextAccount, password });
      setAccount(nextAccount);
      setScreen("search");
      return null;
    }

    if (
      !registeredAccount ||
      registeredAccount.email !== normalizedEmail ||
      registeredAccount.password !== password
    ) {
      return "Email ou mot de passe incorrect.";
    }

    setAccount({
      name: registeredAccount.name,
      email: registeredAccount.email,
      provider: "email"
    });
    setScreen("search");
    return null;
  }

  // Google is a local prototype session until OAuth client credentials are configured.
  function signInWithGoogle() {
    setAccount({
      name: "Utilisateur Google",
      email: "google.user@foodchoice.app",
      provider: "google"
    });
    setScreen("search");
  }

  // Opens the platform-native navigation chooser from the address action.
  function showNavigationOptions() {
    if (!selected) return;

    const navigationOptions: Array<{ label: string; app: NavigationApp }> =
      Platform.OS === "ios"
        ? [
            { label: "Apple Plans", app: "apple" },
            { label: "Google Maps", app: "google" },
            { label: "Waze", app: "waze" }
          ]
        : [
            { label: "Google Maps", app: "google" },
            { label: "Waze", app: "waze" }
          ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Itinéraire",
          message: selected.address,
          options: [...navigationOptions.map((option) => option.label), "Annuler"],
          cancelButtonIndex: navigationOptions.length
        },
        (buttonIndex) => {
          const option = navigationOptions[buttonIndex];
          if (option) void openRoute(option.app);
        }
      );
      return;
    }

    Alert.alert(
      "Itinéraire",
      selected.address,
      [
        ...navigationOptions.map((option) => ({
          text: option.label,
          onPress: () => void openRoute(option.app)
        })),
        { text: "Annuler", style: "cancel" as const }
      ]
    );
  }

  // Builds deep links for the supported navigation apps.
  async function openRoute(app: NavigationApp) {
    if (!selected) return;

    const { latitude, longitude } = selected.coordinates;
    const encodedName = encodeURIComponent(selected.name);
    const webMapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodedName}`;
    const urls: Record<NavigationApp, string> = {
      google:
        Platform.OS === "android"
          ? `google.navigation:q=${latitude},${longitude}`
          : Platform.OS === "ios"
            ? `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`
            : webMapUrl,
      apple:
        Platform.OS === "ios"
          ? `maps://?q=${encodedName}&ll=${latitude},${longitude}`
          : `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`,
      waze:
        Platform.OS === "web"
          ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
          : `waze://?ll=${latitude},${longitude}&navigate=yes`
    };
    const fallbacks: Record<NavigationApp, string> = {
      google: webMapUrl,
      apple: `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    };

    const supported = await Linking.canOpenURL(urls[app]);
    await Linking.openURL(supported ? urls[app] : fallbacks[app]);
  }

  // Shares the selected restaurant through the native share sheet.
  async function shareRestaurant() {
    if (!selected) return;
    await Share.share({
      message: `${selected.name} - ${selected.address}`
    });
  }

  function suggestImprovement() {
    Alert.alert(
      "Suggérer une amélioration",
      "Merci pour votre idée. La collecte des suggestions sera connectée prochainement."
    );
  }

  async function inviteFriend() {
    await Share.share({
      message: "Rejoins-moi sur foodchoice pour choisir où manger sans débat."
    });
  }

  function rateFoodChoice() {
    Alert.alert(
      "Noter FoodChoice",
      "La redirection vers l'App Store ou Google Play sera ajoutée avant la publication."
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {screen !== "detail" && screen !== "auth" && (
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
                onToggleBudget={toggleBudget}
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
                isAuthenticated={Boolean(account)}
                isDarkMode={isDarkMode}
                onOpenDetail={openDetail}
                onToggleFavorite={toggleFavorite}
                onGoAuth={() => {
                  setActiveTab("profile");
                  setScreen("auth");
                }}
                onGoSearch={() => {
                  setActiveTab("search");
                  setScreen("search");
                }}
              />
            )}

            {activeTab === "profile" && (
              <ProfileScreen
                criteria={criteria}
                favoriteCount={account ? favoriteIds.length : 0}
                resultsCount={results.length}
                account={account}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
                onOpenAuth={() => setScreen("auth")}
                onSignOut={() => setAccount(null)}
                onSuggestImprovement={suggestImprovement}
                onInviteFriend={inviteFriend}
                onRateFoodChoice={rateFoodChoice}
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
          onOpenRoute={showNavigationOptions}
          onToggleFavorite={() => toggleFavorite(selected.id)}
          onShare={shareRestaurant}
        />
      )}

      {screen === "auth" && (
        <AuthScreen
          isDarkMode={isDarkMode}
          onBack={() => setScreen("search")}
          onGoogleSignIn={signInWithGoogle}
          onSubmitCredentials={submitCredentials}
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
  onToggleBudget,
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
  onToggleBudget: (budget: BudgetLevel) => void;
  onToggleCuisine: (cuisine: string) => void;
  onToggleDiet: (diet: DietaryKey) => void;
  onSearch: () => void;
  onPick: () => void;
}) {
  const activeFilterCount =
    criteria.contexts.length +
    criteria.budget.length +
    criteria.cuisines.length +
    criteria.dietary.length +
    Number(criteria.minRating !== defaultCriteria.minRating) +
    Number(criteria.maxDistanceKm !== defaultCriteria.maxDistanceKm);

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
              label={`${contextEmojis[context]} ${contextLabels[context]}`}
              active={criteria.contexts.includes(context)}
              isDarkMode={isDarkMode}
              onPress={() => onToggleContext(context)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Budget</Text>
        <View style={styles.gridChips}>
          {([1, 2, 3, 4] as BudgetLevel[]).map((budget) => (
            <Chip
              key={budget}
              label={budgetLabels[budget]}
              active={criteria.budget.includes(budget)}
              isDarkMode={isDarkMode}
              onPress={() => onToggleBudget(budget)}
            />
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

      <View style={styles.filtersHeading}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Filtres</Text>
        <View style={[styles.filterCountBadge, isDarkMode && styles.darkFilterCountBadge]}>
          <Text style={styles.filterCountText}>{activeFilterCount}</Text>
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
          max={25}
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
  const [sort, setSort] = useState<RestaurantSort>("distance");
  const sortedResults = useMemo(() => sortRestaurants(results, sort), [results, sort]);

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
            <SortControls value={sort} isDarkMode={isDarkMode} onChange={setSort} />
            <Text style={[styles.resultCount, isDarkMode && styles.darkMutedText]}>
              {results.length} adresses pertinentes
            </Text>
            {sortedResults.map((restaurant) => (
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
  const currentWeekday = getCurrentFrenchWeekday();

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
            {weeklyOpeningHours.map((opening) => {
              const isCurrentDay = opening.day === currentWeekday;

              return (
                <View
                  key={opening.day}
                  style={[
                    styles.hourCard,
                    isDarkMode && styles.darkPanel,
                    opening.closed && styles.hourCardClosed,
                    isDarkMode && opening.closed && styles.darkClosedPanel,
                    isCurrentDay && styles.hourCardCurrent,
                    isDarkMode && isCurrentDay && styles.darkHourCardCurrent
                  ]}
                >
                  <Text
                    style={[
                      styles.hourDay,
                      isDarkMode && styles.darkText,
                      isCurrentDay && styles.hourTextCurrent,
                      isDarkMode && isCurrentDay && styles.darkHourTextCurrent
                    ]}
                  >
                    {opening.day}
                  </Text>
                  <Text
                    style={[
                      styles.hourText,
                      isDarkMode && styles.darkReasonText,
                      opening.closed && styles.hourTextClosed,
                      isCurrentDay && styles.hourTextCurrent,
                      isDarkMode && isCurrentDay && styles.darkHourTextCurrent
                    ]}
                  >
                    {opening.hours}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.addressAction, isDarkMode && styles.darkSurfaceRaised]}
          onPress={onOpenRoute}
          activeOpacity={0.72}
        >
          <Map size={22} color={colors.coral} />
          <Text
            numberOfLines={2}
            style={[styles.addressActionText, isDarkMode && styles.darkText]}
          >
            {restaurant.address}
          </Text>
          <ChevronRight size={20} color={isDarkMode ? "#AEB9AD" : colors.muted} />
        </TouchableOpacity>

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
        <TouchableOpacity
          style={styles.routeButton}
          onPress={onOpenRoute}
          activeOpacity={0.8}
        >
          <Navigation size={20} color={colors.surface} />
          <Text style={styles.routeButtonText}>Itinéraire</Text>
        </TouchableOpacity>
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
          title="Aucune carte visible sans recherche"
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
  isAuthenticated,
  isDarkMode,
  onOpenDetail,
  onToggleFavorite,
  onGoAuth,
  onGoSearch
}: {
  favorites: ScoredRestaurant[];
  isAuthenticated: boolean;
  isDarkMode: boolean;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
  onGoAuth: () => void;
  onGoSearch: () => void;
}) {
  const [sort, setSort] = useState<RestaurantSort>("distance");
  const sortedFavorites = useMemo(
    () => sortRestaurants(favorites, sort),
    [favorites, sort]
  );

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

      {!isAuthenticated ? (
        <EmptyState
          icon={<Heart size={30} color={colors.brand} />}
          title="Connectez-vous pour vos favoris"
          text="Enregistrez vos restaurants préférés et retrouvez-les dans votre profil."
          actionLabel="Se connecter"
          isDarkMode={isDarkMode}
          onAction={onGoAuth}
        />
      ) : favorites.length === 0 ? (
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
          <SortControls value={sort} isDarkMode={isDarkMode} onChange={setSort} />

          <View style={styles.listGap}>
            {sortedFavorites.map((restaurant) => (
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
  account,
  isDarkMode,
  onDarkModeChange,
  onOpenAuth,
  onSignOut,
  onSuggestImprovement,
  onInviteFriend,
  onRateFoodChoice
}: {
  criteria: SearchCriteria;
  favoriteCount: number;
  resultsCount: number;
  account: Account | null;
  isDarkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSuggestImprovement: () => void;
  onInviteFriend: () => void;
  onRateFoodChoice: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.profileContent,
        isDarkMode && styles.darkProfileContent
      ]}
    >
      <View style={[styles.profileHero, isDarkMode && styles.darkProfileHero]}>
        <View style={styles.profileAvatar}>
          <UserRound size={30} color={colors.surface} />
        </View>
        <View style={styles.profileHeroCopy}>
          <Text style={[styles.profileName, isDarkMode && styles.darkProfileName]}>
            {account?.name ?? "Mode invité"}
          </Text>
          <Text style={[styles.profileSubtext, isDarkMode && styles.darkProfileSubtext]}>
            {account?.email ?? "Connectez-vous pour synchroniser vos favoris."}
          </Text>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Connexion
        </Text>
        <ProfileRow
          icon={<UserRound size={20} color={colors.brand} />}
          label={account ? "Se déconnecter" : "Se connecter ou créer un compte"}
          isDarkMode={isDarkMode}
          onPress={account ? onSignOut : onOpenAuth}
        />
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Préférences
        </Text>
        <ProfileRow
          icon={<ShieldCheck size={20} color={colors.success} />}
          label="Mes préférences alimentaires"
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

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          FoodChoice
        </Text>
        <ProfileRow
          icon={<Lightbulb size={20} color={colors.gold} />}
          label="Suggérer une amélioration"
          isDarkMode={isDarkMode}
          onPress={onSuggestImprovement}
        />
        <ProfileRow
          icon={<Send size={20} color={colors.blue} />}
          label="Inviter un ami"
          isDarkMode={isDarkMode}
          onPress={onInviteFriend}
        />
        <ProfileRow
          icon={<Star size={20} color={colors.gold} fill={colors.gold} />}
          label="Noter FoodChoice"
          isDarkMode={isDarkMode}
          onPress={onRateFoodChoice}
        />
      </View>
    </ScrollView>
  );
}

// Reusable row used by the profile settings sections.
function ProfileRow({
  icon,
  label,
  isDarkMode,
  onPress
}: {
  icon: React.ReactNode;
  label: string;
  isDarkMode: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.profileRow, isDarkMode && styles.darkProfileCard]}
      onPress={onPress}
    >
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

// Authentication form for the local MVP account flow and the Google entry point.
function AuthScreen({
  isDarkMode,
  onBack,
  onGoogleSignIn,
  onSubmitCredentials
}: {
  isDarkMode: boolean;
  onBack: () => void;
  onGoogleSignIn: () => void;
  onSubmitCredentials: (payload: {
    mode: AuthMode;
    name: string;
    email: string;
    password: string;
  }) => string | null;
}) {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const isSignUp = mode === "signUp";

  function submit() {
    if (isSignUp && name.trim().length < 2) {
      setFormError("Indiquez votre prénom.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Indiquez une adresse email valide.");
      return;
    }
    if (password.length < 6) {
      setFormError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setFormError(onSubmitCredentials({ mode, name, email, password }));
  }

  function toggleMode() {
    setMode((current) => (current === "signIn" ? "signUp" : "signIn"));
    setFormError(null);
  }

  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      <Header
        title={isSignUp ? "Créer un compte" : "Connexion"}
        subtitle="foodchoice"
        isDarkMode={isDarkMode}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={[styles.authContent, isDarkMode && styles.darkScreen]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authIntro}>
          <Text style={[styles.authTitle, isDarkMode && styles.darkText]}>
            {isSignUp ? "Vos bonnes adresses, à vous." : "Ravi de vous revoir."}
          </Text>
          <Text style={[styles.authDescription, isDarkMode && styles.darkMutedText]}>
            {isSignUp
              ? "Créez un compte pour retrouver vos favoris sur vos appareils."
              : "Connectez-vous pour retrouver vos favoris et vos préférences."}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.googleButton, isDarkMode && styles.darkSurfaceRaised]}
          onPress={onGoogleSignIn}
          activeOpacity={0.72}
        >
          <View style={styles.googleMark}>
            <Text style={styles.googleMarkText}>G</Text>
          </View>
          <Text style={[styles.googleButtonText, isDarkMode && styles.darkText]}>
            Continuer avec Google
          </Text>
        </TouchableOpacity>

        <View style={styles.authDivider}>
          <View style={[styles.authDividerLine, isDarkMode && styles.darkDividerLine]} />
          <Text style={[styles.authDividerText, isDarkMode && styles.darkMutedText]}>ou</Text>
          <View style={[styles.authDividerLine, isDarkMode && styles.darkDividerLine]} />
        </View>

        <View style={styles.authForm}>
          {isSignUp && (
            <View style={styles.authField}>
              <Text style={[styles.authLabel, isDarkMode && styles.darkText]}>Prénom</Text>
              <View style={[styles.authInputWrap, isDarkMode && styles.darkSurface]}>
                <UserRound size={18} color={colors.muted} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre prénom"
                  placeholderTextColor={colors.muted}
                  style={[styles.authInput, isDarkMode && styles.darkText]}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>
          )}

          <View style={styles.authField}>
            <Text style={[styles.authLabel, isDarkMode && styles.darkText]}>Email</Text>
            <View style={[styles.authInputWrap, isDarkMode && styles.darkSurface]}>
              <Mail size={18} color={colors.muted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                placeholderTextColor={colors.muted}
                style={[styles.authInput, isDarkMode && styles.darkText]}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.authField}>
            <Text style={[styles.authLabel, isDarkMode && styles.darkText]}>
              Mot de passe
            </Text>
            <View style={[styles.authInputWrap, isDarkMode && styles.darkSurface]}>
              <Lock size={18} color={colors.muted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="6 caractères minimum"
                placeholderTextColor={colors.muted}
                style={[styles.authInput, isDarkMode && styles.darkText]}
                autoCapitalize="none"
                autoComplete={isSignUp ? "new-password" : "password"}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {formError && <Text style={styles.authError}>{formError}</Text>}

        <TouchableOpacity style={styles.authSubmitButton} onPress={submit} activeOpacity={0.8}>
          <Text style={styles.authSubmitText}>
            {isSignUp ? "Créer mon compte" : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <View style={styles.authSwitchRow}>
          <Text style={[styles.authSwitchText, isDarkMode && styles.darkMutedText]}>
            {isSignUp ? "Déjà un compte ?" : "Pas de compte ?"}
          </Text>
          <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
            <Text style={styles.authSwitchAction}>
              {isSignUp ? "Connectez-vous" : "Inscrivez-vous"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  const activeNavigationColor = isDarkMode ? "#7BE495" : colors.brand;
  const inactiveNavigationColor = isDarkMode ? "#DDEDE3" : colors.muted;
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
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    },
    {
      id: "map",
      label: "Carte",
      icon: (active) => (
        <Map
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: (active) => (
        <Heart
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
          fill={active ? activeNavigationColor : "transparent"}
        />
      )
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active) => (
        <UserRound
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    }
  ];
  const [barWidth, setBarWidth] = useState(0);
  const activeIndicatorX = useRef(new Animated.Value(0)).current;
  const activeIndicatorScale = useRef(new Animated.Value(1)).current;
  const magnifierX = useRef(new Animated.Value(0)).current;
  const magnifierOpacity = useRef(new Animated.Value(0)).current;
  const magnifierScale = useRef(new Animated.Value(0.82)).current;
  const tabWidth = Math.max(0, (barWidth - 16) / tabs.length);
  const tabWidthRef = useRef(0);
  const activeIndexRef = useRef(0);
  const onTabChangeRef = useRef(onTabChange);
  const dragStartX = useRef(0);
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    tabWidthRef.current = tabWidth;
  }, [tabWidth]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    onTabChangeRef.current = onTabChange;

    if (tabWidth <= 0) return;
    Animated.spring(activeIndicatorX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      stiffness: 220,
      damping: 24,
      mass: 0.7
    }).start();
    magnifierX.setValue(activeIndex * tabWidth);
  }, [activeIndex, activeIndicatorX, magnifierX, onTabChange, tabWidth]);

  function showMagnifier() {
    Animated.parallel([
      Animated.timing(magnifierOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.spring(magnifierScale, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 280,
        damping: 19
      })
    ]).start();
  }

  function hideMagnifier() {
    Animated.parallel([
      Animated.timing(magnifierOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.spring(magnifierScale, {
        toValue: 0.82,
        useNativeDriver: true,
        stiffness: 240,
        damping: 20
      })
    ]).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        dragStartX.current = activeIndexRef.current * tabWidthRef.current;
        magnifierX.setValue(dragStartX.current);
        showMagnifier();
        Animated.spring(activeIndicatorScale, {
          toValue: 1.04,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
      },
      onPanResponderMove: (_event, gesture) => {
        const maxX = Math.max(0, (tabs.length - 1) * tabWidthRef.current);
        const nextX = clamp(dragStartX.current + gesture.dx, 0, maxX);
        activeIndicatorX.setValue(nextX);
        magnifierX.setValue(nextX);
      },
      onPanResponderRelease: (_event, gesture) => {
        const width = tabWidthRef.current;
        if (width <= 0) return;

        const maxIndex = tabs.length - 1;
        const nextIndex = clamp(
          Math.round((dragStartX.current + gesture.dx) / width),
          0,
          maxIndex
        );
        Animated.spring(activeIndicatorX, {
          toValue: nextIndex * width,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(magnifierX, {
          toValue: nextIndex * width,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        onTabChangeRef.current(tabs[nextIndex].id);
        Animated.spring(activeIndicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
        hideMagnifier();
      },
      onPanResponderTerminate: () => {
        Animated.spring(activeIndicatorX, {
          toValue: activeIndexRef.current * tabWidthRef.current,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(magnifierX, {
          toValue: activeIndexRef.current * tabWidthRef.current,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(activeIndicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
        hideMagnifier();
      }
    })
  ).current;

  return (
    <View
      style={[styles.bottomTabs, isDarkMode && styles.darkBottomTabs]}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bottomTabIndicator,
            isDarkMode && styles.darkBottomTabIndicator,
            {
              width: tabWidth,
              transform: [
                { translateX: activeIndicatorX },
                { scale: activeIndicatorScale }
              ]
            }
          ]}
        />
      )}
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bottomTabMagnifier,
            isDarkMode && styles.darkBottomTabMagnifier,
            {
              left: 8 + (tabWidth - 76) / 2,
              opacity: magnifierOpacity,
              transform: [
                { translateX: magnifierX },
                { scale: magnifierScale }
              ]
            }
          ]}
        />
      )}
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.bottomTab}
            onPress={() => onTabChange(tab.id)}
            onPressIn={() => {
              magnifierX.setValue(tabs.indexOf(tab) * tabWidth);
              showMagnifier();
            }}
            onPressOut={hideMagnifier}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {tab.icon(active)}
            <Text
              style={[
                styles.bottomTabText,
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

// Compact sort control shared by restaurant results and saved favorites.
function SortControls({
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

// Produces a copy so changing the visible sort never mutates the ranked source list.
function sortRestaurants(restaurants: ScoredRestaurant[], sort: RestaurantSort) {
  return [...restaurants].sort((first, second) => {
    if (sort === "distance") return first.distanceKm - second.distanceKm;
    if (sort === "rating") return second.rating - first.rating;
    if (sort === "name") return first.name.localeCompare(second.name, "fr");
    return first.budget - second.budget;
  });
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

// Matches the short French weekday labels used by the restaurant schedules.
function getCurrentFrenchWeekday() {
  return ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][new Date().getDay()];
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
    paddingBottom: 110
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
    minHeight: 30,
    paddingHorizontal: 10,
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
  filtersHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  filterCountBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center"
  },
  filterCountText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900"
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
  metricTextClosed: {
    color: colors.danger
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
    backgroundColor: colors.line,
    padding: 10,
    justifyContent: "space-between"
  },
  hourCardClosed: {
    backgroundColor: colors.softCoral,
    borderColor: colors.softCoral
  },
  hourCardCurrent: {
    backgroundColor: colors.brand
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
  hourTextCurrent: {
    color: colors.surface
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
    left: 16,
    right: 16,
    bottom: 16,
    minHeight: 72,
    padding: 8,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 8
  },
  bottomTab: {
    flex: 1,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 24,
    minHeight: 56
  },
  bottomTabIndicator: {
    position: "absolute",
    left: 8,
    top: 8,
    bottom: 8,
    borderRadius: 24,
    backgroundColor: "#E2F1E8",
    borderWidth: 1,
    borderColor: "#C3DEC9",
    shadowColor: colors.brand,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2
  },
  bottomTabMagnifier: {
    position: "absolute",
    top: -2,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 255, 255, 0.46)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1
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
  sortControls: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4
  },
  sortButton: {
    minHeight: 40,
    paddingHorizontal: 12,
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
  authContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
    gap: 20
  },
  authIntro: {
    gap: 8,
    marginTop: 12
  },
  authTitle: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900"
  },
  authDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600"
  },
  googleButton: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  googleMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  googleMarkText: {
    color: colors.coral,
    fontSize: 15,
    fontWeight: "900"
  },
  googleButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  authDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line
  },
  authDividerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  authForm: {
    gap: 14
  },
  authField: {
    gap: 7
  },
  authLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  authInputWrap: {
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  authInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 44
  },
  authError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    marginTop: -8
  },
  authSubmitButton: {
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center"
  },
  authSubmitText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900"
  },
  authSwitchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 4
  },
  authSwitchText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  authSwitchAction: {
    color: colors.brand,
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
    backgroundColor: "#14251C",
    borderColor: "#36503D"
  },
  darkBottomTabIndicator: {
    backgroundColor: "#29533D",
    borderColor: "#4F8B68",
    shadowColor: "#7BE495",
    shadowOpacity: 0.2
  },
  darkBottomTabMagnifier: {
    backgroundColor: "rgba(123, 228, 149, 0.18)",
    borderColor: "rgba(164, 245, 183, 0.78)",
    shadowColor: "#7BE495",
    shadowOpacity: 0.3
  },
  darkBottomBar: {
    backgroundColor: "#111712",
    borderTopColor: "#2C3A30"
  },
  darkSurface: {
    backgroundColor: "#1B241D",
    borderColor: "#36503D"
  },
  darkDividerLine: {
    backgroundColor: "#36503D"
  },
  darkFilterCountBadge: {
    backgroundColor: "#7BE495"
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
  darkHourCardCurrent: {
    backgroundColor: "#7BE495"
  },
  darkHourTextCurrent: {
    color: "#102016"
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
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
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  profileSubtext: {
    color: colors.muted,
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
  darkProfileHero: {
    backgroundColor: "#1B241D",
    borderColor: "#36503D"
  },
  darkProfileName: {
    color: "#F3F6EF"
  },
  darkProfileSubtext: {
    color: "#AEB9AD"
  },
  darkText: {
    color: "#F3F6EF"
  },
  darkMutedText: {
    color: "#AEB9AD"
  }
});
