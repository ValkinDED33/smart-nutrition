import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  Droplets,
  HeartPulse,
  MessageCircle,
  ScanLine,
  Utensils,
  Users,
} from "lucide-react";
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
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";
import { useAppColorMode } from "@shared/theme/colorMode";

const OPEN_ASSISTANT_PL = "Otwórz asystenta";
const OPEN_ASSISTANT_EN = "Open assistant";
const RESTING_ASSISTANT_LOOK_OFFSET = { x: 0, y: 0 };
const ASSISTANT_STRONG_TEXT_COLOR = "var(--sn-text-strong)";
const ASSISTANT_MUTED_TEXT_COLOR = "text.secondary";
const ASSISTANT_ACCENT_COLOR = "var(--sn-accent)";
const ASSISTANT_START_ALIGN = "flex-start";
const ASSISTANT_TOOL_BORDER = "1px solid rgba(20, 184, 166, 0.24)";
const ASSISTANT_GLASS_BLUR = "blur(14px)";
const ROUTE_DASHBOARD = "/dashboard";
const ROUTE_MEALS_SCANNER = "/meals?mode=barcode";
const ROUTE_MEALS_PHOTO = "/meals?mode=photo";
const ROUTE_COACH = "/coach";
const ROUTE_WOMEN_HEALTH = "/profile#women-health";
const ROUTE_PROGRESS = "/progress";

const getGlobalAssistantToolIcon = (index: number) => {
  switch (index) {
    case 0:
      return Utensils;
    case 1:
      return Droplets;
    case 2:
      return ScanLine;
    case 3:
      return MessageCircle;
    case 4:
      return HeartPulse;
    case 5:
      return Users;
    case 6:
      return CalendarDays;
    default:
      return Bot;
  }
};

const getGlobalAssistantOrbitIcon = (index: number) => {
  switch (index) {
    case 0:
      return ScanLine;
    case 1:
      return MessageCircle;
    case 2:
      return CalendarDays;
    default:
      return Bot;
  }
};

const getGlobalAssistantOrbitPosition = (index: number) => {
  switch (index) {
    case 0:
      return { left: -26, top: -12 };
    case 1:
      return { right: -24, top: 10 };
    case 2:
      return { left: 4, bottom: -20 };
    default:
      return { right: -18, bottom: -16 };
  }
};

const clampAssistantLookOffset = (value: number) =>
  Math.max(Math.min(value, 1), -1);

const useAssistantPointerLookOffset = ({
  enabled,
}: {
  enabled: boolean;
}) => {
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    let animationFrame = 0;

    const updateLookOffset = (event: PointerEvent) => {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        setLookOffset({
          x: clampAssistantLookOffset((event.clientX / window.innerWidth - 0.5) * 2),
          y: clampAssistantLookOffset((event.clientY / window.innerHeight - 0.5) * 2),
        });
      });
    };

    window.addEventListener("pointermove", updateLookOffset, { passive: true });

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", updateLookOffset);
    };
  }, [enabled]);

  return enabled ? lookOffset : RESTING_ASSISTANT_LOOK_OFFSET;
};

const layerCopy = {
  uk: {
    eyebrow: "Асистент поруч",
    fallbackTitle: "Готовий допомогти",
    fallbackBody:
      "Я підлаштовую підказки під поточний екран, профіль і вашу ціль.",
    action: "Відкрити AI",
    coachFallbackAction: "Запитати асистента",
    mobileLabel: "Відкрити асистента",
    workerLabel: "AI-працівник",
    toolbeltLabel: "Що я тримаю поруч",
    toolbelt: ["Їжа", "Вода", "Фото", "Telegram", "Здоров'я", "Сім'я", "Задачі"],
    commandDockLabel: "Швидкі інструменти",
    commandDock: [
      { label: "План дня", detail: "їжа, вода, ліки", route: ROUTE_DASHBOARD },
      { label: "Сканер", detail: "продукт або штрихкод", route: ROUTE_MEALS_SCANNER },
      { label: "Фото", detail: "їжа, тиск, рецепт", route: ROUTE_MEALS_PHOTO },
      { label: "Нагадати", detail: "подія або таблетка", route: ROUTE_COACH },
      { label: "Сім'я", detail: "вагітність і партнер", route: ROUTE_WOMEN_HEALTH },
      { label: "Прогрес", detail: "графіки й аналіз", route: ROUTE_PROGRESS },
    ],
    orbitLabels: ["аналіз", "синхронізація", "план"],
    workerActivityLabel: "Зараз працюю",
    workerActivities: [
      {
        action: "Перевіряю контекст дня",
        detail: "Їжа, вода, профіль і нагадування в одному маршруті.",
      },
      {
        action: "Готую наступний крок",
        detail: "Не вигадую висновки, чекаю підтверджені дані.",
      },
      {
        action: "Тримаю Telegram поруч",
        detail: "Нагадування і задачі мають збігатися з профілем.",
      },
    ],
    livingMessages: {
      recent_success: {
        title: "Дія збережена",
        body: "Я бачу підтвердження і можу підказати наступний крок без зайвого шуму.",
      },
      recent_error: {
        title: "Потрібно повторити",
        body: "Збереження не підтвердилось. Я допоможу повернутись до дії без втрати контексту.",
      },
      first_meal: {
        title: "Почнемо історію дня",
        body: "Поки їжі немає, я не вигадую висновки. Один реальний запис зробить підказки точнішими.",
      },
      water: {
        title: "Вода зараз змінить темп",
        body: "Невелика дія допоможе прогресу, нагадуванням і наступним підказкам звучати точніше.",
      },
      weight: {
        title: "Вага оновлена",
        body: "Я врахую сьогоднішній запис у прогресі й підказках без жорстких висновків.",
      },
      profile: {
        title: "Профіль ще можна уточнити",
        body: "Кілька деталей допоможуть зробити підтримку спокійнішою і персональнішою.",
      },
      idle: null,
    },
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
        title: "Головне на день",
        body: "Підкажу, що важливіше саме зараз: їжа, вода, прогрес або підтримка.",
        action: "Відкрити помічника",
      },
      meals: {
        chip: "харчування",
        title: "Підказка по їжі",
        body: "Допоможу швидше додати прийом їжі і зрозуміти, що варто поправити.",
        action: "Перевірити день",
      },
      coach: {
        chip: "помічник",
        title: "Готовий до діалогу",
        body: "Можу пояснити план, помітити ризики і запропонувати наступний крок.",
        action: "Відкрити помічника",
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
    mobileLabel: OPEN_ASSISTANT_PL,
    workerLabel: "Pracownik AI",
    toolbeltLabel: "Co mam pod ręką",
    toolbelt: ["Jedzenie", "Woda", "Zdjęcia", "Telegram", "Zdrowie", "Rodzina", "Zadania"],
    commandDockLabel: "Szybkie narzędzia",
    commandDock: [
      { label: "Plan dnia", detail: "jedzenie, woda, leki", route: ROUTE_DASHBOARD },
      { label: "Skaner", detail: "produkt lub kod", route: ROUTE_MEALS_SCANNER },
      { label: "Zdjęcie", detail: "posiłek, ciśnienie, recepta", route: ROUTE_MEALS_PHOTO },
      { label: "Przypomnij", detail: "wydarzenie albo tabletka", route: ROUTE_COACH },
      { label: "Rodzina", detail: "ciąża i partner", route: ROUTE_WOMEN_HEALTH },
      { label: "Postęp", detail: "wykresy i analiza", route: ROUTE_PROGRESS },
    ],
    orbitLabels: ["analiza", "synchronizacja", "plan"],
    workerActivityLabel: "Teraz pracuję",
    workerActivities: [
      {
        action: "Sprawdzam kontekst dnia",
        detail: "Jedzenie, woda, profil i przypomnienia w jednej trasie.",
      },
      {
        action: "Przygotowuję kolejny krok",
        detail: "Nie udaję wniosków, czekam na potwierdzone dane.",
      },
      {
        action: "Trzymam Telegram blisko",
        detail: "Przypomnienia i zadania mają pasować do profilu.",
      },
    ],
    livingMessages: {
      recent_success: {
        title: "Działanie zapisane",
        body: "Widzę potwierdzenie i mogę podpowiedzieć kolejny krok bez zbędnego hałasu.",
      },
      recent_error: {
        title: "Trzeba spróbować ponownie",
        body: "Zapis nie został potwierdzony. Pomogę wrócić do działania bez utraty kontekstu.",
      },
      first_meal: {
        title: "Zacznijmy historię dnia",
        body: "Bez jedzenia nie udaję wniosków. Jeden realny wpis sprawi, że wskazówki będą dokładniejsze.",
      },
      water: {
        title: "Woda zmieni teraz tempo",
        body: "Mały ruch pomoże progresowi, przypomnieniom i kolejnym wskazówkom brzmieć trafniej.",
      },
      weight: {
        title: "Waga zaktualizowana",
        body: "Uwzględnię dzisiejszy wpis w postępie i wskazówkach bez ostrych ocen.",
      },
      profile: {
        title: "Profil można jeszcze doprecyzować",
        body: "Kilka szczegółów pomoże stworzyć spokojniejsze i bardziej osobiste wsparcie.",
      },
      idle: null,
    },
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
        title: "Kierunek dnia",
        body: "Podpowiem, co jest teraz ważniejsze: jedzenie, woda, postęp albo wsparcie.",
        action: OPEN_ASSISTANT_PL,
      },
      meals: {
        chip: "jedzenie",
        title: "Podpowiedź do posiłków",
        body: "Pomogę szybciej dodać jedzenie i zrozumieć, co warto poprawić.",
        action: "Sprawdź dzień",
      },
      coach: {
        chip: "asystent",
        title: "Gotowy do rozmowy",
        body: "Mogę wyjaśnić plan, zauważyć ryzyka i zaproponować kolejny krok.",
        action: OPEN_ASSISTANT_PL,
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
    mobileLabel: OPEN_ASSISTANT_EN,
    workerLabel: "AI worker",
    toolbeltLabel: "What I keep nearby",
    toolbelt: ["Food", "Water", "Photos", "Telegram", "Health", "Family", "Tasks"],
    commandDockLabel: "Quick tools",
    commandDock: [
      { label: "Day plan", detail: "food, water, meds", route: ROUTE_DASHBOARD },
      { label: "Scanner", detail: "product or barcode", route: ROUTE_MEALS_SCANNER },
      { label: "Photo", detail: "meal, pressure, recipe", route: ROUTE_MEALS_PHOTO },
      { label: "Remind me", detail: "event or tablet", route: ROUTE_COACH },
      { label: "Family", detail: "pregnancy and partner", route: ROUTE_WOMEN_HEALTH },
      { label: "Progress", detail: "charts and analysis", route: ROUTE_PROGRESS },
    ],
    orbitLabels: ["analysis", "sync", "plan"],
    workerActivityLabel: "Working now",
    workerActivities: [
      {
        action: "Reading today’s context",
        detail: "Food, water, profile, and reminders stay on one route.",
      },
      {
        action: "Preparing the next step",
        detail: "I do not invent insight; I wait for confirmed data.",
      },
      {
        action: "Keeping Telegram nearby",
        detail: "Reminders and tasks should match the profile.",
      },
    ],
    livingMessages: {
      recent_success: {
        title: "Action saved",
        body: "I see the confirmation and can suggest the next step without extra noise.",
      },
      recent_error: {
        title: "Needs a retry",
        body: "The save was not confirmed. I can help return to the action without losing context.",
      },
      first_meal: {
        title: "Start the day story",
        body: "With no food logged, I will not invent insight. One real entry makes guidance sharper.",
      },
      water: {
        title: "Water can shift the pace",
        body: "A small action helps progress, reminders, and the next nudges become more precise.",
      },
      weight: {
        title: "Weight updated",
        body: "I will use today's entry in progress and guidance without harsh conclusions.",
      },
      profile: {
        title: "Profile can still sharpen",
        body: "A few details help make support calmer and more personal.",
      },
      idle: null,
    },
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
        title: "Today’s direction",
        body: "I can help decide what matters now: food, water, progress, or support.",
        action: OPEN_ASSISTANT_EN,
      },
      meals: {
        chip: "food",
        title: "Meal guidance",
        body: "I can help add food faster and explain what is worth adjusting.",
        action: "Review day",
      },
      coach: {
        chip: "assistant",
        title: "Ready to talk",
        body: "I can explain the plan, spot risks, and suggest the next step.",
        action: OPEN_ASSISTANT_EN,
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
  const syncStatus = useSelector((state: RootState) => state.auth.syncStatus);
  const syncToast = useSelector((state: RootState) => state.auth.syncToast);
  const syncOutboxPendingChanges = useSelector(
    (state: RootState) => state.auth.syncOutbox.pendingChanges
  );
  const todayMeals = useSelector(selectTodayMealItems);
  const water = useSelector((state: RootState) => state.water);
  const weightHistory = useSelector(
    (state: RootState) => state.profile.weightHistory
  );
  const { appLanguage } = useLanguage();
  const { isDarkMode } = useAppColorMode();
  const copy = getLayerCopy(appLanguage);
  const [workerActivityIndex, setWorkerActivityIndex] = useState(0);
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
      recentError: syncStatus === "error" || syncOutboxPendingChanges > 0,
      recentSuccess: syncToast?.kind === "retry-success",
      userInactive: false,
    }),
    [
      assistant.onboarding.completedAt,
      syncOutboxPendingChanges,
      syncStatus,
      syncToast?.kind,
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
  const livingMessage = copy.livingMessages[layerModel.noticeKey];
  const actionLabel = displayAction?.usesCoachFallback
    ? copy.coachFallbackAction
    : visibleCopy.action || copy.action;
  const isPublicCompanion = !user && area === "auth";
  const companionName = user
    ? getAssistantDisplayName(assistant.name, appLanguage)
    : "Smart";
  const companionKind = user ? assistant.companionKind : "robot";
  const companionSize = isDenseMobileCompanion ? 58 : isMobile ? 64 : 76;
  const assistantPanelBackground = isDarkMode
    ? "radial-gradient(circle at 96% 0%, rgba(34, 211, 238, 0.16), transparent 34%), linear-gradient(180deg, rgba(8, 13, 26, 0.94), rgba(2, 6, 23, 0.86))"
    : "radial-gradient(circle at 96% 0%, var(--sn-accent-soft), transparent 34%), linear-gradient(180deg, var(--sn-surface-elevated), var(--sn-surface-glass))";
  const assistantChipBackground = isDarkMode
    ? "rgba(15, 23, 42, 0.74)"
    : "rgba(255, 255, 255, 0.82)";
  const assistantOrbitBackground = isDarkMode
    ? "linear-gradient(135deg, rgba(8,13,26,0.92), rgba(15,23,42,0.76))"
    : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,253,245,0.78))";
  const assistantLookOffset = useAssistantPointerLookOffset({
    enabled: presence.allowMotion && !inputFocused && !prefersReducedMotion,
  });
  const firstWorkerActivity = copy.workerActivities[0];
  const workerActivity =
    copy.workerActivities[workerActivityIndex % copy.workerActivities.length] ||
    firstWorkerActivity;

  useEffect(() => {
    if (!presence.allowMotion || inputFocused || prefersReducedMotion) {
      return undefined;
    }

    const activityTimer = window.setInterval(() => {
      setWorkerActivityIndex((current) => current + 1);
    }, 6200);

    return () => window.clearInterval(activityTimer);
  }, [inputFocused, presence.allowMotion, prefersReducedMotion]);

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

  const handleOpenCommand = (command: LayerCopy["commandDock"][number]) => {
    trackRuntimeEvent("global_assistant_command_opened", {
      area,
      path: location.pathname,
      commandLabel: command.label,
      commandRoute: command.route,
      screenName: layerModel.screenName,
      presenceMode: presence.mode,
    });
    navigate(command.route);
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
            background: assistantPanelBackground,
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
            <Chip
              component={motion.div}
              variants={fadeUpVariants}
              size="small"
              icon={<Bot size={13} />}
              label={copy.workerLabel}
              data-global-assistant-worker-chip="true"
              sx={{
                alignSelf: ASSISTANT_START_ALIGN,
                borderRadius: 999,
                border: ASSISTANT_TOOL_BORDER,
                background:
                  "linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(132, 204, 22, 0.12))",
                color: ASSISTANT_STRONG_TEXT_COLOR,
                fontWeight: 900,
              }}
            />

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              sx={{ m: 0, fontWeight: 900 }}
            >
              {livingMessage?.title || visibleCopy.title || copy.fallbackTitle}
            </Typography>

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              color={ASSISTANT_MUTED_TEXT_COLOR}
              sx={{ m: 0 }}
            >
              {livingMessage?.body || visibleCopy.body || copy.fallbackBody}
            </Typography>
            <Stack
              component={motion.div}
              variants={fadeUpVariants}
              spacing={0.75}
              data-global-assistant-toolbelt="true"
            >
              <Typography
                variant="caption"
                sx={{
                  color: ASSISTANT_MUTED_TEXT_COLOR,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                {copy.toolbeltLabel}
              </Typography>
              <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                {copy.toolbelt.map((tool, index) => {
                  const ToolIcon = getGlobalAssistantToolIcon(index);

                  return (
                    <Chip
                      key={tool}
                      size="small"
                      icon={<ToolIcon size={13} />}
                      label={tool}
                      sx={{
                        height: 26,
                        borderRadius: 999,
                        border: "1px solid rgba(20, 184, 166, 0.2)",
                        background: assistantChipBackground,
                        color: ASSISTANT_STRONG_TEXT_COLOR,
                        fontWeight: 800,
                        "& .MuiChip-icon": {
                          color: ASSISTANT_ACCENT_COLOR,
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Stack>
            <Stack
              component={motion.div}
              variants={fadeUpVariants}
              spacing={0.75}
              data-global-assistant-command-dock="true"
            >
              <Typography
                variant="caption"
                sx={{
                  color: ASSISTANT_MUTED_TEXT_COLOR,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                {copy.commandDockLabel}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 0.7,
                }}
              >
                {copy.commandDock.map((command, index) => {
                  const CommandIcon = getGlobalAssistantToolIcon(index);

                  return (
                    <Button
                      key={`${command.route}-${command.label}`}
                      type="button"
                      size="small"
                      onClick={() => handleOpenCommand(command)}
                      startIcon={<CommandIcon size={14} />}
                      data-global-assistant-command={command.route}
                      sx={{
                        minHeight: 46,
                        justifyContent: ASSISTANT_START_ALIGN,
                        alignItems: "center",
                        gap: 0.4,
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        border: "1px solid rgba(20, 184, 166, 0.18)",
                        background:
                          "linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(14, 165, 233, 0.08))",
                        color: ASSISTANT_STRONG_TEXT_COLOR,
                        textAlign: "left",
                        textTransform: "none",
                        overflow: "hidden",
                        transition:
                          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                        "&:hover": {
                          borderColor: "rgba(94, 234, 212, 0.48)",
                          boxShadow: "0 14px 28px rgba(15, 118, 110, 0.14)",
                          transform: "translateY(-1px)",
                        },
                        "&:focus-visible": {
                          outline: "3px solid rgba(20, 184, 166, 0.28)",
                          outlineOffset: 2,
                        },
                        "& .MuiButton-startIcon": {
                          m: 0,
                          color: ASSISTANT_ACCENT_COLOR,
                        },
                      }}
                    >
                      <Stack spacing={0.1} minWidth={0}>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 12,
                            fontWeight: 950,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {command.label}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            color: ASSISTANT_MUTED_TEXT_COLOR,
                            fontSize: 10.5,
                            fontWeight: 750,
                            lineHeight: 1.1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {command.detail}
                        </Typography>
                      </Stack>
                    </Button>
                  );
                })}
              </Box>
            </Stack>
            <Paper
              component={motion.div}
              variants={fadeUpVariants}
              elevation={0}
              data-global-assistant-working-state="true"
              sx={{
                p: 1.15,
                borderRadius: 1,
                border: "1px solid rgba(20, 184, 166, 0.18)",
                background:
                  "linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(14, 165, 233, 0.08))",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#0f766e", fontWeight: 900, letterSpacing: 0 }}
              >
                {copy.workerActivityLabel}
              </Typography>
              <Typography sx={{ mt: 0.25, fontWeight: 900, fontSize: 14 }}>
                {workerActivity.action}
              </Typography>
              <Typography
                color={ASSISTANT_MUTED_TEXT_COLOR}
                sx={{ mt: 0.2, fontSize: 13, lineHeight: 1.35 }}
              >
                {workerActivity.detail}
              </Typography>
            </Paper>

            <Button
              component={motion.button}
              variants={fadeUpVariants}
              type="button"
              onClick={handleOpenAssistant}
              startIcon={<Bot size={18} />}
              variant="contained"
              sx={{
                alignSelf: ASSISTANT_START_ALIGN,
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
          component={motion.div}
          layout={presence.allowMotion}
          variants={fadeUpVariants}
          animate={
            presence.allowMotion && !inputFocused && !prefersReducedMotion
              ? {
                  x: isMobile ? [0, 4, 0, -3, 0] : [0, -10, 0, 8, 0],
                  y: [0, -7, 0, 5, 0],
                }
              : undefined
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          data-global-ai-worker-roaming="true"
          sx={{ position: "relative", pointerEvents: "auto" }}
        >
          <Box
            component={motion.div}
            aria-hidden="true"
            data-global-ai-worker-activity-pill="true"
            animate={
              presence.allowMotion && !prefersReducedMotion
                ? { opacity: [0.82, 1, 0.82], y: [0, -2, 0] }
                : undefined
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            sx={{
              position: "absolute",
              right: companionSize - 8,
              top: -3,
              maxWidth: { xs: 126, md: 156 },
              px: 1,
              py: 0.45,
              borderRadius: 999,
              border: "1px solid rgba(20, 184, 166, 0.22)",
              background: assistantChipBackground,
              color: ASSISTANT_STRONG_TEXT_COLOR,
              boxShadow: "var(--sn-shadow-soft)",
              backdropFilter: ASSISTANT_GLASS_BLUR,
              fontSize: 11,
              fontWeight: 900,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: presence.allowSpeechBubble ? "none" : "block",
              pointerEvents: "none",
            }}
          >
            {workerActivity.action}
          </Box>
          <Box
            aria-hidden="true"
            data-global-ai-worker-orbit="true"
            sx={{
              position: "absolute",
              inset: -22,
              borderRadius: "50%",
              pointerEvents: "none",
              display:
                presence.allowMotion && !inputFocused && !prefersReducedMotion
                  ? { xs: isDenseMobileCompanion ? "none" : "block", md: "block" }
                  : "none",
            }}
          >
            {copy.orbitLabels.map((label, index) => {
              const OrbitIcon = getGlobalAssistantOrbitIcon(index);
              const orbitPosition = getGlobalAssistantOrbitPosition(index);

              return (
                <Box
                  key={label}
                  component={motion.div}
                  data-global-ai-worker-task-node="true"
                  animate={{
                    opacity: [0.62, 1, 0.62],
                    scale: [0.92, 1.04, 0.92],
                    y: [0, index === 1 ? 3 : -3, 0],
                  }}
                  transition={{
                    duration: 3.8 + index * 0.45,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.35,
                  }}
                  sx={{
                    position: "absolute",
                    ...orbitPosition,
                    minWidth: 34,
                    minHeight: 30,
                    px: 0.75,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.35,
                    border: ASSISTANT_TOOL_BORDER,
                    background: assistantOrbitBackground,
                    color: ASSISTANT_STRONG_TEXT_COLOR,
                    boxShadow: "0 12px 26px rgba(15, 118, 110, 0.14)",
                    backdropFilter: ASSISTANT_GLASS_BLUR,
                    fontSize: 10,
                    fontWeight: 950,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <OrbitIcon size={12} />
                  <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                    {label}
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box
            component={motion.button}
            type="button"
            layout={presence.allowMotion}
            onClick={handleOpenAssistant}
            aria-label={copy.mobileLabel}
            data-global-ai-worker-button="true"
            sx={{
              width: companionSize,
              height: companionSize,
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              p: 0,
              background: "transparent",
              pointerEvents: "auto",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: -7,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(20, 184, 166, 0.24), rgba(132, 204, 22, 0.1) 45%, transparent 72%)",
                opacity: presence.allowMotion ? 1 : 0.56,
                transform: "scale(0.92)",
                animation: presence.allowMotion
                  ? "snGlobalAssistantBreath 3.2s ease-in-out infinite"
                  : "none",
              },
              "@keyframes snGlobalAssistantBreath": {
                "0%, 100%": {
                  opacity: 0.68,
                  transform: "scale(0.9)",
                },
                "50%": {
                  opacity: 1,
                  transform: "scale(1.08)",
                },
              },
            }}
          >
            <AssistantAvatar
              name={companionName}
              variant={companionKind}
              size={companionSize}
              mood={layerModel.emotion.mood}
              lookOffset={assistantLookOffset}
              active
            />
          </Box>
          <Stack
            data-global-ai-worker-mini-console="true"
            direction="row"
            spacing={0.45}
            sx={{
              position: "absolute",
              left: "50%",
              bottom: -16,
              transform: "translateX(-50%)",
              px: 0.7,
              py: 0.35,
              borderRadius: 999,
              border: ASSISTANT_TOOL_BORDER,
              background: assistantChipBackground,
              boxShadow: "0 12px 30px rgba(15, 118, 110, 0.16)",
              backdropFilter: ASSISTANT_GLASS_BLUR,
              display:
                presence.allowMotion && !inputFocused
                  ? { xs: "none", md: "flex" }
                  : "none",
              pointerEvents: "none",
            }}
          >
            {copy.toolbelt.slice(0, 4).map((tool, index) => {
              const ToolIcon = getGlobalAssistantToolIcon(index);

              return (
                <Box
                  key={tool}
                  component={motion.span}
                  aria-hidden="true"
                  animate={
                    presence.allowMotion && !prefersReducedMotion
                      ? { y: [0, -2, 0], opacity: [0.74, 1, 0.74] }
                      : undefined
                  }
                  transition={{
                    duration: 2.8 + index * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.18,
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    color: ASSISTANT_ACCENT_COLOR,
                    background: isDarkMode
                      ? "rgba(34, 211, 238, 0.1)"
                      : "rgba(20, 184, 166, 0.1)",
                  }}
                >
                  <ToolIcon size={12} />
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </AnimatePresence>
  );
};

export default GlobalAssistantLayer;
