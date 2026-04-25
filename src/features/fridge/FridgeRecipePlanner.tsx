import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
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
import type { MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import type { CommunityPost } from "../../shared/types/community";
import { useLanguage } from "../../shared/language";
import { searchProducts } from "../../shared/api/products";
import { recipes } from "../../shared/lib/recipes";
import { addMealEntries } from "../meal/mealSlice";
import { selectSavedProducts } from "../meal/selectors";
import {
  removeFridgeItem,
  updateFridgeItemQuantity,
  upsertFridgeItem,
} from "./fridgeSlice";

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
  const fridgeItems = useSelector((state: RootState) => state.fridge.items);
  const savedProducts = useSelector(selectSavedProducts);
  const communityPosts = useSelector((state: RootState) => state.community.posts);
  const { language } = useLanguage();
  const copy = fridgeCopy[language];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    if (!deferredQuery.trim()) {
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

  const handleCookRecipe = (recipeId: string) => {
    const recipe = recipes.find((item) => item.id === recipeId);

    if (!recipe) {
      return;
    }

    dispatch(
      addMealEntries(
        recipe.ingredients.map((ingredient) => ({
          id:
            globalThis.crypto?.randomUUID?.() ??
            `fridge-recipe-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          product: ingredient.product,
          quantity: ingredient.quantity,
          mealType,
          eatenAt: new Date().toISOString(),
          origin: "recipe",
        }))
      )
    );
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
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

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
                  label={product.name}
                  onClick={() => {
                    dispatch(upsertFridgeItem({ product, quantity: 100 }));
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
                color="info"
                variant="outlined"
                label={product.name}
                onClick={() => {
                  dispatch(upsertFridgeItem({ product, quantity: 100 }));
                  setQuery("");
                  setResults([]);
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
              <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Typography sx={{ flex: 1, fontWeight: 700 }}>
                    {item.product.name}
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    label={`${copy.quantity} (${item.product.unit})`}
                    value={item.quantity}
                    onChange={(event) =>
                      dispatch(
                        updateFridgeItemQuantity({
                          itemId: item.id,
                          quantity: Number(event.target.value) || 1,
                        })
                      )
                    }
                    sx={{ width: { xs: "100%", md: 180 } }}
                  />
                  <Button color="error" onClick={() => dispatch(removeFridgeItem(item.id))}>
                    Remove
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
              <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
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
                      onClick={() => handleCookRecipe(item.recipeId!)}
                      sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                    >
                      {copy.cookNow}
                    </Button>
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
