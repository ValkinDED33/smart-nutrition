import { useMemo, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { ProductCard } from "./ProductCard";
import type { MealType } from "../../shared/types/meal";
import { mockProducts } from "../../shared/lib/mockProducts";
import { useLanguage } from "../../shared/language";

interface Props {
  mealType: MealType;
}

export const ProductSearch = ({ mealType }: Props) => {
  const [query, setQuery] = useState("");
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Ręczne dodawanie produktów",
          placeholder: "Np. ser, mięso, pomidor, jajko",
          clear: "Wyczyść",
          empty: "Brak produktów dla tego zapytania. Spróbuj krótszej nazwy.",
        }
      : {
          title: "Ручне додавання продуктів",
          placeholder: "Наприклад: сир, м'ясо, помідор, яйце",
          clear: "Очистити",
          empty: "Продукти за цим запитом не знайдені. Спробуй коротшу назву.",
        };

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return mockProducts.slice(0, 8);
    }

    return mockProducts.filter((product) =>
      product.name.toLowerCase().includes(normalized)
    );
  }, [query]);

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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            label={text.placeholder}
          />
          <Button
            variant="outlined"
            onClick={() => setQuery("")}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {text.clear}
          </Button>
        </Stack>

        {results.length === 0 ? (
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
            {results.map((product) => (
              <ProductCard
                key={product.id}
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
