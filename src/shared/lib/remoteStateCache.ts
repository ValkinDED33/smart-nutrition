import type { AppSnapshot, AppSnapshotMeta } from "../types/appSnapshot";
import { getSnapshotMetaFromSnapshot } from "./appSnapshot";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "./clientPersistence";

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface CachedEnvelope<T> {
  savedAt: number;
  value: T;
}

const SNAPSHOT_CACHE_KEY = "smart-nutrition.remote-snapshot-cache";
const META_CACHE_KEY = "smart-nutrition.remote-meta-cache";
const META_CACHE_TTL_MS = 15_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getDefaultStorage = (): StorageLike => ({
  getItem: getClientStorageItem,
  setItem: setClientStorageItem,
  removeItem: removeClientStorageItem,
});

const parseEnvelope = <T,>(raw: string | null): CachedEnvelope<T> | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed) || typeof parsed.savedAt !== "number" || !("value" in parsed)) {
      return null;
    }

    return {
      savedAt: parsed.savedAt,
      value: parsed.value as T,
    };
  } catch {
    return null;
  }
};

const createCacheApi = (storage: StorageLike | null) => {
  const read = <T,>(key: string): CachedEnvelope<T> | null => {
    if (!storage) {
      return null;
    }

    return parseEnvelope<T>(storage.getItem(key));
  };

  const write = <T,>(key: string, value: T) => {
    if (!storage) {
      return;
    }

    const nextValue: CachedEnvelope<T> = {
      savedAt: Date.now(),
      value,
    };

    storage.setItem(key, JSON.stringify(nextValue));
  };

  return {
    readSnapshot: () => read<AppSnapshot>(SNAPSHOT_CACHE_KEY)?.value ?? null,
    writeSnapshot: (snapshot: AppSnapshot) => {
      write(SNAPSHOT_CACHE_KEY, snapshot);
      write(META_CACHE_KEY, getSnapshotMetaFromSnapshot(snapshot));
    },
    readMeta: ({ allowStale = false }: { allowStale?: boolean } = {}) => {
      const envelope = read<AppSnapshotMeta>(META_CACHE_KEY);

      if (!envelope) {
        return null;
      }

      if (!allowStale && Date.now() - envelope.savedAt > META_CACHE_TTL_MS) {
        return null;
      }

      return envelope.value;
    },
    writeMeta: (meta: AppSnapshotMeta) => {
      write(META_CACHE_KEY, meta);
    },
    clear: () => {
      storage?.removeItem(SNAPSHOT_CACHE_KEY);
      storage?.removeItem(META_CACHE_KEY);
    },
  };
};

export const createRemoteStateCache = (storage: StorageLike | null = getDefaultStorage()) =>
  createCacheApi(storage);

const defaultRemoteStateCache = createRemoteStateCache();

export const readCachedRemoteSnapshot = () => defaultRemoteStateCache.readSnapshot();

export const writeCachedRemoteSnapshot = (snapshot: AppSnapshot) =>
  defaultRemoteStateCache.writeSnapshot(snapshot);

export const readCachedRemoteMeta = (options?: { allowStale?: boolean }) =>
  defaultRemoteStateCache.readMeta(options);

export const writeCachedRemoteMeta = (meta: AppSnapshotMeta) =>
  defaultRemoteStateCache.writeMeta(meta);

export const clearCachedRemoteState = () => defaultRemoteStateCache.clear();
