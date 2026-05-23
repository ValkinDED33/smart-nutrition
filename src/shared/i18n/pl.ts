import { assistant } from "./assistant";
import { navigation } from "./navigation";
import { onboarding } from "./onboarding";

export const pl = {
  navigation: navigation.pl,
  onboarding: onboarding.pl,
  assistant: assistant.pl,
  language: {
    label: "Język",
    current: "Polski",
    uk: "Українська",
    pl: "Polski",
    en: "English",
  },
  page: {
    food: {
      title: "Jedzenie",
      subtitle: "Wyszukiwanie, kod kreskowy, szybkie składanie posiłku i historia.",
    },
    recipes: {
      title: "Przepisy",
      subtitle: "Przepisy, lodówka i inteligentne rekomendacje poza dziennikiem jedzenia.",
    },
    community: {
      title: "Społeczność",
      subtitle: "Doświadczenia, progres i wsparcie innych użytkowników.",
    },
  },
} as const;
