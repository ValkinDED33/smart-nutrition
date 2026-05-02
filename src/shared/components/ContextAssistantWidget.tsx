import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Drawer, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { AssistantRuntimeCard } from "../../features/assistant/AssistantRuntimeCard";
import { selectTodayMealTotalNutrients } from "../../features/meal/selectors";
import { detectWeightPlateau, getDaysSince } from "../lib/bodyMetrics";
import { useLanguage } from "../language";
import { AssistantAvatar, type AssistantAvatarMood } from "./AssistantAvatar";

const widgetCopy = {
  uk: {
    help: "Порада",
    close: "Сховати",
    open: "Відкрити companion",
    openChat: "Міні-чат",
    fullPage: "Повний екран AI",
    drawerTitle: "Clippy 2.0",
    drawerSubtitle: "Швидкий контекстний діалог прямо поверх поточного екрана.",
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
  },
  pl: {
    help: "Podpowiedź",
    close: "Ukryj",
    open: "Otwórz companion",
    openChat: "Mini-chat",
    fullPage: "Pełny ekran AI",
    drawerTitle: "Clippy 2.0",
    drawerSubtitle: "Szybki kontekstowy dialog bez wychodzenia z aktualnego ekranu.",
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
  },
} as const;

const IDLE_TIMEOUT_MS = 75_000;

const clamp = (value: number, min = -1, max = 1) =>
  Math.max(min, Math.min(max, value));

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
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
  const { language } = useLanguage();
  const copy = widgetCopy[language];
  const [dismissedTipId, setDismissedTipId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });

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
      water.dailyTargetMl > 0 &&
      water.consumedMl < water.dailyTargetMl * 0.6;
    const checkInDue =
      profile.weeklyCheckIn.enabled &&
      getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
        profile.weeklyCheckIn.remindIntervalDays;

    if (profile.weightHistory.length < 2 && profile.measurementHistory.length === 0) {
      return {
        id: "setup",
        ...copy.setup,
        mood: "coach",
        onAction: () => navigate("/profile"),
      };
    }

    if (checkInDue) {
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
    copy.progressGood,
    copy.setup,
    copy.water,
    navigate,
    profile,
    todayTotals.calories,
    user,
    water,
  ]);

  if (!user || !profile.assistant.widgetEnabled) {
    return null;
  }

  const assistantMood: AssistantAvatarMood = panelOpen
    ? "coach"
    : isIdle
      ? "sleepy"
      : currentTip?.mood ?? "happy";
  const showTipCard =
    profile.assistant.proactiveHintsEnabled &&
    Boolean(currentTip) &&
    !isIdle &&
    !panelOpen &&
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
        {showTipCard && currentTip && (
          <Paper
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
            <Stack spacing={1.2}>
              <Stack
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
              <Typography sx={{ fontWeight: 800 }}>{currentTip.title}</Typography>
              <Typography color="text.secondary">{currentTip.body}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
                  onClick={() => setPanelOpen(true)}
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

        <Box
          component="button"
          type="button"
          onClick={() => setPanelOpen((current) => !current)}
          aria-label={panelOpen ? copy.close : copy.open}
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
            mood={assistantMood}
            lookOffset={lookOffset}
            active={Boolean(currentTip) && !panelOpen && !isIdle}
          />
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "88vh",
            background:
              "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
          },
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, overflowY: "auto" }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Stack spacing={0.4}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <AssistantAvatar
                    name={profile.assistant.name}
                    size={48}
                    mood="coach"
                    lookOffset={lookOffset}
                    active={panelOpen}
                  />
                  <Stack spacing={0.2}>
                    <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
                      {copy.drawerTitle}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {profile.assistant.name}
                    </Typography>
                  </Stack>
                </Stack>
                <Typography color="text.secondary">{copy.drawerSubtitle}</Typography>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPanelOpen(false);
                    navigate("/ai");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
                >
                  {copy.fullPage}
                </Button>
                <Button
                  variant="text"
                  onClick={() => setPanelOpen(false)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {copy.close}
                </Button>
              </Stack>
            </Stack>

            <AssistantRuntimeCard />
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};
