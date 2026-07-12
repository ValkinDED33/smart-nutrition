import { useMemo, useState, type MouseEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { analyzeMealPhoto } from "../../shared/api/auth";
import { useLanguage } from "../../shared/language";
import { createEmptyNutrients } from "@domain/meal/nutrients";
import {
  chooseBestPhotoProductMatch,
  createBlankPhotoSuggestion,
  rescalePhotoMealAnalysis,
  scalePhotoMealAnalysis,
  shouldStartWithSuggestionsOnly,
} from "@features/meal/photo/photoDraft";
import {
  getPhotoReviewState,
  photoMealSaveButtonSx,
  shouldShowPhotoInterpretationChoices,
} from "@features/meal/photo/photoMealAssistantUx";
import type { MealEntry, MealType } from "@domain/meal/types";
import type {
  PhotoMealAnalysis,
  PhotoMealSuggestion,
  PhotoPortionSize,
} from "../../shared/types/photo";
import type { Product } from "@domain/products/types";
import type { AppLanguage } from "@shared/types/i18n";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { addMealEntriesToCloud } from "./mealCloudSync";
import { useMealActionFeedback } from "./useMealActionFeedback";
import { searchProducts } from "../../shared/api/products";

const FLEX_START_ALIGNMENT = "flex-start";
const PHOTO_BORDER_SOFT_COLOR = "var(--sn-border-soft)";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });

const supportedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxRawPhotoBytes = 12 * 1024 * 1024;
const maxPhotoPreviewSide = 1280;
const maxCompressedPhotoMb = 1.2;

const readPhotoFileAsDataUrl = async (file: File) => {
  if (!supportedPhotoTypes.has(file.type)) {
    throw new Error("UNSUPPORTED_PHOTO_TYPE");
  }

  if (file.size > maxRawPhotoBytes) {
    throw new Error("PHOTO_TOO_LARGE");
  }

  const compressedFile = await imageCompression(file, {
    alwaysKeepResolution: false,
    fileType: "image/jpeg",
    initialQuality: 0.86,
    maxSizeMB: maxCompressedPhotoMb,
    maxWidthOrHeight: maxPhotoPreviewSide,
    useWebWorker: true,
  });

  return readFileAsDataUrl(compressedFile);
};

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getPhotoSuggestionAt = (
  suggestions: PhotoMealSuggestion[],
  targetIndex: number
) => {
  let currentIndex = 0;

  for (const suggestion of suggestions) {
    if (currentIndex === targetIndex) {
      return suggestion;
    }

    currentIndex += 1;
  }

  return undefined;
};

const getMatchedPhotoProductAt = (
  products: Array<Product | null>,
  targetIndex: number
) => {
  let currentIndex = 0;

  for (const product of products) {
    if (currentIndex === targetIndex) {
      return product;
    }

    currentIndex += 1;
  }

  return null;
};

const getPhotoInterpretationAt = (
  interpretations: PhotoMealAnalysis["interpretations"] | undefined,
  targetIndex: number
) => {
  let currentIndex = 0;

  for (const interpretation of interpretations ?? []) {
    if (currentIndex === targetIndex) {
      return interpretation;
    }

    currentIndex += 1;
  }

  return undefined;
};

const getQuantityDraftAt = (
  drafts: Record<number, string>,
  targetIndex: number
) => {
  const targetKey = String(targetIndex);

  for (const [key, value] of Object.entries(drafts)) {
    if (key === targetKey) {
      return value;
    }
  }

  return undefined;
};

const removeQuantityDraftAt = (
  drafts: Record<number, string>,
  targetIndex: number
) => {
  const targetKey = String(targetIndex);

  return Object.fromEntries(
    Object.entries(drafts).filter(([key]) => key !== targetKey)
  ) as Record<number, string>;
};

const roundMacro = (value: number) => Math.round(value * 10) / 10;

const calculateSuggestionCalories = (suggestion: PhotoMealSuggestion) =>
  Math.round(
    (suggestion.estimatedNutritionPer100g.calories * suggestion.quantityGrams) / 100
  );

const createPhotoProduct = (
  suggestion: PhotoMealSuggestion,
  previewUrl: string | null,
  matchedProduct: Product | null = null
): Product => {
  if (matchedProduct) {
    return {
      ...matchedProduct,
      id: createId("photo-product-match"),
      name: suggestion.name,
      imageUrl: matchedProduct.imageUrl ?? previewUrl ?? undefined,
      facts: {
        ...matchedProduct.facts,
        extraCompounds: [
          ...(matchedProduct.facts?.extraCompounds ?? []),
          "photo-product-match:online",
          `photo-product-source:${matchedProduct.source}`,
        ],
      },
    };
  }

  const nutrients = createEmptyNutrients();

  nutrients.calories = suggestion.estimatedNutritionPer100g.calories;
  nutrients.protein = suggestion.estimatedNutritionPer100g.protein;
  nutrients.fat = suggestion.estimatedNutritionPer100g.fat;
  nutrients.carbs = suggestion.estimatedNutritionPer100g.carbs;

  return {
    id: createId("photo-product"),
    name: suggestion.name,
    unit: "g",
    source: "Manual",
    imageUrl: previewUrl ?? undefined,
    nutrients,
  };
};

const createDraftEntries = (
  analysis: PhotoMealAnalysis,
  mealType: MealType,
  previewUrl: string | null,
  matchedProducts: Array<Product | null> = []
): MealEntry[] => {
  const eatenAt = new Date().toISOString();

  return analysis.items.map((suggestion, index) => ({
    id: createId("photo-entry"),
    product: createPhotoProduct(
      suggestion,
      previewUrl,
      getMatchedPhotoProductAt(matchedProducts, index)
    ),
    quantity: Math.max(Math.round(suggestion.quantityGrams), 5),
    mealType,
    eatenAt,
    origin: "manual",
  }));
};

const createConfirmedPhotoEntries = (
  analysis: PhotoMealAnalysis,
  mealType: MealType,
  previewUrl: string | null,
  matchedProducts: Array<Product | null> = []
): MealEntry[] =>
  createDraftEntries(analysis, mealType, previewUrl, matchedProducts).map((entry, index) => {
    const suggestion = getPhotoSuggestionAt(analysis.items, index);
    const matchedProduct = getMatchedPhotoProductAt(matchedProducts, index);
    const originalName = suggestion?.originalName?.trim();
    const correctedName = suggestion?.name?.trim();
    const correctionLabel =
      originalName && correctedName && originalName !== correctedName
        ? `photo-feedback:replaced:${originalName}->${correctedName}`.slice(0, 120)
        : "photo-feedback:confirmed";

    return {
      ...entry,
      product: {
        ...entry.product,
        facts: {
          ...entry.product.facts,
          extraCompounds: [
            ...(entry.product.facts?.extraCompounds ?? []),
            "photo-feedback:user-confirmed",
            "photo-ai-estimate",
            matchedProduct ? "photo-product-match:confirmed" : "photo-product-match:estimate-only",
            correctionLabel,
            `photo-confidence:${Math.round((suggestion?.confidence ?? 0) * 100)}`,
          ],
        },
      },
    };
  });

const photoCopy = {
  uk: {
    title: "Фото страви",
    subtitle:
      "Завантажте фото, швидко перевірте склад і збережіть прийом їжі.",
    upload: "Завантажити фото страви",
    uploaded: "Фото завантажено",
    recognizing: "Аналізуємо фото...",
    readError: "Не вдалося прочитати фото. Спробуйте інший файл.",
    invalidType: "Підтримуються JPG, PNG або WebP.",
    tooLarge: "Фото завелике. Оберіть файл до 12 MB.",
    analysisError:
      "Не вдалося підготувати підказки для цього фото. Нижче можна додати страву вручну.",
    analyzed: "Склад підготовлено. Перевірте деталі перед збереженням.",
    needsDetails:
      "Потрібно перевірити склад. Я підготував основу, ви можете швидко змінити назви та грами.",
    poorPhotoTitle: "Фото не розпізналося достатньо добре",
    poorPhotoTips: [
      "Спробуйте сфотографувати при яскравішому світлі.",
      "Тримайте камеру рівно, щоб фото не було розмитим.",
      "Покажіть усю страву в кадрі без сильних тіней і закритих частин.",
    ],
    savingDraft: "Зберігаємо обрані підказки в щоденник...",
    saveFailed: "Не вдалося додати чернетку до щоденника.",
    retry: "Спробувати ще раз",
    previewAlt: "Прев'ю фото страви",
    removePhoto: "Прибрати фото",
    detected: "Схоже на",
    matchOptions: "Можна уточнити",
    uncertain: "Перевір склад",
    hiddenQuestions: "Перед збереженням",
    hiddenQuestionList: [
      "Чи є на фото соус, масло, сир або заправка, які погано видно?",
      "Чи є всередині страви начинка або інгредієнти, закриті тістом чи хлібом?",
      "Чи були разом із цією стравою напій, десерт або додаткова порція?",
    ],
    reviewStatusTitle: "Фото розібрано",
    reviewStatusBody:
      "Це чернетка прийому їжі. Виберіть правильні інгредієнти, поправте грами і тільки потім збережіть у щоденник.",
    reviewStepIngredients: "Склад",
    reviewStepIngredientsBody: "залиште тільки те, що справді було на тарілці",
    reviewStepPortion: "Порція",
    reviewStepPortionBody: "виберіть легку, стандартну або велику порцію",
    reviewStepSave: "Збереження",
    reviewStepSaveBody: "запис створиться тільки після вашого підтвердження",
    selectedHint: "Поки нічого не вибрано. Позначте інгредієнти, які треба додати.",
    needsManualPhotoTitle: "Фото потребує ручної перевірки",
    portions: "Порція",
    portionLight: "Легка",
    portionRegular: "Стандарт",
    portionLarge: "Велика",
    portionsValue: "{value} порції",
    ready: "Готово до збереження",
    review: "Перевір перед збереженням",
    needsDetailsChip: "Потрібно перевірити",
    macros: "Підсумок прийому",
    suggestions: "Склад",
    notThis: "Не це",
    addMissing: "Додати пропущений інгредієнт",
    removeWrong: "Прибрати",
    replaceHint: "Можна відредагувати назву або грами.",
    selected: "Обрано",
    itemName: "Назва",
    itemGrams: "Грами",
    empty: "Підказки не сформувалися. Скористайтеся ручним додаванням нижче.",
    nothingSelected: "Оберіть хоча б один пункт із чернетки.",
    incompleteCorrection: "Заповніть назву для кожного обраного інгредієнта перед збереженням.",
    resolvingProducts: "Підтягуємо нутрієнти з online/backend бази...",
    productLookupPartial:
      "Частину інгредієнтів не знайдено в online/backend базі, тому збережено перевірені вами значення.",
    productLookupMatched: "Нутрієнти підтягнуті з online/backend бази для обраних інгредієнтів.",
    addDraft: "Підтвердити і додати",
    added: "Чернетку додано до щоденника.",
    itemCalories: "{value} ккал",
    itemMacros: "Білки {protein} г • Жири {fat} г • Вуглеводи {carbs} г",
    grams: "{value} г",
  },
  pl: {
    title: "Zdjęcie posiłku",
    subtitle:
      "Wgraj zdjęcie, szybko sprawdź skład i zapisz posiłek.",
    upload: "Wgraj zdjęcie posiłku",
    uploaded: "Zdjęcie wgrane",
    recognizing: "Analizujemy zdjęcie...",
    readError: "Nie udało się odczytać zdjęcia. Spróbuj innego pliku.",
    invalidType: "Obsługiwane są JPG, PNG albo WebP.",
    tooLarge: "Zdjęcie jest za duże. Wybierz plik do 12 MB.",
    analysisError:
      "Nie udało się przygotować podpowiedzi dla tego zdjęcia. Niżej możesz dodać posiłek ręcznie.",
    analyzed: "Skład jest przygotowany. Sprawdź szczegóły przed zapisem.",
    needsDetails:
      "Trzeba sprawdzić skład. Przygotowałem podstawę, możesz szybko zmienić nazwy i gramy.",
    poorPhotoTitle: "Zdjęcie nie zostało rozpoznane wystarczająco dobrze",
    poorPhotoTips: [
      "Spróbuj zrobić zdjęcie w jaśniejszym świetle.",
      "Trzymaj aparat stabilnie, żeby zdjęcie nie było rozmazane.",
      "Pokaż cały posiłek w kadrze, bez mocnych cieni i zakrytych części.",
    ],
    savingDraft: "Zapisujemy wybrane podpowiedzi w dzienniku...",
    saveFailed: "Nie udało się dodać szkicu do dziennika.",
    retry: "Spróbuj ponownie",
    previewAlt: "Podgląd zdjęcia posiłku",
    removePhoto: "Usuń zdjęcie",
    detected: "Wygląda na",
    matchOptions: "Możesz doprecyzować",
    uncertain: "Sprawdź skład",
    hiddenQuestions: "Przed zapisem",
    hiddenQuestionList: [
      "Czy na zdjęciu jest sos, masło, ser albo dressing, których nie widać dokładnie?",
      "Czy w środku potrawy jest farsz albo składniki przykryte ciastem lub pieczywem?",
      "Czy razem z tym posiłkiem był napój, deser albo dodatkowa porcja?",
    ],
    reviewStatusTitle: "Zdjęcie rozpisane",
    reviewStatusBody:
      "To szkic posiłku. Zostaw właściwe składniki, popraw gramy i dopiero wtedy zapisz w dzienniku.",
    reviewStepIngredients: "Skład",
    reviewStepIngredientsBody: "zostaw tylko to, co naprawdę było na talerzu",
    reviewStepPortion: "Porcja",
    reviewStepPortionBody: "wybierz lekką, standardową albo dużą porcję",
    reviewStepSave: "Zapis",
    reviewStepSaveBody: "wpis powstanie dopiero po Twoim potwierdzeniu",
    selectedHint: "Na razie nic nie wybrano. Zaznacz składniki, które chcesz dodać.",
    needsManualPhotoTitle: "Zdjęcie wymaga ręcznego sprawdzenia",
    portions: "Porcja",
    portionLight: "Lekka",
    portionRegular: "Standard",
    portionLarge: "Duża",
    portionsValue: "{value} porcji",
    ready: "Gotowe do zapisu",
    review: "Sprawdź przed zapisem",
    needsDetailsChip: "Trzeba sprawdzić",
    macros: "Podsumowanie posiłku",
    suggestions: "Skład",
    notThis: "To nie to",
    addMissing: "Dodaj brakujący składnik",
    removeWrong: "Usuń",
    replaceHint: "Możesz zmienić nazwę albo gramy.",
    selected: "Wybrane",
    itemName: "Nazwa",
    itemGrams: "Gramy",
    empty: "Nie udało się zbudować podpowiedzi. Skorzystaj z ręcznego dodawania poniżej.",
    nothingSelected: "Wybierz przynajmniej jedną pozycję ze szkicu.",
    incompleteCorrection: "Uzupełnij nazwę każdego wybranego składnika przed zapisem.",
    resolvingProducts: "Pobieramy wartości odżywcze z bazy online/backend...",
    productLookupPartial:
      "Części składników nie znaleziono w bazie online/backend, więc zapisano sprawdzone przez Ciebie wartości.",
    productLookupMatched:
      "Wartości odżywcze zostały pobrane z bazy online/backend dla wybranych składników.",
    addDraft: "Potwierdź i dodaj",
    added: "Szkic został dodany do dziennika.",
    itemCalories: "{value} kcal",
    itemMacros: "Białko {protein} g • Tłuszcz {fat} g • Węglowodany {carbs} g",
    grams: "{value} g",
  },
  en: {
    title: "Meal photo",
    subtitle:
      "Upload a photo, quickly check the ingredients, and save the meal.",
    upload: "Upload meal photo",
    uploaded: "Photo uploaded",
    recognizing: "Analyzing photo...",
    readError: "Could not read the photo. Try another file.",
    invalidType: "JPG, PNG, or WebP are supported.",
    tooLarge: "Photo is too large. Choose a file up to 12 MB.",
    analysisError:
      "Could not prepare suggestions for this photo. You can add the meal manually below.",
    analyzed: "The meal is prepared. Check the details before saving.",
    needsDetails:
      "Please check the ingredients. I prepared a starting point, and you can quickly edit names and grams.",
    poorPhotoTitle: "The photo was not clear enough to recognize",
    poorPhotoTips: [
      "Try taking the photo in brighter light.",
      "Hold the camera steady so the image is not blurry.",
      "Keep the whole meal in frame without strong shadows or covered parts.",
    ],
    savingDraft: "Saving selected draft items to your diary...",
    saveFailed: "Could not add this draft to your diary.",
    retry: "Try again",
    previewAlt: "Meal photo preview",
    removePhoto: "Remove photo",
    detected: "Looks like",
    matchOptions: "Adjust if needed",
    uncertain: "Check ingredients",
    hiddenQuestions: "Before saving",
    hiddenQuestionList: [
      "Is there sauce, oil, cheese, or dressing that is not clearly visible?",
      "Is anything hidden inside a wrap, sandwich, pastry, or covered part of the meal?",
      "Was any drink, side, dessert, or extra portion eaten with this meal?",
    ],
    reviewStatusTitle: "Photo parsed",
    reviewStatusBody:
      "This is a meal draft. Keep the correct ingredients, adjust grams, and save only after your confirmation.",
    reviewStepIngredients: "Ingredients",
    reviewStepIngredientsBody: "keep only what was actually on the plate",
    reviewStepPortion: "Portion",
    reviewStepPortionBody: "choose light, regular, or large",
    reviewStepSave: "Save",
    reviewStepSaveBody: "the diary entry is created only after confirmation",
    selectedHint: "Nothing is selected yet. Tick the ingredients you want to add.",
    needsManualPhotoTitle: "Photo needs checking",
    portions: "Portion",
    portionLight: "Light",
    portionRegular: "Regular",
    portionLarge: "Large",
    portionsValue: "{value} portions",
    ready: "Ready to save",
    review: "Check before saving",
    needsDetailsChip: "Needs checking",
    macros: "Meal summary",
    suggestions: "Ingredients",
    notThis: "Not this",
    addMissing: "Add missing ingredient",
    removeWrong: "Remove",
    replaceHint: "You can edit the name or grams.",
    selected: "Selected",
    itemName: "Name",
    itemGrams: "Grams",
    empty: "No suggestions were created. Use manual adding below.",
    nothingSelected: "Select at least one item from the draft.",
    incompleteCorrection: "Fill in the name for every selected ingredient before saving.",
    resolvingProducts: "Matching nutrients from the online/backend database...",
    productLookupPartial:
      "Some ingredients were not found in the online/backend database, so your reviewed values were saved.",
    productLookupMatched:
      "Nutrients were matched from the online/backend database for the selected ingredients.",
    addDraft: "Confirm and add",
    added: "Draft was added to the diary.",
    itemCalories: "{value} kcal",
    itemMacros: "Proteins {protein} g • Fats {fat} g • Carbohydrates {carbs} g",
    grams: "{value} g",
  },
} as const;

const getPhotoCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return photoCopy.pl;
    case "en":
      return photoCopy.en;
    case "uk":
    default:
      return photoCopy.uk;
  }
};

const ukPhotoFallbackNameLabels = new Map([
  ["Greek yogurt", "Грецький йогурт"],
  ["Oats", "Вівсянка"],
  ["Banana", "Банан"],
  ["Almonds", "Мигдаль"],
  ["Boiled egg", "Варене яйце"],
  ["Cottage cheese", "Творог"],
  ["Cucumber", "Огірок"],
  ["Chicken breast", "Куряча грудка"],
  ["Rice cooked", "Відварений рис"],
  ["Tomato", "Помідор"],
  ["Tofu", "Тофу"],
  ["Salmon", "Лосось"],
  ["Avocado", "Авокадо"],
  ["Apple", "Яблуко"],
  ["Hummus", "Хумус"],
  ["Turkey wrap", "Рол із індичкою"],
]);

const plPhotoFallbackNameLabels = new Map([
  ["Greek yogurt", "Jogurt grecki"],
  ["Oats", "Płatki owsiane"],
  ["Banana", "Banan"],
  ["Almonds", "Migdały"],
  ["Boiled egg", "Jajko gotowane"],
  ["Cottage cheese", "Twaróg"],
  ["Cucumber", "Ogórek"],
  ["Chicken breast", "Pierś z kurczaka"],
  ["Rice cooked", "Ryż gotowany"],
  ["Tomato", "Pomidor"],
  ["Tofu", "Tofu"],
  ["Salmon", "Łosoś"],
  ["Avocado", "Awokado"],
  ["Apple", "Jabłko"],
  ["Hummus", "Hummus"],
  ["Turkey wrap", "Wrap z indykiem"],
]);

const getLocalizedPhotoFallbackNameLabels = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return ukPhotoFallbackNameLabels;
    case "pl":
      return plPhotoFallbackNameLabels;
    case "en":
    default:
      return null;
  }
};

const getLocalizedMealDraftName = (language: AppLanguage, mealType: MealType) => {
  switch (language) {
    case "pl":
      switch (mealType) {
        case "breakfast":
          return "Szkic śniadania ze zdjęcia";
        case "lunch":
          return "Szkic obiadu ze zdjęcia";
        case "dinner":
          return "Szkic kolacji ze zdjęcia";
        case "snack":
        default:
          return "Szkic przekąski ze zdjęcia";
      }
    case "en":
      switch (mealType) {
        case "breakfast":
          return "Breakfast photo draft";
        case "lunch":
          return "Lunch photo draft";
        case "dinner":
          return "Dinner photo draft";
        case "snack":
        default:
          return "Snack photo draft";
      }
    case "uk":
    default:
      switch (mealType) {
        case "breakfast":
          return "Чернетка сніданку з фото";
        case "lunch":
          return "Чернетка обіду з фото";
        case "dinner":
          return "Чернетка вечері з фото";
        case "snack":
        default:
          return "Чернетка перекусу з фото";
      }
  }
};

const getLocalizedMealOptionName = (language: AppLanguage, mealType: MealType) =>
  getLocalizedMealDraftName(language, mealType).replace(/ з фото$| ze zdjęcia$/i, "");

const localizePhotoFallbackName = (name: string, language: AppLanguage) =>
  getLocalizedPhotoFallbackNameLabels(language)?.get(name) ?? name;

const localizeFallbackPhotoAnalysis = (
  analysis: PhotoMealAnalysis,
  language: AppLanguage,
  mealType: MealType
): PhotoMealAnalysis => {
  const localizeSuggestion = (item: PhotoMealSuggestion): PhotoMealSuggestion => {
    const localizedName = localizePhotoFallbackName(item.name, language);

    return localizedName === item.name
      ? item
      : {
          ...item,
          name: localizedName,
          originalName: item.originalName || item.name,
        };
  };
  const localizeDraftTitle = (title: string) => {
    if (/^Photo needs checking$/i.test(title)) {
      return getPhotoCopy(language).needsManualPhotoTitle;
    }

    return /^(Breakfast|Lunch|Dinner|Snack) photo draft$/i.test(title)
      ? getLocalizedMealDraftName(language, mealType)
      : title.replace(/\b(Breakfast|Lunch|Dinner|Snack) option\b/gi, (value) => {
          const normalizedMealType = value.toLowerCase().split(" ")[0] as MealType;
          return getLocalizedMealOptionName(language, normalizedMealType) || value;
        });
  };

  return {
    ...analysis,
    dishName: localizeDraftTitle(analysis.dishName),
    uncertainIngredients: analysis.uncertainIngredients?.map((item) =>
      localizePhotoFallbackName(item, language)
    ),
    items: analysis.items.map(localizeSuggestion),
    interpretations: analysis.interpretations?.map((interpretation) => ({
      ...interpretation,
      title: localizeDraftTitle(interpretation.title),
      items: interpretation.items.map(localizeSuggestion),
    })),
  };
};

const rawBackendPhotoQuestionPattern =
  /(sauces?|oil|butter|cheese|dressing|wrap|sandwich|bowl|covered|drink|side|dessert|exact grams|photo alone|retake|brighter|light|focus|blur|shadow|frame)/i;

const getLocalizedHiddenIngredientQuestions = (
  questions: string[] | undefined,
  copy: ReturnType<typeof getPhotoCopy>
) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const meaningfulCustomQuestions = questions
    .map((question) => question.trim())
    .filter(Boolean)
    .filter((question) => !rawBackendPhotoQuestionPattern.test(question));

  return meaningfulCustomQuestions.length > 0
    ? meaningfulCustomQuestions.slice(0, 3)
    : copy.hiddenQuestionList;
};

type Props = {
  mealType: MealType;
};

export const PhotoMealAssistant = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const meal = useSelector((state: RootState) => state.meal);
  const { appLanguage, t } = useLanguage();
  const copy = getPhotoCopy(appLanguage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoMealAnalysis | null>(null);
  const [portionSize, setPortionSize] = useState<PhotoPortionSize>("regular");
  const [analysisMode, setAnalysisMode] = useState<"cloud" | null>(null);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState<number[]>([]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isResolvingProducts, setIsResolvingProducts] = useState(false);
  const [productResolutionNotice, setProductResolutionNotice] = useState<{
    severity: "info" | "warning" | "success";
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    notice: mealActionNotice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  } = useMealActionFeedback({
    saving: {
      add: copy.savingDraft,
      edit: copy.savingDraft,
      delete: copy.savingDraft,
      repeat: copy.savingDraft,
      saveTemplate: copy.savingDraft,
      applyTemplate: copy.savingDraft,
      saveProduct: copy.savingDraft,
    },
    confirmed: {
      add: copy.added,
      edit: copy.added,
      delete: copy.added,
      repeat: copy.added,
      saveTemplate: copy.added,
      applyTemplate: copy.added,
      saveProduct: copy.added,
    },
    failed: {
      add: copy.saveFailed,
      edit: copy.saveFailed,
      delete: copy.saveFailed,
      repeat: copy.saveFailed,
      saveTemplate: copy.saveFailed,
      applyTemplate: copy.saveFailed,
      saveProduct: copy.saveFailed,
    },
    retry: copy.retry,
  });

  const totals = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return analysis.items.reduce(
      (accumulator, item) => ({
        calories: accumulator.calories + calculateSuggestionCalories(item),
        protein:
          accumulator.protein +
          (item.estimatedNutritionPer100g.protein * item.quantityGrams) / 100,
        fat: accumulator.fat + (item.estimatedNutritionPer100g.fat * item.quantityGrams) / 100,
        carbs:
          accumulator.carbs + (item.estimatedNutritionPer100g.carbs * item.quantityGrams) / 100,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }, [analysis]);

  const reviewState = analysis ? getPhotoReviewState(analysis) : null;
  const reviewLabel =
    reviewState === "ready"
      ? copy.ready
      : reviewState === "review"
        ? copy.review
        : copy.needsDetailsChip;
  const reviewColor =
    reviewState === "ready" ? "success" : reviewState === "review" ? "warning" : "info";
  const hiddenIngredientQuestions = useMemo(
    () =>
      getLocalizedHiddenIngredientQuestions(
        analysis?.hiddenIngredientQuestions,
        copy
      ),
    [analysis?.hiddenIngredientQuestions, copy]
  );

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    clearFeedback();
    setAnalysis(null);
    setAnalysisMode(null);
    setQuantityDrafts({});
    setProductResolutionNotice(null);

    try {
      const dataUrl = await readPhotoFileAsDataUrl(file);

      setPreviewUrl(dataUrl);
      setIsRecognizing(true);

      try {
        const remoteAnalysis = await analyzeMealPhoto(dataUrl, mealType);

        if (!remoteAnalysis) {
          throw new Error("PHOTO_ANALYSIS_UNAVAILABLE");
        }

        const nextAnalysis = localizeFallbackPhotoAnalysis(
          scalePhotoMealAnalysis(remoteAnalysis, "regular"),
          appLanguage,
          mealType
        );

        setPortionSize("regular");
        setAnalysis(nextAnalysis);
        setSelectedItemIndexes(
          shouldStartWithSuggestionsOnly(nextAnalysis)
            ? []
            : nextAnalysis.items.map((_, index) => index)
        );
        setQuantityDrafts({});
        setAnalysisMode("cloud");
      } catch {
        setError(copy.analysisError);
      }
    } catch (readError) {
      const message =
        readError instanceof Error && readError.message === "UNSUPPORTED_PHOTO_TYPE"
          ? copy.invalidType
          : readError instanceof Error && readError.message === "PHOTO_TOO_LARGE"
            ? copy.tooLarge
            : copy.readError;

      setError(message);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setAnalysis(null);
    setAnalysisMode(null);
    setSelectedItemIndexes([]);
    setQuantityDrafts({});
    setProductResolutionNotice(null);
    setError(null);
    clearFeedback();
  };

  const handlePortionChange = (_: MouseEvent<HTMLElement>, value: PhotoPortionSize | null) => {
    if (!value || !analysis || value === portionSize) {
      return;
    }

    setAnalysis(rescalePhotoMealAnalysis(analysis, portionSize, value));
    setQuantityDrafts({});
    setPortionSize(value);
  };

  const handleToggleSuggestion = (index: number) => {
    setSelectedItemIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index].sort((left, right) => left - right)
    );
  };

  const handleUseInterpretation = (interpretationIndex: number) => {
    const interpretation = getPhotoInterpretationAt(
      analysis?.interpretations,
      interpretationIndex
    );

    if (!analysis || !interpretation) {
      return;
    }

    setAnalysis({
      ...analysis,
      dishName: interpretation.title,
      confidence: interpretation.confidence,
      summary: interpretation.reason,
      manualReviewRequired: true,
      items: interpretation.items,
    });
    setSelectedItemIndexes(
      shouldStartWithSuggestionsOnly({ ...analysis, confidence: interpretation.confidence })
        ? []
        : interpretation.items.map((_, index) => index)
    );
    setQuantityDrafts({});
  };

  const handleNotThis = () => {
    if (!analysis) {
      return;
    }

    setAnalysis({
      ...analysis,
      confidence: 0,
      manualReviewRequired: true,
      items: [createBlankPhotoSuggestion()],
    });
    setSelectedItemIndexes([0]);
    setQuantityDrafts({});
  };

  const handleAddMissingIngredient = () => {
    if (!analysis) {
      return;
    }

    const nextItems = [...analysis.items, createBlankPhotoSuggestion()];
    setAnalysis({
      ...analysis,
      manualReviewRequired: true,
      items: nextItems,
    });
    setSelectedItemIndexes((current) =>
      [...new Set([...current, nextItems.length - 1])].sort((left, right) => left - right)
    );
  };

  const handleRemoveSuggestion = (index: number) => {
    if (!analysis) {
      return;
    }

    const nextItems = analysis.items.filter((_, itemIndex) => itemIndex !== index);
    setAnalysis({ ...analysis, items: nextItems });
    setSelectedItemIndexes((current) =>
      current
        .filter((itemIndex) => itemIndex !== index)
        .map((itemIndex) => (itemIndex > index ? itemIndex - 1 : itemIndex))
    );
    setQuantityDrafts((current) =>
      Object.fromEntries(
        Object.entries(current)
          .filter(([key]) => Number(key) !== index)
          .map(([key, value]) => [
            String(Number(key) > index ? Number(key) - 1 : Number(key)),
            value,
          ])
      )
    );
  };

  const handleSuggestionChange = (
    index: number,
    update: Partial<Pick<PhotoMealSuggestion, "name" | "quantityGrams">>
  ) => {
    if (!analysis) {
      return;
    }

    setAnalysis({
      ...analysis,
      items: analysis.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...update,
              quantityGrams:
                update.quantityGrams === undefined
                  ? item.quantityGrams
                  : Math.max(Math.round(update.quantityGrams), 5),
            }
          : item
      ),
    });
  };

  const handleSuggestionQuantityInputChange = (index: number, value: string) => {
    const safeValue = value
      .replace(/[^\d,.]/g, "")
      .replace(".", ",")
      .replace(/(,.*),/g, "$1")
      .slice(0, 5);
    const parsedValue = Number(safeValue.replace(",", "."));

    setQuantityDrafts((current) => ({ ...current, [index]: safeValue }));

    if (safeValue !== "" && Number.isFinite(parsedValue) && parsedValue > 0) {
      handleSuggestionChange(index, { quantityGrams: parsedValue });
    }
  };

  const resetSuggestionQuantityDraft = (index: number) => {
    setQuantityDrafts((current) => removeQuantityDraftAt(current, index));
  };

  const resolveConfirmedPhotoProducts = async (items: PhotoMealSuggestion[]) => {
    const results = await Promise.allSettled(
      items.map(async (item) => {
        const lookupName = item.originalName?.trim() || item.name;
        const products = await searchProducts(lookupName);
        return chooseBestPhotoProductMatch(products, { ...item, name: lookupName });
      })
    );

    return results.map((result) => (result.status === "fulfilled" ? result.value : null));
  };

  const handleAddDraft = async () => {
    if (!analysis) {
      return;
    }

    const selectedItems = analysis.items.filter((_, index) =>
      selectedItemIndexes.includes(index)
    );

    if (selectedItems.length === 0) {
      setError(copy.nothingSelected);
      return;
    }

    if (selectedItems.some((item) => !item.name.trim())) {
      setError(copy.incompleteCorrection);
      return;
    }

    setError(null);
    setProductResolutionNotice(null);
    setIsResolvingProducts(true);
    const matchedProducts = await resolveConfirmedPhotoProducts(selectedItems);
    const matchedCount = matchedProducts.filter(Boolean).length;
    setIsResolvingProducts(false);
    setProductResolutionNotice(
      matchedCount === selectedItems.length
        ? { severity: "success", text: copy.productLookupMatched }
        : { severity: matchedCount > 0 ? "warning" : "info", text: copy.productLookupPartial }
    );
    const resolvedEntries = createConfirmedPhotoEntries(
      {
        ...analysis,
        items: selectedItems,
      },
      mealType,
      previewUrl,
      matchedProducts
    );

    await runMealAction({
      actionId: "photo-draft-add",
      kind: "add",
      action: () => addMealEntriesToCloud(dispatch, meal, resolvedEntries),
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: `1px solid ${PHOTO_BORDER_SOFT_COLOR}`,
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.8}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}
        {mealActionNotice && (
          <Alert
            severity={mealActionNotice.severity}
            onClose={clearFeedback}
            action={
              mealActionNotice.retryable ? (
                <Button color="inherit" size="small" onClick={() => void retryMealAction()}>
                  {copy.retry}
                </Button>
              ) : undefined
            }
          >
            {mealActionNotice.text}
          </Alert>
        )}
        {analysisMode === "cloud" && !error && analysis && (
          <Alert severity={shouldStartWithSuggestionsOnly(analysis) ? "warning" : "info"}>
            {shouldStartWithSuggestionsOnly(analysis) ? copy.needsDetails : copy.analyzed}
          </Alert>
        )}
        {isResolvingProducts && <Alert severity="info">{copy.resolvingProducts}</Alert>}
        {productResolutionNotice && (
          <Alert severity={productResolutionNotice.severity}>
            {productResolutionNotice.text}
          </Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={FLEX_START_ALIGNMENT}>
          <Button
            component="label"
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.upload}
            <input
              hidden
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              type="file"
              onChange={(event) => {
                void handleFileChange(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </Button>
          {previewUrl && (
            <Button
              variant="text"
              onClick={handleRemovePhoto}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {copy.removePhoto}
            </Button>
          )}
          {previewUrl && <Chip label={copy.uploaded} color="success" variant="outlined" />}
          {isRecognizing && <Chip label={copy.recognizing} color="info" />}
        </Stack>

        {previewUrl && (
          <Box
            component="img"
            src={previewUrl}
            alt={copy.previewAlt}
            sx={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 1,
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          />
        )}

        {analysis && (
          <Paper
            className="sn-premium-panel"
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              borderColor: PHOTO_BORDER_SOFT_COLOR,
            }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                justifyContent="space-between"
              >
                <Stack spacing={0.7}>
                  <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
                    {copy.detected}
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>{analysis.dishName}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      label={t("mealType." + mealType)}
                      size="small"
                      variant="outlined"
                    />
                    {reviewLabel && (
                      <Chip
                        label={reviewLabel}
                        size="small"
                        color={reviewColor}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>

                <Stack spacing={0.8} alignItems={{ xs: FLEX_START_ALIGNMENT, md: "flex-end" }}>
                  <Typography variant="body2" color="text.secondary">
                    {copy.portions}:{" "}
                    {copy.portionsValue.replace(
                      "{value}",
                      analysis.estimatedPortions.toFixed(1)
                    )}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={portionSize}
                    onChange={handlePortionChange}
                    sx={{ flexWrap: "wrap" }}
                  >
                    <ToggleButton value="light">{copy.portionLight}</ToggleButton>
                    <ToggleButton value="regular">{copy.portionRegular}</ToggleButton>
                    <ToggleButton value="large">{copy.portionLarge}</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  borderColor: PHOTO_BORDER_SOFT_COLOR,
                  backgroundColor: "var(--sn-surface-elevated)",
                }}
                data-photo-review-status="draft-not-saved"
              >
                <Stack spacing={1.2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: FLEX_START_ALIGNMENT, sm: "center" }}
                  >
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontWeight: 800 }}>
                        {copy.reviewStatusTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {copy.reviewStatusBody}
                      </Typography>
                    </Stack>
                    <Chip
                      label={`${copy.selected}: ${selectedItemIndexes.length}/${analysis.items.length}`}
                      color={selectedItemIndexes.length > 0 ? "success" : "warning"}
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1,
                    }}
                  >
                    {[
                      {
                        title: copy.reviewStepIngredients,
                        body: copy.reviewStepIngredientsBody,
                      },
                      {
                        title: copy.reviewStepPortion,
                        body: copy.reviewStepPortionBody,
                      },
                      {
                        title: copy.reviewStepSave,
                        body: copy.reviewStepSaveBody,
                      },
                    ].map((step) => (
                      <Box
                        key={step.title}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          border: `1px solid ${PHOTO_BORDER_SOFT_COLOR}`,
                          minWidth: 0,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.body}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </Paper>

              {totals && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    borderColor: PHOTO_BORDER_SOFT_COLOR,
                    backgroundColor: "var(--sn-surface-elevated)",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 700 }}>{copy.macros}</Typography>
                    <Typography color="text.secondary">
                      {copy.itemCalories.replace("{value}", String(Math.round(totals.calories)))}
                    </Typography>
                    <Typography color="text.secondary">
                      {copy.itemMacros
                        .replace("{protein}", String(roundMacro(totals.protein)))
                        .replace("{fat}", String(roundMacro(totals.fat)))
                        .replace("{carbs}", String(roundMacro(totals.carbs)))}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {shouldShowPhotoInterpretationChoices(analysis) && (
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>{copy.matchOptions}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {analysis.interpretations?.slice(0, 3).map((interpretation, index) => (
                      <Button
                        key={interpretation.id}
                        size="small"
                        variant={index === 0 ? "contained" : "outlined"}
                        onClick={() => handleUseInterpretation(index)}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                      >
                        {index === 0
                          ? `${copy.detected} ${interpretation.title}`
                          : interpretation.title}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              )}

              {Array.isArray(analysis.uncertainIngredients) &&
                analysis.uncertainIngredients.length > 0 && (
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700 }}>{copy.uncertain}</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {analysis.uncertainIngredients.slice(0, 8).map((item) => (
                        <Chip key={item} label={item} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Stack>
                )}

              {hiddenIngredientQuestions.length > 0 && (
                  <Alert severity="warning">
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 800 }}>{copy.hiddenQuestions}</Typography>
                      {hiddenIngredientQuestions.map((question) => (
                        <Typography key={question} variant="body2">
                          • {question}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}

              {analysis.items.length === 0 && (
                <Alert severity="info">
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 800 }}>{copy.poorPhotoTitle}</Typography>
                    {copy.poorPhotoTips.map((tip) => (
                      <Typography key={tip} variant="body2">
                        • {tip}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              )}

              <Stack spacing={1.2}>
                <Typography sx={{ fontWeight: 700 }}>{copy.suggestions}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.replaceHint}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip
                    label={`${copy.selected}: ${selectedItemIndexes.length}/${analysis.items.length}`}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleNotThis}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                  >
                    {copy.notThis}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddMissingIngredient}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                  >
                    {copy.addMissing}
                  </Button>
                </Stack>
                {selectedItemIndexes.length === 0 ? (
                  <Alert severity="warning">{copy.selectedHint}</Alert>
                ) : null}
                {analysis.items.length === 0 ? (
                  <Alert severity="warning">{copy.empty}</Alert>
                ) : (
                  analysis.items.map((item, index) => (
                    <Paper
                      key={`${item.name}-${index}`}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 1 }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack direction="row" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                          <Checkbox
                            checked={selectedItemIndexes.includes(index)}
                            onChange={() => handleToggleSuggestion(index)}
                            sx={{ alignSelf: FLEX_START_ALIGNMENT, p: 0.5 }}
                          />
                          <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                            <TextField
                              size="small"
                              label={copy.itemName}
                              value={item.name}
                              onChange={(event) =>
                                handleSuggestionChange(index, {
                                  name: event.target.value.slice(0, 80),
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              size="small"
                              type="text"
                              label={copy.itemGrams}
                              value={
                                getQuantityDraftAt(quantityDrafts, index) ??
                                String(Math.round(item.quantityGrams))
                              }
                              slotProps={{
                                htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
                              }}
                              onFocus={(event) => selectInputValue(event.target)}
                              onClick={(event) => selectInputValue(event.currentTarget)}
                              onChange={(event) =>
                                handleSuggestionQuantityInputChange(
                                  index,
                                  event.target.value
                                )
                              }
                              onBlur={() => resetSuggestionQuantityDraft(index)}
                              sx={{ maxWidth: 180 }}
                            />
                          <Typography variant="body2" color="text.secondary">
                            {copy.grams.replace(
                              "{value}",
                              String(Math.round(item.quantityGrams))
                            )}{" "}
                            •{" "}
                            {copy.itemMacros
                              .replace(
                                "{protein}",
                                String(roundMacro((item.estimatedNutritionPer100g.protein * item.quantityGrams) / 100))
                              )
                              .replace(
                                "{fat}",
                                String(roundMacro((item.estimatedNutritionPer100g.fat * item.quantityGrams) / 100))
                              )
                              .replace(
                                "{carbs}",
                                String(roundMacro((item.estimatedNutritionPer100g.carbs * item.quantityGrams) / 100))
                              )}
                          </Typography>
                          </Stack>
                        </Stack>
                        <Stack spacing={0.5} alignItems={{ xs: FLEX_START_ALIGNMENT, sm: "flex-end" }}>
                          <Chip
                            label={copy.itemCalories.replace(
                              "{value}",
                              String(calculateSuggestionCalories(item))
                            )}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {item.portionRangeGrams && (
                            <Typography variant="body2" color="text.secondary">
                              {`${item.portionRangeGrams.min}-${item.portionRangeGrams.max} г`}
                            </Typography>
                          )}
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => handleRemoveSuggestion(index)}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            {copy.removeWrong}
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>

              <Button
                variant="contained"
                onClick={() => {
                  void handleAddDraft();
                }}
                disabled={
                  analysis.items.length === 0 ||
                  isResolvingProducts ||
                  isSavingAction("photo-draft-add")
                }
                sx={photoMealSaveButtonSx}
              >
                {copy.addDraft}
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};
