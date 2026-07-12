import type { AppLanguage } from "@shared/types/i18n";

type LocalizedText = Record<AppLanguage, string>;

export type AdditiveRiskLevel = "low" | "watch" | "limit";

export interface AdditiveDefinition {
  code: string;
  aliases: string[];
  name: LocalizedText;
  group: LocalizedText;
  purpose: LocalizedText;
  riskLevel: AdditiveRiskLevel;
  riskSummary: LocalizedText;
  guidance: LocalizedText;
  adiMgKgDay?: number;
}

export interface AdditiveFinding extends AdditiveDefinition {
  matchedText: string;
  dailyExample70Kg?: number;
}

export type IngredientInsightTone = "neutral" | "good" | "watch";

export interface IngredientInsight {
  id: string;
  label: LocalizedText;
  group: LocalizedText;
  tone: IngredientInsightTone;
  matchedText: string;
}

const preservativeGroup: LocalizedText = {
  uk: "Консервант",
  pl: "Konserwant",
  en: "Preservative",
};

const additives: AdditiveDefinition[] = [
  {
    code: "E150D",
    aliases: ["e150d", "e 150d", "caramel iv", "sulphite ammonia caramel", "colour e150d"],
    name: { uk: "Карамельний барвник IV", pl: "Karmel amoniakalno-siarczynowy", en: "Caramel colour IV" },
    group: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    purpose: { uk: "Дає темний колір напоям і соусам.", pl: "Nadaje ciemny kolor napojom i sosom.", en: "Adds dark colour to drinks and sauces." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволена добавка, але краще не робити продукти з нею щоденною основою раціону.",
      pl: "Dozwolony dodatek, ale nie warto opierać na nim codziennej diety.",
      en: "Permitted additive, but products containing it should not be the base of the daily diet.",
    },
    guidance: {
      uk: "Точно порахувати дозу не можна без кількості на етикетці. Для газованих напоїв краще тримати це як іноді, а не щодня.",
      pl: "Dokładnej dawki nie da się policzyć bez ilości na etykiecie. Przy napojach gazowanych traktuj to raczej okazjonalnie.",
      en: "Exact intake cannot be calculated without the label amount. Treat soft drinks with it as occasional rather than daily.",
    },
    adiMgKgDay: 300,
  },
  {
    code: "E338",
    aliases: ["e338", "e 338", "phosphoric acid", "kwas fosforowy", "фосфорна кислота", "фосфорная кислота"],
    name: { uk: "Фосфорна кислота", pl: "Kwas fosforowy", en: "Phosphoric acid" },
    group: { uk: "Регулятор кислотності", pl: "Regulator kwasowości", en: "Acidity regulator" },
    purpose: { uk: "Дає кислинку і стабілізує смак напою.", pl: "Dodaje kwasowości i stabilizuje smak napoju.", en: "Adds acidity and stabilizes drink flavour." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Зазвичай безпечна у дозволених рівнях, але часте вживання солодкої газованої води може шкодити зубам і балансу раціону.",
      pl: "Zwykle bezpieczny w dozwolonych poziomach, ale częste picie słodzonych napojów szkodzi zębom i jakości diety.",
      en: "Usually safe at permitted levels, but frequent sweet soft drinks can affect teeth and diet quality.",
    },
    guidance: {
      uk: "Як практичне правило: не робіть такі напої щоденною заміною води. Доза добавки на банці зазвичай не вказана.",
      pl: "Praktycznie: nie traktuj takich napojów jako codziennego zamiennika wody. Ilość dodatku zwykle nie jest podana.",
      en: "Practical rule: do not use these drinks as a daily water replacement. The additive amount is usually not listed.",
    },
    adiMgKgDay: 40,
  },
  {
    code: "E330",
    aliases: ["e330", "e 330", "citric acid", "kwas cytrynowy", "лимонна кислота", "лимонная кислота"],
    name: { uk: "Лимонна кислота", pl: "Kwas cytrynowy", en: "Citric acid" },
    group: { uk: "Регулятор кислотності", pl: "Regulator kwasowości", en: "Acidity regulator" },
    purpose: { uk: "Регулює кислотність і смак.", pl: "Reguluje kwasowość i smak.", en: "Controls acidity and flavour." },
    riskLevel: "low",
    riskSummary: {
      uk: "Звичайна харчова кислота, для більшості людей ризик низький.",
      pl: "Typowy kwas spożywczy, dla większości osób niskie ryzyko.",
      en: "Common food acid with low risk for most people.",
    },
    guidance: {
      uk: "Обмежуйте не саму добавку, а частоту кислих/солодких продуктів, якщо є чутливі зуби або шлунок.",
      pl: "Ograniczaj raczej częstotliwość kwaśnych/słodkich produktów, zwłaszcza przy wrażliwych zębach lub żołądku.",
      en: "Limit the frequency of acidic/sweet products if teeth or stomach are sensitive.",
    },
  },
  {
    code: "E202",
    aliases: ["e202", "e 202", "potassium sorbate", "sorbinian potasu", "сорбат калію", "сорбат калия"],
    name: { uk: "Сорбат калію", pl: "Sorbinian potasu", en: "Potassium sorbate" },
    group: preservativeGroup,
    purpose: { uk: "Стримує ріст плісняви та дріжджів.", pl: "Hamuje rozwój pleśni i drożdży.", en: "Helps inhibit mould and yeast." },
    riskLevel: "low",
    riskSummary: {
      uk: "Поширений консервант із низьким ризиком у дозволених кількостях.",
      pl: "Popularny konserwant o niskim ryzyku w dozwolonych ilościach.",
      en: "Common preservative with low risk at permitted levels.",
    },
    guidance: {
      uk: "Точна доза залежить від кількості в продукті. Якщо багато продуктів із консервантами щодня, краще розбавляти раціон свіжими продуктами.",
      pl: "Dokładna dawka zależy od ilości w produkcie. Przy wielu produktach z konserwantami codziennie warto dodać więcej świeżych produktów.",
      en: "Exact dose depends on the product amount. If many preserved foods appear daily, balance them with fresher foods.",
    },
    adiMgKgDay: 25,
  },
  {
    code: "E211",
    aliases: ["e211", "e 211", "sodium benzoate", "benzoesan sodu", "бензоат натрію", "бензоат натрия"],
    name: { uk: "Бензоат натрію", pl: "Benzoesan sodu", en: "Sodium benzoate" },
    group: preservativeGroup,
    purpose: { uk: "Захищає кислі напої та соуси від псування.", pl: "Chroni kwaśne napoje i sosy przed psuciem.", en: "Protects acidic drinks and sauces from spoilage." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений консервант, але для частого вживання краще обирати продукти з простішим складом.",
      pl: "Dozwolony konserwant, ale przy częstym spożyciu lepiej wybierać prostszy skład.",
      en: "Permitted preservative, but simpler ingredient lists are better for frequent use.",
    },
    guidance: {
      uk: "Для 70 кг орієнтир ADI ≈ 350 мг/день, але без кількості на етикетці точний підрахунок неможливий.",
      pl: "Dla 70 kg orientacyjny ADI to ok. 350 mg/dzień, ale bez ilości na etykiecie nie da się policzyć dokładnie.",
      en: "For 70 kg, ADI guide is about 350 mg/day, but exact intake cannot be calculated without the label amount.",
    },
    adiMgKgDay: 5,
  },
  {
    code: "E250",
    aliases: ["e250", "e 250", "sodium nitrite", "azotyn sodu", "нітрит натрію", "нитрит натрия"],
    name: { uk: "Нітрит натрію", pl: "Azotyn sodu", en: "Sodium nitrite" },
    group: preservativeGroup,
    purpose: { uk: "Використовується у м'ясних продуктах для безпеки, кольору та смаку.", pl: "Stosowany w wyrobach mięsnych dla bezpieczeństwa, koloru i smaku.", en: "Used in processed meats for safety, colour, and flavour." },
    riskLevel: "limit",
    riskSummary: {
      uk: "Краще обмежувати частоту переробленого м'яса з нітритами.",
      pl: "Warto ograniczać częstotliwość przetworzonego mięsa z azotynami.",
      en: "Limit frequency of processed meats containing nitrites.",
    },
    guidance: {
      uk: "Практично: не робіть ковбаси/бекон щоденною основою білка. Для 70 кг ADI ≈ 4.9 мг/день, але точна кількість у порції зазвичай не вказана.",
      pl: "Praktycznie: nie rób z wędlin/bekonu codziennej bazy białka. Dla 70 kg ADI to ok. 4.9 mg/dzień, ale ilość w porcji zwykle nie jest podana.",
      en: "Practical rule: do not make bacon/processed meats your daily protein base. For 70 kg, ADI is about 4.9 mg/day, but serving amount is usually not listed.",
    },
    adiMgKgDay: 0.07,
  },
  {
    code: "E220",
    aliases: ["e220", "e 220", "sulphur dioxide", "sulfur dioxide", "dwutlenek siarki", "діоксид сірки", "диоксид серы"],
    name: { uk: "Діоксид сірки", pl: "Dwutlenek siarki", en: "Sulphur dioxide" },
    group: { uk: "Консервант / антиоксидант", pl: "Konserwant / przeciwutleniacz", en: "Preservative / antioxidant" },
    purpose: { uk: "Захищає сухофрукти, вино та соки від псування й потемніння.", pl: "Chroni suszone owoce, wino i soki przed psuciem i ciemnieniem.", en: "Protects dried fruit, wine, and juices from spoilage and browning." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Може бути проблемним для людей із чутливістю до сульфітів або астмою.",
      pl: "Może być problematyczny przy wrażliwości na siarczyny lub astmie.",
      en: "Can be problematic for people sensitive to sulphites or with asthma.",
    },
    guidance: {
      uk: "Якщо є реакції на сульфіти, краще уникати. Для 70 кг ADI ≈ 49 мг/день, але потрібна кількість у продукті.",
      pl: "Przy reakcjach na siarczyny lepiej unikać. Dla 70 kg ADI to ok. 49 mg/dzień, ale potrzebna jest ilość w produkcie.",
      en: "If sulphite-sensitive, avoid it. For 70 kg, ADI is about 49 mg/day, but product amount is needed.",
    },
    adiMgKgDay: 0.7,
  },
  {
    code: "E621",
    aliases: ["e621", "e 621", "monosodium glutamate", "msg", "glutaminian monosodowy", "глутамат натрію", "глутамат натрия"],
    name: { uk: "Глутамат натрію", pl: "Glutaminian monosodowy", en: "Monosodium glutamate" },
    group: { uk: "Підсилювач смаку", pl: "Wzmacniacz smaku", en: "Flavour enhancer" },
    purpose: { uk: "Підсилює смак умамі.", pl: "Wzmacnia smak umami.", en: "Enhances umami flavour." },
    riskLevel: "low",
    riskSummary: {
      uk: "Для більшості людей ризик низький у звичайних харчових кількостях.",
      pl: "Dla większości osób niskie ryzyko przy typowych ilościach w żywności.",
      en: "Low risk for most people at usual food levels.",
    },
    guidance: {
      uk: "Якщо помічаєте індивідуальну реакцію, зменшіть продукти з підсилювачами смаку.",
      pl: "Jeśli widzisz indywidualną reakcję, ogranicz produkty ze wzmacniaczami smaku.",
      en: "If you notice individual sensitivity, reduce foods with flavour enhancers.",
    },
    adiMgKgDay: 30,
  },
  {
    code: "E951",
    aliases: ["e951", "e 951", "aspartame", "aspartam", "аспартам"],
    name: { uk: "Аспартам", pl: "Aspartam", en: "Aspartame" },
    group: { uk: "Підсолоджувач", pl: "Słodzik", en: "Sweetener" },
    purpose: { uk: "Дає солодкий смак без цукру.", pl: "Daje słodki smak bez cukru.", en: "Provides sweetness without sugar." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений підсолоджувач; людям із фенілкетонурією потрібно уникати.",
      pl: "Dozwolony słodzik; osoby z fenyloketonurią muszą go unikać.",
      en: "Permitted sweetener; people with phenylketonuria must avoid it.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 2800 мг/день. Точна кількість у напої/продукті потрібна для підрахунку.",
      pl: "Dla 70 kg ADI to ok. 2800 mg/dzień. Do obliczeń potrzebna jest ilość w napoju/produkcie.",
      en: "For 70 kg, ADI is about 2800 mg/day. The drink/product amount is needed for calculation.",
    },
    adiMgKgDay: 40,
  },
  {
    code: "E102",
    aliases: ["e102", "e 102", "tartrazine", "tartrazyna", "тартразин"],
    name: { uk: "Тартразин", pl: "Tartrazyna", en: "Tartrazine" },
    group: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    purpose: { uk: "Жовтий барвник для напоїв, солодощів і снеків.", pl: "Żółty barwnik do napojów, słodyczy i przekąsek.", en: "Yellow colour used in drinks, sweets, and snacks." },
    riskLevel: "limit",
    riskSummary: {
      uk: "Краще обмежувати часте вживання яскраво забарвлених солодощів і напоїв, особливо дітям.",
      pl: "Warto ograniczać częste spożycie mocno barwionych słodyczy i napojów, zwłaszcza u dzieci.",
      en: "Limit frequent intake of brightly coloured sweets and drinks, especially for children.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 525 мг/день, але точна кількість у продукті зазвичай не вказана.",
      pl: "Dla 70 kg ADI to ok. 525 mg/dzień, ale ilość w produkcie zwykle nie jest podana.",
      en: "For 70 kg, ADI is about 525 mg/day, but product amount is usually not listed.",
    },
    adiMgKgDay: 7.5,
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const matchesAlias = (normalizedIngredients: string, alias: string) => {
  const normalizedAlias = normalize(alias);

  if (/^e\s?\d{3}[a-z]?$/.test(normalizedAlias)) {
    const codePattern = normalizedAlias.replace(/\s+/g, "\\s*");
    return new RegExp(`\\b${codePattern}\\b`, "i").test(normalizedIngredients);
  }

  return normalizedIngredients.includes(normalizedAlias);
};

const ingredientInsights: Array<Omit<IngredientInsight, "matchedText"> & { aliases: string[] }> = [
  {
    id: "water",
    aliases: ["water", "woda", "вода", "вуглекисла вода", "carbonated water"],
    label: { uk: "Вода", pl: "Woda", en: "Water" },
    group: { uk: "Основа продукту", pl: "Baza produktu", en: "Product base" },
    tone: "good",
  },
  {
    id: "sugar",
    aliases: ["sugar", "cukier", "цукор", "сахар", "glucose-fructose syrup", "syrop glukozowo-fruktozowy"],
    label: { uk: "Цукор", pl: "Cukier", en: "Sugar" },
    group: { uk: "Швидкі вуглеводи", pl: "Szybkie węglowodany", en: "Fast carbs" },
    tone: "watch",
  },
  {
    id: "sweetener",
    aliases: ["sweetener", "sweeteners", "słodzik", "substancja słodząca", "підсолоджувач", "подсластитель", "aspartame", "sucralose", "acesulfame"],
    label: { uk: "Підсолоджувач", pl: "Słodzik", en: "Sweetener" },
    group: { uk: "Солодкий смак без цукру", pl: "Słodki smak bez cukru", en: "Sweet taste without sugar" },
    tone: "watch",
  },
  {
    id: "acid",
    aliases: ["acid", "acidity regulator", "kwas", "regulator kwasowości", "кислота", "регулятор кислотності", "citric acid", "phosphoric acid"],
    label: { uk: "Кислоти / регулятор кислотності", pl: "Kwasy / regulator kwasowości", en: "Acids / acidity regulator" },
    group: { uk: "Смак і кислотність", pl: "Smak i kwasowość", en: "Taste and acidity" },
    tone: "neutral",
  },
  {
    id: "preservative",
    aliases: ["preservative", "konserwant", "консервант", "sorbate", "benzoate", "nitrite", "sorbinian", "benzoesan", "azotyn"],
    label: { uk: "Консервант", pl: "Konserwant", en: "Preservative" },
    group: { uk: "Захист від псування", pl: "Ochrona przed psuciem", en: "Spoilage protection" },
    tone: "watch",
  },
  {
    id: "colour",
    aliases: ["colour", "color", "barwnik", "барвник", "краситель", "caramel", "tartrazine"],
    label: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    group: { uk: "Колір продукту", pl: "Kolor produktu", en: "Product colour" },
    tone: "watch",
  },
  {
    id: "caffeine",
    aliases: ["caffeine", "kofeina", "кофеїн", "кофеин"],
    label: { uk: "Кофеїн", pl: "Kofeina", en: "Caffeine" },
    group: { uk: "Стимулюючий компонент", pl: "Składnik pobudzający", en: "Stimulant" },
    tone: "watch",
  },
  {
    id: "salt",
    aliases: ["salt", "sól", "сіль", "соль", "sodium chloride"],
    label: { uk: "Сіль", pl: "Sól", en: "Salt" },
    group: { uk: "Натрій / смак", pl: "Sód / smak", en: "Sodium / taste" },
    tone: "watch",
  },
  {
    id: "oil",
    aliases: ["oil", "olej", "олія", "масло", "vegetable oil", "palm oil", "sunflower oil"],
    label: { uk: "Олії / жири", pl: "Oleje / tłuszcze", en: "Oils / fats" },
    group: { uk: "Жирова частина", pl: "Część tłuszczowa", en: "Fat component" },
    tone: "neutral",
  },
  {
    id: "milk",
    aliases: ["milk", "mleko", "молоко", "lactose", "laktoza", "лактоза", "whey", "serwatka"],
    label: { uk: "Молоко / лактоза", pl: "Mleko / laktoza", en: "Milk / lactose" },
    group: { uk: "Алергенний компонент", pl: "Składnik alergenny", en: "Allergen component" },
    tone: "watch",
  },
  {
    id: "gluten",
    aliases: ["gluten", "wheat", "pszenica", "глютен", "пшениця", "пшеница"],
    label: { uk: "Глютен / пшениця", pl: "Gluten / pszenica", en: "Gluten / wheat" },
    group: { uk: "Алергенний компонент", pl: "Składnik alergenny", en: "Allergen component" },
    tone: "watch",
  },
];

export const analyzeProductIngredientInsights = (
  ingredientsText: string
): IngredientInsight[] => {
  const normalizedIngredients = normalize(ingredientsText);

  if (!normalizedIngredients) {
    return [];
  }

  return ingredientInsights.reduce<IngredientInsight[]>((insights, insight) => {
    const matchedAlias = insight.aliases.find((alias) =>
      matchesAlias(normalizedIngredients, alias)
    );

    if (matchedAlias) {
      insights.push({
        id: insight.id,
        label: insight.label,
        group: insight.group,
        tone: insight.tone,
        matchedText: matchedAlias,
      });
    }

    return insights;
  }, []);
};

export const analyzeProductAdditives = (ingredientsText: string): AdditiveFinding[] => {
  const normalizedIngredients = normalize(ingredientsText);

  if (!normalizedIngredients) {
    return [];
  }

  return additives.reduce<AdditiveFinding[]>((findings, additive) => {
    const matchedAlias = additive.aliases.find((alias) =>
      matchesAlias(normalizedIngredients, alias)
    );

    if (!matchedAlias) {
      return findings;
    }

    findings.push(
      additive.adiMgKgDay
        ? {
            ...additive,
            matchedText: matchedAlias,
            dailyExample70Kg: Number((additive.adiMgKgDay * 70).toFixed(2)),
          }
        : {
            ...additive,
            matchedText: matchedAlias,
          }
    );

    return findings;
  }, []);
};

export const getAdditiveRiskLabel = (
  riskLevel: AdditiveRiskLevel,
  language: AppLanguage
) => {
  const riskLabel =
    riskLevel === "low"
      ? { uk: "Зазвичай безпечно", pl: "Zwykle bezpieczne", en: "Usually safe" }
      : riskLevel === "watch"
        ? { uk: "Потрібна помірність", pl: "Zachowaj umiar", en: "Use moderation" }
        : { uk: "Краще обмежити", pl: "Lepiej ograniczyć", en: "Better to limit" };

  switch (language) {
    case "uk":
      return riskLabel.uk;
    case "pl":
      return riskLabel.pl;
    case "en":
      return riskLabel.en;
  }
};

export const getAdditiveRiskColor = (riskLevel: AdditiveRiskLevel) => {
  switch (riskLevel) {
    case "low":
      return "success";
    case "watch":
      return "warning";
    case "limit":
      return "error";
  }
};
