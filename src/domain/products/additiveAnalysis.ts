/* eslint-disable sonarjs/no-duplicate-string -- Additive dictionaries intentionally repeat localized guidance. */
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

const antioxidantGroup: LocalizedText = {
  uk: "Антиоксидант",
  pl: "Przeciwutleniacz",
  en: "Antioxidant",
};

const sweetenerGroup: LocalizedText = {
  uk: "Підсолоджувач",
  pl: "Słodzik",
  en: "Sweetener",
};

const stabilizerGroup: LocalizedText = {
  uk: "Стабілізатор / загущувач",
  pl: "Stabilizator / zagęstnik",
  en: "Stabilizer / thickener",
};

const acidityRegulatorGroup: LocalizedText = {
  uk: "Регулятор кислотності",
  pl: "Regulator kwasowości",
  en: "Acidity regulator",
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
    code: "E160A",
    aliases: ["e160a", "e 160a", "carotenes", "beta-carotene", "karoteny", "beta-karoten", "каротини", "бета-каротин"],
    name: { uk: "Каротини", pl: "Karoteny", en: "Carotenes" },
    group: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    purpose: { uk: "Надає жовто-помаранчевий колір.", pl: "Nadaje żółto-pomarańczowy kolor.", en: "Adds yellow-orange colour." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у харчових кількостях.",
      pl: "Zwykle niskie ryzyko w ilościach spożywczych.",
      en: "Usually low risk at food-use levels.",
    },
    guidance: {
      uk: "Оцінюйте продукт у цілому: цукор, жири й порцію важливіші за сам барвник.",
      pl: "Oceniaj cały produkt: cukier, tłuszcz i porcja są ważniejsze niż sam barwnik.",
      en: "Judge the whole product: sugar, fat, and serving size matter more than this colour.",
    },
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
    code: "E331",
    aliases: ["e331", "e 331", "sodium citrates", "cytryniany sodu", "цитрати натрію", "цитраты натрия"],
    name: { uk: "Цитрати натрію", pl: "Cytryniany sodu", en: "Sodium citrates" },
    group: acidityRegulatorGroup,
    purpose: { uk: "Регулює кислотність і стабілізує смак.", pl: "Reguluje kwasowość i stabilizuje smak.", en: "Regulates acidity and stabilizes flavour." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай безпечна добавка у дозволених харчових кількостях.",
      pl: "Zwykle bezpieczny dodatek w dozwolonych ilościach spożywczych.",
      en: "Usually safe at permitted food-use levels.",
    },
    guidance: {
      uk: "Окремо рахувати дозу зазвичай не потрібно; дивіться на загальну якість продукту.",
      pl: "Zwykle nie trzeba liczyć dawki osobno; patrz na ogólną jakość produktu.",
      en: "Usually no need to track separately; judge the overall product quality.",
    },
  },
  {
    code: "E300",
    aliases: ["e300", "e 300", "ascorbic acid", "kwas askorbinowy", "аскорбінова кислота", "аскорбиновая кислота", "vitamin c", "witamina c", "вітамін c"],
    name: { uk: "Аскорбінова кислота", pl: "Kwas askorbinowy", en: "Ascorbic acid" },
    group: antioxidantGroup,
    purpose: { uk: "Допомагає захистити продукт від окиснення.", pl: "Pomaga chronić produkt przed utlenianiem.", en: "Helps protect the product from oxidation." },
    riskLevel: "low",
    riskSummary: {
      uk: "Форма вітаміну C, зазвичай низький ризик у харчових кількостях.",
      pl: "Forma witaminy C, zwykle niskie ryzyko w ilościach spożywczych.",
      en: "A form of vitamin C, usually low risk at food-use levels.",
    },
    guidance: {
      uk: "Для більшості людей це не проблема; важливіше оцінювати цукор, сіль і порцію.",
      pl: "Dla większości osób to nie problem; ważniejsze są cukier, sól i porcja.",
      en: "For most people this is not a concern; sugar, salt, and serving size matter more.",
    },
  },
  {
    code: "E322",
    aliases: ["e322", "e 322", "lecithins", "lecithin", "lecytyny", "lecytyna", "лецитини", "лецитин"],
    name: { uk: "Лецитини", pl: "Lecytyny", en: "Lecithins" },
    group: { uk: "Емульгатор", pl: "Emulgator", en: "Emulsifier" },
    purpose: { uk: "Допомагає змішувати жир і воду в продукті.", pl: "Pomaga łączyć tłuszcz i wodę w produkcie.", en: "Helps fat and water mix in the product." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у дозволених кількостях.",
      pl: "Zwykle niskie ryzyko w dozwolonych ilościach.",
      en: "Usually low risk at permitted levels.",
    },
    guidance: {
      uk: "Якщо є алергія на сою або яйце, перевірте джерело лецитину на етикетці.",
      pl: "Przy alergii na soję lub jaja sprawdź źródło lecytyny na etykiecie.",
      en: "If allergic to soy or egg, check the lecithin source on the label.",
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
    code: "E200",
    aliases: ["e200", "e 200", "sorbic acid", "kwas sorbowy", "сорбінова кислота", "сорбиновая кислота"],
    name: { uk: "Сорбінова кислота", pl: "Kwas sorbowy", en: "Sorbic acid" },
    group: preservativeGroup,
    purpose: { uk: "Стримує ріст плісняви та дріжджів.", pl: "Hamuje rozwój pleśni i drożdży.", en: "Helps inhibit mould and yeast." },
    riskLevel: "low",
    riskSummary: {
      uk: "Поширений консервант із низьким ризиком у дозволених кількостях.",
      pl: "Popularny konserwant o niskim ryzyku w dozwolonych ilościach.",
      en: "Common preservative with low risk at permitted levels.",
    },
    guidance: {
      uk: "Точна доза залежить від рецептури; якщо консервованих продуктів багато щодня, додавайте більше свіжих продуктів.",
      pl: "Dokładna dawka zależy od receptury; przy wielu konserwowanych produktach codziennie dodaj więcej świeżej żywności.",
      en: "Exact dose depends on the recipe; if preserved foods appear often, balance them with fresher foods.",
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
    code: "E210",
    aliases: ["e210", "e 210", "benzoic acid", "kwas benzoesowy", "бензойна кислота", "бензойная кислота"],
    name: { uk: "Бензойна кислота", pl: "Kwas benzoesowy", en: "Benzoic acid" },
    group: preservativeGroup,
    purpose: { uk: "Захищає кислі продукти та напої від псування.", pl: "Chroni kwaśne produkty i napoje przed psuciem.", en: "Protects acidic foods and drinks from spoilage." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений консервант, але для щоденного вживання краще простіший склад.",
      pl: "Dozwolony konserwant, ale do codziennego spożycia lepszy jest prostszy skład.",
      en: "Permitted preservative, but simpler ingredients are better for daily use.",
    },
    guidance: {
      uk: "Для 70 кг орієнтир ADI ≈ 350 мг/день; без кількості на етикетці це лише довідковий максимум.",
      pl: "Dla 70 kg orientacyjny ADI to ok. 350 mg/dzień; bez ilości na etykiecie to tylko limit orientacyjny.",
      en: "For 70 kg, ADI guide is about 350 mg/day; without the label amount this is only a reference ceiling.",
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
    code: "E251",
    aliases: ["e251", "e 251", "sodium nitrate", "azotan sodu", "нітрат натрію", "нитрат натрия"],
    name: { uk: "Нітрат натрію", pl: "Azotan sodu", en: "Sodium nitrate" },
    group: preservativeGroup,
    purpose: { uk: "Використовується переважно у м'ясних продуктах для збереження.", pl: "Stosowany głównie w produktach mięsnych do utrwalania.", en: "Used mainly in meat products for preservation." },
    riskLevel: "limit",
    riskSummary: {
      uk: "Краще обмежувати частоту переробленого м'яса з нітратами/нітритами.",
      pl: "Warto ograniczać częstotliwość przetworzonego mięsa z azotanami/azotynami.",
      en: "Limit frequency of processed meats with nitrates/nitrites.",
    },
    guidance: {
      uk: "Практично: чергуйте такі продукти зі свіжим м'ясом, рибою, яйцями або бобовими.",
      pl: "Praktycznie: zamieniaj je częściej na świeże mięso, ryby, jaja albo strączki.",
      en: "Practical rule: rotate with fresh meat, fish, eggs, or legumes.",
    },
    adiMgKgDay: 3.7,
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
    code: "E224",
    aliases: ["e224", "e 224", "potassium metabisulphite", "potassium metabisulfite", "pirosiarczyn potasu", "метабісульфіт калію", "метабисульфит калия"],
    name: { uk: "Метабісульфіт калію", pl: "Pirosiarczyn potasu", en: "Potassium metabisulphite" },
    group: { uk: "Консервант / антиоксидант", pl: "Konserwant / przeciwutleniacz", en: "Preservative / antioxidant" },
    purpose: { uk: "Захищає напої, сухофрукти та соуси від псування й потемніння.", pl: "Chroni napoje, suszone owoce i sosy przed psuciem oraz ciemnieniem.", en: "Protects drinks, dried fruit, and sauces from spoilage and browning." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Може бути проблемним при чутливості до сульфітів або астмі.",
      pl: "Może być problematyczny przy wrażliwości na siarczyny lub astmie.",
      en: "Can be problematic for sulphite-sensitive people or asthma.",
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
    code: "E950",
    aliases: ["e950", "e 950", "acesulfame k", "acesulfame potassium", "acesulfam k", "acesulfam potasowy", "ацесульфам k", "ацесульфам калію"],
    name: { uk: "Ацесульфам K", pl: "Acesulfam K", en: "Acesulfame K" },
    group: sweetenerGroup,
    purpose: { uk: "Дає солодкий смак без цукру.", pl: "Daje słodki smak bez cukru.", en: "Provides sweetness without sugar." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений підсолоджувач; краще не робити солодкі напої щоденною заміною води.",
      pl: "Dozwolony słodzik; nie warto robić ze słodkich napojów codziennego zamiennika wody.",
      en: "Permitted sweetener; sweet drinks should not become a daily water replacement.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 630 мг/день. Точний підрахунок потребує кількості в продукті.",
      pl: "Dla 70 kg ADI to ok. 630 mg/dzień. Do dokładnych obliczeń potrzebna jest ilość w produkcie.",
      en: "For 70 kg, ADI is about 630 mg/day. Exact calculation needs the product amount.",
    },
    adiMgKgDay: 9,
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
    code: "E955",
    aliases: ["e955", "e 955", "sucralose", "sukraloza", "сукралоза"],
    name: { uk: "Сукралоза", pl: "Sukraloza", en: "Sucralose" },
    group: sweetenerGroup,
    purpose: { uk: "Дає солодкий смак без цукру.", pl: "Daje słodki smak bez cukru.", en: "Provides sweetness without sugar." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений підсолоджувач; помірність важлива, якщо таких продуктів багато щодня.",
      pl: "Dozwolony słodzik; umiar jest ważny, gdy takich produktów jest dużo codziennie.",
      en: "Permitted sweetener; moderation matters if many such products are consumed daily.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 1050 мг/день. Без кількості на етикетці точний підрахунок неможливий.",
      pl: "Dla 70 kg ADI to ok. 1050 mg/dzień. Bez ilości na etykiecie nie da się policzyć dokładnie.",
      en: "For 70 kg, ADI is about 1050 mg/day. Exact intake needs the label amount.",
    },
    adiMgKgDay: 15,
  },
  {
    code: "E960",
    aliases: ["e960", "e 960", "steviol glycosides", "stewiol", "glikozydy stewiolowe", "стевіол глікозиди", "стевиоловые гликозиды"],
    name: { uk: "Стевіол глікозиди", pl: "Glikozydy stewiolowe", en: "Steviol glycosides" },
    group: sweetenerGroup,
    purpose: { uk: "Дає солодкий смак без цукру.", pl: "Daje słodki smak bez cukru.", en: "Provides sweetness without sugar." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у дозволених кількостях.",
      pl: "Zwykle niskie ryzyko w dozwolonych ilościach.",
      en: "Usually low risk at permitted levels.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 280 мг/день у перерахунку на стевіол; точна кількість потрібна з етикетки.",
      pl: "Dla 70 kg ADI to ok. 280 mg/dzień jako stewiol; potrzebna jest ilość z etykiety.",
      en: "For 70 kg, ADI is about 280 mg/day as steviol; exact amount must come from the label.",
    },
    adiMgKgDay: 4,
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
  {
    code: "E110",
    aliases: ["e110", "e 110", "sunset yellow", "żółcień pomarańczowa", "жовтий захід", "желтый закат"],
    name: { uk: "Жовтий захід FCF", pl: "Żółcień pomarańczowa FCF", en: "Sunset Yellow FCF" },
    group: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    purpose: { uk: "Помаранчевий барвник для напоїв, солодощів і снеків.", pl: "Pomarańczowy barwnik do napojów, słodyczy i przekąsek.", en: "Orange colour used in drinks, sweets, and snacks." },
    riskLevel: "limit",
    riskSummary: {
      uk: "Краще обмежувати часте вживання яскраво забарвлених солодощів і напоїв, особливо дітям.",
      pl: "Warto ograniczać częste spożycie mocno barwionych słodyczy i napojów, zwłaszcza u dzieci.",
      en: "Limit frequent intake of brightly coloured sweets and drinks, especially for children.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 280 мг/день, але без кількості на етикетці це лише довідковий максимум.",
      pl: "Dla 70 kg ADI to ok. 280 mg/dzień, ale bez ilości na etykiecie to tylko limit orientacyjny.",
      en: "For 70 kg, ADI is about 280 mg/day, but without the label amount this is only a reference ceiling.",
    },
    adiMgKgDay: 4,
  },
  {
    code: "E129",
    aliases: ["e129", "e 129", "allura red", "czerwień allura", "червоний алура", "красный очаровательный"],
    name: { uk: "Червоний алура AC", pl: "Czerwień Allura AC", en: "Allura Red AC" },
    group: { uk: "Барвник", pl: "Barwnik", en: "Colour" },
    purpose: { uk: "Червоний барвник для напоїв, солодощів і десертів.", pl: "Czerwony barwnik do napojów, słodyczy i deserów.", en: "Red colour used in drinks, sweets, and desserts." },
    riskLevel: "limit",
    riskSummary: {
      uk: "Краще обмежувати часте вживання яскраво забарвлених солодощів і напоїв, особливо дітям.",
      pl: "Warto ograniczać częste spożycie mocno barwionych słodyczy i napojów, zwłaszcza u dzieci.",
      en: "Limit frequent intake of brightly coloured sweets and drinks, especially for children.",
    },
    guidance: {
      uk: "Для 70 кг ADI ≈ 490 мг/день, але точна кількість у продукті зазвичай не вказана.",
      pl: "Dla 70 kg ADI to ok. 490 mg/dzień, ale ilość w produkcie zwykle nie jest podana.",
      en: "For 70 kg, ADI is about 490 mg/day, but product amount is usually not listed.",
    },
    adiMgKgDay: 7,
  },
  {
    code: "E407",
    aliases: ["e407", "e 407", "carrageenan", "karagen", "карагенан"],
    name: { uk: "Карагенан", pl: "Karagen", en: "Carrageenan" },
    group: stabilizerGroup,
    purpose: { uk: "Загущує та стабілізує молочні продукти, десерти й соуси.", pl: "Zagęszcza i stabilizuje nabiał, desery oraz sosy.", en: "Thickens and stabilizes dairy, desserts, and sauces." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Дозволений загущувач, але при чутливому травленні краще стежити за реакцією.",
      pl: "Dozwolony zagęstnik, ale przy wrażliwym trawieniu warto obserwować reakcję.",
      en: "Permitted thickener, but people with sensitive digestion may want to watch tolerance.",
    },
    guidance: {
      uk: "Якщо після таких продуктів є дискомфорт, зменшіть частоту і порівняйте з продуктами простішого складу.",
      pl: "Jeśli po takich produktach jest dyskomfort, zmniejsz częstotliwość i porównaj z prostszym składem.",
      en: "If discomfort appears, reduce frequency and compare with simpler ingredient products.",
    },
    adiMgKgDay: 75,
  },
  {
    code: "E412",
    aliases: ["e412", "e 412", "guar gum", "guma guar", "гуарова камедь", "гуарова камідь"],
    name: { uk: "Гуарова камедь", pl: "Guma guar", en: "Guar gum" },
    group: stabilizerGroup,
    purpose: { uk: "Загущує та стабілізує текстуру.", pl: "Zagęszcza i stabilizuje teksturę.", en: "Thickens and stabilizes texture." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у харчових кількостях.",
      pl: "Zwykle niskie ryzyko w ilościach spożywczych.",
      en: "Usually low risk at food-use levels.",
    },
    guidance: {
      uk: "При чутливому травленні великі кількості загущувачів можуть давати дискомфорт.",
      pl: "Przy wrażliwym trawieniu większe ilości zagęstników mogą dawać dyskomfort.",
      en: "Large amounts of thickeners may cause discomfort for sensitive digestion.",
    },
  },
  {
    code: "E415",
    aliases: ["e415", "e 415", "xanthan gum", "guma ksantanowa", "ксантанова камедь", "ксантанова камідь"],
    name: { uk: "Ксантанова камедь", pl: "Guma ksantanowa", en: "Xanthan gum" },
    group: stabilizerGroup,
    purpose: { uk: "Загущує та стабілізує соуси, напої й десерти.", pl: "Zagęszcza i stabilizuje sosy, napoje i desery.", en: "Thickens and stabilizes sauces, drinks, and desserts." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у харчових кількостях.",
      pl: "Zwykle niskie ryzyko w ilościach spożywczych.",
      en: "Usually low risk at food-use levels.",
    },
    guidance: {
      uk: "Якщо є здуття або дискомфорт, порівняйте реакцію на продукти без загущувачів.",
      pl: "Przy wzdęciach lub dyskomforcie porównaj reakcję na produkty bez zagęstników.",
      en: "If bloating or discomfort appears, compare with products without thickeners.",
    },
  },
  {
    code: "E440",
    aliases: ["e440", "e 440", "pectin", "pektyny", "pektyna", "пектини", "пектин"],
    name: { uk: "Пектини", pl: "Pektyny", en: "Pectins" },
    group: stabilizerGroup,
    purpose: { uk: "Загущує джеми, десерти й фруктові продукти.", pl: "Zagęszcza dżemy, desery i produkty owocowe.", en: "Thickens jams, desserts, and fruit products." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик; це харчові волокна рослинного походження.",
      pl: "Zwykle niskie ryzyko; to błonnik pochodzenia roślinnego.",
      en: "Usually low risk; this is plant-derived fiber.",
    },
    guidance: {
      uk: "Оцінюйте продукт у цілому: у джемах і десертах головним часто є цукор.",
      pl: "Oceniaj cały produkt: w dżemach i deserach kluczowy bywa cukier.",
      en: "Judge the whole product: sugar often matters more in jams and desserts.",
    },
  },
  {
    code: "E450",
    aliases: ["e450", "e 450", "diphosphates", "difosforany", "дифосфати", "пирофосфаты"],
    name: { uk: "Дифосфати", pl: "Difosforany", en: "Diphosphates" },
    group: { uk: "Стабілізатор / розпушувач", pl: "Stabilizator / spulchniacz", en: "Stabilizer / raising agent" },
    purpose: { uk: "Стабілізує текстуру або допомагає тісту підніматися.", pl: "Stabilizuje teksturę albo pomaga ciastu rosnąć.", en: "Stabilizes texture or helps dough rise." },
    riskLevel: "watch",
    riskSummary: {
      uk: "Джерело фосфатів; при частому вживанні ультраоброблених продуктів краще тримати помірність.",
      pl: "Źródło fosforanów; przy częstym jedzeniu wysoko przetworzonych produktów warto zachować umiar.",
      en: "A phosphate source; moderation is sensible when ultra-processed foods are frequent.",
    },
    guidance: {
      uk: "Особливо обережно при медичних обмеженнях щодо фосфору або нирок: тоді краще радитись з лікарем.",
      pl: "Szczególna ostrożność przy medycznych ograniczeniach fosforu lub nerek: wtedy skonsultuj z lekarzem.",
      en: "Use extra caution with medical phosphorus or kidney restrictions: ask a clinician then.",
    },
    adiMgKgDay: 40,
  },
  {
    code: "E471",
    aliases: ["e471", "e 471", "mono- and diglycerides", "mono and diglycerides", "mono- i diglicerydy", "моно- та дигліцериди", "моно и диглицериды"],
    name: { uk: "Моно- та дигліцериди жирних кислот", pl: "Mono- i diglicerydy kwasów tłuszczowych", en: "Mono- and diglycerides of fatty acids" },
    group: { uk: "Емульгатор", pl: "Emulgator", en: "Emulsifier" },
    purpose: { uk: "Покращує текстуру випічки, десертів і соусів.", pl: "Poprawia teksturę wypieków, deserów i sosów.", en: "Improves texture in baked goods, desserts, and sauces." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик; важливіше оцінити весь продукт і кількість жирів.",
      pl: "Zwykle niskie ryzyko; ważniejsza jest całość produktu i ilość tłuszczu.",
      en: "Usually low risk; the whole product and fat amount matter more.",
    },
    guidance: {
      uk: "Для щоденного раціону краще, щоб основою були менш оброблені продукти.",
      pl: "Na co dzień lepiej, aby bazą były mniej przetworzone produkty.",
      en: "For everyday eating, less processed foods should be the base.",
    },
  },
  {
    code: "E500",
    aliases: ["e500", "e 500", "sodium carbonates", "węglany sodu", "карбонати натрію", "карбонаты натрия", "baking soda"],
    name: { uk: "Карбонати натрію", pl: "Węglany sodu", en: "Sodium carbonates" },
    group: { uk: "Розпушувач / регулятор кислотності", pl: "Spulchniacz / regulator kwasowości", en: "Raising agent / acidity regulator" },
    purpose: { uk: "Допомагає випічці підніматися і регулює кислотність.", pl: "Pomaga wypiekom rosnąć i reguluje kwasowość.", en: "Helps baked goods rise and regulates acidity." },
    riskLevel: "low",
    riskSummary: {
      uk: "Зазвичай низький ризик у харчових кількостях.",
      pl: "Zwykle niskie ryzyko w ilościach spożywczych.",
      en: "Usually low risk at food-use levels.",
    },
    guidance: {
      uk: "Оцінюйте продукт у цілому: цукор, сіль і порція важливіші за сам розпушувач.",
      pl: "Oceniaj cały produkt: cukier, sól i porcja są ważniejsze niż sam spulchniacz.",
      en: "Judge the whole product: sugar, salt, and serving size matter more than this raising agent.",
    },
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
    aliases: ["sweetener", "sweeteners", "słodzik", "słodziki", "substancja słodząca", "substancje słodzące", "підсолоджувач", "підсолоджувачі", "подсластитель", "подсластители", "aspartame", "sucralose", "acesulfame", "steviol"],
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
    id: "vitamins",
    aliases: ["vitamin", "vitamins", "witamina", "witaminy", "вітамін", "вітаміни", "витамин", "витамины", "thiamin", "riboflavin", "niacin", "biotin", "folic acid"],
    label: { uk: "Вітаміни", pl: "Witaminy", en: "Vitamins" },
    group: { uk: "Мікронутрієнти", pl: "Mikroskładniki", en: "Micronutrients" },
    tone: "good",
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
    id: "thickener",
    aliases: ["thickener", "thickeners", "stabilizer", "stabilizers", "zagęstnik", "zagęstniki", "stabilizator", "stabilizatory", "загущувач", "стабілізатор", "загуститель", "стабилизатор", "gum", "guma", "камедь", "камідь", "pectin", "pektyna", "пектин"],
    label: { uk: "Загущувач / стабілізатор", pl: "Zagęstnik / stabilizator", en: "Thickener / stabilizer" },
    group: { uk: "Текстура продукту", pl: "Tekstura produktu", en: "Product texture" },
    tone: "neutral",
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
