import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Paper, Stack, Typography } from "@mui/material";
import {
  AssistantAvatar,
  type AssistantAvatarMood,
} from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import {
  onboardingGuideAvatarVariants,
  onboardingGuideBubbleVariants,
  onboardingGuideFloatVariants,
  onboardingGuideGlowVariants,
  onboardingGuideShellVariants,
  onboardingGuideStaggerVariants,
} from "../../shared/ui/motion/onboardingGuide";
import type { OnboardingState } from "./types";

type GuidePlacement = "peekLeft" | "peekRight" | "floatTop" | "floatBottom";

const guideCopy = {
  uk: {
    welcome: "Я буду поруч на кожному кроці. Почнемо спокійно.",
    assistant: "Обери, яким я буду. Це твій постійний companion.",
    name: "Як тебе звати? Я запам'ятаю, як звертатися до тебе.",
    age: "Вік потрібен тільки для точніших норм калорій.",
    gender: "Це допоможе краще порахувати базовий обмін.",
    height: "Зріст уточнює розрахунок цілі.",
    goal: "Тут обираємо напрям: схуднення, набір або стабільність.",
    friction: "Скажи, що найчастіше збиває. Я підлаштую підтримку.",
    motivation: "Виберемо стиль підтримки, щоб я не тиснув зайвого.",
    weight: "Вага стане стартовою точкою прогресу.",
    finish: "Готово. Зараз зберу твій маршрут і відкрию головний екран.",
  },
  pl: {
    welcome: "Będę obok na każdym kroku. Zaczynamy spokojnie.",
    assistant: "Wybierz, jaki mam być. To Twój stały companion.",
    name: "Jak mam się do Ciebie zwracać? Zapamiętam to.",
    age: "Wiek pomaga dokładniej policzyć normę kalorii.",
    gender: "To pomoże lepiej wyliczyć podstawową przemianę.",
    height: "Wzrost doprecyzuje cel.",
    goal: "Tu wybieramy kierunek: redukcja, masa albo stabilizacja.",
    friction: "Powiedz, co najczęściej wybija z rytmu. Dopasuję wsparcie.",
    motivation: "Wybierzemy styl wsparcia, żebym nie naciskał za mocno.",
    weight: "Waga będzie punktem startowym progresu.",
    finish: "Gotowe. Zaraz złożę Twój plan i otworzę główny ekran.",
  },
  en: {
    welcome: "I will stay with you on every step. Let us begin calmly.",
    assistant: "Choose what I should feel like. I will be your companion.",
    name: "What should I call you? I will remember it.",
    age: "Age helps me calculate calorie targets more accurately.",
    gender: "This helps estimate your baseline needs.",
    height: "Height sharpens the goal calculation.",
    goal: "Pick the direction: fat loss, muscle gain, or stability.",
    friction: "Tell me what usually throws you off. I will adapt the support.",
    motivation: "Let us pick a support style that will actually fit.",
    weight: "Weight becomes the starting point for progress.",
    finish: "Done. I will assemble your route and open the main screen.",
  },
} as const;

type StepMeta = {
  key: keyof typeof guideCopy.en;
  placement: GuidePlacement;
  mood: AssistantAvatarMood;
};

const stepMeta: Record<string, StepMeta> = {
  "/onboarding": {
    key: "welcome",
    placement: "floatTop",
    mood: "happy",
  },
  "/onboarding/welcome": {
    key: "welcome",
    placement: "floatTop",
    mood: "happy",
  },
  "/onboarding/assistant": {
    key: "assistant",
    placement: "peekRight",
    mood: "celebrate",
  },
  "/onboarding/name": {
    key: "name",
    placement: "peekLeft",
    mood: "coach",
  },
  "/onboarding/age": {
    key: "age",
    placement: "peekRight",
    mood: "coach",
  },
  "/onboarding/gender": {
    key: "gender",
    placement: "floatBottom",
    mood: "happy",
  },
  "/onboarding/height": {
    key: "height",
    placement: "peekLeft",
    mood: "coach",
  },
  "/onboarding/goal": {
    key: "goal",
    placement: "peekRight",
    mood: "coach",
  },
  "/onboarding/friction": {
    key: "friction",
    placement: "floatBottom",
    mood: "concerned",
  },
  "/onboarding/motivation": {
    key: "motivation",
    placement: "peekRight",
    mood: "happy",
  },
  "/onboarding/weight": {
    key: "weight",
    placement: "peekLeft",
    mood: "coach",
  },
  "/onboarding/finish": {
    key: "finish",
    placement: "floatTop",
    mood: "celebrate",
  },
};

const placementSx: Record<GuidePlacement, object> = {
  peekLeft: {
    left: { xs: 12, md: "calc(50% - 430px)" },
    top: { xs: "auto", md: "44%" },
    bottom: { xs: 92, md: "auto" },
  },
  peekRight: {
    right: { xs: 12, md: "calc(50% - 430px)" },
    top: { xs: "auto", md: "38%" },
    bottom: { xs: 92, md: "auto" },
  },
  floatTop: {
    right: { xs: 12, md: "calc(50% - 420px)" },
    top: { xs: 92, md: 118 },
  },
  floatBottom: {
    left: { xs: 12, md: "calc(50% - 410px)" },
    bottom: { xs: 92, md: 94 },
  },
};

const fallbackStepMeta: StepMeta = {
  key: "assistant",
  placement: "peekRight",
  mood: "celebrate",
};

const resolveStepMeta = (pathname: string): StepMeta =>
  Object.prototype.hasOwnProperty.call(stepMeta, pathname)
    ? stepMeta[pathname]!
    : fallbackStepMeta;

const usePointerLook = () => {
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame: number | undefined;

    const onPointerMove = (event: PointerEvent) => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        setLookOffset({
          x: (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2,
          y: (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2,
        });
      });
    };

    window.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });

    return () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return lookOffset;
};

export const OnboardingGuide = ({ state }: { state: OnboardingState }) => {
  const { pathname } = useLocation();
  const { appLanguage } = useLanguage();
  const lookOffset = usePointerLook();

  const meta = resolveStepMeta(pathname);
  const { key, placement, mood } = meta;

  const copy = guideCopy[appLanguage][key];

  const transform = useMemo(() => {
    if (placement === "peekLeft") {
      return "translate(-18px, -50%)";
    }

    if (placement === "peekRight") {
      return "translate(18px, -50%)";
    }

    return "none";
  }, [placement]);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Box
        key={pathname}
        component={motion.div}
        layout
        variants={onboardingGuideShellVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        sx={{
          position: "fixed",
          zIndex: 1250,
          pointerEvents: "none",
          display: { xs: "none", sm: "block" },
          ...placementSx[placement],
          transform,
          transformOrigin: placement === "peekLeft" ? "left center" : "right center",
        }}
      >
        <Box
          component={motion.div}
          layout
          variants={onboardingGuideFloatVariants}
          animate="animate"
        >
          <Stack
            component={motion.div}
            layout
            variants={onboardingGuideStaggerVariants}
            direction={placement === "peekLeft" ? "row" : "row-reverse"}
            spacing={1.2}
            alignItems="center"
          >
            <Box
              component={motion.div}
              layout
              variants={onboardingGuideAvatarVariants}
              sx={{ position: "relative" }}
            >
              <Box
                component={motion.div}
                variants={onboardingGuideGlowVariants}
                animate="animate"
                sx={{
                  position: "absolute",
                  inset: -18,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(20,184,166,0.22), rgba(255,255,255,0) 68%)",
                }}
              />

              <AssistantAvatar
                name={state.assistantName}
                variant={state.assistantAvatar}
                mood={mood}
                lookOffset={lookOffset}
                active
                size={92}
              />
            </Box>

            <Paper
              component={motion.div}
              layout
              variants={onboardingGuideBubbleVariants}
              elevation={0}
              sx={{
                width: 250,
                p: 1.6,
                borderRadius: 1,
                color: "#0f172a",
                border: "1px solid rgba(15,23,42,0.1)",
                bgcolor: "rgba(255,255,255,0.92)",
                boxShadow: "0 18px 48px rgba(15,23,42,0.16)",
                backdropFilter: "blur(16px)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {state.assistantName}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: "#334155",
                  lineHeight: 1.55,
                  fontSize: 14,
                }}
              >
                {copy}
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </AnimatePresence>
  );
};
