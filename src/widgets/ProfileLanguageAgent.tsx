import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { useLanguage } from "@shared/language";

const ProfileLanguageAgent = () => {
  const profileLanguage = useSelector((state: RootState) => state.profile.languagePreference);
  const { appLanguage, setLanguage } = useLanguage();

  useEffect(() => {
    if (profileLanguage !== appLanguage) {
      setLanguage(profileLanguage);
    }
  }, [appLanguage, profileLanguage, setLanguage]);

  return null;
};

export default ProfileLanguageAgent;
