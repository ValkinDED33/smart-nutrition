import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { replaceMealState } from "../../features/meal/mealSlice";
import { replaceProfileState } from "../../features/profile/profileSlice";
import { replaceWaterState } from "../../features/water/waterSlice";
import { subscribeToTabSnapshots } from "../lib/tabRealtimeSync";

const LocalRealtimeSyncAgent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const latestAppliedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeToTabSnapshots((snapshot) => {
      if (snapshot.userId !== user.id) {
        return;
      }

      const currentAppliedAt = latestAppliedAtRef.current
        ? Date.parse(latestAppliedAtRef.current)
        : 0;
      const nextAppliedAt = Date.parse(snapshot.updatedAt);

      if (nextAppliedAt <= currentAppliedAt) {
        return;
      }

      latestAppliedAtRef.current = snapshot.updatedAt;
      dispatch(replaceProfileState(snapshot.profile));
      dispatch(replaceMealState(snapshot.meal));
      dispatch(replaceWaterState(snapshot.water));
    });
  }, [dispatch, user]);

  return null;
};

export default LocalRealtimeSyncAgent;
