import type { MealType } from "@domain/meal/types";
import type { DietStyle } from "@domain/profile/types";
import type { PhotoMealAnalysis } from "../types/photo";

export interface FreePhotoAnalysisPreferences {
  dietStyle?: DietStyle;
  allergies?: string[];
  excludedIngredients?: string[];
}

type DraftMacro = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type DraftItem = {
  name: string;
  quantityGrams: number;
  confidence: number;
  estimatedNutritionPer100g: DraftMacro;
  reason: string;
  tokens: string[];
};

const FOOD_GREEK_YOGURT = "Greek yogurt";
const FOOD_OATS = "Oats";
const FOOD_BANANA = "Banana";
const FOOD_ALMONDS = "Almonds";
const FOOD_COTTAGE_CHEESE = "Cottage cheese";
const FOOD_CUCUMBER = "Cucumber";
const FOOD_CHICKEN_BREAST = "Chicken breast";
const FOOD_RICE_COOKED = "Rice cooked";
const FOOD_TOMATO = "Tomato";
const FOOD_TOFU = "Tofu";
const FOOD_APPLE = "Apple";

const breakfastTemplates: Record<DietStyle, DraftItem[]> = {
  balanced: [
    {
      name: FOOD_GREEK_YOGURT,
      quantityGrams: 180,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
      reason: "Common breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
    },
    {
      name: FOOD_OATS,
      quantityGrams: 60,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
      reason: "Common breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
    },
    {
      name: FOOD_BANANA,
      quantityGrams: 100,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
      reason: "Common breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
    },
  ],
  vegetarian: [
    {
      name: FOOD_GREEK_YOGURT,
      quantityGrams: 180,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
      reason: "Common vegetarian breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
    },
    {
      name: FOOD_OATS,
      quantityGrams: 60,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
      reason: "Common vegetarian breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
    },
    {
      name: FOOD_BANANA,
      quantityGrams: 100,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
      reason: "Common vegetarian breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
    },
  ],
  vegan: [
    {
      name: FOOD_OATS,
      quantityGrams: 60,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
      reason: "Common vegan breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
    },
    {
      name: FOOD_BANANA,
      quantityGrams: 100,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
      reason: "Common vegan breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 20,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common vegan breakfast fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  pescatarian: [
    {
      name: FOOD_GREEK_YOGURT,
      quantityGrams: 180,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
      reason: "Common pescatarian breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
    },
    {
      name: FOOD_OATS,
      quantityGrams: 60,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
      reason: "Common pescatarian breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
    },
    {
      name: FOOD_BANANA,
      quantityGrams: 100,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
      reason: "Common pescatarian breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
    },
  ],
  low_carb: [
    {
      name: "Boiled egg",
      quantityGrams: 120,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 155, protein: 13, fat: 11, carbs: 1.1 },
      reason: "Common low-carb breakfast protein starter used as a review draft.",
      tokens: ["egg"],
    },
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 150,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common low-carb breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_CUCUMBER,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
      reason: "Common low-carb breakfast vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
    },
  ],
  gluten_free: [
    {
      name: FOOD_GREEK_YOGURT,
      quantityGrams: 180,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
      reason: "Common gluten-free breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
    },
    {
      name: FOOD_BANANA,
      quantityGrams: 100,
      confidence: 0.17,
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
      reason: "Common gluten-free breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 20,
      confidence: 0.15,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common gluten-free breakfast fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
};

const lunchDinnerTemplates: Record<DietStyle, DraftItem[]> = {
  balanced: [
    {
      name: FOOD_CHICKEN_BREAST,
      quantityGrams: 160,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
      reason: "Common lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
    },
    {
      name: FOOD_RICE_COOKED,
      quantityGrams: 180,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      reason: "Common lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
    },
    {
      name: FOOD_TOMATO,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
      reason: "Common lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
    },
  ],
  vegetarian: [
    {
      name: FOOD_TOFU,
      quantityGrams: 160,
      confidence: 0.21,
      estimatedNutritionPer100g: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
      reason: "Common vegetarian lunch/dinner protein starter used as a review draft.",
      tokens: ["soy", "tofu"],
    },
    {
      name: FOOD_RICE_COOKED,
      quantityGrams: 180,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      reason: "Common vegetarian lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
    },
    {
      name: FOOD_TOMATO,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
      reason: "Common vegetarian lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
    },
  ],
  vegan: [
    {
      name: FOOD_TOFU,
      quantityGrams: 160,
      confidence: 0.21,
      estimatedNutritionPer100g: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
      reason: "Common vegan lunch/dinner protein starter used as a review draft.",
      tokens: ["soy", "tofu"],
    },
    {
      name: FOOD_RICE_COOKED,
      quantityGrams: 180,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      reason: "Common vegan lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
    },
    {
      name: FOOD_TOMATO,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
      reason: "Common vegan lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
    },
  ],
  pescatarian: [
    {
      name: "Salmon",
      quantityGrams: 150,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 208, protein: 20, fat: 13, carbs: 0 },
      reason: "Common pescatarian lunch/dinner protein starter used as a review draft.",
      tokens: ["fish", "salmon"],
    },
    {
      name: FOOD_RICE_COOKED,
      quantityGrams: 160,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      reason: "Common pescatarian lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
    },
    {
      name: FOOD_CUCUMBER,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
      reason: "Common pescatarian lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
    },
  ],
  low_carb: [
    {
      name: FOOD_CHICKEN_BREAST,
      quantityGrams: 160,
      confidence: 0.21,
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
      reason: "Common low-carb lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
    },
    {
      name: "Avocado",
      quantityGrams: 80,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 160, protein: 2, fat: 15, carbs: 9 },
      reason: "Common low-carb fat starter used as a review draft.",
      tokens: ["fruit", "avocado"],
    },
    {
      name: FOOD_CUCUMBER,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
      reason: "Common low-carb vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
    },
  ],
  gluten_free: [
    {
      name: FOOD_CHICKEN_BREAST,
      quantityGrams: 160,
      confidence: 0.22,
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
      reason: "Common gluten-free lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
    },
    {
      name: FOOD_RICE_COOKED,
      quantityGrams: 180,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
      reason: "Common gluten-free lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
    },
    {
      name: FOOD_TOMATO,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
      reason: "Common gluten-free lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
    },
  ],
};

const snackTemplates: Record<DietStyle, DraftItem[]> = {
  balanced: [
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 180,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_APPLE,
      quantityGrams: 120,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      reason: "Common snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  vegetarian: [
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 180,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common vegetarian snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_APPLE,
      quantityGrams: 120,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      reason: "Common vegetarian snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common vegetarian snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  vegan: [
    {
      name: "Hummus",
      quantityGrams: 100,
      confidence: 0.18,
      estimatedNutritionPer100g: { calories: 166, protein: 8, fat: 9.6, carbs: 14 },
      reason: "Common vegan snack starter used as a review draft.",
      tokens: ["legume", "hummus"],
    },
    {
      name: FOOD_APPLE,
      quantityGrams: 120,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      reason: "Common vegan snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common vegan snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  pescatarian: [
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 180,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common pescatarian snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_APPLE,
      quantityGrams: 120,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      reason: "Common pescatarian snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common pescatarian snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  low_carb: [
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 180,
      confidence: 0.19,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common low-carb snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_CUCUMBER,
      quantityGrams: 120,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
      reason: "Common low-carb snack vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.13,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common low-carb snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
  gluten_free: [
    {
      name: FOOD_COTTAGE_CHEESE,
      quantityGrams: 180,
      confidence: 0.2,
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
      reason: "Common gluten-free snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
    },
    {
      name: FOOD_APPLE,
      quantityGrams: 120,
      confidence: 0.16,
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      reason: "Common gluten-free snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
    },
    {
      name: FOOD_ALMONDS,
      quantityGrams: 15,
      confidence: 0.14,
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
      reason: "Common gluten-free snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
    },
  ],
};

const buildBlockedTokens = (preferences?: FreePhotoAnalysisPreferences) => {
  const tokens = [
    ...(preferences?.allergies ?? []),
    ...(preferences?.excludedIngredients ?? []),
  ];

  return tokens
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const removeBlockedItems = (
  items: DraftItem[],
  blockedTokens: string[]
) => {
  if (blockedTokens.length === 0) {
    return items;
  }

  return items.filter(
    (item) =>
      !blockedTokens.some((blockedToken) =>
        item.tokens.some((token) => token.includes(blockedToken))
      )
  );
};

const getTemplateForDiet = (
  templates: Record<DietStyle, DraftItem[]>,
  dietStyle: DietStyle
) => {
  switch (dietStyle) {
    case "vegetarian":
      return templates.vegetarian;
    case "vegan":
      return templates.vegan;
    case "pescatarian":
      return templates.pescatarian;
    case "low_carb":
      return templates.low_carb;
    case "gluten_free":
      return templates.gluten_free;
    case "balanced":
    default:
      return templates.balanced;
  }
};

const getTemplate = (mealType: MealType, dietStyle: DietStyle) => {
  if (mealType === "breakfast") {
    return getTemplateForDiet(breakfastTemplates, dietStyle);
  }

  if (mealType === "snack") {
    return getTemplateForDiet(snackTemplates, dietStyle);
  }

  return getTemplateForDiet(lunchDinnerTemplates, dietStyle);
};

const getMealLabel = (mealType: MealType) =>
  mealType.charAt(0).toUpperCase() + mealType.slice(1);

export const createFreePhotoAnalysis = ({
  mealType,
  preferences,
}: {
  mealType: MealType;
  preferences?: FreePhotoAnalysisPreferences;
}): PhotoMealAnalysis => {
  const dietStyle = preferences?.dietStyle ?? "balanced";
  const blockedTokens = buildBlockedTokens(preferences);
  const template = getTemplate(mealType, dietStyle);
  const filteredTemplate = removeBlockedItems(template, blockedTokens);
  const items = (filteredTemplate.length > 0 ? filteredTemplate : template).map((item) => ({
    name: item.name,
    quantityGrams: item.quantityGrams,
    confidence: item.confidence,
    reason: item.reason,
    estimatedNutritionPer100g: item.estimatedNutritionPer100g,
  }));

  return {
    dishName: `${getMealLabel(mealType)} review draft`,
    summary:
      "Review these starter suggestions against your photo, adjust the foods and portions, then save only what matches your meal.",
    confidence: 0.18,
    estimatedPortions: 1,
    cautions: [
      "The suggestions are a starting point, not a confirmed meal.",
      "Check each item before saving it to your diary.",
      "Adjust quantities or replace foods before saving to the diary.",
    ],
    manualReviewRequired: true,
    items,
  };
};
