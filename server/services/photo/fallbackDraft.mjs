const photoDraftSummary =
  "I could not confidently identify visible foods from this photo. Try another photo with better light, sharper focus, and the whole meal clearly visible, or add the visible ingredients manually before saving.";
const photoDraftReviewCaution =
  "No food was automatically identified. The diary will not be changed until you confirm ingredients.";

export const createFallbackPhotoAnalysis = ({ mealType, dietStyle, blockedTokens, mealState, image }) => {
  void mealType;
  void dietStyle;
  void blockedTokens;
  void mealState;
  const items = [];
  const interpretations = [];

  return {
    dishName: "Photo needs checking",
    summary: photoDraftSummary,
    recognitionStatus: "needs_better_photo",
    confidence: 0,
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
