import type { MealItem } from "../../features/meal/mealSlice";
import type { Nutrients } from "../../shared/types/product";

// Функция расчета суммарных нутриентов для списка продуктов
export const calculateMealTotals = (items: MealItem[]): Nutrients => {
  const initialTotals: Nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    carbs: 0,
    sugars: 0,
    fiber: 0,
    sodium: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminB: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0,
    phosphorus: 0,
  };

  return items.reduce<Nutrients>(
    (totals, item) => {
      // 🔹 проверяем, что product и nutrients определены
      if (!item.product || !item.product.nutrients) return totals;

      const n = item.product.nutrients;
      const factor = item.quantity / 100;

      // безопасно перебираем только ключи initialTotals
      (Object.keys(initialTotals) as (keyof Nutrients)[]).forEach((key) => {
        const currentTotal = totals[key] ?? 0;
        const nutrientValue = n[key] ?? 0;
        totals[key] = currentTotal + nutrientValue * factor;
      });

      return totals;
    },
    { ...initialTotals }
  );
};
