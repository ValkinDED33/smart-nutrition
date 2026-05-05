import { lazy, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
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
import { ProductSearch } from "../features/meal/ProductSearch";
import { PhotoMealAssistant } from "../features/meal/PhotoMealAssistant";
import { RecipeSection } from "../features/meal/RecipeSection";
import { QuickMealComposer } from "../features/meal/QuickMealComposer";
import { QuickProductShelf } from "../features/meal/QuickProductShelf";
import { FridgeRecipePlanner } from "../features/fridge/FridgeRecipePlanner";
import { CatalogContributionCard } from "../features/platform/CatalogContributionCard";
import { MealEntryEditorPanel } from "../features/meal/MealEntryEditorPanel";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { TemplateVault } from "../features/meal/TemplateVault";
import { YesterdayRepeater } from "../features/meal/YesterdayRepeater";
import type { MealEntry, MealType } from "../shared/types/meal";
import { useLanguage } from "../shared/language";
import { getProductDisplayName } from "../shared/lib/productDisplay";
import Loader from "../shared/components/Loader/PacmanLoader";

const BarcodeScanner = lazy(() =>
  import("../features/meal/BarcodeScanner").then((module) => ({
    default: module.BarcodeScanner,
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
} as const;

const MealBuilderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useSelector(selectTodayMealItems);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const totals = useSelector(selectTodayMealTotalNutrients);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const { language, t } = useLanguage();
  const copy = mealInputCopy[language];
  const inputMode = normalizeMealInputMode(searchParams.get("mode"));

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
  };

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={{ xs: 1, md: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 26, md: 34 } }}>
            {t("mealBuilder.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            {t("mealBuilder.subtitle")}
          </Typography>
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
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack spacing={0.4}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {copy.inputTitle}
              </Typography>
              <Typography color="text.secondary">{copy.inputSubtitle}</Typography>
            </Stack>
            <Chip
              label={`${totals.calories.toFixed(0)} / ${dailyCalories} ${t("common.kcal")}`}
              color={caloriePercent > 92 ? "warning" : "success"}
              variant="outlined"
            />
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1,
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
                    backgroundColor: active ? "rgba(240,253,250,0.9)" : "rgba(248,250,252,0.78)",
                    borderColor: active ? "primary.main" : "rgba(15, 23, 42, 0.1)",
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
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={{ xs: 1.25, md: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 18, md: 20 } }}>
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
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Stack spacing={3}>
          {inputMode === "photo" ? <PhotoMealAssistant mealType={mealType} /> : null}

          {inputMode === "search" ? (
            <>
              <ProductSearch mealType={mealType} />
              <QuickProductShelf mealType={mealType} />
              <QuickMealComposer mealType={mealType} />
            </>
          ) : null}

          {inputMode === "barcode" ? (
            <Suspense fallback={<Loader fullScreen={false} size={70} />}>
              <BarcodeScanner mealType={mealType} />
            </Suspense>
          ) : null}
        </Stack>

        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              backgroundColor: "rgba(255,255,255,0.86)",
              position: { lg: "sticky" },
              top: { lg: 96 },
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("mealBuilder.diary")}
              </Typography>

              {(Object.keys(groupedEntries) as MealType[]).map((group) => (
                <Stack key={group} spacing={1.2}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Typography sx={{ fontWeight: 800 }}>
                      {mealLabels[group]}
                    </Typography>
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
                          sx={{ p: 1.5, borderRadius: 1 }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700 }}>
                                {getProductDisplayName(item.product, language)}
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
          </Paper>
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.4}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {copy.advancedTitle}
            </Typography>
            <Typography color="text.secondary">{copy.advancedSubtitle}</Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Stack spacing={2}>
              <YesterdayRepeater />
              <TemplateVault mealType={mealType} />
              <CatalogContributionCard />
            </Stack>
            <Stack spacing={2}>
              <FridgeRecipePlanner mealType={mealType} />
              <RecipeSection mealType={mealType} />
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default MealBuilderPage;
