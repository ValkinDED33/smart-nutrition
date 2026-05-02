import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import {
  generateNutritionCoachAnalysis,
  type NutritionCoachAnalysis,
  type NutritionCoachInsight,
  type NutritionCoachStatus,
} from "../../shared/lib/nutritionCoach";
import { selectMealItems } from "./selectors";

const coachCopy = {
  uk: {
    title: "Харчовий коуч",
    subtitle: (name: string) =>
      `${name} переглянув останні 7 днів і підсвітив, що зараз найсильніше впливає на результат.`,
    score: "Оцінка коуча",
    focus: "Головний фокус",
    nextAction: "Наступна дія",
    stats: {
      daysLogged: "Днів із логами",
      avgCalories: "Сер. калорії",
      avgProtein: "Сер. білок",
      avgWater: "Сер. вода",
      avgFiber: "Сер. клітковина",
      meals: "Сер. прийоми їжі",
      skippedBreakfast: "Пропущені сніданки",
    },
    status: {
      strong: "Тиждень сильний",
      steady: "Рух стабільний",
      attention: "Потрібна корекція",
    } satisfies Record<NutritionCoachStatus, string>,
    insights: {
      logging_low: {
        title: "Логування ще нестабільне",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Зафіксовано лише ${analysis.daysLogged} із 7 останніх днів. Поки даних мало, рекомендації менш точні.`,
        action: "Закрийте щонайменше 4 повні дні щоденника цього тижня.",
      },
      protein_low: {
        title: "Білка замало для поточної мети",
        detail: (analysis: NutritionCoachAnalysis) =>
          `У середньому ${analysis.averageProtein.toFixed(0)} г білка при цілі ${analysis.proteinTarget.toFixed(0)} г.`,
        action: "Додайте ще один чіткий білковий прийом їжі або перекус щодня.",
      },
      water_low: {
        title: "Води замало для стабільного дня",
        detail: (analysis: NutritionCoachAnalysis) =>
          `У середньому ${analysis.averageWater.toFixed(0)} мл при цілі ${analysis.waterTarget.toFixed(0)} мл.`,
        action: "Поставте 2-3 контрольні порції води до вечора і закривайте їх у трекері.",
      },
      breakfast_skipped: {
        title: "Сніданок часто пропущений",
        detail: (analysis: NutritionCoachAnalysis) =>
          `За останні 7 днів сніданок пропущено ${analysis.breakfastSkippedDays} раз(и) у днях із логами.`,
        action: "Підготуйте простий перший прийом із білком, щоб не наздоганяти день ввечері.",
      },
      fiber_low: {
        title: "Клітковина просідає",
        detail: (analysis: NutritionCoachAnalysis) =>
          `У середньому ${analysis.averageFiber.toFixed(0)} г клітковини при базовій цілі ${analysis.fiberTarget} г.`,
        action: "Підніміть овочі, бобові, фрукти або цільні зерна в одному з прийомів їжі.",
      },
      calories_high: {
        title: "Середні калорії вище цілі",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Тижневий середній рівень ${analysis.averageCalories.toFixed(0)} ккал при цілі ${analysis.calorieTarget.toFixed(0)} ккал.`,
        action: "Почніть із корекції одного найкалорійнішого прийому їжі, а не всього дня одразу.",
      },
      calories_low: {
        title: "Середні калорії нижче цілі",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Тижневий середній рівень ${analysis.averageCalories.toFixed(0)} ккал при цілі ${analysis.calorieTarget.toFixed(0)} ккал.`,
        action: "Додайте стабільний прийом їжі або один щільніший перекус у найслабший час дня.",
      },
      meal_pattern: {
        title: "Ритм прийомів їжі нерівний",
        detail: (analysis: NutritionCoachAnalysis) =>
          `У середньому лише ${analysis.averageMeals.toFixed(1)} повноцінних слотів їжі на день із логами.`,
        action: "Вирівняйте хоча б 3 базові точки: сніданок, обід і вечерю.",
      },
      weight_trend: {
        title: "Тренд ваги не підтримує ціль",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Зміна ваги за доступною історією становить ${analysis.weightChange.toFixed(1)} кг.`,
        action: "Перевірте відповідність цілі калорій і внесіть 1 корекцію на найближчі 7 днів.",
      },
      on_track: {
        title: "Раціон виглядає збалансовано",
        detail: () =>
          "Логи стабільні, середні калорії не плавають критично, а білок тримається близько до цілі.",
        action: "Продовжуйте в тому ж ритмі й не знижуйте якість логування.",
      },
    },
  },
  pl: {
    title: "Coach żywieniowy",
    subtitle: (name: string) =>
      `${name} przejrzał ostatnie 7 dni i wskazał, co teraz najmocniej wpływa na wynik.`,
    score: "Ocena coacha",
    focus: "Główny fokus",
    nextAction: "Następny krok",
    stats: {
      daysLogged: "Dni z logami",
      avgCalories: "Śr. kalorie",
      avgProtein: "Śr. białko",
      avgWater: "Śr. woda",
      avgFiber: "Śr. błonnik",
      meals: "Śr. posiłki",
      skippedBreakfast: "Pominięte śniadania",
    },
    status: {
      strong: "Mocny tydzień",
      steady: "Stabilny kierunek",
      attention: "Wymaga korekty",
    } satisfies Record<NutritionCoachStatus, string>,
    insights: {
      logging_low: {
        title: "Logowanie jest jeszcze niestabilne",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Zapisane są tylko ${analysis.daysLogged} z ostatnich 7 dni. Przy małej ilości danych wskazówki są mniej precyzyjne.`,
        action: "Domknij przynajmniej 4 pełne dni dziennika w tym tygodniu.",
      },
      protein_low: {
        title: "Białka jest za mało względem celu",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnio ${analysis.averageProtein.toFixed(0)} g białka przy celu ${analysis.proteinTarget.toFixed(0)} g.`,
        action: "Dodaj jeden wyraźnie białkowy posiłek albo przekąskę każdego dnia.",
      },
      water_low: {
        title: "Wody jest za mało dla stabilnego dnia",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnio ${analysis.averageWater.toFixed(0)} ml przy celu ${analysis.waterTarget.toFixed(0)} ml.`,
        action: "Ustaw 2-3 kontrolne porcje wody do wieczora i domykaj je w trackerze.",
      },
      breakfast_skipped: {
        title: "Śniadanie często wypada",
        detail: (analysis: NutritionCoachAnalysis) =>
          `W ostatnich 7 dniach śniadanie pominięto ${analysis.breakfastSkippedDays} razy w dniach z logami.`,
        action: "Przygotuj prosty pierwszy posiłek z białkiem, żeby nie nadrabiać dnia wieczorem.",
      },
      fiber_low: {
        title: "Błonnik wypada zbyt nisko",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnio ${analysis.averageFiber.toFixed(0)} g błonnika przy bazowym celu ${analysis.fiberTarget} g.`,
        action: "Podnieś warzywa, strączki, owoce albo pełne ziarna w jednym z posiłków.",
      },
      calories_high: {
        title: "Średnie kalorie są powyżej celu",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnia tygodniowa to ${analysis.averageCalories.toFixed(0)} kcal przy celu ${analysis.calorieTarget.toFixed(0)} kcal.`,
        action: "Skoryguj najcięższy posiłek dnia zamiast ciąć cały plan naraz.",
      },
      calories_low: {
        title: "Średnie kalorie są poniżej celu",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnia tygodniowa to ${analysis.averageCalories.toFixed(0)} kcal przy celu ${analysis.calorieTarget.toFixed(0)} kcal.`,
        action: "Dodaj stały posiłek albo jeden bardziej sycący snack w najsłabszej porze dnia.",
      },
      meal_pattern: {
        title: "Rytm posiłków jest nierówny",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Średnio tylko ${analysis.averageMeals.toFixed(1)} pełnych slotów posiłków na zalogowany dzień.`,
        action: "Ustabilizuj przynajmniej 3 punkty żywienia: śniadanie, obiad i kolację.",
      },
      weight_trend: {
        title: "Trend masy nie wspiera celu",
        detail: (analysis: NutritionCoachAnalysis) =>
          `Zmiana masy na dostępnej historii wynosi ${analysis.weightChange.toFixed(1)} kg.`,
        action: "Sprawdź dopasowanie celu kalorii i wprowadź 1 korektę na najbliższe 7 dni.",
      },
      on_track: {
        title: "Plan wygląda stabilnie",
        detail: () =>
          "Logi są regularne, średnie kalorie nie uciekają mocno od celu, a białko trzyma rozsądny poziom.",
        action: "Utrzymaj obecny rytm i nie obniżaj jakości logowania.",
      },
    },
  },
} as const;

const statusColor = {
  strong: "success",
  steady: "info",
  attention: "warning",
} as const;

const insightAccent = {
  success: {
    borderColor: "rgba(34, 197, 94, 0.3)",
    backgroundColor: "rgba(240, 253, 244, 0.82)",
  },
  warning: {
    borderColor: "rgba(245, 158, 11, 0.35)",
    backgroundColor: "rgba(255, 251, 235, 0.82)",
  },
  info: {
    borderColor: "rgba(59, 130, 246, 0.22)",
    backgroundColor: "rgba(248,250,252,0.92)",
  },
} as const;

const formatAverageMeals = (value: number) => value.toFixed(1);

export const NutritionCoachCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector(selectMealItems);
  const profile = useSelector((state: RootState) => state.profile);
  const waterHistory = useSelector((state: RootState) => state.water.history);
  const { language } = useLanguage();

  if (!user) {
    return null;
  }

  const copy = coachCopy[language];
  const analysis = generateNutritionCoachAnalysis({
    items,
    dailyCalories: profile.dailyCalories,
    goal: profile.goal,
    dietStyle: profile.dietStyle,
    weight: user.weight,
    weightHistory: profile.weightHistory,
    waterHistory,
  });

  const primaryInsight = analysis.insights[0] ?? {
    code: "on_track",
    severity: "success",
    priority: 0,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.6}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">
              {copy.subtitle(profile.assistant.name)}
            </Typography>
          </Stack>
          <Chip
            label={`${copy.score}: ${analysis.score}/100`}
            color={statusColor[analysis.status]}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.stats.daysLogged}: ${analysis.daysLogged}/7`} />
          <Chip label={`${copy.stats.avgCalories}: ${analysis.averageCalories.toFixed(0)} kcal`} />
          <Chip label={`${copy.stats.avgProtein}: ${analysis.averageProtein.toFixed(0)} g`} />
          {analysis.waterTarget > 0 && (
            <Chip label={`${copy.stats.avgWater}: ${analysis.averageWater.toFixed(0)} ml`} />
          )}
          <Chip label={`${copy.stats.avgFiber}: ${analysis.averageFiber.toFixed(0)} g`} />
          {analysis.breakfastSkippedDays > 0 && (
            <Chip label={`${copy.stats.skippedBreakfast}: ${analysis.breakfastSkippedDays}`} />
          )}
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 4,
            borderColor: "rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(135deg, rgba(240,249,255,0.86) 0%, rgba(236,253,245,0.88) 100%)",
          }}
        >
          <Stack spacing={0.6}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: "#0f766e" }}>
              {copy.status[analysis.status]}
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>
              {copy.focus}: {copy.insights[primaryInsight.code].title}
            </Typography>
            <Typography color="text.secondary">
              {copy.insights[primaryInsight.code].detail(analysis)}
            </Typography>
          </Stack>
        </Paper>

        <Stack
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {analysis.insights.map((insight: NutritionCoachInsight) => {
            const localizedInsight = copy.insights[insight.code];

            return (
              <Paper
                key={insight.code}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 4,
                  ...insightAccent[insight.severity],
                }}
              >
                <Stack spacing={0.8}>
                  <Typography sx={{ fontWeight: 800 }}>{localizedInsight.title}</Typography>
                  <Typography color="text.secondary">
                    {localizedInsight.detail(analysis)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {copy.nextAction}: {localizedInsight.action}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {copy.stats.daysLogged}: {analysis.daysLogged}/7 | {copy.stats.avgCalories}:{" "}
          {analysis.averageCalories.toFixed(0)} kcal | {copy.stats.avgProtein}:{" "}
          {analysis.averageProtein.toFixed(0)} g | {copy.stats.avgFiber}:{" "}
          {analysis.averageFiber.toFixed(0)} g | {copy.stats.avgWater}:{" "}
          {analysis.averageWater.toFixed(0)} ml | {copy.stats.meals}:{" "}
          {formatAverageMeals(analysis.averageMeals)}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default NutritionCoachCard;
