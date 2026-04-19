export interface WeightPoint {
  date: string;
  weight: number;
}

export type BmiStatus = "underweight" | "normal" | "overweight" | "obesity";

export const calculateBmi = (weightKg: number, heightCm: number) => {
  const heightMeters = heightCm / 100;

  if (!weightKg || !heightMeters) {
    return 0;
  }

  return weightKg / (heightMeters * heightMeters);
};

export const getBmiStatus = (bmi: number): BmiStatus => {
  if (bmi < 18.5) {
    return "underweight";
  }

  if (bmi < 25) {
    return "normal";
  }

  if (bmi < 30) {
    return "overweight";
  }

  return "obesity";
};

export const detectWeightPlateau = (
  weightHistory: WeightPoint[],
  {
    windowDays = 21,
    thresholdKg = 0.4,
  }: {
    windowDays?: number;
    thresholdKg?: number;
  } = {}
) => {
  const sorted = [...weightHistory]
    .filter((entry) => Number.isFinite(entry.weight) && entry.date)
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  if (sorted.length < 3) {
    return {
      hasPlateau: false,
      deltaKg: 0,
      weeksStable: 0,
    };
  }

  const latest = sorted.at(-1);

  if (!latest) {
    return {
      hasPlateau: false,
      deltaKg: 0,
      weeksStable: 0,
    };
  }

  const cutoffTime = new Date(latest.date).getTime() - windowDays * 24 * 60 * 60 * 1000;
  const windowEntries = sorted.filter(
    (entry) => new Date(entry.date).getTime() >= cutoffTime
  );

  if (windowEntries.length < 3) {
    return {
      hasPlateau: false,
      deltaKg: 0,
      weeksStable: 0,
    };
  }

  const first = windowEntries[0];
  const last = windowEntries.at(-1);

  if (!first || !last) {
    return {
      hasPlateau: false,
      deltaKg: 0,
      weeksStable: 0,
    };
  }

  const deltaKg = last.weight - first.weight;
  const daysCovered = Math.max(
    Math.round(
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
        (24 * 60 * 60 * 1000)
    ),
    0
  );

  return {
    hasPlateau: Math.abs(deltaKg) <= thresholdKg && daysCovered >= 14,
    deltaKg,
    weeksStable: Math.max(Math.floor(daysCovered / 7), 0),
  };
};

export const getDaysSince = (value: string | null | undefined) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
};
