import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/i18n/I18nProvider";

export const DailyHistoryExplorer = () => {
  const items = useSelector((state: RootState) => state.meal.items);
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Historia dni",
          subtitle: "Przeglądaj wpisy z ostatnich dni i sprawdzaj bilans kalorii.",
          select: "Dzień",
          empty: "Brak wpisów dla wybranego dnia.",
        }
      : {
          title: "Історія за днями",
          subtitle: "Переглядай записи за останні дні та денний баланс калорій.",
          select: "День",
          empty: "Для обраного дня записів немає.",
        };

  const availableDays = useMemo(() => {
    const uniqueKeys = [...new Set(items.map((item) => item.eatenAt.slice(0, 10)))];
    return uniqueKeys.sort((a, b) => b.localeCompare(a));
  }, [items]);

  const [selectedDay, setSelectedDay] = useState("");
  const effectiveSelectedDay =
    selectedDay && availableDays.includes(selectedDay)
      ? selectedDay
      : (availableDays[0] ?? "");

  const selectedEntries = items.filter(
    (item) => item.eatenAt.slice(0, 10) === effectiveSelectedDay
  );

  const totalCalories = selectedEntries.reduce(
    (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
    0
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
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>

        <TextField
          select
          value={effectiveSelectedDay}
          onChange={(event) => setSelectedDay(event.target.value)}
          label={text.select}
          disabled={availableDays.length === 0}
        >
          {availableDays.map((day) => (
            <MenuItem key={day} value={day}>
              {new Date(day).toLocaleDateString(language === "pl" ? "pl-PL" : "uk-UA", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </MenuItem>
          ))}
        </TextField>

        {selectedEntries.length === 0 ? (
          <Typography color="text.secondary">{text.empty}</Typography>
        ) : (
          <>
            <Typography sx={{ fontWeight: 700 }}>
              {totalCalories.toFixed(0)} kcal
            </Typography>
            <Stack spacing={1.1}>
              {selectedEntries.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Typography sx={{ fontWeight: 700 }}>{item.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} {item.product.unit} -{" "}
                    {((item.product.nutrients.calories * item.quantity) / 100).toFixed(0)} kcal
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
};
