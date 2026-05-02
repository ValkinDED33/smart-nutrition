import type { Language } from "../language";
import type { Product } from "../types/product";

type LocalizedLabel = Record<Language, string>;

const categoryLabels: Record<string, LocalizedLabel> = {
  dairy: { uk: "Молочні", pl: "Nabiał" },
  fruit: { uk: "Фрукти", pl: "Owoce" },
  grain: { uk: "Крупи та хліб", pl: "Zboża i pieczywo" },
  homemade: { uk: "Домашні страви", pl: "Domowe posiłki" },
  legume: { uk: "Бобові", pl: "Strączki" },
  nuts: { uk: "Горіхи", pl: "Orzechy" },
  oil: { uk: "Олії", pl: "Oleje" },
  packaged: { uk: "Магазинні", pl: "Sklepowe" },
  protein: { uk: "Білкові", pl: "Białkowe" },
  restaurant: { uk: "Ресторанні", pl: "Restauracyjne" },
  vegetable: { uk: "Овочі", pl: "Warzywa" },
};

const normalizeCategory = (value: string) =>
  value
    .toLowerCase()
    .replace(/^en:/, "")
    .replace(/[_/]+/g, "-")
    .trim();

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
  language: Language
) => categoryLabels[categoryKey]?.[language] ?? formatFallbackLabel(categoryKey);

export const getKnownProductCategoryOptions = (language: Language) =>
  Object.keys(categoryLabels)
    .map((categoryKey) => ({
      key: categoryKey,
      label: getProductCategoryLabel(categoryKey, language),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, language));
