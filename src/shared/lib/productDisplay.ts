import type { Product } from "../types/product";
import type { Language } from "../language";

const localizedNames: Record<
  string,
  {
    uk: string;
    pl: string;
  }
> = {
  "manual-oats": { uk: "Вівсянка", pl: "Płatki owsiane" },
  "manual-greek-yogurt": { uk: "Грецький йогурт", pl: "Jogurt grecki" },
  "manual-skyr": { uk: "Скир", pl: "Skyr" },
  "manual-cottage-cheese": { uk: "Кисломолочний сир", pl: "Twaróg" },
  "manual-hard-cheese": { uk: "Твердий сир", pl: "Ser twardy" },
  "manual-milk": { uk: "Молоко 2.5%", pl: "Mleko 2.5%" },
  "manual-kefir": { uk: "Кефір", pl: "Kefir" },
  "manual-egg-boiled": { uk: "Яйце варене", pl: "Jajko gotowane" },
  "manual-egg-fried": { uk: "Яйце смажене", pl: "Jajko smażone" },
  "manual-chicken-breast": { uk: "Куряче філе", pl: "Pierś z kurczaka" },
  "manual-turkey-breast": { uk: "Філе індички", pl: "Pierś z indyka" },
  "manual-turkey-ham": { uk: "Шинка з індички", pl: "Szynka z indyka" },
  "manual-beef": { uk: "Яловичина", pl: "Wołowina" },
  "manual-salmon": { uk: "Лосось", pl: "Łosoś" },
  "manual-tuna": { uk: "Тунець у воді", pl: "Tuńczyk w wodzie" },
  "manual-rice": { uk: "Рис варений", pl: "Ryż gotowany" },
  "manual-buckwheat": { uk: "Гречка варена", pl: "Kasza gryczana" },
  "manual-pasta": { uk: "Макарони варені", pl: "Makaron gotowany" },
  "manual-potato": { uk: "Картопля варена", pl: "Ziemniak gotowany" },
  "manual-sweet-potato": { uk: "Батат", pl: "Batat" },
  "manual-bread": { uk: "Цільнозерновий хліб", pl: "Chleb pełnoziarnisty" },
  "manual-tomato": { uk: "Помідор", pl: "Pomidor" },
  "manual-cucumber": { uk: "Огірок", pl: "Ogórek" },
  "manual-avocado": { uk: "Авокадо", pl: "Awokado" },
  "manual-pepper": { uk: "Перець солодкий", pl: "Papryka" },
  "manual-banana": { uk: "Банан", pl: "Banan" },
  "manual-apple": { uk: "Яблуко", pl: "Jabłko" },
  "manual-blueberries": { uk: "Лохина", pl: "Borówki" },
  "manual-almonds": { uk: "Мигдаль", pl: "Migdały" },
  "manual-peanut-butter": { uk: "Арахісова паста", pl: "Masło orzechowe" },
  "manual-olive-oil": { uk: "Оливкова олія", pl: "Oliwa z oliwek" },
  "manual-mozzarella": { uk: "Моцарела", pl: "Mozzarella" },
  "manual-tofu": { uk: "Тофу", pl: "Tofu" },
  "manual-hummus": { uk: "Хумус", pl: "Hummus" },
  "manual-protein-bar": { uk: "Протеїновий батончик", pl: "Baton proteinowy" },
};

export const getProductDisplayName = (product: Product, language: Language) =>
  localizedNames[product.id]?.[language] ?? product.name;
