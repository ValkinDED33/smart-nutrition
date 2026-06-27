import { useSelector } from "react-redux";
import { LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { selectTodayMealTotalNutrients } from "./selectors";
import { useLanguage } from "../../shared/language";

type TrackedNutrientKey =
  | "fiber"
  | "water"
  | "vitaminC"
  | "vitaminD"
  | "calcium"
  | "iron"
  | "potassium";

const micronutrientCopy = {
  uk: {
    title: "Щоденні мікронутрієнти",
    subtitle:
      "Швидкий огляд клітковини, вітамінів, мінералів і гідратації з сьогоднішнього журналу.",
    empty: "Додайте їжу або напої, щоб почати формувати підсумок мікронутрієнтів.",
    progressLabel: (progress: number) => `${progress.toFixed(0)}% від денної орієнтовної цілі`,
    nutrients: {
      fiber: "Клітковина",
      water: "Вода",
      vitaminC: "Вітамін C",
      vitaminD: "Вітамін D",
      calcium: "Кальцій",
      iron: "Залізо",
      potassium: "Калій",
    },
    units: {
      g: "г",
      mg: "мг",
      mcg: "мкг",
    },
  },
  pl: {
    title: "Dzienne mikroskladniki",
    subtitle:
      "Szybki podglad blonnika, witamin, mineralow i nawodnienia z dzisiejszego dziennika.",
    empty: "Dodaj jedzenie lub napoje, aby zaczac budowac podsumowanie mikroskladnikow.",
    progressLabel: (progress: number) => `${progress.toFixed(0)}% dziennego celu orientacyjnego`,
    nutrients: {
      fiber: "Blonnik",
      water: "Woda",
      vitaminC: "Witamina C",
      vitaminD: "Witamina D",
      calcium: "Wapn",
      iron: "Zelazo",
      potassium: "Potas",
    },
    units: {
      g: "g",
      mg: "mg",
      mcg: "mcg",
    },
  },
  en: {
    title: "Daily micronutrients",
    subtitle:
      "A quick overview of fiber, vitamins, minerals, and hydration from today's diary.",
    empty: "Add food or drinks to start building a micronutrient summary.",
    progressLabel: (progress: number) => `${progress.toFixed(0)}% of the estimated daily target`,
    nutrients: {
      fiber: "Fiber",
      water: "Water",
      vitaminC: "Vitamin C",
      vitaminD: "Vitamin D",
      calcium: "Calcium",
      iron: "Iron",
      potassium: "Potassium",
    },
    units: {
      g: "g",
      mg: "mg",
      mcg: "mcg",
    },
  },
} as const;

const trackedNutrients = [
  { key: "fiber", unit: "g", target: 25, digits: 1 },
  { key: "water", unit: "g", target: 2000, digits: 0 },
  { key: "vitaminC", unit: "mg", target: 90, digits: 1 },
  { key: "vitaminD", unit: "mcg", target: 15, digits: 2 },
  { key: "calcium", unit: "mg", target: 1000, digits: 0 },
  { key: "iron", unit: "mg", target: 18, digits: 1 },
  { key: "potassium", unit: "mg", target: 3500, digits: 0 },
] as const satisfies ReadonlyArray<{
  key: TrackedNutrientKey;
  unit: "g" | "mg" | "mcg";
  target: number;
  digits: number;
}>;

export const DailyMicronutrientsCard = () => {
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { appLanguage } = useLanguage();
  const copy = micronutrientCopy[appLanguage];

  const hasAnyTrackedData = trackedNutrients.some(
    (nutrient) => totals[nutrient.key] > 0.001
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {!hasAnyTrackedData ? (
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : (
          <Stack
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {trackedNutrients.map((nutrient) => {
              const value = totals[nutrient.key];
              const progress = Math.min((value / nutrient.target) * 100, 100);

              return (
                <Paper
                  key={nutrient.key}
                  variant="outlined"
                  sx={{ p: 1.6, borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {copy.nutrients[nutrient.key]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {value.toFixed(nutrient.digits)} {copy.units[nutrient.unit]} /{" "}
                        {nutrient.target} {copy.units[nutrient.unit]}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {copy.progressLabel(progress)}
                    </Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
