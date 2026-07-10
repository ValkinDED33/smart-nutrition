import type {
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantOnboardingProfile,
} from "@domain/profile/types";
import type { AppLanguage } from "@shared/types/i18n";

export interface AssistantPersonalizationPlan {
  frictionLabel: string;
  motivationLabel: string;
  homeLine: string;
  actionHint: string;
  notificationBody: string;
  recommendationHint: string;
  reportHint: string;
}

const personalizationCopy = {
  uk: {
    friction: {
      unknown: "потрібно краще зрозуміти складні моменти",
      emotional_eating: "емоційне переїдання",
      chaotic_schedule: "хаотичний графік",
      evening_snacking: "вечірні перекуси",
      low_energy: "низька енергія",
      social_pressure: "соціальний тиск",
    },
    motivation: {
      gentle: "м'яка підтримка",
      direct: "пряма відповідальність",
      energetic: "енергійний темп",
    },
    home: {
      unknown:
        "Я використовую ваші відповіді з онбордингу і буду уточнювати патерни по ходу дня.",
      emotional_eating:
        "Сьогодні я буду знімати напругу до того, як вона перетвориться на імпульсивний перекус.",
      chaotic_schedule:
        "Сьогодні фокус на простих діях у правильний момент, бо графік легко розсипається.",
      evening_snacking:
        "Сьогодні я заздалегідь бережу вечір: білок, вода і спокійний план після вечері.",
      low_energy:
        "Сьогодні я підказуватиму м'які кроки без перевантаження, щоб енергія не просідала.",
      social_pressure:
        "Сьогодні я допоможу тримати план гнучким, навіть якщо поруч чужі вибори й темп.",
    },
    action: {
      gentle: "Почнемо без тиску: один маленький крок уже корисний.",
      direct: "Обираємо дію і закриваємо її зараз.",
      energetic: "Беремо швидкий імпульс і рухаємо день вперед.",
    },
    notification: {
      gentle:
        "Один точний запис, одна порція води і трохи доброти до себе вже роблять день керованим.",
      direct:
        "Один точний запис, одна порція води і один білковий прийом. Закрийте базу без відкладання.",
      energetic:
        "Один запис, одна вода, один білковий рух — і день знову у ваших руках.",
    },
    recommendation: {
      unknown:
        "Порада враховує ваші відповіді з онбордингу і стане точнішою з новими логами.",
      emotional_eating:
        "Тому рекомендація зменшує ризик імпульсивного вибору: ситість, простота і без різких заборон.",
      chaotic_schedule:
        "Тому рекомендація коротка і швидка: її легко виконати навіть у нерівному графіку.",
      evening_snacking:
        "Тому рекомендація захищає вечірній слот і зменшує шанс пізнього перекусу.",
      low_energy:
        "Тому рекомендація не вимагає складної готовки і підтримує рівну енергію.",
      social_pressure:
        "Тому рекомендація лишає гнучкість для соціальних ситуацій без втрати плана.",
    },
    report: {
      unknown:
        "У звітах я буду показувати, які патерни повторюються і що варто уточнити.",
      emotional_eating:
        "У звітах я буду окремо відмічати вечори, паузи між прийомами і тригери переїдання.",
      chaotic_schedule:
        "У звітах я буду виділяти пропущені слоти і час, коли логування найчастіше зривається.",
      evening_snacking:
        "У звітах я буду стежити за вечірнім білком, калоріями після вечері і ритмом сну.",
      low_energy:
        "У звітах я буду дивитись, чи вистачає калорій, води і регулярності для енергії.",
      social_pressure:
        "У звітах я буду підсвічувати дні з відхиленнями, щоб план лишався соціально реалістичним.",
    },
  },
  pl: {
    friction: {
      unknown: "trzeba lepiej poznać trudne momenty",
      emotional_eating: "jedzenie emocjonalne",
      chaotic_schedule: "chaotyczny grafik",
      evening_snacking: "wieczorne podjadanie",
      low_energy: "niska energia",
      social_pressure: "presja społeczna",
    },
    motivation: {
      gentle: "łagodne wsparcie",
      direct: "bezpośrednia odpowiedzialność",
      energetic: "energiczne tempo",
    },
    home: {
      unknown:
        "Korzystam z odpowiedzi z onboardingu i będę doprecyzowywać wzorce w trakcie dnia.",
      emotional_eating:
        "Dziś zdejmuję napięcie zanim zamieni się w impulsywną przekąskę.",
      chaotic_schedule:
        "Dziś liczą się proste ruchy we właściwym momencie, bo grafik łatwo się rozsypuje.",
      evening_snacking:
        "Dziś zawczasu chronię wieczór: białko, woda i spokojny plan po kolacji.",
      low_energy:
        "Dziś podpowiadam łagodne kroki bez przeciążenia, żeby energia nie spadała.",
      social_pressure:
        "Dziś pomagam trzymać plan elastycznie, nawet gdy obok są cudze wybory i tempo.",
    },
    action: {
      gentle: "Zaczynamy bez presji: jeden mały krok już pomaga.",
      direct: "Wybieramy działanie i domykamy je teraz.",
      energetic: "Bierzemy szybki impuls i pchamy dzień do przodu.",
    },
    notification: {
      gentle:
        "Jeden dokładny wpis, jedna porcja wody i trochę życzliwości do siebie już porządkują dzień.",
      direct:
        "Jeden dokładny wpis, jedna porcja wody i jeden białkowy posiłek. Domknij bazę bez odkładania.",
      energetic: "Jeden wpis, jedna woda, jeden białkowy ruch — i dzień wraca w Twoje ręce.",
    },
    recommendation: {
      unknown:
        "Podpowiedź korzysta z odpowiedzi z onboardingu i będzie ostrzejsza z kolejnymi logami.",
      emotional_eating:
        "Dlatego rekomendacja zmniejsza ryzyko impulsu: sytość, prostota i bez ostrych zakazów.",
      chaotic_schedule:
        "Dlatego rekomendacja jest krótka i szybka: da się ją wykonać nawet w nierównym grafiku.",
      evening_snacking:
        "Dlatego rekomendacja chroni wieczorny slot i zmniejsza szansę późnego podjadania.",
      low_energy:
        "Dlatego rekomendacja nie wymaga złożonego gotowania i wspiera równą energię.",
      social_pressure:
        "Dlatego rekomendacja zostawia elastyczność na sytuacje społeczne bez gubienia planu.",
    },
    report: {
      unknown: "W raportach pokażę, które wzorce się powtarzają i co warto doprecyzować.",
      emotional_eating:
        "W raportach osobno oznaczę wieczory, przerwy między posiłkami i wyzwalacze objadania.",
      chaotic_schedule:
        "W raportach wyróżnię pominięte sloty i pory, w których logowanie najczęściej wypada.",
      evening_snacking:
        "W raportach sprawdzę wieczorne białko, kalorie po kolacji i rytm końca dnia.",
      low_energy:
        "W raportach sprawdzę, czy kalorie, woda i regularność wspierają energię.",
      social_pressure:
        "W raportach podświetlę dni z odchyleniami, żeby plan pozostał społecznie realny.",
    },
  },
  en: {
    friction: {
      unknown: "needs more discovery around hard moments",
      emotional_eating: "emotional eating",
      chaotic_schedule: "chaotic schedule",
      evening_snacking: "evening snacking",
      low_energy: "low energy",
      social_pressure: "social pressure",
    },
    motivation: {
      gentle: "gentle support",
      direct: "direct accountability",
      energetic: "energetic momentum",
    },
    home: {
      unknown: "I use your onboarding answers and will sharpen the pattern as the day unfolds.",
      emotional_eating:
        "Today I will lower tension before it turns into an impulsive snack.",
      chaotic_schedule:
        "Today is about simple moves at the right moment, because your schedule can scatter.",
      evening_snacking:
        "Today I am protecting the evening early: protein, water, and a calm plan after dinner.",
      low_energy:
        "Today I will suggest gentle steps without overload so your energy does not dip.",
      social_pressure:
        "Today I will keep the plan flexible around other people's choices and pace.",
    },
    action: {
      gentle: "Start without pressure: one small step already helps.",
      direct: "Pick the action and close it now.",
      energetic: "Take the quick spark and move the day forward.",
    },
    notification: {
      gentle:
        "One accurate log, one water serving, and a little self-kindness already make the day manageable.",
      direct:
        "One accurate log, one water serving, and one protein meal. Close the basics without delay.",
      energetic: "One log, one water, one protein move, and the day is back in your hands.",
    },
    recommendation: {
      unknown: "This tip uses your onboarding answers and will get sharper with more logs.",
      emotional_eating:
        "So this recommendation lowers impulse risk: satiety, simplicity, and no harsh bans.",
      chaotic_schedule:
        "So this recommendation stays short and fast enough for an uneven schedule.",
      evening_snacking:
        "So this recommendation protects the evening slot and lowers late-snack risk.",
      low_energy:
        "So this recommendation avoids complex prep and supports steadier energy.",
      social_pressure:
        "So this recommendation leaves room for social situations without losing the plan.",
    },
    report: {
      unknown: "In reports, I will show repeating patterns and what we should clarify next.",
      emotional_eating:
        "In reports, I will flag evenings, long meal gaps, and overeating triggers separately.",
      chaotic_schedule:
        "In reports, I will highlight missed slots and the times logging most often breaks.",
      evening_snacking:
        "In reports, I will watch evening protein, calories after dinner, and end-of-day rhythm.",
      low_energy:
        "In reports, I will check whether calories, water, and regularity support your energy.",
      social_pressure:
        "In reports, I will surface drift days so the plan stays socially realistic.",
    },
  },
} as const;

type PersonalizationCopy = (typeof personalizationCopy)[keyof typeof personalizationCopy];

const getPersonalizationCopy = (language: AppLanguage): PersonalizationCopy => {
  switch (language) {
    case "uk":
      return personalizationCopy.uk;
    case "pl":
      return personalizationCopy.pl;
    case "en":
    default:
      return personalizationCopy.en;
  }
};

const getFrictionCopy = (
  copy: PersonalizationCopy,
  friction: AssistantDietFriction
): string => {
  switch (friction) {
    case "emotional_eating":
      return copy.friction.emotional_eating;
    case "chaotic_schedule":
      return copy.friction.chaotic_schedule;
    case "evening_snacking":
      return copy.friction.evening_snacking;
    case "low_energy":
      return copy.friction.low_energy;
    case "social_pressure":
      return copy.friction.social_pressure;
    case "unknown":
    default:
      return copy.friction.unknown;
  }
};

const getMotivationCopy = (
  copy: PersonalizationCopy,
  style: AssistantMotivationStyle
): string => {
  switch (style) {
    case "direct":
      return copy.motivation.direct;
    case "energetic":
      return copy.motivation.energetic;
    case "gentle":
    default:
      return copy.motivation.gentle;
  }
};

const getHomeCopy = (
  copy: PersonalizationCopy,
  friction: AssistantDietFriction
): string => {
  switch (friction) {
    case "emotional_eating":
      return copy.home.emotional_eating;
    case "chaotic_schedule":
      return copy.home.chaotic_schedule;
    case "evening_snacking":
      return copy.home.evening_snacking;
    case "low_energy":
      return copy.home.low_energy;
    case "social_pressure":
      return copy.home.social_pressure;
    case "unknown":
    default:
      return copy.home.unknown;
  }
};

const getActionCopy = (
  copy: PersonalizationCopy,
  style: AssistantMotivationStyle
): string => {
  switch (style) {
    case "direct":
      return copy.action.direct;
    case "energetic":
      return copy.action.energetic;
    case "gentle":
    default:
      return copy.action.gentle;
  }
};

const getNotificationCopy = (
  copy: PersonalizationCopy,
  style: AssistantMotivationStyle
): string => {
  switch (style) {
    case "direct":
      return copy.notification.direct;
    case "energetic":
      return copy.notification.energetic;
    case "gentle":
    default:
      return copy.notification.gentle;
  }
};

const getRecommendationCopy = (
  copy: PersonalizationCopy,
  friction: AssistantDietFriction
): string => {
  switch (friction) {
    case "emotional_eating":
      return copy.recommendation.emotional_eating;
    case "chaotic_schedule":
      return copy.recommendation.chaotic_schedule;
    case "evening_snacking":
      return copy.recommendation.evening_snacking;
    case "low_energy":
      return copy.recommendation.low_energy;
    case "social_pressure":
      return copy.recommendation.social_pressure;
    case "unknown":
    default:
      return copy.recommendation.unknown;
  }
};

const getReportCopy = (
  copy: PersonalizationCopy,
  friction: AssistantDietFriction
): string => {
  switch (friction) {
    case "emotional_eating":
      return copy.report.emotional_eating;
    case "chaotic_schedule":
      return copy.report.chaotic_schedule;
    case "evening_snacking":
      return copy.report.evening_snacking;
    case "low_energy":
      return copy.report.low_energy;
    case "social_pressure":
      return copy.report.social_pressure;
    case "unknown":
    default:
      return copy.report.unknown;
  }
};

export const buildAssistantPersonalizationPlan = (
  onboarding: AssistantOnboardingProfile,
  language: AppLanguage
): AssistantPersonalizationPlan => {
  const copy = getPersonalizationCopy(language);
  const frictionLabel =
    onboarding.mainFrictions.length > 0
      ? onboarding.mainFrictions.map((friction) => getFrictionCopy(copy, friction)).join(", ")
      : getFrictionCopy(copy, onboarding.mainFriction);
  const motivationLabel =
    onboarding.motivationStyles.length > 0
      ? onboarding.motivationStyles.map((style) => getMotivationCopy(copy, style)).join(", ")
      : getMotivationCopy(copy, onboarding.motivationStyle);

  return {
    frictionLabel,
    motivationLabel,
    homeLine: getHomeCopy(copy, onboarding.mainFriction),
    actionHint: getActionCopy(copy, onboarding.motivationStyle),
    notificationBody: getNotificationCopy(copy, onboarding.motivationStyle),
    recommendationHint: getRecommendationCopy(copy, onboarding.mainFriction),
    reportHint: getReportCopy(copy, onboarding.mainFriction),
  };
};
