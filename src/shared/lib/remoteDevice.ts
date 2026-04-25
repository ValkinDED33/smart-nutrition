import {
  getClientStorageItem,
  setClientStorageItem,
} from "./clientPersistence";

const REMOTE_DEVICE_ID_KEY = "smart-nutrition.remote-device-id";

export type RemoteWriterOwnership = "current-device" | "other-device" | "unknown";

const createDeviceId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getRemoteDeviceId = () => {
  const existing = getClientStorageItem(REMOTE_DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextValue = createDeviceId();
  setClientStorageItem(REMOTE_DEVICE_ID_KEY, nextValue);
  return nextValue;
};

export const resolveRemoteWriterOwnership = (
  currentDeviceId: string | null,
  lastWriterDeviceId: string | null | undefined
): RemoteWriterOwnership => {
  if (!lastWriterDeviceId) {
    return "unknown";
  }

  return currentDeviceId && currentDeviceId === lastWriterDeviceId
    ? "current-device"
    : "other-device";
};

export const formatRemoteDeviceSuffix = (deviceId: string | null | undefined) =>
  deviceId ? deviceId.slice(-6).toUpperCase() : null;
