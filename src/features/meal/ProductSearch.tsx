import { useEffect, useState } from "react";
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

interface Props {
  mealType: MealType;
}

export const ProductSearch = ({ mealType }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const normalizedQuery = query.trim();
  const displayResults = normalizedQuery ? results : getFeaturedProducts(12);

  const text =
    language === "pl"
      ? {
          title: "Wyszukiwanie produktów",
          subtitle:
            "Szukaj po nazwie, marce i popularnych aliasach. Wyniki łączą katalog lokalny i bazę online.",
          placeholder: "Np. ser, mięso, pomidor, jajko, jogurt, ryż",
          clear: "Wyczyść",
          featured: "Polecane produkty na start",
          loading: "Szukam produktów...",
          empty: "Brak produktów dla tego zapytania. Spróbuj krótszej nazwy albo innego słowa.",
        }
      : {
          title: "Пошук продуктів",
          subtitle:
            "Шукай за назвою, брендом і популярними варіантами написання. Результати поєднують локальний каталог і онлайн-базу.",
          placeholder: "Наприклад: сир, м'ясо, помідор, яйце, йогурт, рис",
          clear: "Очистити",
          featured: "Стартова добірка продуктів",
          loading: "Шукаю продукти...",
          empty: "Продукти за цим запитом не знайдені. Спробуй коротшу назву або інше слово.",
        };

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
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            label={text.placeholder}
          />
          <Button
            variant="outlined"
            onClick={handleClear}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {text.clear}
          </Button>
        </Stack>

        {!normalizedQuery && (
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {text.featured}
          </Typography>
        )}

        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">{text.loading}</Typography>
          </Stack>
        ) : null}

        {displayResults.length === 0 ? (
          <Typography color="text.secondary">{text.empty}</Typography>
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
