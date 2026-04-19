import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { buildAppSnapshot } from "../lib/appSnapshot";
import { writeCachedRemoteSnapshot } from "../lib/remoteStateCache";
import { replaceMealState } from "../../features/meal/mealSlice";
import { replaceProfileState } from "../../features/profile/profileSlice";
import { markSyncSuccess, setCloudMeta } from "../../features/auth/authSlice";
import {
  getRemoteAuthBaseUrl,
  getRemoteAuthToken,
  getRemoteSnapshotMeta,
  pullRemoteAppSnapshot,
} from "../api/auth";

const RemoteStatePullAgent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, syncMode, syncOutbox, lastSyncedAt } = useSelector(
    (state: RootState) => state.auth
  );
  const pullInFlightRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingChangesRef = useRef(syncOutbox.pendingChanges);
  const lastSyncedAtRef = useRef(lastSyncedAt);

  pendingChangesRef.current = syncOutbox.pendingChanges;
  lastSyncedAtRef.current = lastSyncedAt;

  useEffect(() => {
    if (!user || syncMode !== "remote-cloud") {
      return;
    }

    const maybePull = async () => {
      if (pullInFlightRef.current || pendingChangesRef.current > 0) {
        return;
      }

      pullInFlightRef.current = true;

      try {
        const meta = await getRemoteSnapshotMeta({ force: true });
        dispatch(setCloudMeta(meta));
        const remoteTimestamp = meta?.updatedAt ? Date.parse(meta.updatedAt) : 0;
        const localTimestamp = lastSyncedAtRef.current ? Date.parse(lastSyncedAtRef.current) : 0;

        if (
          pendingChangesRef.current > 0 ||
          !remoteTimestamp ||
          remoteTimestamp <= localTimestamp
        ) {
          return;
        }

        const snapshot = await pullRemoteAppSnapshot({ force: true });

        const latestLocalTimestamp = lastSyncedAtRef.current
          ? Date.parse(lastSyncedAtRef.current)
          : 0;
        const snapshotTimestamp = snapshot?.updatedAt ? Date.parse(snapshot.updatedAt) : 0;

        if (
          pendingChangesRef.current > 0 ||
          !snapshot ||
          (snapshotTimestamp > 0 && snapshotTimestamp <= latestLocalTimestamp)
        ) {
          return;
        }

        dispatch(replaceProfileState(snapshot.profile));
        dispatch(replaceMealState(snapshot.meal));
        writeCachedRemoteSnapshot(
          buildAppSnapshot({
            profile: snapshot.profile,
            meal: snapshot.meal,
            meta,
          })
        );
        dispatch(setCloudMeta(meta));
        dispatch(markSyncSuccess(snapshot.updatedAt ?? meta?.updatedAt ?? undefined));
      } finally {
        pullInFlightRef.current = false;
      }
    };

    void maybePull();
    window.addEventListener("online", maybePull);
    window.addEventListener("focus", maybePull);
    document.addEventListener("visibilitychange", maybePull);

    const baseUrl = getRemoteAuthBaseUrl();
    const token = getRemoteAuthToken();

    if (baseUrl && token) {
      const eventSource = new EventSource(
        `${baseUrl}/state/stream?token=${encodeURIComponent(token)}`
      );
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("state-updated", () => {
        void maybePull();
      });

      eventSource.addEventListener("connected", () => {
        void maybePull();
      });

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
      };
    }

    const intervalId = window.setInterval(() => {
      void maybePull();
    }, 45_000);

    return () => {
      window.removeEventListener("online", maybePull);
      window.removeEventListener("focus", maybePull);
      document.removeEventListener("visibilitychange", maybePull);
      window.clearInterval(intervalId);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [dispatch, syncMode, user]);

  return null;
};

export default RemoteStatePullAgent;
