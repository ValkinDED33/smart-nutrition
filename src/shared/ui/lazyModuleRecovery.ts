export type LazyModuleRecoveryLanguage = "uk" | "pl" | "en";

export interface LazyModuleRecoveryCopy {
  errorTitle: string;
  errorBody: string;
  reloadLabel: string;
}

export const buildLazyModuleRecoveryCopy = (
  language: LazyModuleRecoveryLanguage,
  moduleLabel: string
): LazyModuleRecoveryCopy => {
  if (language === "pl") {
    return {
      errorTitle: `${moduleLabel} się nie załadował`,
      errorBody:
        "Sieć albo cache mogły zachować stary plik. Odśwież sekcję i spróbuj ponownie.",
      reloadLabel: "Odśwież",
    };
  }

  if (language === "en") {
    return {
      errorTitle: `${moduleLabel} did not load`,
      errorBody:
        "The network or cache may have kept an old file. Refresh this section and try again.",
      reloadLabel: "Refresh",
    };
  }

  return {
    errorTitle: `${moduleLabel} не завантажився`,
    errorBody:
      "Мережа або кеш могли залишити старий файл. Оновіть розділ і спробуйте ще раз.",
    reloadLabel: "Оновити",
  };
};
