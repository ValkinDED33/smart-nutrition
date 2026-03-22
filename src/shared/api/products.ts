import type { Product, Nutrients, ProductSource } from "../types/product";
import { fetchUSDAByBarcode } from "./usda";
import { fetchOpenFoodByBarcode } from "./openFood";
import { mockProducts } from "../lib/mockProducts";

type RawProduct = Record<string, unknown>;

const mockBarcodeLookup: Record<string, Product> = {
  "4820000730016": mockProducts.find((product) => product.id === "manual-cheese")!,
  "4820000730023": mockProducts.find((product) => product.id === "manual-turkey")!,
  "4820000730030": mockProducts.find((product) => product.id === "manual-greek-yogurt")!,
  "4820000730047": mockProducts.find((product) => product.id === "manual-egg-boiled")!,
};

export const fetchProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  const normalizedBarcode = barcode.replace(/\D/g, "");

  if (!normalizedBarcode) {
    return null;
  }

  try {
    const [usdaResult, offResult] = await Promise.allSettled([
      fetchUSDAByBarcode(normalizedBarcode),
      fetchOpenFoodByBarcode(normalizedBarcode),
    ]);

    const usda = usdaResult.status === "fulfilled" ? usdaResult.value : null;
    if (usda) return mapToProduct(usda as RawProduct, "USDA");

    const off = offResult.status === "fulfilled" ? offResult.value : null;
    if (off) return mapToProduct(off as RawProduct, "OpenFoodFacts");

    return mockBarcodeLookup[normalizedBarcode] ?? null;
  } catch (error) {
    console.error("Product lookup failed:", error);
    return mockBarcodeLookup[normalizedBarcode] ?? null;
  }
};

const mapToProduct = (data: RawProduct, source: ProductSource): Product => {
  const parseNum = (val: unknown) =>
    typeof val === "string"
      ? parseFloat(val) || 0
      : typeof val === "number"
      ? val
      : 0;

  const nutriments = data.nutriments as Record<string, unknown> | undefined;

  const nutrients: Nutrients = {
    calories: parseNum(data.calories ?? nutriments?.energy_100g),
    protein: parseNum(data.protein ?? nutriments?.proteins_100g),
    fat: parseNum(data.fat ?? nutriments?.fat_100g),
    saturatedFat: parseNum(data.saturatedFat ?? nutriments?.["saturated-fat_100g"]),
    polyunsaturatedFat: parseNum(
      data.polyunsaturatedFat ?? nutriments?.["polyunsaturated-fat_100g"]
    ),
    transFat: parseNum(data.transFat ?? nutriments?.["trans-fat_100g"]),
    cholesterol: parseNum(data.cholesterol ?? nutriments?.cholesterol_100g),
    carbs: parseNum(data.carbs ?? nutriments?.carbohydrates_100g),
    sugars: parseNum(data.sugars ?? nutriments?.sugars_100g),
    fiber: parseNum(data.fiber ?? nutriments?.fiber_100g),
    sodium: parseNum(data.sodium ?? nutriments?.sodium_100g),
    potassium: parseNum(data.potassium ?? nutriments?.potassium_100g),
    calcium: parseNum(data.calcium ?? nutriments?.calcium_100g),
    iron: parseNum(data.iron ?? nutriments?.iron_100g),
    magnesium: parseNum(data.magnesium ?? nutriments?.magnesium_100g),
    zinc: parseNum(data.zinc ?? nutriments?.zinc_100g),
    phosphorus: parseNum(nutriments?.phosphorus_100g),
    vitaminA: parseNum(nutriments?.["vitamin-a_100g"]),
    vitaminB: parseNum(nutriments?.["vitamin-b_100g"]),
    vitaminC: parseNum(nutriments?.["vitamin-c_100g"]),
    vitaminD: parseNum(nutriments?.["vitamin-d_100g"]),
    vitaminE: parseNum(nutriments?.["vitamin-e_100g"]),
    vitaminK: parseNum(nutriments?.["vitamin-k_100g"]),
  };

  return {
    id: String(data.fdcId ?? data._id ?? Date.now()),
    name: String(data.description ?? data.product_name ?? "Unknown product"),
    unit: "g",
    source,
    nutrients,
  };
};
