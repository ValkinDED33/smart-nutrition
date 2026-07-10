import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { selectMealItems } from "../meal/selectors";
import { setAdaptiveCalories } from "./profileSlice";
import { useProfileCloudAction } from "./useProfileCloudAction";
import {
  calculateAdaptiveCalorieTarget,
  calculateAverageDailyCalories,
} from "@domain/profile/adaptiveGoal";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const COMMON_KCAL_KEY = "common.kcal";

const adaptiveGoalSaveCopy = {
  uk: {
    saving: "Зберігаю ціль у хмарі...",
    saveError: "Не вдалося зберегти ціль. Спробуйте ще раз.",
  },
  pl: {
    saving: "Zapisuję cel w chmurze...",
    saveError: "Nie udało się zapisać celu. Spróbuj ponownie.",
  },
  en: {
    saving: "Saving goal to cloud...",
    saveError: "Could not save the goal. Try again.",
  },
} as const;

type AdaptiveGoalSaveCopy = (typeof adaptiveGoalSaveCopy)[AppLanguage];

const getAdaptiveGoalSaveCopy = (language: AppLanguage): AdaptiveGoalSaveCopy => {
  switch (language) {
    case "pl":
      return adaptiveGoalSaveCopy.pl;
    case "en":
      return adaptiveGoalSaveCopy.en;
    case "uk":
    default:
      return adaptiveGoalSaveCopy.uk;
  }
};

export const AdaptiveGoalCard = () => {
  const { appLanguage, t } = useLanguage();
  const copy = getAdaptiveGoalSaveCopy(appLanguage);
  const profileAction = useProfileCloudAction();
  const { maintenanceCalories, goal, adaptiveCalories, weightHistory, adaptiveMode } = useSelector(
    (state: RootState) => state.profile
  );
  const items = useSelector(selectMealItems);

  const averageIntake = calculateAverageDailyCalories(items);
  const weightChange = useMemo(() => {
    if (weightHistory.length < 2) return 0;
    const first = weightHistory[0]?.weight ?? 0;
    const last = weightHistory.at(-1)?.weight ?? 0;
    return last - first;
  }, [weightHistory]);

  const suggestedCalories = calculateAdaptiveCalorieTarget({
    maintenanceCalories,
    goal,
    averageIntake,
    weightChange,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={1.4}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("adaptive.title")}
        </Typography>
        <Typography color="text.secondary">{t("adaptive.subtitle")}</Typography>
        <Typography>
          {t("adaptive.current")}: {adaptiveCalories ?? maintenanceCalories} {t(COMMON_KCAL_KEY)}
        </Typography>
        <Typography>
          {t("adaptive.suggested")}: {suggestedCalories} {t(COMMON_KCAL_KEY)}
        </Typography>
        <Typography color="text.secondary">
          {t("adaptive.average")}: {averageIntake.toFixed(0)} {t(COMMON_KCAL_KEY)}
        </Typography>
        <Typography color="text.secondary">
          {adaptiveMode === "automatic"
            ? "Automatic mode keeps the target aligned with your trend."
            : "Manual mode waits for you to apply changes yourself."}
        </Typography>
        {profileAction.saving ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {copy.saving}
          </Alert>
        ) : null}
        {profileAction.hasError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }} onClose={profileAction.clearError}>
            {copy.saveError}
          </Alert>
        ) : null}
        <Button
          variant="contained"
          disabled={profileAction.saving}
          onClick={() => {
            void profileAction.runProfileAction(
              setAdaptiveCalories(suggestedCalories)
            ).catch(() => undefined);
          }}
          sx={{ alignSelf: "flex-start" }}
        >
          {t("adaptive.apply")}
        </Button>
      </Stack>
    </Paper>
  );
};
