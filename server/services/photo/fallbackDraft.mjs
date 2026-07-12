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

const photoDraftSummary =
  "I could not confidently identify visible foods from this photo. Try another photo with better light, sharper focus, and the whole meal clearly visible, or add the visible ingredients manually before saving.";
const photoDraftReviewCaution =
  "No food was automatically identified. The diary will not be changed until you confirm ingredients.";

export const createFallbackPhotoAnalysis = ({ mealType, dietStyle, blockedTokens, mealState, image }) => {
  void mealType;
  void dietStyle;
  void blockedTokens;
  const feedbackItems = getFeedbackItemsFromMealState(mealState);
  const items = feedbackItems.map((item) => toPhotoSuggestion(item));
  const interpretations = feedbackItems.length > 0
    ? [
        {
          id: "user-confirmed-history",
          title: "Previously confirmed by you",
          reason:
            "Uses ingredients you previously corrected and confirmed from photo drafts. Confirm again before saving.",
          items,
          confidence: 0.34,
        },
      ]
    : [];

  return {
    dishName: "Photo needs checking",
    summary: photoDraftSummary,
    confidence: feedbackItems.length > 0 ? 0.34 : 0,
    estimatedPortions: 1,
    cautions: [
      photoDraftReviewCaution,
      "Portions are ranges; exact grams are not visible from the photo alone.",
      "Add sauces, oils, fillings, drinks, and visible foods manually.",
    ],
    uncertainIngredients: items.map((item) => item.name),
    hiddenIngredientQuestions: [
      "Can you retake the photo in brighter light with the food in focus?",
      "Is the whole meal visible in the frame without blur or strong shadows?",
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
