import { useDispatch, useSelector } from "react-redux";
import { Button, Stack } from "@mui/material";
import { addMealEntries } from "./mealSlice";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getLocalDateKey } from "../../shared/lib/date";
import type { AppDispatch } from "../../app/store";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const YesterdayRepeater = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { t } = useLanguage();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  const yesterdayItems = items.filter((item) => getLocalDateKey(item.eatenAt) === yesterdayKey);
  const hasYesterdayData = yesterdayItems.length > 0;

  const handleRepeatYesterday = () => {
    if (!hasYesterdayData) return;

    const newEntries = yesterdayItems.map((item) => ({
      ...item,
      id: createId("meal"),
      eatenAt: new Date().toISOString(),
    }));

    dispatch(addMealEntries(newEntries));
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <Button
        variant="outlined"
        onClick={handleRepeatYesterday}
        disabled={!hasYesterdayData}
        fullWidth
      >
        {t("meal.repeatYesterday")}
      </Button>
    </Stack>
  );
};
