import { useState } from "react";
import { Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FridgeRecipePlanner } from "../features/fridge/FridgeRecipePlanner";
import { NutritionLibraryPanel } from "../features/meal/NutritionLibraryPanel";
import { RecipeSection } from "../features/meal/RecipeSection";
import { SmartRecommendations } from "../features/meal/SmartRecommendations";
import { PageShell } from "../shared/ui/PageShell";
import { SectionTabs } from "../shared/ui/SectionTabs";
import { useLanguage } from "../shared/language";
import type { MealType } from "@domain/meal/types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
type RecipesSection = "library" | "saved" | "recipes" | "fridge" | "recommendations";

const sectionCopy = {
  uk: {
    library: "Бібліотека",
    saved: "Збережене",
    recipes: "Рецепти",
    fridge: "Холодильник",
    recommendations: "Поради",
  },
  pl: {
    library: "Biblioteka",
    saved: "Zapisane",
    recipes: "Przepisy",
    fridge: "Lodówka",
    recommendations: "Rekomendacje",
  },
  en: {
    library: "Library",
    saved: "Saved",
    recipes: "Recipes",
    fridge: "Fridge",
    recommendations: "Tips",
  },
} as const;

const RecipesPage = () => {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [activeSection, setActiveSection] = useState<RecipesSection>("library");
  const { appLanguage, t } = useLanguage();
  const sections = sectionCopy[appLanguage];
  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  return (
    <PageShell title={t("page.recipes.title")} subtitle={t("page.recipes.subtitle")}>
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

      <SectionTabs
        sections={[
          { id: "library", label: sections.library },
          { id: "saved", label: sections.saved },
          { id: "recipes", label: sections.recipes },
          { id: "fridge", label: sections.fridge },
          { id: "recommendations", label: sections.recommendations },
        ]}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as RecipesSection)}
        ariaLabel="Recipe page sections"
      />

      {activeSection === "library" ? (
        <NutritionLibraryPanel mealType={mealType} mode="library" />
      ) : null}

      {activeSection === "saved" ? (
        <NutritionLibraryPanel mealType={mealType} mode="saved" />
      ) : null}

      {activeSection === "recipes" ? <RecipeSection mealType={mealType} /> : null}

      {activeSection === "fridge" ? <FridgeRecipePlanner mealType={mealType} /> : null}

      {activeSection === "recommendations" ? <SmartRecommendations /> : null}
    </PageShell>
  );
};

export default RecipesPage;
