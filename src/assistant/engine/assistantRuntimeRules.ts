import { canUseFreeDay, canUsePaidDay } from "@domain/profile/motivation";
import { buildAssistantPersonalizationPlan } from "@core/assistant/personalizationPlan";
import type { DietStyle } from "@domain/profile/types";
import type {
  AssistantQuestionInput,
  AssistantQuickQuestionId,
  AssistantRuntimeContext,
  AssistantRuntimeResponse,
} from "@domain/assistant/types";

type CalorieState = "over" | "tight" | "open" | "wide";
type ProteinState = "low" | "close" | "hit";
type WaterState = "low" | "close" | "hit";
type WeightState = "due" | "plateau" | "moving";
type LoggingState = "empty" | "light" | "solid";
type MealIdeaBucket = "light" | "full";
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

const getActivePersonality = (context: AssistantRuntimeContext) =>
  context.memory?.personality ?? context.assistantPersonality;

const getPersonalityLine = (context: AssistantRuntimeContext) => {
  const personality = getActivePersonality(context);

  if (context.language === "en") {
    if (personality.strictness >= 0.7) {
      return "I will keep the advice direct and accountable, without making the day feel punitive.";
    }

    if (personality.motivation >= 0.88) {
      return "I will keep the next step energetic and concrete.";
    }

    if (personality.warmth >= 0.8) {
      return "I will keep the tone calm, supportive, and practical.";
    }

    return "I will keep the tone practical and balanced.";
  }

  if (context.language === "pl") {
    if (personality.strictness >= 0.7) {
      return "Będę prowadzić konkretnie i odpowiedzialnie, bez karania dnia.";
    }

    if (personality.motivation >= 0.88) {
      return "Będę trzymać kolejny krok energiczny i konkretny.";
    }

    if (personality.warmth >= 0.8) {
      return "Będę trzymać ton spokojny, wspierający i praktyczny.";
    }

    return "Będę trzymać ton praktyczny i zbalansowany.";
  }

  if (personality.strictness >= 0.7) {
    return "Я триматиму поради конкретними й відповідальними, але без покарання за день.";
  }

  if (personality.motivation >= 0.88) {
    return "Я триматиму наступний крок енергійним і конкретним.";
  }

  if (personality.warmth >= 0.8) {
    return "Я триматиму тон спокійним, підтримуючим і практичним.";
  }

  return "Я триматиму тон практичним і збалансованим.";
};

const getOnboardingPersonalizationLine = (context: AssistantRuntimeContext) => {
  const personalization = buildAssistantPersonalizationPlan(
    context.onboarding,
    context.language
  );

  if (context.language === "en") {
    return `Onboarding focus: ${personalization.frictionLabel}. Support style: ${personalization.motivationLabel}. ${personalization.actionHint}`;
  }

  if (context.language === "pl") {
    return `Fokus z onboardingu: ${personalization.frictionLabel}. Styl wsparcia: ${personalization.motivationLabel}. ${personalization.actionHint}`;
  }

  return `Фокус з онбордингу: ${personalization.frictionLabel}. Стиль підтримки: ${personalization.motivationLabel}. ${personalization.actionHint}`;
};

const getPromptContextLine = (context: AssistantRuntimeContext) => {
  const promptContext = context.promptContext;
  const duties = promptContext.duties.join(", ");
  const defaultAction = promptContext.defaultAction
    ? `${promptContext.defaultAction.label} -> ${promptContext.defaultAction.route}`
    : "none";

  if (context.language === "en") {
    return `Screen context: ${promptContext.screenName} (${promptContext.area}). Duties: ${duties || "none"}. Default action: ${defaultAction}.`;
  }

  if (context.language === "pl") {
    return `Kontekst ekranu: ${promptContext.screenName} (${promptContext.area}). Obowiązki: ${duties || "brak"}. Domyślna akcja: ${defaultAction}.`;
  }

  return `Контекст екрана: ${promptContext.screenName} (${promptContext.area}). Обов'язки: ${duties || "немає"}. Дія за замовчуванням: ${defaultAction}.`;
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
  en: {
    balanced: {
      light: ["skyr or Greek yogurt", "chicken with vegetables"],
      full: ["rice with chicken", "yogurt with oats"],
    },
    vegetarian: {
      light: ["cottage cheese or skyr", "vegetable omelet"],
      full: ["tofu with rice", "yogurt with oats"],
    },
    vegan: {
      light: ["tofu with vegetables", "soy yogurt"],
      full: ["tempeh with rice", "lentils with rice"],
    },
    pescatarian: {
      light: ["tuna and vegetables", "skyr or yogurt"],
      full: ["salmon with rice", "tuna with potatoes"],
    },
    low_carb: {
      light: ["eggs and cottage cheese", "salmon with salad"],
      full: ["cheese omelet", "tofu with vegetables and nuts"],
    },
    gluten_free: {
      light: ["eggs and vegetables", "skyr or yogurt"],
      full: ["rice with chicken", "potatoes with salmon"],
    },
  },
};

type MealIdeaLanguageSet = (typeof mealIdeas)[keyof typeof mealIdeas];
type MealIdeaDietSet = MealIdeaLanguageSet[keyof MealIdeaLanguageSet];
type GuidedTextByIntent = Record<AssistantQuickQuestionId, string>;

const getMealIdeaLanguageSet = (
  language: AssistantRuntimeContext["language"]
): MealIdeaLanguageSet => {
  switch (language) {
    case "pl":
      return mealIdeas.pl;
    case "en":
      return mealIdeas.en;
    case "uk":
    default:
      return mealIdeas.uk;
  }
};

const getMealIdeaDietSet = (
  languageSet: MealIdeaLanguageSet,
  dietStyle: DietStyle
): MealIdeaDietSet => {
  switch (dietStyle) {
    case "vegetarian":
      return languageSet.vegetarian;
    case "vegan":
      return languageSet.vegan;
    case "pescatarian":
      return languageSet.pescatarian;
    case "low_carb":
      return languageSet.low_carb;
    case "gluten_free":
      return languageSet.gluten_free;
    case "balanced":
    default:
      return languageSet.balanced;
  }
};

const getMealIdeaItems = (
  context: AssistantRuntimeContext,
  bucket: MealIdeaBucket
) => {
  const languageSet = getMealIdeaLanguageSet(context.language);
  const dietSet = getMealIdeaDietSet(languageSet, context.dietStyle);

  switch (bucket) {
    case "full":
      return dietSet.full;
    case "light":
    default:
      return dietSet.light;
  }
};

const getGuidedTextByIntent = (
  textByIntent: GuidedTextByIntent,
  intent: AssistantQuickQuestionId
) => {
  switch (intent) {
    case "protein_help":
      return textByIntent.protein_help;
    case "water_help":
      return textByIntent.water_help;
    case "weight_help":
      return textByIntent.weight_help;
    case "next_meal":
      return textByIntent.next_meal;
    case "coach_focus":
      return textByIntent.coach_focus;
    case "motivation_focus":
      return textByIntent.motivation_focus;
    case "day_status":
    default:
      return textByIntent.day_status;
  }
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

  switch (context.dailyContext.primaryFocus) {
    case "log_first_meal":
    case "complete_day":
      primaryFocus = "log_day";
      break;
    case "calories_high":
      primaryFocus = "recover";
      break;
    case "protein":
      primaryFocus = "protein";
      break;
    case "water":
      primaryFocus = "water";
      break;
    case "fiber":
      primaryFocus = primaryFocus === "maintain" ? "coach" : primaryFocus;
      break;
    case "calories_low":
      primaryFocus = primaryFocus === "maintain" ? "log_day" : primaryFocus;
      break;
    case "steady":
      break;
    default:
      break;
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
  const items = getMealIdeaItems(context, bucket);

  return items
    .slice(0, 2)
    .join(context.language === "pl" ? " albo " : context.language === "en" ? " or " : " або ");
};

const getActionLead = (context: AssistantRuntimeContext) => {
  if (context.language === "en") {
    if (context.assistantRole === "coach") {
      return context.assistantTone === "gentle"
        ? "The most important step now:"
        : "Priority right now:";
    }

    if (context.assistantRole === "friend") {
      return context.assistantTone === "focused"
        ? "Here is what I would do now:"
        : "Best move right now:";
    }

    return "Best next step:";
  }

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
  const personality = getActivePersonality(context);

  if (!context.humorEnabled || personality.humor < 0.45) {
    return "";
  }

  if (context.language === "pl") {
    return signals.primaryFocus === "recover"
      ? "Bez dramatu: dzień nadal da się uspokoić jednym rozsądnym ruchem."
      : "Bez spiny: tu nie trzeba dnia idealnego, tylko jednego dobrego ruchu.";
  }

  if (context.language === "en") {
    return signals.primaryFocus === "recover"
      ? "No drama: this day can still settle with one sensible move."
      : "No pressure: you do not need a perfect day, just one good move.";
  }

  return signals.primaryFocus === "recover"
    ? "Без драми: день ще можна вирівняти одним розумним кроком."
    : "Без напруги: тут не потрібен ідеальний день, потрібен один влучний хід.";
};

const getPersonalContactLine = (context: AssistantRuntimeContext) => {
  const { relationshipStatus, supportSystem, petCompanion } = context.personalDetails;

  if (context.language === "en") {
    const supportLine =
      supportSystem === "partner_supports"
        ? "We can build small steps around your partner's support without turning it into pressure."
        : supportSystem === "partner_neutral"
          ? "I will keep steps independent so they do not require another person's buy-in."
          : supportSystem === "family_friends"
            ? "Simple steps that you can explain to close people in one sentence should work well."
            : supportSystem === "low_support"
              ? "I will keep the tone steadier and more supportive, because low support calls for calm consistency."
              : supportSystem === "self"
                ? "I will suggest steps you can do on your own."
                : "";
    const relationshipLine =
      relationshipStatus === "single"
        ? "I will not assume support from another person."
        : relationshipStatus === "married" || relationshipStatus === "dating"
          ? "If it helps, tiny shared rituals can make the plan easier."
          : "";
    const petLine =
      petCompanion === "dog"
        ? "With a dog around, water or a short walk can pair nicely with walk time."
        : petCompanion === "cat"
          ? "With a cat around, calm home rituals will fit better than rushed ones."
          : petCompanion === "cat_and_dog"
            ? "With pets around, short rituals around a walk or home pause can work well."
            : "";

    return [supportLine, relationshipLine, petLine].filter(Boolean).join(" ");
  }

  if (context.language === "pl") {
    const supportLine =
      supportSystem === "partner_supports"
        ? "Można oprzeć małe kroki o wsparcie partnera/partnerki, bez robienia z tego presji."
        : supportSystem === "partner_neutral"
          ? "Lepiej dawać Ci samodzielne kroki, które nie wymagają zgody ani udziału drugiej osoby."
          : supportSystem === "family_friends"
            ? "Dobrze działają u Ciebie proste kroki, które można powiedzieć bliskim jednym zdaniem."
            : supportSystem === "low_support"
              ? "Będę trzymać ton bardziej wspierający, bo przy niskim wsparciu liczy się spokojna stabilność."
              : supportSystem === "self"
                ? "Będę podawać kroki tak, żeby dało się je zrobić samodzielnie."
                : "";
    const relationshipLine =
      relationshipStatus === "single"
        ? "Nie będę zakładać wsparcia drugiej osoby."
        : relationshipStatus === "married" || relationshipStatus === "dating"
          ? "Jeśli to pomaga, można wplatać mikro-rytuały z drugą osobą."
          : "";
    const petLine =
      petCompanion === "dog"
        ? "Przy psie można podpinać wodę albo krótki ruch pod spacer."
        : petCompanion === "cat"
          ? "Przy kocie najlepiej budować spokojne domowe rytuały bez pośpiechu."
          : petCompanion === "cat_and_dog"
            ? "Przy zwierzakach dobrze działają krótkie rytuały wokół spaceru lub domowej pauzy."
            : "";

    return [supportLine, relationshipLine, petLine].filter(Boolean).join(" ");
  }

  const supportLine =
    supportSystem === "partner_supports"
      ? "Можна опирати маленькі кроки на підтримку другої половинки, без перетворення цього на тиск."
      : supportSystem === "partner_neutral"
        ? "Краще давати вам автономні кроки, які не потребують участі другої людини."
        : supportSystem === "family_friends"
          ? "Для вас добре працюють прості кроки, які легко пояснити близьким одним реченням."
          : supportSystem === "low_support"
            ? "Я триматиму тон м’якшим і підтримуючим, бо при низькій підтримці важлива спокійна стабільність."
            : supportSystem === "self"
              ? "Я даватиму кроки так, щоб їх можна було зробити самостійно."
              : "";
  const relationshipLine =
    relationshipStatus === "single"
      ? "Не буду припускати підтримку другої людини."
      : relationshipStatus === "married" || relationshipStatus === "dating"
        ? "Якщо це допомагає, можна вплітати маленькі ритуали з другою половинкою."
        : "";
  const petLine =
    petCompanion === "dog"
      ? "Якщо поруч собака, воду або короткий рух можна прив’язувати до прогулянки."
      : petCompanion === "cat"
        ? "Якщо поруч кіт, краще будувати спокійні домашні ритуали без поспіху."
        : petCompanion === "cat_and_dog"
          ? "Якщо поруч є тварини, добре працюють короткі ритуали навколо прогулянки або домашньої паузи."
          : "";

  return [supportLine, relationshipLine, petLine].filter(Boolean).join(" ");
};

const getWomenHealthLine = (context: AssistantRuntimeContext) => {
  const womenHealth = context.womenHealth;

  if (context.gender !== "female" || womenHealth.mode === "none") {
    return "";
  }

  const hasClinicianPlan = womenHealth.doctorConfirmed;
  const weekText = womenHealth.pregnancyWeek
    ? context.language === "en"
      ? `around week ${womenHealth.pregnancyWeek}`
      : context.language === "pl"
        ? `około ${womenHealth.pregnancyWeek}. tygodnia`
        : `приблизно ${womenHealth.pregnancyWeek} тиждень`
    : "";

  if (context.language === "en") {
    if (womenHealth.mode === "pregnant") {
      return [
        `Pregnancy context is active${weekText ? ` (${weekText})` : ""}.`,
        hasClinicianPlan
          ? "I will keep food, water, and reminder suggestions aligned with the clinician plan."
          : "I will stay conservative: no supplement doses, medication changes, diagnosis, or medical certainty.",
      ].join(" ");
    }

    if (womenHealth.mode === "trying_to_conceive") {
      return "Preparing-for-pregnancy context is active, so I will keep guidance gentle and avoid supplement or medication certainty without a clinician plan.";
    }

    return "Postpartum context is active, so I will keep the pace recovery-first and avoid pressure around weight.";
  }

  if (context.language === "pl") {
    if (womenHealth.mode === "pregnant") {
      return [
        `Kontekst ciąży jest aktywny${weekText ? ` (${weekText})` : ""}.`,
        hasClinicianPlan
          ? "Będę trzymać jedzenie, wodę i przypomnienia zgodnie z planem lekarza."
          : "Zostaję ostrożny: bez dawek suplementów, zmian leków, diagnozy i medycznej pewności.",
      ].join(" ");
    }

    if (womenHealth.mode === "trying_to_conceive") {
      return "Kontekst przygotowania do ciąży jest aktywny, więc prowadzę łagodnie i bez pewności co do suplementów lub leków bez planu lekarza.";
    }

    return "Kontekst po porodzie jest aktywny, więc priorytetem jest regeneracja bez presji na wagę.";
  }

  if (womenHealth.mode === "pregnant") {
    return [
      `Контекст вагітності активний${weekText ? ` (${weekText})` : ""}.`,
      hasClinicianPlan
        ? "Я триматиму їжу, воду й нагадування в межах плану лікаря."
        : "Я буду обережним: без доз добавок, змін ліків, діагнозів і медичної впевненості.",
    ].join(" ");
  }

  if (womenHealth.mode === "trying_to_conceive") {
    return "Контекст підготовки до вагітності активний, тож я даватиму м'які поради без впевненості щодо добавок або ліків без плану лікаря.";
  }

  return "Післяпологовий контекст активний, тому пріоритет — відновлення без тиску на вагу.";
};

const getDailyContextLine = (context: AssistantRuntimeContext) => {
  const { dailyContext } = context;

  if (context.language === "en") {
    return `Context engine focus: ${dailyContext.primaryFocus}. Yesterday was ${formatRounded(
      dailyContext.yesterday.calories
    )} kcal and ${formatRounded(dailyContext.yesterday.protein)} g protein.`;
  }

  if (context.language === "pl") {
    return `Fokus context engine: ${dailyContext.primaryFocus}. Wczoraj było ${formatRounded(
      dailyContext.yesterday.calories
    )} kcal i ${formatRounded(dailyContext.yesterday.protein)} g białka.`;
  }

  return `Фокус context engine: ${dailyContext.primaryFocus}. Учора було ${formatRounded(
    dailyContext.yesterday.calories
  )} ккал і ${formatRounded(dailyContext.yesterday.protein)} г білка.`;
};

const getSnapshotLine = (context: AssistantRuntimeContext) => {
  if (context.language === "en") {
    const calories =
      context.caloriesRemaining >= 0
        ? `Today you have ${formatRounded(context.caloriesConsumed)}/${formatRounded(
            context.dailyCalories
          )} kcal, with ${formatRounded(context.caloriesRemaining)} kcal left.`
        : `Today you have ${formatRounded(context.caloriesConsumed)}/${formatRounded(
            context.dailyCalories
          )} kcal, which is ${formatRounded(
            Math.abs(context.caloriesRemaining)
          )} kcal over target.`;

    return `${calories} Protein: ${formatRounded(context.proteinConsumed)}/${formatRounded(
      context.proteinTarget
    )} g. Logged meal slots: ${context.mealEntriesToday}. ${getDailyContextLine(context)}`;
  }

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
    )} g. Zalogowane sloty: ${context.mealEntriesToday}. ${getDailyContextLine(context)}`;
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
  )} г. Записаних слотів їжі: ${context.mealEntriesToday}. ${getDailyContextLine(context)}`;
};

const getPriorityLine = (
  context: AssistantRuntimeContext,
  signals: AssistantSignals
) => {
  if (context.language === "en") {
    const byFocus = {
      log_day:
        "The priority now is to complete today's log, because with 0-1 entries every next suggestion is less certain.",
      recover:
        "The priority now is to calmly steady the day, not to punish it with restriction.",
      protein: `The priority now is protein, because you still need about ${formatRounded(
        signals.proteinGap
      )} g.`,
      water: `The priority now is water: about ${formatRounded(
        signals.waterGapMl
      )} ml left to target.`,
      weight:
        "The priority now is a weight and measurement check-in, because the trend needs fresh data.",
      protect_budget:
        "The priority now is to protect the small calorie budget from random snacks.",
      coach:
        "The priority now is consistency, because the weekly signal still needs calm follow-through.",
      maintain:
        "The priority now is to keep the good rhythm without adding unnecessary corrections.",
    } as const;

    return byFocus[signals.primaryFocus];
  }

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

  if (context.language === "en") {
    const byFocus = {
      log_day: `${lead} add the missing meal or snack first, then judge the rest of the day.`,
      recover: `${lead} keep the rest of the day light and filling with protein and vegetables, then return to your normal target tomorrow without punishment.`,
      protein: `${lead} make one clear protein move, for example ${ideas}.`,
      water: `${lead} drink one 250-300 ml serving of water now and come back for another serving in 60-90 minutes.`,
      weight: `${lead} log weight and basic measurements today, then base calorie decisions on the trend, not one reading.`,
      protect_budget: `${lead} stick to one controlled meal and do not reopen the day to random calories.`,
      coach: `${lead} choose one repeatable rule for today and tomorrow instead of fixing everything at once.`,
      maintain: `${lead} simply repeat the same working pattern at the next meal.`,
    } as const;

    return byFocus[signals.primaryFocus];
  }

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
  if (context.language === "en") {
    if (signals.waterState === "hit") {
      return `Water is done: ${formatRounded(context.waterConsumedMl)}/${formatRounded(
        context.waterTargetMl
      )} ml. Now keep an easy pace without forcing extra intake.`;
    }

    return `Water is at ${Math.round(signals.waterProgress * 100)}% of target: ${formatRounded(
      context.waterConsumedMl
    )}/${formatRounded(context.waterTargetMl)} ml. The simplest move is 250-300 ml now and another serving later.`;
  }

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
  if (context.language === "en") {
    if (signals.weightState === "due") {
      return "Weekly check-in is due: log weight, waist/abdomen/chest, and treat one reading as part of the trend.";
    }

    if (signals.weightState === "plateau") {
      return `The trend looks stable: change is ${context.weightChangeKg.toFixed(
        1
      )} kg. Check logging consistency, protein, and water first, then adjust calories if needed.`;
    }

    return `Latest logged weight is ${context.latestWeight.toFixed(
      1
    )} kg, and trend change is ${context.weightChangeKg.toFixed(
      1
    )} kg. Keep decisions tied to the average, not one day.`;
  }

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

  if (context.language === "en") {
    if (signals.calorieState === "over") {
      return `A light protein meal without heavy extras is best now: ${ideas}.`;
    }

    if (signals.proteinState !== "hit") {
      return `The best next choice is something that closes the protein gap: ${ideas}.`;
    }

    return signals.calorieState === "wide"
      ? `You still have calorie space, so choose a fuller meal: ${ideas}.`
      : `The budget is moderate, so choose a simple meal and avoid random snacks: ${ideas}.`;
  }

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
  if (context.language === "en") {
    const byInsight = {
      logging_low: `The biggest weekly blocker is logging consistency: you have ${context.coach.daysLogged}/7 full logged days.`,
      protein_low: `The biggest weekly blocker is protein: average ${formatRounded(
        context.coach.averageProtein
      )} g against a ${formatRounded(context.coach.proteinTarget)} g target.`,
      water_low: `The biggest weekly blocker is water: average ${formatRounded(
        context.coach.averageWater
      )} ml against a ${formatRounded(context.coach.waterTarget)} ml target.`,
      breakfast_skipped: `The biggest weekly blocker is the start of the day: breakfast was skipped ${context.coach.breakfastSkippedDays} times on logged days.`,
      fiber_low: `The biggest weekly blocker is fiber: average ${formatRounded(
        context.coach.averageFiber
      )} g, which is still low.`,
      calories_high: `The biggest weekly blocker is overshooting calories: average ${formatRounded(
        context.coach.averageCalories
      )} kcal against a ${formatRounded(context.coach.calorieTarget)} kcal target.`,
      calories_low: `The biggest weekly blocker is under-eating: average ${formatRounded(
        context.coach.averageCalories
      )} kcal against a ${formatRounded(context.coach.calorieTarget)} kcal target.`,
      meal_pattern: `The biggest weekly blocker is rhythm: average ${context.coach.averageMeals.toFixed(
        1
      )} full meal slots per day.`,
      weight_trend: `The biggest weekly blocker is the weight trend: change is ${context.coach.weightChange.toFixed(
        1
      )} kg.`,
      on_track: `The week looks stable: score ${context.coach.score}/100.`,
    } as const;

    return byInsight[context.coachPrimaryInsight];
  }

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
  if (context.language === "en") {
    const byInsight = {
      logging_low:
        "Weekly rule: close the log first, then judge the quality of the day.",
      protein_low:
        "Weekly rule: anchor the first bigger meal around 25-35 g protein so you are not chasing it at night.",
      water_low:
        "Weekly rule: finish two water servings earlier in the day instead of catching up in the evening.",
      breakfast_skipped:
        "Weekly rule: set a simple first meal so the day does not start in catch-up mode.",
      fiber_low: "Weekly rule: add one steady fiber item every day.",
      calories_high:
        "Weekly rule: stabilize one meal per day instead of trying to repair the whole day with restriction.",
      calories_low:
        "Weekly rule: add one stable meal or snack so the day does not end too low.",
      meal_pattern:
        "Weekly rule: close three full meal slots before reaching for random snacks.",
      weight_trend:
        "Weekly rule: hold 7 calm days under one goal instead of jumping between strategies.",
      on_track:
        "Weekly rule: repeat the same rhythm, because that is what is working best now.",
    } as const;

    return byInsight[context.coachPrimaryInsight];
  }

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

  if (context.language === "en") {
    if (signals.openTasks === 0) {
      return "You have no open tasks left, so the best move is to keep the rhythm tomorrow without adding pressure.";
    }

    const availability = freeDayReady
      ? "A free day off is available, but it is better kept as a reserve than used automatically."
      : paidDayReady
        ? "The free day off is not open yet, but the monthly paid day off is available as plan B."
        : "Day off is closed right now, so the best value is closing one short task today.";

    return signals.openTasks === 1
      ? `You have one open task, so close it right away if you can. ${availability}`
      : `You have several open tasks, so choose the shortest one and rebuild momentum with one quick completion. ${availability}`;
  }

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
  guidedBadge: "Контекстний режим",
  remoteBadge: "Хмарний режим",
  guidedHonestyNote:
    "Відповідь зібрана з профілю, щоденника, coach-аналітики та мотиваційного стану.",
  remoteHonestyNote:
    "Відповідь зібрана через хмарний AI з урахуванням поточного контексту та збереженої історії діалогу.",
};

const plCopy = {
  guidedBadge: "Tryb kontekstowy",
  remoteBadge: "Tryb chmurowy",
  guidedHonestyNote:
    "Ta odpowiedź została przygotowana z profilu, dziennika, analizy coacha i stanu motywacji.",
  remoteHonestyNote:
    "Ta odpowiedź została przygotowana przez chmurowy AI z użyciem bieżącego kontekstu i zapisanej historii rozmowy.",
};

const enCopy = {
  guidedBadge: "Context mode",
  remoteBadge: "Cloud mode",
  guidedHonestyNote:
    "This answer was built from your profile, diary, coach analysis, and motivation state.",
  remoteHonestyNote:
    "This answer was built through cloud AI using current context and saved conversation history.",
};

const byLanguage = {
  uk: ukCopy,
  pl: plCopy,
  en: enCopy,
} as const;

export const buildAssistantWelcomeMessage = (
  context: AssistantRuntimeContext
): AssistantRuntimeResponse => {
  const signals = deriveSignals(context);
  const contactLine = getPersonalContactLine(context);
  const womenHealthLine = getWomenHealthLine(context);
  const personalityLine = getPersonalityLine(context);
  const onboardingLine = getOnboardingPersonalizationLine(context);
  const promptContextLine = getPromptContextLine(context);
  const text =
    context.language === "en"
      ? `${context.assistantName} is ready. ${personalityLine} ${onboardingLine} ${contactLine} ${womenHealthLine} ${getSnapshotLine(context)} ${getPriorityLine(
          context,
          signals
        )} ${promptContextLine} I can quickly break down your day, protein, weekly focus, and motivation from current data.`
      : context.language === "pl"
      ? `${context.assistantName} jest gotowy. ${personalityLine} ${onboardingLine} ${contactLine} ${womenHealthLine} ${getSnapshotLine(context)} ${getPriorityLine(
          context,
          signals
        )} ${promptContextLine} Mogę szybko rozłożyć dzień, białko, fokus tygodnia i motywację na podstawie bieżących danych.`
      : `${context.assistantName} вже на місці. ${personalityLine} ${onboardingLine} ${contactLine} ${womenHealthLine} ${getSnapshotLine(context)} ${getPriorityLine(
          context,
          signals
        )} ${promptContextLine} Можу швидко розкласти день, білок, тижневий фокус і мотивацію по ваших поточних даних.`;

  return {
    text,
    mode: "guided",
    followUpQuestionIds: getFollowUps("day_status", signals),
  };
};

export const getAssistantModeLabel = (
  context: AssistantRuntimeContext,
  mode: AssistantRuntimeResponse["mode"]
) =>
  mode === "remote-cloud"
    ? byLanguage[context.language].remoteBadge
    : byLanguage[context.language].guidedBadge;

export const getAssistantHonestyNote = (
  context: AssistantRuntimeContext,
  mode: AssistantRuntimeResponse["mode"]
) =>
  mode === "remote-cloud"
    ? byLanguage[context.language].remoteHonestyNote
    : byLanguage[context.language].guidedHonestyNote;

export const buildGuidedAssistantReply = ({
  question,
  context,
  quickQuestionId,
}: AssistantQuestionInput): AssistantRuntimeResponse => {
  const intent = detectIntent({ question, quickQuestionId });
  const signals = deriveSignals(context);

  if (context.language === "en") {
    const textByIntent = {
      day_status: [
        getPersonalContactLine(context),
        getWomenHealthLine(context),
        getPersonalityLine(context),
        getPromptContextLine(context),
        getOnboardingPersonalizationLine(context),
        getSnapshotLine(context),
        getPriorityLine(context, signals),
        getActionLine(context, signals),
        signals.loggingState !== "solid"
          ? "While today's log is light, treat this as direction, not a verdict."
          : "",
        getLightHumorLine(context, signals),
      ]
        .filter(Boolean)
        .join(" "),
      protein_help:
        signals.proteinState === "hit"
          ? [
              `Protein is already close to target: ${formatRounded(
                context.proteinConsumed
              )}/${formatRounded(context.proteinTarget)} g.`,
              signals.calorieState === "tight"
                ? "The main thing now is protecting the small calorie budget from random snacks."
                : "The main thing now is keeping the day quality steady without adding empty calories.",
              getWomenHealthLine(context),
            ]
              .filter(Boolean)
              .join(" ")
          : [
              `You still need about ${formatRounded(
              signals.proteinGap
              )} g protein to reach a comfortable zone.`,
              getWomenHealthLine(context),
              `${getActionLead(
                context
              )} the easiest way is one concrete meal, for example ${joinIdeas(
                context,
                signals
              )}.`,
              signals.calorieState === "tight" || signals.calorieState === "over"
                ? "Because the calorie budget is already narrow, keep it to lean protein without heavy extras."
                : "If there is still enough calorie space, close this with a full meal rather than several scattered snacks.",
              getLightHumorLine(context, signals),
            ]
              .filter(Boolean)
              .join(" "),
      water_help: [
        getWomenHealthLine(context),
        getWaterLine(context, signals),
        "Water does not replace food, but it often stabilizes appetite and evening decisions.",
      ]
        .filter(Boolean)
        .join(" "),
      weight_help: [
        getWomenHealthLine(context),
        getWeightLine(context, signals),
        "If the trend is flat, do not cut calories immediately: first check logging accuracy, protein, water, and the weekly check-in.",
      ]
        .filter(Boolean)
        .join(" "),
      next_meal: [
        getWomenHealthLine(context),
        getNextMealLine(context, signals),
        `Right now you have about ${formatRounded(
          context.caloriesRemaining
        )} kcal and ${formatRounded(signals.proteinGap)} g protein left to target.`,
      ]
        .filter(Boolean)
        .join(" "),
      coach_focus: [
        getWomenHealthLine(context),
        `Weekly status: ${context.coach.score}/100.`,
        getCoachSnapshot(context),
        getCoachLever(context),
        signals.loggingState !== "solid"
          ? "Also: complete today's log so the weekly focus is not based on partial data."
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      motivation_focus: [
        getPersonalContactLine(context),
        getWomenHealthLine(context),
        getOnboardingPersonalizationLine(context),
        `Motivation now: ${context.motivation.points} points, level ${context.motivation.level}, ${signals.openTasks} open tasks.`,
        getMotivationLine(context, signals),
        getLightHumorLine(context, signals),
      ]
        .filter(Boolean)
        .join(" "),
    } as const;

    return {
      text: getGuidedTextByIntent(textByIntent, intent),
      mode: "guided",
      followUpQuestionIds: getFollowUps(intent, signals),
    };
  }

  const textByIntent = {
    day_status: [
      getPersonalContactLine(context),
      getWomenHealthLine(context),
      getPersonalityLine(context),
      getPromptContextLine(context),
      getOnboardingPersonalizationLine(context),
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
            getWomenHealthLine(context),
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
            getWomenHealthLine(context),
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
      getWomenHealthLine(context),
      getWaterLine(context, signals),
      context.language === "pl"
        ? "Woda nie zastępuje posiłku, ale często stabilizuje apetyt i jakość decyzji wieczorem."
        : "Вода не замінює їжу, але часто стабілізує апетит і якість вечірніх рішень.",
    ]
      .filter(Boolean)
      .join(" "),
    weight_help: [
      getWomenHealthLine(context),
      getWeightLine(context, signals),
      context.language === "pl"
        ? "Jeśli trend stoi, nie tnij od razu kalorii: najpierw sprawdź dokładność wpisów, białko, wodę i weekly check-in."
        : "Якщо тренд стоїть, не ріжте калорії одразу: спершу перевірте точність записів, білок, воду і weekly check-in.",
    ]
      .filter(Boolean)
      .join(" "),
    next_meal: [
      getWomenHealthLine(context),
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
      getWomenHealthLine(context),
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
      getPersonalContactLine(context),
      getWomenHealthLine(context),
      getOnboardingPersonalizationLine(context),
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
    text: getGuidedTextByIntent(textByIntent, intent),
    mode: "guided",
    followUpQuestionIds: getFollowUps(intent, signals),
  };
};
