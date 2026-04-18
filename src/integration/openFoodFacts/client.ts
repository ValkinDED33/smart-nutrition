/**
 * OpenFoodFacts Integration - Client
 */

import { OfflineError, NotFoundError } from '@integration/shared/errors';

export interface OffProduct {
  code: string;
  product_name: string;
  brands?: string;
  nutriments: Record<string, number>;
}

export class OpenFoodFactsClient {
  private baseUrl = 'https://world.openfoodfacts.org/api/v0';
  private timeout = 5000;

  async searchByName(query: string): Promise<OffProduct[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/products?search_terms=${encodeURIComponent(query)}&json=true`,
        { signal: AbortSignal.timeout(this.timeout) }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new OfflineError();
      }
      throw error;
    }
  }

  async getByBarcode(barcode: string): Promise<OffProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product/${barcode}?json=true`,
        { signal: AbortSignal.timeout(this.timeout) }
      );

      if (response.status === 404) {
        throw new NotFoundError('Product', { barcode });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new OfflineError();
      }
      throw error;
    }
  }
}
