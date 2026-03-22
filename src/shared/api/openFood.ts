import axios from "axios";
import type { RawProduct } from "../types/rawProduct";

const OFF_API_URL = import.meta.env.VITE_OFF_API_URL;

export const fetchOpenFoodByBarcode = async (
  barcode: string
): Promise<RawProduct | null> => {
  try {
    const res = await axios.get(`${OFF_API_URL}/${barcode}.json`);
    return res.data.product ?? null;
  } catch (error) {
    console.error("OpenFoodFacts fetch error:", error);
    return null;
  }
};
