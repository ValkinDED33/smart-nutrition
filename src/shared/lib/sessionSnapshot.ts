import type { SyncOutboxMeta } from "./syncOutbox";

export const STALE_SYNC_OUTBOX_MS = 1000 * 60 * 60;

export type CloudSnapshotHydrationDecision =
  | { shouldApplyCloudSnapshot: true; shouldDiscardOutbox: false; reason: "no-pending-local-changes" }
  | { shouldApplyCloudSnapshot: true; shouldDiscardOutbox: true; reason: "stale-local-outbox" | "cloud-newer-than-local-outbox" }
  | { shouldApplyCloudSnapshot: false; shouldDiscardOutbox: false; reason: "fresh-local-outbox" };

const parseTime = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : null;
};

export const getSyncOutboxAgeMs = (
  syncOutbox: Pick<SyncOutboxMeta, "firstQueuedAt" | "lastQueuedAt">,
  now = Date.now()
) => {
  const queuedAt = parseTime(syncOutbox.firstQueuedAt) ?? parseTime(syncOutbox.lastQueuedAt);

  if (queuedAt === null) {
    return null;
  }

  return Math.max(0, now - queuedAt);
};

export const resolveCloudSnapshotHydration = ({
  cloudUpdatedAt,
  now = Date.now(),
  staleAfterMs = STALE_SYNC_OUTBOX_MS,
  syncOutbox,
}: {
  cloudUpdatedAt?: string | null;
  now?: number;
  staleAfterMs?: number;
  syncOutbox: SyncOutboxMeta;
}): CloudSnapshotHydrationDecision => {
  if (syncOutbox.pendingChanges <= 0) {
    return {
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: false,
      reason: "no-pending-local-changes",
    };
  }

  const outboxAgeMs = getSyncOutboxAgeMs(syncOutbox, now);

  if (outboxAgeMs === null || outboxAgeMs > staleAfterMs) {
    return {
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: true,
      reason: "stale-local-outbox",
    };
  }

  const cloudUpdatedAtMs = parseTime(cloudUpdatedAt);
  const localQueuedAtMs = parseTime(syncOutbox.firstQueuedAt) ?? parseTime(syncOutbox.lastQueuedAt);

  if (
    cloudUpdatedAtMs !== null &&
    localQueuedAtMs !== null &&
    cloudUpdatedAtMs > localQueuedAtMs
  ) {
    return {
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: true,
      reason: "cloud-newer-than-local-outbox",
    };
  }

  return {
    shouldApplyCloudSnapshot: false,
    shouldDiscardOutbox: false,
    reason: "fresh-local-outbox",
  };
};
