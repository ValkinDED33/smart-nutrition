import type { DailyContext, DailyContextFocus } from "./dailyContext";
import type { AppLanguage } from "../types/i18n";
import { buildAssistantPersonalizationPlan } from "@core/assistant/personalizationPlan";
import type { AssistantOnboardingProfile } from "@domain/profile/types";

export type AssistantHomePhase = "morning" | "day" | "evening";
export type AssistantHomeActionKind = "meal_search" | "meal_photo" | "meal_scan" | "water" | "recipes" | "progress";

export interface AssistantHomeAction {
  kind: AssistantHomeActionKind;
  label: string;
  helper: string;
  searchQuery?: string;
}

export interface AssistantHomeIntelligence {
  phase: AssistantHomePhase;
  headline: string;
  message: string;
  personalizationLine: string;
  primaryAction: AssistantHomeAction;
  secondaryActions: AssistantHomeAction[];
}

const getPhase = (now: Date): AssistantHomePhase => {
  const hour = now.getHours();

  if (hour < 11) {
    return "morning";
  }

  if (hour < 18) {
    return "day";
  }

  return "evening";
};

const copy = {
  uk: {
    phase: {
      morning: "Ранковий план",
      day: "Контроль дня",
      evening: "Вечірній аналіз",
    },
    focus: {
      log_first_meal: "Почнемо з першого прийому їжі, щоб я бачив реальний день.",
      complete_day: "День ще не має структури. Краще закрити один нормальний прийом їжі.",
      protein: "Білка мало відносно цілі. Пропоную одразу білкову дію.",
      water: "Вода відстає. Найшвидша перемога зараз — склянка води.",
      fiber: "Клітковини мало. Додай овочі, фрукти або крупу.",
      calories_high: "Калорії вже високо. Далі краще легкий білок, овочі і вода.",
      calories_low: "Енергії замало. Краще поїсти зараз, ніж наздоганяти ввечері.",
      steady: "День виглядає рівно. Тримаємо темп і не ускладнюємо.",
    },
    actions: {
      breakfast: ["Зібрати сніданок", "Йогурт, яйця або сир дадуть спокійний старт.", "йогурт яйця сир"],
      lunch: ["Зібрати обід", "Курка, крупа і овочі добре закриють середину дня.", "курка рис овочі"],
      dinner: ["Зібрати вечерю", "Легка вечеря з білком допоможе закрити день без хаосу.", "курка творог овочі"],
      protein: ["Додати білок", "Я можу запропонувати курку, яйця, йогурт або сир.", "курка яйця йогурт сир"],
      water: ["Додати воду", "Додамо одну склянку і повернемо темп.", ""],
      photo: ["Розпізнати блюдо", "Фото швидше, якщо тарілка вже перед тобою.", ""],
      recipes: ["Відкрити рецепти", "Підберемо готову ідею під день.", ""],
      progress: ["Подивитись прогрес", "Ввечері корисно побачити підсумок без самокритики.", ""],
    },
  },
  pl: {
    phase: {
      morning: "Plan poranka",
      day: "Kontrola dnia",
      evening: "Wieczorna analiza",
    },
    focus: {
      log_first_meal: "Zacznijmy od pierwszego posiłku, żebym widział realny dzień.",
      complete_day: "Dzień nie ma jeszcze struktury. Domknij jeden normalny posiłek.",
      protein: "Białka jest mało względem celu. Proponuję konkretny ruch białkowy.",
      water: "Woda jest z tyłu. Najszybsza wygrana teraz to szklanka wody.",
      fiber: "Błonnika jest mało. Dodaj warzywa, owoce albo kaszę.",
      calories_high: "Kalorie są już wysoko. Dalej lepiej lekko: białko, warzywa i woda.",
      calories_low: "Energii jest mało. Lepiej zjeść teraz niż nadrabiać wieczorem.",
      steady: "Dzień wygląda równo. Trzymamy tempo bez komplikowania.",
    },
    actions: {
      breakfast: ["Złożyć śniadanie", "Jogurt, jajka albo twaróg dadzą spokojny start.", "jogurt jajka twaróg"],
      lunch: ["Złożyć obiad", "Kurczak, kasza i warzywa dobrze zamkną środek dnia.", "kurczak ryż warzywa"],
      dinner: ["Złożyć kolację", "Lekka kolacja z białkiem pomoże domknąć dzień.", "kurczak twaróg warzywa"],
      protein: ["Dodać białko", "Mogę podpowiedzieć kurczaka, jajka, jogurt albo twaróg.", "kurczak jajka jogurt twaróg"],
      water: ["Dodać wodę", "Dodamy jedną szklankę i wrócimy do tempa.", ""],
      photo: ["Rozpoznać danie", "Zdjęcie jest najszybsze, jeśli talerz jest przed Tobą.", ""],
      recipes: ["Otworzyć przepisy", "Dobierzemy gotowy pomysł pod dzisiejszy dzień.", ""],
      progress: ["Sprawdzić postęp", "Wieczorem warto zobaczyć podsumowanie bez samokrytyki.", ""],
    },
  },
  en: {
    phase: {
      morning: "Morning plan",
      day: "Day check",
      evening: "Evening review",
    },
    focus: {
      log_first_meal: "Let's start with the first meal so I can read the real day.",
      complete_day: "The day still needs structure. Add one proper meal.",
      protein: "Protein is low for your target. I suggest a direct protein action.",
      water: "Water is behind. The fastest win now is one glass.",
      fiber: "Fiber is low. Add vegetables, fruit, or a grain.",
      calories_high: "Calories are already high. Keep the rest light: protein, vegetables, water.",
      calories_low: "Energy is low. Eat calmly now instead of catching up tonight.",
      steady: "The day looks steady. Keep the pace without overcomplicating it.",
    },
    actions: {
      breakfast: ["Build breakfast", "Yogurt, eggs, or cottage cheese give a calm start.", "yogurt eggs cottage cheese"],
      lunch: ["Build lunch", "Chicken, rice, and vegetables can close the middle of the day.", "chicken rice vegetables"],
      dinner: ["Build dinner", "A light protein dinner helps close the day cleanly.", "chicken cottage cheese vegetables"],
      protein: ["Add protein", "I can suggest chicken, eggs, yogurt, or cottage cheese.", "chicken eggs yogurt cottage cheese"],
      water: ["Add water", "Add one glass and return to pace.", ""],
      photo: ["Recognize meal", "Photo is fastest if the plate is already in front of you.", ""],
      recipes: ["Open recipes", "Pick a ready idea for today's context.", ""],
      progress: ["Check progress", "Evening is a good time for a calm review.", ""],
    },
  },
} as const;

const action = (
  language: AppLanguage,
  kind: AssistantHomeActionKind,
  key: keyof (typeof copy)["en"]["actions"]
): AssistantHomeAction => {
  const [label, helper, searchQuery] = copy[language].actions[key];

  return {
    kind,
    label,
    helper,
    searchQuery,
  };
};

const mealActionKeyByPhase: Record<AssistantHomePhase, "breakfast" | "lunch" | "dinner"> = {
  morning: "breakfast",
  day: "lunch",
  evening: "dinner",
};

export const buildAssistantHomeIntelligence = ({
  context,
  language,
  onboarding,
  now = new Date(),
}: {
  context: DailyContext;
  language: AppLanguage;
  onboarding?: AssistantOnboardingProfile;
  now?: Date;
}): AssistantHomeIntelligence => {
  const phase = getPhase(now);
  const text = copy[language];
  const focus = context.primaryFocus;
  const personalization = onboarding
    ? buildAssistantPersonalizationPlan(onboarding, language)
    : null;
  let primaryAction: AssistantHomeAction;

  if (focus === "water") {
    primaryAction = action(language, "water", "water");
  } else if (focus === "protein") {
    primaryAction = action(language, "meal_search", "protein");
  } else if (focus === "calories_high") {
    primaryAction = action(language, "recipes", "recipes");
  } else if (focus === "steady" && phase === "evening") {
    primaryAction = action(language, "progress", "progress");
  } else {
    primaryAction = action(language, "meal_search", mealActionKeyByPhase[phase]);
  }

  const secondaryActions = [
    primaryAction.kind !== "meal_photo" ? action(language, "meal_photo", "photo") : null,
    primaryAction.kind !== "water" ? action(language, "water", "water") : null,
    primaryAction.kind !== "recipes" ? action(language, "recipes", "recipes") : null,
  ].filter((item): item is AssistantHomeAction => item !== null);

  return {
    phase,
    headline: text.phase[phase],
    message: personalization
      ? `${text.focus[focus as DailyContextFocus]} ${personalization.actionHint}`
      : text.focus[focus as DailyContextFocus],
    personalizationLine: personalization?.homeLine ?? "",
    primaryAction: personalization
      ? {
          ...primaryAction,
          helper: `${primaryAction.helper} ${personalization.recommendationHint}`,
        }
      : primaryAction,
    secondaryActions,
  };
};
