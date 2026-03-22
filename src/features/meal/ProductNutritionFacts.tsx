import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import type { Product } from "../../shared/types/product";
import {
  formatNutrientValue,
  hasMeaningfulNutrientValue,
  nutrientDefinitions,
  nutritionSections,
} from "../../shared/lib/nutrients";
import { useLanguage } from "../../shared/language";

const foodGroupLabels: Record<
  string,
  {
    uk: string;
    pl: string;
  }
> = {
  fruit: { uk: "Фрукт", pl: "Owoc" },
  vegetable: { uk: "Овоч", pl: "Warzywo" },
  dairy: { uk: "Молочний продукт", pl: "Nabiał" },
  grain: { uk: "Крупи та зернові", pl: "Zboża i kasze" },
  protein: { uk: "Білковий продукт", pl: "Produkt białkowy" },
  legume: { uk: "Бобові", pl: "Rośliny strączkowe" },
  nuts: { uk: "Горіхи та насіння", pl: "Orzechy i nasiona" },
  oil: { uk: "Жирова основа", pl: "Źródło tłuszczu" },
};

const factLabels: Record<
  string,
  {
    uk: string;
    pl: string;
  }
> = {
  simple: { uk: "Прості вуглеводи", pl: "Proste węglowodany" },
  complex: { uk: "Складні вуглеводи", pl: "Złożone węglowodany" },
  fiber: { uk: "Джерело клітковини", pl: "Źródło błonnika" },
  animal: { uk: "Тваринний білок", pl: "Białko zwierzęce" },
  plant: { uk: "Рослинний білок", pl: "Białko roślinne" },
  complete: { uk: "Повноцінний білок", pl: "Białko pełnowartościowe" },
  incomplete: { uk: "Неповноцінний білок", pl: "Białko niepełnowartościowe" },
  fast: { uk: "Швидке засвоєння", pl: "Szybkie wchłanianie" },
  slow: { uk: "Повільне засвоєння", pl: "Wolne wchłanianie" },
  unsaturated: { uk: "Ненасичені жири", pl: "Tłuszcze nienasycone" },
  monounsaturated: { uk: "Мононенасичені жири", pl: "Tłuszcze jednonienasycone" },
  polyunsaturated: { uk: "Поліненасичені жири", pl: "Tłuszcze wielonienasycone" },
  saturated: { uk: "Насичені жири", pl: "Tłuszcze nasycone" },
  trans: { uk: "Трансжири", pl: "Tłuszcze trans" },
  omega3: { uk: "Омега-3", pl: "Omega-3" },
  omega6: { uk: "Омега-6", pl: "Omega-6" },
  omega9: { uk: "Омега-9", pl: "Omega-9" },
  antioxidants: { uk: "Антиоксиданти", pl: "Antyoksydanty" },
  phytonutrients: { uk: "Фітонутрієнти", pl: "Fitoskładniki" },
  polyphenols: { uk: "Поліфеноли", pl: "Polifenole" },
  electrolytes: { uk: "Електроліти", pl: "Elektrolity" },
};

interface Props {
  product: Product;
}

export const ProductNutritionFacts = ({ product }: Props) => {
  const { language, t } = useLanguage();

  const detailSections = nutritionSections
    .map((section) => ({
      ...section,
      items: section.keys
        .filter((key) => hasMeaningfulNutrientValue(product.nutrients[key] ?? 0))
        .map((key) => {
          const definition = nutrientDefinitions[key]!;
          const nutrientValue = product.nutrients[key] ?? 0;

          return {
            key,
            label: definition.label[language],
            value: formatNutrientValue(nutrientValue, definition.unit),
          };
        }),
    }))
    .filter((section) => section.items.length > 0);

  const factChips = [
    product.facts?.foodGroup ? foodGroupLabels[product.facts.foodGroup]?.[language] : null,
    ...(product.facts?.carbohydrateTypes ?? []).map(
      (item) => factLabels[item]?.[language] ?? null
    ),
    ...(product.facts?.proteinTypes ?? []).map(
      (item) => factLabels[item]?.[language] ?? null
    ),
    ...(product.facts?.fatTypes ?? []).map(
      (item) => factLabels[item]?.[language] ?? null
    ),
    ...(product.facts?.extraCompounds ?? []).map(
      (item) => factLabels[item]?.[language] ?? null
    ),
  ].filter((item): item is string => Boolean(item));

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
              {section.title[language]}
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
                    backgroundColor: "rgba(248,250,252,0.92)",
                    border: "1px solid rgba(15, 23, 42, 0.06)",
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
