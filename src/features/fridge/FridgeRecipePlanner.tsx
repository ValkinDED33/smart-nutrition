import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import type { MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import type { CommunityPost } from "../../shared/types/community";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import { searchProducts } from "../../shared/api/products";
import { recipes } from "@domain/meal/recipes";
import { addMealEntriesToCloud } from "../meal/mealCloudSync";
import { selectSavedProducts } from "../meal/selectors";
import {
  consumeFridgeItemsInCloud,
  removeFridgeItemFromCloud,
  updateFridgeItemQuantityInCloud,
  upsertFridgeItemInCloud,
} from "./fridgeCloudSync";

const fridgeCopy = {
  uk: {
    title: "Що є в холодильнику",
    subtitle:
      "Додайте продукти, які вже є вдома, і система запропонує рецепти з бази та спільноти.",
    search: "Додати продукт у холодильник",
    searchHint: "Почніть вводити назву продукту",
    quickAdd: "Швидке додавання",
    selected: "У холодильнику зараз",
    selectedEmpty: "Поки що порожньо. Додайте хоча б 2-3 інгредієнти.",
    quantity: "Кількість",
    suggestions: "Що можна приготувати",
    noSuggestions:
      "Поки що замало збігів. Додайте ще один білок, овоч або базовий гарнір.",
    fromLibrary: "База",
    fromCommunity: "Спільнота",
    coverage: "Покриття",
    missing: "Ще потрібні",
    cookNow: "Додати як прийом їжі",
    remove: "Видалити",
    saveFailed: "Не вдалося зберегти холодильник у хмарі.",
    addedToFridge: "Продукт додано в холодильник.",
    quantityUpdated: "Кількість оновлено.",
    removedFromFridge: "Продукт видалено з холодильника.",
    mealAdded: "Рецепт додано в щоденник, холодильник оновлено.",
    mealAddedFridgeFailed:
      "Рецепт додано в щоденник, але холодильник не оновився. Повторіть зміну складу вручну.",
    communityRecipeInfo:
      "Рецепт зі спільноти показує склад і відсутні інгредієнти. Додавання в щоденник доступне для рецептів із бази.",
  },
  pl: {
    title: "Co jest w lodówce",
    subtitle:
      "Dodaj produkty, które już masz w domu, a system podpowie przepisy z bazy i społeczności.",
    search: "Dodaj produkt do lodówki",
    searchHint: "Zacznij wpisywać nazwę produktu",
    quickAdd: "Szybkie dodawanie",
    selected: "Aktualnie w lodówce",
    selectedEmpty: "Na razie pusto. Dodaj choć 2-3 składniki.",
    quantity: "Ilość",
    suggestions: "Co możesz ugotować",
    noSuggestions:
      "Na razie jest za mało dopasowań. Dodaj jeszcze jedno źródło białka, warzywo lub bazowy dodatek.",
    fromLibrary: "Baza",
    fromCommunity: "Społeczność",
    coverage: "Dopasowanie",
    missing: "Brakuje jeszcze",
    cookNow: "Dodaj jako posiłek",
    remove: "Usuń",
    saveFailed: "Nie udalo sie zapisac lodowki w chmurze.",
    addedToFridge: "Produkt dodany do lodówki.",
    quantityUpdated: "Ilość zaktualizowana.",
    removedFromFridge: "Produkt usunięty z lodówki.",
    mealAdded: "Przepis dodany do dziennika, lodówka zaktualizowana.",
    mealAddedFridgeFailed:
      "Przepis dodany do dziennika, ale lodówka nie została zaktualizowana. Popraw stan ręcznie.",
    communityRecipeInfo:
      "Przepis społeczności pokazuje skład i brakujące produkty. Dodanie do dziennika jest dostępne dla przepisów z bazy.",
  },
  en: {
    title: "What is in the fridge",
    subtitle:
      "Add products you already have at home, and the system will suggest recipes from the library and community.",
    search: "Add product to fridge",
    searchHint: "Start typing a product name",
    quickAdd: "Quick add",
    selected: "Currently in the fridge",
    selectedEmpty: "Add at least 2-3 ingredients to get recipe matches.",
    quantity: "Quantity",
    suggestions: "What you can cook",
    noSuggestions:
      "Not enough matches yet. Add one more protein, vegetable, or base side.",
    fromLibrary: "Library",
    fromCommunity: "Community",
    coverage: "Coverage",
    missing: "Still needed",
    cookNow: "Add as meal",
    remove: "Remove",
    saveFailed: "Could not save fridge to cloud.",
    addedToFridge: "Product added to the fridge.",
    quantityUpdated: "Quantity updated.",
    removedFromFridge: "Product removed from the fridge.",
    mealAdded: "Recipe added to the diary and fridge updated.",
    mealAddedFridgeFailed:
      "Recipe was added to the diary, but the fridge was not updated. Adjust the fridge manually.",
    communityRecipeInfo:
      "Community recipes show ingredients and missing items. Diary add is available for library recipes.",
  },
} as const;

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

type RecipeSuggestion = {
  id: string;
  title: string;
  source: "library" | "community";
  description: string;
  missingIngredients: string[];
  coverage: number;
  recipeId?: string;
};

const getCommunityRecipeSuggestions = (
  posts: CommunityPost[],
  pantryTokens: string[]
) =>
  posts
    .filter((post) => post.type === "recipe" && post.ingredients.length > 0)
    .map<RecipeSuggestion | null>((post) => {
      const matchedIngredients = post.ingredients.filter((ingredient) =>
        pantryTokens.includes(normalizeToken(ingredient))
      );
      const missingIngredients = post.ingredients.filter(
        (ingredient) => !pantryTokens.includes(normalizeToken(ingredient))
      );

      if (matchedIngredients.length === 0) {
        return null;
      }

      return {
        id: post.id,
        title: post.title,
        source: "community",
        description: post.body,
        missingIngredients,
        coverage: matchedIngredients.length / Math.max(post.ingredients.length, 1),
      };
    })
    .filter(Boolean) as RecipeSuggestion[];

interface Props {
  mealType: MealType;
}

export const FridgeRecipePlanner = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const meal = useSelector((state: RootState) => state.meal);
  const fridge = useSelector((state: RootState) => state.fridge);
  const fridgeItems = useSelector((state: RootState) => state.fridge.items);
  const savedProducts = useSelector(selectSavedProducts);
  const communityPosts = useSelector((state: RootState) => state.community.posts);
  const { appLanguage } = useLanguage();
  const copy =
    appLanguage === "uk"
      ? fridgeCopy.uk
      : appLanguage === "pl"
        ? fridgeCopy.pl
        : fridgeCopy.en;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [mealSaveError, setMealSaveError] = useState<string | null>(null);
  const [mealSaveNotice, setMealSaveNotice] = useState<string | null>(null);
  const [fridgeSaveError, setFridgeSaveError] = useState<string | null>(null);
  const [fridgeSaveNotice, setFridgeSaveNotice] = useState<string | null>(null);
  const [savingFridgeAction, setSavingFridgeAction] = useState<string | null>(null);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const recipeEntrySequenceRef = useRef(0);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    if (!deferredQuery.trim()) {
      startTransition(() => {
        setResults([]);
      });

      return () => {
        active = false;
      };
    }

    void searchProducts(deferredQuery)
      .then((items) => {
        if (!active) {
          return;
        }

        startTransition(() => {
          setResults(items.slice(0, 8));
        });
      })
      .catch(() => {
        if (active) {
          startTransition(() => {
            setResults([]);
          });
        }
      });

    return () => {
      active = false;
    };
  }, [deferredQuery]);

  const pantryTokens = useMemo(
    () => fridgeItems.map((item) => normalizeToken(item.product.name)),
    [fridgeItems]
  );
  const displayedResults = deferredQuery.trim() ? results : [];

  const suggestions = useMemo(() => {
    const librarySuggestions = recipes
      .filter((recipe) => recipe.mealType === mealType)
      .map<RecipeSuggestion | null>((recipe) => {
        const matchedCount = recipe.ingredients.filter((ingredient) =>
          pantryTokens.includes(normalizeToken(ingredient.product.name))
        ).length;
        const missingIngredients = recipe.ingredients
          .map((ingredient) => ingredient.product.name)
          .filter((ingredient) => !pantryTokens.includes(normalizeToken(ingredient)));

        if (matchedCount === 0) {
          return null;
        }

        return {
          id: recipe.id,
          title: recipe.title,
          source: "library",
          description: recipe.description,
          missingIngredients,
          coverage: matchedCount / recipe.ingredients.length,
          recipeId: recipe.id,
        };
      })
      .filter(Boolean) as RecipeSuggestion[];

    return [...librarySuggestions, ...getCommunityRecipeSuggestions(communityPosts, pantryTokens)]
      .sort((left, right) => right.coverage - left.coverage)
      .slice(0, 5);
  }, [communityPosts, mealType, pantryTokens]);

  const createRecipeEntryId = () => {
    recipeEntrySequenceRef.current += 1;

    return (
      globalThis.crypto?.randomUUID?.() ??
      `fridge-recipe-entry-${recipeEntrySequenceRef.current}`
    );
  };

  const handleCookRecipe = async (recipeId: string) => {
    const recipe = recipes.find((item) => item.id === recipeId);

    if (!recipe) {
      return;
    }

    const entries = recipe.ingredients.map((ingredient) => ({
      id: createRecipeEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType,
      eatenAt: new Date().toISOString(),
      origin: "recipe" as const,
    }));

    setMealSaveError(null);
    setMealSaveNotice(null);
    setFridgeSaveError(null);
    setFridgeSaveNotice(null);
    setSavingFridgeAction(`cook-${recipeId}`);

    try {
      await addMealEntriesToCloud(dispatch, meal, entries);

      try {
        await consumeFridgeItemsInCloud(dispatch, fridge, recipe.ingredients);
        setMealSaveNotice(copy.mealAdded);
      } catch (fridgeError) {
        setMealSaveNotice(copy.mealAddedFridgeFailed);
        setFridgeSaveError(
          fridgeError instanceof Error ? fridgeError.message : copy.saveFailed
        );
      }
    } catch (error) {
      setMealSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    } finally {
      setSavingFridgeAction(null);
    }
  };

  const runFridgeAction = async (
    actionId: string,
    action: () => Promise<unknown>,
    successMessage?: string
  ) => {
    setFridgeSaveError(null);
    setFridgeSaveNotice(null);
    setSavingFridgeAction(actionId);

    try {
      await action();
      setFridgeSaveNotice(successMessage ?? null);
    } catch (error) {
      setFridgeSaveError(
        error instanceof Error ? error.message : copy.saveFailed
      );
    } finally {
      setSavingFridgeAction(null);
    }
  };

  const getQuantityDraft = (itemId: string, fallback: number) =>
    Object.entries(quantityDrafts).find(([key]) => key === itemId)?.[1] ??
    String(fallback);

  const commitQuantityDraft = (itemId: string) => {
    const item = fridge.items.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    const quantity = Number(getQuantityDraft(itemId, item.quantity));

    if (!Number.isFinite(quantity) || quantity <= 0 || quantity === item.quantity) {
      setQuantityDrafts((current) => {
        const { [itemId]: _removed, ...rest } = current;
        void _removed;
        return rest;
      });
      return;
    }

    void runFridgeAction(`quantity-${item.id}`, async () => {
      await updateFridgeItemQuantityInCloud(dispatch, fridge, {
        itemId: item.id,
        quantity,
      });
      setQuantityDrafts((current) => {
        const { [itemId]: _removed, ...rest } = current;
        void _removed;
        return rest;
      });
    }, copy.quantityUpdated);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {mealSaveError ? (
          <Alert severity="error" onClose={() => setMealSaveError(null)}>
            {mealSaveError}
          </Alert>
        ) : null}

        {mealSaveNotice ? (
          <Alert
            severity={fridgeSaveError ? "warning" : "success"}
            onClose={() => setMealSaveNotice(null)}
          >
            {mealSaveNotice}
          </Alert>
        ) : null}

        {fridgeSaveError ? (
          <Alert severity="error" onClose={() => setFridgeSaveError(null)}>
            {fridgeSaveError}
          </Alert>
        ) : null}

        {fridgeSaveNotice ? (
          <Alert severity="success" onClose={() => setFridgeSaveNotice(null)}>
            {fridgeSaveNotice}
          </Alert>
        ) : null}

        <TextField
          fullWidth
          label={copy.search}
          placeholder={copy.searchHint}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {savedProducts.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.quickAdd}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {savedProducts.slice(0, 8).map((product) => (
                <Chip
                  key={`saved-${product.id}`}
                  clickable
                  disabled={Boolean(savingFridgeAction)}
                  label={product.name}
                  onClick={() => {
                    void runFridgeAction(
                      `saved-${product.id}`,
                      () =>
                        upsertFridgeItemInCloud(dispatch, fridge, {
                          product,
                          quantity: 100,
                        }),
                      copy.addedToFridge
                    );
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {displayedResults.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {displayedResults.map((product) => (
              <Chip
                key={`search-${product.id}`}
                clickable
                disabled={Boolean(savingFridgeAction)}
                color="info"
                variant="outlined"
                label={product.name}
                onClick={() => {
                  void runFridgeAction(
                    `search-${product.id}`,
                    async () => {
                      await upsertFridgeItemInCloud(dispatch, fridge, {
                        product,
                        quantity: 100,
                      });
                      setQuery("");
                      setResults([]);
                    },
                    copy.addedToFridge
                  );
                }}
              />
            ))}
          </Stack>
        )}

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.selected}</Typography>
          {fridgeItems.length === 0 ? (
            <Alert severity="info">{copy.selectedEmpty}</Alert>
          ) : (
            fridgeItems.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Typography sx={{ flex: 1, fontWeight: 700 }}>
                    {item.product.name}
                  </Typography>
                  <TextField
                    type="text"
                    size="small"
                    label={`${copy.quantity} (${item.product.unit})`}
                    value={getQuantityDraft(item.id, item.quantity)}
                    onFocus={(event) => selectInputValue(event.target)}
                    onClick={(event) => selectInputValue(event.currentTarget)}
                    slotProps={{
                      htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
                    }}
                    onChange={(event) => {
                      setQuantityDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }));
                    }}
                    onBlur={() => commitQuantityDraft(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    sx={{ width: { xs: "100%", md: 180 } }}
                  />
                  <Button
                    color="error"
                    disabled={savingFridgeAction === `remove-${item.id}`}
                    onClick={() =>
                      void runFridgeAction(
                        `remove-${item.id}`,
                        () => removeFridgeItemFromCloud(dispatch, fridge, item.id),
                        copy.removedFromFridge
                      )
                    }
                  >
                    {copy.remove}
                  </Button>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.suggestions}</Typography>
          {suggestions.length === 0 ? (
            <Alert severity="info">{copy.noSuggestions}</Alert>
          ) : (
            suggestions.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      label={item.source === "library" ? copy.fromLibrary : copy.fromCommunity}
                      color={item.source === "library" ? "success" : "default"}
                      size="small"
                    />
                    <Chip
                      label={`${copy.coverage}: ${Math.round(item.coverage * 100)}%`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Typography color="text.secondary">{item.description}</Typography>
                  <Typography variant="body2">
                    {copy.missing}:{" "}
                    {item.missingIngredients.length > 0
                      ? item.missingIngredients.join(", ")
                      : "-"}
                  </Typography>
                  {item.recipeId && (
                    <Button
                      variant="contained"
                      disabled={savingFridgeAction === `cook-${item.recipeId}`}
                      onClick={() => {
                        void handleCookRecipe(item.recipeId!);
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                    >
                      {copy.cookNow}
                    </Button>
                  )}
                  {!item.recipeId && (
                    <Alert severity="info">{copy.communityRecipeInfo}</Alert>
                  )}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
