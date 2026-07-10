import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot } from "lucide-react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { RootState } from "@app/store";
import type { AssistantArea } from "@features/assistant/assistantManifest";
import type { AssistantViewport } from "@features/assistant/assistantPresence";
import { selectTodayMealItems } from "@features/meal/selectors";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { getLocalDateKey } from "@shared/lib/date";
import { useLanguage } from "@shared/language";
import {
  assistantSpeechBubbleVariants,
  assistantSpeechStaggerVariants,
  fadeUpVariants,
} from "@shared/ui/motion";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { resolveGlobalAssistantLayerModel } from "./globalAssistantLayerModel";
import type { AppLanguage } from "@shared/types/i18n";

const layerCopy = {
  uk: {
    eyebrow: "Асистент поруч",
    fallbackTitle: "Готовий допомогти",
    fallbackBody:
      "Я підлаштовую підказки під поточний екран, профіль і вашу ціль.",
    action: "Відкрити AI",
    coachFallbackAction: "Запитати асистента",
    mobileLabel: "Відкрити асистента",
    areas: {
      auth: {
        chip: "старт",
        title: "Я поруч із самого початку",
        body: "Допоможу пройти реєстрацію, підтвердження пошти й старт без зайвого стресу.",
        action: "Створити акаунт",
      },
      onboarding: {
        chip: "старт",
        title: "Допоможу налаштувати профіль",
        body: "Підкажу наступний крок і збережу ваші цілі для персональних порад.",
        action: "Продовжити",
      },
      home: {
        chip: "сьогодні",
        title: "Фокус на день",
        body: "Підкажу, що важливіше саме зараз: їжа, вода, прогрес або підтримка.",
        action: "Відкрити коуча",
      },
      meals: {
        chip: "харчування",
        title: "Підказка по їжі",
        body: "Допоможу швидше додати прийом їжі і зрозуміти, що варто поправити.",
        action: "Перевірити день",
      },
      coach: {
        chip: "коуч",
        title: "Готовий до діалогу",
        body: "Можу пояснити план, помітити ризики і запропонувати наступний крок.",
        action: "Відкрити коуча",
      },
      progress: {
        chip: "прогрес",
        title: "Поясню прогрес",
        body: "Допоможу розібрати тренди, вагу, воду і зміни без зайвого шуму.",
        action: "Подивитися прогрес",
      },
      profile: {
        chip: "профіль",
        title: "Налаштування під вас",
        body: "Допоможу зробити профіль точнішим, щоб поради були персональними.",
        action: "Доповнити профіль",
      },
      community: {
        chip: "спільнота",
        title: "Підтримка поруч",
        body: "Допоможу знайти корисний формат: друзі, чат, форум або прогрес.",
        action: "До спільноти",
      },
      recipes: {
        chip: "рецепти",
        title: "Ідеї під ваш план",
        body: "Підберу рецепт під ціль, калорії, білок і ваші вподобання.",
        action: "Відкрити рецепти",
      },
      water: {
        chip: "вода",
        title: "Мʼяке нагадування про воду",
        body: "Підкажу, як закрити воду без різких нагадувань і перевантаження.",
        action: "Додати воду",
      },
      admin: {
        chip: "адмін",
        title: "Поясню інструменти",
        body: "Допоможу швидше зорієнтуватися в операційних діях.",
        action: "Відкрити інструменти",
      },
      unknown: {
        chip: "асистент",
        title: "Готовий допомогти",
        body: "Підлаштовую підказки під поточний екран, профіль і вашу ціль.",
        action: "Відкрити AI",
      },
    },
  },
  pl: {
    eyebrow: "Asystent jest obok",
    fallbackTitle: "Gotowy do pomocy",
    fallbackBody:
      "Dopasowuję podpowiedzi do bieżącego ekranu, profilu i celu.",
    action: "Otwórz AI",
    coachFallbackAction: "Zapytaj asystenta",
    mobileLabel: "Otwórz asystenta",
    areas: {
      auth: {
        chip: "start",
        title: "Jestem obok od początku",
        body: "Pomogę przejść rejestrację, potwierdzenie maila i start bez stresu.",
        action: "Utwórz konto",
      },
      onboarding: {
        chip: "start",
        title: "Pomogę ustawić profil",
        body: "Podpowiem kolejny krok i zachowam cele do personalnych wskazówek.",
        action: "Kontynuuj",
      },
      home: {
        chip: "dzisiaj",
        title: "Fokus na dzień",
        body: "Podpowiem, co jest teraz ważniejsze: jedzenie, woda, postęp albo wsparcie.",
        action: "Otwórz coacha",
      },
      meals: {
        chip: "jedzenie",
        title: "Podpowiedź do posiłków",
        body: "Pomogę szybciej dodać jedzenie i zrozumieć, co warto poprawić.",
        action: "Sprawdź dzień",
      },
      coach: {
        chip: "coach",
        title: "Gotowy do rozmowy",
        body: "Mogę wyjaśnić plan, zauważyć ryzyka i zaproponować kolejny krok.",
        action: "Otwórz coacha",
      },
      progress: {
        chip: "postęp",
        title: "Wyjaśnię postęp",
        body: "Pomogę zrozumieć trendy, wagę, wodę i zmiany bez nadmiaru szumu.",
        action: "Zobacz postęp",
      },
      profile: {
        chip: "profil",
        title: "Ustawienia pod Ciebie",
        body: "Pomogę doprecyzować profil, żeby wskazówki były bardziej osobiste.",
        action: "Uzupełnij profil",
      },
      community: {
        chip: "społeczność",
        title: "Wsparcie jest obok",
        body: "Pomogę wybrać przydatny format: znajomi, czat, forum albo postęp.",
        action: "Do społeczności",
      },
      recipes: {
        chip: "przepisy",
        title: "Pomysły pod Twój plan",
        body: "Dobiorę przepis pod cel, kalorie, białko i preferencje.",
        action: "Otwórz przepisy",
      },
      water: {
        chip: "woda",
        title: "Łagodne przypomnienie o wodzie",
        body: "Podpowiem, jak domknąć wodę bez ostrych przypomnień i przeciążenia.",
        action: "Dodaj wodę",
      },
      admin: {
        chip: "admin",
        title: "Wyjaśnię narzędzia",
        body: "Pomogę szybciej odnaleźć się w działaniach operacyjnych.",
        action: "Otwórz narzędzia",
      },
      unknown: {
        chip: "asystent",
        title: "Gotowy do pomocy",
        body: "Dopasowuję podpowiedzi do bieżącego ekranu, profilu i celu.",
        action: "Otwórz AI",
      },
    },
  },
  en: {
    eyebrow: "Assistant nearby",
    fallbackTitle: "Ready to help",
    fallbackBody:
      "I adapt guidance to the current screen, profile, and goal.",
    action: "Open AI",
    coachFallbackAction: "Ask assistant",
    mobileLabel: "Open assistant",
    areas: {
      auth: {
        chip: "start",
        title: "I'm here from the first step",
        body: "I can help with sign-up, email verification, and a calmer start.",
        action: "Create account",
      },
      onboarding: {
        chip: "start",
        title: "I can help set up your profile",
        body: "I will guide the next step and keep your goals available for personal guidance.",
        action: "Continue",
      },
      home: {
        chip: "today",
        title: "Daily focus",
        body: "I can help decide what matters now: food, water, progress, or support.",
        action: "Open coach",
      },
      meals: {
        chip: "food",
        title: "Meal guidance",
        body: "I can help add food faster and explain what is worth adjusting.",
        action: "Review day",
      },
      coach: {
        chip: "coach",
        title: "Ready to talk",
        body: "I can explain the plan, spot risks, and suggest the next step.",
        action: "Open coach",
      },
      progress: {
        chip: "progress",
        title: "Progress explained",
        body: "I can help read trends, weight, water, and changes without the noise.",
        action: "Review progress",
      },
      profile: {
        chip: "profile",
        title: "Tuned to you",
        body: "I can help make your profile sharper so recommendations feel personal.",
        action: "Complete profile",
      },
      community: {
        chip: "community",
        title: "Support nearby",
        body: "I can help choose what fits now: friends, chat, forum, or progress sharing.",
        action: "Open community",
      },
      recipes: {
        chip: "recipes",
        title: "Ideas for your plan",
        body: "I can match recipes to your goal, calories, protein, and preferences.",
        action: "Open recipes",
      },
      water: {
        chip: "water",
        title: "Gentle hydration nudge",
        body: "I can help close the water goal without harsh reminders or overload.",
        action: "Log water",
      },
      admin: {
        chip: "admin",
        title: "Tools explained",
        body: "I can help make operational actions easier to understand.",
        action: "Open tools",
      },
      unknown: {
        chip: "assistant",
        title: "Ready to help",
        body: "I adapt guidance to the current screen, profile, and goal.",
        action: "Open AI",
      },
    },
  },
} as const;

const getAreaCopy = (
  copy: (typeof layerCopy)[keyof typeof layerCopy],
  area: AssistantArea
) => {
  switch (area) {
    case "auth":
      return copy.areas.auth;
    case "onboarding":
      return copy.areas.onboarding;
    case "home":
      return copy.areas.home;
    case "meals":
      return copy.areas.meals;
    case "coach":
      return copy.areas.coach;
    case "progress":
      return copy.areas.progress;
    case "profile":
      return copy.areas.profile;
    case "community":
      return copy.areas.community;
    case "recipes":
      return copy.areas.recipes;
    case "water":
      return copy.areas.water;
    case "admin":
      return copy.areas.admin;
    case "unknown":
    default:
      return copy.areas.unknown;
  }
};

type LayerCopy = (typeof layerCopy)[AppLanguage];

const getLayerCopy = (language: AppLanguage): LayerCopy => {
  switch (language) {
    case "pl":
      return layerCopy.pl;
    case "en":
      return layerCopy.en;
    case "uk":
    default:
      return layerCopy.uk;
  }
};

const isEditableElement = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    element.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    )
  );
};

const useInputFocusState = () => {
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const updateFocusedElement = () => {
      setInputFocused(isEditableElement(document.activeElement));
    };

    updateFocusedElement();
    document.addEventListener("focusin", updateFocusedElement);
    document.addEventListener("focusout", updateFocusedElement);

    return () => {
      document.removeEventListener("focusin", updateFocusedElement);
      document.removeEventListener("focusout", updateFocusedElement);
    };
  }, []);

  return inputFocused;
};

export const GlobalAssistantLayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const todayMeals = useSelector(selectTodayMealItems);
  const water = useSelector((state: RootState) => state.water);
  const weightHistory = useSelector(
    (state: RootState) => state.profile.weightHistory
  );
  const { appLanguage } = useLanguage();
  const copy = getLayerCopy(appLanguage);
  const inputFocused = useInputFocusState();
  const isMobile = useMediaQuery("(max-width: 599.95px)");
  const isTablet = useMediaQuery(
    "(min-width: 600px) and (max-width: 899.95px)"
  );
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const viewport: AssistantViewport = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";
  const todayKey = getLocalDateKey(new Date());
  const emotionSignals = useMemo(
    () => ({
      hasNoMealsToday: todayMeals.length === 0,
      waterBehindTarget:
        water.dailyWaterGoal > 0 && water.consumedMl < water.dailyWaterGoal,
      weightUpdatedToday: weightHistory.some(
        (entry) => getLocalDateKey(entry.date) === todayKey
      ),
      onboardingCompleted: Boolean(assistant.onboarding.completedAt),
      recentError: false,
      recentSuccess: false,
      userInactive: false,
    }),
    [
      assistant.onboarding.completedAt,
      todayKey,
      todayMeals.length,
      water.consumedMl,
      water.dailyWaterGoal,
      weightHistory,
    ]
  );
  const layerModel = useMemo(
    () =>
      resolveGlobalAssistantLayerModel(
        location.pathname,
        {
          viewport,
          inputFocused,
          prefersReducedMotion,
        },
        emotionSignals
      ),
    [
      emotionSignals,
      inputFocused,
      location.pathname,
      prefersReducedMotion,
      viewport,
    ]
  );
  const { area, defaultAction, displayAction, duties, primaryCapability } = layerModel;
  const { presence } = layerModel;
  const isDenseMobileCompanion =
    presence.reason === "compact-dense-surface" &&
    (viewport === "mobile" || viewport === "tablet");
  const visibleCopy = getAreaCopy(copy, area);
  const actionLabel = displayAction?.usesCoachFallback
    ? copy.coachFallbackAction
    : visibleCopy.action || copy.action;
  const isPublicCompanion = !user && area === "auth";
  const companionName = user ? assistant.name : "Smart";
  const companionKind = user ? assistant.companionKind : "dragon";
  const companionSize = isDenseMobileCompanion ? 58 : isMobile ? 64 : 76;

  if (
    (!user && !isPublicCompanion) ||
    !assistant.widgetEnabled ||
    !presence.visible ||
    !displayAction
  ) {
    return null;
  }

  const handleOpenAssistant = () => {
    trackRuntimeEvent("global_assistant_opened", {
      area,
      path: location.pathname,
      capability: primaryCapability?.id ?? "unknown",
      screenName: layerModel.screenName,
      duties: duties.join(","),
      tone: layerModel.tone,
      actionLabel,
      actionRoute: displayAction.route,
      manifestActionLabel: defaultAction?.label ?? "none",
      manifestActionRoute: defaultAction?.route ?? "none",
      presenceMode: presence.mode,
      presenceReason: presence.reason,
      presencePriority: presence.priority,
      emotion: layerModel.emotion.emotion,
      messageIntent: layerModel.emotion.messageIntent,
      emotionPriority: layerModel.emotion.priority,
    });
    navigate(displayAction.route);
  };

  return (
    <AnimatePresence initial={presence.allowMotion}>
      <Box
        key={area}
        component={motion.aside}
        layout={presence.allowMotion}
        variants={assistantSpeechStaggerVariants}
        initial={presence.allowMotion ? "initial" : false}
        animate={presence.allowMotion ? "animate" : false}
        exit={presence.allowMotion ? "exit" : undefined}
        aria-label={copy.eyebrow}
        sx={{
          position: "fixed",
          right: isDenseMobileCompanion ? { xs: "auto", md: 24 } : { xs: 16, md: 24 },
          left: isDenseMobileCompanion ? { xs: 14, md: "auto" } : "auto",
          bottom: {
            xs: isDenseMobileCompanion
              ? "calc(env(safe-area-inset-bottom, 0px) + 84px)"
              : "calc(env(safe-area-inset-bottom, 0px) + 94px)",
            md: 24,
          },
          zIndex: 1190,
          display: "grid",
          gap: 1.2,
          justifyItems: "end",
          pointerEvents: "none",
        }}
      >
        <Paper
          component={motion.div}
          layout={presence.allowMotion}
          variants={assistantSpeechBubbleVariants}
          elevation={8}
          sx={{
            display: presence.allowSpeechBubble
              ? { xs: "none", md: "block" }
              : "none",
            width: 330,
            p: 2,
            borderRadius: 1,
            border: "1px solid var(--sn-border-soft)",
            background:
              "radial-gradient(circle at 96% 0%, var(--sn-accent-soft), transparent 34%), linear-gradient(180deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
            boxShadow: "var(--sn-shadow-strong)",
            backdropFilter: "blur(22px)",
            pointerEvents: "auto",
          }}
        >
          <Stack spacing={1.2}>
            <Stack
              component={motion.div}
              variants={fadeUpVariants}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              useFlexGap
            >
              <Typography
                variant="overline"
                sx={{ color: "#0f766e", fontWeight: 900 }}
              >
                {copy.eyebrow}
              </Typography>
              <Chip
                size="small"
                label={visibleCopy.chip}
                variant="outlined"
                color="success"
              />
            </Stack>

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              sx={{ m: 0, fontWeight: 900 }}
            >
              {visibleCopy.title || copy.fallbackTitle}
            </Typography>

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              color="text.secondary"
              sx={{ m: 0 }}
            >
              {visibleCopy.body || copy.fallbackBody}
            </Typography>

            <Button
              component={motion.button}
              variants={fadeUpVariants}
              type="button"
              onClick={handleOpenAssistant}
              startIcon={<Bot size={18} />}
              variant="contained"
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {actionLabel}
            </Button>
          </Stack>
        </Paper>

        <Box
          component={motion.button}
          type="button"
          layout={presence.allowMotion}
          variants={fadeUpVariants}
          onClick={handleOpenAssistant}
          aria-label={copy.mobileLabel}
          sx={{
            width: companionSize,
            height: companionSize,
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            p: 0,
            background: "transparent",
            pointerEvents: "auto",
          }}
        >
          <AssistantAvatar
            name={companionName}
            variant={companionKind}
            size={companionSize}
            mood={layerModel.emotion.mood}
            active
          />
        </Box>
      </Box>
    </AnimatePresence>
  );
};

export default GlobalAssistantLayer;
