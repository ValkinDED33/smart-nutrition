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
import Loader from "../shared/components/Loader/PacmanLoader";
import { LazyModuleBoundary, PageShell, SectionCard, SectionTabs } from "@shared/ui";

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
const NutritionLibraryPanel = lazy(() =>
  import("../features/meal/NutritionLibraryPanel").then((module) => ({
    default: module.NutritionLibraryPanel,
  }))
);
const DailyHistoryExplorer = lazy(() =>
  import("../features/meal/DailyHistoryExplorer").then((module) => ({
    default: module.DailyHistoryExplorer,
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

const mealInputModes: MealInputMode[] = ["photo", "search", "barcode"];

const normalizeMealInputMode = (value: string | null): MealInputMode =>
  value === "photo" || value === "barcode" ? value : "search";

const mealInputCopy = {
  uk: {
    inputTitle: "Додати їжу",
    inputSubtitle: "Три прості входи. Оберіть той, який зараз найшвидший.",
    advancedTitle: "Додаткові інструменти",
    advancedSubtitle:
      "Шаблони, повтори, холодильник і рецепти залишаються нижче, коли потрібна точніша збірка.",
    scanAction: "Відкрити сканер",
    loadingModule: "Завантажуємо інструмент",
    moduleErrorTitle: "Інструмент не завантажився",
    moduleErrorBody:
      "Можливо, мережа або кеш отримали старий chunk. Оновіть модуль і спробуйте ще раз.",
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
    inputTitle: "Dodaj jedzenie",
    inputSubtitle: "Trzy proste wejścia. Wybierz to, które teraz jest najszybsze.",
    advancedTitle: "Dodatkowe narzędzia",
    advancedSubtitle:
      "Szablony, powtórki, lodówka i przepisy zostają niżej, gdy potrzeba dokładniejszego składania.",
    scanAction: "Otwórz skaner",
    loadingModule: "Ładujemy narzędzie",
    moduleErrorTitle: "Narzędzie się nie załadowało",
    moduleErrorBody:
      "Sieć albo cache mogły zachować stary chunk. Odśwież moduł i spróbuj ponownie.",
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
    inputTitle: "Add food",
    inputSubtitle: "Three simple entry points. Choose the fastest one right now.",
    advancedTitle: "Additional tools",
    advancedSubtitle:
      "Templates, repeats, fridge planning, and recipes stay below when you need a more precise setup.",
    scanAction: "Open scanner",
    loadingModule: "Loading tool",
    moduleErrorTitle: "Tool did not load",
    moduleErrorBody:
      "The network or cache may have kept an old chunk. Refresh the module and try again.",
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
  const copy = mealInputCopy[appLanguage];
  const inputMode = normalizeMealInputMode(searchParams.get("mode"));
  const [activeSection, setActiveSection] = useState<MealSection>(
    inputMode === "barcode" ? "scan" : "add"
  );
  const [activeAddTool, setActiveAddTool] = useState<AddTool>("search");

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  const caloriePercent = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;

  const groupedEntries = useMemo(() => {
    return items.reduce<Record<MealType, MealEntry[]>>(
      (accumulator, item) => {
        accumulator[item.mealType].push(item);
        return accumulator;
      },
      {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      }
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
    target: "search" | "photo" | "barcode" | "composer" | "favorites"
  ) => {
    if (target === "barcode") {
      openScanner();
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
          value={mealType}
          onChange={(_, value) => {
            if (value) setMealType(value);
          }}
          sx={{
            flexWrap: "wrap",
            gap: 1,
            "& .MuiToggleButton-root": {
              flexGrow: 1,
              borderRadius: 1,
              minWidth: { xs: "calc(50% - 4px)", sm: 140 },
              py: { xs: 0.9, sm: 1 },
              fontSize: { xs: 14, sm: 15 },
              textTransform: "none",
            },
          }}
        >
          {Object.entries(mealLabels).map(([value, label]) => (
            <ToggleButton key={value} value={value}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </SectionCard>
  );

  const diaryContent = (
    <Stack spacing={2}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
        {t("mealBuilder.diary")}
      </Typography>

      {(Object.keys(groupedEntries) as MealType[]).map((group) => (
        <Stack key={group} spacing={1.2}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography sx={{ fontWeight: 800 }}>{mealLabels[group]}</Typography>
            <Chip
              label={`${groupedEntries[group].length} ${t("mealBuilder.items")}`}
              size="small"
            />
          </Stack>

          {groupedEntries[group].length === 0 ? (
            <Typography color="text.secondary">{t("mealBuilder.noEntries")}</Typography>
          ) : (
            groupedEntries[group].map((item) => {
              const entryCalories =
                (item.product.nutrients.calories * item.quantity) / 100;

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: "var(--sn-surface-elevated)",
                    borderColor: "var(--sn-border-soft)",
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
                      <Typography color="text.secondary" variant="body2">
                        {item.quantity} {item.product.unit} - {entryCalories.toFixed(0)}{" "}
                        {t("common.kcal")}
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
      ))}
    </Stack>
  );

  return (
    <PageShell
      title={t("mealBuilder.title")}
      subtitle={t("mealBuilder.subtitle")}
      action={
        <Button
          variant="contained"
          startIcon={<ScanBarcode size={18} />}
          onClick={openScanner}
          sx={{
            width: { xs: "100%", md: "auto" },
            textTransform: "none",
            fontWeight: 900,
            borderRadius: 1,
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
            {t("common.kcal")}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={caloriePercent}
            sx={{ height: 12, borderRadius: 999 }}
          />
        </Stack>
      </SectionCard>

      <FoodCommandCenter
        mealType={mealType}
        onOpenTarget={openFoodCommandTarget}
      />

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as MealSection)}
        ariaLabel="Meal sections"
      />

      {activeSection === "add" ? (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
      <SectionCard
        title={copy.inputTitle}
        description={copy.inputSubtitle}
        action={
          <Chip
            label={`${totals.calories.toFixed(0)} / ${dailyCalories} ${t("common.kcal")}`}
            color={caloriePercent > 92 ? "warning" : "success"}
            variant="outlined"
          />
        }
      >
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1,
              minWidth: 0,
            }}
          >
            {mealInputModes.map((mode) => {
              const modeCopy = copy.modes[mode];
              const active = inputMode === mode;

              return (
                <Paper
                  key={mode}
                  component="button"
                  type="button"
                  onClick={() => handleInputModeChange(mode)}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    cursor: "pointer",
                    textAlign: "left",
                    backgroundColor: active ? "var(--sn-accent-soft)" : "var(--sn-surface-elevated)",
                    borderColor: active ? "var(--sn-border-strong)" : "var(--sn-border-soft)",
                    "&:hover": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Stack spacing={0.6}>
                    <Typography sx={{ fontWeight: 900 }}>{modeCopy.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {modeCopy.body}
                    </Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Stack>
      </SectionCard>

      {mealTypeSelector}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 1fr) minmax(300px, 340px)",
            xl: "minmax(0, 1fr) 360px",
          },
          gap: { xs: 2, lg: 2.5 },
          alignItems: "start",
          minWidth: 0,
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {inputMode === "photo" ? (
            renderLazyModule(copy.modes.photo.title, (
              <PhotoMealAssistant mealType={mealType} />
            ))
          ) : null}

          {inputMode === "search" ? (
            <Stack spacing={2} sx={{ minWidth: 0 }}>
              <SectionTabs
                sections={addToolSections}
                activeSection={activeAddTool}
                onChange={(sectionId) => setActiveAddTool(sectionId as AddTool)}
                ariaLabel="Meal add tools"
              />
              {activeAddTool === "search"
                ? renderLazyModule(copy.addTools.search, (
                    <ProductSearch mealType={mealType} />
                  ))
                : null}
              {activeAddTool === "favorites" ? (
                renderLazyModule(copy.addTools.favorites, (
                  <QuickProductShelf mealType={mealType} />
                ))
              ) : null}
              {activeAddTool === "composer" ? (
                renderLazyModule(copy.addTools.composer, (
                  <QuickMealComposer mealType={mealType} />
                ))
              ) : null}
              {activeAddTool === "scanner" ? (
                renderLazyModule(copy.addTools.scanner, (
                  <BarcodeScanner
                    mealType={mealType}
                    onOpenProductSearch={openProductSearchFromScanner}
                  />
                ))
              ) : null}
            </Stack>
          ) : null}

          {inputMode === "barcode" ? (
            renderLazyModule(copy.modes.barcode.title, (
              <BarcodeScanner
                mealType={mealType}
                onOpenProductSearch={openProductSearchFromScanner}
              />
            ))
          ) : null}
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

      {activeSection === "scan" ? (
        <Stack spacing={3}>
          {mealTypeSelector}
          {renderLazyModule(copy.sections.scan, (
            <BarcodeScanner
              mealType={mealType}
              onOpenProductSearch={openProductSearchFromScanner}
            />
          ))}
        </Stack>
      ) : null}

      {activeSection === "day" ? (
        <SectionCard>{diaryContent}</SectionCard>
      ) : null}

      {activeSection === "history" ? (
        renderLazyModule(copy.sections.history, (
          <DailyHistoryExplorer />
        ))
      ) : null}

      {activeSection === "saved" ? (
        renderLazyModule(copy.sections.saved, (
          <NutritionLibraryPanel mealType={mealType} mode="saved" />
        ))
      ) : null}

      {activeSection === "templates" ? (
      <SectionCard
        title={copy.advancedTitle}
        description={copy.advancedSubtitle}
      >
        {renderLazyModule(copy.sections.templates, (
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                alignItems: "start",
                minWidth: 0,
              }}
            >
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <YesterdayRepeater />
                <TemplateVault mealType={mealType} />
                <CatalogContributionCard compact />
              </Stack>
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <FridgeRecipePlanner mealType={mealType} />
                <RecipeSection mealType={mealType} />
              </Stack>
            </Box>
          </Stack>
        ))}
      </SectionCard>
      ) : null}

      {activeSection === "recommendations" ? (
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
