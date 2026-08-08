import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Paper, Stack, Typography } from "@mui/material";
import {
  AssistantAvatar,
  type AssistantAvatarMood,
} from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
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
    womenHealth:
      "Познач життєвий етап. Я підлаштую цілі, поради й нагадування без зайвого тиску.",
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
    womenHealth:
      "Zaznacz aktualny etap. Dopasuję cele, wskazówki i przypomnienia bez presji.",
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
    womenHealth:
      "Mark your current life stage. I will adapt goals, guidance, and reminders without pressure.",
    height: "Height sharpens the goal calculation.",
    goal: "Pick the direction: fat loss, muscle gain, or stability.",
    friction: "Tell me what usually throws you off. I will adapt the support.",
    motivation: "Let us pick a support style that will actually fit.",
    weight: "Weight becomes the starting point for progress.",
    finish: "Done. I will assemble your route and open the main screen.",
  },
} as const;

type GuideCopy = (typeof guideCopy)[keyof typeof guideCopy];

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
  "/onboarding/women-health": {
    key: "womenHealth",
    placement: "peekRight",
    mood: "coach",
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

const GUIDE_SIDE_RAIL = "max(24px, calc((100vw - 720px) / 2 - 300px))";
const GUIDE_OUTSIDE_FORM_RAIL =
  "max(24px, calc((100vw - 720px) / 2 - 430px))";

const placementSx: Record<GuidePlacement, object> = {
  peekLeft: {
    right: { lg: GUIDE_OUTSIDE_FORM_RAIL },
    top: { xs: "auto", md: 146 },
    bottom: { xs: 92, md: "auto" },
  },
  peekRight: {
    right: { lg: GUIDE_OUTSIDE_FORM_RAIL },
    top: { xs: "auto", md: 146 },
    bottom: { xs: 92, md: "auto" },
  },
  floatTop: {
    right: { lg: GUIDE_SIDE_RAIL },
    top: { xs: 92, md: 118 },
  },
  floatBottom: {
    right: { lg: GUIDE_SIDE_RAIL },
    bottom: { xs: 92, md: 94 },
  },
};

const fallbackStepMeta: StepMeta = {
  key: "assistant",
  placement: "peekRight",
  mood: "celebrate",
};

const getGuideCopy = (language: AppLanguage): GuideCopy => {
  switch (language) {
    case "uk":
      return guideCopy.uk;
    case "pl":
      return guideCopy.pl;
    case "en":
    default:
      return guideCopy.en;
  }
};

const resolveStepMeta = (pathname: string): StepMeta =>
  Object.entries(stepMeta).find(([stepPath]) => stepPath === pathname)?.[1] ??
  fallbackStepMeta;

const resolvePlacementSx = (placement: GuidePlacement): object => {
  switch (placement) {
    case "peekLeft":
      return placementSx.peekLeft;
    case "floatTop":
      return placementSx.floatTop;
    case "floatBottom":
      return placementSx.floatBottom;
    case "peekRight":
    default:
      return placementSx.peekRight;
  }
};

const getGuideMessage = (copy: GuideCopy, key: StepMeta["key"]): string => {
  switch (key) {
    case "welcome":
      return copy.welcome;
    case "name":
      return copy.name;
    case "age":
      return copy.age;
    case "gender":
      return copy.gender;
    case "womenHealth":
      return copy.womenHealth;
    case "height":
      return copy.height;
    case "goal":
      return copy.goal;
    case "friction":
      return copy.friction;
    case "motivation":
      return copy.motivation;
    case "weight":
      return copy.weight;
    case "finish":
      return copy.finish;
    case "assistant":
    default:
      return copy.assistant;
  }
};

const guideFallbackNames = {
  uk: "Помічник",
  pl: "Asystent",
  en: "Assistant",
} as const;

const getGuideAssistantName = (language: AppLanguage, assistantName: string) => {
  const trimmedName = assistantName.trim();

  if (trimmedName.length > 0) {
    return trimmedName;
  }

  switch (language) {
    case "uk":
      return guideFallbackNames.uk;
    case "pl":
      return guideFallbackNames.pl;
    case "en":
    default:
      return guideFallbackNames.en;
  }
};

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

const isFormField = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='textbox'], .MuiInputBase-root"
    )
  );
};

const useHideGuideWhileFieldFocused = () => {
  const [fieldFocused, setFieldFocused] = useState(false);

  useEffect(() => {
    const syncFocusState = () => {
      setFieldFocused(isFormField(document.activeElement));
    };

    const onFocusIn = (event: FocusEvent) => {
      setFieldFocused(isFormField(event.target));
    };

    const onFocusOut = () => {
      window.setTimeout(syncFocusState, 0);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    syncFocusState();

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return fieldFocused;
};

export const OnboardingGuide = ({ state }: { state: OnboardingState }) => {
  const { pathname } = useLocation();
  const { appLanguage } = useLanguage();
  const lookOffset = usePointerLook();
  const fieldFocused = useHideGuideWhileFieldFocused();

  const meta = resolveStepMeta(pathname);
  const { key, placement, mood } = meta;

  const copy = getGuideMessage(getGuideCopy(appLanguage), key);
  const displayName = getGuideAssistantName(appLanguage, state.assistantName);

  const transform = useMemo(() => {
    if (placement === "peekLeft") {
      return "none";
    }

    if (placement === "peekRight") {
      return "none";
    }

    return "none";
  }, [placement]);

  if (fieldFocused) {
    return null;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Box
        key={pathname}
        component={motion.div}
        layout
        variants={onboardingGuideShellVariants}
        initial="initial"
        animate={fieldFocused ? "exit" : "animate"}
        exit="exit"
        data-onboarding-guide-hidden-while-field-focused={fieldFocused ? "true" : "false"}
        sx={{
          position: "fixed",
          zIndex: 1250,
          pointerEvents: "none",
          display: { xs: "none", lg: "block" },
          maxWidth: 360,
          ...resolvePlacementSx(placement),
          transform,
          transformOrigin: "right top",
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
            direction="row-reverse"
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
                name={displayName}
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
                {displayName}
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
