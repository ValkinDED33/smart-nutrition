import waterReducer, {
  incrementWater,
  markWaterReminderShown,
  setWaterConsumed,
  setWaterGlassSize,
  setWaterReminders,
  setWaterTarget,
  syncWaterDay,
  syncWaterTargetFromWeight,
  type WaterState,
} from "./waterSlice";

export const buildWaterStateAfterSetAmount = (
  water: WaterState,
  amountMl: number
) => waterReducer(water, setWaterConsumed(amountMl));

export const buildWaterStateAfterIncrement = (
  water: WaterState,
  amountMl: number
) => waterReducer(water, incrementWater(amountMl));

export const buildWaterStateAfterTargetChange = (
  water: WaterState,
  targetMl: number
) => waterReducer(water, setWaterTarget(targetMl));

export const buildWaterStateAfterGlassSizeChange = (
  water: WaterState,
  glassSizeMl: number
) => waterReducer(water, setWaterGlassSize(glassSizeMl));

export const buildWaterStateAfterReminderChange = (
  water: WaterState,
  patch: Parameters<typeof setWaterReminders>[0]
) => waterReducer(water, setWaterReminders(patch));

export const buildWaterStateAfterReminderShown = (
  water: WaterState,
  shownAt?: string
) => waterReducer(water, markWaterReminderShown(shownAt));

export const buildWaterStateAfterDaySync = (water: WaterState) =>
  waterReducer(water, syncWaterDay());

export const buildWaterStateAfterWeightTargetSync = (
  water: WaterState,
  weight: number | null | undefined
) => waterReducer(water, syncWaterTargetFromWeight(weight));
