/**
 * OpenFoodFacts Integration - Mappers
 * 
 * Convert external API models to domain models
 */

import type { Product, Nutrients } from '@domain/meal';
import type { OffProduct } from './client';

export function mapOffProductToDomain(off: OffProduct): Product {
  return {
    id: `off-${off.code}`,
    name: off.product_name || 'Unknown',
    brand: off.brands || undefined,
    barcode: off.code,
    unit: 'g',
    source: 'OpenFoodFacts',
    nutrients: mapOffNutrients(off.nutriments),
  };
}

function mapOffNutrients(nutriments: Record<string, number>): Nutrients {
  return {
    calories: nutriments['energy-kcal'] || 0,
    protein: nutriments.proteins || 0,
    fat: nutriments.fat || 0,
    carbs: nutriments.carbohydrates || 0,
    fiber: nutriments.fiber || 0,
    sugar: nutriments.sugars || 0,
    sodium: nutriments.salt || 0,
    calcium: nutriments.calcium || 0,
    iron: nutriments.iron || 0,
  };
}
