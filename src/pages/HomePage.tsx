import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart3,
  BookOpen,
  Camera,
  ChefHat,
  Plus,
  Search,
  ScanBarcode,
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
import { AssistantAvatar } from "../shared/components/AssistantAvatar";
import { buildDailyContext } from "@domain/meal/dailyContext";
import {
  buildAssistantHomeIntelligence,
  type AssistantHomeAction,
} from "@features/assistant/assistantHomeIntelligence";
import { useLanguage } from "../shared/language";

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
  },
} as const;

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
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const copy = homeCopy[appLanguage];

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
      }),
    [appLanguage, dailyContext]
  );

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const firstName = user.name.split(" ")[0] || user.name;
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

  return (
    <Stack spacing={2.2} sx={{ maxWidth: 980, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          color: "white",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.94) 58%, rgba(37,99,235,0.88) 100%)",
        }}
      >
        <Stack spacing={2.2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.6}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.4} alignItems="center" minWidth={0}>
              <AssistantAvatar
                name={assistant.name}
                variant={assistant.companionKind}
                mood={dailyContext.primaryFocus === "steady" ? "happy" : "coach"}
                size={72}
                active
              />
              <Stack spacing={0.4} minWidth={0}>
                <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  {copy.assistant} · {intelligence.headline}
                </Typography>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{ fontWeight: 900, overflowWrap: "anywhere" }}
                >
                  {assistant.name}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.84)" }}>
                  {copy.greeting.replace("{name}", firstName)}
                </Typography>
              </Stack>
            </Stack>
            <IconButton
              aria-label={intelligence.primaryAction.label}
              onClick={() => setQuickAddOpen(true)}
              sx={{
                width: 52,
                height: 52,
                color: "#0f172a",
                bgcolor: "#ffffff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.88)" },
              }}
            >
              <Plus size={24} />
            </IconButton>
          </Stack>

          <Stack spacing={0.6}>
            <Typography sx={{ color: "rgba(255,255,255,0.86)", maxWidth: 720 }}>
              {copy.subtitle}
            </Typography>
            <Typography sx={{ color: "white", fontWeight: 900, fontSize: { xs: 18, md: 20 } }}>
              {intelligence.message}
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 1.6,
              borderRadius: 1,
              color: "white",
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>{copy.caloriesLeft}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  {caloriesLeft.toFixed(0)} {t("common.kcal")}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={calorieProgress}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.22)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#ffffff" },
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
                  [`${copy.eaten}`, `${totals.calories.toFixed(0)} ${t("common.kcal")}`],
                  [`${copy.proteinLeft}`, `${proteinLeft.toFixed(0)} ${t("common.g")}`],
                  [`${copy.waterLeft}`, `${waterLeft.toFixed(0)} ml`],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.68)" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={0.8}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 800 }}>
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
                color: "#0f172a",
                bgcolor: "#ffffff",
                border: "1px solid rgba(255,255,255,0.4)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
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
      </Paper>

      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 900 }}>{copy.otherActions}</Typography>
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
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(5, minmax(0, 1fr))" },
          gap: 1,
        }}
      >
        {routeCards.map((card) => {
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
                bgcolor: "rgba(255,255,255,0.9)",
                borderColor: "rgba(15,23,42,0.1)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(240,253,250,0.88)",
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
        <Stack spacing={1.4}>
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
          {[
            { label: copy.scan, icon: ScanBarcode, onClick: () => openMealMode("barcode") },
            { label: copy.photo, icon: Camera, onClick: () => openMealMode("photo") },
            { label: copy.searchFood, icon: Search, onClick: () => openMealMode("search") },
            { label: copy.mealPlan, icon: ChefHat, onClick: () => navigate("/recipes") },
            {
              label: copy.water,
              icon: Plus,
              onClick: () => {
                dispatch(incrementWater(water.glassSizeMl));
                setQuickAddOpen(false);
              },
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                startIcon={<Icon size={19} />}
                variant="outlined"
                sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
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
  );
};

export default HomePage;
