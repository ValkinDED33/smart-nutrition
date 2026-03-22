import axios from "axios";
import type { RawProduct } from "../types/rawProduct";

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;

export const fetchUSDAByBarcode = async (
  barcode: string
): Promise<RawProduct | null> => {
  try {
    const res = await axios.get(
      "https://api.nal.usda.gov/fdc/v1/foods/search",
      {
        params: {
          query: barcode,
          api_key: USDA_API_KEY,
        },
      }
    );
    return res.data.foods?.[0] ?? null;
  } catch (error) {
    console.error("USDA fetch error:", error);
    return null;
  }
};
