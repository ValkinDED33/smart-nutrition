import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Product } from "@domain/products/types";
import type { NutrientKey } from "@domain/products/types";
import {
  formatNutrientValue,
  getNutrientLabel,
  getNutrientValue,
  getNutritionSectionTitle,
  hasMeaningfulNutrientValue,
  nutrientDefinitions,
  nutritionSections,
} from "@domain/meal/nutrients";
import {
  analyzeProductAdditives,
  analyzeProductIngredientInsights,
  getAdditiveRiskColor,
  getAdditiveRiskLabel,
  type AdditiveRiskLevel,
  type IngredientInsightTone,
} from "@domain/products/additiveAnalysis";
import {
  getProductCategoryKey,
  getProductCategoryLabel,
} from "@domain/products/productCategory";
import { formatProductBaseAmount } from "@domain/products/productPortions";
import type { AppLanguage } from "@shared/types/i18n";
import { useLanguage } from "../../shared/language";

type LocalizedText = Record<AppLanguage, string>;

const BORDER_SOFT = "var(--sn-border-soft)";
const SURFACE_ELEVATED = "var(--sn-surface-elevated)";

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
  ["beverage", {
    uk: "Оцініть цукор, калорії та об'єм порції: напої легко непомітно додають енергію за день.",
    pl: "Sprawdź cukier, kalorie i objętość porcji: napoje łatwo dodają energię niezauważenie.",
    en: "Check sugar, calories, and serving volume: drinks can quietly add energy during the day.",
  }],
  ["egg", {
    uk: "Дає зручний білок і жири; порцію легко вписати в сніданок або перекус.",
    pl: "Daje wygodne białko i tłuszcz; porcję łatwo wpasować w śniadanie albo przekąskę.",
    en: "Provides convenient protein and fat; easy to fit into breakfast or a snack.",
  }],
  ["fish", {
    uk: "Корисний білковий продукт; зверніть увагу на жири, сіль і спосіб приготування.",
    pl: "Wartościowe źródło białka; zwróć uwagę na tłuszcz, sól i sposób przygotowania.",
    en: "A useful protein food; check fat, salt, and preparation method.",
  }],
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
  ["meat", {
    uk: "Добре працює як білкова основа; перевірте жири, сіль і розмір порції.",
    pl: "Dobrze działa jako baza białkowa; sprawdź tłuszcz, sól i wielkość porcji.",
    en: "Works well as a protein base; check fat, salt, and portion size.",
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
  ["readyMeal", {
    uk: "Зручно, але варто перевірити сіль, жири, цукор і реальний розмір порції.",
    pl: "Wygodne, ale warto sprawdzić sól, tłuszcz, cukier i realną wielkość porcji.",
    en: "Convenient, but check salt, fat, sugar, and the real serving size.",
  }],
  ["sauce", {
    uk: "Маленька порція може сильно змінити калорії, цукор або сіль у страві.",
    pl: "Mała porcja może mocno zmienić kalorie, cukier albo sól w posiłku.",
    en: "A small serving can noticeably change calories, sugar, or salt in a meal.",
  }],
  ["snack", {
    uk: "Перевірте калорії, сіль і жири: снеки легко з'їсти більше запланованого.",
    pl: "Sprawdź kalorie, sól i tłuszcze: przekąski łatwo zjeść ponad plan.",
    en: "Check calories, salt, and fat: snacks are easy to overeat.",
  }],
  ["sweets", {
    uk: "Зверніть увагу на цукор, жири та порцію, щоб не зламати денний баланс.",
    pl: "Zwróć uwagę na cukier, tłuszcz i porcję, aby nie rozbić bilansu dnia.",
    en: "Watch sugar, fat, and portion size so the daily balance stays clear.",
  }],
]);

const fallbackBenefitCopy: LocalizedText = {
  uk: "Дивіться на БЖУ, мікроелементи та порцію, щоб краще вписати продукт у свій день.",
  pl: "Patrz na makro, mikro i porcję, aby lepiej wbudować produkt w swój dzień.",
  en: "Use macros, micronutrients, and portion size to fit this product into your day.",
};

const productFactCopy = {
  serving: { uk: "Порція", pl: "Porcja", en: "Serving" },
  ingredients: { uk: "Склад", pl: "Skład", en: "Ingredients" },
  ingredientsSummary: { uk: "Склад простими словами", pl: "Skład prostym językiem", en: "Ingredients in plain language" },
  ingredientsRaw: { uk: "Текст з етикетки", pl: "Tekst z etykiety", en: "Label text" },
  nutritionTable: {
    uk: "Поживна цінність",
    pl: "Wartość odżywcza",
    en: "Nutrition facts",
  },
  indicator: { uk: "Показник", pl: "Składnik", en: "Nutrient" },
  perBase: { uk: "На", pl: "Na", en: "Per" },
  perServing: { uk: "На порцію", pl: "Na porcję", en: "Per serving" },
  energy: { uk: "Енергетична цінність", pl: "Wartość energetyczna", en: "Energy" },
  salt: { uk: "Сіль", pl: "Sól", en: "Salt" },
  additives: { uk: "Добавки та консерванти", pl: "Dodatki i konserwanty", en: "Additives and preservatives" },
  additiveDose: { uk: "Орієнтир ADI для 70 кг", pl: "Orientacyjny ADI dla 70 kg", en: "ADI guide for 70 kg" },
  additiveDoseUnknown: {
    uk: "Точну дозу не визначити без кількості добавки на етикетці.",
    pl: "Dokładnej dawki nie da się określić bez ilości dodatku na etykiecie.",
    en: "Exact dose cannot be calculated without the additive amount on the label.",
  },
  additiveNone: {
    uk: "Відомих ризикових добавок у цьому складі не знайдено.",
    pl: "Nie znaleziono znanych dodatków ryzyka w tym składzie.",
    en: "No known risk additives were found in this ingredient text.",
  },
  additiveCompositionMissing: {
    uk: "Склад не отримано з бази продуктів, тому добавки та консерванти неможливо перевірити автоматично.",
    pl: "Skład nie został pobrany z bazy produktów, więc dodatków i konserwantów nie da się sprawdzić automatycznie.",
    en: "Ingredients were not received from the product database, so additives and preservatives cannot be checked automatically.",
  },
  additiveSafetyNote: {
    uk: "Це харчова довідка, не діагноз: реакції залежать від здоров'я, віку, ваги та чутливості.",
    pl: "To informacja żywieniowa, nie diagnoza: reakcje zależą od zdrowia, wieku, masy i wrażliwości.",
    en: "Nutrition guidance, not a diagnosis: reactions depend on health, age, weight, and sensitivity.",
  },
  milligramsPerDay: { uk: "мг/день", pl: "mg/dzień", en: "mg/day" },
} satisfies Record<string, LocalizedText>;

type NutritionTableUnit = "g" | "kcal" | "mg" | "ug";

const fallbackUnitCopy: LocalizedText = { uk: "г", pl: "g", en: "g" };
const unitCopy = new Map<NutritionTableUnit, LocalizedText>([
  ["g", fallbackUnitCopy],
  ["kcal", { uk: "ккал", pl: "kcal", en: "kcal" }],
  ["mg", { uk: "мг", pl: "mg", en: "mg" }],
  ["ug", { uk: "мкг", pl: "ug", en: "ug" }],
]);

const getFactLabel = (key: string, language: AppLanguage) => {
  const label = factLabels.get(key);

  return label ? getLocalizedText(label, language) : null;
};

const getFoodGroupLabel = (key: string, language: AppLanguage) => {
  const label = foodGroupLabels.get(key);

  return label ? getLocalizedText(label, language) : getProductCategoryLabel(key, language);
};

const getBenefitSummary = (key: string | null, language: AppLanguage) => {
  const benefit = key ? benefitCopy.get(key) : null;

  return getLocalizedText(benefit ?? fallbackBenefitCopy, language);
};

const formatTableValue = (
  value: number,
  unit: NutritionTableUnit,
  language: AppLanguage
) => {
  const normalizedValue = Number.isFinite(value) ? Math.max(value, 0) : 0;
  const digits = unit === "kcal" ? 0 : normalizedValue >= 10 ? 1 : 2;
  const unitLabel = unitCopy.get(unit) ?? fallbackUnitCopy;

  return `${normalizedValue.toFixed(digits)} ${getLocalizedText(unitLabel, language)}`;
};

const saltFromSodiumMg = (sodiumMg: number) =>
  Number.isFinite(sodiumMg) && sodiumMg > 0 ? (sodiumMg * 2.5) / 1000 : 0;

const micronutrientTableKeys: NutrientKey[] = [
  "vitaminA",
  "vitaminE",
  "vitaminC",
  "vitaminB1",
  "vitaminB2",
  "vitaminB3",
  "vitaminB5",
  "vitaminB6",
  "vitaminB7",
  "vitaminB9",
  "vitaminB12",
  "vitaminD",
  "vitaminK",
  "calcium",
  "iron",
  "magnesium",
  "potassium",
  "zinc",
  "phosphorus",
];

const getStandardNutritionRows = (product: Product, language: AppLanguage) => {
  const nutrientDefinitionByKey = new Map(Object.entries(nutrientDefinitions));
  const baseRows = [
    {
      id: "calories",
      label: getLocalizedText(productFactCopy.energy, language),
      value: product.nutrients.calories,
      unit: "kcal" as const,
    },
    {
      id: "fat",
      label: getNutrientLabel("fat", language),
      value: product.nutrients.fat,
      unit: "g" as const,
    },
    {
      id: "saturatedFat",
      label: getNutrientLabel("saturatedFat", language),
      value: product.nutrients.saturatedFat,
      unit: "g" as const,
    },
    {
      id: "carbs",
      label: getNutrientLabel("carbs", language),
      value: product.nutrients.carbs,
      unit: "g" as const,
    },
    {
      id: "sugars",
      label: getNutrientLabel("sugars", language),
      value: product.nutrients.sugars,
      unit: "g" as const,
    },
    {
      id: "protein",
      label: getNutrientLabel("protein", language),
      value: product.nutrients.protein,
      unit: "g" as const,
    },
    {
      id: "salt",
      label: getLocalizedText(productFactCopy.salt, language),
      value: saltFromSodiumMg(product.nutrients.sodium),
      unit: "g" as const,
    },
  ];
  const micronutrientRows = micronutrientTableKeys
    .map((key) => {
      const definition = nutrientDefinitionByKey.get(String(key));
      const value = getNutrientValue(product.nutrients, key);

      if (!definition || !hasMeaningfulNutrientValue(value)) {
        return null;
      }

      return {
        id: key,
        label: getNutrientLabel(key, language),
        value,
        unit: definition.unit as NutritionTableUnit,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return [...baseRows, ...micronutrientRows];
};

const getIngredientsTextForLanguage = (product: Product, language: AppLanguage) => {
  const byLanguage = product.facts?.ingredientsTextByLanguage;
  const localizedText =
    language === "uk"
      ? byLanguage?.uk
      : language === "pl"
        ? byLanguage?.pl
        : byLanguage?.en;

  return localizedText?.trim() || product.facts?.ingredientsText?.trim() || "";
};

const getRiskStyles = (riskLevel: AdditiveRiskLevel) => {
  switch (riskLevel) {
    case "low":
      return {
        borderColor: "rgba(34, 197, 94, 0.45)",
        backgroundColor: "rgba(34, 197, 94, 0.08)",
      };
    case "watch":
      return {
        borderColor: "rgba(245, 158, 11, 0.48)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
      };
    case "limit":
      return {
        borderColor: "rgba(239, 68, 68, 0.5)",
        backgroundColor: "rgba(239, 68, 68, 0.09)",
      };
  }
};

const getIngredientInsightStyles = (tone: IngredientInsightTone) => {
  switch (tone) {
    case "good":
      return {
        borderColor: "rgba(34, 197, 94, 0.36)",
        backgroundColor: "rgba(34, 197, 94, 0.08)",
      };
    case "watch":
      return {
        borderColor: "rgba(245, 158, 11, 0.42)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
      };
    case "neutral":
    default:
      return {
        borderColor: BORDER_SOFT,
        backgroundColor: "rgba(148, 163, 184, 0.08)",
      };
  }
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
  const categoryKey = getProductCategoryKey(product);
  const highlightedMicros = detailSections
    .filter((section) => section.id === "vitamins" || section.id === "minerals")
    .flatMap((section) => section.items)
    .slice(0, 6);
  const benefitSummary = getBenefitSummary(categoryKey, appLanguage);
  const baseAmountLabel = formatProductBaseAmount(product.unit);
  const perBaseLabel =
    product.unit === "piece"
      ? baseAmountLabel
      : t("productFacts.perBase", { unit: product.unit });
  const servingSize = product.facts?.servingSize?.trim();
  const ingredientsText = getIngredientsTextForLanguage(product, appLanguage);
  const servingQuantity =
    product.facts?.servingUnit === product.unit &&
    Number.isFinite(product.facts?.servingQuantity)
      ? Math.max(Number(product.facts?.servingQuantity), 0)
      : 0;
  const baseQuantity = product.unit === "piece" ? 1 : 100;
  const servingFactor = servingQuantity > 0 ? servingQuantity / baseQuantity : null;
  const standardNutritionRows = getStandardNutritionRows(product, appLanguage);
  const ingredientInsights = ingredientsText
    ? analyzeProductIngredientInsights(ingredientsText)
    : [];
  const additiveFindings = ingredientsText ? analyzeProductAdditives(ingredientsText) : [];

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 800 }}>{t("productFacts.title")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("productFacts.subtitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {perBaseLabel}
        </Typography>
      </Stack>

      <Paper
        className="sn-premium-panel"
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 1,
          borderColor: BORDER_SOFT,
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
            {servingSize ? (
              <Chip
                label={`${getLocalizedText(productFactCopy.serving, appLanguage)}: ${servingSize}`}
                size="small"
                variant="outlined"
              />
            ) : null}
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

      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderRadius: 1,
          borderColor: BORDER_SOFT,
        }}
      >
        <Box sx={{ px: 1.5, py: 1.2, backgroundColor: SURFACE_ELEVATED }}>
          <Typography sx={{ fontWeight: 800 }}>
            {getLocalizedText(productFactCopy.nutritionTable, appLanguage)}
          </Typography>
        </Box>
        <Table
          size="small"
          aria-label={getLocalizedText(productFactCopy.nutritionTable, appLanguage)}
          sx={{
            "& th, & td": {
              borderColor: BORDER_SOFT,
              fontSize: { xs: 12.5, sm: 13.5 },
              px: { xs: 1, sm: 1.5 },
              py: 1,
            },
            "& th": {
              fontWeight: 800,
              backgroundColor: SURFACE_ELEVATED,
            },
            "& td:not(:first-of-type), & th:not(:first-of-type)": {
              textAlign: "right",
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>{getLocalizedText(productFactCopy.indicator, appLanguage)}</TableCell>
              <TableCell>
                {getLocalizedText(productFactCopy.perBase, appLanguage)} {baseAmountLabel}
              </TableCell>
              {servingFactor ? (
                <TableCell>
                  {getLocalizedText(productFactCopy.perServing, appLanguage)}
                  {servingSize ? ` (${servingSize})` : ""}
                </TableCell>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {standardNutritionRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell component="th" scope="row">
                  {row.label}
                </TableCell>
                <TableCell>{formatTableValue(row.value, row.unit, appLanguage)}</TableCell>
                {servingFactor ? (
                  <TableCell>
                    {formatTableValue(row.value * servingFactor, row.unit, appLanguage)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {ingredientsText ? (
        <Paper
          variant="outlined"
          sx={{
            p: 1.4,
            borderRadius: 1,
            borderColor: BORDER_SOFT,
            backgroundColor: SURFACE_ELEVATED,
          }}
        >
          <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 700 }}>
              {getLocalizedText(productFactCopy.ingredients, appLanguage)}
            </Typography>
            {ingredientInsights.length > 0 ? (
              <Stack spacing={0.8}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {getLocalizedText(productFactCopy.ingredientsSummary, appLanguage)}
                </Typography>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {ingredientInsights.map((insight) => (
                    <Chip
                      key={insight.id}
                      label={`${getLocalizedText(insight.label, appLanguage)} · ${getLocalizedText(
                        insight.group,
                        appLanguage
                      )}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 750,
                        ...getIngredientInsightStyles(insight.tone),
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            ) : null}
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {getLocalizedText(productFactCopy.ingredientsRaw, appLanguage)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {ingredientsText}
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          p: 1.4,
          borderRadius: 1,
          borderColor: BORDER_SOFT,
          backgroundColor: SURFACE_ELEVATED,
        }}
      >
        <Stack spacing={1.1}>
          <Stack spacing={0.4}>
            <Typography sx={{ fontWeight: 800 }}>
              {getLocalizedText(productFactCopy.additives, appLanguage)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getLocalizedText(productFactCopy.additiveSafetyNote, appLanguage)}
            </Typography>
          </Stack>
          {!ingredientsText ? (
            <Typography variant="body2" color="text.secondary">
              {getLocalizedText(productFactCopy.additiveCompositionMissing, appLanguage)}
            </Typography>
          ) : additiveFindings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {getLocalizedText(productFactCopy.additiveNone, appLanguage)}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {additiveFindings.map((finding) => (
                <Box
                  key={finding.code}
                  sx={{
                    p: 1.1,
                    borderRadius: 1,
                    border: "1px solid",
                    ...getRiskStyles(finding.riskLevel),
                  }}
                >
                  <Stack spacing={0.8}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                      alignItems="center"
                    >
                      <Chip
                        label={finding.code}
                        size="small"
                        color={getAdditiveRiskColor(finding.riskLevel)}
                      />
                      <Chip
                        label={getAdditiveRiskLabel(finding.riskLevel, appLanguage)}
                        size="small"
                        variant="outlined"
                        color={getAdditiveRiskColor(finding.riskLevel)}
                      />
                      <Typography sx={{ fontWeight: 800 }}>
                        {getLocalizedText(finding.name, appLanguage)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {getLocalizedText(finding.group, appLanguage)} ·{" "}
                      {getLocalizedText(finding.purpose, appLanguage)}
                    </Typography>
                    <Typography variant="body2">
                      {getLocalizedText(finding.riskSummary, appLanguage)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {finding.dailyExample70Kg
                        ? `${getLocalizedText(productFactCopy.additiveDose, appLanguage)}: ${finding.dailyExample70Kg} ${getLocalizedText(productFactCopy.milligramsPerDay, appLanguage)}. `
                        : ""}
                      {getLocalizedText(finding.guidance, appLanguage)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary">
                {getLocalizedText(productFactCopy.additiveDoseUnknown, appLanguage)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

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
