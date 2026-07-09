import type { NutrientKey, Nutrients } from "@domain/products/types";
import type { AppLanguage } from "@shared/types/i18n";

export type NutrientUnit = "kcal" | "g" | "mg" | "ug";

export type NutritionSectionId =
  | "carbs"
  | "proteins"
  | "fats"
  | "vitamins"
  | "minerals"
  | "hydration";

interface NutrientDefinition {
  unit: NutrientUnit;
  section: NutritionSectionId;
  label: {
    uk: string;
    pl: string;
  };
}

export const nutrientDefinitions: Record<NutrientKey, NutrientDefinition> = {
  calories: {
    unit: "kcal",
    section: "carbs",
    label: { uk: "Калорії", pl: "Kalorie" },
  },
  protein: {
    unit: "g",
    section: "proteins",
    label: { uk: "Білок", pl: "Białko" },
  },
  fat: {
    unit: "g",
    section: "fats",
    label: { uk: "Жири", pl: "Tłuszcz" },
  },
  saturatedFat: {
    unit: "g",
    section: "fats",
    label: { uk: "Насичені жири", pl: "Tłuszcze nasycone" },
  },
  monounsaturatedFat: {
    unit: "g",
    section: "fats",
    label: { uk: "Мононенасичені жири", pl: "Tłuszcze jednonienasycone" },
  },
  polyunsaturatedFat: {
    unit: "g",
    section: "fats",
    label: { uk: "Поліненасичені жири", pl: "Tłuszcze wielonienasycone" },
  },
  transFat: {
    unit: "g",
    section: "fats",
    label: { uk: "Трансжири", pl: "Tłuszcze trans" },
  },
  omega3: {
    unit: "g",
    section: "fats",
    label: { uk: "Омега-3", pl: "Omega-3" },
  },
  omega6: {
    unit: "g",
    section: "fats",
    label: { uk: "Омега-6", pl: "Omega-6" },
  },
  omega9: {
    unit: "g",
    section: "fats",
    label: { uk: "Омега-9", pl: "Omega-9" },
  },
  cholesterol: {
    unit: "mg",
    section: "fats",
    label: { uk: "Холестерин", pl: "Cholesterol" },
  },
  carbs: {
    unit: "g",
    section: "carbs",
    label: { uk: "Вуглеводи", pl: "Węglowodany" },
  },
  sugars: {
    unit: "g",
    section: "carbs",
    label: { uk: "Цукри", pl: "Cukry" },
  },
  fiber: {
    unit: "g",
    section: "carbs",
    label: { uk: "Клітковина", pl: "Błonnik" },
  },
  starch: {
    unit: "g",
    section: "carbs",
    label: { uk: "Крохмаль", pl: "Skrobia" },
  },
  glucose: {
    unit: "g",
    section: "carbs",
    label: { uk: "Глюкоза", pl: "Glukoza" },
  },
  fructose: {
    unit: "g",
    section: "carbs",
    label: { uk: "Фруктоза", pl: "Fruktoza" },
  },
  sucrose: {
    unit: "g",
    section: "carbs",
    label: { uk: "Сахароза", pl: "Sacharoza" },
  },
  lactose: {
    unit: "g",
    section: "carbs",
    label: { uk: "Лактоза", pl: "Laktoza" },
  },
  water: {
    unit: "g",
    section: "hydration",
    label: { uk: "Вода", pl: "Woda" },
  },
  sodium: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Натрій", pl: "Sód" },
  },
  potassium: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Калій", pl: "Potas" },
  },
  vitaminA: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін A", pl: "Witamina A" },
  },
  vitaminB: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітаміни групи B", pl: "Witaminy z grupy B" },
  },
  vitaminB1: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін B1", pl: "Witamina B1" },
  },
  vitaminB2: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін B2", pl: "Witamina B2" },
  },
  vitaminB3: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін B3", pl: "Witamina B3" },
  },
  vitaminB5: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін B5", pl: "Witamina B5" },
  },
  vitaminB6: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін B6", pl: "Witamina B6" },
  },
  vitaminB7: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін B7", pl: "Witamina B7" },
  },
  vitaminB9: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін B9", pl: "Witamina B9" },
  },
  vitaminB12: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін B12", pl: "Witamina B12" },
  },
  vitaminC: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін C", pl: "Witamina C" },
  },
  vitaminD: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін D", pl: "Witamina D" },
  },
  vitaminE: {
    unit: "mg",
    section: "vitamins",
    label: { uk: "Вітамін E", pl: "Witamina E" },
  },
  vitaminK: {
    unit: "ug",
    section: "vitamins",
    label: { uk: "Вітамін K", pl: "Witamina K" },
  },
  calcium: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Кальцій", pl: "Wapń" },
  },
  iron: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Залізо", pl: "Żelazo" },
  },
  magnesium: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Магній", pl: "Magnez" },
  },
  zinc: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Цинк", pl: "Cynk" },
  },
  phosphorus: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Фосфор", pl: "Fosfor" },
  },
  iodine: {
    unit: "ug",
    section: "minerals",
    label: { uk: "Йод", pl: "Jod" },
  },
  selenium: {
    unit: "ug",
    section: "minerals",
    label: { uk: "Селен", pl: "Selen" },
  },
  copper: {
    unit: "mg",
    section: "minerals",
    label: { uk: "Мідь", pl: "Miedź" },
  },
};

export const nutrientKeys = Object.keys(nutrientDefinitions) as NutrientKey[];

export const createEmptyNutrients = (): Nutrients =>
  Object.fromEntries(nutrientKeys.map((key) => [key, 0])) as Nutrients;

export const hasMeaningfulNutrientValue = (value: number) => Math.abs(value) >= 0.001;

export const formatNutrientValue = (value: number, unit: NutrientUnit) => {
  if (unit === "kcal") {
    return `${value.toFixed(0)} kcal`;
  }

  const digits = value >= 10 ? 1 : value >= 1 ? 2 : 3;
  return `${value.toFixed(digits)} ${unit}`;
};

const englishNutrientLabels: Record<string, string> = {
  calories: "Calories",
  protein: "Protein",
  fat: "Fat",
  saturatedFat: "Saturated fat",
  monounsaturatedFat: "Monounsaturated fat",
  polyunsaturatedFat: "Polyunsaturated fat",
  transFat: "Trans fat",
  omega3: "Omega-3",
  omega6: "Omega-6",
  omega9: "Omega-9",
  cholesterol: "Cholesterol",
  carbs: "Carbohydrates",
  sugars: "Sugars",
  fiber: "Fiber",
  starch: "Starch",
  glucose: "Glucose",
  fructose: "Fructose",
  sucrose: "Sucrose",
  lactose: "Lactose",
  water: "Water",
  sodium: "Sodium",
  potassium: "Potassium",
  vitaminA: "Vitamin A",
  vitaminB: "B vitamins",
  vitaminB1: "Vitamin B1",
  vitaminB2: "Vitamin B2",
  vitaminB3: "Vitamin B3",
  vitaminB5: "Vitamin B5",
  vitaminB6: "Vitamin B6",
  vitaminB7: "Vitamin B7",
  vitaminB9: "Vitamin B9",
  vitaminB12: "Vitamin B12",
  vitaminC: "Vitamin C",
  vitaminD: "Vitamin D",
  vitaminE: "Vitamin E",
  vitaminK: "Vitamin K",
  calcium: "Calcium",
  iron: "Iron",
  magnesium: "Magnesium",
  zinc: "Zinc",
  phosphorus: "Phosphorus",
  iodine: "Iodine",
  selenium: "Selenium",
  copper: "Copper",
};

const findNutrientDefinition = (key: NutrientKey) => {
  for (const [definitionKey, definition] of Object.entries(nutrientDefinitions)) {
    if (definitionKey === key) {
      return definition;
    }
  }

  return null;
};

const findEnglishNutrientLabel = (key: NutrientKey) => {
  for (const [labelKey, label] of Object.entries(englishNutrientLabels)) {
    if (labelKey === key) {
      return label;
    }
  }

  return null;
};

const getLocalizedNutrientLabel = (
  definition: NutrientDefinition,
  language: AppLanguage
) => {
  switch (language) {
    case "pl":
      return definition.label.pl;
    case "uk":
    case "en":
    default:
      return definition.label.uk;
  }
};

export const getNutrientLabel = (key: NutrientKey, language: AppLanguage) => {
  if (language === "en") {
    return findEnglishNutrientLabel(key) ?? String(key);
  }

  const definition = findNutrientDefinition(key);

  return definition ? getLocalizedNutrientLabel(definition, language) : String(key);
};

const nutritionSectionTitles: Record<NutritionSectionId, Record<AppLanguage, string>> = {
  carbs: {
    uk: "Вуглеводи та клітковина",
    pl: "Węglowodany i błonnik",
    en: "Carbohydrates and fiber",
  },
  proteins: {
    uk: "Білок",
    pl: "Białko",
    en: "Protein",
  },
  fats: {
    uk: "Жири та жирні кислоти",
    pl: "Tłuszcze i kwasy tłuszczowe",
    en: "Fats and fatty acids",
  },
  vitamins: {
    uk: "Вітаміни",
    pl: "Witaminy",
    en: "Vitamins",
  },
  minerals: {
    uk: "Мінерали",
    pl: "Minerały",
    en: "Minerals",
  },
  hydration: {
    uk: "Вода та гідратація",
    pl: "Woda i nawodnienie",
    en: "Water and hydration",
  },
};

const getNutritionSectionTitles = (sectionId: NutritionSectionId) => {
  switch (sectionId) {
    case "proteins":
      return nutritionSectionTitles.proteins;
    case "fats":
      return nutritionSectionTitles.fats;
    case "vitamins":
      return nutritionSectionTitles.vitamins;
    case "minerals":
      return nutritionSectionTitles.minerals;
    case "hydration":
      return nutritionSectionTitles.hydration;
    case "carbs":
    default:
      return nutritionSectionTitles.carbs;
  }
};

const getNutritionTitleByLanguage = (
  titles: Record<AppLanguage, string>,
  language: AppLanguage
) => {
  switch (language) {
    case "pl":
      return titles.pl;
    case "en":
      return titles.en;
    case "uk":
    default:
      return titles.uk;
  }
};

export const getNutritionSectionTitle = (
  sectionId: NutritionSectionId,
  language: AppLanguage
) => getNutritionTitleByLanguage(getNutritionSectionTitles(sectionId), language);

export const nutritionSections: Array<{
  id: NutritionSectionId;
  title: { uk: string; pl: string };
  keys: NutrientKey[];
}> = [
  {
    id: "carbs",
    title: {
      uk: "Вуглеводи та клітковина",
      pl: "Węglowodany i błonnik",
    },
    keys: ["carbs", "sugars", "glucose", "fructose", "sucrose", "lactose", "starch", "fiber"],
  },
  {
    id: "proteins",
    title: {
      uk: "Білок",
      pl: "Białko",
    },
    keys: ["protein"],
  },
  {
    id: "fats",
    title: {
      uk: "Жири та жирні кислоти",
      pl: "Tłuszcze i kwasy tłuszczowe",
    },
    keys: [
      "fat",
      "saturatedFat",
      "monounsaturatedFat",
      "polyunsaturatedFat",
      "transFat",
      "omega3",
      "omega6",
      "omega9",
      "cholesterol",
    ],
  },
  {
    id: "vitamins",
    title: {
      uk: "Вітаміни",
      pl: "Witaminy",
    },
    keys: [
      "vitaminA",
      "vitaminB",
      "vitaminB1",
      "vitaminB2",
      "vitaminB3",
      "vitaminB5",
      "vitaminB6",
      "vitaminB7",
      "vitaminB9",
      "vitaminB12",
      "vitaminC",
      "vitaminD",
      "vitaminE",
      "vitaminK",
    ],
  },
  {
    id: "minerals",
    title: {
      uk: "Мінерали",
      pl: "Minerały",
    },
    keys: [
      "sodium",
      "potassium",
      "calcium",
      "magnesium",
      "phosphorus",
      "iron",
      "zinc",
      "iodine",
      "selenium",
      "copper",
    ],
  },
  {
    id: "hydration",
    title: {
      uk: "Вода та гідратація",
      pl: "Woda i nawodnienie",
    },
    keys: ["water"],
  },
];
