import profileReducer, {
  applyProfileTargets,
  recordMeasurementCheckIn,
  updatePersonalDetails,
  updateWeight,
  updateWomenHealth,
  type ProfileState,
} from "./profileSlice";

export type ProfileSavePatch = {
  targets: Parameters<typeof applyProfileTargets>[0];
  personalDetails: Parameters<typeof updatePersonalDetails>[0];
  womenHealth: Parameters<typeof updateWomenHealth>[0];
};

export const buildProfileStateAfterFullSave = (
  profile: ProfileState,
  patch: ProfileSavePatch
) =>
  profileReducer(
    profileReducer(
      profileReducer(profile, applyProfileTargets(patch.targets)),
      updatePersonalDetails(patch.personalDetails)
    ),
    updateWomenHealth(patch.womenHealth)
  );

export const buildProfileStateAfterWeightSave = (
  profile: ProfileState,
  weight: number
) => profileReducer(profile, updateWeight(weight));

export const buildProfileStateAfterMeasurementSave = (
  profile: ProfileState,
  measurements: Parameters<typeof recordMeasurementCheckIn>[0]
) => profileReducer(profile, recordMeasurementCheckIn(measurements));
