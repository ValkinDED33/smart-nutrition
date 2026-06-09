import type { CompanionCatalogItem } from "../types";

export const companionShopCatalog: CompanionCatalogItem[] = [
  {
    id: "soft-hoodie",
    category: "outfit",
    title: {
      uk: "М'яка худі",
      pl: "Miękka bluza",
      en: "Soft hoodie",
    },
    description: {
      uk: "Теплий образ для ранкових нагадувань про воду.",
      pl: "Ciepły styl do porannych przypomnień o wodzie.",
      en: "A warm look for morning water reminders.",
    },
    tagLabel: {
      uk: "затишок",
      pl: "komfort",
      en: "cozy",
    },
    price: 120,
    slot: "outfit",
    available: false,
  },
  {
    id: "spark-reaction",
    category: "emotion",
    title: {
      uk: "Радість за рекорд",
      pl: "Radość za rekord",
      en: "Record joy",
    },
    description: {
      uk: "Компаньйон святкує серії, закриту воду і білок.",
      pl: "Kompan świętuje serie, wodę i domknięte białko.",
      en: "The companion celebrates streaks, water, and protein wins.",
    },
    tagLabel: {
      uk: "емоція",
      pl: "emocja",
      en: "emotion",
    },
    price: 80,
    slot: "reaction",
    available: false,
  },
  {
    id: "water-bottle",
    category: "accessory",
    title: {
      uk: "Пляшка води",
      pl: "Butelka wody",
      en: "Water bottle",
    },
    description: {
      uk: "Аксесуар для водного трекера і м'яких нагадувань.",
      pl: "Akcesorium do trackera wody i łagodnych przypomnień.",
      en: "An accessory for water tracking and gentle reminders.",
    },
    tagLabel: {
      uk: "вода",
      pl: "woda",
      en: "hydrate",
    },
    price: 95,
    slot: "accessory",
    available: false,
  },
  {
    id: "float-idle",
    category: "animation",
    title: {
      uk: "Плавна пауза",
      pl: "Płynny spokój",
      en: "Floating idle",
    },
    description: {
      uk: "Легка анімація очікування без зайвого шуму.",
      pl: "Lekka animacja oczekiwania bez nadmiaru ruchu.",
      en: "A light idle animation without noisy motion.",
    },
    tagLabel: {
      uk: "рух",
      pl: "ruch",
      en: "motion",
    },
    price: 140,
    slot: "animation",
    available: false,
  },
  {
    id: "dragon-premium",
    category: "premium",
    title: {
      uk: "Дракон",
      pl: "Smok",
      en: "Dragon",
    },
    description: {
      uk: "Ігровий преміум-образ для яскравішої підтримки.",
      pl: "Premium wygląd dla bardziej grywalnego wsparcia.",
      en: "A premium companion look for more playful support.",
    },
    tagLabel: {
      uk: "преміум",
      pl: "premium",
      en: "premium",
    },
    price: 260,
    slot: "companion",
    companionKind: "dragon",
    available: true,
  },
  {
    id: "capybara-season",
    category: "seasonal",
    title: {
      uk: "Спокій капібари",
      pl: "Spokój kapibary",
      en: "Capybara calm",
    },
    description: {
      uk: "Сезонний спокійний образ для режиму без стресу.",
      pl: "Sezonowy spokojny wygląd do trybu bez stresu.",
      en: "A seasonal calm look for a lower-stress mode.",
    },
    tagLabel: {
      uk: "сезон",
      pl: "sezon",
      en: "seasonal",
    },
    price: 220,
    slot: "companion",
    companionKind: "capybara",
    available: true,
  },
];

export const getCompanionCatalogItemById = (itemId: string) =>
  companionShopCatalog.find((item) => item.id === itemId) ?? null;
