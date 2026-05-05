import { StateApiError } from "../lib/domain.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const maxPhotoDataUrlLength = 1_700_000;
const safePhotoDataUrlPattern = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;

const normalizeDietStyle = (value) => {
  if (
    value === "balanced" ||
    value === "vegetarian" ||
    value === "vegan" ||
    value === "pescatarian" ||
    value === "low_carb" ||
    value === "gluten_free"
  ) {
    return value;
  }

  return "balanced";
};

const normalizeMealType = (value) => {
  if (value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack") {
    return value;
  }

  return "meal";
};

const buildBlockedTokens = (profileState) => {
  if (!isRecord(profileState)) {
    return [];
  }

  return [...(Array.isArray(profileState.allergies) ? profileState.allergies : []), ...(Array.isArray(profileState.excludedIngredients) ? profileState.excludedIngredients : [])]
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
};

const breakfastTemplates = {
  balanced: [
    {
      name: "Greek yogurt",
      quantityGrams: 180,
      confidence: 0.22,
      reason: "Common breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
    },
    {
      name: "Oats",
      quantityGrams: 60,
      confidence: 0.18,
      reason: "Common breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
    },
    {
      name: "Banana",
      quantityGrams: 100,
      confidence: 0.16,
      reason: "Common breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
    },
  ],
  vegetarian: [
    {
      name: "Greek yogurt",
      quantityGrams: 180,
      confidence: 0.22,
      reason: "Common vegetarian breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
    },
    {
      name: "Oats",
      quantityGrams: 60,
      confidence: 0.18,
      reason: "Common vegetarian breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
    },
    {
      name: "Banana",
      quantityGrams: 100,
      confidence: 0.16,
      reason: "Common vegetarian breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
    },
  ],
  vegan: [
    {
      name: "Oats",
      quantityGrams: 60,
      confidence: 0.2,
      reason: "Common vegan breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
    },
    {
      name: "Banana",
      quantityGrams: 100,
      confidence: 0.18,
      reason: "Common vegan breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
    },
    {
      name: "Almonds",
      quantityGrams: 20,
      confidence: 0.16,
      reason: "Common vegan breakfast fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  pescatarian: [
    {
      name: "Greek yogurt",
      quantityGrams: 180,
      confidence: 0.22,
      reason: "Common pescatarian breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
    },
    {
      name: "Oats",
      quantityGrams: 60,
      confidence: 0.18,
      reason: "Common pescatarian breakfast carbohydrate starter used as a review draft.",
      tokens: ["gluten", "grain", "oats"],
      estimatedNutritionPer100g: { calories: 389, protein: 17, fat: 7, carbs: 66 },
    },
    {
      name: "Banana",
      quantityGrams: 100,
      confidence: 0.16,
      reason: "Common pescatarian breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
    },
  ],
  low_carb: [
    {
      name: "Boiled egg",
      quantityGrams: 120,
      confidence: 0.2,
      reason: "Common low-carb breakfast protein starter used as a review draft.",
      tokens: ["egg"],
      estimatedNutritionPer100g: { calories: 155, protein: 13, fat: 11, carbs: 1.1 },
    },
    {
      name: "Cottage cheese",
      quantityGrams: 150,
      confidence: 0.18,
      reason: "Common low-carb breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Cucumber",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common low-carb breakfast vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
    },
  ],
  gluten_free: [
    {
      name: "Greek yogurt",
      quantityGrams: 180,
      confidence: 0.22,
      reason: "Common gluten-free breakfast protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "yogurt"],
      estimatedNutritionPer100g: { calories: 73, protein: 10, fat: 2, carbs: 3.9 },
    },
    {
      name: "Banana",
      quantityGrams: 100,
      confidence: 0.17,
      reason: "Common gluten-free breakfast fruit starter used as a review draft.",
      tokens: ["fruit", "banana"],
      estimatedNutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
    },
    {
      name: "Almonds",
      quantityGrams: 20,
      confidence: 0.15,
      reason: "Common gluten-free breakfast fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
};

const lunchDinnerTemplates = {
  balanced: [
    {
      name: "Chicken breast",
      quantityGrams: 160,
      confidence: 0.22,
      reason: "Common lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    },
    {
      name: "Rice cooked",
      quantityGrams: 180,
      confidence: 0.18,
      reason: "Common lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    },
    {
      name: "Tomato",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    },
  ],
  vegetarian: [
    {
      name: "Tofu",
      quantityGrams: 160,
      confidence: 0.21,
      reason: "Common vegetarian lunch/dinner protein starter used as a review draft.",
      tokens: ["soy", "tofu"],
      estimatedNutritionPer100g: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
    },
    {
      name: "Rice cooked",
      quantityGrams: 180,
      confidence: 0.18,
      reason: "Common vegetarian lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    },
    {
      name: "Tomato",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common vegetarian lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    },
  ],
  vegan: [
    {
      name: "Tofu",
      quantityGrams: 160,
      confidence: 0.21,
      reason: "Common vegan lunch/dinner protein starter used as a review draft.",
      tokens: ["soy", "tofu"],
      estimatedNutritionPer100g: { calories: 76, protein: 8, fat: 4.8, carbs: 1.9 },
    },
    {
      name: "Rice cooked",
      quantityGrams: 180,
      confidence: 0.18,
      reason: "Common vegan lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    },
    {
      name: "Tomato",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common vegan lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    },
  ],
  pescatarian: [
    {
      name: "Salmon",
      quantityGrams: 150,
      confidence: 0.22,
      reason: "Common pescatarian lunch/dinner protein starter used as a review draft.",
      tokens: ["fish", "salmon"],
      estimatedNutritionPer100g: { calories: 208, protein: 20, fat: 13, carbs: 0 },
    },
    {
      name: "Rice cooked",
      quantityGrams: 160,
      confidence: 0.18,
      reason: "Common pescatarian lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    },
    {
      name: "Cucumber",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common pescatarian lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
    },
  ],
  low_carb: [
    {
      name: "Chicken breast",
      quantityGrams: 160,
      confidence: 0.21,
      reason: "Common low-carb lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    },
    {
      name: "Avocado",
      quantityGrams: 80,
      confidence: 0.16,
      reason: "Common low-carb fat starter used as a review draft.",
      tokens: ["fruit", "avocado"],
      estimatedNutritionPer100g: { calories: 160, protein: 2, fat: 15, carbs: 9 },
    },
    {
      name: "Cucumber",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common low-carb vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
    },
  ],
  gluten_free: [
    {
      name: "Chicken breast",
      quantityGrams: 160,
      confidence: 0.22,
      reason: "Common gluten-free lunch/dinner protein starter used as a review draft.",
      tokens: ["chicken", "meat"],
      estimatedNutritionPer100g: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    },
    {
      name: "Rice cooked",
      quantityGrams: 180,
      confidence: 0.18,
      reason: "Common gluten-free lunch/dinner carbohydrate starter used as a review draft.",
      tokens: ["grain", "rice"],
      estimatedNutritionPer100g: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    },
    {
      name: "Tomato",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common gluten-free lunch/dinner vegetable starter used as a review draft.",
      tokens: ["vegetable", "tomato"],
      estimatedNutritionPer100g: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    },
  ],
};

const snackTemplates = {
  balanced: [
    {
      name: "Cottage cheese",
      quantityGrams: 180,
      confidence: 0.2,
      reason: "Common snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Apple",
      quantityGrams: 120,
      confidence: 0.16,
      reason: "Common snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.14,
      reason: "Common snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  vegetarian: [
    {
      name: "Cottage cheese",
      quantityGrams: 180,
      confidence: 0.2,
      reason: "Common vegetarian snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Apple",
      quantityGrams: 120,
      confidence: 0.16,
      reason: "Common vegetarian snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.14,
      reason: "Common vegetarian snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  vegan: [
    {
      name: "Hummus",
      quantityGrams: 100,
      confidence: 0.18,
      reason: "Common vegan snack starter used as a review draft.",
      tokens: ["legume", "hummus"],
      estimatedNutritionPer100g: { calories: 166, protein: 8, fat: 9.6, carbs: 14 },
    },
    {
      name: "Apple",
      quantityGrams: 120,
      confidence: 0.16,
      reason: "Common vegan snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.14,
      reason: "Common vegan snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  pescatarian: [
    {
      name: "Cottage cheese",
      quantityGrams: 180,
      confidence: 0.2,
      reason: "Common pescatarian snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Apple",
      quantityGrams: 120,
      confidence: 0.16,
      reason: "Common pescatarian snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.14,
      reason: "Common pescatarian snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  low_carb: [
    {
      name: "Cottage cheese",
      quantityGrams: 180,
      confidence: 0.19,
      reason: "Common low-carb snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Cucumber",
      quantityGrams: 120,
      confidence: 0.14,
      reason: "Common low-carb snack vegetable starter used as a review draft.",
      tokens: ["vegetable", "cucumber"],
      estimatedNutritionPer100g: { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.13,
      reason: "Common low-carb snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
  gluten_free: [
    {
      name: "Cottage cheese",
      quantityGrams: 180,
      confidence: 0.2,
      reason: "Common gluten-free snack protein starter used as a review draft.",
      tokens: ["dairy", "lactose", "cheese"],
      estimatedNutritionPer100g: { calories: 121, protein: 17, fat: 5, carbs: 3 },
    },
    {
      name: "Apple",
      quantityGrams: 120,
      confidence: 0.16,
      reason: "Common gluten-free snack fruit starter used as a review draft.",
      tokens: ["fruit", "apple"],
      estimatedNutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    },
    {
      name: "Almonds",
      quantityGrams: 15,
      confidence: 0.14,
      reason: "Common gluten-free snack fat/protein starter used as a review draft.",
      tokens: ["nuts", "almonds"],
      estimatedNutritionPer100g: { calories: 579, protein: 21, fat: 50, carbs: 22 },
    },
  ],
};

const getTemplate = (mealType, dietStyle) => {
  if (mealType === "breakfast") {
    return breakfastTemplates[dietStyle];
  }

  if (mealType === "snack") {
    return snackTemplates[dietStyle];
  }

  return lunchDinnerTemplates[dietStyle];
};

const removeBlockedItems = (items, blockedTokens) => {
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

const getMealLabel = (mealType) =>
  mealType.charAt(0).toUpperCase() + mealType.slice(1);

export const createPhotoAnalysisService = () => ({
  analyzePhoto: async (profileState, requestBody) => {
    const imageDataUrl =
      typeof requestBody?.imageDataUrl === "string" ? requestBody.imageDataUrl.trim() : "";
    const mealType = normalizeMealType(requestBody?.mealType);

    if (
      imageDataUrl.length > maxPhotoDataUrlLength ||
      !safePhotoDataUrlPattern.test(imageDataUrl)
    ) {
      throw new StateApiError(
        "INVALID_PHOTO_PAYLOAD",
        "Photo analysis requires a JPEG, PNG, or WebP image data URL under 1.7 MB."
      );
    }

    const dietStyle = normalizeDietStyle(profileState?.dietStyle);
    const blockedTokens = buildBlockedTokens(profileState);
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
      dishName: `${getMealLabel(mealType)} photo draft`,
      summary:
        "This build does not use paid AI vision. The photo is kept as a visual reference, and the app prepares a low-confidence draft based on meal type and your nutrition preferences.",
      confidence: 0.18,
      estimatedPortions: 1,
      cautions: [
        "Automatic image recognition is disabled in this build.",
        "Every suggested item is only a starter draft and must be reviewed manually.",
        "Adjust quantities or replace foods before saving to the diary.",
      ],
      manualReviewRequired: true,
      items,
    };
  },
});
