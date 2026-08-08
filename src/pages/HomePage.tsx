import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Activity,
  Baby,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Camera,
  ClipboardList,
  ChefHat,
  Droplets,
  HeartPulse,
  Plus,
  Search,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import {
  selectMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { incrementWater } from "../features/water/waterSlice";
import { selectDailyMacroTargets } from "../features/profile/selectors";
import {
  hasWomenHealthContext,
  isWomenHealthVisibleForGender,
} from "@domain/profile/womenHealth";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { buildDailyContext } from "@domain/meal/dailyContext";
import {
  buildAssistantHomeIntelligence,
  type AssistantHomeAction,
} from "@features/assistant/assistantHomeIntelligence";
import { AIDiscoveryCards } from "@features/assistant/AIDiscoveryCards";
import { buildAIDiscoveryTimeline } from "@features/assistant/aiDiscoveryCardsModel";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";
import { useLanguage } from "../shared/language";
import { useAppColorMode } from "../shared/theme/colorMode";
import { bottomSheetVariants, fadeUpVariants } from "@shared/ui/motion";
import { SectionCard, SectionTabs } from "@shared/ui";
import type { AppLanguage } from "@shared/types/i18n";

const COMMON_KCAL_KEY = "common.kcal";
const COMMON_GRAMS_KEY = "common.g";
const ELEVATED_SURFACE_COLOR = "var(--sn-surface-elevated)";
const ACCENT_SOFT_COLOR = "var(--sn-accent-soft)";
const ALIGN_START = "flex-start";
const HERO_STORY_BORDER = "rgba(255,255,255,0.54)";
const GLASS_PANEL_BORDER = "1px solid rgba(255,255,255,0.16)";
const GLASS_PANEL_DARK_BG = "rgba(15,23,42,0.54)";
const SOFT_WHITE_LINE = "rgba(255,255,255,0.1)";
const SOFT_GLASS_BLUR = "blur(18px)";
const MEALS_ROUTE = "/meals";
const RECIPES_ROUTE = "/recipes";
const PROGRESS_ROUTE = "/progress";
const COMMUNITY_ROUTE = "/community";
const PROFILE_ROUTE = "/profile";
const WOMEN_HEALTH_ROUTE = "/profile#women-health";
const PROFILE_SECURITY_ROUTE = "/profile#security";
const HERO_STORY_ACCENT = {
  food: "#0f766e",
  ai: "#2563eb",
  water: "#0284c7",
  action: "#4d7c0f",
} as const;

const homeCopy = {
  uk: {
    assistant: "Помічник",
    greeting: "Привіт, {name}",
    subtitle: "Я поруч: тримаємо день коротко, зрозуміло і без зайвого скролу.",
    caloriesLeft: "Сьогодні залишилось",
    eaten: "З'їдено",
    proteinLeft: "Білка залишилось",
    waterLeft: "Води залишилось",
    nextAction: "Наступна дія",
    assistantAction: "Пропозиція помічника",
    otherActions: "Швидкі альтернативи",
    scan: "Сканувати",
    photo: "Фото блюда",
    mealPlan: "План харчування",
    recipes: "Рецепти",
    community: "Спільнота",
    progress: "Прогрес",
    womenHealth: "Жіночий ритм",
    profile: "Профіль",
    searchFood: "Пошук їжі",
    addManually: "Додати вручну",
    quickAddTitle: "Додати їжу",
    quickAddSubtitle: "Оберіть найшвидший спосіб для цього моменту.",
    heroStoryLabel: "Жива історія дня",
    commandCenterLabel: "AI-командний центр",
    dailyProgress: "Щоденний прогрес",
    statusGood: "Тримаємо темп",
    todayPanel: "Сьогодні",
    remindersPanel: "Найближчі нагадування",
    healthPanel: "Здоров'я",
    healthStatus: "Дані з'являться після записів",
    synced: "Синхронізовано",
    actionPrompt: "Що хочеш зробити сьогодні?",
    actionPromptHelper: "Напиши помічнику або обери швидку дію.",
    openAssistant: "Відкрити помічника",
    plan: "План",
    report: "Звіт",
    nutrition: "Харчування",
    activity: "Активність",
    health: "Здоров'я",
    family: "Родина",
    tasks: "Завдання",
    reminders: "Нагадування",
    settings: "Налаштування",
    analyses: "Аналізи",
    pressure: "Тиск",
    pulse: "Пульс",
    noHealthRecords: "Поки немає записів",
    view: "Переглянути",
    sectionsAriaLabel: "Розділи головної",
    water: "Додати воду",
    close: "Закрити",
    sections: {
      today: "Сьогодні",
      meals: "Харчування",
      water: "Вода",
      progress: "Прогрес",
      assistant: "Асистент",
    },
  },
  pl: {
    assistant: "Asystent",
    greeting: "Cześć, {name}",
    subtitle: "Jestem obok: dzień ma być krótki, czytelny i bez długiego scrolla.",
    caloriesLeft: "Zostało dzisiaj",
    eaten: "Zjedzono",
    proteinLeft: "Białka zostało",
    waterLeft: "Wody zostało",
    nextAction: "Kolejny krok",
    assistantAction: "Propozycja asystenta",
    otherActions: "Szybkie alternatywy",
    scan: "Skanuj",
    photo: "Zdjęcie dania",
    mealPlan: "Plan jedzenia",
    recipes: "Przepisy",
    community: "Społeczność",
    progress: "Postępy",
    womenHealth: "Rytm kobiecy",
    profile: "Profil",
    searchFood: "Szukaj jedzenia",
    addManually: "Dodaj ręcznie",
    quickAddTitle: "Dodaj jedzenie",
    quickAddSubtitle: "Wybierz najszybszy sposób na ten moment.",
    heroStoryLabel: "Żywa historia dnia",
    commandCenterLabel: "Centrum dowodzenia AI",
    dailyProgress: "Dzienny progres",
    statusGood: "Dobre tempo",
    todayPanel: "Dzisiaj",
    remindersPanel: "Najbliższe przypomnienia",
    healthPanel: "Zdrowie",
    healthStatus: "Dane pojawią się po wpisach",
    synced: "Zsynchronizowano",
    actionPrompt: "Co chcesz zrobić dzisiaj?",
    actionPromptHelper: "Napisz do asystenta albo wybierz szybką akcję.",
    openAssistant: "Otwórz asystenta",
    plan: "Plan",
    report: "Raport",
    nutrition: "Jedzenie",
    activity: "Aktywność",
    health: "Zdrowie",
    family: "Rodzina",
    tasks: "Zadania",
    reminders: "Przypomnienia",
    settings: "Ustawienia",
    analyses: "Analizy",
    pressure: "Ciśnienie",
    pulse: "Puls",
    noHealthRecords: "Brak wpisów",
    view: "Zobacz",
    sectionsAriaLabel: "Sekcje strony głównej",
    water: "Dodaj wodę",
    close: "Zamknij",
    sections: {
      today: "Dzisiaj",
      meals: "Jedzenie",
      water: "Woda",
      progress: "Progres",
      assistant: "Asystent",
    },
  },
  en: {
    assistant: "Assistant",
    greeting: "Hi, {name}",
    subtitle: "I am nearby: keep today clear, quick, and without long scrolling.",
    caloriesLeft: "Left today",
    eaten: "Eaten",
    proteinLeft: "Protein left",
    waterLeft: "Water left",
    nextAction: "Next action",
    assistantAction: "Assistant suggestion",
    otherActions: "Quick alternatives",
    scan: "Scan",
    photo: "Meal photo",
    mealPlan: "Meal plan",
    recipes: "Recipes",
    community: "Community",
    progress: "Progress",
    womenHealth: "Women rhythm",
    profile: "Profile",
    searchFood: "Search food",
    addManually: "Add manually",
    quickAddTitle: "Add food",
    quickAddSubtitle: "Choose the fastest method for this moment.",
    heroStoryLabel: "Living day story",
    commandCenterLabel: "AI command center",
    dailyProgress: "Daily progress",
    statusGood: "Good pace",
    todayPanel: "Today",
    remindersPanel: "Upcoming reminders",
    healthPanel: "Health",
    healthStatus: "Data appears after entries",
    synced: "Synced",
    actionPrompt: "What do you want to do today?",
    actionPromptHelper: "Message the assistant or choose a quick action.",
    openAssistant: "Open assistant",
    plan: "Plan",
    report: "Report",
    nutrition: "Nutrition",
    activity: "Activity",
    health: "Health",
    family: "Family",
    tasks: "Tasks",
    reminders: "Reminders",
    settings: "Settings",
    analyses: "Analyses",
    pressure: "Pressure",
    pulse: "Pulse",
    noHealthRecords: "No entries yet",
    view: "View",
    sectionsAriaLabel: "Home sections",
    water: "Add water",
    close: "Close",
    sections: {
      today: "Today",
      meals: "Meals",
      water: "Water",
      progress: "Progress",
      assistant: "Assistant",
    },
  },
} as const;

type HomeSection = "today" | "meals" | "water" | "progress" | "assistant";
type HomeCopy = (typeof homeCopy)[keyof typeof homeCopy];
type CommandNavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  path?: string;
  onClick?: () => void;
};

const getHomeCopy = (language: AppLanguage): HomeCopy => {
  switch (language) {
    case "pl":
      return homeCopy.pl;
    case "en":
      return homeCopy.en;
    case "uk":
    default:
      return homeCopy.uk;
  }
};

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const womenHealth = useSelector((state: RootState) => state.profile.womenHealth);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const water = useSelector((state: RootState) => state.water);
  const items = useSelector(selectMealItems);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const { appLanguage, t } = useLanguage();
  const { isDarkMode } = useAppColorMode();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeSection>("today");
  const copy = getHomeCopy(appLanguage);

  const dailyContext = useMemo(
    () =>
      buildDailyContext({
        items,
        dailyCalories,
        macroTargets,
        waterConsumedMl: water.consumedMl,
        waterTargetMl: water.dailyWaterGoal,
      }),
    [dailyCalories, items, macroTargets, water.consumedMl, water.dailyWaterGoal]
  );
  const intelligence = useMemo(
    () =>
      buildAssistantHomeIntelligence({
        context: dailyContext,
        language: appLanguage,
        onboarding: assistant.onboarding,
      }),
    [appLanguage, assistant.onboarding, dailyContext]
  );
  const heroStory = useMemo(
    () =>
      buildAIDiscoveryTimeline({
        context: dailyContext,
        language: appLanguage,
        primaryAction: intelligence.primaryAction,
      }),
    [appLanguage, dailyContext, intelligence.primaryAction]
  );

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const firstName = user.name.split(" ")[0] || user.name;
  const assistantDisplayName = getAssistantDisplayName(
    assistant.name,
    appLanguage,
    "Smart Nutrition AI"
  );
  const heroTextColor = isDarkMode ? "#ffffff" : "#102a43";
  const heroMutedColor = isDarkMode ? "rgba(226,232,240,0.74)" : "rgba(15,23,42,0.66)";
  const heroOverlineColor = isDarkMode ? "rgba(236,253,245,0.82)" : "#0f766e";
  const heroBorder = isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.74)";
  const heroBackground = isDarkMode
    ? "radial-gradient(circle at 76% 18%, rgba(255,255,255,0.3), transparent 15%), radial-gradient(circle at 76% 42%, rgba(163,230,53,0.32), transparent 25%), radial-gradient(circle at 88% 74%, rgba(20,184,166,0.26), transparent 30%), linear-gradient(135deg, #020617 0%, #07111f 46%, #042f2e 100%)"
    : "radial-gradient(circle at 76% 18%, rgba(255,255,255,0.98), transparent 22%), radial-gradient(circle at 78% 42%, rgba(125,211,252,0.48), transparent 28%), radial-gradient(circle at 88% 74%, rgba(20,184,166,0.24), transparent 32%), radial-gradient(circle at 62% 76%, rgba(187,247,208,0.52), transparent 28%), linear-gradient(135deg, #fbfffe 0%, #effdfa 34%, #e6f7ff 100%)";
  const heroOverlay = isDarkMode
    ? "linear-gradient(90deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.68) 48%, rgba(2,6,23,0.1) 100%)"
    : "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(240,253,250,0.56) 48%, rgba(240,249,255,0.04) 100%)";
  const heroRing = isDarkMode
    ? "radial-gradient(circle, transparent 41%, rgba(255,255,255,0.2) 42%, rgba(163,230,53,0.34) 48%, rgba(20,184,166,0.12) 56%, transparent 64%)"
    : "radial-gradient(circle, transparent 40%, rgba(255,255,255,0.92) 41%, rgba(14,165,233,0.34) 48%, rgba(20,184,166,0.16) 56%, transparent 64%)";
  const glassMetricBg = isDarkMode ? SOFT_WHITE_LINE : "rgba(255,255,255,0.64)";
  const actionCardBg = isDarkMode ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.82)";
  const caloriesLeft = Math.max(dailyCalories - totals.calories, 0);
  const calorieProgress = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;
  const openMealMode = (mode: "search" | "photo" | "barcode") => {
    setQuickAddOpen(false);
    navigate(`/meals?mode=${mode}`);
  };

  const runAssistantAction = (action: AssistantHomeAction) => {
    if (action.kind === "water") {
      dispatch(incrementWater(water.glassSizeMl));
      return;
    }

    if (action.kind === "meal_photo") {
      openMealMode("photo");
      return;
    }

    if (action.kind === "meal_scan") {
      openMealMode("barcode");
      return;
    }

    if (action.kind === "recipes") {
      navigate(RECIPES_ROUTE);
      return;
    }

    if (action.kind === "progress") {
      navigate(PROGRESS_ROUTE);
      return;
    }

    const params = new URLSearchParams({ mode: "search" });
    if (action.searchQuery) {
      params.set("suggestion", action.searchQuery);
    }
    navigate(`/meals?${params.toString()}`);
  };

  const routeCards = [
    { label: copy.searchFood, icon: Utensils, path: MEALS_ROUTE },
    { label: copy.recipes, icon: BookOpen, path: RECIPES_ROUTE },
    { label: copy.community, icon: UsersRound, path: COMMUNITY_ROUTE },
    { label: copy.progress, icon: BarChart3, path: PROGRESS_ROUTE },
    ...(isWomenHealthVisibleForGender(user.gender) ||
    hasWomenHealthContext(womenHealth)
      ? [
          {
            label: copy.womenHealth,
            icon: Baby,
            path: WOMEN_HEALTH_ROUTE,
            testId: "home-women-health-entrypoint",
          },
        ]
      : []),
    { label: copy.profile, icon: UserRound, path: PROFILE_ROUTE },
  ];
  const sections = [
    { id: "today", label: copy.sections.today },
    { id: "meals", label: copy.sections.meals },
    { id: "water", label: copy.sections.water },
    { id: "progress", label: copy.sections.progress },
    { id: "assistant", label: copy.sections.assistant },
  ];
  const mealQuickActions = [
    { label: copy.scan, icon: ScanBarcode, onClick: () => openMealMode("barcode") },
    { label: copy.photo, icon: Camera, onClick: () => openMealMode("photo") },
    { label: copy.searchFood, icon: Search, onClick: () => openMealMode("search") },
    { label: copy.mealPlan, icon: ChefHat, onClick: () => navigate(RECIPES_ROUTE) },
  ];
  const drawerQuickActions = [
    ...mealQuickActions,
    {
      label: copy.water,
      icon: Plus,
      onClick: () => {
        dispatch(incrementWater(water.glassSizeMl));
        setQuickAddOpen(false);
      },
    },
  ];
  const progressCards = routeCards.filter((card) =>
    [PROGRESS_ROUTE, PROFILE_ROUTE, COMMUNITY_ROUTE].includes(card.path)
  );
  const waterProgress = water.dailyWaterGoal
    ? Math.min((water.consumedMl / water.dailyWaterGoal) * 100, 100)
    : 0;
  const proteinProgress = macroTargets.protein
    ? Math.min((totals.protein / macroTargets.protein) * 100, 100)
    : 0;
  const overallProgress = Math.round(
    (calorieProgress + proteinProgress + waterProgress) / 3
  );
  const quickDockActions = [
    { label: copy.plan, icon: CalendarCheck, onClick: () => navigate(RECIPES_ROUTE) },
    { label: copy.recipes, icon: BookOpen, onClick: () => navigate(RECIPES_ROUTE) },
    { label: copy.scan, icon: ScanBarcode, onClick: () => openMealMode("barcode") },
    { label: copy.assistantAction, icon: Sparkles, onClick: () => navigate("/coach") },
    { label: copy.report, icon: BarChart3, onClick: () => navigate(PROGRESS_ROUTE) },
  ];
  const commandNavItems: CommandNavItem[] = [
    { label: copy.sections.today, icon: Sparkles, active: true, path: "/dashboard" },
    { label: copy.nutrition, icon: Utensils, path: MEALS_ROUTE },
    { label: copy.water, icon: Droplets, onClick: () => dispatch(incrementWater(water.glassSizeMl)) },
    { label: copy.activity, icon: Activity, path: PROGRESS_ROUTE },
    { label: copy.health, icon: HeartPulse, path: PROGRESS_ROUTE },
    { label: copy.analyses, icon: Stethoscope, path: PROFILE_ROUTE },
    ...(isWomenHealthVisibleForGender(user.gender) || hasWomenHealthContext(womenHealth)
      ? [{ label: copy.womenHealth, icon: Baby, path: WOMEN_HEALTH_ROUTE }]
      : []),
    { label: copy.family, icon: UsersRound, path: COMMUNITY_ROUTE },
    { label: copy.tasks, icon: ClipboardList, path: PROFILE_SECURITY_ROUTE },
    { label: copy.reminders, icon: CalendarCheck, path: PROFILE_SECURITY_ROUTE },
    { label: copy.sections.assistant, icon: Sparkles, path: "/coach" },
    { label: copy.settings, icon: ShieldCheck, path: PROFILE_SECURITY_ROUTE },
  ];
  const statusMetrics = [
    {
      label: t("profile.dailyCalories"),
      value: `${totals.calories.toFixed(0)} / ${dailyCalories}`,
      progress: calorieProgress,
      icon: Utensils,
      color: "#7ddc47",
    },
    {
      label: t("profile.protein"),
      value: `${totals.protein.toFixed(0)} / ${macroTargets.protein} ${t(COMMON_GRAMS_KEY)}`,
      progress: proteinProgress,
      icon: Sparkles,
      color: "#22d3ee",
    },
    {
      label: t("profile.water"),
      value: `${water.consumedMl} / ${water.dailyWaterGoal} ml`,
      progress: waterProgress,
      icon: Droplets,
      color: "#38bdf8",
    },
  ];
  const todaySignals = heroStory.slice(0, 4);
  const reminderSignals = intelligence.secondaryActions.slice(0, 4);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        px: { xs: 0.5, sm: 1, md: 0 },
        pb: "calc(96px + env(safe-area-inset-bottom, 0px))",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={{ xs: 1.6, md: 2.4 }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.1, sm: 2.6, md: 3.2 },
          borderRadius: 1,
          color: heroTextColor,
          minHeight: { xs: 560, sm: 620, md: 680 },
          border: `1px solid ${heroBorder}`,
          background: heroBackground,
          boxShadow: isDarkMode
            ? "0 34px 110px rgba(2,6,23,0.34)"
            : "0 34px 100px rgba(14,165,233,0.18)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: heroOverlay,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: { xs: 380, sm: 520, md: 620 },
            height: { xs: 380, sm: 520, md: 620 },
            right: { xs: -172, sm: -110, md: -22 },
            top: { xs: 42, sm: -8, md: -42 },
            borderRadius: "50%",
            background: heroRing,
            filter: isDarkMode
              ? "drop-shadow(0 0 72px rgba(163,230,53,0.24))"
              : "drop-shadow(0 0 72px rgba(14,165,233,0.24))",
            opacity: 0.9,
          },
        }}
      >
        <Box
          data-home-command-center="ecosystem-rail"
          sx={{
            position: "absolute",
            zIndex: 2,
            left: 16,
            top: 18,
            bottom: 18,
            width: 176,
            display: { xs: "none", lg: "flex" },
            flexDirection: "column",
            gap: 0.4,
            p: 1,
            borderRadius: 1,
            border: GLASS_PANEL_BORDER,
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.54))"
              : "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(240,253,250,0.48))",
            backdropFilter: SOFT_GLASS_BLUR,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 1.2,
              mb: 0.6,
              borderRadius: 1,
              color: heroTextColor,
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Typography variant="caption" sx={{ color: heroMutedColor, fontWeight: 900 }}>
              {copy.dailyProgress}
            </Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 950, lineHeight: 1 }}>
              {overallProgress}%
            </Typography>
            <Typography variant="caption" sx={{ color: "#86efac", fontWeight: 900 }}>
              {copy.statusGood}
            </Typography>
          </Paper>
          {commandNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Button
                key={item.label}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                    return;
                  }
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                startIcon={<Icon size={17} />}
                sx={{
                  minHeight: 38,
                  justifyContent: ALIGN_START,
                  px: 1.2,
                  borderRadius: 1,
                  textTransform: "none",
                  color: item.active ? "#5eead4" : heroMutedColor,
                  fontWeight: item.active ? 950 : 850,
                  background: item.active
                    ? "linear-gradient(90deg, rgba(20,184,166,0.28), rgba(34,211,238,0.08))"
                    : "transparent",
                  "&:hover": {
                    color: heroTextColor,
                    background: SOFT_WHITE_LINE,
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
          <Box sx={{ flex: 1 }} />
          <Stack spacing={0.3} sx={{ px: 1, color: heroMutedColor }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: "#34d399" }}>
              {copy.synced}
            </Typography>
            <Typography variant="caption">2 x тому</Typography>
          </Stack>
        </Box>

        <Box
          data-home-command-center="live-panels"
          sx={{
            position: "absolute",
            zIndex: 2,
            right: 16,
            top: 28,
            width: 268,
            display: { xs: "none", xl: "grid" },
            gap: 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 1.6,
              borderRadius: 1,
              color: heroTextColor,
              border: GLASS_PANEL_BORDER,
              background: GLASS_PANEL_DARK_BG,
              backdropFilter: "blur(20px)",
            }}
          >
            <Stack spacing={1.1}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 950 }}>{copy.remindersPanel}</Typography>
                <Typography variant="caption" sx={{ color: heroMutedColor }}>
                  {copy.todayPanel}
                </Typography>
              </Stack>
              {todaySignals.slice(0, 2).map((item) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(37,99,235,0.18)",
                      color: "#60a5fa",
                    }}
                  >
                    <Sparkles size={15} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: heroMutedColor }} noWrap>
                      {item.metric}
                    </Typography>
                  </Box>
                </Stack>
              ))}
              {reminderSignals.map((action) => (
                <Stack key={`${action.kind}-${action.label}`} direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(20,184,166,0.18)",
                      color: "#5eead4",
                    }}
                  >
                    <CalendarCheck size={15} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                      {action.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: heroMutedColor }} noWrap>
                      {action.helper}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 1.6,
              borderRadius: 1,
              color: heroTextColor,
              border: GLASS_PANEL_BORDER,
              background: GLASS_PANEL_DARK_BG,
              backdropFilter: "blur(20px)",
            }}
          >
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HeartPulse size={19} color="#34d399" />
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>{copy.healthPanel}</Typography>
                  <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 900 }}>
                    {copy.healthStatus}
                  </Typography>
                </Box>
              </Stack>
              <Box
                aria-hidden
                sx={{
                  height: 44,
                  borderRadius: 1,
                  background:
                    "linear-gradient(135deg, transparent 0 20%, rgba(52,211,153,0.34) 20% 22%, transparent 22% 34%, rgba(52,211,153,0.5) 34% 36%, transparent 36% 52%, rgba(52,211,153,0.44) 52% 54%, transparent 54% 68%, rgba(52,211,153,0.58) 68% 70%, transparent 70%)",
                  border: "1px solid rgba(52,211,153,0.14)",
                }}
              />
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" sx={{ color: heroMutedColor }}>
                    {copy.pulse}
                  </Typography>
                  <Typography sx={{ fontWeight: 950 }}>{copy.noHealthRecords}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: heroMutedColor }}>
                    {copy.pressure}
                  </Typography>
                  <Typography sx={{ fontWeight: 950 }}>{copy.noHealthRecords}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        <Stack
          spacing={2.2}
          data-home-command-center="hero-core"
          sx={{
            position: "relative",
            zIndex: 0,
            maxWidth: { md: 640, lg: 760 },
            ml: { lg: "188px", xl: "192px" },
            mr: { xl: "292px" },
          }}
        >
          <Stack spacing={0.9}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#07111f",
                  background: "linear-gradient(135deg, #a3e635, #22d3ee)",
                  boxShadow: "0 0 34px rgba(163,230,53,0.34)",
                }}
              >
                <Sparkles size={17} aria-hidden="true" />
              </Box>
              <Typography
                variant="overline"
                sx={{ color: heroOverlineColor, fontWeight: 900 }}
              >
                Smart Nutrition · AI Companion
              </Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                fontWeight: 950,
                fontSize: { xs: 38, sm: 52, md: 64 },
                lineHeight: 0.96,
                letterSpacing: 0,
                textWrap: "balance",
              }}
            >
              {copy.greeting.replace("{name}", firstName)}
            </Typography>
            <Typography
              sx={{
                maxWidth: 620,
                color: heroMutedColor,
                fontSize: { xs: 17, md: 19 },
                lineHeight: 1.55,
                fontWeight: 650,
              }}
            >
              {copy.subtitle}
            </Typography>
          </Stack>

          <Box
            aria-label={copy.heroStoryLabel}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 0.75,
            }}
          >
            {heroStory.map((item, index) => {
              const accent = HERO_STORY_ACCENT[item.tone];
              const isAction = Boolean(item.action);

              return (
                <Box
                  key={item.id}
                  component={isAction ? "button" : "article"}
                  type={isAction ? "button" : undefined}
                  onClick={item.action ? () => runAssistantAction(item.action as AssistantHomeAction) : undefined}
                  sx={{
                    position: "relative",
                    minHeight: 96,
                    p: 1,
                    borderRadius: 1,
                    border: `1px solid ${HERO_STORY_BORDER}`,
                    color: heroTextColor,
                    textAlign: "left",
                    background: isDarkMode
                      ? "rgba(255,255,255,0.09)"
                      : "rgba(255,255,255,0.58)",
                    backdropFilter: SOFT_GLASS_BLUR,
                    cursor: isAction ? "pointer" : "default",
                    overflow: "hidden",
                    transition: "transform 160ms ease, border-color 160ms ease",
                    "&:hover": isAction
                      ? {
                          transform: "translateY(-1px)",
                          borderColor: accent,
                        }
                      : undefined,
                    "&:focus-visible": {
                      outline: `2px solid ${accent}`,
                      outlineOffset: 2,
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: { xs: 2, md: 22 },
                      height: { xs: 18, md: 2 },
                      left: { xs: 19, md: "auto" },
                      right: { xs: "auto", md: -12 },
                      bottom: { xs: -10, md: "auto" },
                      top: { xs: "auto", md: 22 },
                      backgroundColor:
                        index === heroStory.length - 1 ? "transparent" : HERO_STORY_BORDER,
                    },
                  }}
                >
                  <Stack spacing={0.55}>
                    <Stack direction="row" spacing={0.7} alignItems="center" minWidth={0}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: accent,
                          boxShadow: `0 0 18px ${accent}55`,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: accent, fontWeight: 950, minWidth: 0 }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontWeight: 950,
                        lineHeight: 1.15,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: heroMutedColor, fontWeight: 850 }}>
                      {item.metric}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.6}
            alignItems={{ xs: ALIGN_START, sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.4} alignItems="center" minWidth={0}>
              <Box
                sx={{
                  position: "relative",
                  width: 82,
                  height: 82,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background:
                    "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(163,230,53,0.18))",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 20px 54px rgba(20,184,166,0.22)",
                }}
              >
                <AssistantAvatar
                  name={assistantDisplayName}
                  variant="robot"
                  mood={dailyContext.primaryFocus === "steady" ? "happy" : "coach"}
                  size={62}
                  active
                />
              </Box>
              <Stack spacing={0.4} minWidth={0}>
                <Typography variant="overline" sx={{ color: heroMutedColor }}>
                  {copy.assistant} · {intelligence.headline}
                </Typography>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{ fontWeight: 900, overflowWrap: "anywhere" }}
                >
                  {assistantDisplayName}
                </Typography>
                <Typography sx={{ color: heroMutedColor }}>
                  {copy.assistantAction}
                </Typography>
              </Stack>
            </Stack>
            <IconButton
              aria-label={intelligence.primaryAction.label}
              onClick={() => setQuickAddOpen(true)}
              sx={{
                width: 52,
                height: 52,
                color: "#07111f",
                bgcolor: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.7)",
                "&:hover": { bgcolor: "#ffffff" },
              }}
            >
              <Plus size={24} />
            </IconButton>
          </Stack>

          <Stack spacing={0.6}>
            <Typography sx={{ color: heroMutedColor, maxWidth: 720 }}>
              {intelligence.personalizationLine ?? copy.subtitle}
            </Typography>
            <Typography sx={{ color: heroTextColor, fontWeight: 900, fontSize: { xs: 19, md: 22 }, lineHeight: 1.35 }}>
              {intelligence.message}
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 1.6,
              borderRadius: 1,
              color: heroTextColor,
              bgcolor: glassMetricBg,
              border: `1px solid ${heroBorder}`,
              backdropFilter: SOFT_GLASS_BLUR,
            }}
          >
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>{copy.caloriesLeft}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  {caloriesLeft.toFixed(0)} {t(COMMON_KCAL_KEY)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={calorieProgress}
                sx={{
                  height: 10,
                  borderRadius: 999,
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "#a3e635",
                    boxShadow: "0 0 24px rgba(163,230,53,0.36)",
                  },
                }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                {statusMetrics.map((metric) => (
                  <Box key={metric.label}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <metric.icon size={16} color={metric.color} />
                      <Typography variant="caption" sx={{ color: heroMutedColor }}>
                        {metric.label}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 900 }}>{metric.value}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metric.progress}
                      sx={{
                        mt: 0.6,
                        height: 5,
                        borderRadius: 999,
                        bgcolor: isDarkMode
                          ? SOFT_WHITE_LINE
                          : "rgba(15,23,42,0.08)",
                        "& .MuiLinearProgress-bar": { bgcolor: metric.color },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={0.8}>
            <Typography variant="caption" sx={{ color: heroMutedColor, fontWeight: 800 }}>
              {copy.assistantAction}
            </Typography>
            <Paper
              component="button"
              type="button"
              onClick={() => runAssistantAction(intelligence.primaryAction)}
              elevation={0}
              sx={{
                p: 1.4,
                borderRadius: 1,
                cursor: "pointer",
                textAlign: "left",
                color: "#102a43",
                bgcolor: actionCardBg,
                border: "1px solid rgba(255,255,255,0.66)",
                backdropFilter: "blur(16px)",
                "&:hover": { bgcolor: "#ffffff" },
              }}
            >
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 900 }}>
                  {intelligence.primaryAction.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {intelligence.primaryAction.helper}
                </Typography>
              </Stack>
            </Paper>
          </Stack>

          <Paper
            elevation={0}
            data-home-command-center="assistant-dock"
            sx={{
              p: 1,
              borderRadius: 1,
              color: heroTextColor,
              bgcolor: isDarkMode ? "rgba(15,23,42,0.62)" : "rgba(255,255,255,0.66)",
              border: `1px solid ${heroBorder}`,
              backdropFilter: SOFT_GLASS_BLUR,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={0.8}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0, pr: { sm: 1 } }}>
                <Typography sx={{ fontWeight: 950 }}>{copy.actionPrompt}</Typography>
                <Typography variant="caption" sx={{ color: heroMutedColor }}>
                  {copy.actionPromptHelper}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.7} sx={{ flexWrap: "wrap", rowGap: 0.7 }}>
                {quickDockActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Button
                      key={action.label}
                      onClick={action.onClick}
                      startIcon={<Icon size={16} />}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 900,
                        color: heroTextColor,
                        borderColor: isDarkMode
                          ? "rgba(94,234,212,0.28)"
                          : "rgba(13,148,136,0.22)",
                        bgcolor: isDarkMode
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(255,255,255,0.74)",
                        "&:hover": {
                          borderColor: "#5eead4",
                          bgcolor: isDarkMode
                            ? "rgba(94,234,212,0.12)"
                            : "rgba(240,253,250,0.92)",
                        },
                      }}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: { xs: -10, sm: 42, md: 72 },
            bottom: { xs: 70, sm: 46, md: 36 },
            zIndex: 1,
            width: { xs: 136, sm: 210, md: 270 },
            height: { xs: 136, sm: 210, md: 270 },
            borderRadius: "50%",
            display: { xs: "none", sm: "grid" },
            placeItems: "center",
            background:
              "radial-gradient(circle at 50% 55%, rgba(34,211,238,0.3), rgba(163,230,53,0.16) 44%, transparent 72%)",
            filter: "drop-shadow(0 0 56px rgba(34,211,238,0.28))",
          }}
        >
          <AssistantAvatar
            name={assistantDisplayName}
            variant={assistant.companionKind}
            mood={dailyContext.primaryFocus === "steady" ? "happy" : "coach"}
            size={160}
            active
          />
        </Box>
      </Paper>

      <AIDiscoveryCards
        context={dailyContext}
        intelligence={intelligence}
        onRunAction={runAssistantAction}
      />

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as HomeSection)}
        ariaLabel={copy.sectionsAriaLabel}
      />

      {activeSection === "assistant" ? (
        <SectionCard title={copy.otherActions} tone="info">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            {intelligence.secondaryActions.map((action) => (
              <Button
                key={`${action.kind}-${action.label}`}
                variant="outlined"
                onClick={() => runAssistantAction(action)}
                sx={{
                  minHeight: 54,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="outlined"
              onClick={() => setQuickAddOpen(true)}
              startIcon={<Plus size={18} />}
              sx={{ minHeight: 54, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
            >
              {copy.quickAddTitle}
            </Button>
          </Box>
        </SectionCard>
      ) : null}

      {activeSection === "meals" ? (
        <SectionCard title={copy.quickAddTitle} description={copy.quickAddSubtitle}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            {mealQuickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  startIcon={<Icon size={19} />}
                  variant="outlined"
                  sx={{
                    minHeight: 54,
                    justifyContent: ALIGN_START,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  {action.label}
                </Button>
              );
            })}
          </Box>
        </SectionCard>
      ) : null}

      {activeSection === "water" ? (
        <SectionCard title={copy.water} tone="info">
          <Button
            variant="contained"
            onClick={() => dispatch(incrementWater(water.glassSizeMl))}
            startIcon={<Plus size={18} />}
            sx={{ minHeight: 54, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
          >
            {copy.water}
          </Button>
        </SectionCard>
      ) : null}

      {activeSection === "today" || activeSection === "progress" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: `repeat(${
                activeSection === "today" ? Math.min(routeCards.length, 6) : 3
              }, minmax(0, 1fr))`,
            },
            gap: 1,
          }}
        >
          {(activeSection === "today" ? routeCards : progressCards).map((card) => {
            const Icon = card.icon;

            return (
            <Paper
              key={card.path}
              component="button"
              type="button"
              onClick={() => navigate(card.path)}
              variant="outlined"
              data-home-women-health-entrypoint={card.testId}
              sx={{
                p: 1.4,
                minHeight: 96,
                borderRadius: 1,
                cursor: "pointer",
                textAlign: "left",
                bgcolor: ELEVATED_SURFACE_COLOR,
                borderColor: "var(--sn-border-soft)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: ACCENT_SOFT_COLOR,
                },
              }}
            >
              <Stack spacing={1}>
                <Icon size={22} />
                <Typography sx={{ fontWeight: 900 }}>{card.label}</Typography>
              </Stack>
            </Paper>
            );
          })}
        </Box>
      ) : null}

      <Drawer
        anchor="bottom"
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "18px 18px 0 0",
            p: 2,
            maxWidth: 560,
            mx: "auto",
            width: "100%",
          },
        }}
      >
        <Stack
          component={motion.div}
          variants={bottomSheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          spacing={1.4}
        >
          <Box
            sx={{
              width: 44,
              height: 4,
              borderRadius: 999,
              bgcolor: "rgba(15,23,42,0.22)",
              mx: "auto",
            }}
          />
          <Stack spacing={0.4}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
              {copy.quickAddTitle}
            </Typography>
            <Typography color="text.secondary">{copy.quickAddSubtitle}</Typography>
          </Stack>
          {drawerQuickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                component={motion.button}
                variants={fadeUpVariants}
                key={action.label}
                onClick={action.onClick}
                startIcon={<Icon size={19} />}
                variant="outlined"
                sx={{ justifyContent: ALIGN_START, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                {action.label}
              </Button>
            );
          })}
          <Button onClick={() => setQuickAddOpen(false)} sx={{ textTransform: "none" }}>
            {copy.close}
          </Button>
        </Stack>
      </Drawer>
      </Stack>
    </Box>
  );
};

export default HomePage;
