import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Alert,
  Chip,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import type { AppDispatch } from "../../app/store";
import type { RootState } from "../../app/store";
import { publishCommunityPost } from "../community/communitySlice";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { addDays, formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { getProductDisplayName } from "@domain/products/productDisplay";
import type { MealEntry, MealType } from "@domain/meal/types";
import { EmptyState, SectionCard } from "@shared/ui";
import type { AppLanguage } from "@shared/types/i18n";
import {
  addMealEntriesToCloud,
  removeMealEntryFromCloud,
  updateMealEntryInCloud,
} from "./mealCloudSync";
import { useMealActionFeedback } from "./useMealActionFeedback";

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const overviewCopy = {
  uk: {
    title: "Сьогоднішні прийоми їжі",
    subtitle: "Переглядайте сніданок, обід, вечерю та перекуси в одному місці.",
    empty: "На сьогодні ще немає доданих продуктів.",
    emptyGroup: "Поки тут порожньо.",
    emptyHint: "Додайте перший продукт або повторіть вчорашній прийом, якщо день схожий.",
    items: "позицій",
    repeat: "Повторити вчорашнє",
    edit: "Редагувати",
    delete: "Видалити",
    cancel: "Скасувати",
    save: "Зберегти",
    editTitle: "Редагування запису",
    share: "Поділитися блюдом",
    shared: "Страва з щоденника",
    saving: "Зберігаю зміни прийому їжі в хмару...",
    confirmedEdit: "Запис оновлено і підтверджено backend.",
    confirmedDelete: "Запис видалено і підтверджено backend.",
    confirmedRepeat: "Вчорашній прийом додано до сьогодні і підтверджено backend.",
    failedEdit: "Не вдалося оновити запис.",
    failedDelete: "Не вдалося видалити запис.",
    failedRepeat: "Не вдалося повторити прийом їжі.",
    retry: "Спробувати ще раз",
  },
  pl: {
    title: "Dzisiejsze posiłki",
    subtitle: "Zobacz śniadanie, obiad, kolację i przekąski w jednym miejscu.",
    empty: "Na dziś nie dodano jeszcze żadnych produktów.",
    emptyGroup: "Na razie pusto.",
    emptyHint: "Dodaj pierwszy produkt albo powtórz wczorajszy posiłek, jeśli dzień wygląda podobnie.",
    items: "produktów",
    repeat: "Powtórz wczoraj",
    edit: "Edytuj",
    delete: "Usuń",
    cancel: "Anuluj",
    save: "Zapisz",
    editTitle: "Edycja wpisu",
    share: "Udostępnij posiłek",
    shared: "Posiłek z dziennika",
    saving: "Zapisuję zmiany posiłku w chmurze...",
    confirmedEdit: "Wpis zaktualizowany i potwierdzony przez backend.",
    confirmedDelete: "Wpis usunięty i potwierdzony przez backend.",
    confirmedRepeat: "Wczorajszy posiłek dodany do dziś i potwierdzony przez backend.",
    failedEdit: "Nie udało się zaktualizować wpisu.",
    failedDelete: "Nie udało się usunąć wpisu.",
    failedRepeat: "Nie udało się powtórzyć posiłku.",
    retry: "Spróbuj ponownie",
  },
  en: {
    title: "Today's meals",
    subtitle: "See breakfast, lunch, dinner, and snacks in one place.",
    empty: "No products have been added for today yet.",
    emptyGroup: "Nothing here yet.",
    emptyHint: "Add the first product or repeat yesterday's meal if the day is similar.",
    items: "items",
    repeat: "Repeat yesterday",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    editTitle: "Edit entry",
    share: "Share meal",
    shared: "Diary meal",
    saving: "Saving meal changes to cloud...",
    confirmedEdit: "Entry updated and confirmed by the backend.",
    confirmedDelete: "Entry deleted and confirmed by the backend.",
    confirmedRepeat: "Yesterday's meal was added to today and confirmed by the backend.",
    failedEdit: "Could not update the entry.",
    failedDelete: "Could not delete the entry.",
    failedRepeat: "Could not repeat the meal.",
    retry: "Try again",
  },
} as const;

type OverviewCopy = (typeof overviewCopy)[keyof typeof overviewCopy];

const InlineEditPanel = ({
  item,
  open,
  onClose,
  onSave,
  onDelete,
  saving = false,
  mealTypes,
  t,
  appLanguage,
  copy,
}: {
  item: MealEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (quantity: number, mealType: MealType) => void;
  onDelete: () => void;
  saving?: boolean;
  mealTypes: Record<MealType, string>;
  t: (key: string) => string;
  appLanguage: AppLanguage;
  copy: OverviewCopy;
}) => {
  const [quantity, setQuantity] = useState<number | "">(item?.quantity ?? "");
  const [mealType, setMealType] = useState<MealType>(item?.mealType ?? "lunch");

  const handleSave = () => {
    if (typeof quantity === "number" && quantity > 0) {
      onSave(quantity, mealType);
    }
  };

  if (!open || !item) return null;

  return (
    <Paper
      className="sn-premium-panel"
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: "rgba(15, 118, 110, 0.28)",
      }}
    >
      <Stack spacing={2}>
        <Typography sx={{ fontWeight: 800 }}>
          {copy.editTitle}: {getProductDisplayName(item.product, appLanguage)}
        </Typography>
        <TextField
          type="text"
          label={`${t("meal.quantity")} (${item.product.unit})`}
          value={quantity}
          onChange={(e) => {
            const value = e.target.value;
            const nextQuantity = Number(value);
            setQuantity(
              value === "" || !Number.isFinite(nextQuantity) ? "" : nextQuantity
            );
          }}
          onFocus={(event) => selectInputValue(event.target)}
          onClick={(event) => selectInputValue(event.currentTarget)}
          slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "done" } }}
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
      <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
        <Button onClick={onDelete} color="error" variant="text" disabled={saving}>
          {copy.delete}
        </Button>
        <Button onClick={onClose} variant="text" disabled={saving}>
          {copy.cancel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || typeof quantity !== "number" || quantity <= 0}
        >
          {saving ? copy.saving : copy.save}
        </Button>
      </Stack>
      </Stack>
    </Paper>
  );
};

export const MealDayOverview = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const meal = useSelector((state: RootState) => state.meal);
  const user = useSelector((state: RootState) => state.auth.user);
  const { appLanguage, t } = useLanguage();
  const copy = overviewCopy[appLanguage];
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [editingItem, setEditingItem] = useState<MealEntry | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const {
    notice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  } = useMealActionFeedback({
    saving: {
      add: copy.saving,
      edit: copy.saving,
      delete: copy.saving,
      repeat: copy.saving,
      saveTemplate: copy.saving,
      applyTemplate: copy.saving,
      saveProduct: copy.saving,
    },
    confirmed: {
      add: copy.confirmedRepeat,
      edit: copy.confirmedEdit,
      delete: copy.confirmedDelete,
      repeat: copy.confirmedRepeat,
      saveTemplate: copy.confirmedEdit,
      applyTemplate: copy.confirmedRepeat,
      saveProduct: copy.confirmedEdit,
    },
    failed: {
      add: copy.failedRepeat,
      edit: copy.failedEdit,
      delete: copy.failedDelete,
      repeat: copy.failedRepeat,
      saveTemplate: copy.failedEdit,
      applyTemplate: copy.failedRepeat,
      saveProduct: copy.failedEdit,
    },
    retry: copy.retry,
  });

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
    setShowEditPanel(true);
  };

  const handleDeleteClick = async (item: MealEntry) => {
    return runMealAction({
      actionId: `delete-${item.id}`,
      kind: "delete",
      action: () => removeMealEntryFromCloud(dispatch, meal, item.id),
    });
  };

  const handleSaveEdit = async (quantity: number, mealType: MealType) => {
    if (editingItem) {
      const saved = await runMealAction({
        actionId: `edit-${editingItem.id}`,
        kind: "edit",
        action: () =>
          updateMealEntryInCloud(dispatch, meal, {
          id: editingItem.id,
          product: editingItem.product,
          quantity,
          mealType,
          }),
      });

      if (saved) {
        setShowEditPanel(false);
        setEditingItem(null);
      }
    }
  };

  const handleRepeatMealType = async (mealType: MealType) => {
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

    await runMealAction({
      actionId: `repeat-${mealType}`,
      kind: "repeat",
      action: () => addMealEntriesToCloud(dispatch, meal, newEntries),
    });
  };

  const handleShareMealType = (mealType: MealType, entries: MealEntry[]) => {
    if (!user || entries.length === 0) {
      return;
    }

    const calories = entries.reduce(
      (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
      0
    );
    const protein = entries.reduce(
      (sum, item) => sum + (item.product.nutrients.protein * item.quantity) / 100,
      0
    );
    const ingredients = entries.map((item) => getProductDisplayName(item.product, appLanguage));

    dispatch(
      publishCommunityPost({
        type: "experience",
        title: `${mealLabels[mealType]} · ${calories.toFixed(0)} ${t("common.kcal")}`,
        body: `${copy.shared}: ${ingredients.join(", ")}. Protein: ${protein.toFixed(1)} ${t(
          "common.g"
        )}.`,
        authorId: user.id,
        authorName: user.name,
        ingredients,
      })
    );
  };

  return (
    <>
      <SectionCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.6}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
                {copy.title}
              </Typography>
              <Typography color="text.secondary">{copy.subtitle}</Typography>
            </Stack>
            <Chip
              label={formatLocalDateKey(todayKey, appLanguage, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              sx={{ textTransform: "capitalize" }}
            />
          </Stack>

          {notice ? (
            <Alert
              severity={notice.severity}
              action={
                notice.retryable ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => void retryMealAction()}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    {copy.retry}
                  </Button>
                ) : undefined
              }
              onClose={clearFeedback}
            >
              {notice.text}
            </Alert>
          ) : null}

          {todayEntries.length === 0 ? (
            <EmptyState
              title={copy.empty}
              description={copy.emptyHint}
              compact
            />
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
                  <Paper
                    key={mealType}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "var(--sn-surface-elevated)",
                      borderColor: "var(--sn-border-soft)",
                    }}
                  >
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
                            disabled={
                              !repeatableMealTypes.has(mealType) ||
                              isSavingAction(`repeat-${mealType}`)
                            }
                            sx={{ textTransform: "none" }}
                          >
                            {copy.repeat}
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleShareMealType(mealType, entries)}
                            disabled={entries.length === 0 || !user}
                            sx={{ textTransform: "none" }}
                          >
                            {copy.share}
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
                        <EmptyState title={copy.emptyGroup} compact />
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
                                {getProductDisplayName(item.product, appLanguage)}
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
                                  disabled={isSavingAction(`delete-${item.id}`)}
                                  sx={{ minWidth: "auto", p: 0.5 }}
                                >
                                  {copy.edit}
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => handleDeleteClick(item)}
                                  disabled={isSavingAction(`delete-${item.id}`)}
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
      </SectionCard>

      <InlineEditPanel
        key={editingItem?.id ?? "empty"}
        item={editingItem}
        open={showEditPanel}
        onClose={() => {
          setShowEditPanel(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
        onDelete={() => {
          if (editingItem) {
            void handleDeleteClick(editingItem).then((saved) => {
              if (saved) {
                setShowEditPanel(false);
                setEditingItem(null);
              }
            });
          }
        }}
        mealTypes={mealLabels}
        t={t}
        appLanguage={appLanguage}
        copy={copy}
        saving={
          Boolean(editingItem) &&
          (isSavingAction(`edit-${editingItem?.id}`) ||
            isSavingAction(`delete-${editingItem?.id}`))
        }
      />
    </>
  );
};
