import type { AppLanguage } from "../types/i18n";
import { en } from "./en";
import { pl } from "./pl";
import { uk } from "./uk";

export const appLanguages = ["uk", "pl", "en"] as const satisfies readonly AppLanguage[];

export const languageLabels: Record<AppLanguage, string> = {
  uk: "Українська",
  pl: "Polski",
  en: "English",
};

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  value === "uk" || value === "pl" || value === "en";

export const getLegacyContentLanguage = (language: AppLanguage): "uk" | "pl" =>
  language === "pl" ? "pl" : "uk";

export const i18nDictionaries = {
  uk,
  pl,
  en,
} as const;
