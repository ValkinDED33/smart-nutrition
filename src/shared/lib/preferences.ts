import type { Product } from "../types/product";
import type {
  NutritionPreferences,
  NotificationPreferences,
  ReminderTimes,
} from "../types/profile";
import type { Recipe } from "../types/meal";

const animalProteinKeywords = [
  "chicken",
  "turkey",
  "beef",
  "pork",
  "ham",
  "salmon",
  "tuna",
  "fish",
  "shrimp",
  "egg",
];

const dairyKeywords = ["yogurt", "skyr", "kefir", "milk", "cheese", "mozzarella", "cottage"];
const glutenKeywords = ["bread", "pasta", "oats", "wheat", "bar"];

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const getProductSearchText = (product: Product) =>
  normalizeToken(
    [product.name, product.brand, ...(product.facts?.extraCompounds ?? [])]
      .filter(Boolean)
      .join(" ")
  );

const hasKeyword = (product: Product, keywords: string[]) => {
  const haystack = getProductSearchText(product);
  return keywords.some((keyword) => haystack.includes(normalizeToken(keyword)));
};

export const parsePreferenceList = (value: string) =>
  value
    .split(",")
    .map((item) => normalizeToken(item))
    .filter(Boolean);

export const formatPreferenceList = (values: string[]) => values.join(", ");

export const createDefaultReminderTimes = (): ReminderTimes => ({
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "19:00",
  snack: "16:30",
});

export const createDefaultNotificationPreferences = (): NotificationPreferences => ({
  notificationsEnabled: false,
  mealRemindersEnabled: true,
  calorieAlertsEnabled: true,
  reminderTimes: createDefaultReminderTimes(),
});

export const createDefaultNutritionPreferences = (): NutritionPreferences => ({
  dietStyle: "balanced",
  allergies: [],
  excludedIngredients: [],
  adaptiveMode: "automatic",
});

export const productMatchesPreferences = (
  product: Product,
  preferences: NutritionPreferences
) => {
  const blockedTokens = [...preferences.allergies, ...preferences.excludedIngredients];
  const haystack = getProductSearchText(product);

  if (blockedTokens.some((token) => haystack.includes(token))) {
    return false;
  }

  if (preferences.dietStyle === "vegetarian") {
    return !hasKeyword(product, ["chicken", "turkey", "beef", "pork", "ham", "salmon", "tuna", "fish", "shrimp"]);
  }

  if (preferences.dietStyle === "vegan") {
    return !hasKeyword(product, [...animalProteinKeywords, ...dairyKeywords]);
  }

  if (preferences.dietStyle === "pescatarian") {
    return !hasKeyword(product, ["chicken", "turkey", "beef", "pork", "ham"]);
  }

  if (preferences.dietStyle === "gluten_free") {
    return !hasKeyword(product, glutenKeywords);
  }

  if (preferences.dietStyle === "low_carb") {
    return product.nutrients.carbs <= 25;
  }

  return true;
};

export const recipeMatchesPreferences = (
  recipe: Recipe,
  preferences: NutritionPreferences
) => recipe.ingredients.every((ingredient) => productMatchesPreferences(ingredient.product, preferences));

export const pickPreferredProteinProducts = (
  products: Product[],
  preferences: NutritionPreferences,
  limit = 3
) =>
  products
    .filter((product) => productMatchesPreferences(product, preferences))
    .filter((product) => product.nutrients.protein >= 8)
    .sort((left, right) => right.nutrients.protein - left.nutrients.protein)
    .slice(0, limit);
