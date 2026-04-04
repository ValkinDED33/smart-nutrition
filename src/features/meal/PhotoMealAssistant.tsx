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

const portionCopy: Record<PhotoPortionSize, { label: string; helper: string }> = {
  light: {
    label: "Light",
    helper: "Smaller plate or snack-size serving",
  },
  regular: {
    label: "Regular",
    helper: "Most standard single-meal portions",
  },
  large: {
    label: "Large",
    helper: "Restaurant-size or double-side serving",
  },
};

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
    product: createManualProduct("Manual item", previewUrl, {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    }),
    quantity: 100,
    confidence: 0.05,
    reason: "Added manually to correct the draft.",
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
      setError("The photo could not be loaded. Try another image.");
    }
  };

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      setError("Choose a meal photo first.");
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
        setError(
          "Remote photo draft is unavailable. A free local review draft was created instead."
        );
      }

      setAnalysis(scaledResult);
      setDraftItems(
        scaledResult.items.map((item) => createDraftItem(item, previewUrl))
      );
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
            Photo meal draft
          </Typography>
          <Typography color="text.secondary">
            Upload a meal photo. This build keeps the image as a visual reference and prepares
            a low-confidence draft that you review manually before adding it to your diary.
          </Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Button
            component="label"
            variant="outlined"
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
          >
            Choose photo
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
            {loading ? "Creating draft..." : "Create draft"}
          </Button>
          {analysis && (
            <>
              <Chip
                label={`Estimated calories: ${totalEstimatedCalories.toFixed(0)} kcal`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Estimated weight: ${totalEstimatedWeight.toFixed(0)} g`}
                variant="outlined"
              />
            </>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>Portion hint</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {(Object.keys(portionCopy) as PhotoPortionSize[]).map((size) => (
              <Chip
                key={size}
                clickable
                color={portionSize === size ? "primary" : "default"}
                variant={portionSize === size ? "filled" : "outlined"}
                label={`${portionCopy[size].label}: ${portionCopy[size].helper}`}
                onClick={() => handlePortionSizeChange(size)}
              />
            ))}
          </Stack>
        </Stack>

        {previewUrl && (
          <Box
            component="img"
            src={previewUrl}
            alt="Meal preview"
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
              label="Draft dish name"
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
                label={`Confidence ${(averageConfidence * 100).toFixed(0)}%`}
                color={analysis.confidence >= 0.75 ? "success" : "warning"}
              />
              <Chip label={`Portions ${analysis.estimatedPortions.toFixed(1)}`} />
              <Chip label={`${draftItems.length} reviewed items`} />
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
                          label="Food name"
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
                          label={`Item ${(item.confidence * 100).toFixed(0)}%`}
                          color={item.confidence >= 0.75 ? "success" : "warning"}
                        />
                        <Chip
                          size="small"
                          label={item.usesManualEstimate ? "Manual estimate" : "Catalog match"}
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
                      Remove
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {item.reason}
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                    <TextField
                      type="number"
                      label="Quantity (g)"
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
                      label={`Entry ${(item.product.nutrients.calories * item.quantity / 100).toFixed(0)} kcal`}
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
                      Duplicate
                    </Button>
                  </Stack>

                  <Divider />

                  <Typography sx={{ fontWeight: 700 }}>Nutrition per 100 g</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.2,
                    }}
                  >
                    {[
                      { key: "calories", label: "Kcal", step: 1 },
                      { key: "protein", label: "Protein", step: 0.5 },
                      { key: "fat", label: "Fat", step: 0.5 },
                      { key: "carbs", label: "Carbs", step: 0.5 },
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
                      <Typography sx={{ fontWeight: 700 }}>Catalog matches</Typography>
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
              Add missing food manually
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
              Add reviewed foods to diary
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
