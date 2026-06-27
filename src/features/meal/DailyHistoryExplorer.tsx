import { useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import { selectAvailableMealDays, selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import {
  formatLocalDateKey,
  getLocalDateKey,
} from "../../shared/lib/date";

export const DailyHistoryExplorer = () => {
  const items = useSelector(selectMealItems);
  const { appLanguage, t } = useLanguage();

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
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
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
              {formatLocalDateKey(day, appLanguage, {
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
            <Virtuoso
              style={{
                height: Math.min(Math.max(selectedEntries.length * 94, 120), 420),
              }}
              data={selectedEntries}
              itemContent={(_, item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{ p: 1.5, mb: 1.1, borderRadius: 1 }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {getProductDisplayName(item.product, appLanguage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} {item.product.unit} -{" "}
                    {((item.product.nutrients.calories * item.quantity) / 100).toFixed(0)}{" "}
                    {t("common.kcal")}
                  </Typography>
                </Paper>
              )}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
};
