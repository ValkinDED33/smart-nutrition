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

  useEffect(() => {
    if (!user || syncMode !== "remote-cloud") {
      return;
    }

    const maybePull = async () => {
      if (pullInFlightRef.current || syncOutbox.pendingChanges > 0) {
        return;
      }

      pullInFlightRef.current = true;

      try {
        const meta = await getRemoteSnapshotMeta({ force: true });
        dispatch(setCloudMeta(meta));
        const remoteTimestamp = meta?.updatedAt ? Date.parse(meta.updatedAt) : 0;
        const localTimestamp = lastSyncedAt ? Date.parse(lastSyncedAt) : 0;

        if (!remoteTimestamp || remoteTimestamp <= localTimestamp) {
          return;
        }

        const snapshot = await pullRemoteAppSnapshot({ force: true });

        if (!snapshot) {
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
  }, [dispatch, lastSyncedAt, syncMode, syncOutbox.pendingChanges, user]);

  return null;
};

export default RemoteStatePullAgent;
