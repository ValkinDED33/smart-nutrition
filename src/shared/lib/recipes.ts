import { mockProducts } from "./mockProducts";
import type { Recipe } from "../types/meal";
import type { Product } from "../types/product";

const legacyProductIds: Record<string, string> = {
  "manual-chicken": "manual-chicken-breast",
  "manual-turkey": "manual-turkey-breast",
  "manual-cheese": "manual-hard-cheese",
  "manual-nuts": "manual-almonds",
};

const requireProduct = (id: string): Product => {
  const normalizedId = legacyProductIds[id] ?? id;
  const product = mockProducts.find((item) => item.id === normalizedId);

  if (!product) {
    throw new Error(`Missing product for recipe: ${id}`);
  }

  return product;
};

export const recipes: Recipe[] = [
  {
    id: "recipe-breakfast-bowl",
    title: "Протеїнова вівсянка з бананом",
    mealType: "breakfast",
    description:
      "Ситний солодкий сніданок з повільними вуглеводами та білком.",
    ingredients: [
      { product: requireProduct("manual-oats"), quantity: 60 },
      { product: requireProduct("manual-greek-yogurt"), quantity: 180 },
      { product: requireProduct("manual-banana"), quantity: 80 },
    ],
    steps: [
      "Залий вівсянку гарячою водою або молоком.",
      "Додай йогурт і нарізаний банан.",
      "Перемішай та дай настоятися 3-4 хвилини.",
    ],
    calories: 427,
    protein: 30.6,
    fat: 8.4,
    carbs: 58.2,
  },
  {
    id: "recipe-lunch-bowl",
    title: "Боул з куркою, рисом і томатами",
    mealType: "lunch",
    description:
      "Класичний фіт-обід для стабільної енергії всередині дня.",
    ingredients: [
      { product: requireProduct("manual-chicken"), quantity: 160 },
      { product: requireProduct("manual-rice"), quantity: 180 },
      { product: requireProduct("manual-tomato"), quantity: 120 },
      { product: requireProduct("manual-cucumber"), quantity: 120 },
    ],
    steps: [
      "Підсмаж або запікай куряче філе без зайвої олії.",
      "Додай відварений рис.",
      "Подавай зі свіжими томатами та огірком.",
    ],
    calories: 527,
    protein: 54.1,
    fat: 6.4,
    carbs: 56.1,
  },
  {
    id: "recipe-dinner-salmon",
    title: "Лосось з авокадо і салатом",
    mealType: "dinner",
    description:
      "Легка вечеря з корисними жирами та хорошим насиченням.",
    ingredients: [
      { product: requireProduct("manual-salmon"), quantity: 150 },
      { product: requireProduct("manual-avocado"), quantity: 70 },
      { product: requireProduct("manual-tomato"), quantity: 120 },
      { product: requireProduct("manual-cucumber"), quantity: 120 },
    ],
    steps: [
      "Запікай лосось до готовності.",
      "Наріж овочі та авокадо.",
      "Подавай рибу з салатом без важких соусів.",
    ],
    calories: 464,
    protein: 32.5,
    fat: 30.8,
    carbs: 13.7,
  },
  {
    id: "recipe-snack-curd",
    title: "Перекус з кисломолочним сиром і яблуком",
    mealType: "snack",
    description:
      "Швидкий білковий перекус між основними прийомами їжі.",
    ingredients: [
      { product: requireProduct("manual-cottage-cheese"), quantity: 180 },
      { product: requireProduct("manual-apple"), quantity: 120 },
      { product: requireProduct("manual-nuts"), quantity: 15 },
    ],
    steps: [
      "Виклади сир у миску.",
      "Додай шматочки яблука.",
      "Посип мигдалем перед подачею.",
    ],
    calories: 333,
    protein: 34.0,
    fat: 16.1,
    carbs: 24.9,
  },
];
