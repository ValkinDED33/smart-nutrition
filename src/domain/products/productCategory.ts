import type { Product } from "@domain/products/types";
import type { AppLanguage } from "@shared/types/i18n";

type LocalizedLabel = Record<AppLanguage, string>;

const categoryLabels: Record<string, LocalizedLabel> = {
  dairy: { uk: "Молочні", pl: "Nabiał", en: "Dairy" },
  beverage: { uk: "Напої", pl: "Napoje", en: "Beverages" },
  egg: { uk: "Яйця", pl: "Jaja", en: "Eggs" },
  fish: { uk: "Риба та морепродукти", pl: "Ryby i owoce morza", en: "Fish and seafood" },
  fruit: { uk: "Фрукти", pl: "Owoce", en: "Fruit" },
  grain: { uk: "Крупи та хліб", pl: "Zboża i pieczywo", en: "Grains and bread" },
  homemade: { uk: "Домашні страви", pl: "Domowe posiłki", en: "Homemade meals" },
  legume: { uk: "Бобові", pl: "Strączki", en: "Legumes" },
  meat: { uk: "М'ясо та птиця", pl: "Mięso i drób", en: "Meat and poultry" },
  nuts: { uk: "Горіхи", pl: "Orzechy", en: "Nuts" },
  oil: { uk: "Олії", pl: "Oleje", en: "Oils" },
  packaged: { uk: "Магазинні", pl: "Sklepowe", en: "Packaged" },
  protein: { uk: "Білкові", pl: "Białkowe", en: "Protein foods" },
  readyMeal: { uk: "Готові страви", pl: "Dania gotowe", en: "Ready meals" },
  restaurant: { uk: "Ресторанні", pl: "Restauracyjne", en: "Restaurant meals" },
  sauce: { uk: "Соуси", pl: "Sosy", en: "Sauces" },
  snack: { uk: "Снеки", pl: "Przekąski", en: "Snacks" },
  sweets: { uk: "Солодощі", pl: "Słodycze", en: "Sweets" },
  vegetable: { uk: "Овочі", pl: "Warzywa", en: "Vegetables" },
};

const categoryAliases = new Map<string, string>([
  ["beverages", "beverage"],
  ["beverage", "beverage"],
  ["beverages-and-beverages-preparations", "beverage"],
  ["drinks", "beverage"],
  ["drink", "beverage"],
  ["soft-drinks", "beverage"],
  ["carbonated-drinks", "beverage"],
  ["sodas", "beverage"],
  ["soda", "beverage"],
  ["colas", "beverage"],
  ["cola", "beverage"],
  ["waters", "beverage"],
  ["water", "beverage"],
  ["juices", "beverage"],
  ["juice", "beverage"],
  ["dairies", "dairy"],
  ["dairy-products", "dairy"],
  ["milks", "dairy"],
  ["milk", "dairy"],
  ["cheeses", "dairy"],
  ["cheese", "dairy"],
  ["yogurts", "dairy"],
  ["yogurt", "dairy"],
  ["fruits", "fruit"],
  ["fresh-fruits", "fruit"],
  ["fruit-and-vegetables-based-foods", "fruit"],
  ["vegetables", "vegetable"],
  ["fresh-vegetables", "vegetable"],
  ["vegetables-based-foods", "vegetable"],
  ["cereals", "grain"],
  ["breakfast-cereals", "grain"],
  ["cereal-products", "grain"],
  ["breads-and-bakery-products", "grain"],
  ["bakery-products", "grain"],
  ["breads", "grain"],
  ["bread", "grain"],
  ["pastas", "grain"],
  ["pasta", "grain"],
  ["rices", "grain"],
  ["rice", "grain"],
  ["grains", "grain"],
  ["legumes", "legume"],
  ["pulses", "legume"],
  ["beans", "legume"],
  ["lentils", "legume"],
  ["meats", "meat"],
  ["meat", "meat"],
  ["poultries", "meat"],
  ["poultry", "meat"],
  ["chickens", "meat"],
  ["chicken", "meat"],
  ["beefs", "meat"],
  ["beef", "meat"],
  ["porks", "meat"],
  ["pork", "meat"],
  ["fishes", "fish"],
  ["fish", "fish"],
  ["seafood", "fish"],
  ["seafoods", "fish"],
  ["salmons", "fish"],
  ["salmon", "fish"],
  ["tunas", "fish"],
  ["tuna", "fish"],
  ["eggs", "egg"],
  ["egg", "egg"],
  ["nuts", "nuts"],
  ["nuts-and-seeds", "nuts"],
  ["seeds", "nuts"],
  ["oils", "oil"],
  ["oil", "oil"],
  ["fats", "oil"],
  ["fats-and-oils", "oil"],
  ["confectioneries", "sweets"],
  ["confectionery", "sweets"],
  ["chocolates", "sweets"],
  ["chocolate", "sweets"],
  ["candies", "sweets"],
  ["candy", "sweets"],
  ["biscuits-and-cakes", "sweets"],
  ["cakes", "sweets"],
  ["cookies", "sweets"],
  ["ice-creams-and-sorbets", "sweets"],
  ["sweet-snacks", "sweets"],
  ["salty-snacks", "snack"],
  ["snacks", "snack"],
  ["crisps", "snack"],
  ["chips", "snack"],
  ["crackers", "snack"],
  ["sauces", "sauce"],
  ["sauce", "sauce"],
  ["condiments", "sauce"],
  ["dressings", "sauce"],
  ["ketchups", "sauce"],
  ["mayonnaises", "sauce"],
  ["prepared-meals", "readyMeal"],
  ["prepared-foods", "readyMeal"],
  ["ready-meals", "readyMeal"],
  ["frozen-foods", "readyMeal"],
  ["pizzas-pies-and-quiches", "readyMeal"],
  ["pizzas", "readyMeal"],
  ["soups", "readyMeal"],
  ["sandwiches", "readyMeal"],
  ["meals", "readyMeal"],
]);

const getKnownCategoryLabel = (categoryKey: string) =>
  Object.entries(categoryLabels).find(([knownCategory]) => knownCategory === categoryKey)?.[1] ??
  null;

const normalizeCategoryValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/^en:/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

const normalizeCategory = (value: string) => {
  const normalized = normalizeCategoryValue(value);

  return categoryAliases.get(normalized) ?? normalized;
};

const formatFallbackLabel = (category: string) =>
  category
    .replace(/^en:/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getProductCategoryKey = (product: Product) => {
  const category = product.category ?? product.facts?.foodGroup;

  if (category?.trim()) {
    return normalizeCategory(category);
  }

  return product.source === "OpenFoodFacts" ? "packaged" : "homemade";
};

export const getProductCategoryLabel = (
  categoryKey: string,
  language: AppLanguage
) => {
  const normalizedCategoryKey = normalizeCategory(categoryKey);
  const label = getKnownCategoryLabel(normalizedCategoryKey);

  if (!label) {
    return formatFallbackLabel(normalizedCategoryKey);
  }

  switch (language) {
    case "pl":
      return label.pl;
    case "en":
      return label.en;
    case "uk":
    default:
      return label.uk;
  }
};

export const getKnownProductCategoryOptions = (language: AppLanguage) =>
  Object.keys(categoryLabels)
    .map((categoryKey) => ({
      key: categoryKey,
      label: getProductCategoryLabel(categoryKey, language),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, language));
