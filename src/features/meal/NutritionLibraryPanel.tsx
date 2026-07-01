import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BookOpen, Plus, Search, Star, Utensils } from "lucide-react";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { recipes } from "@domain/meal/recipes";
import type { MealTemplate, MealType, Recipe } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import { productMatchesPreferences, recipeMatchesPreferences } from "@domain/user/preferences";
import type { RootState, AppDispatch } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { SectionCard } from "../../shared/ui/SectionCard";
import { SectionHeader } from "../../shared/ui/SectionHeader";
import { SectionTabs } from "../../shared/ui/SectionTabs";
import {
  selectMealTemplates,
  selectSavedProducts,
} from "./selectors";
import { searchProducts } from "../../shared/api/products";
import {
  normalizeProductLookupQuery,
  shouldRunOnlineProductLookup,
} from "./productLookupUiModel";
import {
  addMealEntriesToCloud,
  applyMealTemplateInCloud,
  saveMealProductToCloud,
} from "./mealCloudSync";
import { createMealEntryDraft, createTemplateEntries } from "./mealSaveModel";

type LibraryMode = "library" | "saved";
type InnerTab = "products" | "dishes" | "articles";

interface NutritionLibraryPanelProps {
  mealType: MealType;
  mode?: LibraryMode;
}

const copy = {
  uk: {
    libraryTitle: "Онлайн-каталог",
    libraryDescription:
      "Продукти беруться з backend-каталогу. Якщо позиції немає, додайте її в спільну базу.",
    savedTitle: "Збережене",
    savedDescription:
      "Ваші обрані продукти, власні страви, рецепти й збережені матеріали в одному місці.",
    products: "Продукти",
    dishes: "Страви",
    articles: "Статті",
    search: "Пошук в онлайн-каталозі",
    onlineProducts: "Продукти",
    readyMeals: "Готові страви",
    savedProducts: "Обрані продукти",
    builtInRecipes: "Рецепти",
    savedDishes: "Ваші збережені страви",
    savedArticles: "Збережені матеріали",
    noSavedProducts: "Збережених продуктів ще немає.",
    noSavedDishes: "Збережених страв ще немає.",
    noSavedArticles: "Збережених матеріалів ще немає.",
    noResults: "Нічого не знайдено. Спробуйте іншу назву продукту або страви.",
    startSearch: "Почніть вводити назву, щоб підтягнути продукти з онлайн-каталогу.",
    loading: "Шукаю в онлайн-каталозі...",
    unavailableTitle: "Онлайн-каталог тимчасово недоступний",
    unavailableBody:
      "Це не порожня база: backend або зовнішній каталог не відповів. Спробуйте ще раз.",
    retry: "Спробувати ще раз",
    add100: "Додати 100",
    save: "Зберегти",
    apply: "Застосувати",
    kcal: "ккал",
    ingredients: "інгредієнти",
    community: "Спільнота",
    online: "Онлайн",
    scanner: "Сканер",
  },
  pl: {
    libraryTitle: "Katalog online",
    libraryDescription:
      "Produkty pochodzą z katalogu backendu. Jeśli czegoś brakuje, dodaj wpis do wspólnej bazy.",
    savedTitle: "Zapisane",
    savedDescription:
      "Ulubione produkty, własne dania, przepisy i zapisane materiały w jednym miejscu.",
    products: "Produkty",
    dishes: "Dania",
    articles: "Artykuły",
    search: "Szukaj w katalogu online",
    onlineProducts: "Produkty",
    readyMeals: "Gotowe dania",
    savedProducts: "Ulubione produkty",
    builtInRecipes: "Przepisy",
    savedDishes: "Twoje zapisane dania",
    savedArticles: "Zapisane materiały",
    noSavedProducts: "Nie masz jeszcze zapisanych produktów.",
    noSavedDishes: "Nie masz jeszcze zapisanych dań.",
    noSavedArticles: "Nie masz jeszcze zapisanych materiałów.",
    noResults: "Brak wyników. Spróbuj innej nazwy produktu lub dania.",
    startSearch: "Zacznij wpisywać nazwę, aby pobrać produkty z katalogu online.",
    loading: "Szukam w katalogu online...",
    unavailableTitle: "Katalog online jest chwilowo niedostępny",
    unavailableBody:
      "To nie jest pusta baza: backend albo zewnętrzny katalog nie odpowiedział. Spróbuj ponownie.",
    retry: "Spróbuj ponownie",
    add100: "Dodaj 100",
    save: "Zapisz",
    apply: "Użyj",
    kcal: "kcal",
    ingredients: "składniki",
    community: "Społeczność",
    online: "Online",
    scanner: "Skaner",
  },
  en: {
    libraryTitle: "Online catalog",
    libraryDescription:
      "Products come from the backend catalog. If something is missing, add it to the shared database.",
    savedTitle: "Saved",
    savedDescription:
      "Favorite products, your reusable dishes, recipes, and saved materials in one place.",
    products: "Products",
    dishes: "Dishes",
    articles: "Articles",
    search: "Search online catalog",
    onlineProducts: "Products",
    readyMeals: "Ready meals",
    savedProducts: "Favorite products",
    builtInRecipes: "Recipes",
    savedDishes: "Your saved dishes",
    savedArticles: "Saved materials",
    noSavedProducts: "No saved products yet.",
    noSavedDishes: "No saved dishes yet.",
    noSavedArticles: "No saved materials yet.",
    noResults: "Nothing found. Try another product or dish name.",
    startSearch: "Start typing a name to load products from the online catalog.",
    loading: "Searching the online catalog...",
    unavailableTitle: "Online catalog is temporarily unavailable",
    unavailableBody:
      "This is not an empty database: the backend or external catalog did not respond. Try again.",
    retry: "Try again",
    add100: "Add 100",
    save: "Save",
    apply: "Apply",
    kcal: "kcal",
    ingredients: "ingredients",
    community: "Community",
    online: "Online",
    scanner: "Scanner",
  },
} as const;

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const productKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

const templateCalories = (template: MealTemplate) =>
  template.items.reduce(
    (sum, item) => sum + item.product.nutrients.calories * (item.quantity / 100),
    0
  );

const isReadyMeal = (product: Product) => {
  const foodGroup = product.facts?.foodGroup ?? product.category;

  return foodGroup === "homemade" || foodGroup === "restaurant";
};

export const NutritionLibraryPanel = ({
  mealType,
  mode = "library",
}: NutritionLibraryPanelProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, t } = useLanguage();
  const labels = copy[appLanguage];
  const [activeTab, setActiveTab] = useState<InnerTab>("products");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const savedProducts = useSelector(selectSavedProducts);
  const meal = useSelector((state: RootState) => state.meal);
  const templates = useSelector(selectMealTemplates);
  const communityPosts = useSelector((state: RootState) => state.community.posts);
  const favoritePostIds = useSelector((state: RootState) => state.community.favoritePostIds);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const normalizedQuery = normalizeSearchText(query);
  const normalizedLookupQuery = normalizeProductLookupQuery(query);
  const debouncedLookupQuery = normalizeProductLookupQuery(debouncedQuery);
  const shouldLookupOnlineProducts =
    mode === "library" && shouldRunOnlineProductLookup(debouncedLookupQuery);
  const onlineProductsQuery = useQuery({
    queryKey: ["nutrition-library-products", debouncedLookupQuery],
    queryFn: () => searchProducts(debouncedLookupQuery),
    enabled: shouldLookupOnlineProducts,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const onlineProducts = onlineProductsQuery.data ?? [];
  const onlineLookupState = {
    isIdle: mode === "library" && !shouldRunOnlineProductLookup(normalizedLookupQuery),
    isSearching:
      mode === "library" &&
      shouldRunOnlineProductLookup(normalizedLookupQuery) &&
      (normalizedLookupQuery !== debouncedLookupQuery ||
        onlineProductsQuery.isLoading ||
        onlineProductsQuery.isFetching),
    isError: shouldLookupOnlineProducts && onlineProductsQuery.isError,
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const savedProductKeys = new Set(savedProducts.map((product) => productKey(product)));

  const filterProduct = (product: Product) => {
    if (!productMatchesPreferences(product, preferences)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return normalizeSearchText(
      `${product.name} ${product.brand ?? ""} ${getProductDisplayName(product, appLanguage)}`
    ).includes(normalizedQuery);
  };

  const filterRecipe = (recipe: Recipe) => {
    if (!recipeMatchesPreferences(recipe, preferences)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return normalizeSearchText(
      `${recipe.title} ${recipe.description} ${recipe.ingredients
        .map((ingredient) => getProductDisplayName(ingredient.product, appLanguage))
        .join(" ")}`
    ).includes(normalizedQuery);
  };

  const baseProducts = mode === "saved" ? savedProducts : onlineProducts;
  const visibleProducts = baseProducts
    .filter(filterProduct)
    .slice(0, mode === "saved" ? 12 : 18);
  const visibleReadyMeals = mode === "saved" ? [] : visibleProducts.filter(isReadyMeal);
  const visibleOnlineProducts =
    mode === "saved" ? visibleProducts : visibleProducts.filter((product) => !isReadyMeal(product));

  const visibleTemplates = templates
    .filter((template) => {
      if (mode === "library" && template.mealType !== mealType) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return normalizeSearchText(
        `${template.name} ${template.items
          .map((item) => getProductDisplayName(item.product, appLanguage))
          .join(" ")}`
      ).includes(normalizedQuery);
    })
    .slice(0, 10);

  const baseRecipes =
    mode === "saved" ? [] : recipes.filter((recipe) => recipe.mealType === mealType);
  const visibleRecipes = baseRecipes.filter(filterRecipe).slice(0, 8);

  const favoriteIds = new Set(favoritePostIds);
  const visibleSavedPosts = communityPosts
    .filter((post) => favoriteIds.has(post.id) && post.status === "approved")
    .filter((post) =>
      normalizedQuery
        ? normalizeSearchText(`${post.title} ${post.body} ${post.ingredients.join(" ")}`).includes(
            normalizedQuery
          )
        : true
    )
    .slice(0, 8);


  const productSections =
    mode === "saved"
      ? [{ title: labels.savedProducts, products: visibleProducts, empty: labels.noSavedProducts }]
      : [
          {
            title: labels.readyMeals,
            products: visibleReadyMeals,
            empty: onlineLookupState.isIdle ? labels.startSearch : labels.noResults,
          },
          {
            title: labels.onlineProducts,
            products: visibleOnlineProducts,
            empty: onlineLookupState.isIdle ? labels.startSearch : labels.noResults,
          },
          {
            title: labels.savedProducts,
            products: savedProducts.filter(filterProduct).slice(0, 8),
            empty: labels.noSavedProducts,
          },
        ];

  const sectionTabs = [
    {
      id: "products",
      label: labels.products,
      icon: <Search size={16} />,
      badge: mode === "saved" ? savedProducts.length : onlineProducts.length,
    },
    {
      id: "dishes",
      label: labels.dishes,
      icon: <Utensils size={16} />,
      badge: mode === "saved" ? templates.length : templates.length + recipes.length,
    },
    {
      id: "articles",
      label: labels.articles,
      icon: <BookOpen size={16} />,
      badge: visibleSavedPosts.length,
    },
  ];

  const runMealAction = async (id: string, action: () => Promise<unknown>) => {
    setActionError(null);
    setSavingId(id);

    try {
      await action();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SectionCard
      tone={mode === "saved" ? "premium" : "default"}
      title={mode === "saved" ? labels.savedTitle : labels.libraryTitle}
      description={mode === "saved" ? labels.savedDescription : labels.libraryDescription}
    >
      <Stack spacing={2}>
        <SectionTabs
          sections={sectionTabs}
          activeSection={activeTab}
          onChange={(sectionId) => setActiveTab(sectionId as InnerTab)}
          ariaLabel="Nutrition library sections"
        />

        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.search}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />

        {actionError ? (
          <Alert severity="error" onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        ) : null}

        {onlineLookupState.isSearching ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">{labels.loading}</Typography>
          </Stack>
        ) : null}

        {onlineLookupState.isError ? (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  void onlineProductsQuery.refetch();
                }}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {labels.retry}
              </Button>
            }
          >
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 800 }}>{labels.unavailableTitle}</Typography>
              <Typography>{labels.unavailableBody}</Typography>
            </Stack>
          </Alert>
        ) : null}

        {activeTab === "products" ? (
          <Stack spacing={2}>
            {productSections.map((section) =>
              section.products.length > 0 || section.empty ? (
                <Stack key={section.title} spacing={1.2}>
                  <SectionHeader title={section.title} />
                  {section.products.length === 0 ? (
                    <Typography color="text.secondary">{section.empty}</Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                        gap: 1,
                      }}
                    >
                      {section.products.map((product) => {
                        const displayName = getProductDisplayName(product, appLanguage);
                        const isSaved = savedProductKeys.has(productKey(product));

                        return (
                          <Box
                            key={`${section.title}-${productKey(product)}`}
                            sx={{
                              p: 1.25,
                              borderRadius: 1,
                              border: "1px solid var(--sn-border-soft)",
                              bgcolor: "var(--sn-surface-elevated)",
                              minWidth: 0,
                            }}
                          >
                            <Stack spacing={0.9}>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="flex-start"
                                justifyContent="space-between"
                              >
                                <Typography sx={{ fontWeight: 900, overflowWrap: "anywhere" }}>
                                  {displayName}
                                </Typography>
                                {isSaved ? <Star size={16} fill="#65a30d" color="#65a30d" /> : null}
                              </Stack>
                              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                <Chip
                                  label={`${product.nutrients.calories.toFixed(0)} ${
                                    labels.kcal
                                  }`}
                                  size="small"
                                />
                                <Chip
                                  label={`P ${product.nutrients.protein.toFixed(1)} ${t(
                                    "common.g"
                                  )}`}
                                  size="small"
                                />
                                <Chip label={product.source ?? labels.online} size="small" />
                              </Stack>
                              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Plus size={15} />}
                                  onClick={() =>
                                    void runMealAction(`add-${productKey(product)}`, () =>
                                      addMealEntriesToCloud(dispatch, meal, [
                                        createMealEntryDraft({
                                          product,
                                          quantity: 100,
                                          mealType,
                                          origin: "manual",
                                        }),
                                      ])
                                    )
                                  }
                                  disabled={savingId === `add-${productKey(product)}`}
                                >
                                  {labels.add100} {product.unit}
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    void runMealAction(`save-${productKey(product)}`, () =>
                                      saveMealProductToCloud(dispatch, meal, product)
                                    )
                                  }
                                  disabled={isSaved || savingId === `save-${productKey(product)}`}
                                >
                                  {labels.save}
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Stack>
              ) : null
            )}
          </Stack>
        ) : null}

        {activeTab === "dishes" ? (
          <Stack spacing={2}>
            <Stack spacing={1.2}>
              <SectionHeader title={labels.savedDishes} />
              {visibleTemplates.length === 0 ? (
                <Typography color="text.secondary">{labels.noSavedDishes}</Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                    gap: 1,
                  }}
                >
                  {visibleTemplates.map((template) => (
                    <Box
                      key={template.id}
                      sx={{
                        p: 1.35,
                        borderRadius: 1,
                        border: "1px solid var(--sn-border-soft)",
                        bgcolor: "var(--sn-surface-elevated)",
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography sx={{ fontWeight: 900 }}>{template.name}</Typography>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          <Chip label={t(`mealType.${template.mealType}`)} size="small" />
                          <Chip
                            label={`${templateCalories(template).toFixed(0)} ${labels.kcal}`}
                            size="small"
                          />
                          <Chip
                            label={`${template.items.length} ${labels.ingredients}`}
                            size="small"
                          />
                        </Stack>
                        <Typography color="text.secondary" variant="body2">
                          {template.items
                            .map(
                              (item) =>
                                `${getProductDisplayName(item.product, appLanguage)} ${
                                  item.quantity
                                } ${item.product.unit}`
                            )
                            .join(", ")}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            void runMealAction(`template-${template.id}`, () =>
                              applyMealTemplateInCloud(
                                dispatch,
                                meal,
                                template.id,
                                createTemplateEntries(template)
                              )
                            )
                          }
                          disabled={savingId === `template-${template.id}`}
                        >
                          {labels.apply}
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>

            {mode === "library" ? (
              <>
                <Divider />
                <Stack spacing={1.2}>
                  <SectionHeader title={labels.builtInRecipes} />
                  {visibleRecipes.length === 0 ? (
                    <Typography color="text.secondary">{labels.noResults}</Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                        gap: 1,
                      }}
                    >
                      {visibleRecipes.map((recipe) => (
                        <Box
                          key={recipe.id}
                          sx={{
                            p: 1.35,
                            borderRadius: 1,
                            border: "1px solid var(--sn-border-soft)",
                            bgcolor: "var(--sn-surface-elevated)",
                          }}
                        >
                          <Stack spacing={1}>
                            <Typography sx={{ fontWeight: 900 }}>{recipe.title}</Typography>
                            <Typography color="text.secondary" variant="body2">
                              {recipe.description}
                            </Typography>
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                              <Chip label={`${recipe.calories} ${labels.kcal}`} size="small" />
                              <Chip
                                label={`${recipe.ingredients.length} ${labels.ingredients}`}
                                size="small"
                              />
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              </>
            ) : null}
          </Stack>
        ) : null}

        {activeTab === "articles" ? (
          <Stack spacing={1.2}>
            <SectionHeader title={labels.savedArticles} />
            {visibleSavedPosts.length === 0 ? (
              <Typography color="text.secondary">{labels.noSavedArticles}</Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                  gap: 1,
                }}
              >
                {visibleSavedPosts.map((post) => (
                  <Box
                    key={post.id}
                    sx={{
                      p: 1.35,
                      borderRadius: 1,
                      border: "1px solid var(--sn-border-soft)",
                      bgcolor: "var(--sn-surface-elevated)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        <Chip label={labels.community} size="small" />
                        <Chip label={post.type} size="small" />
                      </Stack>
                      <Typography sx={{ fontWeight: 900 }}>{post.title}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {post.body}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  );
};

export default NutritionLibraryPanel;
