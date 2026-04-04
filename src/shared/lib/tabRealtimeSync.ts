import type { MealState } from "../../features/meal/mealSlice";
import type { ProfileState } from "../../features/profile/profileSlice";

const CHANNEL_NAME = "smart-nutrition-tab-sync";
const STORAGE_KEY = "smart-nutrition.tab-sync";
const TAB_ID =
  globalThis.crypto?.randomUUID?.() ??
  `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export interface TabRealtimeSnapshot {
  senderId: string;
  userId: string;
  updatedAt: string;
  profile: ProfileState;
  meal: MealState;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseSnapshot = (value: unknown): TabRealtimeSnapshot | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.senderId !== "string" ||
    typeof value.userId !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isRecord(value.profile) ||
    !isRecord(value.meal)
  ) {
    return null;
  }

  return value as unknown as TabRealtimeSnapshot;
};

const readStorageSnapshot = (raw: string | null) => {
  if (!raw) {
    return null;
  }

  try {
    return parseSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const broadcastTabSnapshot = ({
  userId,
  profile,
  meal,
}: {
  userId: string;
  profile: ProfileState;
  meal: MealState;
}) => {
  if (typeof window === "undefined") {
    return;
  }

  const snapshot: TabRealtimeSnapshot = {
    senderId: TAB_ID,
    userId,
    updatedAt: new Date().toISOString(),
    profile,
    meal,
  };

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(snapshot);
    channel.close();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const subscribeToTabSnapshots = (
  callback: (snapshot: TabRealtimeSnapshot) => void
) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleSnapshot = (rawSnapshot: unknown) => {
    const snapshot = parseSnapshot(rawSnapshot);

    if (!snapshot || snapshot.senderId === TAB_ID) {
      return;
    }

    callback(snapshot);
  };

  let channel: BroadcastChannel | null = null;

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (event) => {
      handleSnapshot(event.data);
    });
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    handleSnapshot(readStorageSnapshot(event.newValue));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.close();
    window.removeEventListener("storage", handleStorage);
  };
};
