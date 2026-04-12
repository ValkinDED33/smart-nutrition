import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addMealEntries } from "./mealSlice";
import type { AppDispatch } from "../../app/store";
import type { MealEntry, MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import type { PhotoMealAnalysis, PhotoPortionSize } from "../../shared/types/photo";
import { analyzeMealPhoto, isCloudSyncActive } from "../../shared/api/auth";
import { searchLocalProducts } from "../../shared/lib/mockProducts";
import { createEmptyNutrients } from "../../shared/lib/nutrients";
import { createFreePhotoAnalysis } from "../../shared/lib/freePhotoAnalysis";
import type { RootState } from "../../app/store";
import {
  getPhotoPortionMultiplier,
  rescalePhotoMealAnalysis,
  scalePhotoMealAnalysis,
} from "../../shared/lib/photoDraft";
import { useLanguage } from "../../shared/language";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });

const createManualProduct = (
  name: string,
  imageUrl: string | null,
  nutrition: PhotoMealAnalysis["items"][number]["estimatedNutritionPer100g"]
): Product => ({
  id: createId("photo-product"),
  name,
  unit: "g",
  source: "Manual",
  imageUrl: imageUrl ?? undefined,
  nutrients: {
    ...createEmptyNutrients(),
    calories: nutrition.calories,
    protein: nutrition.protein,
    fat: nutrition.fat,
    carbs: nutrition.carbs,
  },
  facts: {
    foodGroup: "photo-estimate",
  },
});

type DraftPhotoItem = {
  id: string;
  product: Product;
  quantity: number;
  confidence: number;
  reason: string;
  alternatives: Product[];
  usesManualEstimate: boolean;
};

const portionCopy = {
  uk: {
    light: {
      label: "Легка",
      helper: "Невелика тарілка або порція-снек",
    },
    regular: {
      label: "Звична",
      helper: "Стандартна одиночна порція",
    },
    large: {
      label: "Велика",
      helper: "Ресторанна або подвоєна порція",
    },
  },
  pl: {
    light: {
      label: "Lekka",
      helper: "Mniejszy talerz albo porcja snackowa",
    },
    regular: {
      label: "Standardowa",
      helper: "Typowa pojedyncza porcja",
    },
    large: {
      label: "Duża",
      helper: "Porcja restauracyjna albo podwójna",
    },
  },
} as const satisfies Record<
  "uk" | "pl",
  Record<PhotoPortionSize, { label: string; helper: string }>
>;

const copyByLanguage = {
  uk: {
    title: "Фото-чернетка страви",
    subtitle:
      "Завантажте фото страви. Ця збірка зберігає зображення як візуальну підказку і готує низьковпевнену чернетку, яку ви перевіряєте вручну перед додаванням у щоденник.",
    choosePhoto: "Обрати фото",
    createDraft: "Створити чернетку",
    creatingDraft: "Створюю чернетку...",
    estimatedCalories: "Оцінені калорії",
    estimatedWeight: "Оцінена вага",
    portionHint: "Підказка по порції",
    mealPreview: "Прев'ю страви",
    draftDishName: "Назва чернетки страви",
    confidence: "Впевненість",
    portions: "Порцій",
    reviewedItems: "перевірених інгредієнтів",
    foodName: "Назва продукту",
    itemConfidence: "Точність позиції",
    manualEstimate: "Ручна оцінка",
    catalogMatch: "Збіг із каталогом",
    remove: "Прибрати",
    quantity: "Кількість (г)",
    entryCalories: "Калорії позиції",
    duplicate: "Дублювати",
    nutritionPer100g: "Харчова цінність на 100 г",
    kcal: "Ккал",
    protein: "Білок",
    fat: "Жир",
    carbs: "Вуглеводи",
    catalogMatches: "Збіги з каталогом",
    addMissingFood: "Додати відсутній продукт вручну",
    addToDiary: "Додати перевірені продукти в щоденник",
    manualItemName: "Ручна позиція",
    manualReason: "Додано вручну для корекції чернетки.",
    photoLoadError: "Фото не вдалося завантажити. Спробуйте інше зображення.",
    photoMissing: "Спершу оберіть фото страви.",
    remoteFallback:
      "Віддалена photo draft-нода недоступна. Замість неї створено безкоштовну локальну чернетку для ручової перевірки.",
    itemCount: (count: number) => `${count} перевірених позицій`,
  },
  pl: {
    title: "Szkic posiłku ze zdjęcia",
    subtitle:
      "Wgraj zdjęcie posiłku. Ta wersja traktuje obraz jako wizualny punkt odniesienia i przygotowuje szkic o niskiej pewności, który ręcznie sprawdzasz przed dodaniem do dziennika.",
    choosePhoto: "Wybierz zdjęcie",
    createDraft: "Utwórz szkic",
    creatingDraft: "Tworzę szkic...",
    estimatedCalories: "Szacowane kalorie",
    estimatedWeight: "Szacowana waga",
    portionHint: "Podpowiedź porcji",
    mealPreview: "Podgląd posiłku",
    draftDishName: "Nazwa szkicu dania",
    confidence: "Pewność",
    portions: "Porcje",
    reviewedItems: "sprawdzonych składników",
    foodName: "Nazwa produktu",
    itemConfidence: "Pewność pozycji",
    manualEstimate: "Ręczny szacunek",
    catalogMatch: "Dopasowanie z katalogu",
    remove: "Usuń",
    quantity: "Ilość (g)",
    entryCalories: "Kalorie pozycji",
    duplicate: "Duplikuj",
    nutritionPer100g: "Wartości odżywcze na 100 g",
    kcal: "Kcal",
    protein: "Białko",
    fat: "Tłuszcz",
    carbs: "Węglowodany",
    catalogMatches: "Dopasowania z katalogu",
    addMissingFood: "Dodaj brakujący produkt ręcznie",
    addToDiary: "Dodaj sprawdzone produkty do dziennika",
    manualItemName: "Pozycja ręczna",
    manualReason: "Dodano ręcznie, aby poprawić szkic.",
    photoLoadError: "Nie udało się wczytać zdjęcia. Spróbuj innego obrazu.",
    photoMissing: "Najpierw wybierz zdjęcie posiłku.",
    remoteFallback:
      "Zdalny draft zdjęcia jest niedostępny. Zamiast niego utworzono darmowy lokalny szkic do ręcznej korekty.",
    itemCount: (count: number) => `${count} sprawdzonych pozycji`,
  },
} as const;

type Props = {
  mealType: MealType;
};

export const PhotoMealAssistant = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
  }));
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const localizedPortionCopy = portionCopy[language];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoMealAnalysis | null>(null);
  const [draftItems, setDraftItems] = useState<DraftPhotoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portionSize, setPortionSize] = useState<PhotoPortionSize>("regular");

  const totalEstimatedCalories = useMemo(
    () =>
      draftItems.reduce(
        (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
        0
      ),
    [draftItems]
  );

  const totalEstimatedWeight = useMemo(
    () => draftItems.reduce((sum, item) => sum + item.quantity, 0),
    [draftItems]
  );

  const averageConfidence = useMemo(
    () =>
      draftItems.length > 0
        ? draftItems.reduce((sum, item) => sum + item.confidence, 0) / draftItems.length
        : analysis?.confidence ?? 0,
    [analysis?.confidence, draftItems]
  );

  const updateDraftItem = (id: string, updater: (item: DraftPhotoItem) => DraftPhotoItem) => {
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? updater(item) : item))
    );
  };

  const createDraftItem = (
    item: PhotoMealAnalysis["items"][number],
    imageUrl: string | null
  ): DraftPhotoItem => {
    const alternatives = searchLocalProducts(item.name, 3);
    const primaryProduct =
      alternatives[0] ??
      createManualProduct(item.name, imageUrl, item.estimatedNutritionPer100g);

    return {
      id: createId("photo-entry"),
      product: primaryProduct,
      quantity: item.quantityGrams,
      confidence: item.confidence,
      reason: item.reason,
      alternatives,
      usesManualEstimate: alternatives.length === 0,
    };
  };

  const createBlankDraftItem = (): DraftPhotoItem => ({
    id: createId("photo-entry"),
    product: createManualProduct(copy.manualItemName, previewUrl, {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    }),
    quantity: 100,
    confidence: 0.05,
    reason: copy.manualReason,
    alternatives: [],
    usesManualEstimate: true,
  });

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    setAnalysis(null);
    setDraftItems([]);

    try {
      const nextDataUrl = await readFileAsDataUrl(file);
      setImageDataUrl(nextDataUrl);
      setPreviewUrl(nextDataUrl);
    } catch {
      setError(copy.photoLoadError);
    }
  };

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      setError(copy.photoMissing);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fallbackResult = createFreePhotoAnalysis({
        mealType,
        preferences,
      });
      const result = isCloudSyncActive()
        ? (await analyzeMealPhoto(imageDataUrl, mealType)) ?? fallbackResult
        : fallbackResult;
      const scaledResult = scalePhotoMealAnalysis(result, portionSize);

      if (isCloudSyncActive() && result === fallbackResult) {
        setError(copy.remoteFallback);
      }

      setAnalysis(scaledResult);
      setDraftItems(scaledResult.items.map((item) => createDraftItem(item, previewUrl)));
    } finally {
      setLoading(false);
    }
  };

  const handlePortionSizeChange = (nextSize: PhotoPortionSize) => {
    if (nextSize === portionSize) {
      return;
    }

    const ratio =
      getPhotoPortionMultiplier(nextSize) / getPhotoPortionMultiplier(portionSize);

    setPortionSize(nextSize);

    if (analysis) {
      setAnalysis(rescalePhotoMealAnalysis(analysis, portionSize, nextSize));
      setDraftItems((current) =>
        current.map((item) => ({
          ...item,
          quantity: Math.max(Math.round((item.quantity * ratio) / 5) * 5, 5),
        }))
      );
    }
  };

  const handleAddToDiary = () => {
    const entries: MealEntry[] = draftItems.map((item) => ({
      id: createId("meal"),
      product: item.product,
      quantity: item.quantity,
      mealType,
      eatenAt: new Date().toISOString(),
      origin: "manual",
    }));

    if (entries.length === 0) {
      return;
    }

    dispatch(addMealEntries(entries));
    setAnalysis(null);
    setDraftItems([]);
    setError(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
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

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Button
            component="label"
            variant="outlined"
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
          >
            {copy.choosePhoto}
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={(event) => {
                void handleFileChange(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </Button>
          <Button
            variant="contained"
            disabled={!imageDataUrl || loading}
            onClick={() => {
              void handleAnalyze();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {loading ? copy.creatingDraft : copy.createDraft}
          </Button>
          {analysis && (
            <>
              <Chip
                label={`${copy.estimatedCalories}: ${totalEstimatedCalories.toFixed(0)} kcal`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`${copy.estimatedWeight}: ${totalEstimatedWeight.toFixed(0)} g`}
                variant="outlined"
              />
            </>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.portionHint}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {(Object.keys(localizedPortionCopy) as PhotoPortionSize[]).map((size) => (
              <Chip
                key={size}
                clickable
                color={portionSize === size ? "primary" : "default"}
                variant={portionSize === size ? "filled" : "outlined"}
                label={`${localizedPortionCopy[size].label}: ${localizedPortionCopy[size].helper}`}
                onClick={() => handlePortionSizeChange(size)}
              />
            ))}
          </Stack>
        </Stack>

        {previewUrl && (
          <Box
            component="img"
            src={previewUrl}
            alt={copy.mealPreview}
            sx={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          />
        )}

        {analysis && (
          <Stack spacing={1.5}>
            <TextField
              label={copy.draftDishName}
              value={analysis.dishName}
              onChange={(event) => {
                const nextDishName = event.target.value;
                setAnalysis((current) =>
                  current ? { ...current, dishName: nextDishName } : current
                );
              }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={analysis.dishName} />
              <Chip
                label={`${copy.confidence} ${(averageConfidence * 100).toFixed(0)}%`}
                color={analysis.confidence >= 0.75 ? "success" : "warning"}
              />
              <Chip label={`${copy.portions} ${analysis.estimatedPortions.toFixed(1)}`} />
              <Chip label={copy.itemCount(draftItems.length)} />
            </Stack>
            <Typography color="text.secondary">{analysis.summary}</Typography>
            {analysis.cautions.length > 0 && (
              <Alert severity={analysis.manualReviewRequired ? "warning" : "info"}>
                {analysis.cautions.join(" ")}
              </Alert>
            )}

            {draftItems.map((item, index) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={1.2}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                  >
                    <Stack spacing={0.7}>
                      <TextField
                        label={copy.foodName}
                        value={item.product.name}
                        onChange={(event) => {
                          const nextName = event.target.value;
                          updateDraftItem(item.id, (draftItem) => {
                            const alternatives = searchLocalProducts(nextName, 3);
                            return {
                              ...draftItem,
                              product: {
                                ...draftItem.product,
                                name: nextName,
                              },
                              alternatives,
                              usesManualEstimate: alternatives.length === 0,
                            };
                          });
                        }}
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip
                          size="small"
                          label={`${copy.itemConfidence} ${(item.confidence * 100).toFixed(0)}%`}
                          color={item.confidence >= 0.75 ? "success" : "warning"}
                        />
                        <Chip
                          size="small"
                          label={
                            item.usesManualEstimate
                              ? copy.manualEstimate
                              : copy.catalogMatch
                          }
                        />
                      </Stack>
                    </Stack>

                    <Button
                      color="error"
                      variant="text"
                      onClick={() => {
                        setDraftItems((current) =>
                          current.filter((draftItem) => draftItem.id !== item.id)
                        );
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none" }}
                    >
                      {copy.remove}
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {item.reason}
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                    <TextField
                      type="number"
                      label={copy.quantity}
                      value={item.quantity}
                      onChange={(event) => {
                        const nextQuantity = Number(event.target.value) || 0;
                        updateDraftItem(item.id, (draftItem) => ({
                          ...draftItem,
                          quantity: nextQuantity > 0 ? nextQuantity : draftItem.quantity,
                        }));
                      }}
                      inputProps={{ min: 1, step: 5 }}
                    />
                    <Chip
                      label={`${copy.entryCalories} ${(
                        (item.product.nutrients.calories * item.quantity) /
                        100
                      ).toFixed(0)} kcal`}
                      variant="outlined"
                      sx={{ alignSelf: "center" }}
                    />
                    <Button
                      variant="outlined"
                      sx={{ alignSelf: "flex-start", textTransform: "none" }}
                      onClick={() => {
                        setDraftItems((current) => {
                          const currentItem = current[index];

                          if (!currentItem) {
                            return current;
                          }

                          const duplicateItem: DraftPhotoItem = {
                            ...currentItem,
                            id: createId("photo-entry"),
                            product: {
                              ...currentItem.product,
                              nutrients: {
                                ...currentItem.product.nutrients,
                              },
                            },
                            alternatives: [...currentItem.alternatives],
                          };

                          return [
                            ...current.slice(0, index + 1),
                            duplicateItem,
                            ...current.slice(index + 1),
                          ];
                        });
                      }}
                    >
                      {copy.duplicate}
                    </Button>
                  </Stack>

                  <Divider />

                  <Typography sx={{ fontWeight: 700 }}>{copy.nutritionPer100g}</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.2,
                    }}
                  >
                    {[
                      { key: "calories", label: copy.kcal, step: 1 },
                      { key: "protein", label: copy.protein, step: 0.5 },
                      { key: "fat", label: copy.fat, step: 0.5 },
                      { key: "carbs", label: copy.carbs, step: 0.5 },
                    ].map((field) => (
                      <TextField
                        key={`${item.id}-${field.key}`}
                        type="number"
                        label={field.label}
                        value={item.product.nutrients[field.key]}
                        onChange={(event) => {
                          const nextValue = Math.max(Number(event.target.value) || 0, 0);
                          updateDraftItem(item.id, (draftItem) => ({
                            ...draftItem,
                            usesManualEstimate: true,
                            product: {
                              ...draftItem.product,
                              nutrients: {
                                ...draftItem.product.nutrients,
                                [field.key]: nextValue,
                              },
                            },
                          }));
                        }}
                        inputProps={{ min: 0, step: field.step }}
                      />
                    ))}
                  </Box>

                  {item.alternatives.length > 1 && (
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700 }}>{copy.catalogMatches}</Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {item.alternatives.map((alternative) => (
                          <Chip
                            key={`${item.id}-${alternative.id}`}
                            clickable
                            label={alternative.name}
                            variant={
                              alternative.id === item.product.id ? "filled" : "outlined"
                            }
                            onClick={() => {
                              updateDraftItem(item.id, (draftItem) => ({
                                ...draftItem,
                                product: alternative,
                                usesManualEstimate: false,
                              }));
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            ))}

            <Button
              variant="outlined"
              onClick={() => {
                setDraftItems((current) => [...current, createBlankDraftItem()]);
              }}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
            >
              {copy.addMissingFood}
            </Button>

            <Button
              variant="contained"
              disabled={draftItems.length === 0}
              onClick={handleAddToDiary}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {copy.addToDiary}
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
