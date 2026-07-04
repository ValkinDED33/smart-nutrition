import { breakfastTemplates, lunchDinnerTemplates, snackTemplates } from "./fallbackTemplates.mjs";

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

const toPortionRangeGrams = (quantityGrams) => {
  const quantity = Math.max(Math.round(Number(quantityGrams) || 100), 5);
  const min = Math.max(Math.round((quantity * 0.75) / 5) * 5, 5);
  const max = Math.max(Math.round((quantity * 1.25) / 5) * 5, min + 5);

  return { min, max };
};

const toPhotoSuggestion = (item, { uncertain = true } = {}) => ({
  name: item.name,
  originalName: item.name,
  quantityGrams: item.quantityGrams,
  portionRangeGrams: toPortionRangeGrams(item.quantityGrams),
  confidence: Math.min(Number(item.confidence) || 0.12, 0.69),
  reason: item.reason,
  uncertain,
  estimatedNutritionPer100g: item.estimatedNutritionPer100g,
});

const createInterpretation = ({ id, title, reason, items, confidence }) => ({
  id,
  title,
  confidence: Math.min(Number(confidence) || 0.12, 0.69),
  reason,
  items: items.slice(0, 4).map((item) => toPhotoSuggestion(item)),
});

const getAlternativeMealTypes = (mealType) => {
  if (mealType === "breakfast") {
    return ["snack", "lunch"];
  }

  if (mealType === "snack") {
    return ["breakfast", "lunch"];
  }

  return ["snack", "breakfast"];
};

const getFeedbackItemsFromMealState = (mealState) => {
  const entries = Array.isArray(mealState?.items) ? mealState.items : [];
  const counts = new Map();

  for (const entry of entries) {
    const compounds = Array.isArray(entry?.product?.facts?.extraCompounds)
      ? entry.product.facts.extraCompounds
      : [];

    if (!compounds.includes("photo-feedback:user-confirmed")) {
      continue;
    }

    const name = String(entry?.product?.name ?? "").trim();

    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    const previous = counts.get(key) ?? {
      name,
      quantityGrams: Math.max(Math.round(Number(entry?.quantity ?? 100) || 100), 5),
      count: 0,
      estimatedNutritionPer100g: entry?.product?.nutrients ?? {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      },
    };

    counts.set(key, { ...previous, count: previous.count + 1 });
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      quantityGrams: item.quantityGrams,
      confidence: Math.min(0.34 + item.count * 0.04, 0.58),
      reason:
        "Previously confirmed by this user from photo corrections; still requires visual confirmation for this image.",
      tokens: [],
      estimatedNutritionPer100g: {
        calories: Number(item.estimatedNutritionPer100g?.calories ?? 0) || 0,
        protein: Number(item.estimatedNutritionPer100g?.protein ?? 0) || 0,
        fat: Number(item.estimatedNutritionPer100g?.fat ?? 0) || 0,
        carbs: Number(item.estimatedNutritionPer100g?.carbs ?? 0) || 0,
      },
    }));
};

const getMealLabel = (mealType) =>
  mealType.charAt(0).toUpperCase() + mealType.slice(1);

export const createFallbackPhotoAnalysis = ({ mealType, dietStyle, blockedTokens, mealState, image }) => {
  const template = getTemplate(mealType, dietStyle);
  const filteredTemplate = removeBlockedItems(template, blockedTokens);
  const baseItems = filteredTemplate.length > 0 ? filteredTemplate : template;
  const feedbackItems = getFeedbackItemsFromMealState(mealState);
  const items = (feedbackItems.length > 0 ? feedbackItems : baseItems).map((item) =>
    toPhotoSuggestion(item)
  );
  const interpretationSources = [
    {
      id: "current-meal-pattern",
      title: `${getMealLabel(mealType)} candidate`,
      reason:
        "Meal type, profile preferences, allergies/exclusions, and safe starter ingredients.",
      items: baseItems,
      confidence: 0.28,
    },
    ...getAlternativeMealTypes(mealType).map((alternativeMealType, index) => ({
      id: `alternative-${alternativeMealType}`,
      title: `${getMealLabel(alternativeMealType)} alternative`,
      reason:
        "Alternative interpretation because a single photo may hide ingredients, sauces, or portion boundaries.",
      items: removeBlockedItems(getTemplate(alternativeMealType, dietStyle), blockedTokens),
      confidence: index === 0 ? 0.22 : 0.18,
    })),
  ];
  const feedbackInterpretation =
    feedbackItems.length > 0
      ? [
          {
            id: "user-confirmed-history",
            title: "Previously confirmed by you",
            reason:
              "Uses ingredients you previously corrected and confirmed from photo drafts. Confirm again before saving.",
            items: feedbackItems,
            confidence: 0.34,
          },
        ]
      : [];
  const interpretations = [...feedbackInterpretation, ...interpretationSources]
    .slice(0, 3)
    .map(createInterpretation);

  return {
    dishName: `${getMealLabel(mealType)} photo draft`,
    summary:
      "AI estimate, please confirm. This build prepares honest low-confidence candidates from meal context, profile preferences, and previous confirmed corrections; it does not invent hidden ingredients or exact grams.",
    confidence: Math.max(...interpretations.map((item) => item.confidence), 0.18),
    estimatedPortions: 1,
    cautions: [
      "AI estimate, please confirm before saving.",
      "Portions are ranges; exact grams are not visible from the photo alone.",
      "Hidden sauces, oils, fillings, and drinks must be added manually.",
    ],
    uncertainIngredients: items.map((item) => item.name),
    hiddenIngredientQuestions: [
      "Are there sauces, oil, butter, cheese, or dressing not clearly visible?",
      "Is anything inside a wrap, sandwich, bowl, or covered part of the meal?",
      "Was any drink, side, or dessert eaten with this photo?",
    ],
    interpretations,
    manualReviewRequired: true,
    image,
    items,
  };
};
