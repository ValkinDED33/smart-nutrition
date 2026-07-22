import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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
import { applyCommunityActionInCloud } from "../community/communityCloudSync";
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
import type { AppLanguage } from "../../shared/types/i18n";
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
import { useMealActionFeedback } from "./useMealActionFeedback";
import { getNutrientLabel } from "@domain/meal/nutrients";

interface Props {
  mealType: MealType;
}

type BuilderItem = Omit<MealTemplateItem, "quantity"> & {
  quantity: number | "";
};

const CUSTOM_RECIPE_PREFIX = "Recipe: ";
const COMMON_KCAL_KEY = "common.kcal";

const formatMacroLabel = (
  key: "protein" | "fat" | "carbs",
  value: number,
  language: AppLanguage,
  gramLabel: string
) => `${getNutrientLabel(key, language)} ${value.toFixed(1)} ${gramLabel}`;

const recipeActionCopy = {
  uk: {
    saving: "Зберігаємо рецепт у хмару...",
    confirmedAdd: "Рецепт додано до щоденника.",
    confirmedSave: "Рецепт збережено як шаблон.",
    confirmedApply: "Шаблон рецепта застосовано.",
    confirmedDelete: "Шаблон рецепта видалено.",
    confirmedPublish: "Рецепт опубліковано в спільноті.",
    builderTitle: "Конструктор власного рецепта",
    builderBody:
      "Зберіть рецепт з інгредієнтів, перевірте розраховані нутрієнти, додайте його зараз або збережіть як шаблон.",
    recipeNameLabel: "Назва рецепта",
    ingredientSearchLabel: "Пошук інгредієнта",
    ingredientSearching: "Шукаємо...",
    ingredientSearchHint: "Введіть продукт, ресторанну позицію або домашню страву",
    quantityLabel: "Кількість",
    remove: "Видалити",
    reuse: "Використати знову",
    publishRecipe: "Опублікувати рецепт",
    customRecipeDescription: "Власний рецепт, зібраний з ваших інгредієнтів.",
    publishBody: (count: number, calories: string, kcalLabel: string) =>
      `Рецепт із ${count} інгредієнтів та ${calories} ${kcalLabel}.`,
    addRecipeNow: "Додати рецепт зараз",
    saveAsReusableRecipe: "Зберегти як шаблон",
    failedAdd: "Не вдалося додати рецепт до щоденника.",
    failedSave: "Не вдалося зберегти рецепт.",
    failedApply: "Не вдалося застосувати рецепт.",
    failedDelete: "Не вдалося видалити рецепт.",
    failedPublish: "Не вдалося опублікувати рецепт.",
    retry: "Спробувати ще раз",
  },
  pl: {
    saving: "Zapisujemy przepis w chmurze...",
    confirmedAdd: "Przepis został dodany do dziennika.",
    confirmedSave: "Przepis zapisano jako szablon.",
    confirmedApply: "Szablon przepisu został zastosowany.",
    confirmedDelete: "Szablon przepisu został usunięty.",
    confirmedPublish: "Przepis opublikowano w społeczności.",
    builderTitle: "Kreator własnego przepisu",
    builderBody:
      "Zbuduj przepis ze składników, sprawdź wyliczone wartości, dodaj go teraz albo zapisz jako szablon.",
    recipeNameLabel: "Nazwa przepisu",
    ingredientSearchLabel: "Szukaj składnika",
    ingredientSearching: "Szukamy...",
    ingredientSearchHint: "Wpisz produkt, danie z restauracji albo domowy posiłek",
    quantityLabel: "Ilość",
    remove: "Usuń",
    reuse: "Użyj ponownie",
    publishRecipe: "Opublikuj przepis",
    customRecipeDescription: "Własny przepis zbudowany z Twoich składników.",
    publishBody: (count: number, calories: string, kcalLabel: string) =>
      `Przepis z ${count} składników i ${calories} ${kcalLabel}.`,
    addRecipeNow: "Dodaj przepis teraz",
    saveAsReusableRecipe: "Zapisz jako szablon",
    failedAdd: "Nie udało się dodać przepisu do dziennika.",
    failedSave: "Nie udało się zapisać przepisu.",
    failedApply: "Nie udało się zastosować przepisu.",
    failedDelete: "Nie udało się usunąć przepisu.",
    failedPublish: "Nie udało się opublikować przepisu.",
    retry: "Spróbuj ponownie",
  },
  en: {
    saving: "Saving recipe to cloud...",
    confirmedAdd: "Recipe added to your diary.",
    confirmedSave: "Recipe saved as a reusable template.",
    confirmedApply: "Recipe template applied.",
    confirmedDelete: "Recipe template removed.",
    confirmedPublish: "Recipe published to the community.",
    builderTitle: "Custom recipe builder",
    builderBody:
      "Build a reusable recipe from ingredients, check the calculated nutrients, add it now, or save it for later.",
    recipeNameLabel: "Recipe name",
    ingredientSearchLabel: "Search ingredient",
    ingredientSearching: "Searching...",
    ingredientSearchHint: "Type a product, restaurant item, or home dish",
    quantityLabel: "Quantity",
    remove: "Remove",
    reuse: "Reuse",
    publishRecipe: "Publish recipe",
    customRecipeDescription: "Custom recipe built from your own ingredients.",
    publishBody: (count: number, calories: string, kcalLabel: string) =>
      `Recipe with ${count} ingredients and ${calories} ${kcalLabel}.`,
    addRecipeNow: "Add recipe now",
    saveAsReusableRecipe: "Save as reusable recipe",
    failedAdd: "Could not add recipe to your diary.",
    failedSave: "Could not save recipe.",
    failedApply: "Could not apply recipe.",
    failedDelete: "Could not remove recipe.",
    failedPublish: "Could not publish recipe.",
    retry: "Try again",
  },
} as const;

type RecipeActionCopy = (typeof recipeActionCopy)[keyof typeof recipeActionCopy];

const RECIPE_TEXT_SECONDARY = "text.secondary";

const getRecipeActionCopy = (language: AppLanguage): RecipeActionCopy => {
  switch (language) {
    case "uk":
      return recipeActionCopy.uk;
    case "pl":
      return recipeActionCopy.pl;
    case "en":
    default:
      return recipeActionCopy.en;
  }
};

export const RecipeSection = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, t } = useLanguage();
  const templates = useSelector(selectMealTemplates);
  const meal = useSelector((state: RootState) => state.meal);
  const community = useSelector((state: RootState) => state.community);
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
  const recipeEntrySequenceRef = useRef(0);
  const recipeTemplateSequenceRef = useRef(0);
  const copy = getRecipeActionCopy(appLanguage);
  const {
    notice: mealActionNotice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  } = useMealActionFeedback({
    saving: {
      add: copy.saving,
      edit: copy.saving,
      delete: copy.saving,
      repeat: copy.saving,
      saveTemplate: copy.saving,
      applyTemplate: copy.saving,
      saveProduct: copy.saving,
    },
    confirmed: {
      add: copy.confirmedAdd,
      edit: copy.confirmedSave,
      delete: copy.confirmedDelete,
      repeat: copy.confirmedApply,
      saveTemplate: copy.confirmedSave,
      applyTemplate: copy.confirmedApply,
      saveProduct: copy.confirmedPublish,
    },
    failed: {
      add: copy.failedAdd,
      edit: copy.failedSave,
      delete: copy.failedDelete,
      repeat: copy.failedApply,
      saveTemplate: copy.failedSave,
      applyTemplate: copy.failedApply,
      saveProduct: copy.failedPublish,
    },
    retry: copy.retry,
  });

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
            description: copy.customRecipeDescription,
            ingredients: template.items,
            steps: [],
            calories: nutrients.calories,
            protein: nutrients.protein,
            fat: nutrients.fat,
            carbs: nutrients.carbs,
          };
        }),
    [copy.customRecipeDescription, mealType, preferences, templates]
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
  const createRecipeEntryId = () => {
    recipeEntrySequenceRef.current += 1;

    return (
      globalThis.crypto?.randomUUID?.() ??
      `recipe-meal-${recipeEntrySequenceRef.current}`
    );
  };
  const createRecipeTemplateId = () => {
    recipeTemplateSequenceRef.current += 1;

    return (
      globalThis.crypto?.randomUUID?.() ??
      `template-${recipeTemplateSequenceRef.current}`
    );
  };
  const builderNutrients = useMemo(
    () =>
      calculateMealTotalNutrients(
        validBuilderItems.map((item, index) => ({
          id: `builder-preview-${item.product.id}-${index}`,
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
      id: createRecipeEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType: recipe.mealType,
      eatenAt,
      origin: "recipe",
    }));

    await runMealAction({
      actionId: `recipe-add-${recipe.id}`,
      kind: "add",
      action: () => addMealEntriesToCloud(dispatch, meal, entries),
    });
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
      id: createRecipeTemplateId(),
      name: `${CUSTOM_RECIPE_PREFIX}${normalizedName}`,
      mealType,
      items: validBuilderItems,
      createdAt: new Date().toISOString(),
    };

    const saved = await runMealAction({
      actionId: "recipe-builder-save",
      kind: "saveTemplate",
      action: () => saveMealTemplateToCloud(dispatch, meal, template),
    });

    if (saved) {
      setRecipeName("");
    }
  };

  const handleReuseTemplateRecipe = async (recipeId: string) => {
    const template = templates.find((item) => item.id === recipeId);
    if (!template) return;

    await runMealAction({
      actionId: `recipe-template-apply-${recipeId}`,
      kind: "applyTemplate",
      action: () => applyMealTemplateInCloud(
        dispatch,
        meal,
        recipeId,
        createTemplateEntries(template)
      ),
    });
  };

  const handleDeleteTemplateRecipe = async (recipeId: string) => {
    await runMealAction({
      actionId: `recipe-template-delete-${recipeId}`,
      kind: "delete",
      action: () => deleteMealTemplateFromCloud(dispatch, meal, recipeId),
    });
  };

  const handleAddBuilderNow = async () => {
    if (validBuilderItems.length === 0) {
      return;
    }

    const entries: MealEntry[] = validBuilderItems.map((ingredient) => ({
      id: createRecipeEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType,
      eatenAt: new Date().toISOString(),
      origin: "recipe",
    }));

    await runMealAction({
      actionId: "recipe-builder-add-now",
      kind: "add",
      action: () => addMealEntriesToCloud(dispatch, meal, entries),
    });
  };

  const handlePublishRecipe = async (recipe: Recipe) => {
    if (!user) {
      return;
    }

    const action = publishCommunityPost({
      type: "recipe",
      title: recipe.title,
      body:
        recipe.description ||
        copy.publishBody(
          recipe.ingredients.length,
          recipe.calories.toFixed(0),
          t(COMMON_KCAL_KEY)
        ),
      authorId: user.id,
      authorName: user.name,
      ingredients: recipe.ingredients.map((ingredient) =>
        getProductDisplayName(ingredient.product, appLanguage)
      ),
    });

    await runMealAction({
      actionId: `recipe-publish-${recipe.id}`,
      kind: "saveProduct",
      action: () => applyCommunityActionInCloud(dispatch, community, action),
    });
  };

  const allRecipes = [...customRecipes, ...filteredRecipes];

  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
        {t("recipes.title")}
      </Typography>
      {mealActionNotice ? (
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
          <Typography sx={{ fontWeight: 800 }}>{copy.builderTitle}</Typography>
          <Typography color={RECIPE_TEXT_SECONDARY}>
            {copy.builderBody}
          </Typography>

          <TextField
            fullWidth
            label={copy.recipeNameLabel}
            value={recipeName}
            onChange={(event) => setRecipeName(event.target.value)}
          />

          <TextField
            fullWidth
            label={copy.ingredientSearchLabel}
            value={ingredientQuery}
            onChange={(event) => setIngredientQuery(event.target.value)}
            helperText={
              searchPending
                ? copy.ingredientSearching
                : copy.ingredientSearchHint
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
                      label={copy.quantityLabel}
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
                      {copy.remove}
                    </Button>
                  </Stack>
                </Paper>
              ))}

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${builderNutrients.calories.toFixed(0)} ${t(COMMON_KCAL_KEY)}`} />
                <Chip
                  label={formatMacroLabel(
                    "protein",
                    builderNutrients.protein,
                    appLanguage,
                    t("common.g")
                  )}
                />
                <Chip
                  label={formatMacroLabel("fat", builderNutrients.fat, appLanguage, t("common.g"))}
                />
                <Chip
                  label={formatMacroLabel("carbs", builderNutrients.carbs, appLanguage, t("common.g"))}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    void handleAddBuilderNow();
                  }}
                  disabled={
                    validBuilderItems.length === 0 ||
                    isSavingAction("recipe-builder-add-now")
                  }
                >
                  {copy.addRecipeNow}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => void handleSaveBuilderRecipe()}
                  disabled={
                    !recipeName.trim() ||
                    validBuilderItems.length === 0 ||
                    isSavingAction("recipe-builder-save")
                  }
                >
                  {copy.saveAsReusableRecipe}
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
                <Chip label={`${recipe.calories} ${t(COMMON_KCAL_KEY)}`} />
                <Chip
                  label={formatMacroLabel("protein", recipe.protein, appLanguage, t("common.g"))}
                />
                <Chip label={formatMacroLabel("fat", recipe.fat, appLanguage, t("common.g"))} />
                <Chip label={formatMacroLabel("carbs", recipe.carbs, appLanguage, t("common.g"))} />
              </Stack>
              <Typography component="h3" variant="h6" sx={{ fontWeight: 800 }}>
                {recipe.title}
              </Typography>
              <Typography color={RECIPE_TEXT_SECONDARY}>{recipe.description}</Typography>
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
                disabled={isSavingAction(`recipe-add-${recipe.id}`)}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("recipes.add")}
              </Button>
              {customRecipes.some((item) => item.id === recipe.id) && (
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => void handleReuseTemplateRecipe(recipe.id)}
                    disabled={isSavingAction(`recipe-template-apply-${recipe.id}`)}
                  >
                    {copy.reuse}
                  </Button>
                  <Button
                    onClick={() => void handlePublishRecipe(recipe)}
                    disabled={!user || isSavingAction(`recipe-publish-${recipe.id}`)}
                  >
                    {copy.publishRecipe}
                  </Button>
                  <Button
                    color="error"
                    onClick={() => void handleDeleteTemplateRecipe(recipe.id)}
                    disabled={isSavingAction(`recipe-template-delete-${recipe.id}`)}
                  >
                    {copy.remove}
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
