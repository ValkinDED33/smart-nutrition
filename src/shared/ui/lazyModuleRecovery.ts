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
        "Połączenie mogło przerwać ładowanie tej sekcji. Odśwież ją i spróbuj ponownie.",
      reloadLabel: "Odśwież",
    };
  }

  if (language === "en") {
    return {
      errorTitle: `${moduleLabel} did not load`,
      errorBody:
        "The connection may have interrupted this section. Refresh it and try again.",
      reloadLabel: "Refresh",
    };
  }

  return {
    errorTitle: `${moduleLabel} не завантажився`,
    errorBody:
      "З'єднання могло перервати завантаження розділу. Оновіть його і спробуйте ще раз.",
    reloadLabel: "Оновити",
  };
};
