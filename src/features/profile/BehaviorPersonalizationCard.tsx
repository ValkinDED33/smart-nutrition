import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import {
  generateBehaviorProfileAnalysis,
  getReminderShiftMinutes,
  hasBehaviorReminderSuggestion,
  type BehaviorProfileStatus,
} from "@domain/profile/behaviorProfile";
import { selectMealItems } from "../meal/selectors";
import { updateNotificationPreferences } from "./profileSlice";
import type { MealType } from "@domain/meal/types";
import type { AppLanguage } from "@shared/types/i18n";

const HABIT_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const ALIGN_START = "flex-start";
const SINGLE_COLUMN_GRID = "1fr";
const TWO_COLUMN_GRID = "repeat(2, minmax(0, 1fr))";

const copyByLanguage = {
  uk: {
    title: "Персоналізація звичок",
    subtitle: (name: string) =>
      `${name} переглянув ваші патерни логування та підготував персональні часові підказки і фокус на звички.`,
    score: "Оцінка ритму",
    activeDays: "Активних днів",
    currentStreak: "Поточна серія",
    bestStreak: "Найкраща серія",
    strongest: "Найсильніша звичка",
    weakest: "Найслабша звичка",
    averageTime: "Середній час",
    reminder: "Поточне нагадування",
    suggested: "Рекомендований час",
    apply: "Застосувати розумний розклад",
    noSuggestion: "Ще замало даних для нової рекомендації",
    consistency: "стабільність",
    minutes: "хв",
    statuses: {
      strong: "Ритм сильний",
      steady: "Ритм формується",
      fragile: "Потрібна стабілізація",
    } satisfies Record<BehaviorProfileStatus, string>,
  },
  pl: {
    title: "Personalizacja zachowań",
    subtitle: (name: string) =>
      `${name} przeanalizował Twoje wzorce logowania i przygotował osobiste podpowiedzi czasowe oraz fokus na nawyki.`,
    score: "Ocena rytmu",
    activeDays: "Aktywne dni",
    currentStreak: "Aktualna seria",
    bestStreak: "Najlepsza seria",
    strongest: "Najmocniejszy nawyk",
    weakest: "Najsłabszy nawyk",
    averageTime: "Średnia pora",
    reminder: "Obecne przypomnienie",
    suggested: "Rekomendowany czas",
    apply: "Zastosuj inteligentny harmonogram",
    noSuggestion: "Za mało danych na nową rekomendację",
    consistency: "stabilność",
    minutes: "min",
    statuses: {
      strong: "Rytm jest mocny",
      steady: "Rytm się buduje",
      fragile: "Potrzebna stabilizacja",
    } satisfies Record<BehaviorProfileStatus, string>,
  },
  en: {
    title: "Habit personalization",
    subtitle: (name: string) =>
      `${name} reviewed your logging patterns and prepared personal timing hints and habit focus.`,
    score: "Rhythm score",
    activeDays: "Active days",
    currentStreak: "Current streak",
    bestStreak: "Best streak",
    strongest: "Strongest habit",
    weakest: "Weakest habit",
    averageTime: "Average time",
    reminder: "Current reminder",
    suggested: "Recommended time",
    apply: "Apply smart schedule",
    noSuggestion: "Not enough data for a new recommendation yet",
    consistency: "consistency",
    minutes: "min",
    statuses: {
      strong: "Rhythm is strong",
      steady: "Rhythm is building",
      fragile: "Needs stabilization",
    } satisfies Record<BehaviorProfileStatus, string>,
  },
} as const;

const statusColor = {
  strong: "success",
  steady: "info",
  fragile: "warning",
} as const;

const getCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return copyByLanguage.pl;
    case "en":
      return copyByLanguage.en;
    case "uk":
    default:
      return copyByLanguage.uk;
  }
};

const getStatusLabel = (
  statuses: Record<BehaviorProfileStatus, string>,
  status: BehaviorProfileStatus
) => {
  switch (status) {
    case "strong":
      return statuses.strong;
    case "steady":
      return statuses.steady;
    case "fragile":
    default:
      return statuses.fragile;
  }
};

const getStatusColor = (status: BehaviorProfileStatus) => {
  switch (status) {
    case "strong":
      return statusColor.strong;
    case "steady":
      return statusColor.steady;
    case "fragile":
    default:
      return statusColor.fragile;
  }
};

const getMealValue = <TValue,>(
  values: Record<MealType, TValue>,
  mealType: MealType
) => {
  switch (mealType) {
    case "lunch":
      return values.lunch;
    case "dinner":
      return values.dinner;
    case "snack":
      return values.snack;
    case "breakfast":
    default:
      return values.breakfast;
  }
};

export const BehaviorPersonalizationCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { reminderTimes, assistant } = useSelector((state: RootState) => state.profile);
  const { t, appLanguage } = useLanguage();
  const copy = getCopy(appLanguage);

  const analysis = generateBehaviorProfileAnalysis({
    items,
    reminderTimes,
  });

  const hasSuggestion = hasBehaviorReminderSuggestion(reminderTimes, analysis);

  const mealLabel = (mealType: MealType) => t(`mealType.${mealType}`);

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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.6}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle(assistant.name)}</Typography>
          </Stack>
          <Chip
            label={`${copy.score}: ${analysis.consistencyScore}/100`}
            color={getStatusColor(analysis.status)}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.activeDays}: ${analysis.activeDays}/14`} />
          <Chip label={`${copy.currentStreak}: ${analysis.currentStreak}`} />
          <Chip label={`${copy.bestStreak}: ${analysis.bestStreak}`} />
          <Chip
            label={getStatusLabel(copy.statuses, analysis.status)}
            color={getStatusColor(analysis.status)}
          />
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 1,
            borderColor: "rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(135deg, rgba(240,249,255,0.86) 0%, rgba(236,253,245,0.88) 100%)",
          }}
        >
          <Stack spacing={0.7}>
            <Typography sx={{ fontWeight: 800 }}>
              {copy.strongest}:{" "}
              {analysis.strongestMealType ? mealLabel(analysis.strongestMealType) : "-"}
            </Typography>
            <Typography color="text.secondary">
              {copy.weakest}:{" "}
              {analysis.weakestMealType ? mealLabel(analysis.weakestMealType) : "-"}
            </Typography>
          </Stack>
        </Paper>

        <Stack
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: SINGLE_COLUMN_GRID, md: TWO_COLUMN_GRID },
            gap: 1.5,
          }}
        >
          {HABIT_MEAL_TYPES.map((mealType) => {
            const habit = getMealValue(analysis.mealHabits, mealType);
            const reminderTime = getMealValue(reminderTimes, mealType);
            const suggestedReminderTime = getMealValue(
              analysis.suggestedReminderTimes,
              mealType
            );
            const shift = getReminderShiftMinutes(
              reminderTime,
              suggestedReminderTime
            );
            const shiftPrefix = shift > 0 ? "+" : "";

            return (
              <Paper
                key={mealType}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  borderColor: "rgba(15, 23, 42, 0.08)",
                }}
              >
                <Stack spacing={0.8}>
                  <Typography sx={{ fontWeight: 800 }}>{mealLabel(mealType)}</Typography>
                  <Typography color="text.secondary">
                    {copy.averageTime}: {habit.averageLogTime ?? copy.noSuggestion}
                  </Typography>
                  <Typography color="text.secondary">
                    {copy.reminder}: {reminderTime}
                  </Typography>
                  <Typography color="text.secondary">
                    {copy.suggested}: {suggestedReminderTime}
                    {habit.hasSuggestion ? ` (${shiftPrefix}${shift} ${copy.minutes})` : ""}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${Math.round(habit.consistency * 100)}% ${copy.consistency}`}
                    color={
                      habit.consistency >= 0.75
                        ? "success"
                        : habit.consistency >= 0.45
                          ? "info"
                          : "warning"
                    }
                    sx={{ alignSelf: ALIGN_START }}
                  />
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Button
          variant="contained"
          disabled={!hasSuggestion}
          onClick={() =>
            dispatch(
              updateNotificationPreferences({
                reminderTimes: analysis.suggestedReminderTimes,
              })
            )
          }
          sx={{
            alignSelf: ALIGN_START,
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 999,
            background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
          }}
        >
          {copy.apply}
        </Button>
      </Stack>
    </Paper>
  );
};

export default BehaviorPersonalizationCard;
