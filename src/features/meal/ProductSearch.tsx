import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ProductCard } from "./ProductCard";
import type { MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import { getFeaturedProducts } from "../../shared/lib/mockProducts";
import { searchProducts } from "../../shared/api/products";
import { useLanguage } from "../../shared/language";
import { selectPersonalBarcodeProducts } from "./selectors";

interface Props {
  mealType: MealType;
}

export const ProductSearch = ({ mealType }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const { t } = useLanguage();
  const normalizedQuery = query.trim();
  const displayResults = useMemo(() => {
    if (!normalizedQuery) {
      return getFeaturedProducts(12);
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

    [...localMatches, ...results].forEach((product) => {
      const key =
        product.barcode?.trim() ||
        `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

      if (!merged.has(key)) {
        merged.set(key, product);
      }
    });

    return [...merged.values()];
  }, [normalizedQuery, personalBarcodeProducts, results]);

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
