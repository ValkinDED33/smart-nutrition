import { useSelector } from "react-redux";
import { LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { selectTodayMealTotalNutrients } from "./selectors";
import { useLanguage } from "../../shared/language";

const micronutrientCopy = {
  uk: {
    title: "Daily micronutrients",
    subtitle: "A quick look at fiber, vitamins, minerals, and hydration from today's log.",
    empty: "Add foods or drinks to start building your micronutrient summary.",
  },
  pl: {
    title: "Daily micronutrients",
    subtitle: "A quick look at fiber, vitamins, minerals, and hydration from today's log.",
    empty: "Add foods or drinks to start building your micronutrient summary.",
  },
} as const;

const trackedNutrients = [
  { key: "fiber", label: "Fiber", unit: "g", target: 25, digits: 1 },
  { key: "water", label: "Water", unit: "g", target: 2000, digits: 0 },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", target: 90, digits: 1 },
  { key: "vitaminD", label: "Vitamin D", unit: "ug", target: 15, digits: 2 },
  { key: "calcium", label: "Calcium", unit: "mg", target: 1000, digits: 0 },
  { key: "iron", label: "Iron", unit: "mg", target: 18, digits: 1 },
  { key: "potassium", label: "Potassium", unit: "mg", target: 3500, digits: 0 },
] as const;

export const DailyMicronutrientsCard = () => {
  const totals = useSelector(selectTodayMealTotalNutrients);
  const { language } = useLanguage();
  const copy = micronutrientCopy[language];

  const hasAnyTrackedData = trackedNutrients.some(
    (nutrient) => totals[nutrient.key] > 0.001
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
                  sx={{ p: 1.6, borderRadius: 4 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography sx={{ fontWeight: 700 }}>{nutrient.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {value.toFixed(nutrient.digits)} {nutrient.unit} / {nutrient.target}{" "}
                        {nutrient.unit}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {progress.toFixed(0)}% of the daily reference target
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
