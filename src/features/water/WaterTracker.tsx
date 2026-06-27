import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { animated, useSpring } from "@react-spring/web";
import confetti from "canvas-confetti";
import useSound from "use-sound";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  AssistantAvatar,
  type AssistantAvatarMood,
} from "../../shared/components/AssistantAvatar";
import { selectInputValue } from "../../shared/lib/inputSelection";
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
import { useAutoDismiss } from "../../shared/hooks/useAutoDismiss";
import { SectionCard } from "@shared/ui";
import {
  createWaterGlassSlots,
  createWeeklyWaterRecords,
  formatWaterLiters,
  getEditableWaterSlot,
  getQuickWaterAmounts,
  isWithinReminderWindow,
  normalizeWaterSlotAmount,
} from "./waterModel";
import {
  playAchievementSound,
  playGentleClickSound,
  playHowlerBlip,
  playWaterLogSound,
  uiTickSoundDataUrl,
} from "../../shared/lib/sound";
import { captureRuntimeEvent } from "@integration/runtime/analytics";
import { EmptyState } from "@shared/ui";
import {
  awardCompanionReward,
  createCompanionRewardAnalyticsPayload,
} from "@features/companion";

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
    historyEmpty: "Сьогодні ще немає записів води.",
    historyEmptyHint: "Додайте перший стакан, і тут з'явиться жива історія дня.",
    analyticsTitle: "Аналітика за 7 днів",
    average: "Середньо",
    goalDays: "Днів у нормі",
    bestDay: "Найкращий день",
    remindersTitle: "Нагадування пити воду",
    aiTitle: "Реакція companion",
    aiLow:
      "Вода поки відстає. Давайте закриємо один маленький стакан без драматизації.",
    aiMid:
      "Темп хороший. Ще трохи води, і день відчуватиметься легше.",
    aiDone:
      "Норма води закрита. Я святкую тихо, але дуже щиро.",
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
    historyEmpty: "Dziś nie ma jeszcze zapisów wody.",
    historyEmptyHint: "Dodaj pierwszą szklankę, a tutaj pojawi się historia dnia.",
    analyticsTitle: "Analityka 7 dni",
    average: "Średnio",
    goalDays: "Dni w normie",
    bestDay: "Najlepszy dzień",
    remindersTitle: "Przypomnienia o wodzie",
    aiTitle: "Reakcja companion",
    aiLow:
      "Woda jest jeszcze z tyłu. Domknijmy jedną małą szklankę bez presji.",
    aiMid:
      "Tempo jest dobre. Jeszcze trochę wody i dzień będzie lżejszy.",
    aiDone:
      "Norma wody zamknięta. Świętuję cicho, ale bardzo szczerze.",
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
  en: {
    title: "Water today",
    subtitle: "Track your target, remaining water, and each glass size.",
    drank: "Drank",
    remaining: "Remaining",
    target: "Daily target",
    glassSize: "Glass size",
    statusUnder: "Below target",
    statusOnTrack: "On track",
    statusAbove: "Above target",
    progress: "Drank {current} L of {target} L",
    remainingLabel: "{value} ml remaining",
    customAmount: "Partial glass",
    quickAmounts: "Quick amounts",
    addGlass: "Add glass",
    removeGlass: "Remove glass",
    historyTitle: "Water history",
    historyEmpty: "No water entries yet today.",
    historyEmptyHint: "Add the first glass and today's live history will appear here.",
    analyticsTitle: "7-day analytics",
    average: "Average",
    goalDays: "Days on target",
    bestDay: "Best day",
    remindersTitle: "Water reminders",
    aiTitle: "Companion reaction",
    aiLow:
      "Water is behind for now. Let's close one small glass without drama.",
    aiMid:
      "Good pace. A little more water and the day will feel lighter.",
    aiDone:
      "Water target closed. I am celebrating quietly, but sincerely.",
    remindersEnabled: "Enable reminders",
    reminderInterval: "Interval",
    reminderStart: "Start",
    reminderEnd: "End",
    reminderDue: "Time to drink water. {value} ml left to target.",
    reminderPermission:
      "Allow browser notifications to receive system reminders.",
    minutes: "min",
    partialTitle: "How much did you drink?",
    partialHint: "Set the amount for this glass.",
    amount: "Amount (ml)",
    save: "Save",
    cancel: "Cancel",
  },
} as const;

export const WaterTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const water = useSelector((state: RootState) => state.water);
  const latestWeightHistoryWeight = useSelector((state: RootState) =>
    state.profile.weightHistory.at(-1)?.weight
  );
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const authWeight = useSelector((state: RootState) => state.auth.user?.weight);
  const latestWeight = latestWeightHistoryWeight ?? authWeight ?? 0;
  const { appLanguage } = useLanguage();
  const copy = waterCopy[appLanguage];
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [partialAmountMl, setPartialAmountMl] = useState<number>(water.glassSizeMl);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [playTapSound] = useSound(uiTickSoundDataUrl, { volume: 0.18 });

  useAutoDismiss(Boolean(reminderMessage), 5000, () => setReminderMessage(null));

  useEffect(() => {
    dispatch(syncWaterDay());
  }, [dispatch]);

  useEffect(() => {
    dispatch(syncWaterTargetFromWeight(latestWeight));
  }, [dispatch, latestWeight]);

  const remainingMl = Math.max(water.dailyWaterGoal - water.consumedMl, 0);
  const progress = water.dailyWaterGoal
    ? Math.min((water.consumedMl / water.dailyWaterGoal) * 100, 100)
    : 0;
  const animatedProgress = useSpring({
    progress,
    config: { tension: 170, friction: 22 },
  });
  const status =
    water.consumedMl < water.dailyWaterGoal
      ? copy.statusUnder
      : water.consumedMl <= water.dailyWaterGoal + water.glassSizeMl / 2
        ? copy.statusOnTrack
        : copy.statusAbove;
  const quickAmounts = useMemo(
    () => getQuickWaterAmounts(water.glassSizeMl),
    [water.glassSizeMl]
  );
  const assistantMood: AssistantAvatarMood =
    progress >= 100 ? "celebrate" : progress >= 55 ? "happy" : "coach";
  const assistantReaction =
    progress >= 100 ? copy.aiDone : progress >= 55 ? copy.aiMid : copy.aiLow;
  const weeklyRecords = useMemo(
    () =>
      createWeeklyWaterRecords({
        history: water.history,
        consumedMl: water.consumedMl,
        dailyWaterGoal: water.dailyWaterGoal,
      }),
    [water.consumedMl, water.dailyWaterGoal, water.history]
  );
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
      new Intl.DateTimeFormat(
        appLanguage === "pl" ? "pl-PL" : appLanguage === "en" ? "en-US" : "uk-UA",
        {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        }
      ),
    [appLanguage]
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
      createWaterGlassSlots(
        water.consumedMl,
        water.dailyWaterGoal,
        water.glassSizeMl
      ),
    [water.consumedMl, water.dailyWaterGoal, water.glassSizeMl]
  );

  const playWaterFeedback = (nextConsumedMl: number, previousConsumedMl = water.consumedMl) => {
    playTapSound();
    playHowlerBlip();

    if (nextConsumedMl > previousConsumedMl) {
      if (
        previousConsumedMl < water.dailyWaterGoal &&
        nextConsumedMl >= water.dailyWaterGoal
      ) {
        playAchievementSound();
        void confetti({
          particleCount: 90,
          spread: 62,
          origin: { y: 0.68 },
          colors: ["#0ea5e9", "#22c55e", "#14b8a6", "#facc15"],
        });
        return;
      }

      playWaterLogSound();
      return;
    }

    playGentleClickSound();
  };

  const trackWaterAdded = (
    amountMl: number,
    source: string,
    consumedMlAfter: number
  ) => {
    if (amountMl <= 0) {
      return;
    }

    dispatch(awardCompanionReward("water_logged"));
    captureRuntimeEvent("water_added", {
      amountMl,
      source,
      consumedMlAfter,
      dailyGoalMl: water.dailyWaterGoal,
      ...createCompanionRewardAnalyticsPayload("water_logged"),
    });
  };

  const setWaterAmount = (amountMl: number, source = "set_amount") => {
    const previousConsumedMl = water.consumedMl;
    playWaterFeedback(amountMl);
    dispatch(setWaterConsumed(amountMl));
    trackWaterAdded(amountMl - previousConsumedMl, source, amountMl);
  };

  const addWaterAmount = (amountMl: number, source = "increment") => {
    const nextConsumedMl = Math.max(water.consumedMl + amountMl, 0);
    playWaterFeedback(nextConsumedMl);
    dispatch(incrementWater(amountMl));
    trackWaterAdded(Math.min(amountMl, nextConsumedMl), source, nextConsumedMl);
  };

  const handleGlassClick = (index: number, fill: number) => {
    const slotStart = index * water.glassSizeMl;
    const slotEnd = slotStart + water.glassSizeMl;

    if (fill === 1) {
      setWaterAmount(slotStart, "glass_slot");
      return;
    }

    if (fill > 0) {
      setEditingSlot(index);
      setPartialAmountMl(Math.round(fill * water.glassSizeMl));
      return;
    }

    setWaterAmount(slotEnd, "glass_slot");
  };

  const openPartialPanel = () => {
    const editableSlot = getEditableWaterSlot(
      water.consumedMl,
      water.glassSizeMl,
      glasses.length
    );

    setEditingSlot(editableSlot.index);
    setPartialAmountMl(editableSlot.amountMl);
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
    const normalizedAmount = normalizeWaterSlotAmount(
      partialAmountMl,
      water.glassSizeMl
    );

    setWaterAmount(slotStart + normalizedAmount, "partial_glass");
    setEditingSlot(null);
  };

  return (
    <SectionCard>
      <Stack spacing={2.5}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {reminderMessage ? (
          <Alert severity="info" variant="filled" onClose={() => setReminderMessage(null)}>
            {reminderMessage}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 1fr)" },
            gap: { xs: 2, md: 3 },
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: 156, sm: 180 },
              height: { xs: 156, sm: 180 },
              mx: "auto",
            }}
          >
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
              component={animated.div}
              style={{
                background: animatedProgress.progress.to(
                  (value) =>
                    `conic-gradient(#0ea5e9 0deg, #22c55e ${
                      value * 3.6
                    }deg, rgba(226,232,240,0.72) ${value * 3.6}deg)`
                ),
              }}
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                backgroundColor: "var(--sn-surface-elevated)",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                px: 2,
              }}
            >
              <Stack spacing={0.4}>
                <Typography component="p" variant="h4" sx={{ fontWeight: 900 }}>
                  <animated.span>
                    {animatedProgress.progress.to((value) => `${Math.round(value)}%`)}
                  </animated.span>
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
                .replace("{current}", formatWaterLiters(water.consumedMl))
                .replace("{target}", formatWaterLiters(water.dailyWaterGoal))}
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

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: "1px solid var(--sn-border-soft)",
                bgcolor: "var(--sn-accent-soft)",
              }}
            >
              <Stack direction="row" spacing={1.3} alignItems="center">
                <AssistantAvatar
                  name={assistant.name}
                  variant={assistant.companionKind}
                  mood={assistantMood}
                  active={progress >= 55}
                  size={56}
                />
                <Stack spacing={0.3}>
                  <Typography sx={{ fontWeight: 900 }}>{copy.aiTitle}</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {assistantReaction}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
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
            type="text"
            label={`${copy.target} (ml)`}
            value={water.dailyWaterGoal}
            onChange={(event) => dispatch(setWaterTarget(Number(event.target.value) || 0))}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                enterKeyHint: "next",
              },
            }}
          />
          <TextField
            type="text"
            label={`${copy.glassSize} (ml)`}
            value={water.glassSizeMl}
            onChange={(event) =>
              dispatch(setWaterGlassSize(Number(event.target.value) || 0))
            }
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                enterKeyHint: "next",
              },
            }}
          />
        </Box>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.quickAmounts}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={amount === water.glassSizeMl ? "contained" : "outlined"}
                onClick={() => addWaterAmount(amount, "quick_amount")}
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
            gridTemplateColumns: {
              xs: "repeat(4, minmax(0, 1fr))",
              sm: "repeat(auto-fit, minmax(76px, 1fr))",
            },
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
                minHeight: { xs: 96, sm: 112 },
                borderRadius: 1,
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
            onClick={() => addWaterAmount(water.glassSizeMl, "add_glass")}
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
            onClick={openPartialPanel}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.customAmount}
          </Button>
          <Button
            variant="text"
            onClick={() => addWaterAmount(-water.glassSizeMl, "remove_glass")}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.removeGlass}
          </Button>
        </Stack>

        {editingSlot !== null && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              borderColor: "rgba(14, 165, 233, 0.32)",
              backgroundColor: "rgba(240,249,255,0.78)",
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 900 }}>{copy.partialTitle}</Typography>
                <Typography color="text.secondary">{copy.partialHint}</Typography>
              </Stack>
              <TextField
                type="text"
                label={copy.amount}
                value={partialAmountMl}
                onChange={(event) => setPartialAmountMl(Number(event.target.value) || 0)}
                onFocus={(event) => selectInputValue(event.target)}
                onClick={(event) => selectInputValue(event.currentTarget)}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    enterKeyHint: "done",
                  },
                }}
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
              <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                <Button onClick={() => setEditingSlot(null)}>{copy.cancel}</Button>
                <Button onClick={savePartialGlass} variant="contained">
                  {copy.save}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
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

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
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

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 800 }}>{copy.historyTitle}</Typography>
            {water.consumedMl === 0 && water.history.every((item) => item.consumedMl === 0) ? (
              <EmptyState
                title={copy.historyEmpty}
                description={copy.historyEmptyHint}
                compact
              />
            ) : (
              weeklyRecords
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
                ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </SectionCard>
  );
};

export default WaterTracker;
