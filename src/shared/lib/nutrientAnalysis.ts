import { DAILY_NORMS } from "./dailyNorms";

interface Totals {
  [key: string]: number;
}

interface NutrientStatus {
  value: number;
  norm: number;
  percent: number;
  status: "deficit" | "normal" | "excess";
}

export const analyzeNutrients = (totals: Totals) => {
  const result: Record<string, NutrientStatus> = {};

  Object.keys(DAILY_NORMS).forEach((key) => {
    const value = totals[key] || 0;
    const norm = DAILY_NORMS[key as keyof typeof DAILY_NORMS];
    const percent = (value / norm) * 100;

    let status: "deficit" | "normal" | "excess" = "normal";

    if (percent < 70) status = "deficit";
    if (percent > 120) status = "excess";

    result[key] = {
      value,
      norm,
      percent,
      status,
    };
  });

  return result;
};
