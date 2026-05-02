import { canUseFreeDay, canUsePaidDay } from "../motivation";
import type { DietStyle } from "../../types/profile";
import type {
  AssistantQuestionInput,
  AssistantQuickQuestionId,
  AssistantRuntimeContext,
  AssistantRuntimeResponse,
} from "../../types/assistant";

type CalorieState = "over" | "tight" | "open" | "wide";
type ProteinState = "low" | "close" | "hit";
type WaterState = "low" | "close" | "hit";
type WeightState = "due" | "plateau" | "moving";
type LoggingState = "empty" | "light" | "solid";
type PrimaryFocus =
  | "log_day"
  | "recover"
  | "protein"
  | "water"
  | "weight"
  | "protect_budget"
  | "coach"
  | "maintain";

type AssistantSignals = {
  proteinGap: number;
  waterGapMl: number;
  waterProgress: number;
  openTasks: number;
  calorieState: CalorieState;
  proteinState: ProteinState;
  waterState: WaterState;
  weightState: WeightState;
  loggingState: LoggingState;
  primaryFocus: PrimaryFocus;
};

const mealIdeas: Record<
  AssistantRuntimeContext["language"],
  Record<DietStyle, { light: string[]; full: string[] }>
> = {
  uk: {
    balanced: {
      light: ["скір або грецький йогурт", "курка з овочами"],
      full: ["рис з куркою", "йогурт з вівсянкою"],
    },
    vegetarian: {
      light: ["творог або скір", "омлет з овочами"],
      full: ["тофу з рисом", "йогурт з вівсянкою"],
    },
    vegan: {
      light: ["тофу з овочами", "соєвий йогурт"],
      full: ["темпе з рисом", "сочевиця з рисом"],
    },
    pescatarian: {
      light: ["тунець і овочі", "скір або йогурт"],
      full: ["лосось з рисом", "тунець з картоплею"],
    },
    low_carb: {
      light: ["яйця і творог", "лосось із салатом"],
      full: ["омлет із сиром", "тофу з овочами та горіхами"],
    },
    gluten_free: {
      light: ["яйця і овочі", "скір або йогурт"],
      full: ["рис з куркою", "картопля з лососем"],
    },
  },
  pl: {
    balanced: {
      light: ["skyr albo jogurt grecki", "kurczak z warzywami"],
      full: ["ryż z kurczakiem", "jogurt z owsianką"],
    },
    vegetarian: {
      light: ["twaróg albo skyr", "omlet z warzywami"],
      full: ["tofu z ryżem", "jogurt z owsianką"],
    },
    vegan: {
      light: ["tofu z warzywami", "jogurt sojowy"],
      full: ["tempeh z ryżem", "soczewica z ryżem"],
    },
    pescatarian: {
      light: ["tuńczyk i warzywa", "skyr albo jogurt"],
      full: ["łosoś z ryżem", "tuńczyk z ziemniakami"],
    },
    low_carb: {
      light: ["jajka i twaróg", "łosoś z sałatką"],
      full: ["omlet z serem", "tofu z warzywami i orzechami"],
    },
    gluten_free: {
      light: ["jajka i warzywa", "skyr albo jogurt"],
      full: ["ryż z kurczakiem", "ziemniaki z łososiem"],
    },
  },
};

const normalizeIntentText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const formatRounded = (value: number) => Math.max(Math.round(value), 0);

const getProteinGap = (context: AssistantRuntimeContext) =>
  Math.max(context.proteinTarget - context.proteinConsumed, 0);

const getWaterGap = (context: AssistantRuntimeContext) =>
  Math.max(context.waterTargetMl - context.waterConsumedMl, 0);

const getOpenTaskCount = (context: AssistantRuntimeContext) =>
  context.motivation.activeTasks.filter(
    (task) => !task.completedAt && !task.skippedWithDayOffAt
  ).length;

const detectIntent = ({
  quickQuestionId,
  question,
}: Pick<AssistantQuestionInput, "quickQuestionId" | "question">) => {
  if (quickQuestionId) {
    return quickQuestionId;
  }

  const normalizedQuestion = normalizeIntentText(question);
  const matches = (keywords: string[]) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword));

  if (
    matches([
      "protein",
      "bialk",
      "belk",
      "білок",
    ])
  ) {
    return "protein_help";
  }

  if (
    matches([
      "water",
      "hydration",
      "drink",
      "woda",
      "pic",
      "nawod",
      "вода",
      "пити",
      "гідрата",
    ])
  ) {
    return "water_help";
  }

  if (
    matches([
      "weight",
      "bmi",
      "plateau",
      "check-in",
      "check in",
      "waga",
      "masa",
      "waż",
      "вага",
      "плато",
      "зваж",
    ])
  ) {
    return "weight_help";
  }

  if (
    matches([
      "eat now",
      "what to eat",
      "next meal",
      "co zjesc",
      "posilek",
      "що з'їсти",
      "що їсти",
      "наступний прийом",
    ])
  ) {
    return "next_meal";
  }

  if (
    matches([
      "coach",
      "week",
      "trend",
      "score",
      "focus",
      "tydzien",
      "фокус",
      "тиж",
      "тренд",
    ])
  ) {
    return "coach_focus";
  }

  if (
    matches([
      "motivation",
      "task",
      "points",
      "reward",
      "achievement",
      "day off",
      "motyw",
      "zadani",
      "punkty",
      "мотив",
      "задач",
      "очки",
    ])
  ) {
    return "motivation_focus";
  }

  return "day_status";
};

const deriveSignals = (context: AssistantRuntimeContext): AssistantSignals => {
  const proteinGap = getProteinGap(context);
  const openTasks = getOpenTaskCount(context);
  const calorieState: CalorieState =
    context.caloriesRemaining < -120
      ? "over"
      : context.caloriesRemaining <= 120
        ? "tight"
        : context.caloriesRemaining <= 450
          ? "open"
          : "wide";
  const proteinState: ProteinState =
    proteinGap <= 8 ? "hit" : proteinGap <= 18 ? "close" : "low";
  const waterGapMl = getWaterGap(context);
  const waterProgress =
    context.waterTargetMl > 0
      ? Math.min(context.waterConsumedMl / context.waterTargetMl, 1)
      : 0;
  const waterState: WaterState =
    waterProgress >= 0.95 ? "hit" : waterProgress >= 0.7 ? "close" : "low";
  const weightState: WeightState = context.weeklyCheckInDue
    ? "due"
    : Math.abs(context.weightChangeKg) <= 0.4 && context.coach.daysLogged >= 5
      ? "plateau"
      : "moving";
  const loggingState: LoggingState =
    context.mealEntriesToday === 0
      ? "empty"
      : context.mealEntriesToday === 1
        ? "light"
        : "solid";

  let primaryFocus: PrimaryFocus = "maintain";

  if (loggingState !== "solid") {
    primaryFocus = "log_day";
  } else if (calorieState === "over") {
    primaryFocus = "recover";
  } else if (proteinState !== "hit") {
    primaryFocus = "protein";
  } else if (waterState === "low") {
    primaryFocus = "water";
  } else if (weightState === "due") {
    primaryFocus = "weight";
  } else if (calorieState === "tight") {
    primaryFocus = "protect_budget";
  } else if (context.coach.score < 60) {
    primaryFocus = "coach";
  }

  return {
    proteinGap,
    waterGapMl,
    waterProgress,
    openTasks,
    calorieState,
    proteinState,
    waterState,
    weightState,
    loggingState,
    primaryFocus,
  };
};

const joinIdeas = (context: AssistantRuntimeContext, signals: AssistantSignals) => {
  const bucket =
    signals.calorieState === "tight" || signals.calorieState === "over"
      ? "light"
      : context.goal === "bulk" || signals.proteinGap >= 35
        ? "full"
        : "light";
  const items = mealIdeas[context.language][context.dietStyle][bucket];

  return items.slice(0, 2).join(context.language === "pl" ? " albo " : " або ");
};

const getActionLead = (context: AssistantRuntimeContext) => {
  if (context.language === "pl") {
    if (context.assistantRole === "coach") {
      return context.assistantTone === "gentle"
        ? "Najważniejszy krok teraz:"
        : "Priorytet na teraz:";
    }

    if (context.assistantRole === "friend") {
      return context.assistantTone === "focused"
        ? "Ja bym zrobił teraz tak:"
        : "Najlepszy ruch teraz:";
    }

    return "Najlepszy kolejny krok:";
  }

  if (context.assistantRole === "coach") {
    return context.assistantTone === "gentle"
      ? "Найважливіший крок зараз:"
      : "Пріоритет на зараз:";
  }

  if (context.assistantRole === "friend") {
    return context.assistantTone === "focused"
      ? "Я б зараз зробив так:"
      : "Найкращий хід зараз:";
  }

  return "Найкращий наступний крок:";
};

const getLightHumorLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  if (!context.humorEnabled || context.assistantTone !== "playful") {
    return "";
  }

  if (context.language === "pl") {
    return signals.primaryFocus === "recover"
      ? "Bez dramatu: dzień nadal da się uspokoić jednym rozsądnym ruchem."
      : "Bez spiny: tu nie trzeba dnia idealnego, tylko jednego dobrego ruchu.";
  }

  return signals.primaryFocus === "recover"
    ? "Без драми: день ще можна вирівняти одним розумним кроком."
    : "Без напруги: тут не потрібен ідеальний день, потрібен один влучний хід.";
};

const getSnapshotLine = (context: AssistantRuntimeContext) => {
  if (context.language === "pl") {
    const calories =
      context.caloriesRemaining >= 0
        ? `Dziś masz ${formatRounded(context.caloriesConsumed)}/${formatRounded(
            context.dailyCalories
          )} kcal i zostało ${formatRounded(context.caloriesRemaining)} kcal.`
        : `Dziś masz ${formatRounded(context.caloriesConsumed)}/${formatRounded(
            context.dailyCalories
          )} kcal, czyli jesteś ponad celem o ${formatRounded(
            Math.abs(context.caloriesRemaining)
          )} kcal.`;

    return `${calories} Białko: ${formatRounded(context.proteinConsumed)}/${formatRounded(
      context.proteinTarget
    )} g. Zalogowane sloty: ${context.mealEntriesToday}.`;
  }

  const calories =
    context.caloriesRemaining >= 0
      ? `Сьогодні у вас ${formatRounded(context.caloriesConsumed)}/${formatRounded(
          context.dailyCalories
        )} ккал, залишилось ${formatRounded(context.caloriesRemaining)} ккал.`
      : `Сьогодні у вас ${formatRounded(context.caloriesConsumed)}/${formatRounded(
          context.dailyCalories
        )} ккал, тобто ви вище цілі на ${formatRounded(
          Math.abs(context.caloriesRemaining)
        )} ккал.`;

  return `${calories} Білок: ${formatRounded(context.proteinConsumed)}/${formatRounded(
    context.proteinTarget
  )} г. Записаних слотів їжі: ${context.mealEntriesToday}.`;
};

const getPriorityLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  if (context.language === "pl") {
    const byFocus = {
      log_day:
        "Priorytet teraz to uzupełnić log dnia, bo przy 0-1 wpisie każda dalsza rada jest mniej pewna.",
      recover:
        "Priorytet teraz to spokojnie wyrównać dzień, a nie próbować go odpracować restrykcją.",
      protein: `Priorytet teraz to domknięcie białka, bo brakuje jeszcze około ${formatRounded(
        signals.proteinGap
      )} g.`,
      water: `Priorytet teraz to woda: brakuje jeszcze około ${formatRounded(
        signals.waterGapMl
      )} ml do celu.`,
      weight:
        "Priorytet teraz to check-in wagi i pomiarów, bo trend potrzebuje świeżych danych.",
      protect_budget:
        "Priorytet teraz to nie rozbić małego budżetu kalorii przypadkowymi przekąskami.",
      coach:
        "Priorytet teraz to stabilność, bo tygodniowy sygnał nadal wymaga spokojnego dociągnięcia.",
      maintain:
        "Priorytet teraz to utrzymać dobry rytm bez dokładania zbędnych korekt.",
    } as const;

    return byFocus[signals.primaryFocus];
  }

  const byFocus = {
    log_day:
      "Пріоритет зараз — доповнити лог дня, бо при 0-1 записі будь-яка наступна порада менш точна.",
    recover:
      "Пріоритет зараз — спокійно вирівняти день, а не намагатися його «відпрацювати» жорсткістю.",
    protein: `Пріоритет зараз — добрати білок, бо бракує ще близько ${formatRounded(
      signals.proteinGap
    )} г.`,
    water: `Пріоритет зараз — вода: бракує ще близько ${formatRounded(
      signals.waterGapMl
    )} мл до цілі.`,
    weight:
      "Пріоритет зараз — оновити вагу й заміри, бо тренду потрібні свіжі дані.",
    protect_budget:
      "Пріоритет зараз — не розсипати невеликий залишок калорій на випадкові перекуси.",
    coach:
      "Пріоритет зараз — стабільність, бо тижневий сигнал ще просить спокійного дотягування.",
    maintain: "Пріоритет зараз — утримати хороший ритм без зайвих корекцій.",
  } as const;

  return byFocus[signals.primaryFocus];
};

const getActionLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  const lead = getActionLead(context);
  const ideas = joinIdeas(context, signals);

  if (context.language === "pl") {
    const byFocus = {
      log_day: `${lead} dopisz brakujący posiłek albo przekąskę, a dopiero potem oceniaj resztę dnia.`,
      recover: `${lead} do końca dnia trzymaj lekki, sycący posiłek z białkiem i warzywami, a jutro wróć do normalnego celu bez karania się.`,
      protein: `${lead} zrób jeden konkretny ruch białkowy, na przykład ${ideas}.`,
      water: `${lead} wypij teraz jedną porcję wody 250-300 ml i wróć do trackera po kolejną porcję za 60-90 minut.`,
      weight: `${lead} zapisz wagę i podstawowe obwody dzisiaj, a decyzje o kaloriach oprzyj na trendzie, nie na jednym odczycie.`,
      protect_budget: `${lead} trzymaj się jednego kontrolowanego posiłku i nie otwieraj już dnia na przypadkowe kalorie.`,
      coach: `${lead} wybierz jedną powtarzalną zasadę na dziś i jutro, zamiast poprawiać wszystko naraz.`,
      maintain: `${lead} po prostu powtórz ten sam działający schemat przy kolejnym posiłku.`,
    } as const;

    return byFocus[signals.primaryFocus];
  }

  const byFocus = {
    log_day: `${lead} дозапишіть пропущений прийом або перекус, а вже потім оцінюйте решту дня.`,
    recover: `${lead} до кінця дня тримайте легкий ситний прийом з білком та овочами, а завтра поверніться до звичної цілі без покарання себе.`,
    protein: `${lead} зробіть один чіткий білковий хід, наприклад ${ideas}.`,
    water: `${lead} випийте зараз одну порцію води 250-300 мл і поверніться до трекера за наступною порцією через 60-90 хвилин.`,
    weight: `${lead} запишіть вагу й базові об'єми сьогодні, а рішення по калоріях тримайте на тренді, не на одному числі.`,
    protect_budget: `${lead} тримайтеся одного контрольованого прийому і не відкривайте день на випадкові калорії.`,
    coach: `${lead} виберіть одну повторювану звичку на сьогодні й завтра, замість намагатися виправити все одразу.`,
    maintain: `${lead} просто повторіть той самий робочий шаблон на наступний прийом їжі.`,
  } as const;

  return byFocus[signals.primaryFocus];
};

const getWaterLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  if (context.language === "pl") {
    if (signals.waterState === "hit") {
      return `Woda jest domknięta: ${formatRounded(context.waterConsumedMl)}/${formatRounded(
        context.waterTargetMl
      )} ml. Teraz utrzymaj spokojne tempo, bez nadrabiania na siłę.`;
    }

    return `Woda jest na ${Math.round(signals.waterProgress * 100)}% celu: ${formatRounded(
      context.waterConsumedMl
    )}/${formatRounded(context.waterTargetMl)} ml. Najprostszy ruch to 250-300 ml teraz i kolejna porcja później.`;
  }

  if (signals.waterState === "hit") {
    return `Вода закрита: ${formatRounded(context.waterConsumedMl)}/${formatRounded(
      context.waterTargetMl
    )} мл. Далі просто тримайте спокійний темп без насильного добирання.`;
  }

  return `Вода зараз на ${Math.round(signals.waterProgress * 100)}% цілі: ${formatRounded(
    context.waterConsumedMl
  )}/${formatRounded(context.waterTargetMl)} мл. Найпростіший хід — 250-300 мл зараз і ще одна порція пізніше.`;
};

const getWeightLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  if (context.language === "pl") {
    if (signals.weightState === "due") {
      return "Weekly check-in jest już na czasie: zapisz wagę, talię/brzuch/klatkę i potraktuj pojedynczy odczyt jako część trendu.";
    }

    if (signals.weightState === "plateau") {
      return `Trend wygląda stabilnie: zmiana wynosi ${context.weightChangeKg.toFixed(
        1
      )} kg. Najpierw sprawdź regularność logowania, białko i wodę, dopiero potem zmieniaj kalorie.`;
    }

    return `Ostatnia zapisana waga to ${context.latestWeight.toFixed(
      1
    )} kg, a zmiana trendu wynosi ${context.weightChangeKg.toFixed(
      1
    )} kg. Trzymaj decyzje na średniej, nie na jednym dniu.`;
  }

  if (signals.weightState === "due") {
    return "Weekly check-in уже на часі: запишіть вагу, талію/живіт/груди і сприймайте одне число як частину тренду.";
  }

  if (signals.weightState === "plateau") {
    return `Тренд виглядає стабільним: зміна ${context.weightChangeKg.toFixed(
      1
    )} кг. Спершу перевірте регулярність логування, білок і воду, а вже потім змінюйте калорії.`;
  }

  return `Остання записана вага: ${context.latestWeight.toFixed(
    1
  )} кг, зміна тренду: ${context.weightChangeKg.toFixed(
    1
  )} кг. Тримайте рішення на середньому тренді, не на одному дні.`;
};

const getNextMealLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  const ideas = joinIdeas(context, signals);

  if (context.language === "pl") {
    if (signals.calorieState === "over") {
      return `Teraz najlepszy będzie lekki, białkowy posiłek bez dokładania ciężkich dodatków: ${ideas}.`;
    }

    if (signals.proteinState !== "hit") {
      return `Najlepiej zjeść coś, co domknie białko: ${ideas}.`;
    }

    return signals.calorieState === "wide"
      ? `Masz jeszcze przestrzeń w kaloriach, więc wybierz pełniejszy posiłek: ${ideas}.`
      : `Masz umiarkowany budżet, więc wybierz prosty posiłek i nie dokładaj losowych przekąsek: ${ideas}.`;
  }

  if (signals.calorieState === "over") {
    return `Зараз найкраще підійде легкий білковий прийом без важких додатків: ${ideas}.`;
  }

  if (signals.proteinState !== "hit") {
    return `Найкраще з'їсти щось, що закриє білок: ${ideas}.`;
  }

  return signals.calorieState === "wide"
    ? `У вас ще є місце по калоріях, тож оберіть повніший прийом: ${ideas}.`
    : `Бюджет помірний, тож оберіть простий прийом і не додавайте випадкові перекуси: ${ideas}.`;
};

const getCoachSnapshot = (context: AssistantRuntimeContext) => {
  if (context.language === "pl") {
    const byInsight = {
      logging_low: `Największy hamulec tygodnia to regularność logowania: masz ${context.coach.daysLogged}/7 pełnych dni z wpisami.`,
      protein_low: `Największy hamulec tygodnia to białko: średnio ${formatRounded(
        context.coach.averageProtein
      )} g przy celu ${formatRounded(context.coach.proteinTarget)} g.`,
      water_low: `Największy hamulec tygodnia to woda: średnio ${formatRounded(
        context.coach.averageWater
      )} ml przy celu ${formatRounded(context.coach.waterTarget)} ml.`,
      breakfast_skipped: `Największy hamulec tygodnia to start dnia: śniadanie wypadło ${context.coach.breakfastSkippedDays} razy w dniach z logami.`,
      fiber_low: `Największy hamulec tygodnia to błonnik: średnio ${formatRounded(
        context.coach.averageFiber
      )} g i to nadal za mało.`,
      calories_high: `Największy hamulec tygodnia to nadwyżka: średnio ${formatRounded(
        context.coach.averageCalories
      )} kcal przy celu ${formatRounded(context.coach.calorieTarget)} kcal.`,
      calories_low: `Największy hamulec tygodnia to niedojadanie: średnio ${formatRounded(
        context.coach.averageCalories
      )} kcal przy celu ${formatRounded(context.coach.calorieTarget)} kcal.`,
      meal_pattern: `Największy hamulec tygodnia to rytm: średnio ${context.coach.averageMeals.toFixed(
        1
      )} pełnych slotów posiłków dziennie.`,
      weight_trend: `Największy hamulec tygodnia to trend masy: zmiana wynosi ${context.coach.weightChange.toFixed(
        1
      )} kg.`,
      on_track: `Tydzień wygląda stabilnie: ocena ${context.coach.score}/100.`,
    } as const;

    return byInsight[context.coachPrimaryInsight];
  }

  const byInsight = {
    logging_low: `Головний тижневий гальмівний фактор — регулярність логування: у вас ${context.coach.daysLogged}/7 повних днів із записами.`,
    protein_low: `Головний тижневий гальмівний фактор — білок: у середньому ${formatRounded(
      context.coach.averageProtein
    )} г при цілі ${formatRounded(context.coach.proteinTarget)} г.`,
    water_low: `Головний тижневий гальмівний фактор — вода: у середньому ${formatRounded(
      context.coach.averageWater
    )} мл при цілі ${formatRounded(context.coach.waterTarget)} мл.`,
    breakfast_skipped: `Головний тижневий гальмівний фактор — старт дня: сніданок пропущено ${context.coach.breakfastSkippedDays} раз(и) у днях із логами.`,
    fiber_low: `Головний тижневий гальмівний фактор — клітковина: у середньому ${formatRounded(
      context.coach.averageFiber
    )} г і це ще замало.`,
    calories_high: `Головний тижневий гальмівний фактор — перебір: у середньому ${formatRounded(
      context.coach.averageCalories
    )} ккал при цілі ${formatRounded(context.coach.calorieTarget)} ккал.`,
    calories_low: `Головний тижневий гальмівний фактор — недобір: у середньому ${formatRounded(
      context.coach.averageCalories
    )} ккал при цілі ${formatRounded(context.coach.calorieTarget)} ккал.`,
    meal_pattern: `Головний тижневий гальмівний фактор — ритм: у середньому ${context.coach.averageMeals.toFixed(
      1
    )} повноцінних слотів їжі на день.`,
    weight_trend: `Головний тижневий гальмівний фактор — тренд ваги: зміна ${context.coach.weightChange.toFixed(
      1
    )} кг.`,
    on_track: `Тиждень виглядає стабільно: оцінка ${context.coach.score}/100.`,
  } as const;

  return byInsight[context.coachPrimaryInsight];
};

const getCoachLever = (context: AssistantRuntimeContext) => {
  if (context.language === "pl") {
    const byInsight = {
      logging_low:
        "Reguła tygodnia: najpierw domykaj wpisy, a dopiero potem oceniaj jakość dnia.",
      protein_low:
        "Reguła tygodnia: pierwszy większy posiłek oprzyj o 25-35 g białka, żeby nie gonić wyniku wieczorem.",
      water_low:
        "Reguła tygodnia: zamknij dwie porcje wody wcześniej w ciągu dnia, zamiast nadrabiać wszystko wieczorem.",
      breakfast_skipped:
        "Reguła tygodnia: ustaw prosty pierwszy posiłek, żeby nie zaczynać dnia od nadrabiania.",
      fiber_low:
        "Reguła tygodnia: dodaj jeden stały element z błonnikiem każdego dnia.",
      calories_high:
        "Reguła tygodnia: wyrównuj jeden posiłek dziennie, zamiast próbować naprawiać cały dzień restrykcją.",
      calories_low:
        "Reguła tygodnia: dołóż jeden stabilny posiłek albo przekąskę, żeby nie kończyć dnia zbyt nisko.",
      meal_pattern:
        "Reguła tygodnia: zamknij trzy pełne sloty posiłków, zanim sięgniesz po losowe przekąski.",
      weight_trend:
        "Reguła tygodnia: trzymaj 7 spokojnych dni pod jeden cel, zamiast skakać między strategiami.",
      on_track:
        "Reguła tygodnia: powtarzaj ten sam rytm, bo właśnie on daje najlepszy wynik.",
    } as const;

    return byInsight[context.coachPrimaryInsight];
  }

  const byInsight = {
    logging_low:
      "Правило тижня: спершу закривайте логування, а вже потім оцінюйте якість дня.",
    protein_low:
      "Правило тижня: перший великий прийом їжі прив’язуйте до 25-35 г білка, щоб не доганяти ввечері.",
    water_low:
      "Правило тижня: закривайте дві порції води раніше протягом дня, а не наздоганяйте все ввечері.",
    breakfast_skipped:
      "Правило тижня: поставте простий перший прийом їжі, щоб не починати день із наздоганяння.",
    fiber_low: "Правило тижня: додайте один стабільний елемент із клітковиною щодня.",
    calories_high:
      "Правило тижня: вирівнюйте один прийом їжі на день, а не намагайтеся карати себе за весь день.",
    calories_low:
      "Правило тижня: додайте один стабільний прийом або перекус, щоб не провалювати день по енергії.",
    meal_pattern:
      "Правило тижня: закривайте три повноцінні слоти їжі, перш ніж тягнутися до випадкових перекусів.",
    weight_trend:
      "Правило тижня: тримайте 7 спокійних днів під одну мету, а не стрибайте між стратегіями.",
    on_track:
      "Правило тижня: повторюйте той самий ритм, бо саме він зараз працює найкраще.",
  } as const;

  return byInsight[context.coachPrimaryInsight];
};

const getMotivationLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  const freeDayReady = canUseFreeDay(context.motivation.freeDayLastUsedAt);
  const paidDayReady = canUsePaidDay(context.motivation.paidDayLastUsedMonth);

  if (context.language === "pl") {
    if (signals.openTasks === 0) {
      return "Nie masz już otwartych zadań, więc najlepszy ruch to po prostu utrzymać rytm jutro bez dokładania sobie presji.";
    }

    const availability = freeDayReady
      ? "Darmowy day off jest dostępny, ale lepiej zostawić go jako rezerwę niż używać odruchowo."
      : paidDayReady
        ? "Darmowy day off jeszcze się nie otworzył, ale miesięczny paid day off jest dostępny jako plan B."
        : "Day off jest teraz zamknięty, więc najbardziej opłaca się domknąć dziś jedno krótkie zadanie.";

    return signals.openTasks === 1
      ? `Masz tylko jeden otwarty task, więc najlepiej zamknąć go od razu. ${availability}`
      : `Masz kilka otwartych tasków, więc wybierz najkrótszy i odbuduj momentum jednym szybkim domknięciem. ${availability}`;
  }

  if (signals.openTasks === 0) {
    return "У вас уже немає відкритих задач, тож найкращий хід — просто втримати цей ритм завтра без зайвого тиску.";
  }

  const availability = freeDayReady
    ? "Безкоштовний day off уже доступний, але краще лишити його як резерв, а не витрачати автоматично."
    : paidDayReady
      ? "Безкоштовний day off ще не відкрився, але місячний paid day off уже може бути планом Б."
      : "Day off зараз закритий, тож найвигідніше добити сьогодні хоча б одну коротку задачу.";

  return signals.openTasks === 1
    ? `У вас одна відкрита задача, тож найкраще закрити її одразу. ${availability}`
    : `Є кілька відкритих задач, тож виберіть найкоротшу і поверніть momentum одним швидким закриттям. ${availability}`;
};

const getFollowUps = (
  intent: AssistantQuickQuestionId,
  signals: AssistantSignals
): AssistantQuickQuestionId[] => {
  switch (intent) {
    case "day_status":
      return signals.primaryFocus === "protein"
        ? ["protein_help", "next_meal"]
        : signals.primaryFocus === "recover"
          ? ["next_meal", "coach_focus"]
          : signals.primaryFocus === "water"
            ? ["water_help", "next_meal"]
            : ["protein_help", "water_help"];
    case "protein_help":
      return ["next_meal", "day_status"];
    case "water_help":
      return ["day_status", "weight_help"];
    case "weight_help":
      return ["coach_focus", "water_help"];
    case "next_meal":
      return ["protein_help", "day_status"];
    case "coach_focus":
      return signals.proteinState !== "hit"
        ? ["protein_help", "day_status"]
        : ["weight_help", "motivation_focus"];
    case "motivation_focus":
      return signals.primaryFocus === "protein"
        ? ["protein_help", "coach_focus"]
        : ["coach_focus", "day_status"];
    default:
      return ["day_status", "protein_help"];
  }
};

const ukCopy = {
  previewBadge: "Локальний runtime preview",
  remoteBadge: "Хмарний runtime",
  honestyNote:
    "Відповідь зібрана локально з профілю, щоденника, coach-аналітики та мотиваційного стану.",
  remoteHonestyNote:
    "Відповідь зібрана через хмарний AI runtime з урахуванням поточного контексту та збереженої історії діалогу.",
};

const plCopy = {
  previewBadge: "Lokalny runtime preview",
  remoteBadge: "Runtime chmurowy",
  honestyNote:
    "Ta odpowiedź została złożona lokalnie z profilu, dziennika, analizy coacha i stanu motywacji.",
  remoteHonestyNote:
    "Ta odpowiedź została przygotowana przez chmurowy runtime AI z użyciem bieżącego kontekstu i zapisanej historii rozmowy.",
};

const byLanguage = {
  uk: ukCopy,
  pl: plCopy,
} as const;

export const buildAssistantWelcomeMessage = (
  context: AssistantRuntimeContext
): AssistantRuntimeResponse => {
  const signals = deriveSignals(context);
  const text =
    context.language === "pl"
      ? `${context.assistantName} jest gotowy. ${getSnapshotLine(context)} ${getPriorityLine(
          context,
          signals
        )} Mogę szybko rozłożyć dzień, białko, fokus tygodnia i motywację na podstawie bieżących danych.`
      : `${context.assistantName} вже на місці. ${getSnapshotLine(context)} ${getPriorityLine(
          context,
          signals
        )} Можу швидко розкласти день, білок, тижневий фокус і мотивацію по ваших поточних даних.`;

  return {
    text,
    mode: "local-preview",
    followUpQuestionIds: getFollowUps("day_status", signals),
  };
};

export const getAssistantModeLabel = (
  context: AssistantRuntimeContext,
  mode: AssistantRuntimeResponse["mode"]
) =>
  mode === "remote-cloud"
    ? byLanguage[context.language].remoteBadge
    : byLanguage[context.language].previewBadge;

export const getAssistantHonestyNote = (
  context: AssistantRuntimeContext,
  mode: AssistantRuntimeResponse["mode"]
) =>
  mode === "remote-cloud"
    ? byLanguage[context.language].remoteHonestyNote
    : byLanguage[context.language].honestyNote;

export const buildLocalAssistantReply = ({
  question,
  context,
  quickQuestionId,
}: AssistantQuestionInput): AssistantRuntimeResponse => {
  const intent = detectIntent({ question, quickQuestionId });
  const signals = deriveSignals(context);

  const textByIntent = {
    day_status: [
      getSnapshotLine(context),
      getPriorityLine(context, signals),
      getActionLine(context, signals),
      signals.loggingState !== "solid"
        ? context.language === "pl"
          ? "Dopóki log dnia jest lekki, traktuj tę odpowiedź jako kierunek, a nie wyrok."
          : "Поки лог дня ще легкий, сприймайте цю відповідь як напрямок, а не вирок."
        : "",
      getLightHumorLine(context, signals),
    ]
      .filter(Boolean)
      .join(" "),
    protein_help:
      signals.proteinState === "hit"
        ? [
            context.language === "pl"
              ? `Po stronie białka jesteś już blisko celu: ${formatRounded(
                  context.proteinConsumed
                )}/${formatRounded(context.proteinTarget)} g.`
              : `По білку ви вже близько до цілі: ${formatRounded(
                  context.proteinConsumed
                )}/${formatRounded(context.proteinTarget)} г.`,
            context.language === "pl"
              ? signals.calorieState === "tight"
                ? "Najważniejsze teraz to nie rozbić małego budżetu kalorii losowymi przekąskami."
                : "Najważniejsze teraz to utrzymać jakość dnia i nie dokładać pustych kalorii."
              : signals.calorieState === "tight"
                ? "Тепер головне не розкидати невеликий бюджет калорій випадковими перекусами."
                : "Тепер головне втримати якість дня і не добивати його пустими калоріями.",
          ]
            .filter(Boolean)
            .join(" ")
        : [
            context.language === "pl"
              ? `Do komfortowego poziomu białka brakuje jeszcze około ${formatRounded(
                  signals.proteinGap
                )} g.`
              : `До комфортної білкової зони бракує ще близько ${formatRounded(
                  signals.proteinGap
                )} г.`,
            `${getActionLead(context)} ${
              context.language === "pl"
                ? `najłatwiej domknąć to jednym konkretnym posiłkiem, na przykład ${joinIdeas(
                    context,
                    signals
                  )}.`
                : `найпростіше закрити це одним чітким прийомом, наприклад ${joinIdeas(
                    context,
                    signals
                  )}.`
            }`,
            context.language === "pl"
              ? signals.calorieState === "tight" || signals.calorieState === "over"
                ? "Ponieważ budżet kalorii jest już wąski, trzymaj się lekkiego białka bez ciężkich dodatków."
                : "Jeśli kalorii jest jeszcze dość, lepiej zamknąć to pełnym posiłkiem niż kilkoma chaotycznymi przekąskami."
              : signals.calorieState === "tight" || signals.calorieState === "over"
                ? "Оскільки бюджет калорій уже вузький, тримайтеся легкого білка без важких додатків."
                : "Якщо калорій ще достатньо, краще закрити це повноцінним прийомом, а не кількома хаотичними перекусами.",
            getLightHumorLine(context, signals),
            ]
              .filter(Boolean)
              .join(" "),
    water_help: [
      getWaterLine(context, signals),
      context.language === "pl"
        ? "Woda nie zastępuje posiłku, ale często stabilizuje apetyt i jakość decyzji wieczorem."
        : "Вода не замінює їжу, але часто стабілізує апетит і якість вечірніх рішень.",
    ]
      .filter(Boolean)
      .join(" "),
    weight_help: [
      getWeightLine(context, signals),
      context.language === "pl"
        ? "Jeśli trend stoi, nie tnij od razu kalorii: najpierw sprawdź dokładność wpisów, białko, wodę i weekly check-in."
        : "Якщо тренд стоїть, не ріжте калорії одразу: спершу перевірте точність записів, білок, воду і weekly check-in.",
    ]
      .filter(Boolean)
      .join(" "),
    next_meal: [
      getNextMealLine(context, signals),
      context.language === "pl"
        ? `Aktualnie zostało około ${formatRounded(
            context.caloriesRemaining
          )} kcal i ${formatRounded(signals.proteinGap)} g białka do celu.`
        : `Зараз лишилось близько ${formatRounded(
            context.caloriesRemaining
          )} ккал і ${formatRounded(signals.proteinGap)} г білка до цілі.`,
    ]
      .filter(Boolean)
      .join(" "),
    coach_focus: [
      context.language === "pl"
        ? `Status tygodnia: ${context.coach.score}/100.`
        : `Тижневий статус: ${context.coach.score}/100.`,
      getCoachSnapshot(context),
      getCoachLever(context),
      signals.loggingState !== "solid"
        ? context.language === "pl"
          ? "Dodatkowo: domknij dziś sam log dnia, żeby fokus tygodnia nie opierał się na półdanych."
          : "Окремо: дотягніть сьогодні сам лог дня, щоб тижневий фокус не спирався на напівдані."
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    motivation_focus: [
      context.language === "pl"
        ? `Po stronie motywacji masz teraz ${context.motivation.points} punktów, poziom ${context.motivation.level} i ${signals.openTasks} otwartych zadań.`
        : `По мотивації зараз: ${context.motivation.points} балів, рівень ${context.motivation.level}, відкритих задач ${signals.openTasks}.`,
      getMotivationLine(context, signals),
      getLightHumorLine(context, signals),
    ]
      .filter(Boolean)
      .join(" "),
  } as const;

  return {
    text: textByIntent[intent],
    mode: "local-preview",
    followUpQuestionIds: getFollowUps(intent, signals),
  };
};
