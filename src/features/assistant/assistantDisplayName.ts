import type { AppLanguage } from "@shared/types/i18n";

const legacyAssistantNameKeys = new Set([
  "hyemye",
  "hyemue",
  "huemye",
  "huemue",
]);

const normalizeAssistantNameKey = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const getAssistantFallbackName = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return "Asystent Smart Nutrition";
    case "en":
      return "Smart Nutrition Assistant";
    case "uk":
    default:
      return "Помічник Smart Nutrition";
  }
};

export const getAssistantDisplayName = (
  name: string,
  language: AppLanguage,
  customFallback?: string
) => {
  const trimmedName = name.trim();
  const normalizedName = normalizeAssistantNameKey(trimmedName);

  if (trimmedName && !legacyAssistantNameKeys.has(normalizedName)) {
    return trimmedName;
  }

  return customFallback?.trim() || getAssistantFallbackName(language);
};
