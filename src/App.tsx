import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  Apple,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Compass,
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
  RotateCcw,
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
import {
  budgetOptions,
  contextEmojis,
  contextOptions,
  cuisineOptions,
  defaultCriteria,
  dietaryOptions
} from "./constants/search";
import { MockRestaurantProvider } from "./services/restaurantProvider";
import {
  BudgetLevel,
  DietaryKey,
  MealContext,
  NavigationApp,
  RestaurantSort,
  ScoredRestaurant,
  SearchCriteria
} from "./types";
import {
  budgetLabels,
  colors,
  contextLabels,
  dietaryLabels
} from "./theme";
import { styles } from "./styles/appStyles";
import { BottomTabs, MainTab } from "./components/BottomTabs";
import { Chip, SortControls } from "./components/FilterControls";
import { NumberSliderField } from "./components/NumberSliderField";
import {
  FeaturedRestaurantCard,
  Metric,
  RestaurantCard
} from "./components/RestaurantCards";
import {
  NativeRestaurantMap,
  supportsNativeRestaurantMap
} from "./components/NativeRestaurantMap";
import { EmptyState, Header } from "./components/ScreenChrome";
import {
  calculateDistanceKm,
  clamp,
  getCurrentFrenchWeekday,
  getCurrentSearchCoordinates,
  getWeeklyOpeningHours,
  normalizeLabel,
  sortRestaurants
} from "./utils/restaurants";

const provider = new MockRestaurantProvider();

type Screen = "search" | "results" | "detail" | "auth";
type DecisionMode = "list" | "pick";
type AuthMode = "signIn" | "signUp";
type Account = {
  name: string;
  email: string;
  provider: "email" | "google" | "apple";
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
  const canSignInWithApple = Platform.OS === "ios" && !Platform.isPad;

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

  // Resets filter choices while preserving the user-entered search location.
  function clearFilters() {
    setCriteria((current) => ({
      ...defaultCriteria,
      locationLabel: current.locationLabel,
      coordinates: current.coordinates
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

  // Apple is available only on the iPhone app until Sign in with Apple is configured.
  function signInWithApple() {
    setAccount({
      name: "Utilisateur Apple",
      email: "apple.user@foodchoice.app",
      provider: "apple"
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
                onClearFilters={clearFilters}
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
          canSignInWithApple={canSignInWithApple}
          onBack={() => setScreen("search")}
          onGoogleSignIn={signInWithGoogle}
          onAppleSignIn={signInWithApple}
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
  onClearFilters,
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
  onClearFilters: () => void;
  onSearch: () => void;
  onPick: () => void;
}) {
  const activeFilterCount =
    criteria.contexts.length +
    criteria.budget.length +
    criteria.cuisines.length +
    criteria.dietary.length;

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
          {budgetOptions.map((budget) => (
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
        <View style={styles.filtersHeadingActions}>
          <View style={[styles.filterCountBadge, isDarkMode && styles.darkFilterCountBadge]}>
            <Text style={[styles.filterCountText, isDarkMode && styles.darkFilterCountText]}>
              {activeFilterCount}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.clearFiltersButton,
              isDarkMode && styles.darkClearFiltersButton
            ]}
            onPress={onClearFilters}
            activeOpacity={0.72}
          >
            <RotateCcw size={15} color={isDarkMode ? "#7BE495" : colors.brand} />
            <Text
              style={[
                styles.clearFiltersText,
                isDarkMode && styles.darkClearFiltersText
              ]}
            >
              Réinitialiser
            </Text>
          </TouchableOpacity>
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

// Onglet carte alimente par la derniere recherche, avec carte native mobile et fallback web.
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
  const visibleResults = useMemo(() => results.slice(0, 8), [results]);
  const [selectedMapRestaurantId, setSelectedMapRestaurantId] = useState<string | null>(
    null
  );
  const selectedMapRestaurant = selectedMapRestaurantId
    ? visibleResults.find((restaurant) => restaurant.id === selectedMapRestaurantId)
    : null;
  const hasNativeMap = supportsNativeRestaurantMap;

  // Calcule les bornes geographiques des resultats pour centrer la carte native.
  const mapBounds = useMemo(() => {
    if (visibleResults.length === 0) {
      return {
        minLatitude: 0,
        maxLatitude: 0,
        minLongitude: 0,
        maxLongitude: 0,
        latitudeRange: 1,
        longitudeRange: 1
      };
    }

    const latitudes = visibleResults.map(
      (restaurant) => restaurant.coordinates.latitude
    );
    const longitudes = visibleResults.map(
      (restaurant) => restaurant.coordinates.longitude
    );
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);

    return {
      minLatitude,
      maxLatitude,
      minLongitude,
      maxLongitude,
      latitudeRange: Math.max(maxLatitude - minLatitude, 0.01),
      longitudeRange: Math.max(maxLongitude - minLongitude, 0.01)
    };
  }, [visibleResults]);

  // Region initiale donnee a react-native-maps pour cadrer tous les restaurants visibles.
  const nativeMapRegion = useMemo(() => {
    const latitude =
      (mapBounds.minLatitude + mapBounds.maxLatitude) / 2 ||
      criteria.coordinates?.latitude ||
      visibleResults[0]?.coordinates.latitude ||
      48.8566;
    const longitude =
      (mapBounds.minLongitude + mapBounds.maxLongitude) / 2 ||
      criteria.coordinates?.longitude ||
      visibleResults[0]?.coordinates.longitude ||
      2.3522;

    return {
      latitude,
      longitude,
      latitudeDelta: Math.max(mapBounds.latitudeRange * 1.45, 0.025),
      longitudeDelta: Math.max(mapBounds.longitudeRange * 1.45, 0.025)
    };
  }, [criteria.coordinates, mapBounds, visibleResults]);

  // Projette les coordonnees GPS en pourcentages pour le fallback web dessine en React Native.
  function getMapPosition(restaurant: ScoredRestaurant) {
    const longitudePercent =
      ((restaurant.coordinates.longitude - mapBounds.minLongitude) /
        mapBounds.longitudeRange) *
      100;
    const latitudePercent =
      ((mapBounds.maxLatitude - restaurant.coordinates.latitude) /
        mapBounds.latitudeRange) *
      100;

    return {
      left: clamp(10 + longitudePercent * 0.8, 12, 88),
      top: clamp(10 + latitudePercent * 0.64, 14, 74)
    };
  }

  return (
    <View style={[styles.flex, isDarkMode && styles.darkFlex]}>
      {results.length === 0 && (
        <View style={styles.tabHeader}>
          <Text style={[styles.tabTitle, isDarkMode && styles.darkText]}>Carte</Text>
          <Text style={[styles.tabSubtitle, isDarkMode && styles.darkMutedText]}>
            Lancez une recherche pour remplir la carte.
          </Text>
        </View>
      )}

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
        <View style={styles.mapFullScreenContent}>
          <View
            style={[
              styles.mapCanvas,
              styles.mapCanvasFullScreen,
              isDarkMode && styles.darkMapCanvas
            ]}
          >
            {hasNativeMap ? (
              <NativeRestaurantMap
                restaurants={visibleResults}
                selectedRestaurantId={selectedMapRestaurant?.id}
                initialRegion={nativeMapRegion}
                onSelectRestaurant={setSelectedMapRestaurantId}
              />
            ) : (
              <>
                <View style={[styles.mapDataBadge, isDarkMode && styles.darkPanel]}>
                  <MapPin size={14} color={colors.brand} />
                  <Text style={[styles.mapDataBadgeText, isDarkMode && styles.darkText]}>
                    Donnees factices
                  </Text>
                </View>
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
                      selectedMapRestaurant?.id === restaurant.id && styles.mapPinSelected,
                      {
                        left: `${getMapPosition(restaurant).left}%`,
                        top: `${getMapPosition(restaurant).top}%`,
                        zIndex: selectedMapRestaurant?.id === restaurant.id ? 3 : 2
                      }
                    ]}
                    onPress={() => setSelectedMapRestaurantId(restaurant.id)}
                  >
                    <Text
                      style={[
                        styles.mapPinText,
                        selectedMapRestaurant?.id === restaurant.id &&
                          styles.mapPinTextSelected
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}

            {selectedMapRestaurant && (
              <MapRestaurantPreview
                restaurant={selectedMapRestaurant}
                isFavorite={favoriteIds.includes(selectedMapRestaurant.id)}
                isDarkMode={isDarkMode}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// Miniature affichee sur la carte apres selection d'un pin.
function MapRestaurantPreview({
  restaurant,
  isFavorite,
  isDarkMode,
  onOpenDetail,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  isDarkMode: boolean;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable
      style={[styles.mapRestaurantPreviewCard, isDarkMode && styles.darkSurfaceRaised]}
      onPress={() => onOpenDetail(restaurant)}
    >
      <Image source={{ uri: restaurant.photoUrl }} style={styles.mapRestaurantPreviewImage} />
      <View style={styles.mapRestaurantPreviewBody}>
        <View style={styles.mapRestaurantPreviewTopline}>
          <Text
            numberOfLines={1}
            style={[styles.mapRestaurantPreviewName, isDarkMode && styles.darkText]}
          >
            {restaurant.name}
          </Text>
          <Pressable
            style={[styles.mapRestaurantFavoriteButton, isDarkMode && styles.darkPanel]}
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
          style={[styles.mapRestaurantPreviewMeta, isDarkMode && styles.darkMutedText]}
        >
          {restaurant.cuisines.slice(0, 2).join(", ")} · {budgetLabels[restaurant.budget]}
        </Text>

        <View style={styles.mapRestaurantPreviewMetrics}>
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
            text={restaurant.openNow ? "Ouvert" : "Ferme"}
            isDarkMode={isDarkMode}
            isClosed={!restaurant.openNow}
          />
        </View>

        <View style={styles.mapRestaurantPreviewTags}>
          <Text style={[styles.mapRestaurantPreviewTag, isDarkMode && styles.darkCompactReason]}>
            {restaurant.openNow ? "Ouvert maintenant" : "Ferme maintenant"}
          </Text>
          <Text style={[styles.mapRestaurantPreviewTag, isDarkMode && styles.darkCompactReason]}>
            {restaurant.distanceKm <= 1 ? "Proche" : `${restaurant.distanceKm.toFixed(1)} km`}
          </Text>
        </View>
      </View>
    </Pressable>
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

// Authentication form for the local MVP account flow and social provider entry points.
function AuthScreen({
  isDarkMode,
  canSignInWithApple,
  onBack,
  onGoogleSignIn,
  onAppleSignIn,
  onSubmitCredentials
}: {
  isDarkMode: boolean;
  canSignInWithApple: boolean;
  onBack: () => void;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
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
  const showEmailPasswordAuth = false;

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

        {canSignInWithApple && (
          <TouchableOpacity
            style={[styles.googleButton, isDarkMode && styles.darkSurfaceRaised]}
            onPress={onAppleSignIn}
            activeOpacity={0.72}
          >
            <View style={styles.googleMark}>
              <Apple size={17} color={colors.ink} fill={colors.ink} />
            </View>
            <Text style={[styles.googleButtonText, isDarkMode && styles.darkText]}>
              Continuer avec Apple
            </Text>
          </TouchableOpacity>
        )}

        {showEmailPasswordAuth && (
          <>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

