import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
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
import { addProduct, applyMealTemplate, saveProduct } from "./mealSlice";
import {
  selectMealTemplates,
  selectSavedProducts,
} from "./selectors";
import { searchProducts } from "../../shared/api/products";

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
  const onlineProductsQuery = useQuery({
    queryKey: ["nutrition-library-products", debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: mode === "library",
  });
  const onlineProducts = onlineProductsQuery.data ?? [];

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
          { title: labels.readyMeals, products: visibleReadyMeals, empty: labels.noResults },
          { title: labels.onlineProducts, products: visibleOnlineProducts, empty: labels.noResults },
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
                              border: "1px solid rgba(15,23,42,0.08)",
                              bgcolor: "rgba(255,255,255,0.72)",
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
                                    dispatch(addProduct({ product, quantity: 100, mealType }))
                                  }
                                >
                                  {labels.add100} {product.unit}
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => dispatch(saveProduct(product))}
                                  disabled={isSaved}
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
                        border: "1px solid rgba(15,23,42,0.08)",
                        bgcolor: "rgba(255,255,255,0.72)",
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
                          onClick={() => dispatch(applyMealTemplate(template.id))}
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
                            border: "1px solid rgba(15,23,42,0.08)",
                            bgcolor: "rgba(255,255,255,0.72)",
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
                      border: "1px solid rgba(15,23,42,0.08)",
                      bgcolor: "rgba(255,255,255,0.72)",
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
