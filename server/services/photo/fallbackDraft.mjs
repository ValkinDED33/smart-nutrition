const FALLBACK_LANGUAGE = "en";
const SUPPORTED_FALLBACK_LANGUAGES = new Set(["uk", "pl", "en"]);

const fallbackCopy = {
  uk: {
    dishName: "Фото потребує ручної перевірки",
    summary:
      "Я не зміг упевнено розпізнати видиму їжу на цьому фото. Спробуйте зробити чіткіше фото при кращому світлі, щоб увесь прийом їжі був у кадрі, або додайте видимі інгредієнти вручну перед збереженням.",
    reviewCaution:
      "Їжу автоматично не розпізнано. Щоденник не зміниться, доки ви не підтвердите інгредієнти.",
    portionCaution: "Порції мають бути перевірені вами; точні грами не видно лише з фото.",
    manualCaution: "Додайте соуси, олію, начинки, напої та видимі продукти вручну.",
    hiddenQuestions: [
      "Спробуєте зробити фото при кращому світлі, щоб їжа була у фокусі?",
      "Чи весь прийом їжі видно в кадрі без розмиття або сильних тіней?",
      "Чи є соуси, олія, масло, сир або заправка, яких не видно чітко?",
      "Чи є щось всередині ролу, сендвіча, боулу або закритої частини страви?",
      "Чи був до цього фото напій, гарнір або десерт?",
    ],
  },
  pl: {
    dishName: "Zdjęcie wymaga ręcznego sprawdzenia",
    summary:
      "Nie udało mi się pewnie rozpoznać widocznego jedzenia na tym zdjęciu. Spróbuj zrobić ostrzejsze zdjęcie w lepszym świetle, z całym posiłkiem w kadrze, albo dodaj widoczne składniki ręcznie przed zapisaniem.",
    reviewCaution:
      "Jedzenie nie zostało automatycznie rozpoznane. Dziennik nie zmieni się, dopóki nie potwierdzisz składników.",
    portionCaution: "Porcje musisz sprawdzić ręcznie; dokładnych gramów nie widać z samego zdjęcia.",
    manualCaution: "Dodaj sosy, olej, nadzienia, napoje i widoczne produkty ręcznie.",
    hiddenQuestions: [
      "Czy możesz zrobić zdjęcie w lepszym świetle, tak aby jedzenie było ostre?",
      "Czy cały posiłek jest widoczny w kadrze bez rozmycia albo mocnych cieni?",
      "Czy są sosy, olej, masło, ser lub dressing, których nie widać wyraźnie?",
      "Czy coś jest w środku wrapa, kanapki, bowla albo zakrytej części dania?",
      "Czy do tego zdjęcia był napój, dodatek albo deser?",
    ],
  },
  en: {
    dishName: "Photo needs checking",
    summary:
      "I could not confidently identify visible foods from this photo. Try another photo with better light, sharper focus, and the whole meal clearly visible, or add the visible ingredients manually before saving.",
    reviewCaution:
      "No food was automatically identified. The diary will not be changed until you confirm ingredients.",
    portionCaution: "Portions must be checked by you; exact grams are not visible from the photo alone.",
    manualCaution: "Add sauces, oils, fillings, drinks, and visible foods manually.",
    hiddenQuestions: [
      "Can you retake the photo in brighter light with the food in focus?",
      "Is the whole meal visible in the frame without blur or strong shadows?",
      "Are there sauces, oil, butter, cheese, or dressing not clearly visible?",
      "Is anything inside a wrap, sandwich, bowl, or covered part of the meal?",
      "Was any drink, side, or dessert eaten with this photo?",
    ],
  },
};

const normalizeFallbackLanguage = (value) => {
  const language = String(value ?? "").trim().toLowerCase();
  return SUPPORTED_FALLBACK_LANGUAGES.has(language) ? language : FALLBACK_LANGUAGE;
};

export const createFallbackPhotoAnalysis = ({
  mealType,
  dietStyle,
  blockedTokens,
  mealState,
  image,
  language = FALLBACK_LANGUAGE,
}) => {
  void mealType;
  void dietStyle;
  void blockedTokens;
  void mealState;
  const copy = fallbackCopy[normalizeFallbackLanguage(language)] ?? fallbackCopy[FALLBACK_LANGUAGE];
  const items = [];
  const interpretations = [];

  return {
    dishName: copy.dishName,
    summary: copy.summary,
    recognitionStatus: "needs_better_photo",
    confidence: 0,
    estimatedPortions: 1,
    cautions: [
      copy.reviewCaution,
      copy.portionCaution,
      copy.manualCaution,
    ],
    uncertainIngredients: items.map((item) => item.name),
    hiddenIngredientQuestions: copy.hiddenQuestions,
    interpretations,
    manualReviewRequired: true,
    image,
    items,
  };
};
