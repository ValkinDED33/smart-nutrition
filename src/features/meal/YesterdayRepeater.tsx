import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getLocalDateKey } from "../../shared/lib/date";
import type { AppDispatch, RootState } from "../../app/store";
import { addMealEntriesToCloud } from "./mealCloudSync";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const YesterdayRepeater = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const meal = useSelector((state: RootState) => state.meal);
  const { t } = useLanguage();
  const [saveError, setSaveError] = useState<string | null>(null);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  const yesterdayItems = items.filter((item) => getLocalDateKey(item.eatenAt) === yesterdayKey);
  const hasYesterdayData = yesterdayItems.length > 0;

  const handleRepeatYesterday = async () => {
    if (!hasYesterdayData) return;

    const newEntries = yesterdayItems.map((item) => ({
      ...item,
      id: createId("meal"),
      eatenAt: new Date().toISOString(),
    }));

    setSaveError(null);

    try {
      await addMealEntriesToCloud(dispatch, meal, newEntries);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
    }
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <Button
        variant="outlined"
        onClick={() => {
          void handleRepeatYesterday();
        }}
        disabled={!hasYesterdayData}
        fullWidth
      >
        {t("meal.repeatYesterday")}
      </Button>
    </Stack>
  );
};
