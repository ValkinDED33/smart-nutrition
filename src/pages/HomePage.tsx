import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CountUp from "react-countup";
import { toast } from "sonner";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import {
  selectMealItems,
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { incrementWater } from "../features/water/waterSlice";
import { useLanguage } from "../shared/language";
import {
  selectCurrentWeight,
  selectDailyMacroTargets,
  selectDailyMacroProgress,
} from "../features/profile/selectors";
import { AssistantAvatar } from "../shared/components/AssistantAvatar";
import { LearningHubCard } from "../features/education/LearningHubCard";
import {
  buildDailyContext,
  type DailyContextFocus,
} from "../shared/lib/dailyContext";

type MealActionMode = "photo" | "search" | "barcode";

const homeCopy = {
  uk: {
    productLine: "Ви їсте. Я думаю за вас.",
    productSubtitle:
      "Один екран для рішення на зараз: додати їжу, закрити воду і побачити наступний крок без зайвих карток.",
    startMeal: "Додати прийом їжі",
    addWater: "Додати воду",
    askAssistant: "Запитати помічника",
    quickActions: "Як додати їжу",
    actionHint: "Оберіть найшвидший спосіб. Все інше можна уточнити потім.",
    actions: {
      photo: {
        title: "Фото",
        body: "Сфотографуйте тарілку, перевірте чернетку і додайте в щоденник.",
      },
      search: {
        title: "Пошук",
        body: "Знайдіть продукт за назвою і швидко задайте порцію.",
      },
      barcode: {
        title: "Штрихкод",
        body: "Скануйте упаковку або введіть код вручну.",
      },
    } satisfies Record<MealActionMode, { title: string; body: string }>,
    dayStatus: "День зараз",
    wellness: "Wellness стан",
    calories: "Калорії",
    eaten: "З'їдено",
    left: "Залишилось",
    water: "Вода",
    protein: "Білок",
    macros: "БЖВ",
    weight: "Вага",
    streak: "Серія",
    mood: "Настрій",
    level: "Рівень",
    calmMood: "спокійний",
    focusedMood: "зібраний",
    recoveryMood: "відновлення",
    days: "днів",
    todayFood: "Їжа сьогодні",
    assistant: "Помічник поруч",
    nextStep: "Наступна дія",
    goalToday: "Ціль сьогодні",
    progressDone: "Виконано",
    weekProgress: "Тиждень",
    improveToday: "Покращити сьогодні",
    weekLogged: (days: number) => `${days}/7 днів із записами`,
    focusLabels: {
      log_first_meal: "додати перший прийом їжі",
      complete_day: "закрити базову структуру дня",
      protein: "добрати білок",
      water: "підтягнути воду",
      fiber: "додати клітковину",
      calories_high: "заспокоїти решту дня",
      calories_low: "додати енергію без хаосу",
      steady: "утримати стабільний ритм",
    } satisfies Record<DailyContextFocus, string>,
    improveLabels: {
      log_first_meal: "Почніть з одного простого запису, щоб AI бачив реальний день.",
      complete_day: "Додайте ще один повноцінний слот їжі перед висновками.",
      protein: "Наступний прийом краще зібрати навколо 25-35 г білка.",
      water: "Додайте склянку зараз і поверніться до темпу маленькими порціями.",
      fiber: "Додайте овочі, фрукти або крупу з клітковиною.",
      calories_high: "Решту дня тримайте легшою: білок, овочі, вода.",
      calories_low: "Додайте нормальний прийом їжі, щоб вечір не став наздоганянням.",
      steady: "Повторіть структуру, яка вже працює.",
    } satisfies Record<DailyContextFocus, string>,
    waterDone: "Норма води закрита.",
    waterLogged: "Воду додано.",
    noFood: "Їжі ще немає. Почніть з фото, пошуку або штрихкоду.",
    entries: "{value} записів",
    aiStart:
      "Почніть з одного прийому їжі. Після першого запису я підкажу, що краще додати далі.",
    aiWater:
      "Вода відстає від темпу. Додайте один стакан зараз, а їжу залишимо без стресу.",
    aiProtein:
      "Білок нижче плану. Наступний прийом краще зібрати навколо яєць, йогурту, сиру або курки.",
    aiComplete:
      "День ще неповний. Додайте один нормальний прийом їжі, а потім вже коригуйте деталі.",
    aiFiber:
      "Клітковини мало. Додайте овочі, фрукти або крупу — це вирівняє ситість.",
    aiCaloriesLow:
      "Калорій ще мало для плану. Краще додати спокійний прийом їжі зараз, ніж наздоганяти ввечері.",
    aiLimit:
      "Калорії близько до плану. Далі краще білок, овочі і легка вечеря.",
    aiGood: "День виглядає рівно. Тримайте темп і не забувайте про воду.",
  },
  pl: {
    productLine: "Ty jesz. Ja myślę za Ciebie.",
    productSubtitle:
      "Jeden ekran na decyzję teraz: dodaj jedzenie, domknij wodę i zobacz kolejny krok bez nadmiaru kart.",
    startMeal: "Dodaj posiłek",
    addWater: "Dodaj wodę",
    askAssistant: "Zapytaj asystenta",
    quickActions: "Jak dodać jedzenie",
    actionHint: "Wybierz najszybszą metodę. Resztę doprecyzujesz później.",
    actions: {
      photo: {
        title: "Zdjęcie",
        body: "Zrób zdjęcie talerza, sprawdź szkic i dodaj do dziennika.",
      },
      search: {
        title: "Wyszukaj",
        body: "Znajdź produkt po nazwie i szybko ustaw porcję.",
      },
      barcode: {
        title: "Kod kreskowy",
        body: "Skanuj opakowanie albo wpisz kod ręcznie.",
      },
    } satisfies Record<MealActionMode, { title: string; body: string }>,
    dayStatus: "Dzień teraz",
    wellness: "Stan wellness",
    calories: "Kalorie",
    eaten: "Zjedzono",
    left: "Zostało",
    water: "Woda",
    protein: "Białko",
    macros: "BTW",
    weight: "Waga",
    streak: "Seria",
    mood: "Nastrój",
    level: "Poziom",
    calmMood: "spokojny",
    focusedMood: "skupiony",
    recoveryMood: "regeneracja",
    days: "dni",
    todayFood: "Jedzenie dzisiaj",
    assistant: "Asystent obok",
    nextStep: "Kolejna akcja",
    goalToday: "Cel na dziś",
    progressDone: "Wykonano",
    weekProgress: "Tydzień",
    improveToday: "Popraw dziś",
    weekLogged: (days: number) => `${days}/7 dni z wpisami`,
    focusLabels: {
      log_first_meal: "dodać pierwszy posiłek",
      complete_day: "domknąć bazową strukturę dnia",
      protein: "uzupełnić białko",
      water: "podciągnąć wodę",
      fiber: "dodać błonnik",
      calories_high: "uspokoić resztę dnia",
      calories_low: "dodać energię bez chaosu",
      steady: "utrzymać stabilny rytm",
    } satisfies Record<DailyContextFocus, string>,
    improveLabels: {
      log_first_meal: "Zacznij od jednego prostego wpisu, żeby AI widziało realny dzień.",
      complete_day: "Dodaj jeszcze jeden pełny slot jedzenia przed mocniejszymi wnioskami.",
      protein: "Kolejny posiłek oprzyj o 25-35 g białka.",
      water: "Dodaj szklankę teraz i wróć do tempa małymi porcjami.",
      fiber: "Dodaj warzywa, owoce albo produkt z błonnikiem.",
      calories_high: "Resztę dnia trzymaj lżej: białko, warzywa, woda.",
      calories_low: "Dodaj normalny posiłek teraz, zamiast nadrabiać wieczorem.",
      steady: "Powtórz strukturę, która już działa.",
    } satisfies Record<DailyContextFocus, string>,
    waterDone: "Norma wody zamknięta.",
    waterLogged: "Dodano wodę.",
    noFood: "Nie ma jeszcze jedzenia. Zacznij od zdjęcia, wyszukiwania albo kodu.",
    entries: "{value} wpisów",
    aiStart:
      "Zacznij od jednego posiłku. Po pierwszym wpisie podpowiem, co najlepiej dodać dalej.",
    aiWater:
      "Woda jest poniżej tempa. Dodaj teraz jedną szklankę, a jedzenie zostawimy bez stresu.",
    aiProtein:
      "Białko jest poniżej planu. Następny posiłek oprzyj o jajka, jogurt, twaróg albo kurczaka.",
    aiComplete:
      "Dzień jest jeszcze niepełny. Dodaj jeden normalny posiłek, a dopiero potem koryguj szczegóły.",
    aiFiber:
      "Błonnika jest mało. Dodaj warzywa, owoce albo kaszę, żeby ustabilizować sytość.",
    aiCaloriesLow:
      "Kalorii jest jeszcze mało względem planu. Lepiej dodać spokojny posiłek teraz niż nadrabiać wieczorem.",
    aiLimit:
      "Kalorie są blisko planu. Dalej najlepiej białko, warzywa i lekka kolacja.",
    aiGood: "Dzień wygląda równo. Utrzymaj tempo i pamiętaj o wodzie.",
  },
  en: {
    productLine: "You eat. I think with you.",
    productSubtitle:
      "One screen for the decision now: add food, close water, and see the next step without extra panels.",
    startMeal: "Add meal",
    addWater: "Add water",
    askAssistant: "Ask assistant",
    quickActions: "How to add food",
    actionHint: "Choose the fastest method. Everything else can be refined later.",
    actions: {
      photo: {
        title: "Photo",
        body: "Take a plate photo, review the draft, and add it to the diary.",
      },
      search: {
        title: "Search",
        body: "Find a product by name and set the portion quickly.",
      },
      barcode: {
        title: "Barcode",
        body: "Scan the package or enter the code manually.",
      },
    } satisfies Record<MealActionMode, { title: string; body: string }>,
    dayStatus: "Day now",
    wellness: "Wellness state",
    calories: "Calories",
    eaten: "Eaten",
    left: "Left",
    water: "Water",
    protein: "Protein",
    macros: "Macros",
    weight: "Weight",
    streak: "Streak",
    mood: "Mood",
    level: "Level",
    calmMood: "calm",
    focusedMood: "focused",
    recoveryMood: "recovery",
    days: "days",
    todayFood: "Food today",
    assistant: "Assistant nearby",
    nextStep: "Next action",
    goalToday: "Today’s goal",
    progressDone: "Complete",
    weekProgress: "Week",
    improveToday: "Improve today",
    weekLogged: (days: number) => `${days}/7 days logged`,
    focusLabels: {
      log_first_meal: "log the first meal",
      complete_day: "complete the day structure",
      protein: "close the protein gap",
      water: "catch up on water",
      fiber: "add fiber",
      calories_high: "settle the rest of the day",
      calories_low: "add energy without chaos",
      steady: "keep the steady rhythm",
    } satisfies Record<DailyContextFocus, string>,
    improveLabels: {
      log_first_meal: "Start with one simple log so the AI can read the real day.",
      complete_day: "Add one more proper meal slot before making bigger adjustments.",
      protein: "Build the next meal around 25-35 g of protein.",
      water: "Add one glass now and return to pace in small portions.",
      fiber: "Add vegetables, fruit, or a fiber-rich grain.",
      calories_high: "Keep the rest of the day lighter: protein, vegetables, water.",
      calories_low: "Add a real meal now instead of catching up late.",
      steady: "Repeat the structure that is already working.",
    } satisfies Record<DailyContextFocus, string>,
    waterDone: "Water goal closed.",
    waterLogged: "Water added.",
    noFood: "No food yet. Start with a photo, search, or barcode.",
    entries: "{value} entries",
    aiStart:
      "Start with one meal. After the first log I can suggest what to add next.",
    aiWater:
      "Water is behind pace. Add one glass now and keep food stress-free.",
    aiProtein:
      "Protein is below plan. Build the next meal around eggs, yogurt, cottage cheese, or chicken.",
    aiComplete:
      "The day is still incomplete. Add one proper meal first, then adjust the details.",
    aiFiber:
      "Fiber is low. Add vegetables, fruit, or grains to make satiety steadier.",
    aiCaloriesLow:
      "Calories are still low for the plan. Add a calm meal now instead of catching up tonight.",
    aiLimit:
      "Calories are close to plan. Next, lean protein, vegetables, and a light dinner will fit best.",
    aiGood: "The day looks steady. Keep the pace and remember water.",
  },
} as const;

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const water = useSelector((state: RootState) => state.water);
  const motivation = useSelector((state: RootState) => state.profile.motivation);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const items = useSelector(selectMealItems);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const todayItems = useSelector(selectTodayMealItems);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const currentWeight = useSelector(selectCurrentWeight);
  const { appLanguage, t } = useLanguage();
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
  const calorieProgress = Math.min(dailyContext.progress.calories, 100);
  const remainingCalories = dailyContext.gaps.calories;
  const remainingWaterMl = dailyContext.gaps.waterMl;
  const waterProgress = Math.min(dailyContext.progress.water, 100);
  const proteinProgress = Math.min(dailyContext.progress.protein, 100);
  const actionModes: MealActionMode[] = ["photo", "search", "barcode"];

  const macroItems = [
    {
      label: t("dashboard.protein"),
      value: macroProgress.protein.current,
      target: macroProgress.protein.target,
      progress: macroProgress.protein.progress,
      color: "#0f766e",
    },
    {
      label: t("dashboard.fat"),
      value: macroProgress.fat.current,
      target: macroProgress.fat.target,
      progress: macroProgress.fat.progress,
      color: "#f97316",
    },
    {
      label: t("dashboard.carbs"),
      value: macroProgress.carbs.current,
      target: macroProgress.carbs.target,
      progress: macroProgress.carbs.progress,
      color: "#2563eb",
    },
  ];

  const streakDays = useMemo(() => {
    const completedDays = new Set(
      motivation.history
        .filter((item) => !item.skipped)
        .map((item) => item.completedAt.slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date();

    while (completedDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [motivation.history]);

  const assistantAdvice = useMemo(() => {
    switch (dailyContext.primaryFocus) {
      case "log_first_meal":
        return copy.aiStart;
      case "complete_day":
        return copy.aiComplete;
      case "water":
        return copy.aiWater;
      case "protein":
        return copy.aiProtein;
      case "fiber":
        return copy.aiFiber;
      case "calories_high":
        return copy.aiLimit;
      case "calories_low":
        return copy.aiCaloriesLow;
      case "steady":
      default:
        return copy.aiGood;
    }
  }, [
    copy.aiCaloriesLow,
    copy.aiComplete,
    copy.aiFiber,
    copy.aiGood,
    copy.aiLimit,
    copy.aiProtein,
    copy.aiStart,
    copy.aiWater,
    dailyContext.primaryFocus,
  ]);

  const nextAction = useMemo(() => {
    if (
      dailyContext.primaryFocus === "log_first_meal" ||
      dailyContext.primaryFocus === "complete_day" ||
      dailyContext.primaryFocus === "protein" ||
      dailyContext.primaryFocus === "fiber" ||
      dailyContext.primaryFocus === "calories_low"
    ) {
      return {
        label: copy.startMeal,
        to: `/food?mode=search&mealType=${dailyContext.suggestedMealType}`,
      };
    }

    if (dailyContext.primaryFocus === "water") {
      return { label: copy.addWater, to: null };
    }

    return { label: copy.askAssistant, to: "/coach" };
  }, [
    copy.addWater,
    copy.askAssistant,
    copy.startMeal,
    dailyContext.primaryFocus,
    dailyContext.suggestedMealType,
  ]);

  const moodLabel =
    dailyContext.progress.calories > 105 || waterProgress < 35
      ? copy.recoveryMood
      : proteinProgress >= 70 && waterProgress >= 70
        ? copy.focusedMood
        : copy.calmMood;
  const dailyBriefItems = [
    {
      label: copy.goalToday,
      value: copy.focusLabels[dailyContext.primaryFocus],
    },
    {
      label: copy.progressDone,
      value: `${Math.round(calorieProgress)}%`,
    },
    {
      label: copy.weekProgress,
      value: copy.weekLogged(dailyContext.week.daysLogged),
    },
    {
      label: copy.improveToday,
      value: copy.improveLabels[dailyContext.primaryFocus],
    },
  ];

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const handleMealAction = (mode: MealActionMode) => {
    navigate(`/food?mode=${mode}`);
  };

  const handleNextAction = () => {
    if (nextAction.to) {
      navigate(nextAction.to);
      return;
    }

    dispatch(incrementWater(water.glassSizeMl));
    toast.success(copy.waterLogged);
  };

  const handleAddWater = () => {
    dispatch(incrementWater(water.glassSizeMl));
    toast.success(copy.waterLogged);
  };

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          color: "white",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.94) 58%, rgba(37,99,235,0.88) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={1.2} sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
              Smart Nutrition
            </Typography>
            <Typography
              component="h1"
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: 34, md: 48 },
                overflowWrap: "anywhere",
              }}
            >
              {copy.productLine}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.84)", maxWidth: 720 }}>
              {copy.productSubtitle}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={
                  <span>
                    {copy.left}:{" "}
                    <CountUp end={remainingCalories} duration={0.7} decimals={0} />{" "}
                    {t("common.kcal")}
                  </span>
                }
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.28)" }}
                variant="outlined"
              />
              <Chip
                label={
                  <span>
                    {copy.water}: <CountUp end={remainingWaterMl} duration={0.7} /> ml
                  </span>
                }
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.28)" }}
                variant="outlined"
              />
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button
                variant="contained"
                onClick={() => navigate("/food?mode=search")}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  backgroundColor: "#ffffff",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
              >
                {copy.startMeal}
              </Button>
              <Button
                variant="outlined"
                onClick={handleAddWater}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.42)",
                  "&:hover": {
                    borderColor: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {copy.addWater}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/coach")}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.42)",
                  "&:hover": {
                    borderColor: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {copy.askAssistant}
              </Button>
            </Stack>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", md: 300 },
              p: 2,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "white",
            }}
          >
            <Stack direction="row" spacing={1.4} alignItems="center">
              <AssistantAvatar
                name={assistant.name}
                variant={assistant.companionKind}
                size={58}
                mood={todayItems.length === 0 ? "coach" : "happy"}
                active
              />
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900 }}>{copy.assistant}</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                  {assistantAdvice}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.2,
        }}
      >
        {dailyBriefItems.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              p: { xs: 1.6, md: 1.8 },
              borderRadius: 1,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              backgroundColor: "rgba(255,255,255,0.9)",
              minHeight: 112,
            }}
          >
            <Stack spacing={0.7}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                {item.label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: item.value.length > 44 ? 16 : 19,
                  overflowWrap: "anywhere",
                  lineHeight: 1.25,
                }}
              >
                {item.value}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Stack spacing={1.6}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack spacing={0.4}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                {copy.quickActions}
              </Typography>
              <Typography color="text.secondary">{copy.actionHint}</Typography>
            </Stack>
            <Button
              variant="contained"
              onClick={handleNextAction}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {nextAction.label}
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {actionModes.map((mode, index) => {
              const action = copy.actions[mode];

              return (
                <Paper
                  key={mode}
                  component="button"
                  type="button"
                  onClick={() => handleMealAction(mode)}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    textAlign: "left",
                    cursor: "pointer",
                    backgroundColor: "rgba(248,250,252,0.82)",
                    borderColor: "rgba(15, 23, 42, 0.1)",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "rgba(240,253,250,0.88)",
                    },
                  }}
                >
                  <Stack spacing={1}>
                    <Chip
                      label={`0${index + 1}`}
                      size="small"
                      sx={{ alignSelf: "flex-start", fontWeight: 900 }}
                    />
                    <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                      {action.title}
                    </Typography>
                    <Typography color="text.secondary">{action.body}</Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack spacing={0.4}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {copy.dayStatus}
                </Typography>
                <Typography color="text.secondary">
                  {copy.eaten}: {totals.calories.toFixed(0)} / {dailyCalories}{" "}
                  {t("common.kcal")}
                </Typography>
              </Stack>
              <Chip
                label={`${Math.round(calorieProgress)}%`}
                color={calorieProgress > 92 ? "warning" : "success"}
                variant="outlined"
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={calorieProgress}
              sx={{
                height: 14,
                borderRadius: 999,
                bgcolor: "rgba(15,23,42,0.08)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: calorieProgress > 92 ? "#f97316" : "#0f766e",
                },
              }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Typography color="text.secondary">{copy.calories}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  <CountUp end={remainingCalories} duration={0.65} decimals={0} />{" "}
                  {t("common.kcal")}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Typography color="text.secondary">{copy.water}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  {remainingWaterMl > 0 ? (
                    <>
                      <CountUp end={remainingWaterMl} duration={0.65} /> ml
                    </>
                  ) : (
                    copy.waterDone
                  )}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Typography color="text.secondary">{copy.todayFood}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  {todayItems.length > 0
                    ? copy.entries.replace("{value}", String(todayItems.length))
                    : copy.noFood}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={2}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
              {copy.macros}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1.2,
              }}
            >
              {macroItems.map((macro) => (
                <Stack key={macro.label} spacing={1} alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      width: { xs: 74, sm: 88 },
                      height: { xs: 74, sm: 88 },
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: `conic-gradient(${macro.color} ${macro.progress * 3.6}deg, rgba(226,232,240,0.9) 0deg)`,
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 56, sm: 66 },
                        height: { xs: 56, sm: 66 },
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.98)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: macro.color }}>
                        {Math.round(macro.progress)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{macro.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {macro.value.toFixed(0)} / {macro.target.toFixed(0)} {t("common.g")}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
            {copy.wellness}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.2,
            }}
          >
            {[
              {
                label: copy.weight,
                value: `${currentWeight.toFixed(1)} ${t("common.kg")}`,
              },
              {
                label: copy.streak,
                value: `${streakDays} ${copy.days}`,
              },
              {
                label: copy.mood,
                value: moodLabel,
              },
              {
                label: copy.level,
                value: String(motivation.level),
              },
            ].map((item) => (
              <Paper
                key={item.label}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1, minHeight: 86 }}
              >
                <Typography color="text.secondary">{item.label}</Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 20 }}>
                  {item.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
              {copy.nextStep}
            </Typography>
            <Typography color="text.secondary">{assistantAdvice}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={handleAddWater}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              +{water.glassSizeMl} ml
            </Button>
            <Button
              variant="text"
              onClick={() => navigate("/coach")}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              {copy.askAssistant}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <LearningHubCard />
    </Stack>
  );
};

export default HomePage;
