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
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets
} from "react-native-safe-area-context";
import {
  Apple,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
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
  UserRound
} from "lucide-react-native";

import { rankRestaurants, scoreRestaurant } from "./domain/scoring";
import { restaurants as allRestaurants } from "./data/restaurants";
import {
  budgetOptions,
  contextOptions,
  cuisineOptions,
  defaultCriteria,
  dietaryOptions
} from "./constants/search";
import { contextEmojis } from "./constants/emojis";
import { MockRestaurantProvider } from "./services/restaurantProvider";
import { RestaurantSocialLinks } from "./components/RestaurantSocialLinks";
import { LinkLogo } from "./components/SocialLogos";
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

function compactAddressParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

// Construit une adresse lisible depuis le reverse geocoding du telephone.
function formatCurrentAddress(address: Location.LocationGeocodedAddress) {
  const streetLine = compactAddressParts([
    address.streetNumber,
    address.street ?? address.name
  ]).join(" ");
  const cityLine = compactAddressParts([
    address.postalCode,
    address.city ?? address.district ?? address.subregion
  ]).join(" ");
  const fallbackLine = address.region ?? address.country;

  return compactAddressParts([streetLine, cityLine, fallbackLine]).join(", ");
}

type Screen = "search" | "results" | "detail" | "auth";
type DecisionMode = "list" | "pick";
type AuthMode = "signIn" | "signUp";
type Account = {
  name: string;
  email: string;
  provider: "email" | "google" | "apple";
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FoodChoiceApp />
    </SafeAreaProvider>
  );
}

function FoodChoiceApp() {
  const insets = useSafeAreaInsets();
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
  const chromeDarkMode = isDarkMode;

  // Meilleur resultat utilise par le mode recommandation.
  const topPick = useMemo(() => results[0], [results]);

  const currentLocation = useMemo(
    () => getCurrentSearchCoordinates(criteria),
    [criteria]
  );

  // Les favoris sont reconstruits depuis tous les restaurants pour etre conserves
  // meme apres un changement de ville ou une nouvelle recherche.
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

  // Lance la recherche principale apres validation des champs requis, puis
  // classe les resultats du fournisseur avec les regles de score produit.
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
      const [currentAddress] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      const locationLabel = currentAddress ? formatCurrentAddress(currentAddress) : "";
      if (!locationLabel) {
        Alert.alert(
          "Adresse introuvable",
          "Votre position est detectee, mais le telephone ne renvoie pas encore d'adresse."
        );
        return null;
      }

      return {
        ...baseCriteria,
        locationLabel,
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

  // Le raccourci "ma position" demande le GPS et remplace toute ville saisie.
  async function useCurrentLocation() {
    const resolvedCriteria = await resolveCriteriaLocation(criteria, true);
    if (!resolvedCriteria) return;

    setCriteria(resolvedCriteria);
    setSearchError(null);
  }

  // Met a jour les criteres depuis le formulaire et efface l'erreur si la ville existe.
  function updateCriteria(nextCriteria: SearchCriteria) {
    setCriteria(nextCriteria);
    if (nextCriteria.locationLabel.trim().length > 0) setSearchError(null);
  }

  // Ajoute ou retire un contexte de repas. Sans contexte choisi, le filtre est ignore.
  function toggleContext(context: MealContext) {
    setCriteria((current) => ({
      ...current,
      contexts: current.contexts.includes(context)
        ? current.contexts.filter((item) => item !== context)
        : [...current.contexts, context]
    }));
  }

  // Ajoute ou retire un niveau de budget. Sans selection, tous les budgets sont autorises.
  function toggleBudget(budget: BudgetLevel) {
    setCriteria((current) => ({
      ...current,
      budget: current.budget.includes(budget)
        ? current.budget.filter((item) => item !== budget)
        : [...current.budget, budget]
    }));
  }

  // Ajoute ou retire une cuisine en conservant le reste des criteres.
  function toggleCuisine(cuisine: string) {
    setCriteria((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine]
    }));
  }

  // Ajoute ou retire une contrainte alimentaire des filtres de recherche.
  function toggleDiet(diet: DietaryKey) {
    setCriteria((current) => ({
      ...current,
      dietary: current.dietary.includes(diet)
        ? current.dietary.filter((item) => item !== diet)
        : [...current.dietary, diet]
    }));
  }

  // Reinitialise les filtres tout en gardant la ville saisie par l'utilisateur.
  function clearFilters() {
    setCriteria((current) => ({
      ...defaultCriteria,
      locationLabel: current.locationLabel,
      coordinates: current.coordinates
    }));
  }

  // Ouvre la fiche restaurant et memorise la carte selectionnee.
  function openDetail(restaurant: ScoredRestaurant) {
    setSelected(restaurant);
    setScreen("detail");
  }

  // Garde les favoris legers pour le MVP en stockant seulement les identifiants.
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

  // Stocke un compte prototype en memoire en attendant un vrai backend d'authentification.
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

  // Google cree une session prototype locale tant que les identifiants OAuth ne sont pas configures.
  function signInWithGoogle() {
    setAccount({
      name: "Utilisateur Google",
      email: "google.user@foodchoice.app",
      provider: "google"
    });
    setScreen("search");
  }

  // Apple est disponible seulement sur iPhone tant que la connexion Apple n'est pas configuree.
  function signInWithApple() {
    setAccount({
      name: "Utilisateur Apple",
      email: "apple.user@foodchoice.app",
      provider: "apple"
    });
    setScreen("search");
  }

  // Ouvre le choix de navigation natif depuis l'action d'adresse.
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

  // Construit les liens profonds pour les apps de navigation prises en charge.
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

  // Partage le restaurant selectionne via la feuille de partage native.
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
    <SafeAreaView
      edges={
        screen === "detail" || screen === "auth"
          ? ["top", "bottom"]
          : activeTab === "map"
            ? []
            : ["top"]
      }
      style={[styles.safeArea, chromeDarkMode && styles.darkSafeArea]}
    >
      <StatusBar style={chromeDarkMode ? "light" : "dark"} />
      {screen !== "detail" && screen !== "auth" && (
        <View style={[styles.tabShell, chromeDarkMode && styles.darkTabShell]}>
          <View
            style={[
              styles.tabContent,
              activeTab === "map" && styles.mapTabContent,
              chromeDarkMode && styles.darkTabContent
            ]}
          >
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
                isNightMode={isDarkMode}
                topInset={insets.top}
                bottomInset={insets.bottom}
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
            bottomInset={insets.bottom}
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

// Ecran principal de filtres : lieu, contexte, budget, cuisines et contraintes.
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
          <Text style={[styles.brand, styles.brandOnHero]}>foodchoice</Text>
          <Text style={[styles.tagline, styles.taglineOnHero]}>
            Trouver où manger, sans débat.
          </Text>
        </View>
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSurfaceRaised]}>
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

      <View style={[styles.section, isDarkMode && styles.darkSurfaceRaised]}>
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

      <View style={[styles.section, isDarkMode && styles.darkSurfaceRaised]}>
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

      <View style={[styles.section, isDarkMode && styles.darkSurfaceRaised]}>
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

      <View style={[styles.section, isDarkMode && styles.darkSurfaceRaised]}>
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

// Affiche la liste classee ou la recommandation unique apres une recherche.
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

// Affiche un libelle court et lisible pour un lien de site web.
function getWebsiteTitle(websiteUrl: string) {
  try {
    const normalizedUrl = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    return new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    return websiteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

// Fiche restaurant avec actions de contact, informations repas et itineraire.
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
  const openingStatus = restaurant.openNow
    ? `Ouvert jusqu'à ${restaurant.closesAt}`
    : "Fermé maintenant";
  const websiteTitle = restaurant.website
    ? getWebsiteTitle(restaurant.website)
    : undefined;

  // Ouvre l'app telephone native avec le numero du restaurant.
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

  // Ouvre le site du restaurant en ajoutant le protocole si l'API renvoie un domaine nu.
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
        <View style={styles.detailHero}>
          <Image source={{ uri: restaurant.photoUrl }} style={styles.detailHeroImage} />
          <View style={styles.detailHeroOverlay}>
            <View
              style={[
                styles.detailHeroStatus,
                restaurant.openNow ? styles.detailHeroStatusOpen : styles.detailHeroStatusClosed
              ]}
            >
              <Text
                style={[
                  styles.detailHeroStatusText,
                  restaurant.openNow && styles.detailHeroStatusTextOpen
                ]}
              >
                {openingStatus}
              </Text>
            </View>
            <Text style={styles.detailHeroMeta} numberOfLines={1}>
              {budgetLabels[restaurant.budget]} · {restaurant.pricePerPerson}
            </Text>
          </View>
        </View>

        <View style={[styles.detailInfoCard, isDarkMode && styles.darkSurface]}>
          <View style={styles.detailIntroHeader}>
            <View style={styles.detailIntroCopy}>
              <Text
                numberOfLines={2}
                style={[styles.detailIntroName, isDarkMode && styles.darkText]}
              >
                {restaurant.name}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.detailIntroMeta, isDarkMode && styles.darkMutedText]}
              >
                {restaurant.cuisines.slice(0, 2).join(", ")} · {budgetLabels[restaurant.budget]} ·{" "}
                {restaurant.pricePerPerson}
              </Text>
            </View>
            <RestaurantSocialLinks restaurant={restaurant} onOpenUrl={openWebsite} />
          </View>

          <View style={styles.detailTagWrap}>
            {matchedCuisineCriteria.slice(0, 3).map((cuisine) => (
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
            {confirmedDiet.slice(0, 2).map(([diet]) => (
              <View key={diet} style={[styles.dietConfirmed, isDarkMode && styles.darkPanel]}>
                <ShieldCheck size={14} color={colors.success} />
                <Text style={styles.dietConfirmedText}>{dietaryLabels[diet]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailMetricGroup}>
            <Metric
              icon={<Star size={16} color={colors.gold} fill={colors.gold} />}
              text={`${restaurant.rating} (${restaurant.reviewCount})`}
              isDarkMode={isDarkMode}
            />
            <Metric
              icon={<MapPin size={16} color={colors.coral} />}
              text={`${restaurant.distanceKm.toFixed(1)} km`}
              isDarkMode={isDarkMode}
            />
            {restaurant.matchReasons.slice(0, 2).map((reason) => (
              <View key={reason} style={[styles.reasonPill, isDarkMode && styles.darkPanel]}>
                <Check size={13} color={colors.brand} />
                <Text style={[styles.reasonText, isDarkMode && styles.darkReasonText]}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.detailInfoDivider} />

          <View style={styles.detailInfoRow}>
            <Map size={19} color={colors.coral} />
            <Text
              numberOfLines={2}
              style={[styles.detailInfoText, isDarkMode && styles.darkText]}
            >
              {restaurant.address}
            </Text>
          </View>

          {(restaurant.phone || restaurant.website) && (
            <View style={styles.detailContactRow}>
              {restaurant.phone && (
                <Pressable
                  style={styles.compactContactLink}
                  onPress={() => callRestaurant(restaurant.phone!)}
                >
                  <Phone size={16} color={colors.blue} />
                  <Text style={styles.compactContactText}>{restaurant.phone}</Text>
                </Pressable>
              )}
              {restaurant.website && (
                <Pressable
                  style={styles.compactContactLink}
                  onPress={() => openWebsite(restaurant.website!)}
                >
                  <LinkLogo size={16} />
                  <Text style={styles.compactContactText} numberOfLines={1}>
                    {websiteTitle}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
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

// Onglet carte alimente par la derniere recherche, avec carte native mobile et solution web de repli.
function MapScreen({
  criteria,
  results,
  favoriteIds,
  isDarkMode,
  isNightMode,
  topInset,
  bottomInset,
  onOpenDetail,
  onToggleFavorite,
  onGoSearch
}: {
  criteria: SearchCriteria;
  results: ScoredRestaurant[];
  favoriteIds: string[];
  isDarkMode: boolean;
  isNightMode: boolean;
  topInset: number;
  bottomInset: number;
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
  const bottomNavigationOffset = Math.max(12, bottomInset + 8);
  const previewBottomOffset = bottomNavigationOffset + 84;
  const mapBottomPadding = bottomNavigationOffset + 108;
  const mapControlPadding = {
    top: Math.max(20, topInset + 12),
    right: 16,
    bottom: mapBottomPadding,
    left: 16
  };

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

  // Projette les coordonnees GPS en pourcentages pour la solution web de repli.
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
        <View style={[styles.tabHeader, { paddingTop: topInset + 18 }]}>
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
                isNightMode={isNightMode}
                mapPadding={mapControlPadding}
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
                bottomOffset={previewBottomOffset}
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
  bottomOffset,
  onOpenDetail,
  onToggleFavorite
}: {
  restaurant: ScoredRestaurant;
  isFavorite: boolean;
  isDarkMode: boolean;
  bottomOffset: number;
  onOpenDetail: (restaurant: ScoredRestaurant) => void;
  onToggleFavorite: (restaurantId: string) => void;
}) {
  return (
    <Pressable
      style={[
        styles.mapRestaurantPreviewCard,
        { bottom: bottomOffset },
        isDarkMode && styles.darkSurfaceRaised
      ]}
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
            {restaurant.openNow ? "Ouvert maintenant" : "Fermé maintenant"}
          </Text>
          <Text style={[styles.mapRestaurantPreviewTag, isDarkMode && styles.darkCompactReason]}>
            {restaurant.distanceKm <= 1 ? "Proche" : `${restaurant.distanceKm.toFixed(1)} km`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Onglet favoris trie par distance depuis la position ou la recherche courante.
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

// Onglet profil pour l'acces au compte et les preferences enregistrees.
function ProfileScreen({
  account,
  isDarkMode,
  onDarkModeChange,
  onOpenAuth,
  onSignOut,
  onSuggestImprovement,
  onInviteFriend,
  onRateFoodChoice
}: {
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
          icon={<LocateFixed size={20} color={colors.coral} />}
          label="Localisation et confidentialité"
          isDarkMode={isDarkMode}
        />
      </View>

      <View style={styles.profileSection}>
        <Text style={[styles.profileSectionTitle, isDarkMode && styles.darkText]}>
          Paramètres
        </Text>
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

// Ligne reutilisable pour les sections de reglages du profil.
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

// Ligne d'interrupteur dediee au theme clair/sombre dans les reglages du profil.
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
        <Text style={[styles.themeSwitchText, isDarkMode && styles.darkText]}>
          Mode sombre
        </Text>
      </View>
      <View style={styles.themeSwitchControl}>
        <Switch
          style={styles.themeSwitch}
          value={isDarkMode}
          onValueChange={onDarkModeChange}
          trackColor={{ false: colors.line, true: colors.brand }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );
}

// Formulaire d'authentification pour le compte MVP local et les connexions sociales.
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
