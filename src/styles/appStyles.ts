import { StyleSheet } from "react-native";
import { colors, radii, shadow } from "../theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F0"
  },
  darkSafeArea: {
    backgroundColor: "#0F1712"
  },
  flex: {
    flex: 1,
    backgroundColor: "#F4F7F0"
  },
  darkFlex: {
    backgroundColor: "#0F1712"
  },
  tabShell: {
    flex: 1,
    backgroundColor: "#F4F7F0"
  },
  darkTabShell: {
    backgroundColor: "#0F1712"
  },
  tabContent: {
    flex: 1,
    paddingBottom: 110
  },
  mapTabContent: {
    paddingBottom: 0
  },
  darkTabContent: {
    backgroundColor: "#111712"
  },
  screen: {
    padding: 16,
    paddingBottom: 38,
    gap: 14
  },
  darkScreen: {
    backgroundColor: "#0F1712"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 118,
    padding: 18,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 24,
    backgroundColor: colors.brandDark,
    shadowColor: colors.brandDark,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 5
  },
  logoMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    alignItems: "center",
    justifyContent: "center"
  },
  brand: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.ink
  },
  brandOnHero: {
    color: colors.surface,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900"
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2
  },
  taglineOnHero: {
    color: "#D8FFE0",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700"
  },
  section: {
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900"
  },
  searchBox: {
    height: 58,
    backgroundColor: "#F8FBF5",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7EEE2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 11
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    minHeight: 44
  },
  secondaryButton: {
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFE2D4",
    backgroundColor: "#ECF7EF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  secondaryButtonText: {
    color: colors.brand,
    fontWeight: "900",
    fontSize: 15
  },
  gridChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E0E9DA",
    backgroundColor: "#F8FBF5",
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2
  },
  chipText: {
    color: colors.ink,
    fontWeight: "800",
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
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 2
  },
  filtersHeadingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
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
  clearFiltersButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  clearFiltersText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "900"
  },
  filtersPanel: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
    padding: 16,
    gap: 15,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 2
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
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E9DA",
    backgroundColor: "#F8FBF5",
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
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E3ECDD"
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.brand
  },
  sliderThumb: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 4,
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
    marginTop: 4
  },
  primaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: colors.brand,
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4
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
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#DCE8D6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F4F7F0"
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E9DA",
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
    paddingBottom: 32,
    gap: 12
  },
  resultCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  listGap: {
    gap: 14
  },
  restaurantCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
    padding: 10,
    flexDirection: "row",
    gap: 12,
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3
  },
  restaurantImage: {
    width: 96,
    height: 118,
    borderRadius: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F0"
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
    backgroundColor: "#ECF7EF",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900"
  },
  kicker: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4
  },
  featuredImage: {
    width: "100%",
    height: 236,
    backgroundColor: colors.panel
  },
  featuredBody: {
    padding: 16,
    gap: 12
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F0"
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
    gap: 10
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
    width: 104,
    minHeight: 64,
    borderRadius: radii.md,
    backgroundColor: colors.line,
    padding: 9,
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
  detailContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 12
  },
  detailHero: {
    minHeight: 218,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.panel,
    ...shadow
  },
  detailHeroImage: {
    width: "100%",
    height: 218,
    backgroundColor: colors.panel
  },
  detailHeroOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  detailHeroStatus: {
    maxWidth: "62%",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  detailHeroStatusOpen: {
    backgroundColor: colors.brand
  },
  detailHeroStatusClosed: {
    backgroundColor: colors.coral
  },
  detailHeroStatusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "900"
  },
  detailHeroStatusTextOpen: {
    color: colors.surface
  },
  detailHeroMeta: {
    flexShrink: 1,
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "rgba(23, 32, 26, 0.72)",
    overflow: "hidden"
  },
  detailInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12
  },
  detailIntroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  detailIntroCopy: {
    flex: 1,
    gap: 5
  },
  detailIntroName: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900"
  },
  detailIntroMeta: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700"
  },
  detailTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  detailMetricGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14
  },
  detailSocialLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10
  },
  detailSocialButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  detailInfoDivider: {
    height: 1,
    backgroundColor: colors.line
  },
  detailInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9
  },
  detailInfoText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800"
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
  detailContactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactContactLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.softBlue
  },
  compactContactText: {
    color: colors.blue,
    fontSize: 12,
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
  mapFullScreenContent: {
    flex: 1
  },
  mapCanvas: {
    height: 350,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    overflow: "hidden",
    ...shadow
  },
  mapCanvasFullScreen: {
    flex: 1,
    height: "auto",
    borderRadius: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  nativeMap: {
    flex: 1
  },
  osmTileLayer: {
    ...StyleSheet.absoluteFillObject
  },
  osmTile: {
    position: "absolute",
    width: 256,
    height: 256,
    resizeMode: "cover"
  },
  osmNightOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: "rgba(13, 23, 18, 0.38)"
  },
  mapLocationButton: {
    position: "absolute",
    right: 14,
    zIndex: 5,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow
  },
  mapLocationButtonLoading: {
    opacity: 0.62
  },
  osmUserDot: {
    position: "absolute",
    zIndex: 3,
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    borderRadius: 12,
    backgroundColor: "rgba(63, 111, 168, 0.24)",
    alignItems: "center",
    justifyContent: "center"
  },
  osmUserDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.blue
  },
  osmAttribution: {
    position: "absolute",
    right: 8,
    bottom: 12,
    zIndex: 4,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800"
  },
  osmAttributionDark: {
    backgroundColor: "rgba(21, 32, 25, 0.88)",
    color: "#D8FFE0"
  },
  mapDataBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 4,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  mapDataBadgeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
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
  mapPinSelected: {
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -21,
    borderRadius: 21,
    backgroundColor: colors.brand,
    borderColor: colors.surface
  },
  mapPinText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "900"
  },
  mapPinTextSelected: {
    fontSize: 13
  },
  nativeMapPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow
  },
  nativeMapPinSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand
  },
  mapPreviewCard: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 5,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    gap: 7,
    ...shadow
  },
  mapPreviewTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mapPreviewName: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  mapPreviewScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    minHeight: 26,
    borderRadius: radii.sm,
    backgroundColor: "#FFF4D8"
  },
  mapPreviewScoreText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  mapPreviewMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  mapPreviewAction: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "900"
  },
  mapRestaurantPreviewCard: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 14,
    zIndex: 6,
    padding: 10,
    minHeight: 128,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    flexDirection: "row",
    gap: 12,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 5
  },
  mapRestaurantPreviewImage: {
    width: 96,
    height: 108,
    borderRadius: 16,
    backgroundColor: colors.panel
  },
  mapRestaurantPreviewBody: {
    flex: 1,
    minWidth: 0,
    gap: 7,
    paddingVertical: 2
  },
  mapRestaurantPreviewTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  mapRestaurantPreviewName: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  },
  mapRestaurantFavoriteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F7F0",
    alignItems: "center",
    justifyContent: "center"
  },
  mapRestaurantPreviewMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  mapRestaurantPreviewMetrics: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8
  },
  mapRestaurantPreviewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  mapRestaurantPreviewTag: {
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#ECF7EF",
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900"
  },
  sortControls: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 6
  },
  sortButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DCE8D6",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  sortButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 2
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
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE8D6",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2
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
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F8FBF5",
    borderWidth: 1,
    borderColor: "#E0E9DA",
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
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4
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
    padding: 16,
    paddingBottom: 102,
    gap: 14
  },
  darkHeader: {
    backgroundColor: "#0F1712",
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
    backgroundColor: "#0F1712",
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
  darkFilterCountText: {
    color: "#102016"
  },
  darkClearFiltersButton: {
    backgroundColor: "#1B241D",
    borderColor: "#4E6B55"
  },
  darkClearFiltersText: {
    color: "#7BE495"
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
    backgroundColor: "#0F1712"
  },
  profileHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3
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
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(47, 125, 89, 0.1)",
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
  themeSwitchText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  themeSwitchControl: {
    width: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  themeSwitch: {
    alignSelf: "center"
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

