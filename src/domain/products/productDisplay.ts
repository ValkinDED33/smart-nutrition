import type { Product } from "@domain/products/types";
import type { AppLanguage } from "@shared/types/i18n";

const localizedNames: Record<
  string,
  Record<AppLanguage, string>
> = {
  "manual-oats": { uk: "Вівсянка", pl: "Płatki owsiane", en: "Oats" },
  "manual-greek-yogurt": { uk: "Грецький йогурт", pl: "Jogurt grecki", en: "Greek yogurt" },
  "manual-skyr": { uk: "Скир", pl: "Skyr", en: "Skyr" },
  "manual-cottage-cheese": { uk: "Кисломолочний сир", pl: "Twaróg", en: "Cottage cheese" },
  "manual-hard-cheese": { uk: "Твердий сир", pl: "Ser twardy", en: "Hard cheese" },
  "manual-milk": { uk: "Молоко 2.5%", pl: "Mleko 2.5%", en: "Milk 2.5%" },
  "manual-kefir": { uk: "Кефір", pl: "Kefir", en: "Kefir" },
  "manual-egg-boiled": { uk: "Яйце варене", pl: "Jajko gotowane", en: "Boiled egg" },
  "manual-egg-fried": { uk: "Яйце смажене", pl: "Jajko smażone", en: "Fried egg" },
  "manual-chicken-breast": { uk: "Куряче філе", pl: "Pierś z kurczaka", en: "Chicken breast" },
  "manual-turkey-breast": { uk: "Філе індички", pl: "Pierś z indyka", en: "Turkey breast" },
  "manual-turkey-ham": { uk: "Шинка з індички", pl: "Szynka z indyka", en: "Turkey ham" },
  "manual-beef": { uk: "Яловичина", pl: "Wołowina", en: "Beef" },
  "manual-salmon": { uk: "Лосось", pl: "Łosoś", en: "Salmon" },
  "manual-tuna": { uk: "Тунець у воді", pl: "Tuńczyk w wodzie", en: "Tuna in water" },
  "manual-rice": { uk: "Рис варений", pl: "Ryż gotowany", en: "Cooked rice" },
  "manual-buckwheat": { uk: "Гречка варена", pl: "Kasza gryczana", en: "Cooked buckwheat" },
  "manual-pasta": { uk: "Макарони варені", pl: "Makaron gotowany", en: "Cooked pasta" },
  "manual-potato": { uk: "Картопля варена", pl: "Ziemniak gotowany", en: "Boiled potato" },
  "manual-sweet-potato": { uk: "Батат", pl: "Batat", en: "Sweet potato" },
  "manual-bread": { uk: "Цільнозерновий хліб", pl: "Chleb pełnoziarnisty", en: "Whole grain bread" },
  "manual-tomato": { uk: "Помідор", pl: "Pomidor", en: "Tomato" },
  "manual-cucumber": { uk: "Огірок", pl: "Ogórek", en: "Cucumber" },
  "manual-avocado": { uk: "Авокадо", pl: "Awokado", en: "Avocado" },
  "manual-pepper": { uk: "Перець солодкий", pl: "Papryka", en: "Sweet pepper" },
  "manual-banana": { uk: "Банан", pl: "Banan", en: "Banana" },
  "manual-apple": { uk: "Яблуко", pl: "Jabłko", en: "Apple" },
  "manual-blueberries": { uk: "Лохина", pl: "Borówki", en: "Blueberries" },
  "manual-almonds": { uk: "Мигдаль", pl: "Migdały", en: "Almonds" },
  "manual-peanut-butter": { uk: "Арахісова паста", pl: "Masło orzechowe", en: "Peanut butter" },
  "manual-olive-oil": { uk: "Оливкова олія", pl: "Oliwa z oliwek", en: "Olive oil" },
  "manual-mozzarella": { uk: "Моцарела", pl: "Mozzarella", en: "Mozzarella" },
  "manual-tofu": { uk: "Тофу", pl: "Tofu", en: "Tofu" },
  "manual-hummus": { uk: "Хумус", pl: "Hummus", en: "Hummus" },
  "manual-protein-bar": { uk: "Протеїновий батончик", pl: "Baton proteinowy", en: "Protein bar" },
};

export const getProductDisplayName = (product: Product, language: AppLanguage) =>
  localizedNames[product.id]?.[language] ?? product.name;
