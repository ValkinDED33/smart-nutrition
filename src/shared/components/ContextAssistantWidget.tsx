import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { detectWeightPlateau, getDaysSince } from "../lib/bodyMetrics";
import { useLanguage } from "../language";

const widgetCopy = {
  uk: {
    help: "Порада",
    close: "Сховати",
    open: "Відкрити пораду",
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
  },
  pl: {
    help: "Podpowiedź",
    close: "Ukryj",
    open: "Otwórz podpowiedź",
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
  },
} as const;

export const ContextAssistantWidget = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const { language } = useLanguage();
  const copy = widgetCopy[language];
  const [dismissedTipId, setDismissedTipId] = useState<string | null>(null);

  const currentTip = useMemo(() => {
    if (!user) {
      return null;
    }

    const plateau = detectWeightPlateau(profile.weightHistory);
    const hours = new Date().getHours();
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
        onAction: () => navigate("/profile"),
      };
    }

    if (checkInDue) {
      return {
        id: "check-in",
        ...copy.checkIn,
        onAction: () => navigate("/profile"),
      };
    }

    if (plateau.hasPlateau) {
      return {
        id: "plateau",
        ...copy.plateau,
        onAction: () => navigate("/profile"),
      };
    }

    if (waterIsLow) {
      return {
        id: "water",
        ...copy.water,
        onAction: () => navigate("/progress"),
      };
    }

    return null;
  }, [copy.checkIn, copy.plateau, copy.setup, copy.water, navigate, profile, user, water]);

  if (!user || !currentTip) {
    return null;
  }

  const open = dismissedTipId !== currentTip.id;

  return (
    <Box
      sx={{
        position: "fixed",
        right: { xs: 16, md: 24 },
        bottom: {
          xs: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          md: 24,
        },
        zIndex: 1200,
        display: "grid",
        gap: 1.2,
        justifyItems: "end",
      }}
    >
      {open && (
        <Paper
          elevation={8}
          sx={{
            width: { xs: 280, sm: 320 },
            p: 2,
            borderRadius: 4,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,249,255,0.94) 100%)",
          }}
        >
          <Stack spacing={1.2}>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {copy.help}
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>{currentTip.title}</Typography>
            <Typography color="text.secondary">{currentTip.body}</Typography>
            <Stack direction="row" spacing={1}>
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
        onClick={() =>
          setDismissedTipId((current) => (current === currentTip.id ? null : currentTip.id))
        }
        aria-label={open ? copy.close : copy.open}
        sx={{
          width: 64,
          height: 64,
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          color: "white",
          fontWeight: 900,
          fontSize: 24,
          background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
          boxShadow: "0 18px 36px rgba(15, 118, 110, 0.28)",
        }}
      >
        {profile.assistant.name[0]}
      </Box>
    </Box>
  );
};
