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

type TimelineTone = "food" | "ai" | "water" | "action";
type AuraMood = "waiting" | "building" | "thirsty" | "hungry" | "steady" | "celebrating";

export interface AIDiscoveryTimelineItem {
  id: string;
  tone: TimelineTone;
  label: string;
  title: string;
  body: string;
  metric: string;
  action?: AssistantHomeAction;
}

export interface AIDiscoveryAura {
  mood: AuraMood;
  label: string;
  title: string;
  body: string;
  score: number;
  glow: string;
  signals: Array<{
    label: string;
    value: string;
    score: number;
  }>;
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
    timeline: {
      foodLabel: "День",
      foodEmptyTitle: "Історія ще чекає перший прийом",
      foodLoggedTitle: "Їжа вже дала контекст",
      foodEmptyBody: "Почнемо з реального запису, щоб помічник не вигадував висновки.",
      foodLoggedBody: "Записи дня вже можна читати як живий контекст.",
      aiLabel: "AI помітив",
      waterLabel: "Вода",
      waterBody: "Гідратація впливає на ритм підказок і прогресу.",
      actionLabel: "Наступний крок",
      actionBody: "Одна дія зараз корисніша за довгий список варіантів.",
      entriesUnit: "зап.",
      waterUnit: "води",
    },
    aura: {
      waiting: ["Тиха підготовка", "Я чекаю перший реальний сигнал дня."],
      building: ["День збирається", "Контекст уже з'явився, але ще потрібна одна опора."],
      thirsty: ["Вода просить уваги", "Гідратація зараз найшвидше змінить відчуття дня."],
      hungry: ["Потрібна енергія", "День просить спокійний прийом їжі замість вечірнього хаосу."],
      steady: ["Рівний ритм", "День читається спокійно. Зберігаємо темп."],
      celebrating: ["Живий прогрес", "Я бачу хороший ритм і підсвічую те, що вже працює."],
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
    timeline: {
      foodLabel: "Dzień",
      foodEmptyTitle: "Historia czeka na pierwszy posiłek",
      foodLoggedTitle: "Jedzenie dało już kontekst",
      foodEmptyBody: "Zacznijmy od realnego zapisu, żeby asystent nie udawał wniosków.",
      foodLoggedBody: "Dzisiejsze wpisy można już czytać jako żywy kontekst.",
      aiLabel: "AI zauważył",
      waterLabel: "Woda",
      waterBody: "Nawodnienie wpływa na rytm wskazówek i progresu.",
      actionLabel: "Kolejny krok",
      actionBody: "Jeden krok teraz daje więcej niż długa lista opcji.",
      entriesUnit: "wpisy",
      waterUnit: "wody",
    },
    aura: {
      waiting: ["Ciche przygotowanie", "Czekam na pierwszy prawdziwy sygnał dnia."],
      building: ["Dzień się układa", "Kontekst już jest, ale potrzebuje jeszcze jednej podpory."],
      thirsty: ["Woda prosi o uwagę", "Nawodnienie najszybciej zmieni odczucie dnia."],
      hungry: ["Potrzeba energii", "Dzień prosi o spokojny posiłek zamiast wieczornego chaosu."],
      steady: ["Równy rytm", "Dzień czyta się spokojnie. Trzymamy tempo."],
      celebrating: ["Żywy postęp", "Widzę dobry rytm i podświetlam to, co już działa."],
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
    timeline: {
      foodLabel: "Day",
      foodEmptyTitle: "The story is waiting for the first meal",
      foodLoggedTitle: "Food has already given context",
      foodEmptyBody: "Start with a real entry so the assistant does not fake insight.",
      foodLoggedBody: "Today's entries can already be read as living context.",
      aiLabel: "AI noticed",
      waterLabel: "Water",
      waterBody: "Hydration shapes the rhythm of nudges and progress.",
      actionLabel: "Next step",
      actionBody: "One action now is better than a long list of options.",
      entriesUnit: "entries",
      waterUnit: "water",
    },
    aura: {
      waiting: ["Quiet preparation", "I am waiting for the first real signal of the day."],
      building: ["The day is taking shape", "Context is already here, but it needs one more anchor."],
      thirsty: ["Water needs attention", "Hydration is the fastest way to change the feel of today."],
      hungry: ["Energy is needed", "The day asks for a calm meal instead of evening chaos."],
      steady: ["Steady rhythm", "The day reads calmly. Keep the pace."],
      celebrating: ["Living progress", "I see a good rhythm and highlight what already works."],
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

const clampAuraScore = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;

const getAuraMood = (context: DailyContext): AuraMood => {
  if (context.primaryFocus === "steady" && context.nudgeTone === "celebratory") {
    return "celebrating";
  }

  if (context.primaryFocus === "steady") {
    return "steady";
  }

  if (context.primaryFocus === "water") {
    return "thirsty";
  }

  if (context.primaryFocus === "calories_low" || context.primaryFocus === "complete_day") {
    return "hungry";
  }

  if (context.primaryFocus === "log_first_meal") {
    return "waiting";
  }

  return "building";
};

const getAuraGlow = (mood: AuraMood) => {
  switch (mood) {
    case "celebrating":
      return "linear-gradient(135deg, rgba(163,230,53,0.34), rgba(20,184,166,0.2), rgba(34,211,238,0.16))";
    case "steady":
      return "linear-gradient(135deg, rgba(20,184,166,0.28), rgba(34,211,238,0.16), rgba(255,255,255,0.08))";
    case "thirsty":
      return "linear-gradient(135deg, rgba(14,165,233,0.3), rgba(34,211,238,0.22), rgba(20,184,166,0.1))";
    case "hungry":
      return "linear-gradient(135deg, rgba(245,158,11,0.26), rgba(34,197,94,0.14), rgba(20,184,166,0.1))";
    case "waiting":
      return "linear-gradient(135deg, rgba(148,163,184,0.2), rgba(20,184,166,0.1), rgba(255,255,255,0.08))";
    case "building":
    default:
      return "linear-gradient(135deg, rgba(20,184,166,0.24), rgba(59,130,246,0.14), rgba(168,85,247,0.1))";
  }
};

const getAuraMessage = (text: DiscoveryCopy, mood: AuraMood) => {
  switch (mood) {
    case "celebrating":
      return text.aura.celebrating;
    case "steady":
      return text.aura.steady;
    case "thirsty":
      return text.aura.thirsty;
    case "hungry":
      return text.aura.hungry;
    case "waiting":
      return text.aura.waiting;
    case "building":
    default:
      return text.aura.building;
  }
};

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

export const buildAIDiscoveryAura = ({
  context,
  language,
}: {
  context: DailyContext;
  language: AppLanguage;
}): AIDiscoveryAura => {
  const text = getCopy(language);
  const mood = getAuraMood(context);
  const [title, body] = getAuraMessage(text, mood);
  const nutritionScore = clampAuraScore(
    (context.progress.calories + context.progress.protein + context.progress.fiber) / 3
  );
  const waterScore = clampAuraScore(context.progress.water);
  const rhythmScore = clampAuraScore((context.week.daysLogged / 7) * 100);
  const score = clampAuraScore(nutritionScore * 0.46 + waterScore * 0.34 + rhythmScore * 0.2);

  return {
    mood,
    label: text.eyebrow,
    title,
    body,
    score,
    glow: getAuraGlow(mood),
    signals: [
      {
        label: text.metric.calories,
        value: formatPercent(context.progress.calories),
        score: clampAuraScore(context.progress.calories),
      },
      {
        label: text.metric.protein,
        value: formatPercent(context.progress.protein),
        score: clampAuraScore(context.progress.protein),
      },
      {
        label: text.metric.water,
        value: formatPercent(context.progress.water),
        score: waterScore,
      },
      {
        label: text.metric.rhythm,
        value: `${context.week.daysLogged}/7`,
        score: rhythmScore,
      },
    ],
  };
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

export const buildAIDiscoveryTimeline = ({
  context,
  language,
  primaryAction,
}: {
  context: DailyContext;
  language: AppLanguage;
  primaryAction: AssistantHomeAction;
}): AIDiscoveryTimelineItem[] => {
  const text = getCopy(language);
  const metric = getMetricForFocus(context, text);
  const entries = Math.max(0, context.today.entries);
  const waterProgress = formatPercent(context.progress.water);

  return [
    {
      id: "timeline-food",
      tone: "food",
      label: text.timeline.foodLabel,
      title: entries > 0 ? text.timeline.foodLoggedTitle : text.timeline.foodEmptyTitle,
      body: entries > 0 ? text.timeline.foodLoggedBody : text.timeline.foodEmptyBody,
      metric: `${entries} ${text.timeline.entriesUnit}`,
    },
    {
      id: `timeline-ai-${context.primaryFocus}`,
      tone: "ai",
      label: text.timeline.aiLabel,
      title: text.title[context.primaryFocus],
      body: text.body[context.primaryFocus],
      metric: `${metric.label}: ${metric.value}`,
    },
    {
      id: "timeline-water",
      tone: "water",
      label: text.timeline.waterLabel,
      title: text.title.water,
      body: text.timeline.waterBody,
      metric: `${waterProgress} ${text.timeline.waterUnit}`,
    },
    {
      id: `timeline-action-${primaryAction.kind}`,
      tone: "action",
      label: text.timeline.actionLabel,
      title: primaryAction.label,
      body: primaryAction.helper || text.timeline.actionBody,
      metric: text.timeline.actionLabel,
      action: primaryAction,
    },
  ];
};
