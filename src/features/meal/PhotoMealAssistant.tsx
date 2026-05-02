import { useMemo, useState, type MouseEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { createFreePhotoAnalysis } from "../../shared/lib/freePhotoAnalysis";
import { createEmptyNutrients } from "../../shared/lib/nutrients";
import {
  rescalePhotoMealAnalysis,
  scalePhotoMealAnalysis,
} from "../../shared/lib/photoDraft";
import type { MealEntry, MealType } from "../../shared/types/meal";
import type {
  PhotoMealAnalysis,
  PhotoMealSuggestion,
  PhotoPortionSize,
} from "../../shared/types/photo";
import type { Product } from "../../shared/types/product";
import { addMealEntries } from "./mealSlice";

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

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = src;
  });

const resizePhotoDataUrl = async (dataUrl: string) => {
  if (typeof document === "undefined") {
    return dataUrl;
  }

  const image = await loadImage(dataUrl);
  const scale = Math.min(
    1,
    maxPhotoPreviewSide / Math.max(image.naturalWidth, image.naturalHeight, 1)
  );
  const width = Math.max(Math.round(image.naturalWidth * scale), 1);
  const height = Math.max(Math.round(image.naturalHeight * scale), 1);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return dataUrl;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.86);
};

const readPhotoFileAsDataUrl = async (file: File) => {
  if (!supportedPhotoTypes.has(file.type)) {
    throw new Error("UNSUPPORTED_PHOTO_TYPE");
  }

  if (file.size > maxRawPhotoBytes) {
    throw new Error("PHOTO_TOO_LARGE");
  }

  const dataUrl = await readFileAsDataUrl(file);
  return resizePhotoDataUrl(dataUrl);
};

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const roundMacro = (value: number) => Math.round(value * 10) / 10;

const calculateSuggestionCalories = (suggestion: PhotoMealSuggestion) =>
  Math.round(
    (suggestion.estimatedNutritionPer100g.calories * suggestion.quantityGrams) / 100
  );

const createPhotoProduct = (
  suggestion: PhotoMealSuggestion,
  previewUrl: string | null
): Product => {
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
  previewUrl: string | null
): MealEntry[] => {
  const eatenAt = new Date().toISOString();

  return analysis.items.map((suggestion) => ({
    id: createId("photo-entry"),
    product: createPhotoProduct(suggestion, previewUrl),
    quantity: Math.max(Math.round(suggestion.quantityGrams), 5),
    mealType,
    eatenAt,
    origin: "manual",
  }));
};

const photoCopy = {
  uk: {
    title: "Фото страви",
    subtitle:
      "Завантажте фото файлом. Система спробує підготувати чернетку складу, а ви перед збереженням швидко перевірите інгредієнти.",
    upload: "Завантажити фото страви",
    uploaded: "Фото завантажено",
    recognizing: "Аналізуємо фото...",
    readError: "Не вдалося прочитати фото. Спробуйте інший файл.",
    invalidType: "Підтримуються JPG, PNG або WebP.",
    tooLarge: "Фото завелике. Оберіть файл до 12 MB.",
    analysisError:
      "Не вдалося підготувати підказки для цього фото. Нижче можна додати страву вручну.",
    manualFallback:
      "Хмарний аналіз недоступний, тому ми підготували локальну чернетку за типом прийому їжі та вашими вподобаннями.",
    cloudDraft:
      "Чернетка готова. Перевірте склад, порцію і лише потім додавайте записи в щоденник.",
    previewAlt: "Прев'ю фото страви",
    removePhoto: "Прибрати фото",
    detected: "Чернетка розпізнавання",
    portions: "Порція",
    portionLight: "Легка",
    portionRegular: "Стандарт",
    portionLarge: "Велика",
    portionsValue: "{value} порції",
    confidence: "Впевненість",
    manualReview: "Потрібна ручна перевірка",
    macros: "Орієнтовні макро за фото",
    suggestions: "Що додамо в щоденник",
    selected: "Обрано",
    itemName: "Назва",
    itemGrams: "Грами",
    empty: "Підказки не сформувалися. Скористайтеся ручним додаванням нижче.",
    nothingSelected: "Оберіть хоча б один пункт із чернетки.",
    addDraft: "Додати всі підказки",
    added: "Чернетку додано до щоденника.",
    itemCalories: "{value} ккал",
    itemMacros: "Б {protein} г • Ж {fat} г • В {carbs} г",
    grams: "{value} г",
  },
  pl: {
    title: "Zdjęcie posiłku",
    subtitle:
      "Wgraj zdjęcie plikiem. System spróbuje przygotować roboczą listę składników, a Ty szybko sprawdzisz ją przed zapisaniem.",
    upload: "Wgraj zdjęcie posiłku",
    uploaded: "Zdjęcie wgrane",
    recognizing: "Analizujemy zdjęcie...",
    readError: "Nie udało się odczytać zdjęcia. Spróbuj innego pliku.",
    invalidType: "Obsługiwane są JPG, PNG albo WebP.",
    tooLarge: "Zdjęcie jest za duże. Wybierz plik do 12 MB.",
    analysisError:
      "Nie udało się przygotować podpowiedzi dla tego zdjęcia. Niżej możesz dodać posiłek ręcznie.",
    manualFallback:
      "Analiza chmurowa jest teraz niedostępna, więc przygotowaliśmy lokalny szkic na podstawie typu posiłku i Twoich preferencji.",
    cloudDraft:
      "Szkic jest gotowy. Sprawdź skład, porcję i dopiero wtedy dodaj wpisy do dziennika.",
    previewAlt: "Podgląd zdjęcia posiłku",
    removePhoto: "Usuń zdjęcie",
    detected: "Szkic rozpoznania",
    portions: "Porcja",
    portionLight: "Lekka",
    portionRegular: "Standard",
    portionLarge: "Duża",
    portionsValue: "{value} porcji",
    confidence: "Pewność",
    manualReview: "Wymaga ręcznego sprawdzenia",
    macros: "Szacowane makro ze zdjęcia",
    suggestions: "Co trafi do dziennika",
    selected: "Wybrane",
    itemName: "Nazwa",
    itemGrams: "Gramy",
    empty: "Nie udało się zbudować podpowiedzi. Skorzystaj z ręcznego dodawania poniżej.",
    nothingSelected: "Wybierz przynajmniej jedną pozycję ze szkicu.",
    addDraft: "Dodaj wszystkie podpowiedzi",
    added: "Szkic został dodany do dziennika.",
    itemCalories: "{value} kcal",
    itemMacros: "B {protein} g • T {fat} g • W {carbs} g",
    grams: "{value} g",
  },
} as const;

type Props = {
  mealType: MealType;
};

export const PhotoMealAssistant = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const profilePreferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
  }));
  const { language, t } = useLanguage();
  const copy = photoCopy[language];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoMealAnalysis | null>(null);
  const [portionSize, setPortionSize] = useState<PhotoPortionSize>("regular");
  const [analysisMode, setAnalysisMode] = useState<"cloud" | "local-draft" | null>(null);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState<number[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    setFeedback(null);
    setAnalysis(null);
    setAnalysisMode(null);

    try {
      const dataUrl = await readPhotoFileAsDataUrl(file);

      setPreviewUrl(dataUrl);
      setIsRecognizing(true);

      try {
        const remoteAnalysis = await analyzeMealPhoto(dataUrl, mealType);
        const nextMode = remoteAnalysis ? "cloud" : "local-draft";
        const nextAnalysis = scalePhotoMealAnalysis(
          remoteAnalysis ??
            createFreePhotoAnalysis({
              mealType,
              preferences: profilePreferences,
            }),
          "regular"
        );

        setPortionSize("regular");
        setAnalysis(nextAnalysis);
        setSelectedItemIndexes(nextAnalysis.items.map((_, index) => index));
        setAnalysisMode(nextMode);
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
    setError(null);
    setFeedback(null);
  };

  const handlePortionChange = (_: MouseEvent<HTMLElement>, value: PhotoPortionSize | null) => {
    if (!value || !analysis || value === portionSize) {
      return;
    }

    setAnalysis(rescalePhotoMealAnalysis(analysis, portionSize, value));
    setPortionSize(value);
  };

  const handleToggleSuggestion = (index: number) => {
    setSelectedItemIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index].sort((left, right) => left - right)
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

  const handleAddDraft = () => {
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

    const entries = createDraftEntries(
      {
        ...analysis,
        items: selectedItems,
      },
      mealType,
      previewUrl
    );

    if (entries.length === 0) {
      setError(copy.analysisError);
      return;
    }

    dispatch(addMealEntries(entries));
    setFeedback(copy.added);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.8}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}
        {feedback && <Alert severity="success">{feedback}</Alert>}
        {analysisMode === "local-draft" && !error && analysis && (
          <Alert severity="info">{copy.manualFallback}</Alert>
        )}
        {analysisMode === "cloud" && !error && analysis && (
          <Alert severity="success">{copy.cloudDraft}</Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="flex-start">
          <Button
            component="label"
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.upload}
            <input
              hidden
              accept="image/jpeg,image/png,image/webp"
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
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              borderColor: "rgba(15, 23, 42, 0.08)",
              background:
                "linear-gradient(180deg, rgba(240,249,255,0.92) 0%, rgba(255,255,255,0.94) 100%)",
            }}
          >
            <Stack spacing={2}>
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
                      label={`${copy.confidence}: ${(analysis.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={t("mealType." + mealType)}
                      size="small"
                      variant="outlined"
                    />
                    {analysis.manualReviewRequired && (
                      <Chip
                        label={copy.manualReview}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>

                <Stack spacing={0.8} alignItems={{ xs: "flex-start", md: "flex-end" }}>
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

              {totals && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    borderColor: "rgba(15, 23, 42, 0.06)",
                    backgroundColor: "rgba(255,255,255,0.8)",
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

              <Stack spacing={1.2}>
                <Typography sx={{ fontWeight: 700 }}>{copy.suggestions}</Typography>
                <Chip
                  label={`${copy.selected}: ${selectedItemIndexes.length}/${analysis.items.length}`}
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                />
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
                            sx={{ alignSelf: "flex-start", p: 0.5 }}
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
                              type="number"
                              label={copy.itemGrams}
                              value={Math.round(item.quantityGrams)}
                              inputProps={{ min: 5, step: 5 }}
                              onChange={(event) =>
                                handleSuggestionChange(index, {
                                  quantityGrams: Number(event.target.value),
                                })
                              }
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
                        <Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                          <Chip
                            label={copy.itemCalories.replace(
                              "{value}",
                              String(calculateSuggestionCalories(item))
                            )}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {`${copy.confidence}: ${(item.confidence * 100).toFixed(0)}%`}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>

              <Button
                variant="contained"
                onClick={handleAddDraft}
                disabled={analysis.items.length === 0}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                }}
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
