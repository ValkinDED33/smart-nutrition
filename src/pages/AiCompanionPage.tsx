import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Activity,
  Apple,
  CalendarDays,
  Droplets,
  HeartPulse,
  MessageCircle,
  ScanLine,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RootState } from "../app/store";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { selectDailyMacroTargets } from "../features/profile/selectors";
import { getAssistantRuntimeStatus } from "@shared/api/assistant";
import {
  Companion3DLoadingFallback,
  CompanionAvatar as AssistantAvatar,
  CompanionRenderModeControl,
} from "@features/assistant-3d";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionTabs,
} from "@shared/ui";
import type { AssistantRuntimeStatus } from "@domain/assistant/types";
import { getDaysSince } from "@domain/profile/bodyMetrics";
import { canAccessAdminCenter } from "@domain/user/roles";
import {
  buildAssistantCoreSnapshot,
  type AssistantCoreEmotion,
  type AssistantCoreState,
  type AssistantRelationshipLevel,
} from "../core/assistant";
import { useCompanionRenderModePreference } from "../features/profile/useCompanionRenderModePreference";
import type { AppLanguage } from "@shared/types/i18n";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

const AssistantRuntimeCard = lazy(() =>
  import("../features/assistant/AssistantRuntimeCard").then((module) => ({
    default: module.AssistantRuntimeCard,
  }))
);
const NutritionCoachCard = lazy(() => import("../features/meal/NutritionCoachCard"));
const SmartRecommendations = lazy(() =>
  import("../features/meal/SmartRecommendations").then((module) => ({
    default: module.SmartRecommendations,
  }))
);
const CompanionProgressCard = lazy(() => import("../features/companion/CompanionProgressCard"));
const CompanionShopCard = lazy(() => import("../features/profile/CompanionShopCard"));

const AI_WORKER_EYEBROW = "Smart Nutrition AI worker";

const aiCopy = {
  uk: {
    title: "Помічник",
    subtitle:
      "Особистий помічник для харчування, мотивації і щоденного ритму. Він тримає контекст, пам'ятає стиль підтримки і веде до наступної дії.",
    readinessTitle: "Готовність помічника",
    readinessSubtitle:
      "Помічник підключений до вашого дня і готовий допомагати з їжею, водою, нагадуваннями та прогресом.",
    operationsTitle: "Операційний стан AI",
    operationsSubtitle:
      "Діагностика для команди: активні провайдери і резервний маршрут асистента.",
    providerChain: "Провайдери AI",
    assistantReady: "Помічник готовий",
    assistantBackupReady: "Резерв підтримки готовий",
    assistantBackupUnavailable: "Працює основний маршрут",
    configured: "Хмарний AI готовий",
    fallbackOn: "Резерв увімкнено",
    fallbackOff: "Без резерву",
    cloudUnavailable:
      "Помічник тимчасово працює в обмеженому режимі. Ви можете користуватися підказками дня, а живий діалог відновиться автоматично.",
    assistantSettings: "Поведінка помічника береться з налаштувань профілю.",
    defaultAssistantName: "Помічник Smart Nutrition",
    renderModeTitle: "Як помічник з'являється",
    renderMode2d: "Спокійно",
    renderMode3d: "Ефектно",
    renderModeHint:
      "Ефектний вигляд вмикається тільки за вашим вибором. На телефонах і слабших пристроях помічник автоматично лишається легким, щоб сторінка не лагала.",
    renderModeLoading: "Готую ефектний вигляд",
    renderModeError: "Показую легкий вигляд, щоб сторінка не зависла",
    greeting: (name: string) => `Привіт, ${name}. Я вже дивлюся на ваш день.`,
    coreTitle: "Ядро помічника",
    coreSubtitle: "Це не окрема карточка з AI, а поточний стан особистого помічника.",
    memoryGoals: "Цілі",
    memoryStruggles: "Що враховувати",
    memoryTriggers: "Як підтримувати",
    emptyMemory: "Після onboarding тут з'явиться більше особистого контексту.",
    relationshipLabels: {
      new_companion: "Перший день разом",
      warming_up: "Знайомимось",
      trusted_companion: "Є довіра",
      deep_context: "Глибокий контекст",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Потрібен перший запис",
      hydration_attention: "Фокус на воді",
      protein_attention: "Фокус на білку",
      over_target: "День вище плану",
      weekly_check_in: "Перевіримо прогрес",
      steady_day: "День стабільний",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Спокійно",
      encouraging: "Підтримую",
      focused: "Зібрано",
      concerned: "Підтримка без тиску",
      celebrating: "Прогрес",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "Що зробити зараз",
    actionButton: "Відкрити",
    commandEyebrow: AI_WORKER_EYEBROW,
    commandTitle: "Я працюю з твоїм днем",
    commandSubtitle:
      "Їжа, вода, ліки, тиск, сім'я, Telegram і прогрес сходяться в одну робочу зміну помічника.",
    dailyProgress: "Прогрес дня",
    todayRoute: "Маршрут сьогодні",
    assistantToolsTitle: "Інструменти помічника",
    assistantToolsSubtitle:
      "Це не скіни заради картинки. Це один працівник, який діє через реальні розділи Smart Nutrition.",
    workerShiftTitle: "Жива зміна помічника",
    workerShiftSubtitle:
      "Помічник не просто стоїть на екрані. Він читає контекст, готує наступну дію і тримає поруч реальні інструменти.",
    workerNow: {
      context: "Читаю день",
      route: "Готую маршрут",
      sync: "Тримаю зв'язок",
    },
    workerSyncReady: "Cloud і Telegram готові",
    workerSyncLimited: "Cloud тимчасово обмежений",
    workerToolbeltTitle: "Робочий пояс",
    caloriesMetric: "Калорії",
    proteinMetric: "Білок",
    waterMetric: "Вода",
    mealMetric: "Їжа",
    routeLabels: {
      food: "Почати історію дня з першого прийому їжі",
      water: "Повернути темп води без тиску",
      progress: "Порахувати прогрес по всіх шкалах",
      steady: "Тримати день спокійним і передбачуваним",
    },
    toolLabels: {
      plan: {
        title: "План",
        body: "Розклад, денний маршрут і наступна дія.",
      },
      food: {
        title: "Їжа",
        body: "Фото, сканер, продукти, рецепти і БЖВ.",
      },
      water: {
        title: "Вода",
        body: "Склянки, темп, м'які нагадування.",
      },
      health: {
        title: "Здоров'я",
        body: "Тиск, пульс, симптоми і безпечні висновки.",
      },
      family: {
        title: "Сім'я",
        body: "Вагітність, партнер, дитина і спільні цілі.",
      },
      telegram: {
        title: "Telegram",
        body: "Той самий помічник приймає текст, фото і задачі.",
      },
    },
    noMealTitle: "Додайте перший прийом їжі",
    noMealBody:
      "Почніть з одного продукту або швидкої порції, щоб AI мав реальний контекст дня.",
    waterTitle: (value: number) => `Вода: залишилося ${value} мл`,
    waterBody:
      "Закрийте норму маленькими порціями. Один клік по стакану оновить прогрес.",
    caloriesLowTitle: "Калорій ще мало",
    caloriesLowBody:
      "Додайте простий прийом їжі, щоб не зривати день ввечері.",
    caloriesHighTitle: "Калорії вище плану",
    caloriesHighBody:
      "Подивіться щоденник і зробіть решту дня легшою без різких рішень.",
    profileTitle: "Задайте ціль ваги",
    profileBody:
      "Ціль відкриє шкалу прогресу, точнішу норму води і кращі AI-поради.",
    primary: "Основний",
    backup: "Резерв",
    sections: {
      companion: "Помічник",
      progress: "Прогрес",
      memory: "Пам'ять",
      settings: "Налаштування",
    },
    sectionsAriaLabel: "Розділи помічника",
  },
  pl: {
    title: "Asystent",
    subtitle:
      "Osobisty asystent do jedzenia, motywacji i codziennego rytmu. Trzyma kontekst, pamięta styl wsparcia i prowadzi do kolejnej akcji.",
    readinessTitle: "Gotowość asystenta",
    readinessSubtitle:
      "Asystent jest połączony z Twoim dniem i gotowy pomagać w jedzeniu, wodzie, przypomnieniach oraz progresie.",
    operationsTitle: "Operacyjny status AI",
    operationsSubtitle:
      "Diagnostyka dla zespołu: aktywni dostawcy AI i ścieżka zapasowa asystenta.",
    providerChain: "Dostawcy AI",
    assistantReady: "Asystent gotowy",
    assistantBackupReady: "Rezerwa wsparcia gotowa",
    assistantBackupUnavailable: "Działa główna trasa",
    configured: "Chmurowy AI gotowy",
    fallbackOn: "Rezerwa aktywna",
    fallbackOff: "Bez rezerwy",
    cloudUnavailable:
      "Asystent tymczasowo działa w ograniczonym trybie. Wskazówki dnia zostają dostępne, a żywy dialog wróci automatycznie.",
    assistantSettings: "Zachowanie asystenta bierze się z ustawień profilu.",
    defaultAssistantName: "Asystent Smart Nutrition",
    renderModeTitle: "Jak asystent się pojawia",
    renderMode2d: "Spokojnie",
    renderMode3d: "Efektownie",
    renderModeHint:
      "Efektowny wygląd włącza się tylko po Twoim wyborze. Na telefonach i słabszych urządzeniach asystent automatycznie zostaje lekki, żeby strona nie lagowała.",
    renderModeLoading: "Przygotowuję efektowny wygląd",
    renderModeError: "Pokazuję lżejszy wygląd, żeby strona działała płynnie",
    greeting: (name: string) => `Cześć, ${name}. Już patrzę na Twój dzień.`,
    coreTitle: "Rdzeń asystenta",
    coreSubtitle: "To nie osobna karta z AI, tylko bieżący stan osobistego asystenta.",
    memoryGoals: "Cele",
    memoryStruggles: "Co brać pod uwagę",
    memoryTriggers: "Jak wspierać",
    emptyMemory: "Po onboardingu pojawi się tu więcej osobistego kontekstu.",
    relationshipLabels: {
      new_companion: "Pierwszy dzień razem",
      warming_up: "Poznajemy się",
      trusted_companion: "Jest zaufanie",
      deep_context: "Głęboki kontekst",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Potrzebny pierwszy wpis",
      hydration_attention: "Uwaga na wodę",
      protein_attention: "Uwaga na białko",
      over_target: "Dzień ponad plan",
      weekly_check_in: "Sprawdźmy progres",
      steady_day: "Dzień stabilny",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Spokojnie",
      encouraging: "Wspieram",
      focused: "Skupienie",
      concerned: "Łagodna kontrola",
      celebrating: "Progres",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "Co zrobić teraz",
    actionButton: "Otwórz",
    commandEyebrow: AI_WORKER_EYEBROW,
    commandTitle: "Pracuję z Twoim dniem",
    commandSubtitle:
      "Jedzenie, woda, leki, ciśnienie, rodzina, Telegram i progres łączą się w jedną zmianę asystenta.",
    dailyProgress: "Progres dnia",
    todayRoute: "Plan na dziś",
    assistantToolsTitle: "Narzędzia asystenta",
    assistantToolsSubtitle:
      "To nie skiny dla obrazka. To jeden pracownik, który działa przez realne sekcje Smart Nutrition.",
    workerShiftTitle: "Żywa zmiana asystenta",
    workerShiftSubtitle:
      "Asystent nie stoi tylko na ekranie. Czyta kontekst, przygotowuje kolejny krok i trzyma pod ręką realne narzędzia.",
    workerNow: {
      context: "Czytam dzień",
      route: "Układam trasę",
      sync: "Trzymam łączność",
    },
    workerSyncReady: "Cloud i Telegram gotowe",
    workerSyncLimited: "Cloud czasowo ograniczony",
    workerToolbeltTitle: "Pas narzędzi",
    caloriesMetric: "Kalorie",
    proteinMetric: "Białko",
    waterMetric: "Woda",
    mealMetric: "Jedzenie",
    routeLabels: {
      food: "Zacząć historię dnia od pierwszego posiłku",
      water: "Przywrócić tempo wody bez presji",
      progress: "Policzyć progres po wszystkich skalach",
      steady: "Utrzymać spokojny i przewidywalny dzień",
    },
    toolLabels: {
      plan: {
        title: "Plan",
        body: "Rozkład, dzienny rytm i kolejna akcja.",
      },
      food: {
        title: "Jedzenie",
        body: "Zdjęcie, skaner, produkty, przepisy i makro.",
      },
      water: {
        title: "Woda",
        body: "Szklanki, tempo i łagodne przypomnienia.",
      },
      health: {
        title: "Zdrowie",
        body: "Ciśnienie, puls, symptomy i bezpieczne wnioski.",
      },
      family: {
        title: "Rodzina",
        body: "Ciąża, partner, dziecko i wspólne cele.",
      },
      telegram: {
        title: "Telegram",
        body: "Ten sam asystent przyjmuje tekst, zdjęcia i zadania.",
      },
    },
    noMealTitle: "Dodaj pierwszy posiłek",
    noMealBody:
      "Zacznij od jednego produktu albo szybkiej porcji, żeby AI miało realny kontekst dnia.",
    waterTitle: (value: number) => `Woda: zostało ${value} ml`,
    waterBody:
      "Domknij normę małymi porcjami. Jedno kliknięcie w szklankę aktualizuje progres.",
    caloriesLowTitle: "Kalorii jest jeszcze mało",
    caloriesLowBody:
      "Dodaj prosty posiłek, żeby wieczorem nie nadrabiać chaotycznie.",
    caloriesHighTitle: "Kalorie są ponad plan",
    caloriesHighBody:
      "Sprawdź dziennik i ustaw resztę dnia lżej, bez ostrych skrętów.",
    profileTitle: "Ustaw cel wagi",
    profileBody:
      "Cel odblokuje skalę progresu, dokładniejszą normę wody i lepsze rady AI.",
    primary: "Główny",
    backup: "Zapasowy",
    sections: {
      companion: "Asystent",
      progress: "Progres",
      memory: "Pamięć",
      settings: "Ustawienia",
    },
    sectionsAriaLabel: "Sekcje asystenta",
  },
  en: {
    title: "Assistant",
    subtitle:
      "A personal assistant for nutrition, motivation, and daily rhythm. It keeps context, remembers your support style, and guides the next action.",
    readinessTitle: "Assistant readiness",
    readinessSubtitle:
      "The assistant is connected to your day and ready to help with food, water, reminders, and progress.",
    operationsTitle: "AI operations status",
    operationsSubtitle:
      "Team diagnostics: active providers and the assistant fallback route.",
    providerChain: "AI providers",
    assistantReady: "Assistant ready",
    assistantBackupReady: "Support backup ready",
    assistantBackupUnavailable: "Primary route active",
    configured: "Cloud AI ready",
    fallbackOn: "Fallback enabled",
    fallbackOff: "No fallback",
    cloudUnavailable:
      "The assistant is temporarily in limited mode. Day guidance remains available, and live conversation will recover automatically.",
    assistantSettings: "Assistant behavior comes from your profile settings.",
    defaultAssistantName: "Smart Nutrition Assistant",
    renderModeTitle: "How the assistant appears",
    renderMode2d: "Calm",
    renderMode3d: "Expressive",
    renderModeHint:
      "The expressive look turns on only when you choose it. On phones and lighter devices the assistant automatically stays light so the page does not lag.",
    renderModeLoading: "Preparing expressive look",
    renderModeError: "Showing a lighter look so the page stays smooth",
    greeting: (name: string) => `Hi, ${name}. I am already reading your day.`,
    coreTitle: "Assistant Core",
    coreSubtitle: "This is not a separate AI card, but the current state of your personal assistant.",
    memoryGoals: "Goals",
    memoryStruggles: "What to account for",
    memoryTriggers: "How to support you",
    emptyMemory: "More personal context will appear here after onboarding.",
    relationshipLabels: {
      new_companion: "First day together",
      warming_up: "Getting to know you",
      trusted_companion: "Trust is forming",
      deep_context: "Deep context",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Needs first log",
      hydration_attention: "Hydration focus",
      protein_attention: "Protein focus",
      over_target: "Day above plan",
      weekly_check_in: "Let's review progress",
      steady_day: "Steady day",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Calm",
      encouraging: "Encouraging",
      focused: "Focused",
      concerned: "Support without pressure",
      celebrating: "Progress",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "What to do now",
    actionButton: "Open",
    commandEyebrow: AI_WORKER_EYEBROW,
    commandTitle: "I am working with your day",
    commandSubtitle:
      "Food, water, medication, pressure, family, Telegram, and progress converge into one assistant shift.",
    dailyProgress: "Daily progress",
    todayRoute: "Today route",
    assistantToolsTitle: "Assistant tools",
    assistantToolsSubtitle:
      "These are not skins for decoration. This is one worker acting through real Smart Nutrition surfaces.",
    workerShiftTitle: "Live assistant shift",
    workerShiftSubtitle:
      "The assistant is not just standing on the screen. It reads context, prepares the next action, and keeps real tools nearby.",
    workerNow: {
      context: "Reading the day",
      route: "Preparing the route",
      sync: "Keeping contact",
    },
    workerSyncReady: "Cloud and Telegram ready",
    workerSyncLimited: "Cloud temporarily limited",
    workerToolbeltTitle: "Toolbelt",
    caloriesMetric: "Calories",
    proteinMetric: "Protein",
    waterMetric: "Water",
    mealMetric: "Food",
    routeLabels: {
      food: "Start the day story with the first meal",
      water: "Recover hydration rhythm without pressure",
      progress: "Read progress across every tracked scale",
      steady: "Keep the day calm and predictable",
    },
    toolLabels: {
      plan: {
        title: "Plan",
        body: "Schedule, daily route, and next action.",
      },
      food: {
        title: "Food",
        body: "Photo, scanner, products, recipes, and macros.",
      },
      water: {
        title: "Water",
        body: "Glasses, pacing, and gentle reminders.",
      },
      health: {
        title: "Health",
        body: "Pressure, pulse, symptoms, and safe summaries.",
      },
      family: {
        title: "Family",
        body: "Pregnancy, partner, baby, and shared goals.",
      },
      telegram: {
        title: "Telegram",
        body: "The same assistant receives text, photos, and tasks.",
      },
    },
    noMealTitle: "Add the first meal",
    noMealBody:
      "Start with one product or quick portion so the assistant has real day context.",
    waterTitle: (value: number) => `Water: ${value} ml left`,
    waterBody:
      "Close the goal in small portions. One tap on a glass updates progress.",
    caloriesLowTitle: "Calories are still low",
    caloriesLowBody:
      "Add a simple meal so the evening does not become chaotic.",
    caloriesHighTitle: "Calories are above plan",
    caloriesHighBody:
      "Review the diary and make the rest of the day lighter without harsh decisions.",
    profileTitle: "Set a target weight",
    profileBody:
      "A target unlocks the progress scale, a better water goal, and sharper assistant guidance.",
    primary: "Primary",
    backup: "Backup",
    sections: {
      companion: "Assistant",
      progress: "Progress",
      memory: "Memory",
      settings: "Settings",
    },
    sectionsAriaLabel: "Assistant sections",
  },
} as const;

type AiCompanionSection = "companion" | "progress" | "memory" | "settings";

type AiCopy = (typeof aiCopy)[keyof typeof aiCopy];

const COMPANION_ON_COLOR = "var(--sn-on-companion)";
const COMPANION_MUTED_COLOR = "var(--sn-on-companion-muted)";
const COMPANION_BORDER_COLOR = "var(--sn-border-strong)";
const COMPANION_ACCENT_SOFT = "var(--sn-accent-soft)";
const PREMIUM_PANEL_BORDER = "1px solid var(--sn-border-soft)";
const THREE_COLUMN_GRID = "repeat(3, minmax(0, 1fr))";
const TWO_COLUMN_GRID = "repeat(2, minmax(0, 1fr))";
const COMPANION_SOFT_ICON_BACKGROUND = "rgba(255,255,255,0.06)";
const RESPONSIVE_XS = "xs";
const RESPONSIVE_SM = "sm";
const COMPANION_ROW_DIRECTION = "row";
const COMPANION_COLUMN_DIRECTION = "column";
const COMPANION_CENTER_ALIGN = "center";
const COMPANION_START_ALIGN = "flex-start";
const COMPANION_MOBILE_STACK_DIRECTION = {
  [RESPONSIVE_XS]: COMPANION_COLUMN_DIRECTION,
  [RESPONSIVE_SM]: COMPANION_ROW_DIRECTION,
} as const;
const COMPANION_MOBILE_CENTER_ALIGN = {
  [RESPONSIVE_XS]: COMPANION_START_ALIGN,
  [RESPONSIVE_SM]: COMPANION_CENTER_ALIGN,
} as const;

type AssistantMetricCard = {
  id: string;
  label: string;
  value: string;
  progress: number;
  Icon: LucideIcon;
  color: string;
};

type AssistantToolCard = {
  id: string;
  title: string;
  body: string;
  to: string;
  Icon: LucideIcon;
  color: string;
};

type AssistantTimelineItem = {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  color: string;
};

const getAiCopy = (language: AppLanguage): AiCopy => {
  switch (language) {
    case "uk":
      return aiCopy.uk;
    case "pl":
      return aiCopy.pl;
    case "en":
    default:
      return aiCopy.en;
  }
};

const getSectionLabel = (copy: AiCopy, section: AiCompanionSection): string => {
  switch (section) {
    case "progress":
      return copy.sections.progress;
    case "memory":
      return copy.sections.memory;
    case "settings":
      return copy.sections.settings;
    case "companion":
    default:
      return copy.sections.companion;
  }
};

const getRelationshipLabel = (
  copy: AiCopy,
  level: AssistantRelationshipLevel
): string => {
  switch (level) {
    case "warming_up":
      return copy.relationshipLabels.warming_up;
    case "trusted_companion":
      return copy.relationshipLabels.trusted_companion;
    case "deep_context":
      return copy.relationshipLabels.deep_context;
    case "new_companion":
    default:
      return copy.relationshipLabels.new_companion;
  }
};

const getStateLabel = (copy: AiCopy, state: AssistantCoreState): string => {
  switch (state) {
    case "hydration_attention":
      return copy.stateLabels.hydration_attention;
    case "protein_attention":
      return copy.stateLabels.protein_attention;
    case "over_target":
      return copy.stateLabels.over_target;
    case "weekly_check_in":
      return copy.stateLabels.weekly_check_in;
    case "steady_day":
      return copy.stateLabels.steady_day;
    case "needs_context":
    default:
      return copy.stateLabels.needs_context;
  }
};

const getEmotionLabel = (copy: AiCopy, emotion: AssistantCoreEmotion): string => {
  switch (emotion) {
    case "encouraging":
      return copy.emotionLabels.encouraging;
    case "focused":
      return copy.emotionLabels.focused;
    case "concerned":
      return copy.emotionLabels.concerned;
    case "celebrating":
      return copy.emotionLabels.celebrating;
    case "calm":
    default:
      return copy.emotionLabels.calm;
  }
};

const AiCompanionPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const todayItems = useSelector(selectTodayMealItems);
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const { appLanguage } = useLanguage();
  const copy = getAiCopy(appLanguage);
  const [runtimeStatus, setRuntimeStatus] = useState<AssistantRuntimeStatus | null>(null);
  const [activeSection, setActiveSection] = useState<AiCompanionSection>("companion");
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    getSectionLabel(copy, activeSection)
  );
  const companionRenderModePreference = useCompanionRenderModePreference();
  const isCompactCompanionStage = useMediaQuery("(max-width: 599.95px)");
  const companionStageSize = isCompactCompanionStage ? 144 : 220;
  const canSeeAssistantOperations = canAccessAdminCenter(user?.role);

  useEffect(() => {
    let active = true;

    void getAssistantRuntimeStatus().then((status) => {
      if (active) {
        setRuntimeStatus(status);
      }
    }).catch(() => {
      if (active) {
        setRuntimeStatus(null);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const providers = runtimeStatus?.providers ?? [];
  const calorieTarget = Math.max(profile.dailyCalories, 0);
  const calorieProgress =
    calorieTarget > 0 ? Math.min((todayTotals.calories / calorieTarget) * 100, 120) : 0;
  const remainingWaterMl = Math.max(water.dailyWaterGoal - water.consumedMl, 0);
  const weeklyCheckInDue =
    profile.weeklyCheckIn.enabled &&
    getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
      profile.weeklyCheckIn.remindIntervalDays;
  const openMotivationTasks = profile.motivation.activeTasks.filter(
    (task) => !task.completedAt && !task.skippedWithDayOffAt
  ).length;
  const assistantCore = buildAssistantCoreSnapshot({
    userId: user?.id,
    userName: user?.name ?? "",
    goal: profile.goal,
    assistant,
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
  });
  const actionCards = [
    ...(todayItems.length === 0
      ? [
          {
            id: "first-meal",
            title: copy.noMealTitle,
            body: copy.noMealBody,
            to: "/meals",
            progress: null,
          },
        ]
      : []),
    ...(remainingWaterMl > 0
      ? [
          {
            id: "water",
            title: copy.waterTitle(remainingWaterMl),
            body: copy.waterBody,
            to: "/progress",
            progress: water.dailyWaterGoal
              ? Math.min((water.consumedMl / water.dailyWaterGoal) * 100, 100)
              : 0,
          },
        ]
      : []),
    ...(calorieTarget > 0 && todayTotals.calories > calorieTarget * 1.08
      ? [
          {
            id: "calories-high",
            title: copy.caloriesHighTitle,
            body: copy.caloriesHighBody,
            to: "/meals",
            progress: Math.min(calorieProgress, 100),
          },
        ]
      : calorieTarget > 0 && todayTotals.calories < calorieTarget * 0.45
        ? [
            {
              id: "calories-low",
              title: copy.caloriesLowTitle,
              body: copy.caloriesLowBody,
              to: "/meals",
              progress: calorieProgress,
            },
          ]
        : []),
    ...(!profile.targetWeight
      ? [
          {
            id: "profile-target",
            title: copy.profileTitle,
            body: copy.profileBody,
            to: "/profile",
            progress: null,
          },
        ]
      : []),
  ].slice(0, 3);
  const memoryGroups = [
    {
      label: copy.memoryGoals,
      items: assistantCore.memory.goals,
    },
    {
      label: copy.memoryStruggles,
      items: assistantCore.memory.struggles,
    },
    {
      label: copy.memoryTriggers,
      items: assistantCore.memory.motivationTriggers,
    },
  ];
  const sections = [
    { id: "companion", label: getSectionLabel(copy, "companion") },
    { id: "progress", label: getSectionLabel(copy, "progress") },
    { id: "memory", label: getSectionLabel(copy, "memory") },
    { id: "settings", label: getSectionLabel(copy, "settings") },
  ];
  const assistantDisplayName = getAssistantDisplayName(
    assistant.name,
    appLanguage,
    copy.defaultAssistantName
  );
  const waterProgress = water.dailyWaterGoal
    ? Math.min((water.consumedMl / water.dailyWaterGoal) * 100, 100)
    : 0;
  const proteinProgress = macroTargets.protein
    ? Math.min((todayTotals.protein / macroTargets.protein) * 100, 100)
    : 0;
  const mealProgress = Math.min((todayItems.length / 4) * 100, 100);
  const commandMetrics: AssistantMetricCard[] = [
    {
      id: "calories",
      label: copy.caloriesMetric,
      value:
        calorieTarget > 0
          ? `${Math.round(todayTotals.calories)} / ${Math.round(calorieTarget)} kcal`
          : `${Math.round(todayTotals.calories)} kcal`,
      progress: Math.min(calorieProgress, 100),
      Icon: Apple,
      color: "#84cc16",
    },
    {
      id: "protein",
      label: copy.proteinMetric,
      value: `${Math.round(todayTotals.protein)} / ${Math.round(macroTargets.protein)} g`,
      progress: proteinProgress,
      Icon: Activity,
      color: "#22d3ee",
    },
    {
      id: "water",
      label: copy.waterMetric,
      value: `${water.consumedMl} / ${water.dailyWaterGoal} ml`,
      progress: waterProgress,
      Icon: Droplets,
      color: "#38bdf8",
    },
    {
      id: "food",
      label: copy.mealMetric,
      value: `${todayItems.length} / 4`,
      progress: mealProgress,
      Icon: ScanLine,
      color: "#f59e0b",
    },
  ];
  const timelineItems: AssistantTimelineItem[] = [
    {
      id: "food",
      title: copy.routeLabels.food,
      subtitle: `${todayItems.length}/4`,
      Icon: Apple,
      color: "#84cc16",
    },
    {
      id: "water",
      title: copy.routeLabels.water,
      subtitle: `${Math.round(waterProgress)}%`,
      Icon: Droplets,
      color: "#22d3ee",
    },
    {
      id: "progress",
      title: copy.routeLabels.progress,
      subtitle: getStateLabel(copy, assistantCore.state),
      Icon: Sparkles,
      color: "#a78bfa",
    },
    {
      id: "steady",
      title: copy.routeLabels.steady,
      subtitle: getEmotionLabel(copy, assistantCore.emotion),
      Icon: HeartPulse,
      color: "#fb7185",
    },
  ];
  const assistantTools: AssistantToolCard[] = [
    {
      id: "plan",
      ...copy.toolLabels.plan,
      to: "/coach",
      Icon: CalendarDays,
      color: "#a78bfa",
    },
    {
      id: "food",
      ...copy.toolLabels.food,
      to: "/meals",
      Icon: ScanLine,
      color: "#84cc16",
    },
    {
      id: "water",
      ...copy.toolLabels.water,
      to: "/progress",
      Icon: Droplets,
      color: "#22d3ee",
    },
    {
      id: "health",
      ...copy.toolLabels.health,
      to: "/profile#women-health",
      Icon: HeartPulse,
      color: "#fb7185",
    },
    {
      id: "family",
      ...copy.toolLabels.family,
      to: "/profile#women-health",
      Icon: Users,
      color: "#f59e0b",
    },
    {
      id: "telegram",
      ...copy.toolLabels.telegram,
      to: "/profile#telegram",
      Icon: MessageCircle,
      color: "#2dd4bf",
    },
  ];

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      assistantHint={<EcosystemPulse focus="assistant" />}
    >
      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as AiCompanionSection)}
        ariaLabel={copy.sectionsAriaLabel}
      />

      {activeSection === "companion" ? (
        <Stack spacing={2.5}>
          <Paper
            className="sn-companion-panel"
            data-ai-worker-command-center="true"
            elevation={0}
            sx={{
              position: "relative",
              p: { xs: 2, md: 3 },
              borderRadius: 1,
              border: `1px solid ${COMPANION_BORDER_COLOR}`,
              color: COMPANION_ON_COLOR,
              overflow: "hidden",
              minHeight: { md: 560 },
              background:
                "radial-gradient(circle at 50% 28%, rgba(34,211,238,0.2), transparent 28%), radial-gradient(circle at 50% 58%, rgba(132,204,22,0.16), transparent 42%), linear-gradient(135deg, rgba(2,6,23,0.98), rgba(8,47,73,0.92))",
              boxShadow: "0 36px 120px rgba(2,6,23,0.34)",
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: { xs: "18% -30% auto -30%", md: "18% 22% auto 22%" },
                height: { xs: 260, md: 360 },
                borderRadius: "50%",
                border: "1px solid rgba(34,211,238,0.22)",
                boxShadow:
                  "0 0 80px rgba(34,211,238,0.18), inset 0 0 80px rgba(132,204,22,0.08)",
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: "50%",
                top: { xs: 230, md: 355 },
                width: { xs: 190, md: 360 },
                height: { xs: 38, md: 58 },
                transform: "translateX(-50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.5), rgba(20,184,166,0.12) 45%, transparent 72%)",
                filter: "blur(1px)",
              }}
            />

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0, 1fr) 300px" },
                gap: { xs: 2, md: 2.5 },
                alignItems: "stretch",
              }}
            >
              <Stack spacing={1.3} sx={{ order: { xs: 2, lg: 1 } }}>
                <Typography sx={{ color: COMPANION_MUTED_COLOR, fontWeight: 900 }}>
                  {copy.dailyProgress}
                </Typography>
                {commandMetrics.map(({ id, label, value, progress, Icon, color }) => (
                  <Paper
                    key={id}
                    data-ai-worker-metric="true"
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid rgba(148,163,184,0.18)",
                      backgroundColor: "rgba(15,23,42,0.68)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems={COMPANION_CENTER_ALIGN}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 1,
                            display: "grid",
                            placeItems: COMPANION_CENTER_ALIGN,
                            color,
                            backgroundColor: COMPANION_SOFT_ICON_BACKGROUND,
                          }}
                        >
                          <Icon size={18} />
                        </Box>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
                          <Typography sx={{ color: COMPANION_MUTED_COLOR }}>{value}</Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: "rgba(148,163,184,0.2)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                            backgroundColor: color,
                          },
                        }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Stack
                spacing={1.5}
                alignItems={COMPANION_CENTER_ALIGN}
                textAlign={COMPANION_CENTER_ALIGN}
                sx={{
                  order: { xs: 1, lg: 2 },
                  minWidth: 0,
                  py: { xs: 1, md: 2 },
                  justifyContent: COMPANION_CENTER_ALIGN,
                }}
              >
                <Chip
                  label={copy.commandEyebrow}
                  icon={<Sparkles size={16} />}
                  sx={{
                    color: COMPANION_ON_COLOR,
                    borderColor: COMPANION_BORDER_COLOR,
                    backgroundColor: "rgba(20,184,166,0.14)",
                    fontWeight: 900,
                  }}
                  variant="outlined"
                />
                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 720,
                    fontWeight: 950,
                    fontSize: { xs: 34, sm: 46, md: 56 },
                    lineHeight: 1.02,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user ? copy.greeting(user.name) : copy.commandTitle}
                </Typography>
                <Typography
                  sx={{
                    maxWidth: 640,
                    color: COMPANION_MUTED_COLOR,
                    fontSize: { xs: 17, md: 19 },
                    lineHeight: 1.55,
                  }}
                >
                  {copy.commandSubtitle}
                </Typography>
                <Box
                  sx={{
                    width: { xs: companionStageSize + 72, md: companionStageSize + 150 },
                    height: { xs: companionStageSize + 86, md: companionStageSize + 152 },
                    display: "grid",
                    placeItems: COMPANION_CENTER_ALIGN,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 55%, rgba(34,211,238,0.2), transparent 58%)",
                    filter: "drop-shadow(0 36px 60px rgba(34,211,238,0.22))",
                  }}
                >
                  <AssistantAvatar
                    name={assistantDisplayName}
                    variant={assistant.companionKind}
                    size={companionStageSize}
                    renderMode={companionRenderModePreference.value}
                    loadingFallback={
                      <Companion3DLoadingFallback
                        label={copy.renderModeLoading}
                        size={companionStageSize}
                      />
                    }
                    on3dLoadError={companionRenderModePreference.mark3dRuntimeError}
                    mood={assistantCore.emotion === "celebrating" ? "celebrate" : "happy"}
                    active
                  />
                </Box>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  justifyContent={COMPANION_CENTER_ALIGN}
                >
                  {[
                    getRelationshipLabel(copy, assistantCore.relationshipLevel),
                    getStateLabel(copy, assistantCore.state),
                    getEmotionLabel(copy, assistantCore.emotion),
                  ].map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      variant="outlined"
                      sx={{
                        color: COMPANION_ON_COLOR,
                        borderColor: COMPANION_BORDER_COLOR,
                        backgroundColor: COMPANION_ACCENT_SOFT,
                      }}
                    />
                  ))}
                </Stack>
                <Paper
                  data-ai-worker-live-shift="true"
                  elevation={0}
                  sx={{
                    width: "min(100%, 620px)",
                    mt: 0.5,
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 1,
                    border: "1px solid rgba(34,211,238,0.2)",
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,0.72), rgba(6,78,59,0.34))",
                    textAlign: "left",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <Stack spacing={1.4}>
                    <Stack
                      direction={COMPANION_MOBILE_STACK_DIRECTION}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={COMPANION_MOBILE_CENTER_ALIGN}
                    >
                      <Stack spacing={0.4}>
                        <Typography sx={{ fontWeight: 950 }}>
                          {copy.workerShiftTitle}
                        </Typography>
                        <Typography sx={{ color: COMPANION_MUTED_COLOR, lineHeight: 1.45 }}>
                          {copy.workerShiftSubtitle}
                        </Typography>
                      </Stack>
                      <Chip
                        data-ai-worker-live-sync="true"
                        label={
                          runtimeStatus?.configured
                            ? copy.workerSyncReady
                            : copy.workerSyncLimited
                        }
                        color={runtimeStatus?.configured ? "success" : "warning"}
                        variant="outlined"
                        sx={{
                          color: COMPANION_ON_COLOR,
                          borderColor: runtimeStatus?.configured
                            ? "rgba(34,197,94,0.45)"
                            : "rgba(245,158,11,0.5)",
                          backgroundColor: COMPANION_SOFT_ICON_BACKGROUND,
                          fontWeight: 850,
                        }}
                      />
                    </Stack>

                    <Box
                      data-ai-worker-live-steps="true"
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 1,
                      }}
                    >
                      {[
                        copy.workerNow.context,
                        copy.workerNow.route,
                        copy.workerNow.sync,
                      ].map((item, index) => (
                        <Stack
                          key={item}
                          direction="row"
                          spacing={1}
                          alignItems={COMPANION_CENTER_ALIGN}
                          sx={{
                            minHeight: 44,
                            px: 1.1,
                            py: 0.9,
                            borderRadius: 1,
                            border: "1px solid rgba(148,163,184,0.16)",
                            backgroundColor: "rgba(255,255,255,0.05)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor:
                                index === 0
                                  ? "#22d3ee"
                                  : index === 1
                                    ? "#84cc16"
                                    : "#a78bfa",
                              boxShadow: "0 0 18px currentColor",
                            }}
                          />
                          <Typography sx={{ fontWeight: 850, fontSize: 13.5 }}>
                            {item}
                          </Typography>
                        </Stack>
                      ))}
                    </Box>

                    <Stack spacing={0.9}>
                      <Typography
                        variant="overline"
                        sx={{ color: COMPANION_MUTED_COLOR, fontWeight: 900 }}
                      >
                        {copy.workerToolbeltTitle}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        useFlexGap
                        flexWrap="wrap"
                        data-ai-worker-live-toolbelt="true"
                      >
                        {assistantTools.slice(0, 6).map(({ id, title, Icon, color }) => (
                          <Chip
                            key={id}
                            icon={<Icon size={14} />}
                            label={title}
                            size="small"
                            sx={{
                              color: COMPANION_ON_COLOR,
                              border: `1px solid ${color}55`,
                            backgroundColor: COMPANION_SOFT_ICON_BACKGROUND,
                              fontWeight: 850,
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>

              <Stack spacing={1.3} sx={{ order: { xs: 3, lg: 3 } }}>
                <Typography sx={{ color: COMPANION_MUTED_COLOR, fontWeight: 900 }}>
                  {copy.todayRoute}
                </Typography>
                {timelineItems.map(({ id, title, subtitle, Icon, color }) => (
                  <Paper
                    key={id}
                    data-ai-worker-route-item="true"
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid rgba(148,163,184,0.18)",
                      backgroundColor: "rgba(15,23,42,0.62)",
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems={COMPANION_START_ALIGN}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          flex: "0 0 auto",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: COMPANION_CENTER_ALIGN,
                          color,
                          backgroundColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <Icon size={18} />
                      </Box>
                      <Stack sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.25 }}>
                          {title}
                        </Typography>
                        <Typography sx={{ color: COMPANION_MUTED_COLOR }}>
                          {subtitle}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Paper>

          <Paper
            className="sn-premium-panel"
            data-ai-worker-tool-grid="true"
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 1,
              border: PREMIUM_PANEL_BORDER,
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.6}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {copy.assistantToolsTitle}
                </Typography>
                <Typography color="text.secondary">{copy.assistantToolsSubtitle}</Typography>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: TWO_COLUMN_GRID,
                    lg: "repeat(6, minmax(0, 1fr))",
                  },
                  gap: 1.4,
                }}
              >
                {assistantTools.map(({ id, title, body, to, Icon, color }) => (
                  <Button
                    key={id}
                    data-ai-worker-tool="true"
                    onClick={() => navigate(to)}
                    sx={{
                      minHeight: 148,
                      alignItems: "stretch",
                      justifyContent: COMPANION_START_ALIGN,
                      textAlign: "left",
                      textTransform: "none",
                      borderRadius: 1,
                      border: "1px solid var(--sn-border-soft)",
                      color: "text.primary",
                      background:
                        "linear-gradient(145deg, var(--sn-surface-glass), var(--sn-surface-muted))",
                      p: 1.5,
                      transition:
                        "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                      "&:hover, &:focus-visible": {
                        transform: "translateY(-3px)",
                        borderColor: color,
                        boxShadow: `0 18px 34px ${color}33`,
                      },
                    }}
                  >
                    <Stack spacing={1} sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 1,
                          display: "grid",
                          placeItems: COMPANION_CENTER_ALIGN,
                          color,
                          backgroundColor: "var(--sn-accent-soft)",
                        }}
                      >
                        <Icon size={21} />
                      </Box>
                      <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 13, lineHeight: 1.35 }}
                      >
                        {body}
                      </Typography>
                    </Stack>
                  </Button>
                ))}
              </Box>
            </Stack>
          </Paper>

          <LazyModuleBoundary
            errorTitle={recoveryCopy.errorTitle}
            errorBody={recoveryCopy.errorBody}
            reloadLabel={recoveryCopy.reloadLabel}
            resetKey="ai-companion:shop"
          >
            <Suspense fallback={<LoadingSkeleton cards={2} bodyRows={3} />}>
              <CompanionShopCard />
            </Suspense>
          </LazyModuleBoundary>

      {actionCards.length > 0 && (
        <Paper
          className="sn-premium-panel"
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 1,
            border: PREMIUM_PANEL_BORDER,
          }}
        >
          <Stack spacing={2}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.focusTitle}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
                gap: 1.5,
              }}
            >
              {actionCards.map((card) => (
                <Paper
                  className="sn-premium-panel"
                  key={card.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={1.2} sx={{ height: "100%" }}>
                    <Typography sx={{ fontWeight: 900 }}>{card.title}</Typography>
                    <Typography color="text.secondary">{card.body}</Typography>
                    {card.progress !== null && (
                      <LinearProgress
                        variant="determinate"
                        value={card.progress}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="outlined"
                      onClick={() => navigate(card.to)}
                      sx={{
                        alignSelf: COMPANION_START_ALIGN,
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      {copy.actionButton}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Paper>
      )}
        </Stack>
      ) : null}

      {activeSection === "memory" ? (
      <Paper
        className="sn-premium-panel"
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: PREMIUM_PANEL_BORDER,
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.7}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.coreTitle}
            </Typography>
            <Typography color="text.secondary">{copy.coreSubtitle}</Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
              gap: 1.5,
            }}
          >
            {memoryGroups.map((group) => (
              <Stack key={group.label} spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>{group.label}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {group.items.length > 0 ? (
                    group.items.map((item) => (
                      <Chip key={item} label={item} variant="outlined" />
                    ))
                  ) : (
                    <Typography color="text.secondary">{copy.emptyMemory}</Typography>
                  )}
                </Stack>
              </Stack>
            ))}
          </Box>
        </Stack>
      </Paper>
      ) : null}

      {activeSection === "settings" ? (
        <Stack spacing={2.5}>
      <Paper
        className="sn-premium-panel"
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: PREMIUM_PANEL_BORDER,
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.7}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {canSeeAssistantOperations ? copy.operationsTitle : copy.readinessTitle}
            </Typography>
            <Typography color="text.secondary">
              {canSeeAssistantOperations ? copy.operationsSubtitle : copy.readinessSubtitle}
            </Typography>
          </Stack>

          {canSeeAssistantOperations ? (
            runtimeStatus?.configured ? (
              <>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={copy.configured} color="success" variant="outlined" />
                  <Chip
                    label={runtimeStatus.fallbackEnabled ? copy.fallbackOn : copy.fallbackOff}
                    color={runtimeStatus.fallbackEnabled ? "primary" : "default"}
                    variant="outlined"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>{copy.providerChain}</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
                      gap: 1.5,
                    }}
                  >
                    {providers.map((provider) => (
                      <Paper
                        key={provider.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          borderColor: provider.primary
                            ? "rgba(15,118,110,0.25)"
                            : "rgba(15,23,42,0.08)",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                              size="small"
                              color={provider.primary ? "success" : "default"}
                              label={provider.primary ? copy.primary : copy.backup}
                            />
                            <Chip size="small" variant="outlined" label={`#${provider.priority}`} />
                          </Stack>
                          <Typography sx={{ fontWeight: 800 }}>{provider.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {provider.model ?? provider.id}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Box>
                </Stack>
              </>
            ) : (
              <Alert severity="warning">{copy.cloudUnavailable}</Alert>
            )
          ) : runtimeStatus?.configured ? (
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={copy.assistantReady} color="success" variant="outlined" />
                <Chip
                  label={
                    runtimeStatus.fallbackEnabled
                      ? copy.assistantBackupReady
                      : copy.assistantBackupUnavailable
                  }
                  color={runtimeStatus.fallbackEnabled ? "primary" : "default"}
                  variant="outlined"
                />
              </Stack>
              <Typography color="text.secondary">{copy.assistantSettings}</Typography>
            </Stack>
          ) : (
            <Alert severity="warning">{copy.cloudUnavailable}</Alert>
          )}
          <CompanionRenderModeControl
            value={companionRenderModePreference.value}
            onChange={companionRenderModePreference.changeRenderMode}
            loading={companionRenderModePreference.saving}
            error={companionRenderModePreference.hasError}
            disabled={companionRenderModePreference.saving}
            labels={{
              title: copy.renderModeTitle,
              twoD: copy.renderMode2d,
              threeD: copy.renderMode3d,
              hint: copy.renderModeHint,
              loading: copy.renderModeLoading,
              error: copy.renderModeError,
            }}
          />
        </Stack>
      </Paper>
          <LazyModuleBoundary
            errorTitle={recoveryCopy.errorTitle}
            errorBody={recoveryCopy.errorBody}
            reloadLabel={recoveryCopy.reloadLabel}
            resetKey="ai-companion:settings-runtime"
          >
            <Suspense fallback={<LoadingSkeleton cards={1} bodyRows={3} />}>
              <AssistantRuntimeCard />
            </Suspense>
          </LazyModuleBoundary>
        </Stack>
      ) : null}

      {activeSection === "progress" ? (
        <LazyModuleBoundary
          errorTitle={recoveryCopy.errorTitle}
          errorBody={recoveryCopy.errorBody}
          reloadLabel={recoveryCopy.reloadLabel}
          resetKey="ai-companion:progress"
        >
          <Suspense fallback={<LoadingSkeleton cards={3} chart bodyRows={3} />}>
            <Stack spacing={2.5}>
              <CompanionProgressCard />
              <SmartRecommendations />
              <NutritionCoachCard />
            </Stack>
          </Suspense>
        </LazyModuleBoundary>
      ) : null}
    </PageShell>
  );
};

export default AiCompanionPage;
