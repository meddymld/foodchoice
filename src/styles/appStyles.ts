import { StyleSheet } from "react-native";
import { colors, radii, shadow } from "../theme";

export const styles = StyleSheet.create({
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
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    flexDirection: "row",
    gap: 12,
    ...shadow
  },
  mapRestaurantPreviewImage: {
    width: 96,
    height: 108,
    borderRadius: radii.md,
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
    backgroundColor: colors.background,
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
    borderRadius: radii.sm,
    backgroundColor: colors.panel,
    color: colors.brandDark,
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

