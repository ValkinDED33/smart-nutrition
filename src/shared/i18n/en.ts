import { assistant } from "./assistant";
import { navigation } from "./navigation";
import { onboarding } from "./onboarding";

export const en = {
  "brand.name": "Smart Nutrition",
  "brand.tagline": "Smart nutrition without chaos",
  "nav.login": "Log in",
  "nav.register": "Register",
  "nav.logout": "Log out",
  "language.add": "Add language",
  "option.goal.cut": "Fat loss",
  "option.goal.maintain": "Maintain",
  "option.goal.bulk": "Muscle gain",
  "option.goal.healthy": "Eat healthier",
  "common.kcal": "kcal",
  "common.kg": "kg",
  "common.cm": "cm",
  "common.g": "g",
  navigation: navigation.en,
  onboarding: onboarding.en,
  assistant: assistant.en,
  language: {
    label: "Language",
    current: "English",
    uk: "Українська",
    pl: "Polski",
    en: "English",
  },
  page: {
    food: {
      title: "Food",
      subtitle: "Search, barcode scanning, quick meal composing, and meal history.",
    },
    recipes: {
      title: "Recipes",
      subtitle: "Recipes, fridge planning, and smart recommendations outside the food diary.",
    },
    community: {
      title: "Community",
      subtitle: "Shared experience, progress, and support from other users.",
    },
  },
} as const;
