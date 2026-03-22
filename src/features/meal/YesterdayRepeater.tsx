import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../../app/store";
import { addMealEntries } from "./mealSlice";
import { selectMealItems } from "./selectors";
import type { MealEntry, MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `repeat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

interface Props {
  mealType: MealType;
}

export const YesterdayRepeater = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Powtórz wczorajszy posiłek",
          subtitle: "Jeśli jadłeś podobnie, odtwórz wpis jednym kliknięciem.",
          action: "Powtórz wczoraj",
          empty: "Wczoraj nie było wpisów dla tego posiłku.",
        }
      : {
          title: "Повторити вчорашній прийом їжі",
          subtitle: "Якщо сьогодні раціон схожий, віднови запис одним натисканням.",
          action: "Повторити вчорашнє",
          empty: "Для цього прийому їжі вчора записів не було.",
        };

  const entries = useMemo(
    () =>
      items.filter(
        (item) =>
          item.mealType === mealType && item.eatenAt.slice(0, 10) === yesterdayKey()
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
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>
        {entries.length === 0 ? (
          <Typography color="text.secondary">{text.empty}</Typography>
        ) : (
          <>
            <Typography color="text.secondary">
              {entries
                .map((entry) => `${entry.product.name} ${entry.quantity} ${entry.product.unit}`)
                .join(", ")}
            </Typography>
            <Button variant="outlined" onClick={handleRepeat} sx={{ alignSelf: "flex-start" }}>
              {text.action}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
};
