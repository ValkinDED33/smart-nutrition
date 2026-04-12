import { lazy, Suspense, useMemo, useState } from "react";
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
import { MealEntryEditorDialog } from "../features/meal/MealEntryEditorDialog";
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

const MealBuilderPage = () => {
  const items = useSelector(selectTodayMealItems);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const totals = useSelector(selectTodayMealTotalNutrients);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const { language, t } = useLanguage();

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

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 34 } }}>
            {t("mealBuilder.title")}
          </Typography>
          <Typography color="text.secondary">{t("mealBuilder.subtitle")}</Typography>
          <Typography>
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
          p: 2,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
                borderRadius: 3,
                minWidth: { xs: "calc(50% - 4px)", sm: 140 },
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
          <YesterdayRepeater />
          <QuickMealComposer mealType={mealType} />
          <QuickProductShelf mealType={mealType} />
          <TemplateVault mealType={mealType} />
          <PhotoMealAssistant mealType={mealType} />
          <ProductSearch mealType={mealType} />
          <RecipeSection mealType={mealType} />
        </Stack>

        <Stack spacing={3}>
          <Suspense fallback={<Loader fullScreen={false} size={70} />}>
            <BarcodeScanner mealType={mealType} />
          </Suspense>

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
                          sx={{ p: 1.5, borderRadius: 4 }}
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
                            <MealEntryEditorDialog entry={item} />
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
    </Stack>
  );
};

export default MealBuilderPage;
