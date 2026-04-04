import { useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { selectAvailableMealDays, selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import {
  formatLocalDateKey,
  getLocalDateKey,
} from "../../shared/lib/date";

export const DailyHistoryExplorer = () => {
  const items = useSelector(selectMealItems);
  const { language, t } = useLanguage();

  const availableDays = useSelector(selectAvailableMealDays);

  const [selectedDay, setSelectedDay] = useState("");
  const effectiveSelectedDay =
    selectedDay && availableDays.includes(selectedDay)
      ? selectedDay
      : (availableDays[0] ?? "");

  const selectedEntries = items.filter(
    (item) => getLocalDateKey(item.eatenAt) === effectiveSelectedDay
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
          {t("history.title")}
        </Typography>
        <Typography color="text.secondary">{t("history.subtitle")}</Typography>

        <TextField
          select
          value={effectiveSelectedDay}
          onChange={(event) => setSelectedDay(event.target.value)}
          label={t("history.select")}
          disabled={availableDays.length === 0}
        >
          {availableDays.map((day) => (
            <MenuItem key={day} value={day}>
              {formatLocalDateKey(day, language, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </MenuItem>
          ))}
        </TextField>

        {selectedEntries.length === 0 ? (
          <Typography color="text.secondary">{t("history.empty")}</Typography>
        ) : (
          <>
            <Typography sx={{ fontWeight: 700 }}>
              {totalCalories.toFixed(0)} {t("common.kcal")}
            </Typography>
            <Stack spacing={1.1}>
              {selectedEntries.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {getProductDisplayName(item.product, language)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} {item.product.unit} -{" "}
                    {((item.product.nutrients.calories * item.quantity) / 100).toFixed(0)}{" "}
                    {t("common.kcal")}
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
