import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import type { MealEntry, MealType } from "../../shared/types/meal";

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const overviewCopy = {
  uk: {
    title: "Today's meals",
    subtitle: "See breakfast, lunch, dinner, and snacks at a glance.",
    empty: "No products have been added for today yet.",
    emptyGroup: "Nothing here yet.",
    items: "items",
  },
  pl: {
    title: "Today's meals",
    subtitle: "See breakfast, lunch, dinner, and snacks at a glance.",
    empty: "No products have been added for today yet.",
    emptyGroup: "Nothing here yet.",
    items: "items",
  },
} as const;

export const MealDayOverview = () => {
  const items = useSelector(selectMealItems);
  const { language, t } = useLanguage();
  const copy = overviewCopy[language];
  const [todayKey] = useState(() => getLocalDateKey(new Date()));

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  const todayEntries = useMemo(
    () => items.filter((item) => getLocalDateKey(item.eatenAt) === todayKey),
    [items, todayKey]
  );

  const groupedEntries = useMemo(() => {
    return todayEntries.reduce<Record<MealType, MealEntry[]>>(
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
  }, [todayEntries]);

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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.6}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Stack>
          <Chip
            label={formatLocalDateKey(todayKey, language, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            sx={{ textTransform: "capitalize" }}
          />
        </Stack>

        {todayEntries.length === 0 ? (
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : (
          <Stack spacing={1.5}>
            {mealTypeOrder.map((mealType) => {
              const entries = groupedEntries[mealType];
              const mealCalories = entries.reduce(
                (sum, item) =>
                  sum + (item.product.nutrients.calories * item.quantity) / 100,
                0
              );

              return (
                <Paper key={mealType} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                  <Stack spacing={1.2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Typography sx={{ fontWeight: 800 }}>
                        {mealLabels[mealType]}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${entries.length} ${copy.items} / ${mealCalories.toFixed(0)} ${t(
                          "common.kcal"
                        )}`}
                      />
                    </Stack>

                    {entries.length === 0 ? (
                      <Typography color="text.secondary" variant="body2">
                        {copy.emptyGroup}
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {entries.map((item) => (
                          <Stack
                            key={item.id}
                            direction={{ xs: "column", sm: "row" }}
                            spacing={0.6}
                            justifyContent="space-between"
                          >
                            <Typography sx={{ fontWeight: 600 }}>
                              {getProductDisplayName(item.product, language)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity} {item.product.unit} /{" "}
                              {((item.product.nutrients.calories * item.quantity) / 100).toFixed(
                                0
                              )}{" "}
                              {t("common.kcal")}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
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
