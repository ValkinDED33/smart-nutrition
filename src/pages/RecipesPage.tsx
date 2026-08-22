import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { BookOpen, ChefHat, Refrigerator, ScanLine, Sparkles, Star } from "lucide-react";
import type { RootState } from "../app/store";
import {
  AIMasterBlueprintPanel,
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionTabs,
} from "../shared/ui";
import { useLanguage } from "../shared/language";
import type { MealType } from "@domain/meal/types";
import type { AppLanguage } from "../shared/types/i18n";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

const FridgeRecipePlanner = lazy(() =>
  import("../features/fridge/FridgeRecipePlanner").then((module) => ({
    default: module.FridgeRecipePlanner,
  }))
);
const NutritionLibraryPanel = lazy(() => import("../features/meal/NutritionLibraryPanel"));
const RecipeSection = lazy(() =>
  import("../features/meal/RecipeSection").then((module) => ({
    default: module.RecipeSection,
  }))
);
const SmartRecommendations = lazy(() =>
  import("../features/meal/SmartRecommendations").then((module) => ({
    default: module.SmartRecommendations,
  }))
);

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
type RecipesSection = "library" | "saved" | "recipes" | "fridge" | "recommendations";

const sectionCopy = {
  uk: {
    library: "Бібліотека",
    saved: "Збережене",
    recipes: "Рецепти",
    fridge: "Холодильник",
    recommendations: "Поради",
    sectionsAriaLabel: "Розділи рецептів",
    blueprintTitle: "Кухня помічника",
    blueprintSubtitle:
      "Рецепти не склад: помічник веде від продукту до страви, порції, збереження і щоденника.",
    blueprintPatterns: {
      library: "Бібліотека",
      saved: "Збережене",
      recipes: "Рецепти",
      fridge: "Холодильник",
      recommendations: "AI-поради",
      scanner: "Скан їжі",
    },
    blueprintPatternDescriptions: {
      library: "Перевірити продукти, поживність, користь і обмеження.",
      saved: "Повернути улюблені варіанти без повторного пошуку.",
      recipes: "Зібрати страву з БЖВ, порцією і зрозумілим описом.",
      fridge: "Показати, що можна приготувати з того, що є вдома.",
      recommendations: "Отримати пропозиції під цілі, день і контекст.",
      scanner: "Відкрити сканер, щоб продукт став реальним записом.",
    },
  },
  pl: {
    library: "Biblioteka",
    saved: "Zapisane",
    recipes: "Przepisy",
    fridge: "Lodówka",
    recommendations: "Rekomendacje",
    sectionsAriaLabel: "Sekcje przepisów",
    blueprintTitle: "Kuchnia asystenta",
    blueprintSubtitle:
      "Przepisy nie są magazynem: asystent prowadzi od produktu do dania, porcji, zapisu i dziennika.",
    blueprintPatterns: {
      library: "Biblioteka",
      saved: "Zapisane",
      recipes: "Przepisy",
      fridge: "Lodówka",
      recommendations: "Rady AI",
      scanner: "Skan jedzenia",
    },
    blueprintPatternDescriptions: {
      library: "Sprawdź produkty, wartości, korzyści i ograniczenia.",
      saved: "Wróć do ulubionych opcji bez ponownego szukania.",
      recipes: "Złóż danie z makro, porcją i jasnym opisem.",
      fridge: "Pokaż, co ugotować z tego, co jest w domu.",
      recommendations: "Dostań propozycje pod cel, dzień i kontekst.",
      scanner: "Otwórz skaner, żeby produkt stał się realnym wpisem.",
    },
  },
  en: {
    library: "Library",
    saved: "Saved",
    recipes: "Recipes",
    fridge: "Fridge",
    recommendations: "Tips",
    sectionsAriaLabel: "Recipe sections",
    blueprintTitle: "Assistant kitchen",
    blueprintSubtitle:
      "Recipes are not a warehouse: the assistant guides product, dish, portion, save, and diary flow.",
    blueprintPatterns: {
      library: "Library",
      saved: "Saved",
      recipes: "Recipes",
      fridge: "Fridge",
      recommendations: "AI tips",
      scanner: "Food scan",
    },
    blueprintPatternDescriptions: {
      library: "Check products, nutrients, benefits, and limits.",
      saved: "Return to favorites without searching again.",
      recipes: "Build a dish with macros, portion, and clear copy.",
      fridge: "Show what can be cooked from what is already home.",
      recommendations: "Get ideas for the goal, day, and context.",
      scanner: "Open scanner so the product becomes a real entry.",
    },
  },
} as const;

type RecipesSectionCopy = (typeof sectionCopy)[keyof typeof sectionCopy];
type Translate = ReturnType<typeof useLanguage>["t"];

const getRecipesSectionCopy = (language: AppLanguage): RecipesSectionCopy => {
  switch (language) {
    case "uk":
      return sectionCopy.uk;
    case "pl":
      return sectionCopy.pl;
    case "en":
    default:
      return sectionCopy.en;
  }
};

const getRecipesSectionLabel = (
  copy: RecipesSectionCopy,
  section: RecipesSection
): string => {
  switch (section) {
    case "saved":
      return copy.saved;
    case "recipes":
      return copy.recipes;
    case "fridge":
      return copy.fridge;
    case "recommendations":
      return copy.recommendations;
    case "library":
    default:
      return copy.library;
  }
};

const getMealTypeLabel = (t: Translate, type: MealType): string => {
  switch (type) {
    case "breakfast":
      return t("mealType.breakfast");
    case "dinner":
      return t("mealType.dinner");
    case "snack":
      return t("mealType.snack");
    case "lunch":
    default:
      return t("mealType.lunch");
  }
};

const RecipesPage = () => {
  const navigate = useNavigate();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [activeSection, setActiveSection] = useState<RecipesSection>("library");
  const { appLanguage, t } = useLanguage();
  const sections = getRecipesSectionCopy(appLanguage);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    getRecipesSectionLabel(sections, activeSection)
  );
  const recipeBlueprintPatterns = [
    {
      key: "library",
      label: sections.blueprintPatterns.library,
      description: sections.blueprintPatternDescriptions.library,
      icon: BookOpen,
      accent: "#22d3ee",
      onClick: () => setActiveSection("library"),
    },
    {
      key: "saved",
      label: sections.blueprintPatterns.saved,
      description: sections.blueprintPatternDescriptions.saved,
      icon: Star,
      accent: "#f59e0b",
      onClick: () => setActiveSection("saved"),
    },
    {
      key: "recipes",
      label: sections.blueprintPatterns.recipes,
      description: sections.blueprintPatternDescriptions.recipes,
      icon: ChefHat,
      accent: "#84cc16",
      onClick: () => setActiveSection("recipes"),
    },
    {
      key: "fridge",
      label: sections.blueprintPatterns.fridge,
      description: sections.blueprintPatternDescriptions.fridge,
      icon: Refrigerator,
      accent: "#14b8a6",
      onClick: () => setActiveSection("fridge"),
    },
    {
      key: "recommendations",
      label: sections.blueprintPatterns.recommendations,
      description: sections.blueprintPatternDescriptions.recommendations,
      icon: Sparkles,
      accent: "#a78bfa",
      onClick: () => setActiveSection("recommendations"),
    },
    {
      key: "scanner",
      label: sections.blueprintPatterns.scanner,
      description: sections.blueprintPatternDescriptions.scanner,
      icon: ScanLine,
      accent: "#60a5fa",
      onClick: () => navigate("/meals?mode=barcode"),
    },
  ];

  return (
    <PageShell
      title={t("page.recipes.title")}
      subtitle={t("page.recipes.subtitle")}
      assistantHint={<EcosystemPulse focus="recipes" />}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          backgroundColor: "var(--sn-surface-elevated)",
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
              {getMealTypeLabel(t, type)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      <AIMasterBlueprintPanel
        eyebrow="Smart Nutrition AI"
        title={sections.blueprintTitle}
        description={sections.blueprintSubtitle}
        patterns={recipeBlueprintPatterns}
        assistantName={assistantDisplayName}
        assistantVariant={assistant.companionKind}
      />

      <SectionTabs
        sections={[
          { id: "library", label: getRecipesSectionLabel(sections, "library") },
          { id: "saved", label: getRecipesSectionLabel(sections, "saved") },
          { id: "recipes", label: getRecipesSectionLabel(sections, "recipes") },
          { id: "fridge", label: getRecipesSectionLabel(sections, "fridge") },
          {
            id: "recommendations",
            label: getRecipesSectionLabel(sections, "recommendations"),
          },
        ]}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as RecipesSection)}
        ariaLabel={sections.sectionsAriaLabel}
      />

      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey={`recipes:${activeSection}`}
      >
        <Suspense fallback={<LoadingSkeleton bodyRows={5} />}>
          {activeSection === "library" ? (
            <NutritionLibraryPanel mealType={mealType} mode="library" />
          ) : null}

          {activeSection === "saved" ? (
            <NutritionLibraryPanel mealType={mealType} mode="saved" />
          ) : null}

          {activeSection === "recipes" ? <RecipeSection mealType={mealType} /> : null}

          {activeSection === "fridge" ? <FridgeRecipePlanner mealType={mealType} /> : null}

          {activeSection === "recommendations" ? <SmartRecommendations /> : null}
        </Suspense>
      </LazyModuleBoundary>
    </PageShell>
  );
};

export default RecipesPage;
