export const colors = {
  ink: "#17201A",
  muted: "#667066",
  line: "#DDE5D9",
  surface: "#FFFFFF",
  background: "#F7F8F3",
  panel: "#EFF5EA",
  brand: "#2F7D59",
  brandDark: "#1F5E42",
  coral: "#E66A4E",
  gold: "#C58B26",
  blue: "#3F6FA8",
  softBlue: "#E7EEF7",
  softCoral: "#FCEAE5",
  success: "#237A4B",
  warning: "#9B6A17",
  danger: "#9A3D2E"
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20
};

export const shadow = {
  shadowColor: "#17201A",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 20,
  elevation: 3
};

export const budgetLabels = {
  1: "€",
  2: "€€",
  3: "€€€",
  4: "€€€€"
} as const;

export const dietaryLabels = {
  halal: "Halal",
  kosher: "Casher",
  vegan: "Vegan",
  vegetarian: "Végétarien",
  pescatarian: "Pescétarien",
  glutenFree: "Sans gluten",
  lactoseFree: "Sans lactose",
  healthy: "Healthy"
} as const;

export const contextLabels = {
  quick: "Rapide",
  friends: "Amis",
  date: "Date",
  family: "Famille",
  solo: "Solo",
  travel: "Voyage"
} as const;
