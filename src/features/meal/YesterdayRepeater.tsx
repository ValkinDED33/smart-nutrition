import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../../app/store";
import { addMealEntries } from "./mealSlice";
import { selectMealItems } from "./selectors";
import type { MealEntry, MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { addDays, getLocalDateKey } from "../../shared/lib/date";

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `repeat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const yesterdayKey = () => getLocalDateKey(addDays(new Date(), -1));

interface Props {
  mealType: MealType;
}

export const YesterdayRepeater = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { language, t } = useLanguage();

  const entries = useMemo(
    () =>
      items.filter(
        (item) =>
          item.mealType === mealType &&
          getLocalDateKey(item.eatenAt) === yesterdayKey()
      ),
    [items, mealType]
  );

  const handleRepeat = () => {
    const now = new Date().toISOString();
    const repeatedEntries: MealEntry[] = entries.map((entry) => ({
      ...entry,
      id: createEntryId(),
      eatenAt: now,
    }));

    dispatch(addMealEntries(repeatedEntries));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("yesterday.title")}
        </Typography>
        <Typography color="text.secondary">{t("yesterday.subtitle")}</Typography>
        {entries.length === 0 ? (
          <Typography color="text.secondary">{t("yesterday.empty")}</Typography>
        ) : (
          <>
            <Typography color="text.secondary">
              {entries
                .map(
                  (entry) =>
                    `${getProductDisplayName(entry.product, language)} ${entry.quantity} ${entry.product.unit}`
                )
                .join(", ")}
            </Typography>
            <Button variant="outlined" onClick={handleRepeat} sx={{ alignSelf: "flex-start" }}>
              {t("yesterday.action")}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
};
