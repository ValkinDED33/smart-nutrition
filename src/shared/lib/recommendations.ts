import type { Product } from "../types/product"; // только тип
import { mockProducts } from "./mockProducts"; // обычный импорт, т.к. это значение

export const getRandomRecommendation = (): Product[] => {
  const shuffled = [...mockProducts].sort(() => 0.5 - Math.random()); // клонируем, чтобы не мутировать оригинал
  return shuffled.slice(0, 3);
};
