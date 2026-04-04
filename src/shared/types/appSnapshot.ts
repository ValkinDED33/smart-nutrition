export interface AppSnapshotMeta {
  updatedAt?: string | null;
  profileUpdatedAt?: string | null;
  mealUpdatedAt?: string | null;
  backupEnabled?: boolean;
  lastWriterDeviceId?: string | null;
}

export interface AppSnapshot extends AppSnapshotMeta {
  profile: unknown | null;
  meal: unknown | null;
}
