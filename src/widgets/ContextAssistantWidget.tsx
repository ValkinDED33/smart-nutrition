import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "@app/store";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "@features/meal/selectors";
import { selectDailyMacroTargets } from "@features/profile/selectors";
import { detectWeightPlateau, getDaysSince } from "@domain/profile/bodyMetrics";
import { useLanguage } from "@shared/language";
import { AssistantAvatar, type AssistantAvatarMood } from "@shared/components/AssistantAvatar";
import {
  buildAssistantCoreSnapshot,
  buildAssistantPersonalizationPlan,
  type AssistantCoreEmotion,
} from "@core/assistant";
import {
  assistantSpeechBubbleVariants,
  assistantSpeechStaggerVariants,
  fadeUpVariants,
} from "@shared/ui/motion";

const widgetCopy = {
  uk: {
    help: "Порада",
    close: "Сховати",
    open: "Відкрити companion",
    openChat: "Відкрити AI",
    level: "Рівень",
    points: "XP",
    moods: {
      idle: "Поруч",
      happy: "Ритм є",
      coach: "Coach mode",
      concerned: "Мʼякий контроль",
      sleepy: "Чекаю поруч",
      celebrate: "Прогрес",
    },
    setup: {
      title: "Бачу, ви ще на старті",
      body: "Хочете, допоможу швидко налаштувати цілі та стартові заміри?",
      action: "Відкрити профіль",
    },
    plateau: {
      title: "Схоже на plateau",
      body: "Вага майже не змінюється кілька тижнів. Це нормально. Хочете переглянути прогрес і варіанти?",
      action: "Подивитися заміри",
    },
    water: {
      title: "Вода сьогодні просіла",
      body: "Ви випили менше норми. Хочете докинути воду в трекер?",
      action: "Відкрити воду",
    },
    checkIn: {
      title: "Час оновити вагу",
      body: "Пора записати новий weekly check-in і заміри.",
      action: "Записати check-in",
    },
    caloriesHigh: {
      title: "Калорії вже вище плану",
      body: "Не катастрофа. Просто зробимо решту дня легшою і без різких рішень.",
      action: "Відкрити щоденник",
    },
    caloriesLow: {
      title: "День ще недоїдає",
      body: "Схоже, калорій замало. Додамо простий прийом їжі без стресу?",
      action: "Додати їжу",
    },
    progressGood: {
      title: "Гарний ритм сьогодні",
      body: "Ви тримаєте день у керованій зоні. Це саме той маленький прогрес, який накопичується.",
      action: "Подивитися прогрес",
    },
    personalCommunity: {
      title: "Підтримка може підсилити план",
      body: "У Community можна швидко знайти людей зі схожим сценарієм і не тягнути все самостійно.",
      action: "Відкрити Community",
    },
  },
  pl: {
    help: "Podpowiedź",
    close: "Ukryj",
    open: "Otwórz companion",
    openChat: "Otwórz AI",
    level: "Poziom",
    points: "XP",
    moods: {
      idle: "Jestem obok",
      happy: "Rytm jest",
      coach: "Coach mode",
      concerned: "Łagodna kontrola",
      sleepy: "Czekam obok",
      celebrate: "Progres",
    },
    setup: {
      title: "Widzę, że dopiero startujesz",
      body: "Chcesz, żebym pomógł szybko ustawić cele i pierwsze pomiary?",
      action: "Otwórz profil",
    },
    plateau: {
      title: "To wygląda na plateau",
      body: "Waga prawie się nie zmienia od kilku tygodni. To normalne. Chcesz przejrzeć progres i opcje?",
      action: "Zobacz pomiary",
    },
    water: {
      title: "Woda dziś jest za nisko",
      body: "Wypito mniej niż plan. Chcesz szybko uzupełnić wodę w trackerze?",
      action: "Otwórz wodę",
    },
    checkIn: {
      title: "Czas odświeżyć wagę",
      body: "To dobry moment, aby dodać nowy weekly check-in i pomiary.",
      action: "Dodaj check-in",
    },
    caloriesHigh: {
      title: "Kalorie są już ponad plan",
      body: "To nie katastrofa. Po prostu ustawimy resztę dnia spokojniej, bez ostrych skrętów.",
      action: "Otwórz dziennik",
    },
    caloriesLow: {
      title: "Dzień jest jeszcze niedojedzony",
      body: "Wygląda na to, że kalorii jest za mało. Dodamy prosty posiłek bez stresu?",
      action: "Dodaj jedzenie",
    },
    progressGood: {
      title: "Dobry rytm dzisiaj",
      body: "Trzymasz dzień w kontrolowanej strefie. To właśnie mały progres, który się sumuje.",
      action: "Zobacz progres",
    },
    personalCommunity: {
      title: "Wsparcie może wzmocnić plan",
      body: "W Community możesz szybko znaleźć osoby z podobnym scenariuszem i nie ciągnąć wszystkiego samodzielnie.",
      action: "Otwórz Community",
    },
  },
  en: {
    help: "Tip",
    close: "Hide",
    open: "Open assistant",
    openChat: "Open assistant",
    level: "Level",
    points: "XP",
    moods: {
      idle: "Nearby",
      happy: "Rhythm is here",
      coach: "Coach mode",
      concerned: "Gentle control",
      sleepy: "Waiting nearby",
      celebrate: "Progress",
    },
    setup: {
      title: "I can see you are still starting",
      body: "Want me to help quickly set goals and first measurements?",
      action: "Open profile",
    },
    plateau: {
      title: "This looks like a plateau",
      body: "Weight has barely moved for a few weeks. That can be normal. Want to review progress and options?",
      action: "View measurements",
    },
    water: {
      title: "Water is low today",
      body: "You drank less than planned. Want to update the water tracker quickly?",
      action: "Open water",
    },
    checkIn: {
      title: "Time to update weight",
      body: "It is a good moment to add a weekly check-in and measurements.",
      action: "Add check-in",
    },
    caloriesHigh: {
      title: "Calories are already above plan",
      body: "No drama. We can make the rest of the day calmer without sharp turns.",
      action: "Open diary",
    },
    caloriesLow: {
      title: "The day is still underfed",
      body: "Calories look too low. Add a simple meal without stress?",
      action: "Add food",
    },
    progressGood: {
      title: "Good rhythm today",
      body: "You are keeping the day in a controlled zone. That is the small progress that adds up.",
      action: "View progress",
    },
    personalCommunity: {
      title: "Support can strengthen the plan",
      body: "Community can connect you with people facing a similar scenario, so you are not carrying everything alone.",
      action: "Open Community",
    },
  },
} as const;

const IDLE_TIMEOUT_MS = 75_000;

const clamp = (value: number, min = -1, max = 1) =>
  Math.max(min, Math.min(max, value));

const avatarMoodByEmotion: Record<AssistantCoreEmotion, AssistantAvatarMood> = {
  calm: "idle",
  encouraging: "happy",
  focused: "coach",
  concerned: "concerned",
  celebrating: "celebrate",
};

interface AssistantTip {
  id: string;
  title: string;
  body: string;
  action: string;
  mood: AssistantAvatarMood;
  onAction: () => void;
}

export const ContextAssistantWidget = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const todayItems = useSelector(selectTodayMealItems);
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const { appLanguage } = useLanguage();
  const copy = widgetCopy[appLanguage];
  const [dismissedTipId, setDismissedTipId] = useState<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const weeklyCheckInDue =
    profile.weeklyCheckIn.enabled &&
    getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
      profile.weeklyCheckIn.remindIntervalDays;
  const openMotivationTasks = profile.motivation.activeTasks.filter(
    (task) => !task.completedAt && !task.skippedWithDayOffAt
  ).length;
  const assistantCore = useMemo(
    () =>
      buildAssistantCoreSnapshot({
        userId: user?.id,
        userName: user?.name ?? "",
        goal: profile.goal,
        assistant: profile.assistant,
        signals: {
          mealEntriesToday: todayItems.length,
          caloriesConsumed: todayTotals.calories,
          dailyCalories: profile.dailyCalories,
          proteinConsumed: todayTotals.protein,
          proteinTarget: macroTargets.protein,
          waterConsumedMl: water.consumedMl,
          waterTargetMl: water.dailyWaterGoal,
          completedMotivationTasks: profile.motivation.completedTasks,
          openMotivationTasks,
          weeklyCheckInDue,
        },
      }),
    [
      macroTargets.protein,
      openMotivationTasks,
      profile.assistant,
      profile.dailyCalories,
      profile.goal,
      profile.motivation.completedTasks,
      todayItems.length,
      todayTotals.calories,
      todayTotals.protein,
      user?.id,
      user?.name,
      water.consumedMl,
      water.dailyWaterGoal,
      weeklyCheckInDue,
    ]
  );

  useEffect(() => {
    if (!user || !profile.assistant.widgetEnabled) {
      return;
    }

    let idleTimer: number | undefined;
    let animationFrame: number | undefined;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const resetIdleTimer = () => {
      if (idleTimer !== undefined) {
        window.clearTimeout(idleTimer);
      }

      setIsIdle(false);
      idleTimer = window.setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);
    };

    const updateLookOffset = () => {
      animationFrame = undefined;
      setLookOffset({
        x: clamp((pointer.x / Math.max(window.innerWidth, 1) - 0.5) * 2),
        y: clamp((pointer.y / Math.max(window.innerHeight, 1) - 0.5) * 2),
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      resetIdleTimer();

      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateLookOffset);
      }
    };

    const handleActivity = () => resetIdleTimer();

    resetIdleTimer();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      if (idleTimer !== undefined) {
        window.clearTimeout(idleTimer);
      }
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [profile.assistant.widgetEnabled, user]);

  const currentTip = useMemo<AssistantTip | null>(() => {
    if (!user) {
      return null;
    }

    const plateau = detectWeightPlateau(profile.weightHistory);
    const hours = new Date().getHours();
    const calorieTarget = Math.max(profile.dailyCalories, 0);
    const calorieRatio =
      calorieTarget > 0 ? todayTotals.calories / calorieTarget : 0;
    const waterIsLow =
      hours >= 16 &&
      water.dailyWaterGoal > 0 &&
      water.consumedMl < water.dailyWaterGoal * 0.6;
    const personalization = buildAssistantPersonalizationPlan(
      profile.assistant.onboarding,
      appLanguage
    );
    const shouldSurfaceCommunity =
      profile.assistant.onboarding.completedAt &&
      (profile.assistant.onboarding.mainFriction === "social_pressure" ||
        openMotivationTasks >= 2);
    if (profile.weightHistory.length < 2 && profile.measurementHistory.length === 0) {
      return {
        id: "setup",
        ...copy.setup,
        mood: "coach",
        onAction: () => navigate("/profile"),
      };
    }

    if (weeklyCheckInDue) {
      return {
        id: "check-in",
        ...copy.checkIn,
        mood: "coach",
        onAction: () => navigate("/profile"),
      };
    }

    if (calorieTarget > 0 && todayTotals.calories > calorieTarget * 1.08) {
      return {
        id: "calories-high",
        ...copy.caloriesHigh,
        mood: "concerned",
        onAction: () => navigate("/meals"),
      };
    }

    if (plateau.hasPlateau) {
      return {
        id: "plateau",
        ...copy.plateau,
        mood: "concerned",
        onAction: () => navigate("/profile"),
      };
    }

    if (waterIsLow) {
      return {
        id: "water",
        ...copy.water,
        mood: "coach",
        onAction: () => navigate("/progress"),
      };
    }

    if (shouldSurfaceCommunity) {
      return {
        id: "personal-community",
        ...copy.personalCommunity,
        body: `${copy.personalCommunity.body} ${personalization.recommendationHint}`,
        mood: "happy",
        onAction: () => navigate("/community"),
      };
    }

    if (
      calorieTarget > 0 &&
      hours >= 19 &&
      todayTotals.calories > 0 &&
      calorieRatio < 0.62
    ) {
      return {
        id: "calories-low",
        ...copy.caloriesLow,
        mood: "coach",
        onAction: () => navigate("/meals"),
      };
    }

    if (
      calorieTarget > 0 &&
      hours >= 12 &&
      todayTotals.calories > 0 &&
      calorieRatio >= 0.42 &&
      calorieRatio <= 1.02
    ) {
      return {
        id: "progress-good",
        ...copy.progressGood,
        mood: "celebrate",
        onAction: () => navigate("/progress"),
      };
    }

    return null;
  }, [
    copy.caloriesHigh,
    copy.caloriesLow,
    copy.checkIn,
    copy.plateau,
    copy.personalCommunity,
    copy.progressGood,
    copy.setup,
    copy.water,
    navigate,
    openMotivationTasks,
    appLanguage,
    profile,
    todayTotals.calories,
    user,
    water,
    weeklyCheckInDue,
  ]);

  if (!user || !profile.assistant.widgetEnabled) {
    return null;
  }

  const assistantMood: AssistantAvatarMood = isIdle
    ? "sleepy"
    : currentTip?.mood ?? avatarMoodByEmotion[assistantCore.emotion];
  const showTipCard =
    profile.assistant.proactiveHintsEnabled &&
    Boolean(currentTip) &&
    !isIdle &&
    dismissedTipId !== currentTip?.id;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: {
            xs: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
            md: 24,
          },
          zIndex: 1200,
          display: { xs: "none", md: "grid" },
          gap: 1.2,
          justifyItems: "end",
        }}
      >
        <AnimatePresence initial={false}>
          {showTipCard && currentTip && (
          <Paper
            key={currentTip.id}
            component={motion.div}
            layout
            variants={assistantSpeechBubbleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            elevation={8}
            sx={{
              display: { xs: "none", xl: "block" },
              width: { xs: 280, sm: 340 },
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,249,255,0.94) 100%)",
            }}
          >
            <Stack
              component={motion.div}
              variants={assistantSpeechStaggerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              spacing={1.2}
            >
              <Stack
                component={motion.div}
                variants={fadeUpVariants}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                useFlexGap
              >
                <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
                  {copy.help}
                </Typography>
                <Chip
                  size="small"
                  label={copy.moods[currentTip.mood]}
                  color={currentTip.mood === "concerned" ? "warning" : "success"}
                  variant="outlined"
                />
              </Stack>
              <Typography component={motion.p} variants={fadeUpVariants} sx={{ fontWeight: 800 }}>
                {currentTip.title}
              </Typography>
              <Typography component={motion.p} variants={fadeUpVariants} color="text.secondary">
                {currentTip.body}
              </Typography>
              <Stack
                component={motion.div}
                variants={fadeUpVariants}
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  label={`${copy.level}: ${profile.motivation.level}`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${copy.points}: ${profile.motivation.points}`}
                  variant="outlined"
                />
              </Stack>
              <Stack
                component={motion.div}
                variants={fadeUpVariants}
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Button
                  variant="contained"
                  onClick={currentTip.onAction}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }}
                >
                  {currentTip.action}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/coach")}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
                >
                  {copy.openChat}
                </Button>
                <Button
                  variant="text"
                  onClick={() => setDismissedTipId(currentTip.id)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {copy.close}
                </Button>
              </Stack>
            </Stack>
          </Paper>
          )}
        </AnimatePresence>

        <Box
          component="button"
          type="button"
          onClick={() => navigate("/coach")}
          aria-label={copy.open}
          sx={{
            width: 64,
            height: 64,
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            p: 0,
            background: "transparent",
          }}
        >
          <AssistantAvatar
            name={profile.assistant.name}
            variant={profile.assistant.companionKind}
            mood={assistantMood}
            lookOffset={lookOffset}
            active={Boolean(currentTip) && !isIdle}
          />
        </Box>
      </Box>
    </>
  );
};
