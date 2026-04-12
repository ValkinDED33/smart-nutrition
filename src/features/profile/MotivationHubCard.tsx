import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useLanguage } from "../../shared/language";
import {
  calculatePaidDayOffCost,
  canUseFreeDay,
  canUsePaidDay,
  getLocalizedAchievementCopy,
  getLocalizedMotivationTaskCopy,
} from "../../shared/lib/motivation";

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
  },
} as const;

type PendingAction = "free" | "paid" | "reset" | null;

export const MotivationHubCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { motivation, goal } = useSelector((state: RootState) => state.profile);
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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
  const locale = language === "uk" ? "uk-UA" : "pl-PL";

  const handleConfirm = () => {
    if (pendingAction === "free") {
      dispatch(activateWeeklyDayOff(undefined));
    } else if (pendingAction === "paid") {
      dispatch(buyMonthlyDayOff(undefined));
    } else if (pendingAction === "reset") {
      dispatch(resetMotivationProgress());
      dispatch(refreshMotivationTasks(undefined));
    }

    setPendingAction(null);
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
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.8}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
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
              language,
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
                  borderRadius: 4,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  backgroundColor: "rgba(248,250,252,0.9)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.6}>
                    <Typography sx={{ fontWeight: 800 }}>{localizedTask.title}</Typography>
                    <Typography color="text.secondary">
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
                    disabled={isDone || isSkipped}
                    onClick={() =>
                      dispatch(
                        completeMotivationTask({
                          taskId: task.id,
                        })
                      )
                    }
                    sx={{
                      minWidth: 180,
                      alignSelf: { xs: "stretch", md: "center" },
                      textTransform: "none",
                      borderRadius: 999,
                    }}
                  >
                    {isDone ? copy.done : isSkipped ? copy.skipped : copy.complete}
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            disabled={!freeDayAvailable}
            onClick={() => setPendingAction("free")}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {copy.useFreeDay}
          </Button>
          <Button
            variant="outlined"
            disabled={!paidDayAvailable || motivation.points < paidDayCost}
            onClick={() => setPendingAction("paid")}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {copy.buyPaidDay} ({paidDayCost} {copy.pointsSuffix})
          </Button>
          <Button
            color="error"
            variant="text"
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
              language,
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
                <Typography color="text.secondary">
                  {achievement.progress}/{achievement.target}
                </Typography>
              </Stack>
              <Typography color="text.secondary">
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
            <Typography color="text.secondary">{copy.emptyHistory}</Typography>
          ) : (
            motivation.history.slice(0, 5).map((item) => {
              const localizedTask = getLocalizedMotivationTaskCopy({
                language,
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
                    borderRadius: 4,
                    border: "1px solid rgba(15, 23, 42, 0.06)",
                    backgroundColor: "rgba(248,250,252,0.85)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {localizedTask.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {item.skipped ? 0 : item.pointsEarned} {copy.pointsSuffix}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {item.skipped
                      ? copy.skipped
                      : new Date(item.completedAt).toLocaleString(locale)}
                  </Typography>
                </Paper>
              );
            })
          )}
        </Stack>
      </Stack>

      <Dialog open={pendingAction !== null} onClose={() => setPendingAction(null)}>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmBody}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingAction(null)}>{copy.cancel}</Button>
          <Button onClick={handleConfirm} variant="contained">
            {copy.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MotivationHubCard;
