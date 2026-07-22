import type { AppLanguage } from "@shared/types/i18n";

export type ProfileCloudActionCopy = {
  saveFailed: string;
  saveInProgress: string;
};

const profileCloudActionCopy: Record<AppLanguage, ProfileCloudActionCopy> = {
  uk: {
    saveFailed: "Не вдалося зберегти зміни профілю. Спробуйте ще раз.",
    saveInProgress:
      "Зміни профілю вже зберігаються. Зачекайте кілька секунд.",
  },
  pl: {
    saveFailed: "Nie udało się zapisać zmian profilu. Spróbuj ponownie.",
    saveInProgress:
      "Zmiany profilu już się zapisują. Poczekaj kilka sekund.",
  },
  en: {
    saveFailed: "Profile changes could not be saved. Please try again.",
    saveInProgress:
      "Profile changes are already being saved. Please wait a moment.",
  },
};

export const getProfileCloudActionCopy = (
  language: AppLanguage
): ProfileCloudActionCopy => {
  switch (language) {
    case "pl":
      return profileCloudActionCopy.pl;
    case "en":
      return profileCloudActionCopy.en;
    case "uk":
    default:
      return profileCloudActionCopy.uk;
  }
};
