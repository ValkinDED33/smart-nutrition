import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  activateWeeklyDayOff,
  buyMonthlyDayOff,
  completeMotivationTask,
  refreshMotivationTasks,
  resetMotivationProgress,
} from "./profileSlice";
import { buildProfileStateAfterAction } from "./profileCloudSync";
import { useProfileCloudAction } from "./useProfileCloudAction";
import { useLanguage } from "../../shared/language";
import {
  calculatePaidDayOffCost,
  canUseFreeDay,
  canUsePaidDay,
  getLocalizedAchievementCopy,
  getLocalizedMotivationTaskCopy,
} from "@domain/profile/motivation";
import type { AppLanguage } from "../../shared/types/i18n";

const copyByLanguage = {
  uk: {
    title: "Центр мотивації",
    subtitle:
      "Завдання, бали, стратегія day off і прогрес тепер зібрані в одному профільному блоці.",
    points: "Бали",
    level: "Рівень",
    completed: "Закрито завдань",
    freeDay: "Щотижневий day off",
    paidDay: "Платний day off",
    freeReady: "Уже доступний",
    freeLocked: "Відкриється через 7 днів після останнього використання",
    paidReady: "Можна купити цього місяця",
    paidLocked: "Уже використано цього місяця",
    complete: "Закрити",
    skipped: "Захищено day off",
    done: "Готово",
    useFreeDay: "Використати щотижневий day off",
    buyPaidDay: "Купити місячний day off",
    reset: "Скинути прогрес",
    confirmFreeTitle: "Використати щотижневий day off?",
    confirmPaidTitle: "Купити й використати місячний day off?",
    confirmResetTitle: "Скинути мотиваційний прогрес?",
    confirmBody:
      "Відкриті завдання за сьогодні не будуть провалені, а захистяться day off. Підтвердити?",
    confirmPaidBody: "Перед використанням day off буде списано бали.",
    confirmResetBody:
      "Бали, історія та досягнення очистяться. Дані харчування залишаться без змін.",
    cancel: "Скасувати",
    confirm: "Так",
    achievements: "Досягнення",
    recentHistory: "Останні дії",
    emptyHistory: "Поки що немає мотиваційних дій.",
    pointsSuffix: "балів",
    paidCostHint: "Вартість платного day off",
    saving: "Зберігаю...",
    saveError: "Не вдалося зберегти зміни в хмарі. Спробуйте ще раз.",
  },
  pl: {
    title: "Centrum motywacji",
    subtitle:
      "Zadania, punkty, strategia day off i stały progres są teraz zebrane w jednym miejscu profilu.",
    points: "Punkty",
    level: "Poziom",
    completed: "Zamknięte zadania",
    freeDay: "Tygodniowy day off",
    paidDay: "Płatny day off",
    freeReady: "Już dostępny",
    freeLocked: "Odblokuje się 7 dni po ostatnim użyciu",
    paidReady: "Można kupić w tym miesiącu",
    paidLocked: "Już użyty w tym miesiącu",
    complete: "Zamknij",
    skipped: "Chronione przez day off",
    done: "Gotowe",
    useFreeDay: "Użyj tygodniowego day off",
    buyPaidDay: "Kup miesięczny day off",
    reset: "Resetuj progres",
    confirmFreeTitle: "Użyć tygodniowego day off?",
    confirmPaidTitle: "Kupić i użyć miesięcznego day off?",
    confirmResetTitle: "Zresetować progres motywacji?",
    confirmBody:
      "Otwarte zadania z dziś zostaną ochronione przez day off zamiast zaliczyć porażkę. Potwierdzasz?",
    confirmPaidBody: "Punkty zostaną odjęte przed użyciem day off.",
    confirmResetBody:
      "Punkty, historia i osiągnięcia zostaną wyczyszczone. Dane żywieniowe pozostaną bez zmian.",
    cancel: "Anuluj",
    confirm: "Tak",
    achievements: "Osiągnięcia",
    recentHistory: "Ostatnie działania",
    emptyHistory: "Nie ma jeszcze działań motywacyjnych.",
    pointsSuffix: "pkt",
    paidCostHint: "Koszt płatnego day off",
    saving: "Zapisuję...",
    saveError: "Nie udało się zapisać zmian w chmurze. Spróbuj ponownie.",
  },
  en: {
    title: "Motivation Center",
    subtitle:
      "Tasks, points, day off strategy, and steady progress are now grouped in one profile block.",
    points: "Points",
    level: "Level",
    completed: "Tasks completed",
    freeDay: "Weekly day off",
    paidDay: "Paid day off",
    freeReady: "Available now",
    freeLocked: "Unlocks 7 days after last use",
    paidReady: "Available this month",
    paidLocked: "Already used this month",
    complete: "Complete",
    skipped: "Protected by day off",
    done: "Done",
    useFreeDay: "Use weekly day off",
    buyPaidDay: "Buy monthly day off",
    reset: "Reset progress",
    confirmFreeTitle: "Use weekly day off?",
    confirmPaidTitle: "Buy and use monthly day off?",
    confirmResetTitle: "Reset motivation progress?",
    confirmBody:
      "Open tasks for today will be protected by day off instead of being marked as failed. Confirm?",
    confirmPaidBody: "Points will be deducted before using day off.",
    confirmResetBody:
      "Points, history, and achievements will be cleared. Nutrition data stays unchanged.",
    cancel: "Cancel",
    confirm: "Yes",
    achievements: "Achievements",
    recentHistory: "Recent activity",
    emptyHistory: "No motivation activity yet.",
    pointsSuffix: "pts",
    paidCostHint: "Paid day off cost",
    saving: "Saving...",
    saveError: "Could not save changes to cloud. Try again.",
  },
} as const;

type MotivationCopy = (typeof copyByLanguage)[keyof typeof copyByLanguage];
type PendingAction = "free" | "paid" | "reset" | null;
const MOTIVATION_TEXT_SECONDARY = "text.secondary";
const MOTIVATION_CARD_BORDER = "1px solid var(--sn-border-soft)";

const getMotivationCopy = (language: AppLanguage): MotivationCopy => {
  switch (language) {
    case "uk":
      return copyByLanguage.uk;
    case "pl":
      return copyByLanguage.pl;
    case "en":
    default:
      return copyByLanguage.en;
  }
};

const getMotivationLocale = (language: AppLanguage): string => {
  switch (language) {
    case "uk":
      return "uk-UA";
    case "pl":
      return "pl-PL";
    case "en":
    default:
      return "en-US";
  }
};

export const MotivationHubCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const { motivation, goal } = profile;
  const { appLanguage } = useLanguage();
  const copy = getMotivationCopy(appLanguage);
  const profileAction = useProfileCloudAction();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<PendingAction>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(refreshMotivationTasks(undefined));
  }, [dispatch]);

  const paidDayCost = useMemo(
    () => calculatePaidDayOffCost(motivation.history),
    [motivation.history]
  );
  const freeDayAvailable = canUseFreeDay(motivation.freeDayLastUsedAt);
  const paidDayAvailable = canUsePaidDay(motivation.paidDayLastUsedMonth);
  const levelProgress = ((motivation.points % 120) / 120) * 100;
  const locale = getMotivationLocale(appLanguage);

  const saveMotivationAction = async (
    action: ReturnType<
      | typeof activateWeeklyDayOff
      | typeof buyMonthlyDayOff
      | typeof completeMotivationTask
    >
  ) => {
    const nextProfile = await profileAction.runProfileAction(action);

    if (!nextProfile) {
      throw new Error(copy.saveError);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (savingTaskId !== null || savingAction !== null || profileAction.saving) {
      return;
    }

    setSavingTaskId(taskId);
    setSaveError(null);

    try {
      await saveMotivationAction(completeMotivationTask({ taskId }));
    } catch {
      setSaveError(copy.saveError);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleConfirm = async () => {
    if (
      !pendingAction ||
      savingAction !== null ||
      savingTaskId !== null ||
      profileAction.saving
    ) {
      return;
    }

    setSavingAction(pendingAction);
    setSaveError(null);

    try {
      if (pendingAction === "free") {
        await saveMotivationAction(activateWeeklyDayOff(undefined));
      } else if (pendingAction === "paid") {
        await saveMotivationAction(buyMonthlyDayOff(undefined));
      } else if (pendingAction === "reset") {
        const resetProfile = buildProfileStateAfterAction(
          profile,
          resetMotivationProgress()
        );
        const refreshedProfile = buildProfileStateAfterAction(
          resetProfile,
          refreshMotivationTasks(undefined)
        );

        const savedProfile = await profileAction.runProfileStateSave(refreshedProfile);

        if (!savedProfile) {
          throw new Error(copy.saveError);
        }
      }

      setPendingAction(null);
    } catch {
      setSaveError(copy.saveError);
    } finally {
      setSavingAction(null);
    }
  };

  const confirmTitle =
    pendingAction === "free"
      ? copy.confirmFreeTitle
      : pendingAction === "paid"
        ? copy.confirmPaidTitle
        : copy.confirmResetTitle;
  const confirmBody =
    pendingAction === "free"
      ? copy.confirmBody
      : pendingAction === "paid"
        ? copy.confirmPaidBody
        : copy.confirmResetBody;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: MOTIVATION_CARD_BORDER,
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.8}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color={MOTIVATION_TEXT_SECONDARY}>{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.points}: ${motivation.points}`} color="primary" />
          <Chip label={`${copy.level}: ${motivation.level}`} />
          <Chip label={`${copy.completed}: ${motivation.completedTasks}`} />
          <Chip
            label={`${copy.freeDay}: ${freeDayAvailable ? copy.freeReady : copy.freeLocked}`}
            color={freeDayAvailable ? "success" : "default"}
          />
          <Chip
            label={`${copy.paidDay}: ${paidDayAvailable ? copy.paidReady : copy.paidLocked}`}
            color={paidDayAvailable ? "success" : "default"}
          />
        </Stack>

        <Stack spacing={1}>
          {profileAction.saving ? (
            <Alert severity="info">{copy.saving}</Alert>
          ) : null}
          {saveError || profileAction.hasError ? (
            <Alert severity="error" onClose={() => {
              setSaveError(null);
              profileAction.clearError();
            }}>
              {saveError ?? copy.saveError}
            </Alert>
          ) : null}

          <Typography sx={{ fontWeight: 700 }}>
            {copy.level}: {motivation.level}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={levelProgress}
            sx={{ height: 10, borderRadius: 999 }}
          />
        </Stack>

        <Stack spacing={1.25}>
          {motivation.activeTasks.map((task) => {
            const isDone = Boolean(task.completedAt);
            const isSkipped = Boolean(task.skippedWithDayOffAt);
            const localizedTask = getLocalizedMotivationTaskCopy({
              language: appLanguage,
              taskId: task.id,
              goal,
              fallbackTitle: task.title,
              fallbackDescription: task.description,
            });

            return (
              <Paper
                key={task.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: MOTIVATION_CARD_BORDER,
                  backgroundColor: "var(--sn-surface-elevated)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.6}>
                    <Typography sx={{ fontWeight: 800 }}>{localizedTask.title}</Typography>
                    <Typography color={MOTIVATION_TEXT_SECONDARY}>
                      {localizedTask.description}
                    </Typography>
                    <Chip
                      label={`${task.points} ${copy.pointsSuffix}`}
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  </Stack>

                  <Button
                    variant={isDone ? "outlined" : "contained"}
                    disabled={
                      isDone ||
                      isSkipped ||
                      savingTaskId !== null ||
                      savingAction !== null ||
                      profileAction.saving
                    }
                    onClick={() => {
                      void handleCompleteTask(task.id);
                    }}
                    sx={{
                      minWidth: 180,
                      alignSelf: { xs: "stretch", md: "center" },
                      textTransform: "none",
                      borderRadius: 999,
                    }}
                  >
                    {savingTaskId === task.id
                      ? copy.saving
                      : isDone
                        ? copy.done
                        : isSkipped
                          ? copy.skipped
                          : copy.complete}
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            disabled={!freeDayAvailable || savingTaskId !== null || savingAction !== null}
            onClick={() => setPendingAction("free")}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {copy.useFreeDay}
          </Button>
          <Button
            variant="outlined"
            disabled={
              !paidDayAvailable ||
              motivation.points < paidDayCost ||
              savingTaskId !== null ||
              savingAction !== null ||
              profileAction.saving
            }
            onClick={() => setPendingAction("paid")}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {copy.buyPaidDay} ({paidDayCost} {copy.pointsSuffix})
          </Button>
          <Button
            color="error"
            variant="text"
            disabled={savingTaskId !== null || savingAction !== null || profileAction.saving}
            onClick={() => setPendingAction("reset")}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {copy.reset}
          </Button>
        </Stack>

        {motivation.points < paidDayCost && (
          <Alert severity="info">
            {copy.paidCostHint}: {paidDayCost} {copy.pointsSuffix}
          </Alert>
        )}

        <Stack spacing={1.2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {copy.achievements}
          </Typography>
          {motivation.achievements.map((achievement) => {
            const localizedAchievement = getLocalizedAchievementCopy({
              language: appLanguage,
              achievementId: achievement.id,
              fallbackTitle: achievement.title,
              fallbackDescription: achievement.description,
            });

            return (
              <Stack key={achievement.id} spacing={0.6}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography sx={{ fontWeight: 700 }}>
                  {localizedAchievement.title}
                </Typography>
                <Typography color={MOTIVATION_TEXT_SECONDARY}>
                  {achievement.progress}/{achievement.target}
                </Typography>
              </Stack>
              <Typography color={MOTIVATION_TEXT_SECONDARY}>
                {localizedAchievement.description}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(achievement.progress / achievement.target) * 100}
                color={achievement.unlockedAt ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 999 }}
              />
              </Stack>
            );
          })}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {copy.recentHistory}
          </Typography>
          {motivation.history.length === 0 ? (
            <Typography color={MOTIVATION_TEXT_SECONDARY}>{copy.emptyHistory}</Typography>
          ) : (
            motivation.history.slice(0, 5).map((item) => {
              const localizedTask = getLocalizedMotivationTaskCopy({
                language: appLanguage,
                taskId: item.taskId,
                goal,
                fallbackTitle: item.title,
              });

              return (
                <Paper
                  key={`${item.taskId}-${item.completedAt}`}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: MOTIVATION_CARD_BORDER,
                    backgroundColor: "var(--sn-surface-elevated)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {localizedTask.title}
                    </Typography>
                    <Typography color={MOTIVATION_TEXT_SECONDARY}>
                      {item.skipped ? 0 : item.pointsEarned} {copy.pointsSuffix}
                    </Typography>
                  </Stack>
                  <Typography color={MOTIVATION_TEXT_SECONDARY}>
                    {item.skipped
                      ? copy.skipped
                      : new Date(item.completedAt).toLocaleString(locale)}
                  </Typography>
                </Paper>
              );
            })
          )}
        </Stack>

        {pendingAction !== null && (
          <Paper
            className="sn-premium-panel"
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              borderColor: "rgba(234, 179, 8, 0.45)",
            }}
          >
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900 }}>{confirmTitle}</Typography>
              <Typography color={MOTIVATION_TEXT_SECONDARY}>{confirmBody}</Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                <Button onClick={() => setPendingAction(null)}>{copy.cancel}</Button>
                <Button
                  onClick={() => {
                    void handleConfirm();
                  }}
                  disabled={savingAction !== null || profileAction.saving}
                  variant="contained"
                >
                  {savingAction === pendingAction ? copy.saving : copy.confirm}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};

export default MotivationHubCard;
