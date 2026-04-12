import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Chip,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import type { AppDispatch } from "../../app/store";
import { removeProduct, updateMealEntry, addMealEntries } from "./mealSlice";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { addDays, formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import type { MealEntry, MealType } from "../../shared/types/meal";

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const overviewCopy = {
  uk: {
    title: "Сьогоднішні прийоми їжі",
    subtitle: "Переглядайте сніданок, обід, вечерю та перекуси в одному місці.",
    empty: "На сьогодні ще немає доданих продуктів.",
    emptyGroup: "Поки тут порожньо.",
    items: "позицій",
    repeat: "Повторити вчорашнє",
    edit: "Редагувати",
    delete: "Видалити",
    cancel: "Скасувати",
    save: "Зберегти",
    editTitle: "Редагування запису",
  },
  pl: {
    title: "Dzisiejsze posiłki",
    subtitle: "Zobacz śniadanie, obiad, kolację i przekąski w jednym miejscu.",
    empty: "Na dziś nie dodano jeszcze żadnych produktów.",
    emptyGroup: "Na razie pusto.",
    items: "produktów",
    repeat: "Powtórz wczoraj",
    edit: "Edytuj",
    delete: "Usuń",
    cancel: "Anuluj",
    save: "Zapisz",
    editTitle: "Edycja wpisu",
  },
} as const;

type OverviewCopy = (typeof overviewCopy)[keyof typeof overviewCopy];

const InlineEditDialog = ({
  item,
  open,
  onClose,
  onSave,
  onDelete,
  mealTypes,
  t,
  language,
  copy,
}: {
  item: MealEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (quantity: number, mealType: MealType) => void;
  onDelete: () => void;
  mealTypes: Record<MealType, string>;
  t: (key: string) => string;
  language: "uk" | "pl";
  copy: OverviewCopy;
}) => {
  const [quantity, setQuantity] = useState<number | "">(item?.quantity ?? "");
  const [mealType, setMealType] = useState<MealType>(item?.mealType ?? "lunch");

  const handleSave = () => {
    if (typeof quantity === "number" && quantity > 0) {
      onSave(quantity, mealType);
      onClose();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {copy.editTitle}: {getProductDisplayName(item.product, language)}
      </DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          type="number"
          label={`${t("meal.quantity")} (${item.product.unit})`}
          value={quantity}
          onChange={(e) => {
            const value = e.target.value;
            setQuantity(value === "" ? "" : Number(value));
          }}
          inputProps={{ min: 1, step: 0.1 }}
          fullWidth
        />
        <TextField
          select
          label={t("meal.mealType")}
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          fullWidth
        >
          {Object.entries(mealTypes).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDelete} color="error" variant="text">
          {copy.delete}
        </Button>
        <Button onClick={onClose} variant="text">
          {copy.cancel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={typeof quantity !== "number" || quantity <= 0}
        >
          {copy.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const MealDayOverview = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { language, t } = useLanguage();
  const copy = overviewCopy[language];
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [editingItem, setEditingItem] = useState<MealEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const todayKey = useMemo(() => getLocalDateKey(currentDate), [currentDate]);
  const yesterdayKey = useMemo(() => getLocalDateKey(addDays(currentDate, -1)), [currentDate]);

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

  const repeatableMealTypes = useMemo(
    () =>
      new Set(
        items
          .filter((item) => getLocalDateKey(item.eatenAt) === yesterdayKey)
          .map((item) => item.mealType)
      ),
    [items, yesterdayKey]
  );

  const handleEditClick = (item: MealEntry) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (item: MealEntry) => {
    dispatch(removeProduct(item.id));
  };

  const handleSaveEdit = (quantity: number, mealType: MealType) => {
    if (editingItem) {
      dispatch(
        updateMealEntry({
          id: editingItem.id,
          product: editingItem.product,
          quantity,
          mealType,
        })
      );
      setShowEditDialog(false);
      setEditingItem(null);
    }
  };

  const handleRepeatMealType = (mealType: MealType) => {
    const yesterdayMeals = items.filter(
      (item) =>
        getLocalDateKey(item.eatenAt) === yesterdayKey && item.mealType === mealType
    );

    if (yesterdayMeals.length === 0) return;

    const createId = (prefix: string) =>
      globalThis.crypto?.randomUUID?.() ??
      `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const newEntries = yesterdayMeals.map((item) => ({
      ...item,
      id: createId("meal"),
      eatenAt: new Date().toISOString(),
    }));

    dispatch(addMealEntries(newEntries));
  };

  return (
    <>
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
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleRepeatMealType(mealType)}
                            disabled={!repeatableMealTypes.has(mealType)}
                            sx={{ textTransform: "none" }}
                          >
                            {copy.repeat}
                          </Button>
                          <Chip
                            size="small"
                            label={`${entries.length} ${copy.items} / ${mealCalories.toFixed(0)} ${t(
                              "common.kcal"
                            )}`}
                          />
                        </Stack>
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
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                "&:hover": {
                                  bgcolor: "rgba(0,0,0,0.02)",
                                },
                              }}
                            >
                              <Typography sx={{ fontWeight: 600, flex: 1 }}>
                                {getProductDisplayName(item.product, language)}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  {item.quantity} {item.product.unit} /{" "}
                                  {(
                                    (item.product.nutrients.calories * item.quantity) /
                                    100
                                  ).toFixed(0)}{" "}
                                  {t("common.kcal")}
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={() => handleEditClick(item)}
                                  sx={{ minWidth: "auto", p: 0.5 }}
                                >
                                  {copy.edit}
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => handleDeleteClick(item)}
                                  sx={{ minWidth: "auto", p: 0.5, color: "error.main" }}
                                >
                                  {copy.delete}
                                </Button>
                              </Stack>
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

      <InlineEditDialog
        key={editingItem?.id ?? "empty"}
        item={editingItem}
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
        onDelete={() => {
          if (editingItem) {
            handleDeleteClick(editingItem);
            setShowEditDialog(false);
            setEditingItem(null);
          }
        }}
        mealTypes={mealLabels}
        t={t}
        language={language}
        copy={copy}
      />
    </>
  );
};
