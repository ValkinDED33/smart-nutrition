import { describe, expect, it } from "vitest";
import { resolveCloudSnapshotHydration } from "./sessionSnapshot";
import type { SyncOutboxMeta } from "./syncOutbox";

const emptyOutbox: SyncOutboxMeta = {
  pendingChanges: 0,
  firstQueuedAt: null,
  lastQueuedAt: null,
  lastError: null,
};

describe("sessionSnapshot sync recovery policy", () => {
  it("applies cloud snapshot when there are no pending local changes", () => {
    expect(
      resolveCloudSnapshotHydration({
        syncOutbox: emptyOutbox,
      })
    ).toMatchObject({
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: false,
      reason: "no-pending-local-changes",
    });
  });

  it("keeps fresh local pending changes available for retry", () => {
    expect(
      resolveCloudSnapshotHydration({
        now: Date.parse("2026-06-20T10:05:00.000Z"),
        syncOutbox: {
          pendingChanges: 1,
          firstQueuedAt: "2026-06-20T10:00:00.000Z",
          lastQueuedAt: "2026-06-20T10:00:00.000Z",
          lastError: "Network error",
        },
      })
    ).toMatchObject({
      shouldApplyCloudSnapshot: false,
      shouldDiscardOutbox: false,
      reason: "fresh-local-outbox",
    });
  });

  it("uses cloud snapshot when local pending changes are stale", () => {
    expect(
      resolveCloudSnapshotHydration({
        now: Date.parse("2026-06-20T12:01:00.000Z"),
        syncOutbox: {
          pendingChanges: 1,
          firstQueuedAt: "2026-06-20T10:00:00.000Z",
          lastQueuedAt: "2026-06-20T10:00:00.000Z",
          lastError: "Network error",
        },
      })
    ).toMatchObject({
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: true,
      reason: "stale-local-outbox",
    });
  });

  it("uses cloud snapshot when cloud is newer than queued local changes", () => {
    expect(
      resolveCloudSnapshotHydration({
        cloudUpdatedAt: "2026-06-20T10:10:00.000Z",
        now: Date.parse("2026-06-20T10:15:00.000Z"),
        syncOutbox: {
          pendingChanges: 1,
          firstQueuedAt: "2026-06-20T10:00:00.000Z",
          lastQueuedAt: "2026-06-20T10:00:00.000Z",
          lastError: "Network error",
        },
      })
    ).toMatchObject({
      shouldApplyCloudSnapshot: true,
      shouldDiscardOutbox: true,
      reason: "cloud-newer-than-local-outbox",
    });
  });
});
