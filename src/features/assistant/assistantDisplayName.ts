import type { AppLanguage } from "@shared/types/i18n";

const legacyAssistantNames = new Set(["hyemye", "hye-mye", "hue-mue", "huemue"]);

const getAssistantFallbackName = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return "Twój asystent";
    case "en":
      return "your assistant";
    case "uk":
    default:
      return "ваш помічник";
  }
};

export const getAssistantDisplayName = (
  name: string,
  language: AppLanguage,
  customFallback?: string
) => {
  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();

  if (trimmedName && !legacyAssistantNames.has(normalizedName)) {
    return trimmedName;
  }

  return customFallback?.trim() || getAssistantFallbackName(language);
};
