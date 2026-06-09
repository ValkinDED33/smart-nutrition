import { Box, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { ProductCard } from "./ProductCard";
import { selectRecentProducts, selectSavedProducts } from "./selectors";
import type { MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import type { RootState } from "../../app/store";
import { productMatchesPreferences } from "@domain/user/preferences";

interface Props {
  mealType: MealType;
}

export const QuickProductShelf = ({ mealType }: Props) => {
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const { t } = useLanguage();
  const filteredSavedProducts = savedProducts
    .filter((product) => productMatchesPreferences(product, preferences))
    .slice(0, 6);
  const filteredRecentProducts = recentProducts
    .filter((product) => productMatchesPreferences(product, preferences))
    .slice(0, 6);

  const renderGrid = (products: typeof savedProducts) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
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
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2.5}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("quickShelf.title")}
        </Typography>

        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>{t("quickShelf.saved")}</Typography>
          {filteredSavedProducts.length === 0 ? (
            <Typography color="text.secondary">{t("quickShelf.savedEmpty")}</Typography>
          ) : (
            renderGrid(filteredSavedProducts)
          )}
        </Stack>

        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>{t("quickShelf.recent")}</Typography>
          {filteredRecentProducts.length === 0 ? (
            <Typography color="text.secondary">{t("quickShelf.recentEmpty")}</Typography>
          ) : (
            renderGrid(filteredRecentProducts)
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
