import type { MealEntry } from "@domain/meal/types";
import type { DietStyle, WomenHealthState } from "@domain/profile/types";
import type { ReminderType } from "@shared/api/reminders";
import { getLocalDateKey } from "@shared/lib/date";

export type SupplementRecommendationType =
  | "magnesium"
  | "vitamin_d"
  | "omega_3"
  | "zinc"
  | "probiotics"
  | "iron"
  | "calcium"
  | "b_complex"
  | "hydration"
  | "sleep_recovery";

export type SupplementRecommendationSurface =
  | "dashboard_card"
  | "assistant_chat"
  | "notification"
  | "bedtime_reminder"
  | "meal_interaction_warning";

export interface SupplementRecommendationContext {
  now?: Date;
  meals: MealEntry[];
  waterConsumedMl: number;
  waterTargetMl: number;
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  womenHealth: WomenHealthState;
}

export interface SupplementRecommendation {
  id: string;
  type: SupplementRecommendationType;
  title: string;
  timing: string;
  context: string[];
  blockers: string[];
  confidence: "high" | "medium" | "low";
  assistantReasoning: string;
  action: string;
  why: string;
  deeperExplanation: string;
  surfaces: Record<SupplementRecommendationSurface, string>;
  reminder: {
    type: ReminderType;
    text: string;
  };
}

const hasToken = (value: string, tokens: string[]) => {
  const normalized = value.toLowerCase();

  return tokens.some((token) => normalized.includes(token));
};

const getMealText = (meal: MealEntry) =>
  [
    meal.product.name,
    meal.product.brand ?? "",
    meal.product.category ?? "",
    meal.product.facts?.foodGroup ?? "",
    ...(meal.product.facts?.extraCompounds ?? []),
  ]
    .join(" ")
    .toLowerCase();

const isToday = (meal: MealEntry, now: Date) =>
  getLocalDateKey(meal.eatenAt) === getLocalDateKey(now);

const isRecent = (meal: MealEntry, now: Date, minutes: number) => {
  const eatenAt = new Date(meal.eatenAt).getTime();

  return Number.isFinite(eatenAt) && now.getTime() - eatenAt <= minutes * 60_000;
};

const formatTime = (hours: number, minutes = 0) =>
  `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

const createReminderText = (title: string, time: string, reason: string) =>
  `${title} щодня о ${time}. ${reason}`;

export const createSupplementRecommendationContextSummary = (
  context: SupplementRecommendationContext
) => {
  const now = context.now ?? new Date();
  const todayMeals = context.meals.filter((meal) => isToday(meal, now));
  const recentMeals = todayMeals.filter((meal) => isRecent(meal, now, 90));
  const mealTexts = todayMeals.map(getMealText);
  const recentMealTexts = recentMeals.map(getMealText);
  const totalFat = todayMeals.reduce(
    (sum, meal) => sum + (meal.product.nutrients.fat * meal.quantity) / 100,
    0
  );
  const totalCalcium = todayMeals.reduce(
    (sum, meal) => sum + (meal.product.nutrients.calcium * meal.quantity) / 100,
    0
  );
  const totalIron = todayMeals.reduce(
    (sum, meal) => sum + (meal.product.nutrients.iron * meal.quantity) / 100,
    0
  );
  const totalFiber = todayMeals.reduce(
    (sum, meal) => sum + (meal.product.nutrients.fiber * meal.quantity) / 100,
    0
  );
  const hasRecentCaffeine = recentMealTexts.some((text) =>
    hasToken(text, ["coffee", "кава", "кофе", "espresso", "caffeine", "кофеин", "кофеїн"])
  );
  const hasFatMeal = totalFat >= 12;
  const hasFermentedFood = mealTexts.some((text) =>
    hasToken(text, ["yogurt", "йогурт", "kefir", "кефір", "kimchi", "sauerkraut"])
  );
  const hasFishOrOmega = mealTexts.some((text) =>
    hasToken(text, ["salmon", "fish", "риба", "лосось", "тунець", "omega", "омега"])
  );
  const hasExcludedDairy = [...context.allergies, ...context.excludedIngredients].some((item) =>
    hasToken(item, ["milk", "dairy", "lactose", "молоко", "лактоза"])
  );
  const waterRatio =
    context.waterTargetMl > 0 ? context.waterConsumedMl / context.waterTargetMl : 0;
  const hour = now.getHours();

  return {
    now,
    todayMeals,
    recentMeals,
    mealCount: todayMeals.length,
    hasRecentCaffeine,
    hasFatMeal,
    hasFermentedFood,
    hasFishOrOmega,
    hasExcludedDairy,
    totalFat,
    totalCalcium,
    totalIron,
    totalFiber,
    waterRatio,
    waterLow: context.waterTargetMl > 0 && waterRatio < 0.55,
    evening: hour >= 18,
    late: hour >= 21,
    pregnancyMode: context.womenHealth.mode === "pregnant",
    veganOrVegetarian: context.dietStyle === "vegan" || context.dietStyle === "vegetarian",
  };
};

export const buildSupplementRecommendations = (
  context: SupplementRecommendationContext
): SupplementRecommendation[] => {
  const summary = createSupplementRecommendationContextSummary(context);
  const dinnerTime = formatTime(19, 30);
  const bedtimeTime = formatTime(22, 0);
  const breakfastTime = formatTime(9, 0);
  const middayTime = formatTime(13, 0);
  const blockersForZinc = summary.hasRecentCaffeine
    ? ["Кава була менше 90 хв тому — цинк краще перенести пізніше."]
    : [];
  const blockersForIron = [
    ...(summary.hasRecentCaffeine
      ? ["Кава була недавно — залізо краще не ставити поруч із кофеїном."]
      : []),
    ...(summary.totalCalcium > 350
      ? ["Сьогодні вже є кальцій у їжі — залізо краще рознести з молочними/кальцієм."]
      : []),
    ...(summary.pregnancyMode && !context.womenHealth.doctorConfirmed
      ? ["У режимі вагітності дозування заліза тільки за планом лікаря."]
      : []),
  ];

  return [
    {
      id: "vitamin-d-contextual",
      type: "vitamin_d",
      title: "Вітамін D",
      timing: summary.hasFatMeal ? "з найближчим прийомом їжі" : "під час обіду або вечері з жирами",
      context: [
        summary.hasFatMeal
          ? "Сьогодні вже є їжа з жирами, це зручне вікно для жиророзчинних добавок."
          : "Жирів у сьогоднішніх прийомах поки мало.",
        "Сонце я не бачу в даних, тому врахуй реальний день вручну.",
      ],
      blockers: [],
      confidence: summary.hasFatMeal ? "high" : "medium",
      assistantReasoning: summary.hasFatMeal
        ? "Краще прив'язати D до їжі з жирами, щоб не робити окремий ритуал."
        : "Якщо сьогодні майже не було сонця, D краще поставити на прийом їжі з жирами.",
      action: summary.hasFatMeal ? "Прийняти з найближчим прийомом їжі" : "Перенести на обід або вечерю",
      why: "Так зазвичай легше підтримати регулярність і засвоєння.",
      deeperExplanation:
        "Вітамін D жиророзчинний, тому нагадування краще прив'язувати до їжі, де є жири. Це не замінює аналізи або план лікаря.",
      surfaces: {
        dashboard_card:
          "Сонце не відстежую автоматично. Якщо його було мало, прийми D з прийомом їжі, де є жири.",
        assistant_chat:
          "Я б поставив D не окремо, а поруч із їжею з жирами — так менше шансів пропустити.",
        notification: "Вітамін D краще прийняти з їжею, де є жири.",
        bedtime_reminder: "D краще не лишати на ніч. Перенеси на сніданок або обід.",
        meal_interaction_warning: "Якщо прийом їжі майже без жирів, D краще перенести.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Вітамін D з їжею", summary.hasFatMeal ? middayTime : dinnerTime, "Краще з прийомом їжі, де є жири."),
      },
    },
    {
      id: "magnesium-recovery",
      type: "magnesium",
      title: "Магній",
      timing: "за 1 годину до сну",
      context: [
        summary.evening ? "Вже вечір — доречно готувати відновлення." : "Краще поставити на вечір, не на ранок.",
        summary.waterLow ? "Води сьогодні мало." : "Вода сьогодні не виглядає критично низькою.",
      ],
      blockers: summary.waterLow
        ? ["Спочатку закрий одну порцію води, щоб не приймати добавку на сухий шлунок."]
        : [],
      confidence: summary.evening ? "high" : "medium",
      assistantReasoning:
        "Схоже, це краще використати як вечірній recovery-якір, а не як випадкову таблетку.",
      action: summary.waterLow ? "Випити воду і поставити магній на вечір" : "Поставити вечірнє нагадування",
      why: "Може допомогти з рутиною розслаблення і стабільним сном.",
      deeperExplanation:
        "Магній часто переносять ближче до вечора. Якщо є ліки, вагітність або симптоми, дозування краще узгоджувати з лікарем.",
      surfaces: {
        dashboard_card: "Магній краще зробити вечірнім recovery-якорем, не випадковою дією.",
        assistant_chat: "Сьогодні я б поставив магній за годину до сну. Якщо води мало — спочатку вода.",
        notification: "Час підготувати сон: вода + магній за планом.",
        bedtime_reminder: "За годину до сну: магній, якщо це є у твоєму плані.",
        meal_interaction_warning: "Якщо шлунок порожній і води мало, краще не поспішати.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Магній для вечірнього відновлення", bedtimeTime, "Краще за 1 годину до сну, з водою."),
      },
    },
    {
      id: "omega-3-fat-window",
      type: "omega_3",
      title: "Омега-3",
      timing: summary.hasFatMeal ? "з основним прийомом їжі" : "перенести на вечерю",
      context: [
        summary.hasFishOrOmega ? "Сьогодні вже була риба або omega-продукт." : "Риби/omega-продуктів сьогодні не видно.",
        summary.hasFatMeal ? "Є прийом їжі з жирами." : "Поки немає зручного прийому з жирами.",
      ],
      blockers: [],
      confidence: "medium",
      assistantReasoning: summary.hasFatMeal
        ? "Омега-3 логічно прив'язати до найбільшого прийому їжі."
        : "Ти сьогодні ще не їв продуктів із жирами — омега-3 краще перенести на вечерю.",
      action: summary.hasFatMeal ? "Прийняти з основною їжею" : "Поставити на вечерю",
      why: "Так зазвичай комфортніше для шлунку і легше не забути.",
      deeperExplanation:
        "Омега-3 часто краще переноситься з їжею. Якщо ти вже їв рибу, нагадування може бути нижчим пріоритетом.",
      surfaces: {
        dashboard_card: "Омега-3 краще йде з основною їжею, особливо якщо в ній є жири.",
        assistant_chat: "Я б не ставив омегу окремо. Дочекайся нормального прийому їжі.",
        notification: "Омега-3: прийми з основною їжею за своїм планом.",
        bedtime_reminder: "Омегу краще перенести з ночі на прийом їжі.",
        meal_interaction_warning: "Якщо страва зовсім без жирів, краще перенести.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Омега-3 з основною їжею", dinnerTime, "Краще разом із прийомом їжі."),
      },
    },
    {
      id: "zinc-caffeine-gap",
      type: "zinc",
      title: "Цинк",
      timing: summary.hasRecentCaffeine ? "через 1-2 години після кави" : "після їжі",
      context: [
        summary.hasRecentCaffeine ? "Кава була недавно." : "Недавньої кави в записах не бачу.",
        summary.mealCount > 0 ? "Сьогодні вже є їжа в щоденнику." : "Їжі сьогодні ще не записано.",
      ],
      blockers: blockersForZinc,
      confidence: summary.hasRecentCaffeine ? "high" : "medium",
      assistantReasoning: summary.hasRecentCaffeine
        ? "Кава була менше години тому — цинк краще прийняти пізніше."
        : "Цинк краще ставити після їжі, щоб не перетворювати це на дію натщесерце.",
      action: summary.hasRecentCaffeine ? "Відкласти цинк" : "Поставити після їжі",
      why: "Так менше ризику дискомфорту і конфлікту з кавовою рутиною.",
      deeperExplanation:
        "Цинк може бути чутливим до контексту прийому. Не поєднуй його з випадковою кавою або іншими добавками без плану.",
      surfaces: {
        dashboard_card: "Цинк краще рознести з кавою і прив'язати до їжі.",
        assistant_chat: "Я бачу кавовий слот — цинк краще не ставити прямо зараз.",
        notification: "Цинк краще прийняти пізніше, не поруч із кавою.",
        bedtime_reminder: "Цинк сьогодні краще закрити раніше, не в останню хвилину.",
        meal_interaction_warning: "Кава поруч із цинком — краще зробити паузу.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Цинк після їжі", middayTime, "Не ставити поруч із кавою."),
      },
    },
    {
      id: "probiotics-routine",
      type: "probiotics",
      title: "Пробіотики",
      timing: "в один стабільний щоденний слот",
      context: [
        summary.hasFermentedFood ? "Сьогодні вже були ферментовані продукти." : "Ферментованих продуктів сьогодні не видно.",
        summary.hasExcludedDairy ? "У профілі є обмеження по молочному/лактозі." : "Молочні обмеження в профілі не виділені.",
      ],
      blockers: summary.hasExcludedDairy
        ? ["Перевір форму пробіотика: не всі варіанти підходять при молочних обмеженнях."]
        : [],
      confidence: "medium",
      assistantReasoning:
        "Пробіотики працюють краще як стабільна рутина, а не як реакція на хаотичний день.",
      action: "Закріпити один час",
      why: "Консистентність важливіша за ідеальний час.",
      deeperExplanation:
        "Пробіотики не треба продавати як швидке рішення. Краще зробити простий повторюваний слот і врахувати переносимість.",
      surfaces: {
        dashboard_card: "Пробіотик краще тримати в одному стабільному слоті.",
        assistant_chat: "Я б не рухав пробіотик щодня. Стабільність тут важливіша.",
        notification: "Пробіотик: час для стабільної рутини.",
        bedtime_reminder: "Якщо пробіотик не закритий, перенеси на звичний слот завтра.",
        meal_interaction_warning: "Перевір склад пробіотика, якщо є молочні обмеження.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Пробіотик", breakfastTime, "Один стабільний слот щодня."),
      },
    },
    {
      id: "iron-separated",
      type: "iron",
      title: "Залізо",
      timing: "окремо від кави та кальцію",
      context: [
        summary.veganOrVegetarian ? "Раціон vegan/vegetarian може потребувати уважнішого контролю заліза." : "Раціон не позначений як vegan/vegetarian.",
        `Залізо з їжі сьогодні: приблизно ${summary.totalIron.toFixed(1)} мг.`,
      ],
      blockers: blockersForIron,
      confidence: blockersForIron.length > 0 ? "high" : "medium",
      assistantReasoning:
        "Залізо не варто ставити як звичайний supplement-чекбокс: важливі кава, кальцій і план лікаря.",
      action: blockersForIron.length > 0 ? "Рознести в часі" : "Поставити окремий слот",
      why: "Так менше шансів зіпсувати взаємодію з їжею або кавою.",
      deeperExplanation:
        "Залізо краще приймати лише за потреби й бажано за лабораторним/лікарським планом. У вагітності не підбирати дозування самостійно.",
      surfaces: {
        dashboard_card: "Залізо краще тримати окремо від кави й кальцію.",
        assistant_chat: "Я не буду радити дозу заліза. Можу допомогти рознести його з кавою/кальцієм.",
        notification: "Залізо: перевір, що поруч немає кави або кальцію.",
        bedtime_reminder: "Залізо краще не переносити хаотично на ніч без плану.",
        meal_interaction_warning: "Кава або кальцій поруч із залізом — краще рознести.",
      },
      reminder: {
        type: summary.pregnancyMode ? "pregnancy_supplement" : "medication",
        text: createReminderText("Залізо за планом", formatTime(11, 0), "Окремо від кави та кальцію; дозування за планом лікаря."),
      },
    },
    {
      id: "calcium-separated",
      type: "calcium",
      title: "Кальцій",
      timing: "з їжею, окремо від заліза",
      context: [
        `Кальцій з їжі сьогодні: приблизно ${summary.totalCalcium.toFixed(0)} мг.`,
        summary.hasExcludedDairy ? "Молочні продукти обмежені в профілі." : "Молочні обмеження не виділені.",
      ],
      blockers: summary.totalIron > 6 ? ["Якщо є залізо за планом, не став кальцій у той самий слот."] : [],
      confidence: "medium",
      assistantReasoning:
        "Кальцій краще планувати навколо їжі й не змішувати зі слотом заліза.",
      action: "Поставити окремо від заліза",
      why: "Це знижує ризик конфлікту між добавками.",
      deeperExplanation:
        "Кальцій не має бути автоматичною порадою для всіх. Краще врахувати раціон, молочні обмеження і призначення.",
      surfaces: {
        dashboard_card: "Кальцій: з їжею, але не в один слот із залізом.",
        assistant_chat: "Я бачу потенційний конфлікт кальцій/залізо — краще рознести.",
        notification: "Кальцій краще приймати з їжею і окремо від заліза.",
        bedtime_reminder: "Якщо кальцій пропущений, не змішуй його із залізом вночі.",
        meal_interaction_warning: "Кальцій і залізо краще не ставити разом.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("Кальцій з їжею", dinnerTime, "Окремо від заліза."),
      },
    },
    {
      id: "b-complex-morning-energy",
      type: "b_complex",
      title: "B-complex",
      timing: "у першій половині дня",
      context: [
        summary.mealCount === 0 ? "Сніданок/їжа ще не записані." : "Їжа сьогодні вже є.",
        summary.late ? "Вже пізно — краще перенести на завтра." : "Ще не пізній вечір.",
      ],
      blockers: summary.late ? ["Пізній прийом може погано вписатися в сонну рутину."] : [],
      confidence: summary.late ? "high" : "medium",
      assistantReasoning:
        "B-complex краще не залишати на вечір. Це має бути ранковий energy-якір.",
      action: summary.late ? "Перенести на ранок" : "Поставити на ранок після їжі",
      why: "Так він не конфліктує з вечірнім відновленням.",
      deeperExplanation:
        "B-вітаміни часто зручніше планувати в першій половині дня. Це організаційна порада, не медичне призначення.",
      surfaces: {
        dashboard_card: "B-complex краще тримати в ранковому слоті.",
        assistant_chat: "Я б не переносив B-complex на вечір — поставимо на ранок.",
        notification: "B-complex краще прийняти після ранкової їжі.",
        bedtime_reminder: "B-complex сьогодні краще вже не чіпати, перенеси на ранок.",
        meal_interaction_warning: "Якщо ще не було їжі, краще не приймати поспіхом.",
      },
      reminder: {
        type: "medication",
        text: createReminderText("B-complex після сніданку", breakfastTime, "Краще в першій половині дня."),
      },
    },
    {
      id: "hydration-before-supplements",
      type: "hydration",
      title: "Вода перед добавками",
      timing: summary.waterLow ? "зараз" : "порціями протягом дня",
      context: [
        context.waterTargetMl > 0
          ? `Вода: ${context.waterConsumedMl}/${context.waterTargetMl} мл.`
          : "Ціль води не задана.",
        summary.waterLow ? "Поточний рівень нижче робочого темпу." : "Темп води не критичний.",
      ],
      blockers: [],
      confidence: context.waterTargetMl > 0 ? "high" : "low",
      assistantReasoning: summary.waterLow
        ? "Сьогодні мало води — частину добавок краще не приймати поспіхом."
        : "Вода підтримує базову переносимість рутини добавок.",
      action: summary.waterLow ? "Закрити одну порцію води" : "Тримати темп",
      why: "Це простий спосіб знизити хаос у supplement-рутині.",
      deeperExplanation:
        "Вода не лікує й не замінює харчування, але без неї reminder-система швидко стає механічною і менш комфортною.",
      surfaces: {
        dashboard_card: "Перед добавками закрий воду, якщо день просідає.",
        assistant_chat: "Я б спочатку закрив воду, а вже потім рухав добавки.",
        notification: "Спочатку вода, потім добавки за планом.",
        bedtime_reminder: "Перед вечірніми добавками випий воду, якщо день просів.",
        meal_interaction_warning: "Порожній шлунок + мало води — поганий контекст для поспіху.",
      },
      reminder: {
        type: "water",
        text: createReminderText("Вода перед добавками", formatTime(18, 0), "Закрити одну порцію води перед вечірньою рутиною."),
      },
    },
    {
      id: "sleep-recovery-stack",
      type: "sleep_recovery",
      title: "Сон і відновлення",
      timing: "останній спокійний слот дня",
      context: [
        summary.late ? "Вже пізній вечір." : "Ще є час підготувати вечірній слот.",
        summary.waterLow ? "Вода сьогодні нижче темпу." : "Вода не виглядає головною проблемою.",
      ],
      blockers: summary.late ? ["Не додавай нові складні дії в останню хвилину."] : [],
      confidence: "medium",
      assistantReasoning:
        "Вечірня рутина має бути короткою: вода, магній за планом, без нових експериментів.",
      action: "Залишити тільки простий вечірній стек",
      why: "Це краще підтримує повторюваність і сон.",
      deeperExplanation:
        "Recovery UX має зменшувати когнітивне навантаження. Якщо рекомендація ввечері вимагає аналізу, її краще перенести.",
      surfaces: {
        dashboard_card: "На вечір лишаємо простий recovery-стек: вода + те, що вже в плані.",
        assistant_chat: "Я не буду додавати нові речі перед сном. Краще стабільний короткий ритуал.",
        notification: "Вечірній recovery: вода і тільки заплановані добавки.",
        bedtime_reminder: "Закрий короткий вечірній стек без нових експериментів.",
        meal_interaction_warning: "Пізня важка їжа може зрушити supplement-рутину.",
      },
      reminder: {
        type: "habit",
        text: createReminderText("Вечірній recovery-стек", bedtimeTime, "Вода і тільки заплановані добавки без експериментів."),
      },
    },
  ];
};

export const getPrimarySupplementRecommendation = (
  recommendations: SupplementRecommendation[]
) =>
  [...recommendations].sort((left, right) => {
    const confidenceRank = { high: 0, medium: 1, low: 2 } as const;
    const blockerRank = left.blockers.length === right.blockers.length
      ? 0
      : left.blockers.length > right.blockers.length
        ? -1
        : 1;

    return blockerRank || confidenceRank[left.confidence] - confidenceRank[right.confidence];
  })[0] ?? null;
