import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import type { Product } from "@domain/products/types";
import {
  formatNutrientValue,
  getNutrientLabel,
  getNutritionSectionTitle,
  hasMeaningfulNutrientValue,
  nutrientDefinitions,
  nutritionSections,
} from "@domain/meal/nutrients";
import { getProductCategoryLabel } from "@domain/products/productCategory";
import type { AppLanguage } from "@shared/types/i18n";
import { useLanguage } from "../../shared/language";

type LocalizedText = Record<AppLanguage, string>;

const getLocalizedText = (copy: LocalizedText, language: AppLanguage) => {
  switch (language) {
    case "uk":
      return copy.uk;
    case "pl":
      return copy.pl;
    case "en":
      return copy.en;
  }
};

const foodGroupLabels = new Map<string, LocalizedText>([
  ["fruit", { uk: "Фрукт", pl: "Owoc", en: "Fruit" }],
  ["vegetable", { uk: "Овоч", pl: "Warzywo", en: "Vegetable" }],
  ["dairy", { uk: "Молочний продукт", pl: "Nabiał", en: "Dairy product" }],
  ["grain", { uk: "Крупи та зернові", pl: "Zboża i kasze", en: "Grains and cereals" }],
  ["protein", { uk: "Білковий продукт", pl: "Produkt białkowy", en: "Protein food" }],
  ["legume", { uk: "Бобові", pl: "Rośliny strączkowe", en: "Legumes" }],
  ["nuts", { uk: "Горіхи та насіння", pl: "Orzechy i nasiona", en: "Nuts and seeds" }],
  ["oil", { uk: "Жирова основа", pl: "Źródło tłuszczu", en: "Fat source" }],
]);

const factLabels = new Map<string, LocalizedText>([
  ["simple", { uk: "Прості вуглеводи", pl: "Proste węglowodany", en: "Simple carbs" }],
  ["complex", { uk: "Складні вуглеводи", pl: "Złożone węglowodany", en: "Complex carbs" }],
  ["fiber", { uk: "Джерело клітковини", pl: "Źródło błonnika", en: "Fiber source" }],
  ["animal", { uk: "Тваринний білок", pl: "Białko zwierzęce", en: "Animal protein" }],
  ["plant", { uk: "Рослинний білок", pl: "Białko roślinne", en: "Plant protein" }],
  ["complete", { uk: "Повноцінний білок", pl: "Białko pełnowartościowe", en: "Complete protein" }],
  ["incomplete", { uk: "Неповноцінний білок", pl: "Białko niepełnowartościowe", en: "Incomplete protein" }],
  ["fast", { uk: "Швидке засвоєння", pl: "Szybkie wchłanianie", en: "Fast absorption" }],
  ["slow", { uk: "Повільне засвоєння", pl: "Wolne wchłanianie", en: "Slow absorption" }],
  ["unsaturated", { uk: "Ненасичені жири", pl: "Tłuszcze nienasycone", en: "Unsaturated fats" }],
  ["monounsaturated", { uk: "Мононенасичені жири", pl: "Tłuszcze jednonienasycone", en: "Monounsaturated fats" }],
  ["polyunsaturated", { uk: "Поліненасичені жири", pl: "Tłuszcze wielonienasycone", en: "Polyunsaturated fats" }],
  ["saturated", { uk: "Насичені жири", pl: "Tłuszcze nasycone", en: "Saturated fats" }],
  ["trans", { uk: "Трансжири", pl: "Tłuszcze trans", en: "Trans fats" }],
  ["omega3", { uk: "Омега-3", pl: "Omega-3", en: "Omega-3" }],
  ["omega6", { uk: "Омега-6", pl: "Omega-6", en: "Omega-6" }],
  ["omega9", { uk: "Омега-9", pl: "Omega-9", en: "Omega-9" }],
  ["antioxidants", { uk: "Антиоксиданти", pl: "Antyoksydanty", en: "Antioxidants" }],
  ["phytonutrients", { uk: "Фітонутрієнти", pl: "Fitoskładniki", en: "Phytonutrients" }],
  ["polyphenols", { uk: "Поліфеноли", pl: "Polifenole", en: "Polyphenols" }],
  ["electrolytes", { uk: "Електроліти", pl: "Elektrolity", en: "Electrolytes" }],
]);

const benefitCopy = new Map<string, LocalizedText>([
  ["fruit", {
    uk: "Дає легкий об'єм раціону, клітковину та мікронутрієнти.",
    pl: "Daje lekki wolumen dnia, błonnik i mikroskładniki.",
    en: "Adds light meal volume, fiber, and micronutrients.",
  }],
  ["vegetable", {
    uk: "Допомагає насиченню без зайвих калорій і підсилює щоденний мікропрофіль.",
    pl: "Wspiera sytość bez nadmiaru kalorii i wzmacnia dzienny profil mikro.",
    en: "Supports fullness without excess calories and improves the daily micronutrient profile.",
  }],
  ["dairy", {
    uk: "Добре підходить для білка, кальцію та зручного перекусу.",
    pl: "Dobrze wspiera białko, wapń i wygodny szybki posiłek.",
    en: "Useful for protein, calcium, and convenient snacks.",
  }],
  ["grain", {
    uk: "Дає стабільнішу енергію та може підтримувати ситість.",
    pl: "Daje stabilniejszą energię i może wspierać sytość.",
    en: "Provides steadier energy and can support fullness.",
  }],
  ["protein", {
    uk: "Корисний для ситості, відновлення та збереження м'язової маси.",
    pl: "Wspiera sytość, regenerację i utrzymanie masy mięśniowej.",
    en: "Supports fullness, recovery, and muscle mass retention.",
  }],
  ["legume", {
    uk: "Дає клітковину та рослинний білок для ситості.",
    pl: "Dostarcza błonnika i białka roślinnego dla sytości.",
    en: "Adds fiber and plant protein for fullness.",
  }],
  ["nuts", {
    uk: "Дає концентровані жири та мікроелементи, тому порцію краще контролювати.",
    pl: "Daje skoncentrowane tłuszcze i mikroelementy, więc warto pilnować porcji.",
    en: "Provides concentrated fats and micronutrients, so portion control matters.",
  }],
  ["oil", {
    uk: "Підсилює смак і додає жири, але калорії зростають швидко.",
    pl: "Wspiera smak i dostarcza tłuszczu, ale kalorie rosną szybko.",
    en: "Boosts flavor and adds fat, but calories rise quickly.",
  }],
]);

const fallbackBenefitCopy: LocalizedText = {
  uk: "Дивіться на БЖУ, мікроелементи та порцію, щоб краще вписати продукт у свій день.",
  pl: "Patrz na makro, mikro i porcję, aby lepiej wbudować produkt w swój dzień.",
  en: "Use macros, micronutrients, and portion size to fit this product into your day.",
};

const getFactLabel = (key: string, language: AppLanguage) => {
  const label = factLabels.get(key);

  return label ? getLocalizedText(label, language) : null;
};

const getFoodGroupLabel = (key: string, language: AppLanguage) => {
  const label = foodGroupLabels.get(key);

  return label ? getLocalizedText(label, language) : null;
};

const getBenefitSummary = (key: string | null, language: AppLanguage) => {
  const benefit = key ? benefitCopy.get(key) : null;

  return getLocalizedText(benefit ?? fallbackBenefitCopy, language);
};

interface Props {
  product: Product;
}

export const ProductNutritionFacts = ({ product }: Props) => {
  const { appLanguage, t } = useLanguage();
  const nutrientValues = new Map(Object.entries(product.nutrients));
  const nutrientDefinitionByKey = new Map(Object.entries(nutrientDefinitions));

  const detailSections = nutritionSections
    .map((section) => ({
      ...section,
      items: section.keys
        .filter((key) => hasMeaningfulNutrientValue(nutrientValues.get(String(key)) ?? 0))
        .map((key) => {
          const mapKey = String(key);
          const definition = nutrientDefinitionByKey.get(mapKey);
          const nutrientValue = nutrientValues.get(mapKey) ?? 0;

          if (!definition) {
            return null;
          }

          return {
            key,
            label: getNutrientLabel(key, appLanguage),
            value: formatNutrientValue(nutrientValue, definition.unit),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    }))
    .filter((section) => section.items.length > 0);

  const factChips = [
    product.facts?.foodGroup ? getFoodGroupLabel(product.facts.foodGroup, appLanguage) : null,
    ...(product.facts?.carbohydrateTypes ?? []).map(
      (item) => getFactLabel(item, appLanguage)
    ),
    ...(product.facts?.proteinTypes ?? []).map(
      (item) => getFactLabel(item, appLanguage)
    ),
    ...(product.facts?.fatTypes ?? []).map(
      (item) => getFactLabel(item, appLanguage)
    ),
    ...(product.facts?.extraCompounds ?? []).map(
      (item) => getFactLabel(item, appLanguage)
    ),
  ].filter((item): item is string => Boolean(item));
  const categoryKey = product.category ?? product.facts?.foodGroup ?? null;
  const highlightedMicros = detailSections
    .filter((section) => section.id === "vitamins" || section.id === "minerals")
    .flatMap((section) => section.items)
    .slice(0, 6);
  const benefitSummary = getBenefitSummary(categoryKey, appLanguage);

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 800 }}>{t("productFacts.title")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("productFacts.subtitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("productFacts.perBase", { unit: product.unit })}
        </Typography>
      </Stack>

      <Paper
        className="sn-premium-panel"
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 1,
          borderColor: "var(--sn-border-soft)",
        }}
      >
        <Stack spacing={1.1}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {categoryKey && (
              <Chip
                label={
                  getFoodGroupLabel(categoryKey, appLanguage) ??
                  getProductCategoryLabel(categoryKey, appLanguage)
                }
                size="small"
                color="primary"
              />
            )}
            {highlightedMicros.map((item) => (
              <Chip
                key={`micro-${item.key}`}
                label={`${item.label}: ${item.value}`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {benefitSummary}
          </Typography>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {factChips.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("productFacts.noData")}
          </Typography>
        ) : (
          factChips.map((label) => (
            <Chip key={label} label={label} size="small" />
          ))
        )}
      </Stack>

      <Divider />

      <Stack spacing={2}>
        {detailSections.map((section) => (
          <Stack key={section.id} spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>
              {getNutritionSectionTitle(section.id, appLanguage)}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              {section.items.map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    p: 1.2,
                    borderRadius: 3,
                    backgroundColor: "var(--sn-surface-elevated)",
                    border: "1px solid var(--sn-border-soft)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
