import type { AppLanguage } from "@shared/types/i18n";
import type { Product } from "./types";

type LocalizedText = Record<AppLanguage, string>;

export interface ProductMicronutrientInsight {
  id: string;
  nutrientKey: "iodine";
  title: LocalizedText;
  body: LocalizedText;
  evidence: LocalizedText;
}

const iodineSeaweedInsight: ProductMicronutrientInsight = {
  id: "seaweed-iodine-source",
  nutrientKey: "iodine",
  title: {
    uk: "Йод",
    pl: "Jod",
    en: "Iodine",
  },
  body: {
    uk: "Продукти з морських водоростей зазвичай є джерелом йоду, але точна кількість сильно залежить від виду водоростей і рецептури.",
    pl: "Produkty z alg morskich zwykle są źródłem jodu, ale dokładna ilość mocno zależy od rodzaju alg i receptury.",
    en: "Seaweed products are usually a source of iodine, but the exact amount depends heavily on the algae type and recipe.",
  },
  evidence: {
    uk: "Кількість не рахується автоматично без значення йоду на етикетці або в базі продуктів.",
    pl: "Ilość nie jest liczona automatycznie bez wartości jodu na etykiecie albo w bazie produktów.",
    en: "Amount is not calculated automatically without an iodine value on the label or in the product database.",
  },
};

const seaweedTokens = [
  "seaweed",
  "kelp",
  "algae",
  "wakame",
  "kombu",
  "nori",
  "laminaria",
  "spirulina",
  "chlorella",
  "alga",
  "alg",
  "wodorost",
  "morska kapusta",
  "капуста морская",
  "морская капуста",
  "морська капуста",
  "водорості",
  "водоросли",
  "ламінарія",
  "ламинария",
  "нори",
];

const normalizeProductText = (product: Product) =>
  [
    product.name,
    product.brand,
    product.category,
    product.facts?.foodGroup,
    product.facts?.ingredientsText,
    product.facts?.ingredientsTextByLanguage?.uk,
    product.facts?.ingredientsTextByLanguage?.pl,
    product.facts?.ingredientsTextByLanguage?.en,
    ...(product.facts?.extraCompounds ?? []),
  ]
    .filter(Boolean)
    .join(" ");

const hasSeaweedSignal = (product: Product) => {
  const normalizedText = normalizeProductText(product).toLocaleLowerCase("uk-UA");

  return seaweedTokens.some((token) => normalizedText.includes(token));
};

export const getProductMicronutrientInsights = (
  product: Product
): ProductMicronutrientInsight[] => {
  const insights: ProductMicronutrientInsight[] = [];

  if ((product.nutrients.iodine ?? 0) <= 0 && hasSeaweedSignal(product)) {
    insights.push(iodineSeaweedInsight);
  }

  return insights;
};
