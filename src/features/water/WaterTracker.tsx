import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { WaterState } from "./waterSlice";
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
import {
  getSafeNotificationPermission,
  requestSafeNotificationPermission,
  showSafeNotification,
} from "@shared/lib/notifications";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { EmptyState } from "@shared/ui";
import { createCompanionRewardAnalyticsPayload } from "@features/companion";
import { applyCompanionRewardInCloud } from "@features/companion/companionCloudSync";
import {
  buildWaterStateAfterDaySync,
  buildWaterStateAfterGlassSizeChange,
  buildWaterStateAfterIncrement,
  buildWaterStateAfterReminderChange,
  buildWaterStateAfterReminderShown,
  buildWaterStateAfterSetAmount,
  buildWaterStateAfterTargetChange,
  buildWaterStateAfterWeightTargetSync,
} from "./waterSaveModel";
import { useWaterCloudAction } from "./useWaterCloudAction";
import type { AppLanguage } from "../../shared/types/i18n";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

const waterCopy = {
  uk: {
    title: "Вода за день",
    subtitle:
      "Контролюйте норму, залишок і об'єм кожного стакана.",
    drank: "Випито",
    remaining: "Залишилося",
    target: "Норма на день",
    unitMl: "мл",
    autoTarget: "Авто",
    manualTarget: "Ручна норма",
    glassSize: "Об'єм стакана",
    statusUnder: "Менше норми",
    statusOnTrack: "В нормі",
    statusAbove: "Вище норми",
    progress: "Випито {current} л з {target} л",
    remainingLabel: "Залишилося {value}",
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
    reminderDue: "Час випити воду. Залишилося {value} до норми.",
    reminderPermission:
      "Для системних повідомлень дозвольте notifications у браузері.",
    minutes: "хв",
    partialTitle: "Скільки випито?",
    partialHint: "Вкажіть об'єм для цього стакана.",
    amount: "Об'єм (мл)",
    save: "Зберегти",
    cancel: "Скасувати",
    saveError: "Не вдалося зберегти воду в хмарі.",
    rewardSyncWarning:
      "Воду збережено, але прогрес companion тимчасово не синхронізувався.",
    saveInProgress: "Вода вже зберігається. Зачекайте кілька секунд.",
    saving: "Зберігаю...",
    retry: "Повторити",
  },
  pl: {
    title: "Woda na dzień",
    subtitle:
      "Kontroluj dzienną normę, pozostało i objętość każdej szklanki.",
    drank: "Wypito",
    remaining: "Pozostało",
    target: "Norma na dzień",
    unitMl: "ml",
    autoTarget: "Auto",
    manualTarget: "Ręczny cel",
    glassSize: "Objętość szklanki",
    statusUnder: "Poniżej normy",
    statusOnTrack: "W normie",
    statusAbove: "Powyżej normy",
    progress: "Wypito {current} l z {target} l",
    remainingLabel: "Pozostało {value}",
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
    reminderDue: "Czas wypić wodę. Do normy zostało {value}.",
    reminderPermission:
      "Dla powiadomień systemowych zezwól na notifications w przeglądarce.",
    minutes: "min",
    partialTitle: "Ile wypito?",
    partialHint: "Ustaw objętość dla tej szklanki.",
    amount: "Objętość (ml)",
    save: "Zapisz",
    cancel: "Anuluj",
    saveError: "Nie udało się zapisać wody w chmurze.",
    rewardSyncWarning:
      "Woda została zapisana, ale postęp companion chwilowo się nie zsynchronizował.",
    saveInProgress: "Woda już się zapisuje. Poczekaj kilka sekund.",
    saving: "Zapisuję...",
    retry: "Ponów",
  },
  en: {
    title: "Water today",
    subtitle: "Track your target, remaining water, and each glass size.",
    drank: "Drank",
    remaining: "Remaining",
    target: "Daily target",
    unitMl: "ml",
    autoTarget: "Auto",
    manualTarget: "Manual target",
    glassSize: "Glass size",
    statusUnder: "Below target",
    statusOnTrack: "On track",
    statusAbove: "Above target",
    progress: "Drank {current} L of {target} L",
    remainingLabel: "{value} remaining",
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
      "Water is running behind. Let's close one small glass without drama.",
    aiMid:
      "Good pace. A little more water and the day will feel lighter.",
    aiDone:
      "Water target closed. I am celebrating quietly, but sincerely.",
    remindersEnabled: "Enable reminders",
    reminderInterval: "Interval",
    reminderStart: "Start",
    reminderEnd: "End",
    reminderDue: "Time to drink water. {value} left to target.",
    reminderPermission:
      "Allow browser notifications to receive system reminders.",
    minutes: "min",
    partialTitle: "How much did you drink?",
    partialHint: "Set the amount for this glass.",
    amount: "Amount (ml)",
    save: "Save",
    cancel: "Cancel",
    saveError: "Could not save water to cloud.",
    rewardSyncWarning:
      "Water was saved, but companion progress could not sync yet.",
    saveInProgress: "Water is already being saved. Please wait a moment.",
    saving: "Saving...",
    retry: "Retry",
  },
} as const;

type WaterCopy = (typeof waterCopy)[AppLanguage];

const getWaterCopy = (language: AppLanguage): WaterCopy => {
  switch (language) {
    case "pl":
      return waterCopy.pl;
    case "en":
      return waterCopy.en;
    case "uk":
    default:
      return waterCopy.uk;
  }
};

const WaterTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const water = useSelector((state: RootState) => state.water);
  const companion = useSelector((state: RootState) => state.companion);
  const latestWeightHistoryWeight = useSelector((state: RootState) =>
    state.profile.weightHistory.at(-1)?.weight
  );
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const authWeight = useSelector((state: RootState) => state.auth.user?.weight);
  const latestWeight = latestWeightHistoryWeight ?? authWeight ?? 0;
  const { appLanguage } = useLanguage();
  const copy = getWaterCopy(appLanguage);
  const waterActionCopy = useMemo(
    () => ({
      saveFailed: copy.saveError,
      saveInProgress: copy.saveInProgress,
    }),
    [copy.saveError, copy.saveInProgress]
  );
  const waterAction = useWaterCloudAction(waterActionCopy);
  const {
    clearError: clearWaterActionError,
    error: waterActionError,
    hasRetry: waterActionHasRetry,
    retryLastWaterSave,
    runWaterStateSave,
    saving: savingWater,
  } = waterAction;
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [partialAmountMl, setPartialAmountMl] = useState<number | "">(water.glassSizeMl);
  const [targetDraft, setTargetDraft] = useState<string | null>(null);
  const [glassSizeDraft, setGlassSizeDraft] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [playTapSound] = useSound(uiTickSoundDataUrl, { volume: 0.18 });
  const didSyncWaterDay = useRef(false);
  const lastAutoTargetWeightRef = useRef<number | null>(null);
  const targetInputValue = targetDraft ?? String(water.dailyWaterGoal);
  const glassSizeInputValue = glassSizeDraft ?? String(water.glassSizeMl);
  const partialAmountValue =
    typeof partialAmountMl === "number" && Number.isFinite(partialAmountMl)
      ? partialAmountMl
      : null;

  useAutoDismiss(Boolean(reminderMessage), 5000, () => setReminderMessage(null));

  const saveWaterState = useCallback(
    async (nextWater: WaterState) => {
      setSaveError(null);
      clearWaterActionError();

      try {
        await runWaterStateSave(nextWater);
        return true;
      } catch {
        setSaveError(copy.saveError);
        return false;
      }
    },
    [clearWaterActionError, copy.saveError, runWaterStateSave]
  );

  const persistAutomaticWaterState = useCallback(
    async (nextWater: WaterState) => {
      try {
        await runWaterStateSave(nextWater, { surfaceFailure: false });
      } catch {
        // The sync slice already stores the cloud error; automatic maintenance
        // should not interrupt the user's current screen with local draft state.
      }
    },
    [runWaterStateSave]
  );

  useEffect(() => {
    if (didSyncWaterDay.current) {
      return;
    }

    didSyncWaterDay.current = true;
    const nextWater = buildWaterStateAfterDaySync(water);

    if (nextWater === water || nextWater.lastLoggedOn === water.lastLoggedOn) {
      return;
    }

    void persistAutomaticWaterState(nextWater);
  }, [persistAutomaticWaterState, water]);

  useEffect(() => {
    if (lastAutoTargetWeightRef.current === latestWeight) {
      return;
    }

    lastAutoTargetWeightRef.current = latestWeight;
    const nextWater = buildWaterStateAfterWeightTargetSync(water, latestWeight);

    if (
      nextWater.dailyWaterGoal === water.dailyWaterGoal &&
      nextWater.consumedMl === water.consumedMl
    ) {
      return;
    }

    void persistAutomaticWaterState(nextWater);
  }, [latestWeight, persistAutomaticWaterState, water]);

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
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
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
  const formatMl = useCallback(
    (value: number) => `${Math.round(value)} ${copy.unitMl}`,
    [copy.unitMl]
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

      const text = copy.reminderDue.replace("{value}", formatMl(remainingMl));
      const nextWater = buildWaterStateAfterReminderShown(
        water,
        new Date().toISOString()
      );

      void saveWaterState(nextWater).then((saved) => {
        if (!saved) {
          return;
        }

        setReminderMessage(text);
        void showSafeNotification(copy.remindersTitle, { body: text });
      });
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    copy.reminderDue,
    copy.remindersTitle,
    formatMl,
    remainingMl,
    saveWaterState,
    water,
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

  const trackWaterAdded = async (
    amountMl: number,
    source: string,
    consumedMlAfter: number
  ) => {
    if (amountMl <= 0) {
      return;
    }

    let companionRewardPayload = {};

    try {
      await applyCompanionRewardInCloud(
        dispatch,
        { companion },
        "water_logged"
      );
      companionRewardPayload =
        createCompanionRewardAnalyticsPayload("water_logged");
    } catch {
      setSaveError(copy.rewardSyncWarning);
    }

    trackRuntimeEvent("water_added", {
      amountMl,
      source,
      consumedMlAfter,
      dailyGoalMl: water.dailyWaterGoal,
      ...companionRewardPayload,
    });
  };

  const setWaterAmount = (amountMl: number, source = "set_amount") => {
    const previousConsumedMl = water.consumedMl;
    const nextWater = buildWaterStateAfterSetAmount(water, amountMl);

    void saveWaterState(nextWater).then((saved) => {
      if (!saved) {
        return;
      }

      playWaterFeedback(nextWater.consumedMl, previousConsumedMl);
      void trackWaterAdded(
        nextWater.consumedMl - previousConsumedMl,
        source,
        nextWater.consumedMl
      );
    });
  };

  const addWaterAmount = (amountMl: number, source = "increment") => {
    const previousConsumedMl = water.consumedMl;
    const nextWater = buildWaterStateAfterIncrement(water, amountMl);

    void saveWaterState(nextWater).then((saved) => {
      if (!saved) {
        return;
      }

      playWaterFeedback(nextWater.consumedMl, previousConsumedMl);
      void trackWaterAdded(
        nextWater.consumedMl - previousConsumedMl,
        source,
        nextWater.consumedMl
      );
    });
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
    if (enabled) {
      await requestSafeNotificationPermission();
    }

    await saveWaterState(buildWaterStateAfterReminderChange(water, { enabled }));
  };

  const saveWaterTargetDraft = () => {
    const nextTarget = Number(targetInputValue);

    if (!Number.isFinite(nextTarget)) {
      setTargetDraft(null);
      return;
    }

    void saveWaterState(buildWaterStateAfterTargetChange(water, nextTarget)).then(
      (saved) => {
        if (!saved) {
          return;
        }

        setTargetDraft(null);
      }
    );
  };

  const saveGlassSizeDraft = () => {
    const nextGlassSize = Number(glassSizeInputValue);

    if (!Number.isFinite(nextGlassSize)) {
      setGlassSizeDraft(null);
      return;
    }

    void saveWaterState(
      buildWaterStateAfterGlassSizeChange(water, nextGlassSize)
    ).then((saved) => {
      if (!saved) {
        return;
      }

      setGlassSizeDraft(null);
    });
  };

  const savePartialGlass = async () => {
    if (editingSlot === null) {
      return;
    }

    const slotStart = editingSlot * water.glassSizeMl;
    if (partialAmountValue === null) {
      return;
    }

    const normalizedAmount = normalizeWaterSlotAmount(
      partialAmountValue,
      water.glassSizeMl
    );

    const previousConsumedMl = water.consumedMl;
    const nextWater = buildWaterStateAfterSetAmount(
      water,
      slotStart + normalizedAmount
    );
    const saved = await saveWaterState(nextWater);

    if (!saved) {
      return;
    }

    setEditingSlot(null);
    playWaterFeedback(nextWater.consumedMl, previousConsumedMl);
    void trackWaterAdded(
      nextWater.consumedMl - previousConsumedMl,
      "partial_glass",
      nextWater.consumedMl
    );
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
        {saveError || waterActionError ? (
          <Alert
            severity="error"
            action={
              waterActionHasRetry ? (
                <Button
                  color="inherit"
                  size="small"
                  disabled={savingWater}
                  onClick={() => {
                    setSaveError(null);
                    void retryLastWaterSave().catch(() => {
                      setSaveError(copy.saveError);
                    });
                  }}
                >
                  {copy.retry}
                </Button>
              ) : undefined
            }
            onClose={() => {
              setSaveError(null);
              clearWaterActionError();
            }}
          >
            {saveError ?? waterActionError}
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
              {copy.remainingLabel.replace("{value}", formatMl(remainingMl))}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 12, borderRadius: 999 }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.drank}: ${formatMl(water.consumedMl)}`} color="info" />
              <Chip label={`${copy.remaining}: ${formatMl(remainingMl)}`} variant="outlined" />
              <Chip
                label={
                  water.targetMode === "automatic"
                    ? `${copy.autoTarget} ${Math.round(latestWeight * 30)}-${formatMl(
                        Math.round(latestWeight * 35)
                      )}`
                    : copy.manualTarget
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
                  name={assistantDisplayName}
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
            value={targetInputValue}
            disabled={savingWater}
            onChange={(event) => {
              setTargetDraft(event.target.value);
              setSaveError(null);
              clearWaterActionError();
            }}
            onBlur={saveWaterTargetDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
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
            value={glassSizeInputValue}
            disabled={savingWater}
            onChange={(event) => {
              setGlassSizeDraft(event.target.value);
              setSaveError(null);
              clearWaterActionError();
            }}
            onBlur={saveGlassSizeDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(4, minmax(0, 1fr))",
              sm: "repeat(auto-fit, minmax(72px, 1fr))",
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
              disabled={savingWater}
              sx={{
                p: 0,
                minHeight: { xs: 104, sm: 118 },
                border: "0",
                backgroundColor: "transparent",
                cursor: "pointer",
                position: "relative",
                "&:disabled": {
                  cursor: "wait",
                  opacity: 0.64,
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  insetInline: { xs: 10, sm: 14 },
                  top: 8,
                  bottom: 8,
                  borderRadius: "10px 10px 18px 18px",
                  border: "2px solid rgba(125, 211, 252, 0.72)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(14,165,233,0.06))",
                  boxShadow: "inset 0 0 18px rgba(125,211,252,0.18)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    insetInline: 0,
                    bottom: 0,
                    height: `${glass.fill * 100}%`,
                    background:
                      "linear-gradient(180deg, rgba(56,189,248,0.86), rgba(37,99,235,0.92))",
                    transition: "height 180ms ease",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      insetInline: 0,
                      top: -5,
                      height: 10,
                      borderRadius: "50%",
                      background: "rgba(224,242,254,0.85)",
                    },
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pt: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.8,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: "rgba(15, 23, 42, 0.72)",
                    color: "#e0f2fe",
                    fontWeight: 850,
                  }}
                >
                  {formatMl(glass.fill * water.glassSizeMl)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.quickAmounts}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={amount === water.glassSizeMl ? "contained" : "outlined"}
                disabled={savingWater}
                onClick={() => addWaterAmount(amount, "quick_amount")}
                sx={{ minWidth: 82 }}
              >
                +{formatMl(amount)}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="contained"
            disabled={savingWater}
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
            disabled={savingWater}
            onClick={openPartialPanel}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.customAmount}
          </Button>
          <Button
            variant="text"
            disabled={savingWater}
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
                onChange={(event) => {
                  const value = event.target.value;
                  const nextValue = Number(value);
                  setSaveError(null);
                  clearWaterActionError();
                  setPartialAmountMl(
                    value === "" || !Number.isFinite(nextValue)
                      ? ""
                      : Math.max(0, nextValue)
                  );
                }}
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
                    variant={partialAmountValue === amount ? "contained" : "outlined"}
                    disabled={savingWater}
                    onClick={() => setPartialAmountMl(amount)}
                  >
                    {formatMl(amount)}
                  </Button>
                ))}
              </Stack>
              <LinearProgress
                variant="determinate"
                value={((Math.min(partialAmountValue ?? 0, water.glassSizeMl)) / water.glassSizeMl) * 100}
                sx={{ height: 10, borderRadius: 999 }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                <Button disabled={savingWater} onClick={() => setEditingSlot(null)}>
                  {copy.cancel}
                </Button>
                <Button
                  onClick={() => {
                    void savePartialGlass();
                  }}
                  variant="contained"
                  disabled={
                    savingWater ||
                    partialAmountValue === null ||
                    partialAmountValue <= 0
                  }
                >
                  {savingWater ? copy.saving : copy.save}
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
                  disabled={savingWater}
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
                disabled={savingWater}
                onChange={(event) =>
                  void saveWaterState(
                    buildWaterStateAfterReminderChange(water, {
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
                disabled={savingWater}
                onChange={(event) =>
                  void saveWaterState(
                    buildWaterStateAfterReminderChange(water, {
                      startTime: event.target.value,
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label={copy.reminderEnd}
                value={water.reminders.endTime}
                disabled={savingWater}
                onChange={(event) =>
                  void saveWaterState(
                    buildWaterStateAfterReminderChange(water, {
                      endTime: event.target.value,
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            {getSafeNotificationPermission() === "default" ? (
              <Alert severity="info">{copy.reminderPermission}</Alert>
            ) : null}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>{copy.analyticsTitle}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.average}: ${formatMl(weeklyAverageMl)}`} color="info" />
              <Chip
                label={`${copy.goalDays}: ${weeklyGoalDays}/7`}
                color={weeklyGoalDays >= 5 ? "success" : "default"}
                variant="outlined"
              />
              <Chip
                label={`${copy.bestDay}: ${formatMl(weeklyBestDay.consumedMl)}`}
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
                      {formatMl(item.consumedMl)} / {formatMl(item.targetMl)}
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
