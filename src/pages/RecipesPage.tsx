import { useState } from "react";
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { FridgeRecipePlanner } from "../features/fridge/FridgeRecipePlanner";
import { RecipeSection } from "../features/meal/RecipeSection";
import { SmartRecommendations } from "../features/meal/SmartRecommendations";
import { useLanguage } from "../shared/language";
import type { MealType } from "@domain/meal/types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const RecipesPage = () => {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const { t } = useLanguage();
  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.8}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 32, md: 40 } }}>
          {t("page.recipes.title")}
        </Typography>
        <Typography color="text.secondary">{t("page.recipes.subtitle")}</Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <ToggleButtonGroup
          exclusive
          value={mealType}
          onChange={(_, value: MealType | null) => {
            if (value) {
              setMealType(value);
            }
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 1,
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 1,
              m: 0,
              textTransform: "none",
              fontWeight: 800,
            },
          }}
        >
          {mealTypes.map((type) => (
            <ToggleButton key={type} value={type}>
              {mealLabels[type]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={2.5}>
          <RecipeSection mealType={mealType} />
          <FridgeRecipePlanner mealType={mealType} />
        </Stack>
        <SmartRecommendations />
      </Box>
    </Stack>
  );
};

export default RecipesPage;
