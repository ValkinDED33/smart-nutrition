import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Camera,
  ChefHat,
  Droplets,
  Plus,
  Search,
  ScanBarcode,
  Sparkles,
  UserRound,
  UsersRound,
  Utensils,
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
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { buildDailyContext } from "@domain/meal/dailyContext";
import {
  buildAssistantHomeIntelligence,
  type AssistantHomeAction,
} from "@features/assistant/assistantHomeIntelligence";
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
const LEGACY_ASSISTANT_NAMES = new Set(["hyemye", "hye-mye", "hue-mue", "huemue"]);

const getAssistantDisplayName = (name: string) => {
  const normalized = name.trim().toLowerCase();

  return normalized && !LEGACY_ASSISTANT_NAMES.has(normalized)
    ? name.trim()
    : "Smart Nutrition AI";
};

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
    profile: "Профіль",
    searchFood: "Пошук їжі",
    addManually: "Додати вручну",
    quickAddTitle: "Додати їжу",
    quickAddSubtitle: "Оберіть найшвидший спосіб для цього моменту.",
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
    profile: "Profil",
    searchFood: "Szukaj jedzenia",
    addManually: "Dodaj ręcznie",
    quickAddTitle: "Dodaj jedzenie",
    quickAddSubtitle: "Wybierz najszybszy sposób na ten moment.",
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
    profile: "Profile",
    searchFood: "Search food",
    addManually: "Add manually",
    quickAddTitle: "Add food",
    quickAddSubtitle: "Choose the fastest method for this moment.",
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

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const firstName = user.name.split(" ")[0] || user.name;
  const assistantDisplayName = getAssistantDisplayName(assistant.name);
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
  const glassMetricBg = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.64)";
  const actionCardBg = isDarkMode ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.82)";
  const caloriesLeft = Math.max(dailyCalories - totals.calories, 0);
  const proteinLeft = Math.max(macroTargets.protein - totals.protein, 0);
  const waterLeft = Math.max(water.dailyWaterGoal - water.consumedMl, 0);
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
      navigate("/recipes");
      return;
    }

    if (action.kind === "progress") {
      navigate("/progress");
      return;
    }

    const params = new URLSearchParams({ mode: "search" });
    if (action.searchQuery) {
      params.set("suggestion", action.searchQuery);
    }
    navigate(`/meals?${params.toString()}`);
  };

  const routeCards = [
    { label: copy.searchFood, icon: Utensils, path: "/meals" },
    { label: copy.recipes, icon: BookOpen, path: "/recipes" },
    { label: copy.community, icon: UsersRound, path: "/community" },
    { label: copy.progress, icon: BarChart3, path: "/progress" },
    { label: copy.profile, icon: UserRound, path: "/profile" },
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
    { label: copy.mealPlan, icon: ChefHat, onClick: () => navigate("/recipes") },
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
    ["/progress", "/profile", "/community"].includes(card.path)
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1040,
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
          p: { xs: 2.1, sm: 2.6, md: 3.4 },
          borderRadius: 1,
          color: heroTextColor,
          minHeight: { xs: 520, sm: 560, md: 520 },
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
        <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1, maxWidth: { md: 640 } }}>
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
              backdropFilter: "blur(18px)",
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
                {[
                  [`${copy.eaten}`, `${totals.calories.toFixed(0)} ${t(COMMON_KCAL_KEY)}`],
                  [`${copy.proteinLeft}`, `${proteinLeft.toFixed(0)} ${t(COMMON_GRAMS_KEY)}`],
                  [`${copy.waterLeft}`, `${waterLeft.toFixed(0)} ml`],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: heroMutedColor }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
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
        </Stack>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: { xs: -10, sm: 42, md: 72 },
            bottom: { xs: 70, sm: 46, md: 36 },
            zIndex: 1,
            width: { xs: 118, sm: 170, md: 210 },
            height: { xs: 118, sm: 170, md: 210 },
            borderRadius: "50%",
            display: { xs: "grid", sm: "grid" },
            placeItems: "center",
            background:
              "radial-gradient(circle, rgba(163,230,53,0.28), rgba(20,184,166,0.08) 58%, transparent 70%)",
            filter: "drop-shadow(0 0 44px rgba(163,230,53,0.26))",
          }}
        >
          <Droplets size={42} color="#67e8f9" />
        </Box>
      </Paper>

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as HomeSection)}
        ariaLabel="Dashboard sections"
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
              sm: `repeat(${activeSection === "today" ? 5 : 3}, minmax(0, 1fr))`,
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
