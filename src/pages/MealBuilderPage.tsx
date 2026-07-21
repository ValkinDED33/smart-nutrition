import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ScanBarcode } from "lucide-react";
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { RootState } from "../app/store";
import { FoodCommandCenter } from "../features/meal/FoodCommandCenter";
import { MealEntryEditorPanel } from "../features/meal/MealEntryEditorPanel";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import type { MealEntry, MealType } from "@domain/meal/types";
import { useLanguage } from "../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import type { AppLanguage } from "@shared/types/i18n";
import Loader from "../shared/components/Loader/PacmanLoader";
import { LazyModuleBoundary, PageShell, SectionCard, SectionTabs } from "@shared/ui";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import {
  createFoodCommandFocusQuery,
  normalizeFoodCommandFocus,
} from "@features/meal/foodCommandCenterModel";

const BarcodeScanner = lazy(() =>
  import("../features/meal/BarcodeScanner").then((module) => ({
    default: module.BarcodeScanner,
  }))
);
const PhotoMealAssistant = lazy(() =>
  import("../features/meal/PhotoMealAssistant").then((module) => ({
    default: module.PhotoMealAssistant,
  }))
);
const ProductSearch = lazy(() =>
  import("../features/meal/ProductSearch").then((module) => ({
    default: module.ProductSearch,
  }))
);
const QuickMealComposer = lazy(() =>
  import("../features/meal/QuickMealComposer").then((module) => ({
    default: module.QuickMealComposer,
  }))
);
const QuickProductShelf = lazy(() =>
  import("../features/meal/QuickProductShelf").then((module) => ({
    default: module.QuickProductShelf,
  }))
);
const NutritionLibraryPanel = lazy(() => import("../features/meal/NutritionLibraryPanel"));
const DailyHistoryExplorer = lazy(() =>
  import("../features/meal/DailyHistoryExplorer").then((module) => ({
    default: module.DailyHistoryExplorer,
  }))
);
const DailyMicronutrientsCard = lazy(() =>
  import("../features/meal/DailyMicronutrientsCard").then((module) => ({
    default: module.DailyMicronutrientsCard,
  }))
);
const FridgeRecipePlanner = lazy(() =>
  import("../features/fridge/FridgeRecipePlanner").then((module) => ({
    default: module.FridgeRecipePlanner,
  }))
);
const CatalogContributionCard = lazy(() =>
  import("../features/platform/CatalogContributionCard").then((module) => ({
    default: module.CatalogContributionCard,
  }))
);
const RecipeSection = lazy(() =>
  import("../features/meal/RecipeSection").then((module) => ({
    default: module.RecipeSection,
  }))
);
const TemplateVault = lazy(() =>
  import("../features/meal/TemplateVault").then((module) => ({
    default: module.TemplateVault,
  }))
);
const YesterdayRepeater = lazy(() =>
  import("../features/meal/YesterdayRepeater").then((module) => ({
    default: module.YesterdayRepeater,
  }))
);
const SmartRecommendations = lazy(() =>
  import("../features/meal/SmartRecommendations").then((module) => ({
    default: module.SmartRecommendations,
  }))
);

type MealInputMode = "photo" | "search" | "barcode";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SURFACE_ELEVATED_BACKGROUND = "var(--sn-surface-elevated)";
const BORDER_SOFT_COLOR = "var(--sn-border-soft)";
const SECONDARY_TEXT_COLOR = "text.secondary";
const COMMON_KCAL_KEY = "common.kcal";
const SINGLE_COLUMN_GRID = "minmax(0, 1fr)";
const MEAL_ADD_LAYOUT_GRID = `${SINGLE_COLUMN_GRID} minmax(300px, 340px)`;
const MEAL_ADD_LAYOUT_GRID_WIDE = `${SINGLE_COLUMN_GRID} 360px`;
const TEMPLATE_GRID_COLUMNS = `repeat(2, ${SINGLE_COLUMN_GRID})`;
const COMPACT_RADIUS = 1;

const normalizeMealInputMode = (value: string | null): MealInputMode =>
  value === "photo" || value === "barcode" ? value : "search";

const mealInputCopy = {
  uk: {
    advancedTitle: "Додаткові інструменти",
    advancedSubtitle:
      "Шаблони, повтори, холодильник і рецепти залишаються нижче, коли потрібна точніша збірка.",
    scanAction: "Відкрити сканер",
    loadingModule: "Завантажуємо інструмент",
    moduleErrorTitle: "Інструмент не завантажився",
    moduleErrorBody:
      "З'єднання могло перервати завантаження інструмента. Оновіть його і спробуйте ще раз.",
    reloadModule: "Оновити",
    sections: {
      day: "День",
      add: "Додати",
      scan: "Сканер",
      saved: "Збережене",
      history: "Історія",
      templates: "Шаблони",
      recommendations: "Поради",
    },
    addTools: {
      search: "Пошук",
      favorites: "Обране",
      composer: "Конструктор",
      scanner: "Сканер",
    },
    modes: {
      photo: {
        title: "Фото",
        body: "Фото тарілки → чернетка → швидке підтвердження.",
      },
      search: {
        title: "Пошук",
        body: "Назва продукту, улюблені позиції і швидкі порції.",
      },
      barcode: {
        title: "Штрихкод",
        body: "Камера або ручний код з упаковки.",
      },
    } satisfies Record<MealInputMode, { title: string; body: string }>,
  },
  pl: {
    advancedTitle: "Dodatkowe narzędzia",
    advancedSubtitle:
      "Szablony, powtórki, lodówka i przepisy zostają niżej, gdy potrzeba dokładniejszego składania.",
    scanAction: "Otwórz skaner",
    loadingModule: "Ładujemy narzędzie",
    moduleErrorTitle: "Narzędzie się nie załadowało",
    moduleErrorBody:
      "Połączenie mogło przerwać ładowanie narzędzia. Odśwież je i spróbuj ponownie.",
    reloadModule: "Odśwież",
    sections: {
      day: "Dzień",
      add: "Dodaj",
      scan: "Skaner",
      saved: "Zapisane",
      history: "Historia",
      templates: "Szablony",
      recommendations: "Rekomendacje",
    },
    addTools: {
      search: "Szukaj",
      favorites: "Ulubione",
      composer: "Konstruktor",
      scanner: "Skaner",
    },
    modes: {
      photo: {
        title: "Zdjęcie",
        body: "Zdjęcie talerza → szkic → szybkie potwierdzenie.",
      },
      search: {
        title: "Wyszukaj",
        body: "Nazwa produktu, ulubione pozycje i szybkie porcje.",
      },
      barcode: {
        title: "Kod kreskowy",
        body: "Kamera albo ręczny kod z opakowania.",
      },
    } satisfies Record<MealInputMode, { title: string; body: string }>,
  },
  en: {
    advancedTitle: "Additional tools",
    advancedSubtitle:
      "Templates, repeats, fridge planning, and recipes stay below when you need a more precise setup.",
    scanAction: "Open scanner",
    loadingModule: "Loading tool",
    moduleErrorTitle: "Tool did not load",
    moduleErrorBody:
      "The connection may have interrupted this tool. Refresh it and try again.",
    reloadModule: "Refresh",
    sections: {
      day: "Day",
      add: "Add",
      scan: "Scanner",
      saved: "Saved",
      history: "History",
      templates: "Templates",
      recommendations: "Tips",
    },
    addTools: {
      search: "Search",
      favorites: "Favorites",
      composer: "Builder",
      scanner: "Scanner",
    },
    modes: {
      photo: {
        title: "Photo",
        body: "Plate photo -> draft -> quick confirmation.",
      },
      search: {
        title: "Search",
        body: "Product name, favorite items, and quick portions.",
      },
      barcode: {
        title: "Barcode",
        body: "Camera or manual package code.",
      },
    } satisfies Record<MealInputMode, { title: string; body: string }>,
  },
} as const;

const getMealInputCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return mealInputCopy.pl;
    case "en":
      return mealInputCopy.en;
    case "uk":
    default:
      return mealInputCopy.uk;
  }
};

const createEmptyMealGroups = (): Record<MealType, MealEntry[]> => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

const addEntryToMealGroups = (
  groups: Record<MealType, MealEntry[]>,
  item: MealEntry
) => {
  switch (item.mealType) {
    case "lunch":
      groups.lunch.push(item);
      return groups;
    case "dinner":
      groups.dinner.push(item);
      return groups;
    case "snack":
      groups.snack.push(item);
      return groups;
    case "breakfast":
    default:
      groups.breakfast.push(item);
      return groups;
  }
};

const getMealEntriesForType = (
  groups: Record<MealType, MealEntry[]>,
  mealType: MealType
) => {
  switch (mealType) {
    case "lunch":
      return groups.lunch;
    case "dinner":
      return groups.dinner;
    case "snack":
      return groups.snack;
    case "breakfast":
    default:
      return groups.breakfast;
  }
};

type MealSection =
  | "day"
  | "add"
  | "scan"
  | "saved"
  | "history"
  | "templates"
  | "recommendations";
type AddTool = "search" | "favorites" | "composer" | "scanner";

const MealBuilderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useSelector(selectTodayMealItems);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const totals = useSelector(selectTodayMealTotalNutrients);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const { appLanguage, t } = useLanguage();
  const copy = getMealInputCopy(appLanguage);
  const inputMode = normalizeMealInputMode(searchParams.get("mode"));
  const commandFocus = normalizeFoodCommandFocus(searchParams.get("focus"));
  const commandFocusQuery = createFoodCommandFocusQuery(commandFocus);
  const [activeSection, setActiveSection] = useState<MealSection>(
    inputMode === "barcode" ? "scan" : "add"
  );
  const [activeAddTool, setActiveAddTool] = useState<AddTool>("search");
  const isDirectCaptureMode = inputMode === "barcode" || inputMode === "photo";
  const displayedMealType = commandFocus === "protein" ? "lunch" : mealType;
  const displayedActiveSection =
    commandFocus && !isDirectCaptureMode ? "add" : activeSection;
  const displayedActiveAddTool =
    commandFocus && !isDirectCaptureMode ? "search" : activeAddTool;

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };
  const getMealLabel = (value: MealType) => {
    switch (value) {
      case "lunch":
        return mealLabels.lunch;
      case "dinner":
        return mealLabels.dinner;
      case "snack":
        return mealLabels.snack;
      case "breakfast":
      default:
        return mealLabels.breakfast;
    }
  };

  const caloriePercent = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;

  const groupedEntries = useMemo(() => {
    return items.reduce<Record<MealType, MealEntry[]>>(
      (accumulator, item) => addEntryToMealGroups(accumulator, item),
      createEmptyMealGroups()
    );
  }, [items]);

  const handleInputModeChange = (mode: MealInputMode) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", mode);
    setSearchParams(nextParams);

    if (mode === "barcode") {
      setActiveSection("scan");
    }
  };

  const openScanner = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", "barcode");
    setSearchParams(nextParams);
    setActiveSection("scan");
  };

  const openFoodCommandTarget = (
    target: "search" | "photo" | "barcode" | "composer" | "favorites" | "catalog"
  ) => {
    if (target === "barcode") {
      openScanner();
      return;
    }

    if (target === "catalog") {
      handleInputModeChange("search");
      setActiveSection("templates");
      return;
    }

    setActiveSection("add");

    if (target === "photo") {
      handleInputModeChange("photo");
      return;
    }

    handleInputModeChange("search");
    setActiveAddTool(
      target === "composer" ? "composer" : target === "favorites" ? "favorites" : "search"
    );
  };

  const openProductSearchFromScanner = () => {
    setActiveSection("add");
    handleInputModeChange("search");
    setActiveAddTool("search");
  };

  const sections = [
    { id: "day", label: copy.sections.day },
    { id: "add", label: copy.sections.add },
    { id: "scan", label: copy.sections.scan },
    { id: "saved", label: copy.sections.saved },
    { id: "history", label: copy.sections.history },
    { id: "templates", label: copy.sections.templates },
    { id: "recommendations", label: copy.sections.recommendations },
  ];
  const addToolSections = [
    { id: "search", label: copy.addTools.search },
    { id: "favorites", label: copy.addTools.favorites },
    { id: "composer", label: copy.addTools.composer },
    { id: "scanner", label: copy.addTools.scanner },
  ];
  const renderLazyModule = (title: string, children: ReactNode) => (
    <LazyModuleBoundary
      errorTitle={copy.moduleErrorTitle}
      errorBody={copy.moduleErrorBody}
      reloadLabel={copy.reloadModule}
      resetKey={title}
      diagnosticLabel={`meal-builder:${title}`}
    >
      <Suspense
        fallback={
          <SectionCard>
            <Stack spacing={1.25} alignItems="center" sx={{ py: 1.5 }}>
              <Loader fullScreen={false} size={54} />
              <Typography color="text.secondary" sx={{ fontWeight: 800 }}>
                {copy.loadingModule}: {title}
              </Typography>
            </Stack>
          </SectionCard>
        }
      >
        {children}
      </Suspense>
    </LazyModuleBoundary>
  );

  const mealTypeSelector = (
    <SectionCard>
      <Stack spacing={{ xs: 1.25, md: 2 }}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ fontWeight: 800, fontSize: { xs: 18, md: 20 } }}
        >
          {t("mealBuilder.chooseMeal")}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={displayedMealType}
          onChange={(_, value) => {
            if (value) setMealType(value);
          }}
          sx={{
            flexWrap: "wrap",
            gap: 1,
            "& .MuiToggleButton-root": {
              flexGrow: 1,
              borderRadius: COMPACT_RADIUS,
              minWidth: { xs: "calc(50% - 4px)", sm: 140 },
              py: { xs: 0.9, sm: 1 },
              fontSize: { xs: 14, sm: 15 },
              textTransform: "none",
            },
          }}
        >
          {mealTypes.map((value) => (
            <ToggleButton key={value} value={value}>
              {getMealLabel(value)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </SectionCard>
  );
  const directCaptureModule = inputMode === "barcode"
    ? (
        <Stack spacing={3} data-meal-builder-direct-capture="barcode">
          {mealTypeSelector}
          {renderLazyModule(copy.modes.barcode.title, (
            <BarcodeScanner
              mealType={displayedMealType}
              onOpenProductSearch={openProductSearchFromScanner}
            />
          ))}
        </Stack>
      )
    : inputMode === "photo"
      ? (
        <Stack spacing={3} data-meal-builder-direct-capture="photo">
          {mealTypeSelector}
          {renderLazyModule(copy.modes.photo.title, (
            <PhotoMealAssistant mealType={displayedMealType} />
          ))}
        </Stack>
        )
      : null;

  const diaryContent = (
    <Stack spacing={2}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
        {t("mealBuilder.diary")}
      </Typography>

      {mealTypes.map((group) => {
        const groupEntries = getMealEntriesForType(groupedEntries, group);

        return (
        <Stack key={group} spacing={1.2}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography sx={{ fontWeight: 800 }}>{getMealLabel(group)}</Typography>
            <Chip
              label={`${groupEntries.length} ${t("mealBuilder.items")}`}
              size="small"
            />
          </Stack>

          {groupEntries.length === 0 ? (
            <Typography color={SECONDARY_TEXT_COLOR}>{t("mealBuilder.noEntries")}</Typography>
          ) : (
            groupEntries.map((item) => {
              const entryCalories =
                (item.product.nutrients.calories * item.quantity) / 100;

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: COMPACT_RADIUS,
                    backgroundColor: SURFACE_ELEVATED_BACKGROUND,
                    borderColor: BORDER_SOFT_COLOR,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {getProductDisplayName(item.product, appLanguage)}
                      </Typography>
                      <Typography color={SECONDARY_TEXT_COLOR} variant="body2">
                        {item.quantity} {item.product.unit} - {entryCalories.toFixed(0)}{" "}
                        {t(COMMON_KCAL_KEY)}
                      </Typography>
                    </Box>
                    <MealEntryEditorPanel entry={item} />
                  </Stack>
                </Paper>
              );
            })
          )}

          <Divider />
        </Stack>
        );
      })}
    </Stack>
  );

  return (
    <PageShell
      title={t("mealBuilder.title")}
      subtitle={t("mealBuilder.subtitle")}
      assistantHint={<EcosystemPulse focus="food" />}
      action={
        <Button
          variant="contained"
          startIcon={<ScanBarcode size={18} />}
          onClick={openScanner}
          sx={{
            width: { xs: "100%", md: "auto" },
            textTransform: "none",
            fontWeight: 900,
            borderRadius: COMPACT_RADIUS,
          }}
        >
          {copy.scanAction}
        </Button>
      }
      maxWidth={1480}
    >
      <SectionCard tone="premium">
        <Stack spacing={{ xs: 1, md: 1.5 }}>
          <Typography variant="body2">
            {t("mealBuilder.calories")}: {totals.calories.toFixed(0)} / {dailyCalories}{" "}
            {t(COMMON_KCAL_KEY)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={caloriePercent}
            sx={{ height: 12, borderRadius: 999 }}
          />
        </Stack>
      </SectionCard>

      {directCaptureModule}

      {!isDirectCaptureMode ? (
        <>
          <FoodCommandCenter
            mealType={displayedMealType}
            initialQuery={commandFocusQuery}
            onOpenTarget={openFoodCommandTarget}
          />

          <SectionTabs
            sections={sections}
            activeSection={displayedActiveSection}
            onChange={(sectionId) => setActiveSection(sectionId as MealSection)}
            ariaLabel="Meal sections"
          />
        </>
      ) : null}

      {displayedActiveSection === "add" && !isDirectCaptureMode ? (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
      {mealTypeSelector}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: SINGLE_COLUMN_GRID,
            lg: MEAL_ADD_LAYOUT_GRID,
            xl: MEAL_ADD_LAYOUT_GRID_WIDE,
          },
          gap: { xs: 2, lg: 2.5 },
          alignItems: "start",
          minWidth: 0,
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <SectionTabs
              sections={addToolSections}
              activeSection={displayedActiveAddTool}
              onChange={(sectionId) => setActiveAddTool(sectionId as AddTool)}
              ariaLabel="Meal add tools"
            />
            {displayedActiveAddTool === "search"
              ? renderLazyModule(copy.addTools.search, (
                  <ProductSearch mealType={displayedMealType} initialQuery={commandFocusQuery} />
                ))
              : null}
            {displayedActiveAddTool === "favorites" ? (
              renderLazyModule(copy.addTools.favorites, (
                <QuickProductShelf mealType={displayedMealType} />
              ))
            ) : null}
            {displayedActiveAddTool === "composer" ? (
              renderLazyModule(copy.addTools.composer, (
                <QuickMealComposer mealType={displayedMealType} />
              ))
            ) : null}
            {displayedActiveAddTool === "scanner" ? (
              renderLazyModule(copy.addTools.scanner, (
                <BarcodeScanner
                  mealType={displayedMealType}
                  onOpenProductSearch={openProductSearchFromScanner}
                />
              ))
            ) : null}
          </Stack>
        </Stack>

        <Stack spacing={3} sx={{ display: { xs: "none", lg: "block" }, minWidth: 0 }}>
          <SectionCard>
            <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 96 },
              maxHeight: { lg: "calc(100vh - 120px)" },
              overflowY: { lg: "auto" },
            }}
          >
            {diaryContent}
            </Box>
          </SectionCard>
        </Stack>
      </Box>
        </Stack>
      ) : null}

      {displayedActiveSection === "scan" && !isDirectCaptureMode ? (
        <Stack spacing={3}>
          {mealTypeSelector}
          {renderLazyModule(copy.sections.scan, (
            <BarcodeScanner
              mealType={displayedMealType}
              onOpenProductSearch={openProductSearchFromScanner}
            />
          ))}
        </Stack>
      ) : null}

      {displayedActiveSection === "day" ? (
        <Stack spacing={3}>
          <SectionCard>{diaryContent}</SectionCard>
          {renderLazyModule(copy.sections.day, <DailyMicronutrientsCard />)}
        </Stack>
      ) : null}

      {displayedActiveSection === "history" ? (
        renderLazyModule(copy.sections.history, (
          <DailyHistoryExplorer />
        ))
      ) : null}

      {displayedActiveSection === "saved" ? (
        renderLazyModule(copy.sections.saved, (
          <NutritionLibraryPanel mealType={displayedMealType} mode="saved" />
        ))
      ) : null}

      {displayedActiveSection === "templates" ? (
      <SectionCard
        title={copy.advancedTitle}
        description={copy.advancedSubtitle}
      >
        {renderLazyModule(copy.sections.templates, (
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: SINGLE_COLUMN_GRID, lg: TEMPLATE_GRID_COLUMNS },
                gap: 2,
                alignItems: "start",
                minWidth: 0,
              }}
            >
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <YesterdayRepeater />
                <TemplateVault mealType={displayedMealType} />
                <CatalogContributionCard compact />
              </Stack>
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <FridgeRecipePlanner mealType={displayedMealType} />
                <RecipeSection mealType={displayedMealType} />
              </Stack>
            </Box>
          </Stack>
        ))}
      </SectionCard>
      ) : null}

      {displayedActiveSection === "recommendations" ? (
        renderLazyModule(copy.sections.recommendations, (
          <SmartRecommendations />
        ))
      ) : null}
      <Box
        aria-hidden="true"
        sx={{
          display: { xs: "block", md: "none" },
          height: "calc(88px + env(safe-area-inset-bottom))",
        }}
      />
    </PageShell>
  );
};

export default MealBuilderPage;
