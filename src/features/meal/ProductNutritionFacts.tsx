import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
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

const benefitCopy = {
  fruit: {
    uk: "Р”Р°С” Р»РµРіРєРёР№ РѕР±'С”Рј СЂР°С†С–РѕРЅСѓ, РєР»С–С‚РєРѕРІРёРЅСѓ С‚Р° РјС–РєСЂРѕРЅСѓС‚СЂС–С”РЅС‚Рё.",
    pl: "Daje lekki wolumen dnia, bЕ‚onnik i mikroskЕ‚adniki.",
  },
  vegetable: {
    uk: "Р”РѕРїРѕРјР°РіР°С” РЅР°СЃРёС‡РµРЅРЅСЋ Р±РµР· Р·Р°Р№РІРёС… РєР°Р»РѕСЂС–Р№ С– РїС–РґСЃРёР»СЋС” С‰РѕРґРµРЅРЅРёР№ РјС–РєСЂРѕРїСЂРѕС„С–Р»СЊ.",
    pl: "Wspiera sytoЕ›Д‡ bez nadmiaru kalorii i wzmacnia dzienny profil mikro.",
  },
  dairy: {
    uk: "Р”РѕР±СЂРµ РїС–РґС…РѕРґРёС‚СЊ РґР»СЏ Р±С–Р»РєР°, РєР°Р»СЊС†С–СЋ С‚Р° Р·СЂСѓС‡РЅРѕРіРѕ РїРµСЂРµРєСѓСЃСѓ.",
    pl: "Dobrze wspiera biaЕ‚ko, wapЕ„ i wygodny szybki posiЕ‚ek.",
  },
  grain: {
    uk: "Р”Р°С” СЃС‚Р°Р±С–Р»СЊРЅСѓ РµРЅРµСЂРіС–СЋ С‚Р° РјРѕР¶Рµ РїС–РґС‚СЂРёРјСѓРІР°С‚Рё СЃРёС‚С–СЃС‚СЊ.",
    pl: "Daje stabilniejszД… energiД™ i moЕјe wspieraД‡ sytoЕ›Д‡.",
  },
  protein: {
    uk: "РљРѕСЂРёСЃРЅРёР№ РґР»СЏ СЃРёС‚РѕСЃС‚С–, РІС–РґРЅРѕРІР»РµРЅРЅСЏ С‚Р° Р·Р±РµСЂРµР¶РµРЅРЅСЏ Рј'СЏР·РѕРІРѕС— РјР°СЃРё.",
    pl: "Wspiera sytoЕ›Д‡, regeneracjД™ i utrzymanie masy miД™Е›niowej.",
  },
  legume: {
    uk: "Р”Р°С” РєР»С–С‚РєРѕРІРёРЅСѓ С‚Р° СЂРѕСЃР»РёРЅРЅРёР№ Р±С–Р»РѕРє РґР»СЏ СЃРёС‚РѕСЃС‚С–.",
    pl: "Dostarcza bЕ‚onnika i biaЕ‚ka roЕ›linnego dla sytoЕ›ci.",
  },
  nuts: {
    uk: "Р”Р°С” РєРѕРЅС†РµРЅС‚СЂРѕРІР°РЅС– Р¶РёСЂРё С‚Р° РјС–РєСЂРѕРµР»РµРјРµРЅС‚Рё, С‚РѕРјСѓ РїРѕСЂС†С–СЋ РєСЂР°С‰Рµ РєРѕРЅС‚СЂРѕР»СЋРІР°С‚Рё.",
    pl: "Daje skoncentrowane tЕ‚uszcze i mikroelementy, wiД™c warto pilnowaД‡ porcji.",
  },
  oil: {
    uk: "РџС–РґСЃРёР»СЋС” СЃРјР°Рє С– РґРѕРґР°С” Р¶РёСЂРё, Р°Р»Рµ РєР°Р»РѕСЂС–С— РЅР°СЂРѕСЃС‚Р°СЋС‚СЊ С€РІРёРґРєРѕ.",
    pl: "Wspiera smak i dostarcza tЕ‚uszczu, ale kalorie rosnД… szybko.",
  },
} as const;

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
  const categoryKey = product.category ?? product.facts?.foodGroup ?? null;
  const highlightedMicros = detailSections
    .filter((section) => section.id === "vitamins" || section.id === "minerals")
    .flatMap((section) => section.items)
    .slice(0, 6);
  const benefitSummary =
    (categoryKey ? benefitCopy[categoryKey as keyof typeof benefitCopy]?.[language] : null) ??
    (language === "uk"
      ? "Р”РёРІС–С‚СЊСЃСЏ РЅР° Р‘Р–РЈ, РјС–РєСЂРѕРµР»РµРјРµРЅС‚Рё С‚Р° РїРѕСЂС†С–СЋ, С‰РѕР± РєСЂР°С‰Рµ РІР±СѓРґСѓРІР°С‚Рё РїСЂРѕРґСѓРєС‚ Сѓ СЃРІС–Р№ РґРµРЅСЊ."
      : "Patrz na makro, mikro i porcjД™, aby lepiej wbudowaД‡ produkt w swГіj dzieЕ„.");

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
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 4,
          borderColor: "rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(180deg, rgba(240,249,255,0.92) 0%, rgba(255,255,255,0.94) 100%)",
        }}
      >
        <Stack spacing={1.1}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {categoryKey && (
              <Chip
                label={foodGroupLabels[categoryKey]?.[language] ?? categoryKey}
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
