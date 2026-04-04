import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
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
import {
  addMealEntries,
  applyMealTemplate,
  deleteMealTemplate,
  saveMealTemplate,
} from "./mealSlice";
import { recipes } from "../../shared/lib/recipes";
import type {
  MealEntry,
  MealTemplateItem,
  MealType,
  Recipe,
} from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import type { AppDispatch } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import {
  productMatchesPreferences,
  recipeMatchesPreferences,
} from "../../shared/lib/preferences";
import { searchProducts } from "../../shared/api/products";
import { calculateMealTotalNutrients } from "./mealSlice";
import { selectMealTemplates } from "./selectors";

interface Props {
  mealType: MealType;
}

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `recipe-meal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CUSTOM_RECIPE_PREFIX = "Recipe: ";

export const RecipeSection = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { language, t } = useLanguage();
  const templates = useSelector(selectMealTemplates);
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
  const [builderItems, setBuilderItems] = useState<MealTemplateItem[]>([]);

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
  const builderNutrients = useMemo(
    () =>
      calculateMealTotalNutrients(
        builderItems.map((item) => ({
          id: createEntryId(),
          product: item.product,
          quantity: item.quantity,
          mealType,
          eatenAt: new Date().toISOString(),
          origin: "recipe" as const,
        }))
      ),
    [builderItems, mealType]
  );

  const handleAddRecipe = (recipeId: string) => {
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

    dispatch(addMealEntries(entries));
  };

  const handleAddBuilderIngredient = (product: Product) => {
    setBuilderItems((current) => {
      const existingItem = current.find((item) => item.product.id === product.id);

      if (existingItem) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 100 }
            : item
        );
      }

      return [...current, { product, quantity: 100 }];
    });
    setIngredientQuery("");
    setSearchResults([]);
  };

  const handleSaveBuilderRecipe = () => {
    const normalizedName = recipeName.trim();

    if (!normalizedName || builderItems.length === 0) {
      return;
    }

    dispatch(
      saveMealTemplate({
        name: `${CUSTOM_RECIPE_PREFIX}${normalizedName}`,
        mealType,
        items: builderItems,
      })
    );
    setRecipeName("");
  };

  const handleAddBuilderNow = () => {
    if (builderItems.length === 0) {
      return;
    }

    dispatch(
      addMealEntries(
        builderItems.map((ingredient) => ({
          id: createEntryId(),
          product: ingredient.product,
          quantity: ingredient.quantity,
          mealType,
          eatenAt: new Date().toISOString(),
          origin: "recipe",
        }))
      )
    );
  };

  const allRecipes = [...customRecipes, ...filteredRecipes];

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {t("recipes.title")}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 5,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
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
                  label={getProductDisplayName(product, language)}
                  onClick={() => handleAddBuilderIngredient(product)}
                />
              ))}
            </Stack>
          )}

          {builderItems.length > 0 && (
            <Stack spacing={1.2}>
              {builderItems.map((item) => (
                <Paper key={item.product.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.2}
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Typography sx={{ flex: 1, fontWeight: 700 }}>
                      {getProductDisplayName(item.product, language)}
                    </Typography>
                    <TextField
                      type="number"
                      label="Qty"
                      value={item.quantity}
                      onChange={(event) => {
                        const nextQuantity = Math.max(1, Number(event.target.value) || 1);
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
                <Button variant="contained" onClick={handleAddBuilderNow}>
                  Add recipe now
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSaveBuilderRecipe}
                  disabled={!recipeName.trim()}
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
            borderRadius: 5,
            border: "1px solid rgba(15, 23, 42, 0.08)",
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
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {recipe.title}
              </Typography>
              <Typography color="text.secondary">{recipe.description}</Typography>
              <Typography variant="body2">
                {t("recipes.ingredients")}:{" "}
                {recipe.ingredients
                  .map(
                    (ingredient) =>
                      `${getProductDisplayName(ingredient.product, language)} ${ingredient.quantity} ${ingredient.product.unit}`
                  )
                  .join(", ")}
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleAddRecipe(recipe.id)}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("recipes.add")}
              </Button>
              {customRecipes.some((item) => item.id === recipe.id) && (
                <Stack direction="row" spacing={1}>
                  <Button onClick={() => dispatch(applyMealTemplate(recipe.id))}>
                    Reuse
                  </Button>
                  <Button color="error" onClick={() => dispatch(deleteMealTemplate(recipe.id))}>
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
