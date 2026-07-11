import type { Product } from "@domain/products/types";
import type { AppLanguage } from "@shared/types/i18n";

type LocalizedLabel = Record<AppLanguage, string>;

const categoryLabels: Record<string, LocalizedLabel> = {
  dairy: { uk: "Молочні", pl: "Nabiał", en: "Dairy" },
  beverage: { uk: "Напої", pl: "Napoje", en: "Beverages" },
  fruit: { uk: "Фрукти", pl: "Owoce", en: "Fruit" },
  grain: { uk: "Крупи та хліб", pl: "Zboża i pieczywo", en: "Grains and bread" },
  homemade: { uk: "Домашні страви", pl: "Domowe posiłki", en: "Homemade meals" },
  legume: { uk: "Бобові", pl: "Strączki", en: "Legumes" },
  nuts: { uk: "Горіхи", pl: "Orzechy", en: "Nuts" },
  oil: { uk: "Олії", pl: "Oleje", en: "Oils" },
  packaged: { uk: "Магазинні", pl: "Sklepowe", en: "Packaged" },
  protein: { uk: "Білкові", pl: "Białkowe", en: "Protein foods" },
  restaurant: { uk: "Ресторанні", pl: "Restauracyjne", en: "Restaurant meals" },
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
  ["yogurts", "dairy"],
  ["yogurt", "dairy"],
  ["fruits", "fruit"],
  ["vegetables", "vegetable"],
  ["cereals", "grain"],
  ["breads", "grain"],
  ["grains", "grain"],
  ["legumes", "legume"],
  ["nuts", "nuts"],
  ["oils", "oil"],
]);

const getKnownCategoryLabel = (categoryKey: string) =>
  Object.entries(categoryLabels).find(([knownCategory]) => knownCategory === categoryKey)?.[1] ??
  null;

const normalizeCategoryValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/^en:/, "")
    .replace(/[_/]+/g, "-")
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
  const label = getKnownCategoryLabel(categoryKey);

  if (!label) {
    return formatFallbackLabel(categoryKey);
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
