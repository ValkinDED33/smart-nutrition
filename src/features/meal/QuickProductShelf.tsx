import { useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { ProductCard } from "./ProductCard";
import { selectRecentProducts, selectSavedProducts } from "./selectors";
import type { MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import type { RootState } from "../../app/store";
import { productMatchesPreferences } from "@domain/user/preferences";
import { SectionTabs } from "../../shared/ui/SectionTabs";

interface Props {
  mealType: MealType;
}

type ShelfSection = "saved" | "recent";

export const QuickProductShelf = ({ mealType }: Props) => {
  const [activeSection, setActiveSection] = useState<ShelfSection>("saved");
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

  const sections = [
    {
      id: "saved",
      label: t("quickShelf.saved"),
      badge: filteredSavedProducts.length,
    },
    {
      id: "recent",
      label: t("quickShelf.recent"),
      badge: filteredRecentProducts.length,
    },
  ];
  const activeProducts =
    activeSection === "saved" ? filteredSavedProducts : filteredRecentProducts;
  const activeEmptyText =
    activeSection === "saved" ? t("quickShelf.savedEmpty") : t("quickShelf.recentEmpty");

  const renderGrid = (products: typeof savedProducts) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: { xs: 1.4, md: 1.75 },
        alignItems: "start",
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.barcode?.trim() || product.id}
          product={product}
          mealType={mealType}
          origin="manual"
          compact
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
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("quickShelf.title")}
        </Typography>

        <SectionTabs
          sections={sections}
          activeSection={activeSection}
          onChange={(sectionId) => setActiveSection(sectionId as ShelfSection)}
          ariaLabel="Quick product shelf sections"
        />

        {activeProducts.length === 0 ? (
          <Typography color="text.secondary">{activeEmptyText}</Typography>
        ) : (
          renderGrid(activeProducts)
        )}
      </Stack>
    </Paper>
  );
};
