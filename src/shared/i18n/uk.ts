import { assistant } from "./assistant";
import { navigation } from "./navigation";
import { onboarding } from "./onboarding";

export const uk = {
  navigation: navigation.uk,
  onboarding: onboarding.uk,
  assistant: assistant.uk,
  language: {
    label: "Мова",
    current: "Українська",
    uk: "Українська",
    pl: "Polski",
    en: "English",
  },
  page: {
    food: {
      title: "Їжа",
      subtitle: "Пошук, штрихкод, швидке складання страви та історія харчування.",
    },
    recipes: {
      title: "Рецепти",
      subtitle: "Рецепти, холодильник і розумні рекомендації окремо від щоденника їжі.",
    },
    community: {
      title: "Спільнота",
      subtitle: "Досвід, прогрес і підтримка інших користувачів.",
    },
  },
} as const;
