import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ProductCard } from "./ProductCard";
import type { MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import {
  getFeaturedProducts,
  searchLocalProducts,
} from "../../shared/lib/mockProducts";
import { searchProducts } from "../../shared/api/products";
import { useLanguage } from "../../shared/language";
import { selectPersonalBarcodeProducts } from "./selectors";
import { productMatchesPreferences } from "../../shared/lib/preferences";
import type { RootState } from "../../app/store";

interface Props {
  mealType: MealType;
}

const suggestionCopy = {
  uk: {
    title: "Швидкі підказки",
    hint: "Натисніть підказку, щоб швидко підставити запит.",
  },
  pl: {
    title: "Szybkie podpowiedzi",
    hint: "Kliknij podpowiedź, aby szybko uzupełnić wyszukiwanie.",
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
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const { language, t } = useLanguage();
  const normalizedQuery = query.trim();
  const copy = suggestionCopy[language];

  const rankedLocalResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return searchLocalProducts(normalizedQuery, 12).filter((product) =>
      productMatchesPreferences(product, preferences)
    );
  }, [normalizedQuery, preferences]);

  const autocompleteSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const queryLower = normalizedQuery.toLowerCase();
    const normalizedBarcodeQuery = normalizedQuery.replace(/\D/g, "");
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
        const barcode = product.barcode?.replace(/\D/g, "") ?? "";

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

    [...rankedLocalResults, ...results]
      .filter((product) => productMatchesPreferences(product, preferences))
      .forEach((product) => addSuggestion(formatSuggestionLabel(product)));

    return [...suggestions.values()].slice(0, 6);
  }, [normalizedQuery, personalBarcodeProducts, preferences, rankedLocalResults, results]);

  const displayResults = useMemo(() => {
    if (!normalizedQuery) {
      return getFeaturedProducts(12).filter((product) =>
        productMatchesPreferences(product, preferences)
      );
    }

    const queryLower = normalizedQuery.toLowerCase();
    const normalizedBarcodeQuery = normalizedQuery.replace(/\D/g, "");
    const localMatches = personalBarcodeProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const brand = product.brand?.toLowerCase() ?? "";
      const barcode = product.barcode?.replace(/\D/g, "") ?? "";

      return (
        name.includes(queryLower) ||
        brand.includes(queryLower) ||
        (normalizedBarcodeQuery.length > 0 &&
          barcode.includes(normalizedBarcodeQuery))
      );
    });

    const merged = new Map<string, Product>();

    [...localMatches, ...rankedLocalResults, ...results].forEach((product) => {
      const key =
        product.barcode?.trim() ||
        `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

      if (!merged.has(key)) {
        merged.set(key, product);
      }
    });

    return [...merged.values()].filter((product) =>
      productMatchesPreferences(product, preferences)
    );
  }, [normalizedQuery, personalBarcodeProducts, preferences, rankedLocalResults, results]);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedQuery) {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const nextResults = await searchProducts(normalizedQuery);

      if (!cancelled) {
        setResults(nextResults);
        setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setIsLoading(value.trim().length > 0);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsLoading(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("productSearch.title")}
        </Typography>
        <Typography color="text.secondary">{t("productSearch.subtitle")}</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            label={t("productSearch.placeholder")}
          />
          <Button
            variant="outlined"
            onClick={handleClear}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("productSearch.clear")}
          </Button>
        </Stack>

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

        {!normalizedQuery && (
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {t("productSearch.featured")}
          </Typography>
        )}

        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">{t("productSearch.loading")}</Typography>
          </Stack>
        ) : null}

        {displayResults.length === 0 ? (
          <Typography color="text.secondary">{t("productSearch.empty")}</Typography>
        ) : (
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
            {displayResults.map((product) => (
              <ProductCard
                key={product.barcode?.trim() || product.id}
                product={product}
                mealType={mealType}
                origin="manual"
              />
            ))}
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
