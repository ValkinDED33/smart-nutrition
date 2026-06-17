import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { isAppLanguage } from "@shared/i18n";
import { useLanguage } from "@shared/language";

const ProfileLanguageAgent = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthInitialized = useSelector(
    (state: RootState) => state.auth.isInitialized
  );
  const profileLanguage = useSelector((state: RootState) => state.profile.languagePreference);
  const { appLanguage, setLanguage } = useLanguage();

  useEffect(() => {
    if (
      isAuthInitialized &&
      user &&
      isAppLanguage(profileLanguage) &&
      profileLanguage !== appLanguage
    ) {
      setLanguage(profileLanguage);
    }
  }, [appLanguage, isAuthInitialized, profileLanguage, setLanguage, user]);

  return null;
};

export default ProfileLanguageAgent;
