import type { AppSnapshot, AppSnapshotMeta } from "@shared/types/appSnapshot";

export const getSnapshotMetaFromSnapshot = (
  snapshot: AppSnapshot | null | undefined
): AppSnapshotMeta | null => {
  if (!snapshot) {
    return null;
  }

  return {
    updatedAt: snapshot.updatedAt ?? null,
    profileUpdatedAt: snapshot.profileUpdatedAt ?? null,
    mealUpdatedAt: snapshot.mealUpdatedAt ?? null,
    waterUpdatedAt: snapshot.waterUpdatedAt ?? null,
    backupEnabled: snapshot.backupEnabled,
    lastWriterDeviceId: snapshot.lastWriterDeviceId ?? null,
  };
};

export const buildAppSnapshot = ({
  profile,
  meal,
  water,
  fridge,
  community,
  companion,
  meta,
}: {
  profile: unknown | null;
  meal: unknown | null;
  water: unknown | null;
  fridge: unknown | null;
  community: unknown | null;
  companion?: unknown | null;
  meta?: AppSnapshotMeta | null;
}): AppSnapshot => ({
  profile,
  meal,
  water,
  fridge,
  community,
  companion: companion ?? null,
  updatedAt: meta?.updatedAt ?? null,
  profileUpdatedAt: meta?.profileUpdatedAt ?? meta?.updatedAt ?? null,
  mealUpdatedAt: meta?.mealUpdatedAt ?? meta?.updatedAt ?? null,
  waterUpdatedAt: meta?.waterUpdatedAt ?? meta?.updatedAt ?? null,
  backupEnabled: meta?.backupEnabled,
  lastWriterDeviceId: meta?.lastWriterDeviceId ?? null,
});
