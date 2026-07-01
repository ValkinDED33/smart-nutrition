import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { publishCommunityPost } from "../community/communitySlice";
import { recipes } from "@domain/meal/recipes";
import type {
  MealEntry,
  MealTemplate,
  MealTemplateItem,
  MealType,
  Recipe,
} from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import type { AppDispatch } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import {
  productMatchesPreferences,
  recipeMatchesPreferences,
} from "@domain/user/preferences";
import { searchProducts } from "../../shared/api/products";
import { calculateMealTotalNutrients } from "./mealSlice";
import {
  addMealEntriesToCloud,
  applyMealTemplateInCloud,
  deleteMealTemplateFromCloud,
  saveMealTemplateToCloud,
} from "./mealCloudSync";
import { selectMealTemplates } from "./selectors";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { createTemplateEntries } from "./mealSaveModel";

interface Props {
  mealType: MealType;
}

type BuilderItem = Omit<MealTemplateItem, "quantity"> & {
  quantity: number | "";
};

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `recipe-meal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CUSTOM_RECIPE_PREFIX = "Recipe: ";

export const RecipeSection = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, t } = useLanguage();
  const templates = useSelector(selectMealTemplates);
  const meal = useSelector((state: RootState) => state.meal);
  const user = useSelector((state: RootState) => state.auth.user);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const [recipeName, setRecipeName] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const deferredIngredientQuery = useDeferredValue(ingredientQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([]);
  const [mealSaveError, setMealSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!deferredIngredientQuery.trim()) {
      return () => {
        isActive = false;
      };
    }

    void searchProducts(deferredIngredientQuery)
      .then((results) => {
        if (!isActive) {
          return;
        }

        startTransition(() => {
          setSearchResults(
            results.filter((product) => productMatchesPreferences(product, preferences))
          );
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        startTransition(() => {
          setSearchResults([]);
        });
      });

    return () => {
      isActive = false;
    };
  }, [deferredIngredientQuery, preferences]);

  const filteredRecipes = recipes.filter(
    (recipe) => recipe.mealType === mealType && recipeMatchesPreferences(recipe, preferences)
  );
  const displayedSearchResults = deferredIngredientQuery.trim() ? searchResults : [];
  const searchPending =
    ingredientQuery.trim().length > 0 &&
    ingredientQuery.trim() !== deferredIngredientQuery.trim();
  const customRecipes = useMemo<Recipe[]>(
    () =>
      templates
        .filter(
          (template) =>
            template.mealType === mealType &&
            template.name.startsWith(CUSTOM_RECIPE_PREFIX) &&
            template.items.every((item) => productMatchesPreferences(item.product, preferences))
        )
        .map((template) => {
          const nutrients = calculateMealTotalNutrients(
            template.items.map((item) => ({
              id: template.id,
              product: item.product,
              quantity: item.quantity,
              mealType: template.mealType,
              eatenAt: template.createdAt,
              origin: "recipe" as const,
            }))
          );

          return {
            id: template.id,
            title: template.name.replace(CUSTOM_RECIPE_PREFIX, ""),
            mealType: template.mealType,
            description: "Custom recipe built from your own ingredients.",
            ingredients: template.items,
            steps: [],
            calories: nutrients.calories,
            protein: nutrients.protein,
            fat: nutrients.fat,
            carbs: nutrients.carbs,
          };
        }),
    [mealType, preferences, templates]
  );
  const validBuilderItems = useMemo<MealTemplateItem[]>(
    () =>
      builderItems
        .filter((item): item is MealTemplateItem =>
          typeof item.quantity === "number" && item.quantity > 0
        )
        .map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
    [builderItems]
  );
  const builderNutrients = useMemo(
    () =>
      calculateMealTotalNutrients(
        validBuilderItems.map((item) => ({
          id: createEntryId(),
          product: item.product,
          quantity: item.quantity,
          mealType,
          eatenAt: new Date().toISOString(),
          origin: "recipe" as const,
        }))
      ),
    [mealType, validBuilderItems]
  );

  const handleAddRecipe = async (recipeId: string) => {
    const recipe =
      recipes.find((item) => item.id === recipeId) ??
      customRecipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    const eatenAt = new Date().toISOString();
    const entries: MealEntry[] = recipe.ingredients.map((ingredient) => ({
      id: createEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType: recipe.mealType,
      eatenAt,
      origin: "recipe",
    }));

    setMealSaveError(null);

    try {
      await addMealEntriesToCloud(dispatch, meal, entries);
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  const handleAddBuilderIngredient = (product: Product) => {
    setBuilderItems((current) => {
      const existingItem = current.find((item) => item.product.id === product.id);

      if (existingItem) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  typeof item.quantity === "number" ? item.quantity + 100 : 100,
              }
            : item
        );
      }

      return [...current, { product, quantity: 100 }];
    });
    setIngredientQuery("");
    setSearchResults([]);
  };

  const handleSaveBuilderRecipe = async () => {
    const normalizedName = recipeName.trim();

    if (!normalizedName || validBuilderItems.length === 0) {
      return;
    }

    const template: MealTemplate = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `${CUSTOM_RECIPE_PREFIX}${normalizedName}`,
      mealType,
      items: validBuilderItems,
      createdAt: new Date().toISOString(),
    };

    setMealSaveError(null);

    try {
      await saveMealTemplateToCloud(dispatch, meal, template);
      setRecipeName("");
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  const handleReuseTemplateRecipe = async (recipeId: string) => {
    const template = templates.find((item) => item.id === recipeId);
    if (!template) return;

    setMealSaveError(null);

    try {
      await applyMealTemplateInCloud(
        dispatch,
        meal,
        recipeId,
        createTemplateEntries(template)
      );
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  const handleDeleteTemplateRecipe = async (recipeId: string) => {
    setMealSaveError(null);

    try {
      await deleteMealTemplateFromCloud(dispatch, meal, recipeId);
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  const handleAddBuilderNow = async () => {
    if (validBuilderItems.length === 0) {
      return;
    }

    const entries: MealEntry[] = validBuilderItems.map((ingredient) => ({
      id: createEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType,
      eatenAt: new Date().toISOString(),
      origin: "recipe",
    }));

    setMealSaveError(null);

    try {
      await addMealEntriesToCloud(dispatch, meal, entries);
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  const handlePublishRecipe = (recipe: Recipe) => {
    if (!user) {
      return;
    }

    dispatch(
      publishCommunityPost({
        type: "recipe",
        title: recipe.title,
        body:
          recipe.description ||
          `Recipe with ${recipe.ingredients.length} ingredients and ${recipe.calories.toFixed(
            0
          )} ${t("common.kcal")}.`,
        authorId: user.id,
        authorName: user.name,
        ingredients: recipe.ingredients.map((ingredient) =>
          getProductDisplayName(ingredient.product, appLanguage)
        ),
      })
    );
  };

  const allRecipes = [...customRecipes, ...filteredRecipes];

  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
        {t("recipes.title")}
      </Typography>
      {mealSaveError ? (
        <Alert severity="error" onClose={() => setMealSaveError(null)}>
          {mealSaveError}
        </Alert>
      ) : null}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          backgroundColor: "var(--sn-surface-glass)",
        }}
      >
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 800 }}>Custom recipe builder</Typography>
          <Typography color="text.secondary">
            Build a reusable recipe from ingredients, check the calculated macros, add it now,
            and save it for later as your own recipe.
          </Typography>

          <TextField
            fullWidth
            label="Recipe name"
            value={recipeName}
            onChange={(event) => setRecipeName(event.target.value)}
          />

          <TextField
            fullWidth
            label="Search ingredient"
            value={ingredientQuery}
            onChange={(event) => setIngredientQuery(event.target.value)}
            helperText={
              searchPending
                ? "Searching..."
                : "Type a product, restaurant item, or home dish"
            }
          />

          {displayedSearchResults.length > 0 && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {displayedSearchResults.slice(0, 8).map((product) => (
                <Chip
                  key={product.id}
                  clickable
                  label={getProductDisplayName(product, appLanguage)}
                  onClick={() => handleAddBuilderIngredient(product)}
                />
              ))}
            </Stack>
          )}

          {builderItems.length > 0 && (
            <Stack spacing={1.2}>
              {builderItems.map((item) => (
                <Paper key={item.product.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.2}
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Typography sx={{ flex: 1, fontWeight: 700 }}>
                      {getProductDisplayName(item.product, appLanguage)}
                    </Typography>
                    <TextField
                      type="text"
                      label="Qty"
                      value={item.quantity}
                      slotProps={{
                        htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
                      }}
                      onFocus={(event) => selectInputValue(event.target)}
                      onClick={(event) => selectInputValue(event.currentTarget)}
                      onChange={(event) => {
                        const value = event.target.value;
                        const parsedValue = Number(value);
                        const nextQuantity =
                          value === "" || !Number.isFinite(parsedValue)
                            ? ""
                            : Math.max(0, parsedValue);
                        setBuilderItems((current) =>
                          current.map((currentItem) =>
                            currentItem.product.id === item.product.id
                              ? { ...currentItem, quantity: nextQuantity }
                              : currentItem
                          )
                        );
                      }}
                      sx={{ width: { xs: "100%", md: 150 } }}
                    />
                    <Button
                      color="error"
                      onClick={() => {
                        setBuilderItems((current) =>
                          current.filter((currentItem) => currentItem.product.id !== item.product.id)
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Paper>
              ))}

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${builderNutrients.calories.toFixed(0)} ${t("common.kcal")}`} />
                <Chip label={`P ${builderNutrients.protein.toFixed(1)} ${t("common.g")}`} />
                <Chip label={`F ${builderNutrients.fat.toFixed(1)} ${t("common.g")}`} />
                <Chip label={`C ${builderNutrients.carbs.toFixed(1)} ${t("common.g")}`} />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    void handleAddBuilderNow();
                  }}
                  disabled={validBuilderItems.length === 0}
                >
                  Add recipe now
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => void handleSaveBuilderRecipe()}
                  disabled={!recipeName.trim() || validBuilderItems.length === 0}
                >
                  Save as reusable recipe
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Divider />

      {allRecipes.map((recipe) => (
        <Card
          key={recipe.id}
          sx={{
            borderRadius: 1,
            border: "1px solid var(--sn-border-soft)",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${recipe.calories} ${t("common.kcal")}`} />
                <Chip label={`P ${recipe.protein.toFixed(1)} ${t("common.g")}`} />
                <Chip label={`F ${recipe.fat.toFixed(1)} ${t("common.g")}`} />
                <Chip label={`C ${recipe.carbs.toFixed(1)} ${t("common.g")}`} />
              </Stack>
              <Typography component="h3" variant="h6" sx={{ fontWeight: 800 }}>
                {recipe.title}
              </Typography>
              <Typography color="text.secondary">{recipe.description}</Typography>
              <Typography variant="body2">
                {t("recipes.ingredients")}:{" "}
                {recipe.ingredients
                  .map(
                    (ingredient) =>
                      `${getProductDisplayName(ingredient.product, appLanguage)} ${ingredient.quantity} ${ingredient.product.unit}`
                  )
                  .join(", ")}
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  void handleAddRecipe(recipe.id);
                }}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("recipes.add")}
              </Button>
              {customRecipes.some((item) => item.id === recipe.id) && (
                <Stack direction="row" spacing={1}>
                  <Button onClick={() => void handleReuseTemplateRecipe(recipe.id)}>
                    Reuse
                  </Button>
                  <Button onClick={() => handlePublishRecipe(recipe)} disabled={!user}>
                    Publish recipe
                  </Button>
                  <Button
                    color="error"
                    onClick={() => void handleDeleteTemplateRecipe(recipe.id)}
                  >
                    Remove
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
