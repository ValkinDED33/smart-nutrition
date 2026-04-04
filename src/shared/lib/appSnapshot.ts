import type { AppSnapshot, AppSnapshotMeta } from "../types/appSnapshot";

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
    backupEnabled: snapshot.backupEnabled,
    lastWriterDeviceId: snapshot.lastWriterDeviceId ?? null,
  };
};

export const buildAppSnapshot = ({
  profile,
  meal,
  meta,
}: {
  profile: unknown | null;
  meal: unknown | null;
  meta?: AppSnapshotMeta | null;
}): AppSnapshot => ({
  profile,
  meal,
  updatedAt: meta?.updatedAt ?? null,
  profileUpdatedAt: meta?.profileUpdatedAt ?? meta?.updatedAt ?? null,
  mealUpdatedAt: meta?.mealUpdatedAt ?? meta?.updatedAt ?? null,
  backupEnabled: meta?.backupEnabled,
  lastWriterDeviceId: meta?.lastWriterDeviceId ?? null,
});
