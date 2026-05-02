import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { MealType } from "../types/meal";
import { useLanguage } from "../language";
import { getDaysSince } from "../lib/bodyMetrics";
import { generateNutritionCoachAnalysis } from "../lib/nutritionCoach";
import { syncWaterDay } from "../../features/water/waterSlice";

const STORAGE_KEY = "smart-nutrition.notification-log";

const formatLocalDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameLocalDay = (value: string, currentDate: Date) => {
  const parsed = new Date(value);

  return (
    parsed.getFullYear() === currentDate.getFullYear() &&
    parsed.getMonth() === currentDate.getMonth() &&
    parsed.getDate() === currentDate.getDate()
  );
};

const parseTimeToMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
};

const readNotificationLog = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    return {};
  }
};

const writeNotificationLog = (value: Record<string, true>) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const maybeSendNotification = (key: string, title: string, body: string) => {
  const notificationLog = readNotificationLog();

  if (notificationLog[key]) {
    return;
  }

  notificationLog[key] = true;
  writeNotificationLog(notificationLog);
  new Notification(title, { body, silent: true });
};

const mealNotificationCopy = {
  uk: {
    breakfast: {
      title: "Чек-ін по сніданку",
      body: "Сніданок ще не зафіксований. Додайте його, поки деталі свіжі в пам'яті.",
    },
    lunch: {
      title: "Нагадування про обід",
      body: "Обід ще не в щоденнику. Швидкий запис зараз збереже точність дня.",
    },
    dinner: {
      title: "Нагадування про вечерю",
      body: "Вечеря ще не записана. Додайте її до завершення дня.",
    },
    snack: {
      title: "Нагадування про перекус",
      body: "Для перекусу настав час нагадування. Додайте його або скоригуйте план, якщо пропустили.",
    },
  },
  pl: {
    breakfast: {
      title: "Check-in śniadania",
      body: "Śniadanie nie jest jeszcze zapisane. Dodaj je, póki szczegóły są świeże.",
    },
    lunch: {
      title: "Przypomnienie o obiedzie",
      body: "Obiad nie trafił jeszcze do dziennika. Szybki wpis teraz utrzyma dokładność dnia.",
    },
    dinner: {
      title: "Przypomnienie o kolacji",
      body: "Kolacja nie jest jeszcze zapisana. Dodaj ją przed końcem dnia.",
    },
    snack: {
      title: "Przypomnienie o przekąsce",
      body: "Nadszedł czas przypomnienia o przekąsce. Dodaj ją albo popraw plan, jeśli ją pomijasz.",
    },
  },
} as const satisfies Record<
  "uk" | "pl",
  Record<MealType, { title: string; body: string }>
>;

const coachNotificationCopy = {
  uk: {
    title: (name: string) => `${name}: вечірній розбір`,
    logging_low: (daysLogged: number) =>
      `Зафіксовано лише ${daysLogged} із 7 останніх днів. Додайте пропущені записи, поки день не завершився.`,
    protein_low: (averageProtein: number, proteinTarget: number) =>
      `Білок просідає: у середньому ${averageProtein.toFixed(0)} г при цілі ${proteinTarget.toFixed(0)} г. Додайте ще один білковий прийом.`,
    water_low: (averageWater: number, waterTarget: number) =>
      `Вода просідає: у середньому ${averageWater.toFixed(0)} мл при цілі ${waterTarget.toFixed(0)} мл. Закрийте одну порцію зараз.`,
    breakfast_skipped: (skippedDays: number) =>
      `Сніданок пропущено ${skippedDays} раз(и) у днях із логами. Підготуйте простий перший прийом на завтра.`,
    fiber_low: (averageFiber: number) =>
      `Клітковина все ще низька: у середньому ${averageFiber.toFixed(0)} г. Додайте овочі, фрукти або бобові.`,
    calories_high: (averageCalories: number, calorieTarget: number) =>
      `Середні калорії ${averageCalories.toFixed(0)} ккал при цілі ${calorieTarget.toFixed(0)}. Зменште найважчий прийом їжі.`,
    calories_low: (averageCalories: number, calorieTarget: number) =>
      `Середні калорії ${averageCalories.toFixed(0)} ккал при цілі ${calorieTarget.toFixed(0)}. Перевірте, чи не пропускаєте прийоми їжі.`,
    meal_pattern: (averageMeals: number) =>
      `Ритм харчування нерівний: лише ${averageMeals.toFixed(1)} повноцінних слотів їжі на день. Вирівняйте базові прийоми.`,
    weight_trend: (weightChange: number) =>
      `Тренд ваги ${weightChange.toFixed(1)} кг не збігається з метою. Перевірте ціль калорій на найближчий тиждень.`,
    caloriesLowTitle: "Сьогодні калорій ще замало",
    caloriesLowBody:
      "Ви помітно нижче денної цілі. Перевірте, чи не лишився пропущений прийом їжі.",
    caloriesHighTitle: "Сьогодні калорії вже вище цілі",
    caloriesHighBody:
      "Ви вже вище денної цілі. Перегляньте решту прийомів перед тим, як додавати ще щось.",
  },
  pl: {
    title: (name: string) => `${name}: wieczorny przegląd`,
    logging_low: (daysLogged: number) =>
      `Zapisane są tylko ${daysLogged} z ostatnich 7 dni. Uzupełnij brakujące wpisy, zanim dzień się skończy.`,
    protein_low: (averageProtein: number, proteinTarget: number) =>
      `Białko jest za nisko: średnio ${averageProtein.toFixed(0)} g przy celu ${proteinTarget.toFixed(0)} g. Dodaj jeszcze jeden białkowy posiłek.`,
    water_low: (averageWater: number, waterTarget: number) =>
      `Woda jest za nisko: średnio ${averageWater.toFixed(0)} ml przy celu ${waterTarget.toFixed(0)} ml. Zamknij jedną porcję teraz.`,
    breakfast_skipped: (skippedDays: number) =>
      `Śniadanie wypadło ${skippedDays} razy w dniach z logami. Przygotuj prosty pierwszy posiłek na jutro.`,
    fiber_low: (averageFiber: number) =>
      `Błonnik nadal jest niski: średnio ${averageFiber.toFixed(0)} g. Dodaj warzywa, owoce albo strączki.`,
    calories_high: (averageCalories: number, calorieTarget: number) =>
      `Średnie kalorie ${averageCalories.toFixed(0)} kcal przy celu ${calorieTarget.toFixed(0)}. Odetnij najcięższy posiłek dnia.`,
    calories_low: (averageCalories: number, calorieTarget: number) =>
      `Średnie kalorie ${averageCalories.toFixed(0)} kcal przy celu ${calorieTarget.toFixed(0)}. Sprawdź, czy nie pomijasz posiłków.`,
    meal_pattern: (averageMeals: number) =>
      `Rytm jedzenia jest nierówny: tylko ${averageMeals.toFixed(1)} pełnych slotów posiłków dziennie. Ustabilizuj bazowe posiłki.`,
    weight_trend: (weightChange: number) =>
      `Trend masy ${weightChange.toFixed(1)} kg nie wspiera celu. Sprawdź target kalorii na kolejny tydzień.`,
    caloriesLowTitle: "Kalorie są dziś jeszcze za nisko",
    caloriesLowBody:
      "Jesteś wyraźnie poniżej dziennego celu. Sprawdź, czy nie brakuje któregoś posiłku.",
    caloriesHighTitle: "Kalorie są dziś już ponad celem",
    caloriesHighBody:
      "Jesteś już ponad dziennym celem. Przejrzyj pozostałe posiłki, zanim dodasz kolejne.",
  },
} as const;

const wellbeingNotificationCopy = {
  uk: {
    dailyTitle: (name: string) => `${name}: план на день`,
    dailyBody: "Один точний запис, одна порція води і один білковий прийом вже роблять день керованим.",
    waterTitle: "Вода сьогодні нижче норми",
    waterBody: "Ви випили менше плану. Додайте ще води, щоб наблизитися до цілі.",
    checkInTitle: "Пора оновити вагу і заміри",
    checkInBody: "Щотижневий check-in вже на часі. Оновіть вагу, талію або інші об’єми.",
  },
  pl: {
    dailyTitle: (name: string) => `${name}: plan na dziś`,
    dailyBody: "Jeden dokładny wpis, jedna porcja wody i jeden białkowy posiłek już porządkują dzień.",
    waterTitle: "Woda jest dziś poniżej normy",
    waterBody: "Wypito mniej niż plan. Dodaj jeszcze trochę wody, aby zbliżyć się do celu.",
    checkInTitle: "Czas odświeżyć wagę i pomiary",
    checkInBody: "Weekly check-in jest już na czasie. Zapisz wagę i obwody.",
  },
} as const;

const HabitReminderAgent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.meal.items);
  const totalCalories = useSelector(
    (state: RootState) => state.meal.totalNutrients.calories
  );
  const {
    dailyCalories,
    goal,
    dietStyle,
    notificationsEnabled,
    mealRemindersEnabled,
    calorieAlertsEnabled,
    reminderTimes,
    weightHistory,
    weeklyCheckIn,
    assistant,
  } = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const { language } = useLanguage();

  useEffect(() => {
    dispatch(syncWaterDay());
  }, [dispatch]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !user ||
      !notificationsEnabled ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const tick = () => {
      const now = new Date();
      const todayKey = formatLocalDayKey(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const localizedMealCopy = mealNotificationCopy[language];
      const coachCopy = coachNotificationCopy[language];
      const wellbeingCopy = wellbeingNotificationCopy[language];
      const waterConsumedToday =
        water.lastLoggedOn === todayKey ? water.consumedMl : 0;

      if (nowMinutes >= 10 * 60) {
        maybeSendNotification(
          `${todayKey}-daily-motivation`,
          wellbeingCopy.dailyTitle(assistant.name),
          wellbeingCopy.dailyBody
        );
      }

      if (mealRemindersEnabled) {
        (Object.keys(localizedMealCopy) as MealType[]).forEach((mealType) => {
          const reminderAt = reminderTimes[mealType];
          const reminderMinutes = parseTimeToMinutes(reminderAt);
          const hasLoggedMeal = items.some(
            (item) => item.mealType === mealType && isSameLocalDay(item.eatenAt, now)
          );

          if (!hasLoggedMeal && nowMinutes >= reminderMinutes) {
            const reminder = localizedMealCopy[mealType];
            maybeSendNotification(
              `${todayKey}-${mealType}`,
              reminder.title,
              reminder.body
            );
          }
        });
      }

      if (calorieAlertsEnabled && dailyCalories > 0 && nowMinutes >= 20 * 60) {
        if (totalCalories < dailyCalories * 0.72) {
          maybeSendNotification(
            `${todayKey}-calories-low`,
            coachCopy.caloriesLowTitle,
            coachCopy.caloriesLowBody
          );
        } else if (totalCalories > dailyCalories * 1.12) {
          maybeSendNotification(
            `${todayKey}-calories-high`,
            coachCopy.caloriesHighTitle,
            coachCopy.caloriesHighBody
          );
        }
      }

      if (nowMinutes >= 18 * 60 && water.dailyTargetMl > 0) {
        if (waterConsumedToday < water.dailyTargetMl * 0.6) {
          maybeSendNotification(
            `${todayKey}-water-low`,
            wellbeingCopy.waterTitle,
            wellbeingCopy.waterBody
          );
        }
      }

      if (
        weeklyCheckIn.enabled &&
        nowMinutes >= 9 * 60 &&
        getDaysSince(weeklyCheckIn.lastRecordedAt) >= weeklyCheckIn.remindIntervalDays
      ) {
        maybeSendNotification(
          `${todayKey}-weekly-check-in`,
          wellbeingCopy.checkInTitle,
          wellbeingCopy.checkInBody
        );
      }

      if (nowMinutes >= 19 * 60 + 30) {
        const analysis = generateNutritionCoachAnalysis({
          items,
          dailyCalories,
          goal,
          dietStyle,
          weight: user.weight,
          weightHistory,
          waterHistory: water.history,
        });
        const focus = analysis.insights.find((insight) => insight.code !== "on_track");

        if (focus) {
          const messageByInsight = {
            logging_low: coachCopy.logging_low(analysis.daysLogged),
            protein_low: coachCopy.protein_low(analysis.averageProtein, analysis.proteinTarget),
            water_low: coachCopy.water_low(analysis.averageWater, analysis.waterTarget),
            breakfast_skipped: coachCopy.breakfast_skipped(analysis.breakfastSkippedDays),
            fiber_low: coachCopy.fiber_low(analysis.averageFiber),
            calories_high: coachCopy.calories_high(analysis.averageCalories, analysis.calorieTarget),
            calories_low: coachCopy.calories_low(analysis.averageCalories, analysis.calorieTarget),
            meal_pattern: coachCopy.meal_pattern(analysis.averageMeals),
            weight_trend: coachCopy.weight_trend(analysis.weightChange),
            on_track: null,
          } as const;
          const body = messageByInsight[focus.code];

          if (body) {
            maybeSendNotification(
              `${todayKey}-coach-focus`,
              coachCopy.title(assistant.name),
              body
            );
          }
        }
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    assistant.name,
    calorieAlertsEnabled,
    dailyCalories,
    dietStyle,
    goal,
    items,
    language,
    mealRemindersEnabled,
    notificationsEnabled,
    reminderTimes,
    totalCalories,
    user,
    water.consumedMl,
    water.dailyTargetMl,
    water.history,
    water.lastLoggedOn,
    weeklyCheckIn.enabled,
    weeklyCheckIn.lastRecordedAt,
    weeklyCheckIn.remindIntervalDays,
    weightHistory,
  ]);

  return null;
};

export default HabitReminderAgent;
