import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  incrementWater,
  setWaterConsumed,
  setWaterGlassSize,
  setWaterReminders,
  setWaterTarget,
  syncWaterTargetFromWeight,
  syncWaterDay,
  markWaterReminderShown,
} from "./waterSlice";
import { useLanguage } from "../../shared/language";

const waterCopy = {
  uk: {
    title: "Вода за день",
    subtitle:
      "Контролюйте норму, залишок і об'єм кожного стакана.",
    drank: "Випито",
    remaining: "Залишилося",
    target: "Норма на день",
    glassSize: "Об'єм стакана",
    statusUnder: "Менше норми",
    statusOnTrack: "В нормі",
    statusAbove: "Вище норми",
    progress: "Випито {current} л з {target} л",
    remainingLabel: "Залишилося {value} мл",
    customAmount: "Нецілий стакан",
    quickAmounts: "Швидкі об'єми",
    addGlass: "Додати стакан",
    removeGlass: "Зняти стакан",
    historyTitle: "Історія води",
    analyticsTitle: "Аналітика за 7 днів",
    average: "Середньо",
    goalDays: "Днів у нормі",
    bestDay: "Найкращий день",
    remindersTitle: "Нагадування пити воду",
    remindersEnabled: "Увімкнути нагадування",
    reminderInterval: "Інтервал",
    reminderStart: "Початок",
    reminderEnd: "Кінець",
    reminderDue: "Час випити воду. Залишилося {value} мл до норми.",
    reminderPermission:
      "Для системних повідомлень дозвольте notifications у браузері.",
    minutes: "хв",
    partialTitle: "Скільки випито?",
    partialHint: "Вкажіть об'єм для цього стакана.",
    amount: "Об'єм (мл)",
    save: "Зберегти",
    cancel: "Скасувати",
  },
  pl: {
    title: "Woda na dzień",
    subtitle:
      "Kontroluj dzienną normę, pozostało i objętość każdej szklanki.",
    drank: "Wypito",
    remaining: "Pozostało",
    target: "Norma na dzień",
    glassSize: "Objętość szklanki",
    statusUnder: "Poniżej normy",
    statusOnTrack: "W normie",
    statusAbove: "Powyżej normy",
    progress: "Wypito {current} l z {target} l",
    remainingLabel: "Pozostało {value} ml",
    customAmount: "Niepełna szklanka",
    quickAmounts: "Szybkie objętości",
    addGlass: "Dodaj szklankę",
    removeGlass: "Odejmij szklankę",
    historyTitle: "Historia wody",
    analyticsTitle: "Analityka 7 dni",
    average: "Średnio",
    goalDays: "Dni w normie",
    bestDay: "Najlepszy dzień",
    remindersTitle: "Przypomnienia o wodzie",
    remindersEnabled: "Włącz przypomnienia",
    reminderInterval: "Interwał",
    reminderStart: "Początek",
    reminderEnd: "Koniec",
    reminderDue: "Czas wypić wodę. Do normy zostało {value} ml.",
    reminderPermission:
      "Dla powiadomień systemowych zezwól na notifications w przeglądarce.",
    minutes: "min",
    partialTitle: "Ile wypito?",
    partialHint: "Ustaw objętość dla tej szklanki.",
    amount: "Objętość (ml)",
    save: "Zapisz",
    cancel: "Anuluj",
  },
} as const;

const formatLiters = (valueMl: number) => (valueMl / 1000).toFixed(1);

const createLocalDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayKeyOffset = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createLocalDayKey(date);
};

const minutesFromTime = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const isWithinReminderWindow = (startTime: string, endTime: string) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = minutesFromTime(startTime);
  const endMinutes = minutesFromTime(endTime);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

export const WaterTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const water = useSelector((state: RootState) => state.water);
  const latestWeightHistoryWeight = useSelector((state: RootState) =>
    state.profile.weightHistory.at(-1)?.weight
  );
  const authWeight = useSelector((state: RootState) => state.auth.user?.weight);
  const latestWeight = latestWeightHistoryWeight ?? authWeight ?? 0;
  const { language } = useLanguage();
  const copy = waterCopy[language];
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [partialAmountMl, setPartialAmountMl] = useState<number>(water.glassSizeMl);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(syncWaterDay());
  }, [dispatch]);

  useEffect(() => {
    dispatch(syncWaterTargetFromWeight(latestWeight));
  }, [dispatch, latestWeight]);

  const glassCount = Math.max(Math.ceil(water.dailyTargetMl / water.glassSizeMl), 6);
  const remainingMl = Math.max(water.dailyTargetMl - water.consumedMl, 0);
  const progress = water.dailyTargetMl
    ? Math.min((water.consumedMl / water.dailyTargetMl) * 100, 100)
    : 0;
  const status =
    water.consumedMl < water.dailyTargetMl
      ? copy.statusUnder
      : water.consumedMl <= water.dailyTargetMl + water.glassSizeMl / 2
        ? copy.statusOnTrack
        : copy.statusAbove;
  const quickAmounts = useMemo(
    () => [...new Set([100, 150, water.glassSizeMl])].sort((left, right) => left - right),
    [water.glassSizeMl]
  );
  const weeklyRecords = useMemo(() => {
    const historyByDate = new Map(water.history.map((entry) => [entry.date, entry]));
    const todayKey = createLocalDayKey();

    return Array.from({ length: 7 }, (_, index) => {
      const date = getDayKeyOffset(6 - index);
      const historyEntry = historyByDate.get(date);
      const consumedMl = date === todayKey ? water.consumedMl : historyEntry?.consumedMl ?? 0;
      const targetMl = date === todayKey ? water.dailyTargetMl : historyEntry?.targetMl ?? water.dailyTargetMl;

      return {
        date,
        consumedMl,
        targetMl,
      };
    });
  }, [water.consumedMl, water.dailyTargetMl, water.history]);
  const weeklyTotalMl = weeklyRecords.reduce(
    (total, item) => total + item.consumedMl,
    0
  );
  const weeklyAverageMl = Math.round(weeklyTotalMl / weeklyRecords.length);
  const weeklyGoalDays = weeklyRecords.filter(
    (item) => item.consumedMl >= item.targetMl
  ).length;
  const weeklyBestDay = weeklyRecords.reduce((best, item) =>
    item.consumedMl > best.consumedMl ? item : best
  );
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "uk-UA", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    [language]
  );

  useEffect(() => {
    if (!water.reminders.enabled) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (
        remainingMl <= 0 ||
        !isWithinReminderWindow(
          water.reminders.startTime,
          water.reminders.endTime
        )
      ) {
        return;
      }

      const lastReminderTime = Date.parse(water.reminders.lastReminderAt ?? "");
      const enoughTimePassed =
        Number.isNaN(lastReminderTime) ||
        Date.now() - lastReminderTime >= water.reminders.intervalMinutes * 60_000;

      if (!enoughTimePassed) {
        return;
      }

      const text = copy.reminderDue.replace("{value}", remainingMl.toFixed(0));
      dispatch(markWaterReminderShown(new Date().toISOString()));
      setReminderMessage(text);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(copy.remindersTitle, { body: text });
      }
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    copy.reminderDue,
    copy.remindersTitle,
    dispatch,
    remainingMl,
    water.reminders.enabled,
    water.reminders.endTime,
    water.reminders.intervalMinutes,
    water.reminders.lastReminderAt,
    water.reminders.startTime,
  ]);

  const glasses = useMemo(
    () =>
      Array.from({ length: glassCount }, (_, index) => {
        const slotStart = index * water.glassSizeMl;
        const fill = Math.min(
          Math.max((water.consumedMl - slotStart) / water.glassSizeMl, 0),
          1
        );

        return {
          index,
          slotStart,
          slotEnd: slotStart + water.glassSizeMl,
          fill,
        };
      }),
    [glassCount, water.consumedMl, water.glassSizeMl]
  );

  const handleGlassClick = (index: number, fill: number) => {
    const slotStart = index * water.glassSizeMl;
    const slotEnd = slotStart + water.glassSizeMl;

    if (fill === 1) {
      dispatch(setWaterConsumed(slotStart));
      return;
    }

    if (fill > 0) {
      setEditingSlot(index);
      setPartialAmountMl(Math.round(fill * water.glassSizeMl));
      return;
    }

    dispatch(setWaterConsumed(slotEnd));
  };

  const openPartialDialog = () => {
    const nextIndex = Math.min(
      Math.floor(water.consumedMl / water.glassSizeMl),
      glassCount - 1
    );
    const slotStart = nextIndex * water.glassSizeMl;
    const currentAmount = Math.max(water.consumedMl - slotStart, 0);

    setEditingSlot(nextIndex);
    setPartialAmountMl(currentAmount > 0 ? Math.round(currentAmount) : water.glassSizeMl);
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    dispatch(setWaterReminders({ enabled }));
  };

  const savePartialGlass = () => {
    if (editingSlot === null) {
      return;
    }

    const slotStart = editingSlot * water.glassSizeMl;
    const normalizedAmount = Math.min(
      Math.max(Math.round(partialAmountMl), 0),
      water.glassSizeMl
    );

    dispatch(setWaterConsumed(slotStart + normalizedAmount));
    setEditingSlot(null);
  };

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
      <Stack spacing={2.5}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr)" },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box sx={{ position: "relative", width: 180, height: 180, mx: "auto" }}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(#0ea5e9 0deg, #22c55e 180deg, rgba(226,232,240,0.72) 180deg)",
                opacity: 0.15,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: `conic-gradient(#0ea5e9 0deg, #22c55e ${
                  progress * 3.6
                }deg, rgba(226,232,240,0.72) ${progress * 3.6}deg)`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.96)",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                px: 2,
              }}
            >
              <Stack spacing={0.4}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {Math.round(progress)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>
              {copy.progress
                .replace("{current}", formatLiters(water.consumedMl))
                .replace("{target}", formatLiters(water.dailyTargetMl))}
            </Typography>
            <Typography color="text.secondary">
              {copy.remainingLabel.replace("{value}", remainingMl.toFixed(0))}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 12, borderRadius: 999 }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.drank}: ${water.consumedMl} ml`} color="info" />
              <Chip label={`${copy.remaining}: ${remainingMl} ml`} variant="outlined" />
              <Chip
                label={
                  water.targetMode === "automatic"
                    ? `Auto ${Math.round(latestWeight * 30)}-${Math.round(latestWeight * 35)} ml`
                    : "Manual target"
                }
                variant="outlined"
              />
              <Chip
                label={status}
                color={status === copy.statusAbove ? "warning" : status === copy.statusOnTrack ? "success" : "default"}
              />
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <TextField
            type="number"
            label={`${copy.target} (ml)`}
            value={water.dailyTargetMl}
            onChange={(event) => dispatch(setWaterTarget(Number(event.target.value) || 0))}
            inputProps={{ min: 250, step: 50 }}
          />
          <TextField
            type="number"
            label={`${copy.glassSize} (ml)`}
            value={water.glassSizeMl}
            onChange={(event) =>
              dispatch(setWaterGlassSize(Number(event.target.value) || 0))
            }
            inputProps={{ min: 100, step: 50 }}
          />
        </Box>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.quickAmounts}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={amount === water.glassSizeMl ? "contained" : "outlined"}
                onClick={() => dispatch(incrementWater(amount))}
                sx={{ minWidth: 82 }}
              >
                +{amount} ml
              </Button>
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(glassCount, 4)}, minmax(0, 1fr))`,
            gap: 1.2,
          }}
        >
          {glasses.map((glass) => (
            <Box
              key={`glass-${glass.index}`}
              component="button"
              type="button"
              onClick={() => handleGlassClick(glass.index, glass.fill)}
              sx={{
                p: 0,
                minHeight: 112,
                borderRadius: 4,
                border: "1px solid rgba(125,211,252,0.42)",
                backgroundColor: "rgba(239,246,255,0.72)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  insetInline: 8,
                  bottom: 8,
                  height: `${glass.fill * 100}%`,
                  borderRadius: 2,
                  background: "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)",
                  transition: "height 180ms ease",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "end center",
                  pb: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {Math.round(glass.fill * water.glassSizeMl)} ml
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="contained"
            onClick={() => dispatch(incrementWater(water.glassSizeMl))}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 999,
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
            }}
          >
            {copy.addGlass}
          </Button>
          <Button
            variant="outlined"
            onClick={openPartialDialog}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.customAmount}
          </Button>
          <Button
            variant="text"
            onClick={() => dispatch(incrementWater(-water.glassSizeMl))}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.removeGlass}
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>{copy.remindersTitle}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={water.reminders.enabled}
                  onChange={(event) => {
                    void handleReminderToggle(event.target.checked);
                  }}
                />
              }
              label={copy.remindersEnabled}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                select
                fullWidth
                label={copy.reminderInterval}
                value={water.reminders.intervalMinutes}
                onChange={(event) =>
                  dispatch(
                    setWaterReminders({
                      intervalMinutes: Number(event.target.value),
                    })
                  )
                }
              >
                {[60, 90, 120, 180].map((minutes) => (
                  <MenuItem key={minutes} value={minutes}>
                    {minutes} {copy.minutes}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="time"
                label={copy.reminderStart}
                value={water.reminders.startTime}
                onChange={(event) =>
                  dispatch(setWaterReminders({ startTime: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label={copy.reminderEnd}
                value={water.reminders.endTime}
                onChange={(event) =>
                  dispatch(setWaterReminders({ endTime: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            {"Notification" in window && Notification.permission !== "granted" ? (
              <Alert severity="info">{copy.reminderPermission}</Alert>
            ) : null}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>{copy.analyticsTitle}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.average}: ${weeklyAverageMl} ml`} color="info" />
              <Chip
                label={`${copy.goalDays}: ${weeklyGoalDays}/7`}
                color={weeklyGoalDays >= 5 ? "success" : "default"}
                variant="outlined"
              />
              <Chip
                label={`${copy.bestDay}: ${weeklyBestDay.consumedMl} ml`}
                variant="outlined"
              />
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 1,
                alignItems: "end",
                minHeight: 132,
              }}
            >
              {weeklyRecords.map((item) => {
                const percent = item.targetMl
                  ? Math.min((item.consumedMl / item.targetMl) * 100, 120)
                  : 0;

                return (
                  <Stack key={item.date} spacing={0.8} alignItems="center">
                    <Box
                      sx={{
                        width: "100%",
                        height: 88,
                        borderRadius: 2,
                        backgroundColor: "rgba(226,232,240,0.72)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          insetInline: 0,
                          bottom: 0,
                          height: `${Math.min(percent, 100)}%`,
                          background:
                            item.consumedMl >= item.targetMl
                              ? "linear-gradient(180deg, #22c55e 0%, #0ea5e9 100%)"
                              : "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {dayFormatter.format(new Date(`${item.date}T12:00:00`))}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 800 }}>{copy.historyTitle}</Typography>
            {weeklyRecords
              .slice()
              .reverse()
              .map((item) => (
                <Stack
                  key={item.date}
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {dayFormatter.format(new Date(`${item.date}T12:00:00`))}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.consumedMl} / {item.targetMl} ml
                  </Typography>
                </Stack>
              ))}
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={editingSlot !== null}
        onClose={() => setEditingSlot(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{copy.partialTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">{copy.partialHint}</Typography>
            <TextField
              type="number"
              label={copy.amount}
              value={partialAmountMl}
              onChange={(event) => setPartialAmountMl(Number(event.target.value) || 0)}
              inputProps={{ min: 0, max: water.glassSizeMl, step: 10 }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  size="small"
                  variant={partialAmountMl === amount ? "contained" : "outlined"}
                  onClick={() => setPartialAmountMl(amount)}
                >
                  {amount} ml
                </Button>
              ))}
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(Math.min(partialAmountMl, water.glassSizeMl) / water.glassSizeMl) * 100}
              sx={{ height: 10, borderRadius: 999 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingSlot(null)}>{copy.cancel}</Button>
          <Button onClick={savePartialGlass} variant="contained">
            {copy.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(reminderMessage)}
        autoHideDuration={5000}
        onClose={() => setReminderMessage(null)}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setReminderMessage(null)}
          sx={{ width: "100%" }}
        >
          {reminderMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default WaterTracker;
