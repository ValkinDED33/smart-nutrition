// src/shared/lib/progressAnalysis.ts

import type { RootState } from "../../app/store";

// Тип состояния профиля через RootState
type ProfileState = RootState["profile"];

export const analyzeDeficit = (profile: ProfileState) => {
  if (profile.weightHistory.length === 0) return null;

  const firstWeight = profile.weightHistory[0]?.weight;
  const lastWeight = profile.weightHistory.at(-1)?.weight;

  if (firstWeight === undefined || lastWeight === undefined) return null;

  const weightChange = lastWeight - firstWeight;
  const deficitOrSurplus =
    profile.goal === "cut"
      ? firstWeight - lastWeight
      : profile.goal === "bulk"
      ? lastWeight - firstWeight
      : 0;

  const progressPercent =
    profile.goal === "cut"
      ? Math.min((weightChange / 0.5) * 100, 100) // ориентир: 0.5 кг в неделю
      : profile.goal === "bulk"
      ? Math.min((weightChange / 0.5) * 100, 100)
      : 0;

  return { weightChange, deficitOrSurplus, progressPercent };
};
