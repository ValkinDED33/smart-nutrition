import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { flushSyncOutbox } from "../../features/auth/authSlice";

const SyncOutboxAgent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, syncMode, syncOutbox, syncError } = useSelector(
    (state: RootState) => state.auth
  );
  const hasConflict = Boolean(syncError?.includes("another device"));

  useEffect(() => {
    if (
      !user ||
      syncMode !== "remote-cloud" ||
      syncOutbox.pendingChanges === 0 ||
      hasConflict
    ) {
      return;
    }

    const attemptFlush = () => {
      void dispatch(flushSyncOutbox());
    };

    attemptFlush();
    window.addEventListener("online", attemptFlush);

    const intervalId = window.setInterval(() => {
      attemptFlush();
    }, 30_000);

    return () => {
      window.removeEventListener("online", attemptFlush);
      window.clearInterval(intervalId);
    };
  }, [dispatch, hasConflict, syncMode, syncOutbox.pendingChanges, user]);

  return null;
};

export default SyncOutboxAgent;
