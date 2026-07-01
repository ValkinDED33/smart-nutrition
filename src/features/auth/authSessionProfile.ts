import type { User } from "@domain/user/types";
import { calculateProfileTargets } from "@domain/profile/profileTargets";
import type { AppSnapshot } from "@shared/types/appSnapshot";
import type { AppLanguage } from "@shared/types/i18n";
import profileReducer, {
  applyProfileTargets,
  normalizeProfileState,
  setProfileLanguage,
  type ProfileState,
} from "@features/profile/profileSlice";

export const buildProfileBootstrapState = (user: User): ProfileState => {
  const profileBootstrap = {
    age: user.age,
    weight: user.weight,
    height: user.height,
    gender: user.gender,
    activity: user.activity,
    goal: user.goal,
  };
  const { maintenanceCalories, targetCalories } =
    calculateProfileTargets(profileBootstrap);

  return profileReducer(
    normalizeProfileState({}),
    applyProfileTargets({
      goal: profileBootstrap.goal,
      weight: profileBootstrap.weight,
      maintenanceCalories,
      targetCalories,
      targetWeight: null,
      dietStyle: "balanced",
      allergies: [],
      excludedIngredients: [],
      adaptiveMode: "automatic",
    })
  );
};

export const buildSessionProfileState = ({
  user,
  snapshot,
  language,
}: {
  user: User;
  snapshot?: AppSnapshot | null;
  language: AppLanguage;
}) => {
  const baseProfile =
    snapshot?.profile === null || snapshot?.profile === undefined
      ? buildProfileBootstrapState(user)
      : normalizeProfileState(snapshot.profile);

  return profileReducer(baseProfile, setProfileLanguage(language));
};
