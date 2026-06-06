import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Box,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ProductCard } from "./ProductCard";
import type { MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import { searchProducts } from "../../shared/api/products";
import { useLanguage } from "../../shared/language";
import { selectPersonalBarcodeProducts } from "./selectors";
import { productMatchesPreferences } from "@domain/user/preferences";
import type { RootState } from "../../app/store";
import {
  getProductCategoryKey,
  getProductCategoryLabel,
} from "@domain/products/productCategory";
import {
  createProductKey,
  normalizeBarcode,
} from "./productIdentity";
import { fuzzySearchProducts } from "../../shared/lib/fuzzySearch";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useMealSearchStore } from "@features/meal/model/searchStore";

interface Props {
  mealType: MealType;
}

const suggestionCopy = {
  uk: {
    title: "Швидкі підказки",
    hint: "Натисніть підказку, щоб швидко підставити запит.",
    searchLabel: "Пошук їжі",
    quickTitle: "Популярне для швидкого старту",
    recentTitle: "Останні пошуки",
    clearRecent: "Очистити історію",
    results: "Знайдено",
    duplicateTitle: "Асистент бази",
    duplicateAdvice:
      "Ця страва вже є. Якщо створити нову, з'явиться дублікат; краще використати готовий запис.",
    presets: ["Oats", "Greek yogurt", "Boiled egg", "Chicken breast", "Rice cooked", "Banana"],
  },
  pl: {
    title: "Szybkie podpowiedzi",
    hint: "Kliknij podpowiedź, aby szybko uzupełnić wyszukiwanie.",
    searchLabel: "Szukaj jedzenia",
    quickTitle: "Popularne na szybki start",
    recentTitle: "Ostatnie wyszukiwania",
    clearRecent: "Wyczyść historię",
    results: "Znaleziono",
    duplicateTitle: "Asystent bazy",
    duplicateAdvice:
      "Ten wpis już istnieje. Jeśli utworzysz nowy, dodasz duplikat; lepiej użyć gotowego wpisu.",
    presets: ["Oats", "Greek yogurt", "Boiled egg", "Chicken breast", "Rice cooked", "Banana"],
  },
} as const;

const genericBrands = new Set(["Manual", "Homemade", "Restaurant", "Fast food"]);

const normalizeSuggestionLabel = (value: string) => value.trim().toLowerCase();

const formatSuggestionLabel = (product: Product) => {
  const name = product.name.trim();
  const brand = product.brand?.trim();

  if (!brand || genericBrands.has(brand)) {
    return name;
  }

  return name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
};

export const ProductSearch = ({ mealType }: Props) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const {
    categoryFilter,
    clearRecentQueries,
    recentQueries,
    rememberQuery,
    setCategoryFilter,
  } = useMealSearchStore();
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const assistantName = useSelector((state: RootState) => state.profile.assistant.name);
  const { language, t } = useLanguage();
  const normalizedQuery = query.trim();
  const copy = suggestionCopy[language];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedQuery]);

  const productQuery = useQuery({
    queryKey: ["product-search", debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
  });

  const results = useMemo(() => productQuery.data ?? [], [productQuery.data]);
  const isLoading =
    normalizedQuery.length > 0 &&
    (normalizedQuery !== debouncedQuery ||
      productQuery.isLoading ||
      productQuery.isFetching);

  const autocompleteSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const queryLower = normalizedQuery.toLowerCase();
    const normalizedBarcodeQuery = normalizeBarcode(normalizedQuery);
    const suggestions = new Map<string, string>();

    const addSuggestion = (value: string) => {
      const trimmedValue = value.trim();
      const normalizedValue = normalizeSuggestionLabel(trimmedValue);

      if (
        trimmedValue.length < 2 ||
        normalizedValue === queryLower ||
        suggestions.has(normalizedValue)
      ) {
        return;
      }

      suggestions.set(normalizedValue, trimmedValue);
    };

    personalBarcodeProducts
      .filter((product) => {
        const name = product.name.toLowerCase();
        const brand = product.brand?.toLowerCase() ?? "";
        const barcode = normalizeBarcode(product.barcode ?? "");

        return (
          name.includes(queryLower) ||
          brand.includes(queryLower) ||
          (normalizedBarcodeQuery.length > 0 &&
            barcode.includes(normalizedBarcodeQuery))
        );
      })
      .filter((product) => productMatchesPreferences(product, preferences))
      .slice(0, 4)
      .forEach((product) => addSuggestion(formatSuggestionLabel(product)));

    results
      .filter((product) => productMatchesPreferences(product, preferences))
      .forEach((product) => addSuggestion(formatSuggestionLabel(product)));

    return [...suggestions.values()].slice(0, 6);
  }, [normalizedQuery, personalBarcodeProducts, preferences, results]);

  const displayResults = useMemo(() => {
    if (!normalizedQuery) {
      return results.filter((product) =>
        productMatchesPreferences(product, preferences)
      );
    }

    const queryLower = normalizedQuery.toLowerCase();
    const normalizedBarcodeQuery = normalizeBarcode(normalizedQuery);
    const localMatches = personalBarcodeProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const brand = product.brand?.toLowerCase() ?? "";
      const barcode = normalizeBarcode(product.barcode ?? "");

      return (
        name.includes(queryLower) ||
        brand.includes(queryLower) ||
        (normalizedBarcodeQuery.length > 0 &&
          barcode.includes(normalizedBarcodeQuery))
      );
    });

    const merged = new Map<string, Product>();

    [...localMatches, ...results].forEach((product) => {
      const key = createProductKey(product);

      if (!merged.has(key)) {
        merged.set(key, product);
      }
    });

    return [...merged.values()].filter((product) =>
      productMatchesPreferences(product, preferences)
    );
  }, [normalizedQuery, personalBarcodeProducts, preferences, results]);

  const duplicateAdvice = useMemo(() => {
    if (normalizedQuery.length < 3) {
      return [];
    }

    const merged = new Map<string, Product>();

    [...personalBarcodeProducts, ...results].forEach((product) => {
      const key = createProductKey(product);

      if (!merged.has(key)) {
        merged.set(key, product);
      }
    });

    return fuzzySearchProducts(normalizedQuery, [...merged.values()], 3).filter(
      (match) => match.score >= 70
    );
  }, [normalizedQuery, personalBarcodeProducts, results]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, string>();

    displayResults.forEach((product) => {
      const categoryKey = getProductCategoryKey(product);

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, getProductCategoryLabel(categoryKey, language));
      }
    });

    return [...categoryMap.entries()].sort((left, right) =>
      left[1].localeCompare(right[1], language)
    );
  }, [displayResults, language]);

  const activeCategoryFilter =
    categoryFilter === "all" ||
    availableCategories.some(([categoryKey]) => categoryKey === categoryFilter)
      ? categoryFilter
      : "all";

  const filteredResults = useMemo(() => {
    if (activeCategoryFilter === "all") {
      return displayResults;
    }

    return displayResults.filter(
      (product) => getProductCategoryKey(product) === activeCategoryFilter
    );
  }, [activeCategoryFilter, displayResults]);

  useEffect(() => {
    if (debouncedQuery && results.length > 0) {
      rememberQuery(debouncedQuery);
    }
  }, [debouncedQuery, rememberQuery, results.length]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
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
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("productSearch.title")}
        </Typography>
        <Typography color="text.secondary">{t("productSearch.subtitle")}</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            label={copy.searchLabel}
            placeholder={t("productSearch.placeholder")}
            autoComplete="off"
          />
          <Button
            variant="outlined"
            onClick={handleClear}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("productSearch.clear")}
          </Button>
        </Stack>

        {!normalizedQuery && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.quickTitle}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {copy.presets.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  clickable
                  onClick={() => handleQueryChange(preset)}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {!normalizedQuery && recentQueries.length > 0 && (
          <Stack spacing={1}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography sx={{ fontWeight: 700 }}>{copy.recentTitle}</Typography>
              <Button size="small" onClick={clearRecentQueries}>
                {copy.clearRecent}
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {recentQueries.map((recentQuery) => (
                <Chip
                  key={recentQuery}
                  label={recentQuery}
                  clickable
                  onClick={() => handleQueryChange(recentQuery)}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Stack>
        )}

        {autocompleteSuggestions.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.title}</Typography>
            <Typography color="text.secondary" variant="body2">
              {copy.hint}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {autocompleteSuggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  clickable
                  onClick={() => handleQueryChange(suggestion)}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {duplicateAdvice.length > 0 && (
          <Alert
            severity="info"
            icon={<AssistantAvatar name={assistantName} size={34} mood="coach" active />}
            sx={{ alignItems: "center" }}
          >
            <Stack spacing={0.8}>
              <Typography sx={{ fontWeight: 800 }}>{copy.duplicateTitle}</Typography>
              <Typography>{copy.duplicateAdvice}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {duplicateAdvice.map(({ item }) => (
                  <Chip
                    key={createProductKey(item)}
                    label={formatSuggestionLabel(item)}
                    clickable
                    onClick={() => handleQueryChange(formatSuggestionLabel(item))}
                  />
                ))}
              </Stack>
            </Stack>
          </Alert>
        )}

        {!normalizedQuery && (
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {t("productSearch.featured")}
          </Typography>
        )}

        {availableCategories.length > 1 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{t("productSearch.categories")}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={t("productSearch.allCategories")}
                clickable
                color={activeCategoryFilter === "all" ? "primary" : "default"}
                variant={activeCategoryFilter === "all" ? "filled" : "outlined"}
                onClick={() => setCategoryFilter("all")}
              />
              {availableCategories.map(([categoryKey, label]) => (
                <Chip
                  key={categoryKey}
                  label={label}
                  clickable
                  color={activeCategoryFilter === categoryKey ? "primary" : "default"}
                  variant={activeCategoryFilter === categoryKey ? "filled" : "outlined"}
                  onClick={() => setCategoryFilter(categoryKey)}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">{t("productSearch.loading")}</Typography>
          </Stack>
        ) : null}

        {filteredResults.length === 0 ? (
          <Typography color="text.secondary">{t("productSearch.empty")}</Typography>
        ) : (
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              {copy.results}: {filteredResults.length}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {filteredResults.map((product) => (
                <motion.div
                  key={product.barcode?.trim() || product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ProductCard
                    product={product}
                    mealType={mealType}
                    origin="manual"
                  />
                </motion.div>
              ))}
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
