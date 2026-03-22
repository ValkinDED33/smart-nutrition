import type { Product } from "../types/product";
import { createEmptyNutrients } from "./nutrients";

interface LocalProductRecord {
  product: Product;
  aliases: string[];
  featured?: boolean;
}

const baseNutrients = createEmptyNutrients();

const images = {
  oats:
    "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=900&q=80",
  dairy:
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
  eggs:
    "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=900&q=80",
  chicken:
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=80",
  beef:
    "https://images.unsplash.com/photo-1603046891744-761c7d7d8f3c?auto=format&fit=crop&w=900&q=80",
  fish:
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80",
  grains:
    "https://images.unsplash.com/photo-1515543904379-3d757afe72e7?auto=format&fit=crop&w=900&q=80",
  bread:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
  fruits:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80",
  nuts:
    "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80",
  protein:
    "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=900&q=80",
  tofu:
    "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=80",
  oil:
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
  hummus:
    "https://images.unsplash.com/photo-1625944525533-473f1f0c57ab?auto=format&fit=crop&w=900&q=80",
};

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const createProduct = ({
  id,
  name,
  calories,
  protein,
  fat,
  carbs,
  imageUrl,
  aliases,
  featured = true,
  brand,
  barcode,
  unit = "g",
  facts,
}: {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl: string;
  aliases: string[];
  featured?: boolean;
  brand?: string;
  barcode?: string;
  unit?: Product["unit"];
  facts?: Product["facts"];
}): LocalProductRecord => ({
  featured,
  aliases,
  product: {
    id,
    name,
    unit,
    brand,
    barcode,
    imageUrl,
    facts,
    source: "Manual",
    nutrients: {
      ...baseNutrients,
      calories,
      protein,
      fat,
      carbs,
    },
  },
});

const catalog: LocalProductRecord[] = [
  createProduct({
    id: "manual-oats",
    name: "Oats",
    calories: 389,
    protein: 17,
    fat: 7,
    carbs: 66,
    imageUrl: images.oats,
    aliases: ["oats", "овсянка", "вівсянка", "platki owsiane", "owsianka"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex", "fiber"],
      proteinTypes: ["plant", "incomplete"],
      extraCompounds: ["polyphenols"],
    },
  }),
  createProduct({
    id: "manual-greek-yogurt",
    name: "Greek yogurt",
    calories: 73,
    protein: 10,
    fat: 2,
    carbs: 3.9,
    imageUrl: images.dairy,
    barcode: "4820000730030",
    aliases: ["greek yogurt", "йогурт", "грецький йогурт", "jogurt grecki"],
    facts: {
      foodGroup: "dairy",
      proteinTypes: ["animal", "complete", "slow"],
    },
  }),
  createProduct({
    id: "manual-skyr",
    name: "Skyr",
    calories: 63,
    protein: 11,
    fat: 0.2,
    carbs: 4,
    imageUrl: images.dairy,
    aliases: ["skyr", "скир"],
    facts: {
      foodGroup: "dairy",
      proteinTypes: ["animal", "complete", "slow"],
    },
  }),
  createProduct({
    id: "manual-cottage-cheese",
    name: "Cottage cheese",
    calories: 121,
    protein: 17,
    fat: 5,
    carbs: 3,
    imageUrl: images.dairy,
    aliases: ["cottage cheese", "творог", "сир", "twarog", "ser wiejski"],
    facts: {
      foodGroup: "dairy",
      proteinTypes: ["animal", "complete", "slow"],
    },
  }),
  createProduct({
    id: "manual-hard-cheese",
    name: "Hard cheese",
    calories: 356,
    protein: 25,
    fat: 27,
    carbs: 2,
    imageUrl: images.dairy,
    barcode: "4820000730016",
    aliases: ["cheese", "сыр", "сир", "ser", "ser twardy"],
    facts: {
      foodGroup: "dairy",
      proteinTypes: ["animal", "complete", "slow"],
      fatTypes: ["saturated"],
    },
  }),
  createProduct({
    id: "manual-milk",
    name: "Milk 2.5%",
    calories: 52,
    protein: 3.3,
    fat: 2.5,
    carbs: 4.8,
    imageUrl: images.dairy,
    unit: "ml",
    aliases: ["milk", "молоко", "mleko"],
    facts: {
      foodGroup: "dairy",
      carbohydrateTypes: ["simple"],
      proteinTypes: ["animal", "complete", "slow"],
      extraCompounds: ["electrolytes"],
    },
  }),
  createProduct({
    id: "manual-kefir",
    name: "Kefir",
    calories: 51,
    protein: 3.4,
    fat: 2,
    carbs: 4.7,
    imageUrl: images.dairy,
    unit: "ml",
    aliases: ["kefir", "кефир"],
    facts: {
      foodGroup: "dairy",
      carbohydrateTypes: ["simple"],
      proteinTypes: ["animal", "complete", "slow"],
      extraCompounds: ["electrolytes"],
    },
  }),
  createProduct({
    id: "manual-egg-boiled",
    name: "Boiled egg",
    calories: 155,
    protein: 13,
    fat: 11,
    carbs: 1.1,
    imageUrl: images.eggs,
    barcode: "4820000730047",
    aliases: ["egg", "eggs", "яйцо", "яйце", "jajko", "boiled egg"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
      fatTypes: ["unsaturated", "saturated"],
    },
  }),
  createProduct({
    id: "manual-egg-fried",
    name: "Fried egg",
    calories: 196,
    protein: 14,
    fat: 15,
    carbs: 1,
    imageUrl: images.eggs,
    aliases: ["fried egg", "яичница", "смажене яйце", "jajko sadzone"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
      fatTypes: ["unsaturated", "saturated"],
    },
  }),
  createProduct({
    id: "manual-chicken-breast",
    name: "Chicken breast",
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    imageUrl: images.chicken,
    aliases: ["chicken", "курица", "куряче філе", "kurczak", "piers z kurczaka"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
    },
  }),
  createProduct({
    id: "manual-turkey-breast",
    name: "Turkey breast",
    calories: 135,
    protein: 29,
    fat: 1.5,
    carbs: 0,
    imageUrl: images.chicken,
    barcode: "4820000730023",
    aliases: ["turkey", "индейка", "індичка", "indyk"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
    },
  }),
  createProduct({
    id: "manual-turkey-ham",
    name: "Turkey ham",
    calories: 104,
    protein: 17,
    fat: 3,
    carbs: 2,
    imageUrl: images.chicken,
    aliases: ["turkey ham", "ветчина", "шинка", "szynka z indyka"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
    },
  }),
  createProduct({
    id: "manual-beef",
    name: "Lean beef",
    calories: 187,
    protein: 26,
    fat: 9,
    carbs: 0,
    imageUrl: images.beef,
    aliases: ["beef", "говядина", "яловичина", "wolowina"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
      fatTypes: ["saturated"],
    },
  }),
  createProduct({
    id: "manual-salmon",
    name: "Salmon",
    calories: 208,
    protein: 20,
    fat: 13,
    carbs: 0,
    imageUrl: images.fish,
    aliases: ["salmon", "лосось", "сьомга", "losos"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
      fatTypes: ["polyunsaturated", "omega3"],
    },
  }),
  createProduct({
    id: "manual-tuna",
    name: "Tuna in water",
    calories: 116,
    protein: 26,
    fat: 1,
    carbs: 0,
    imageUrl: images.fish,
    aliases: ["tuna", "тунец", "тунець", "tunczyk"],
    facts: {
      foodGroup: "protein",
      proteinTypes: ["animal", "complete"],
      fatTypes: ["omega3"],
    },
  }),
  createProduct({
    id: "manual-rice",
    name: "Rice cooked",
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28,
    imageUrl: images.grains,
    aliases: ["rice", "рис", "ryz"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex"],
      proteinTypes: ["plant", "incomplete"],
    },
  }),
  createProduct({
    id: "manual-buckwheat",
    name: "Buckwheat cooked",
    calories: 110,
    protein: 4.2,
    fat: 1.1,
    carbs: 21.3,
    imageUrl: images.grains,
    aliases: ["buckwheat", "гречка", "kasza gryczana"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex", "fiber"],
      proteinTypes: ["plant", "incomplete"],
    },
  }),
  createProduct({
    id: "manual-pasta",
    name: "Pasta cooked",
    calories: 158,
    protein: 5.8,
    fat: 0.9,
    carbs: 31,
    imageUrl: images.grains,
    aliases: ["pasta", "макароны", "макарони", "makaron"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex"],
      proteinTypes: ["plant", "incomplete"],
    },
  }),
  createProduct({
    id: "manual-potato",
    name: "Boiled potato",
    calories: 87,
    protein: 1.9,
    fat: 0.1,
    carbs: 20,
    imageUrl: images.grains,
    aliases: ["potato", "картофель", "картопля", "ziemniak"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex", "fiber"],
      extraCompounds: ["electrolytes"],
    },
  }),
  createProduct({
    id: "manual-sweet-potato",
    name: "Sweet potato",
    calories: 86,
    protein: 1.6,
    fat: 0.1,
    carbs: 20,
    imageUrl: images.grains,
    aliases: ["sweet potato", "батат"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex", "fiber"],
      extraCompounds: ["antioxidants"],
    },
  }),
  createProduct({
    id: "manual-bread",
    name: "Wholegrain bread",
    calories: 247,
    protein: 13,
    fat: 4.2,
    carbs: 41,
    imageUrl: images.bread,
    aliases: ["bread", "хлеб", "хліб", "chleb"],
    facts: {
      foodGroup: "grain",
      carbohydrateTypes: ["complex", "fiber"],
      proteinTypes: ["plant", "incomplete"],
    },
  }),
  createProduct({
    id: "manual-tomato",
    name: "Tomato",
    calories: 18,
    protein: 0.9,
    fat: 0.2,
    carbs: 3.9,
    imageUrl: images.vegetables,
    aliases: ["tomato", "помидор", "томат", "помідор", "pomidor"],
    facts: {
      foodGroup: "vegetable",
      carbohydrateTypes: ["fiber"],
      extraCompounds: ["antioxidants", "phytonutrients"],
    },
  }),
  createProduct({
    id: "manual-cucumber",
    name: "Cucumber",
    calories: 15,
    protein: 0.7,
    fat: 0.1,
    carbs: 3.6,
    imageUrl: images.vegetables,
    aliases: ["cucumber", "огурец", "огірок", "ogorek"],
    facts: {
      foodGroup: "vegetable",
      carbohydrateTypes: ["fiber"],
      extraCompounds: ["electrolytes"],
    },
  }),
  createProduct({
    id: "manual-avocado",
    name: "Avocado",
    calories: 160,
    protein: 2,
    fat: 15,
    carbs: 9,
    imageUrl: images.vegetables,
    aliases: ["avocado", "авокадо"],
    facts: {
      foodGroup: "fruit",
      carbohydrateTypes: ["fiber"],
      fatTypes: ["unsaturated", "monounsaturated", "omega9"],
      extraCompounds: ["phytonutrients"],
    },
  }),
  createProduct({
    id: "manual-pepper",
    name: "Bell pepper",
    calories: 31,
    protein: 1,
    fat: 0.3,
    carbs: 6,
    imageUrl: images.vegetables,
    aliases: ["pepper", "перец", "перець", "papryka"],
    facts: {
      foodGroup: "vegetable",
      carbohydrateTypes: ["fiber"],
      extraCompounds: ["antioxidants", "phytonutrients"],
    },
  }),
  createProduct({
    id: "manual-banana",
    name: "Banana",
    calories: 89,
    protein: 1.1,
    fat: 0.3,
    carbs: 23,
    imageUrl: images.fruits,
    aliases: ["banana", "банан"],
    facts: {
      foodGroup: "fruit",
      carbohydrateTypes: ["simple", "fiber"],
      extraCompounds: ["electrolytes"],
    },
  }),
  createProduct({
    id: "manual-apple",
    name: "Apple",
    calories: 52,
    protein: 0.3,
    fat: 0.2,
    carbs: 14,
    imageUrl: images.fruits,
    aliases: ["apple", "яблоко", "яблуко", "jablko"],
    facts: {
      foodGroup: "fruit",
      carbohydrateTypes: ["simple", "fiber"],
      extraCompounds: ["polyphenols"],
    },
  }),
  createProduct({
    id: "manual-blueberries",
    name: "Blueberries",
    calories: 57,
    protein: 0.7,
    fat: 0.3,
    carbs: 14,
    imageUrl: images.fruits,
    aliases: ["berries", "blueberries", "черника", "лохина", "borowki"],
    facts: {
      foodGroup: "fruit",
      carbohydrateTypes: ["simple", "fiber"],
      extraCompounds: ["antioxidants", "polyphenols"],
    },
  }),
  createProduct({
    id: "manual-almonds",
    name: "Almonds",
    calories: 579,
    protein: 21,
    fat: 50,
    carbs: 22,
    imageUrl: images.nuts,
    aliases: ["almonds", "миндаль", "мигдаль", "migdal"],
    facts: {
      foodGroup: "nuts",
      carbohydrateTypes: ["fiber"],
      proteinTypes: ["plant", "incomplete"],
      fatTypes: ["unsaturated", "monounsaturated", "polyunsaturated"],
    },
  }),
  createProduct({
    id: "manual-peanut-butter",
    name: "Peanut butter",
    calories: 588,
    protein: 25,
    fat: 50,
    carbs: 20,
    imageUrl: images.nuts,
    aliases: ["peanut butter", "арахисовая паста", "арахісова паста", "maslo orzechowe"],
    facts: {
      foodGroup: "nuts",
      carbohydrateTypes: ["fiber"],
      proteinTypes: ["plant", "incomplete"],
      fatTypes: ["unsaturated", "monounsaturated", "polyunsaturated"],
    },
  }),
  createProduct({
    id: "manual-olive-oil",
    name: "Olive oil",
    calories: 884,
    protein: 0,
    fat: 100,
    carbs: 0,
    imageUrl: images.oil,
    aliases: ["olive oil", "оливковое масло", "оливкова олія", "oliwa"],
    facts: {
      foodGroup: "oil",
      fatTypes: ["unsaturated", "monounsaturated", "omega9"],
      extraCompounds: ["polyphenols"],
    },
  }),
  createProduct({
    id: "manual-mozzarella",
    name: "Mozzarella",
    calories: 280,
    protein: 28,
    fat: 17,
    carbs: 3,
    imageUrl: images.dairy,
    aliases: ["mozzarella", "моцарелла"],
    facts: {
      foodGroup: "dairy",
      proteinTypes: ["animal", "complete", "slow"],
      fatTypes: ["saturated"],
    },
  }),
  createProduct({
    id: "manual-tofu",
    name: "Tofu",
    calories: 76,
    protein: 8,
    fat: 4.8,
    carbs: 1.9,
    imageUrl: images.tofu,
    aliases: ["tofu", "тофу"],
    facts: {
      foodGroup: "legume",
      proteinTypes: ["plant", "incomplete"],
      fatTypes: ["polyunsaturated"],
    },
  }),
  createProduct({
    id: "manual-hummus",
    name: "Hummus",
    calories: 166,
    protein: 8,
    fat: 9.6,
    carbs: 14,
    imageUrl: images.hummus,
    aliases: ["hummus", "хумус"],
    facts: {
      foodGroup: "legume",
      carbohydrateTypes: ["complex", "fiber"],
      proteinTypes: ["plant", "incomplete"],
      fatTypes: ["unsaturated"],
    },
  }),
  createProduct({
    id: "manual-protein-bar",
    name: "Protein bar",
    calories: 360,
    protein: 30,
    fat: 11,
    carbs: 35,
    imageUrl: images.protein,
    aliases: ["protein bar", "батончик", "протеїновий батончик", "baton proteinowy"],
    facts: {
      foodGroup: "protein",
      carbohydrateTypes: ["simple", "complex"],
      proteinTypes: ["fast"],
    },
  }),
];

const localizedAliasesById: Record<string, string[]> = {
  "manual-oats": ["вівсянка", "овсянка", "płatki owsiane", "owsianka"],
  "manual-greek-yogurt": ["грецький йогурт", "греческий йогурт", "jogurt grecki"],
  "manual-skyr": ["скир"],
  "manual-cottage-cheese": ["кисломолочний сир", "творог", "twaróg", "ser wiejski"],
  "manual-hard-cheese": ["твердий сир", "сыр", "ser twardy"],
  "manual-milk": ["молоко", "mleko"],
  "manual-kefir": ["кефір", "кефир"],
  "manual-egg-boiled": ["яйце", "яйцо", "jajko", "jajko gotowane"],
  "manual-egg-fried": ["смажене яйце", "яичница", "jajko smażone"],
  "manual-chicken-breast": ["куряче філе", "курица", "kurczak", "pierś z kurczaka"],
  "manual-turkey-breast": ["філе індички", "индейка", "indyk", "pierś z indyka"],
  "manual-turkey-ham": ["шинка з індички", "ветчина", "szynka z indyka"],
  "manual-beef": ["яловичина", "говядина", "wołowina"],
  "manual-salmon": ["лосось", "сьомга", "łosoś"],
  "manual-tuna": ["тунець", "тунец", "tuńczyk"],
  "manual-rice": ["рис", "ryż"],
  "manual-buckwheat": ["гречка", "kasza gryczana"],
  "manual-pasta": ["макарони", "макароны", "makaron"],
  "manual-potato": ["картопля", "картофель", "ziemniak"],
  "manual-sweet-potato": ["батат"],
  "manual-bread": ["хліб", "хлеб", "chleb"],
  "manual-tomato": ["помідор", "томат", "pomidor"],
  "manual-cucumber": ["огірок", "огурец", "ogórek"],
  "manual-avocado": ["авокадо"],
  "manual-pepper": ["перець", "перец", "papryka"],
  "manual-banana": ["банан"],
  "manual-apple": ["яблуко", "яблоко", "jabłko"],
  "manual-blueberries": ["лохина", "черника", "borówki"],
  "manual-almonds": ["мигдаль", "миндаль", "migdały"],
  "manual-peanut-butter": ["арахісова паста", "арахисовая паста", "masło orzechowe"],
  "manual-olive-oil": ["оливкова олія", "оливковое масло", "oliwa"],
  "manual-mozzarella": ["моцарела", "моцарелла"],
  "manual-tofu": ["тофу"],
  "manual-hummus": ["хумус"],
  "manual-protein-bar": ["протеїновий батончик", "протеиновый батончик", "baton proteinowy"],
};

const getSearchCandidates = (record: LocalProductRecord) =>
  [
    record.product.name,
    record.product.brand,
    ...record.aliases,
    ...(localizedAliasesById[record.product.id] ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeSearchText(String(value)))
    .join(" ");

export const mockProducts: Product[] = catalog.map((record) => record.product);

export const getFeaturedProducts = (limit = 12): Product[] =>
  catalog
    .filter((record) => record.featured)
    .slice(0, limit)
    .map((record) => record.product);

export const findLocalProductByBarcode = (barcode: string): Product | null =>
  catalog.find((record) => record.product.barcode === barcode)?.product ?? null;

export const searchLocalProducts = (query: string, limit = 18): Product[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return getFeaturedProducts(limit);
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return catalog
    .map((record) => {
      const haystack = getSearchCandidates(record);
      const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
      const startsWithQuery = haystack.startsWith(normalizedQuery) ? 3 : 0;
      const exactAlias = [...record.aliases, ...(localizedAliasesById[record.product.id] ?? [])]
        .some((alias) => normalizeSearchText(alias) === normalizedQuery)
        ? 4
        : 0;

      return {
        product: record.product,
        score: matchedTokens + startsWithQuery + exactAlias,
      };
    })
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((record) => record.product);
};
