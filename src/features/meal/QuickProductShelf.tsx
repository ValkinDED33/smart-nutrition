import { Box, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { ProductCard } from "./ProductCard";
import { selectRecentProducts, selectSavedProducts } from "./selectors";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";

interface Props {
  mealType: MealType;
}

export const QuickProductShelf = ({ mealType }: Props) => {
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const { t } = useLanguage();

  const renderGrid = (products: typeof savedProducts) => (
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
      {products.map((product) => (
        <ProductCard
          key={product.barcode?.trim() || product.id}
          product={product}
          mealType={mealType}
          origin="manual"
        />
      ))}
    </Box>
  );

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
      <Stack spacing={2.5}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("quickShelf.title")}
        </Typography>

        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>{t("quickShelf.saved")}</Typography>
          {savedProducts.length === 0 ? (
            <Typography color="text.secondary">{t("quickShelf.savedEmpty")}</Typography>
          ) : (
            renderGrid(savedProducts.slice(0, 6))
          )}
        </Stack>

        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>{t("quickShelf.recent")}</Typography>
          {recentProducts.length === 0 ? (
            <Typography color="text.secondary">{t("quickShelf.recentEmpty")}</Typography>
          ) : (
            renderGrid(recentProducts.slice(0, 6))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
