import type { MealState } from "../../features/meal/mealSlice";
import type { ProfileState } from "../../features/profile/profileSlice";
import type { WaterState } from "../../features/water/waterSlice";

const CHANNEL_NAME = "smart-nutrition-tab-sync";
const TAB_ID =
  globalThis.crypto?.randomUUID?.() ??
  `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export interface TabRealtimeSnapshot {
  senderId: string;
  userId: string;
  updatedAt: string;
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
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
    !isRecord(value.meal) ||
    !isRecord(value.water)
  ) {
    return null;
  }

  return value as unknown as TabRealtimeSnapshot;
};

export const broadcastTabSnapshot = ({
  userId,
  profile,
  meal,
  water,
}: {
  userId: string;
  profile: ProfileState;
  meal: MealState;
  water: WaterState;
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
    water,
  };

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(snapshot);
    channel.close();
  }
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

  return () => {
    channel?.close();
  };
};
