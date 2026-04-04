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
} from "../../shared/lib/motivation";

const copyByLanguage = {
  uk: {
    title: "Motivation hub",
    subtitle:
      "Tasks, points, rest-day strategy, and steady progress now live inside your profile.",
    points: "Points",
    level: "Level",
    completed: "Completed tasks",
    freeDay: "Weekly day off",
    paidDay: "Paid day off",
    freeReady: "Available now",
    freeLocked: "Will unlock 7 days after the last use",
    paidReady: "Can be bought this month",
    paidLocked: "Already used this month",
    complete: "Complete",
    skipped: "Protected by day off",
    done: "Done",
    useFreeDay: "Use weekly day off",
    buyPaidDay: "Buy monthly day off",
    reset: "Reset progress",
    confirmFreeTitle: "Use weekly day off?",
    confirmPaidTitle: "Buy and use a monthly day off?",
    confirmResetTitle: "Reset motivation progress?",
    confirmBody:
      "This will protect today's open tasks instead of failing them. Are you sure?",
    confirmPaidBody: "Points will be deducted before the day off is used.",
    confirmResetBody:
      "Points, history, and achievements will be cleared. Nutrition data stays safe.",
    cancel: "Cancel",
    confirm: "Yes",
    achievements: "Achievements",
    recentHistory: "Recent history",
    emptyHistory: "No motivation actions yet.",
  },
  pl: {
    title: "Motivation hub",
    subtitle:
      "Tasks, points, rest-day strategy, and steady progress now live inside your profile.",
    points: "Points",
    level: "Level",
    completed: "Completed tasks",
    freeDay: "Weekly day off",
    paidDay: "Paid day off",
    freeReady: "Available now",
    freeLocked: "Will unlock 7 days after the last use",
    paidReady: "Can be bought this month",
    paidLocked: "Already used this month",
    complete: "Complete",
    skipped: "Protected by day off",
    done: "Done",
    useFreeDay: "Use weekly day off",
    buyPaidDay: "Buy monthly day off",
    reset: "Reset progress",
    confirmFreeTitle: "Use weekly day off?",
    confirmPaidTitle: "Buy and use a monthly day off?",
    confirmResetTitle: "Reset motivation progress?",
    confirmBody:
      "This will protect today's open tasks instead of failing them. Are you sure?",
    confirmPaidBody: "Points will be deducted before the day off is used.",
    confirmResetBody:
      "Points, history, and achievements will be cleared. Nutrition data stays safe.",
    cancel: "Cancel",
    confirm: "Yes",
    achievements: "Achievements",
    recentHistory: "Recent history",
    emptyHistory: "No motivation actions yet.",
  },
} as const;

type PendingAction = "free" | "paid" | "reset" | null;

export const MotivationHubCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { motivation } = useSelector((state: RootState) => state.profile);
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
                    <Typography sx={{ fontWeight: 800 }}>{task.title}</Typography>
                    <Typography color="text.secondary">{task.description}</Typography>
                    <Chip
                      label={`${task.points} pts`}
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
            {copy.buyPaidDay} ({paidDayCost} pts)
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
            {copy.paidDay}: {paidDayCost} pts
          </Alert>
        )}

        <Stack spacing={1.2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {copy.achievements}
          </Typography>
          {motivation.achievements.map((achievement) => (
            <Stack key={achievement.id} spacing={0.6}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography sx={{ fontWeight: 700 }}>{achievement.title}</Typography>
                <Typography color="text.secondary">
                  {achievement.progress}/{achievement.target}
                </Typography>
              </Stack>
              <Typography color="text.secondary">{achievement.description}</Typography>
              <LinearProgress
                variant="determinate"
                value={(achievement.progress / achievement.target) * 100}
                color={achievement.unlockedAt ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 999 }}
              />
            </Stack>
          ))}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {copy.recentHistory}
          </Typography>
          {motivation.history.length === 0 ? (
            <Typography color="text.secondary">{copy.emptyHistory}</Typography>
          ) : (
            motivation.history.slice(0, 5).map((item) => (
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
                  <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                  <Typography color="text.secondary">
                    {item.skipped ? 0 : item.pointsEarned} pts
                  </Typography>
                </Stack>
                <Typography color="text.secondary">
                  {item.skipped
                    ? `${copyByLanguage[language].skipped}`
                    : new Date(item.completedAt).toLocaleString()}
                </Typography>
              </Paper>
            ))
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
