import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { incrementWater } from "../features/water/waterSlice";
import { useLanguage } from "../shared/language";
import { selectDailyMacroProgress } from "../features/profile/selectors";
import { AssistantAvatar } from "../shared/components/AssistantAvatar";

type MealActionMode = "photo" | "search" | "barcode";

const homeCopy = {
  uk: {
    productLine: "Ви їсте. Я думаю за вас.",
    productSubtitle:
      "Один екран для рішення на зараз: додати їжу, закрити воду і побачити наступний крок без зайвих карток.",
    startMeal: "Додати прийом їжі",
    addWater: "Додати воду",
    askAssistant: "Запитати companion",
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
    calories: "Калорії",
    eaten: "З'їдено",
    left: "Залишилось",
    water: "Вода",
    protein: "Білок",
    macros: "БЖВ",
    todayFood: "Їжа сьогодні",
    assistant: "Companion поруч",
    nextStep: "Наступна дія",
    waterDone: "Норма води закрита.",
    noFood: "Їжі ще немає. Почніть з фото, пошуку або штрихкоду.",
    entries: "{value} записів",
    aiStart:
      "Почніть з одного прийому їжі. Після першого запису я підкажу, що краще додати далі.",
    aiWater:
      "Вода відстає від темпу. Додайте один стакан зараз, а їжу залишимо без стресу.",
    aiProtein:
      "Білок нижче плану. Наступний прийом краще зібрати навколо яєць, йогурту, сиру або курки.",
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
    askAssistant: "Zapytaj companion",
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
    calories: "Kalorie",
    eaten: "Zjedzono",
    left: "Zostało",
    water: "Woda",
    protein: "Białko",
    macros: "BTW",
    todayFood: "Jedzenie dzisiaj",
    assistant: "Companion obok",
    nextStep: "Kolejna akcja",
    waterDone: "Norma wody zamknięta.",
    noFood: "Nie ma jeszcze jedzenia. Zacznij od zdjęcia, wyszukiwania albo kodu.",
    entries: "{value} wpisów",
    aiStart:
      "Zacznij od jednego posiłku. Po pierwszym wpisie podpowiem, co najlepiej dodać dalej.",
    aiWater:
      "Woda jest poniżej tempa. Dodaj teraz jedną szklankę, a jedzenie zostawimy bez stresu.",
    aiProtein:
      "Białko jest poniżej planu. Następny posiłek oprzyj o jajka, jogurt, twaróg albo kurczaka.",
    aiLimit:
      "Kalorie są blisko planu. Dalej najlepiej białko, warzywa i lekka kolacja.",
    aiGood: "Dzień wygląda równo. Utrzymaj tempo i pamiętaj o wodzie.",
  },
} as const;

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector((state: RootState) => state.profile.dailyCalories);
  const water = useSelector((state: RootState) => state.water);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const totals = useSelector(selectTodayMealTotalNutrients);
  const todayItems = useSelector(selectTodayMealItems);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const { language, t } = useLanguage();
  const copy = homeCopy[language];
  const calorieProgress = dailyCalories
    ? Math.min((totals.calories / dailyCalories) * 100, 100)
    : 0;
  const remainingCalories = Math.max(dailyCalories - totals.calories, 0);
  const remainingWaterMl = Math.max(water.dailyTargetMl - water.consumedMl, 0);
  const waterProgress = water.dailyTargetMl
    ? Math.min((water.consumedMl / water.dailyTargetMl) * 100, 100)
    : 0;
  const proteinProgress = macroProgress.protein.progress;
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

  const assistantAdvice = useMemo(() => {
    if (todayItems.length === 0) {
      return copy.aiStart;
    }

    if (waterProgress < 45) {
      return copy.aiWater;
    }

    if (proteinProgress < 55) {
      return copy.aiProtein;
    }

    if (calorieProgress > 92) {
      return copy.aiLimit;
    }

    return copy.aiGood;
  }, [
    calorieProgress,
    copy.aiGood,
    copy.aiLimit,
    copy.aiProtein,
    copy.aiStart,
    copy.aiWater,
    proteinProgress,
    todayItems.length,
    waterProgress,
  ]);

  const nextAction = useMemo(() => {
    if (todayItems.length === 0) {
      return { label: copy.startMeal, to: "/meals?mode=photo" };
    }

    if (remainingWaterMl > 0 && waterProgress < 70) {
      return { label: copy.addWater, to: null };
    }

    return { label: copy.askAssistant, to: "/ai" };
  }, [
    copy.addWater,
    copy.askAssistant,
    copy.startMeal,
    remainingWaterMl,
    todayItems.length,
    waterProgress,
  ]);

  if (!user) {
    return <Typography>{t("dashboard.needLogin")}</Typography>;
  }

  const handleMealAction = (mode: MealActionMode) => {
    navigate(`/meals?mode=${mode}`);
  };

  const handleNextAction = () => {
    if (nextAction.to) {
      navigate(nextAction.to);
      return;
    }

    dispatch(incrementWater(water.glassSizeMl));
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
                label={`${copy.left}: ${remainingCalories.toFixed(0)} ${t("common.kcal")}`}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.28)" }}
                variant="outlined"
              />
              <Chip
                label={`${copy.water}: ${remainingWaterMl} ml`}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.28)" }}
                variant="outlined"
              />
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
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
                  {remainingCalories.toFixed(0)} {t("common.kcal")}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Typography color="text.secondary">{copy.water}</Typography>
                <Typography sx={{ fontWeight: 900 }}>
                  {remainingWaterMl > 0 ? `${remainingWaterMl} ml` : copy.waterDone}
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
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {copy.nextStep}
            </Typography>
            <Typography color="text.secondary">{assistantAdvice}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={() => dispatch(incrementWater(water.glassSizeMl))}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              +{water.glassSizeMl} ml
            </Button>
            <Button
              variant="text"
              onClick={() => navigate("/ai")}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              {copy.askAssistant}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default HomePage;
