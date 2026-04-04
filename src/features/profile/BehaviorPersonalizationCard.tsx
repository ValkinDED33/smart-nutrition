import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import {
  generateBehaviorProfileAnalysis,
  getReminderShiftMinutes,
  hasBehaviorReminderSuggestion,
  type BehaviorProfileStatus,
} from "../../shared/lib/behaviorProfile";
import { selectMealItems } from "../meal/selectors";
import { updateNotificationPreferences } from "./profileSlice";
import type { MealType } from "../../shared/types/meal";

const copyByLanguage = {
  uk: {
    title: "Behavior personalization",
    subtitle: (name: string) =>
      `${name} переглянув ваші патерни логування та підготував персональні часові підказки й фокус на звички.`,
    score: "Behavior score",
    activeDays: "Активних днів",
    currentStreak: "Поточна серія",
    bestStreak: "Найкраща серія",
    strongest: "Найсильніша звичка",
    weakest: "Найслабша звичка",
    averageTime: "Середній час",
    reminder: "Поточне нагадування",
    suggested: "Рекомендоване",
    apply: "Застосувати розумний розклад",
    noSuggestion: "Ще замало даних для нової рекомендації",
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
    score: "Behavior score",
    activeDays: "Aktywne dni",
    currentStreak: "Aktualna seria",
    bestStreak: "Najlepsza seria",
    strongest: "Najmocniejszy nawyk",
    weakest: "Najsłabszy nawyk",
    averageTime: "Średnia pora",
    reminder: "Obecne przypomnienie",
    suggested: "Rekomendacja",
    apply: "Zastosuj inteligentny harmonogram",
    noSuggestion: "Za mało danych na nową rekomendację",
    statuses: {
      strong: "Rytm jest mocny",
      steady: "Rytm się buduje",
      fragile: "Potrzebna stabilizacja",
    } satisfies Record<BehaviorProfileStatus, string>,
  },
} as const;

const statusColor = {
  strong: "success",
  steady: "info",
  fragile: "warning",
} as const;

export const BehaviorPersonalizationCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const { reminderTimes, assistant } = useSelector((state: RootState) => state.profile);
  const { t, language } = useLanguage();
  const copy = copyByLanguage[language];

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
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle(assistant.name)}</Typography>
          </Stack>
          <Chip
            label={`${copy.score}: ${analysis.consistencyScore}/100`}
            color={statusColor[analysis.status]}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.activeDays}: ${analysis.activeDays}/14`} />
          <Chip label={`${copy.currentStreak}: ${analysis.currentStreak}`} />
          <Chip label={`${copy.bestStreak}: ${analysis.bestStreak}`} />
          <Chip label={copy.statuses[analysis.status]} color={statusColor[analysis.status]} />
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 4,
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
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => {
            const habit = analysis.mealHabits[mealType];
            const shift = getReminderShiftMinutes(
              reminderTimes[mealType],
              analysis.suggestedReminderTimes[mealType]
            );
            const shiftPrefix = shift > 0 ? "+" : "";

            return (
              <Paper
                key={mealType}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 4,
                  borderColor: "rgba(15, 23, 42, 0.08)",
                }}
              >
                <Stack spacing={0.8}>
                  <Typography sx={{ fontWeight: 800 }}>{mealLabel(mealType)}</Typography>
                  <Typography color="text.secondary">
                    {copy.averageTime}: {habit.averageLogTime ?? copy.noSuggestion}
                  </Typography>
                  <Typography color="text.secondary">
                    {copy.reminder}: {reminderTimes[mealType]}
                  </Typography>
                  <Typography color="text.secondary">
                    {copy.suggested}: {analysis.suggestedReminderTimes[mealType]}
                    {habit.hasSuggestion ? ` (${shiftPrefix}${shift} min)` : ""}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${Math.round(habit.consistency * 100)}% consistency`}
                    color={habit.consistency >= 0.75 ? "success" : habit.consistency >= 0.45 ? "info" : "warning"}
                    sx={{ alignSelf: "flex-start" }}
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
            alignSelf: "flex-start",
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
