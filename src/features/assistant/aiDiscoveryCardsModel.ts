import type { DailyContext, DailyContextFocus } from "./dailyContext";
import type { AssistantHomeAction } from "./assistantHomeIntelligence";
import type { AppLanguage } from "../../shared/types/i18n";

type DiscoveryTone = "focus" | "care" | "celebrate";

export interface AIDiscoveryCard {
  id: string;
  tone: DiscoveryTone;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
  metricLabel: string;
  metricValue: string;
  action: AssistantHomeAction;
}

type DiscoveryCopy = (typeof copy)[AppLanguage];

const AI_DISCOVERY_LABEL = "AI Discovery";

const copy = {
  uk: {
    eyebrow: AI_DISCOVERY_LABEL,
    metric: {
      protein: "Білок",
      water: "Вода",
      calories: "Енергія",
      fiber: "Клітковина",
      rhythm: "Ритм",
      day: "День",
    },
    title: {
      log_first_meal: "Почнемо історію дня з першого прийому їжі",
      complete_day: "Дню потрібна одна чітка опора",
      protein: "Я бачу білковий розрив",
      water: "Вода зараз найшвидше поверне темп",
      fiber: "Додамо спокійної клітковини",
      calories_high: "Далі краще м'яко стабілізувати день",
      calories_low: "Енергії замало для рівного вечора",
      steady: "День тримається рівно",
    },
    body: {
      log_first_meal:
        "Поки немає запису їжі, я не вигадую висновки. Додамо реальний прийом і тоді підказки стануть точнішими.",
      complete_day:
        "Є початок, але день ще не читається як історія. Один нормальний прийом їжі дасть контекст.",
      protein:
        "Це не вирок і не медична порада. Просто за поточними записами білок відстає від вашої цілі.",
      water:
        "Маленька дія зараз змінить весь ритм дня: вода вплине на прогрес, нагадування і наступні підказки.",
      fiber:
        "Клітковина часто губиться між калоріями і білком. Овочі, фрукти або крупа закриють цей шар дня.",
      calories_high:
        "Калорій уже достатньо, тому наступна дія має бути легкою і контрольованою.",
      calories_low:
        "Якщо відкладати їжу занадто довго, вечір часто стає хаотичним. Краще додати спокійний прийом зараз.",
      steady:
        "Система бачить рівний день. Найкраща дія зараз — не ускладнювати і зберегти темп.",
    },
    steps: {
      noticed: "Я помітив сигнал у сьогоднішніх даних.",
      measured: "Звірив його з цілями профілю.",
      action: "Пропоную одну дію без зайвого шуму.",
    },
  },
  pl: {
    eyebrow: AI_DISCOVERY_LABEL,
    metric: {
      protein: "Białko",
      water: "Woda",
      calories: "Energia",
      fiber: "Błonnik",
      rhythm: "Rytm",
      day: "Dzień",
    },
    title: {
      log_first_meal: "Zacznijmy historię dnia od pierwszego posiłku",
      complete_day: "Dzień potrzebuje jednej wyraźnej podpory",
      protein: "Widzę lukę w białku",
      water: "Woda najszybciej przywróci tempo",
      fiber: "Dodajmy spokojny błonnik",
      calories_high: "Dalej lepiej łagodnie ustabilizować dzień",
      calories_low: "Energii jest mało na równy wieczór",
      steady: "Dzień trzyma dobry rytm",
    },
    body: {
      log_first_meal:
        "Bez zapisu jedzenia nie udaję wniosków. Dodajmy realny posiłek, a wskazówki staną się dokładniejsze.",
      complete_day:
        "Jest początek, ale dzień nie czyta się jeszcze jak pełna historia. Jeden normalny posiłek da kontekst.",
      protein:
        "To nie wyrok ani porada medyczna. Po prostu według obecnych zapisów białko jest poniżej celu.",
      water:
        "Mały ruch teraz zmieni rytm dnia: woda wpłynie na postęp, przypomnienia i kolejne wskazówki.",
      fiber:
        "Błonnik łatwo gubi się między kaloriami i białkiem. Warzywa, owoce albo kasza zamkną tę warstwę dnia.",
      calories_high:
        "Kalorii jest już sporo, więc kolejny krok powinien być lekki i kontrolowany.",
      calories_low:
        "Gdy jedzenie czeka zbyt długo, wieczór często robi się chaotyczny. Lepiej dodać spokojny posiłek teraz.",
      steady:
        "System widzi równy dzień. Najlepszy krok teraz to nie komplikować i utrzymać tempo.",
    },
    steps: {
      noticed: "Zauważyłem sygnał w dzisiejszych danych.",
      measured: "Porównałem go z celami profilu.",
      action: "Proponuję jeden krok bez zbędnego hałasu.",
    },
  },
  en: {
    eyebrow: AI_DISCOVERY_LABEL,
    metric: {
      protein: "Protein",
      water: "Water",
      calories: "Energy",
      fiber: "Fiber",
      rhythm: "Rhythm",
      day: "Day",
    },
    title: {
      log_first_meal: "Start the day's story with the first meal",
      complete_day: "The day needs one clear anchor",
      protein: "I see a protein gap",
      water: "Water is the fastest way back to pace",
      fiber: "Add a calm fiber layer",
      calories_high: "Keep the rest of the day light and steady",
      calories_low: "Energy is low for a stable evening",
      steady: "The day is holding a steady rhythm",
    },
    body: {
      log_first_meal:
        "With no food logged, I will not invent conclusions. Add a real meal and the guidance becomes sharper.",
      complete_day:
        "There is a start, but the day does not read as a full story yet. One proper meal gives context.",
      protein:
        "This is not a diagnosis or medical advice. Based on current entries, protein is behind your target.",
      water:
        "A small move now changes the day's rhythm: water affects progress, reminders, and the next nudges.",
      fiber:
        "Fiber often gets lost between calories and protein. Vegetables, fruit, or grains close that layer.",
      calories_high:
        "Calories are already high, so the next step should be light and controlled.",
      calories_low:
        "When food waits too long, evenings often get messy. A calm meal now is better.",
      steady:
        "The system sees a balanced day. The best next step is to keep the pace simple.",
    },
    steps: {
      noticed: "I noticed a signal in today's data.",
      measured: "I compared it with your profile targets.",
      action: "I suggest one next step without extra noise.",
    },
  },
} as const;

const getCopy = (language: AppLanguage): DiscoveryCopy => {
  switch (language) {
    case "pl":
      return copy.pl;
    case "en":
      return copy.en;
    case "uk":
    default:
      return copy.uk;
  }
};

const formatPercent = (value: number) =>
  `${Math.max(0, Math.min(100, Math.round(value)))}%`;

const getMetricForFocus = (context: DailyContext, text: DiscoveryCopy) => {
  switch (context.primaryFocus) {
    case "protein":
      return {
        label: text.metric.protein,
        value: formatPercent(context.progress.protein),
      };
    case "water":
      return {
        label: text.metric.water,
        value: formatPercent(context.progress.water),
      };
    case "calories_high":
    case "calories_low":
      return {
        label: text.metric.calories,
        value: formatPercent(context.progress.calories),
      };
    case "steady":
      return {
        label: text.metric.rhythm,
        value: `${context.week.daysLogged}/7`,
      };
    case "fiber":
      return {
        label: text.metric.fiber,
        value: formatPercent(context.progress.fiber),
      };
    case "log_first_meal":
    case "complete_day":
    default:
      return {
        label: text.metric.day,
        value: `${context.today.entries}/4`,
      };
  }
};

const getToneForFocus = (focus: DailyContextFocus): DiscoveryTone => {
  if (focus === "steady") {
    return "celebrate";
  }

  if (focus === "calories_high" || focus === "calories_low") {
    return "care";
  }

  return "focus";
};

export const buildAIDiscoveryCards = ({
  context,
  language,
  primaryAction,
  secondaryActions,
}: {
  context: DailyContext;
  language: AppLanguage;
  primaryAction: AssistantHomeAction;
  secondaryActions: AssistantHomeAction[];
}): AIDiscoveryCard[] => {
  const text = getCopy(language);
  const metric = getMetricForFocus(context, text);
  const cards: AIDiscoveryCard[] = [
    {
      id: `focus-${context.primaryFocus}`,
      tone: getToneForFocus(context.primaryFocus),
      eyebrow: text.eyebrow,
      title: text.title[context.primaryFocus],
      body: text.body[context.primaryFocus],
      steps: [text.steps.noticed, text.steps.measured, text.steps.action],
      metricLabel: metric.label,
      metricValue: metric.value,
      action: primaryAction,
    },
  ];

  const waterAction = secondaryActions.find((action) => action.kind === "water");

  if (context.primaryFocus !== "water" && context.progress.water < 70 && waterAction) {
    cards.push({
      id: "support-water",
      tone: "focus",
      eyebrow: text.eyebrow,
      title: text.title.water,
      body: text.body.water,
      steps: [text.steps.noticed, text.steps.measured, text.steps.action],
      metricLabel: text.metric.water,
      metricValue: formatPercent(context.progress.water),
      action: waterAction,
    });
  }

  return cards.slice(0, 2);
};
