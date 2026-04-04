import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { useLanguage } from "../language";

const ProfileLanguageAgent = () => {
  const profileLanguage = useSelector((state: RootState) => state.profile.languagePreference);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (profileLanguage !== language) {
      setLanguage(profileLanguage);
    }
  }, [language, profileLanguage, setLanguage]);

  return null;
};

export default ProfileLanguageAgent;
