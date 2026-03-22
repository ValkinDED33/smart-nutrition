export interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  monounsaturatedFat: number;
  polyunsaturatedFat: number;
  transFat: number;
  omega3: number;
  omega6: number;
  omega9: number;
  cholesterol: number;
  carbs: number;
  sugars: number;
  fiber: number;
  starch: number;
  glucose: number;
  fructose: number;
  sucrose: number;
  lactose: number;
  water: number;
  sodium: number;
  potassium: number;
  vitaminA: number;
  vitaminB: number;
  vitaminB1: number;
  vitaminB2: number;
  vitaminB3: number;
  vitaminB5: number;
  vitaminB6: number;
  vitaminB7: number;
  vitaminB9: number;
  vitaminB12: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  calcium: number;
  iron: number;
  magnesium: number;
  zinc: number;
  phosphorus: number;
  iodine: number;
  selenium: number;
  copper: number;

  // Important for safe iteration over nutrient keys.
  [key: string]: number;
}

export type NutrientKey = keyof Nutrients;

export type ProductSource = "USDA" | "OpenFoodFacts" | "Manual" | "Recipe";

export interface ProductFacts {
  foodGroup?: string;
  carbohydrateTypes?: string[];
  proteinTypes?: string[];
  fatTypes?: string[];
  extraCompounds?: string[];
}

export interface Product {
  id: string;
  name: string;
  unit: "g" | "ml" | "piece";
  source: ProductSource;
  nutrients: Nutrients;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  facts?: ProductFacts;
}
