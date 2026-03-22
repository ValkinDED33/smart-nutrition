import axios from "axios";
import type { RawProduct } from "../types/rawProduct";

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

const fetchUSDASearch = async (query: string) => {
  const res = await axios.get(USDA_SEARCH_URL, {
    params: {
      query,
      pageSize: 12,
      api_key: USDA_API_KEY,
    },
  });

  return res.data.foods ?? [];
};

export const fetchUSDAByBarcode = async (
  barcode: string
): Promise<RawProduct | null> => {
  try {
    const foods = await fetchUSDASearch(barcode);
    return foods[0] ?? null;
  } catch (error) {
    console.error("USDA fetch error:", error);
    return null;
  }
};

export const searchUSDAProducts = async (query: string): Promise<RawProduct[]> => {
  if (!USDA_API_KEY) {
    return [];
  }

  try {
    return await fetchUSDASearch(query);
  } catch (error) {
    console.error("USDA search error:", error);
    return [];
  }
};
