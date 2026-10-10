import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { selectMealItems } from "../meal/selectors";
import { setAdaptiveCalories } from "./profileSlice";
import { getProfileCloudActionCopy } from "./profileCloudActionCopy";
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
    automaticMode:
      "Автоматичний режим м'яко підлаштовує ціль під ваш реальний тренд.",
    manualMode:
      "Ручний режим залишає рішення за вами: зміни застосовуються тільки після підтвердження.",
  },
  pl: {
    saving: "Zapisuję cel w chmurze...",
    saveError: "Nie udało się zapisać celu. Spróbuj ponownie.",
    automaticMode:
      "Tryb automatyczny delikatnie dopasowuje cel do Twojego realnego trendu.",
    manualMode:
      "Tryb ręczny zostawia decyzję Tobie: zmiany są stosowane dopiero po potwierdzeniu.",
  },
  en: {
    saving: "Saving goal to cloud...",
    saveError: "Could not save the goal. Try again.",
    automaticMode:
      "Automatic mode gently keeps the target aligned with your real trend.",
    manualMode:
      "Manual mode leaves the decision to you: changes apply only after confirmation.",
  },
} as const;

type AdaptiveGoalSaveCopy = (typeof adaptiveGoalSaveCopy)[AppLanguage];

const getAdaptiveGoalSaveCopy = (
  language: AppLanguage,
): AdaptiveGoalSaveCopy => {
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
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const {
    maintenanceCalories,
    goal,
    adaptiveCalories,
    weightHistory,
    adaptiveMode,
  } = useSelector((state: RootState) => state.profile);
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
        p: { xs: 1.35, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={{ xs: 1, md: 1.4 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("adaptive.title")}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {t("adaptive.subtitle")}
        </Typography>
        <Stack
          data-adaptive-goal-mobile-metric-rail="true"
          direction="row"
          spacing={1}
          sx={{
            overflowX: { xs: "auto", sm: "visible" },
            mx: { xs: -1, sm: 0 },
            px: { xs: 1, sm: 0 },
            pb: { xs: 0.5, sm: 0 },
            scrollSnapType: { xs: "x proximity", sm: "none" },
          }}
        >
          {[
            `${t("adaptive.current")}: ${adaptiveCalories ?? maintenanceCalories} ${t(COMMON_KCAL_KEY)}`,
            `${t("adaptive.suggested")}: ${suggestedCalories} ${t(COMMON_KCAL_KEY)}`,
            `${t("adaptive.average")}: ${averageIntake.toFixed(0)} ${t(COMMON_KCAL_KEY)}`,
          ].map((metric) => (
            <Paper
              key={metric}
              variant="outlined"
              sx={{
                p: 1.1,
                minWidth: { xs: 190, sm: 0 },
                borderRadius: 1,
                scrollSnapAlign: { xs: "start", sm: "none" },
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>{metric}</Typography>
            </Paper>
          ))}
        </Stack>
        <Typography
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {adaptiveMode === "automatic" ? copy.automaticMode : copy.manualMode}
        </Typography>
        {profileAction.saving ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {copy.saving}
          </Alert>
        ) : null}
        {profileAction.hasError ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 3 }}
            onClose={profileAction.clearError}
          >
            {copy.saveError}
          </Alert>
        ) : null}
        <Button
          variant="contained"
          disabled={profileAction.saving}
          onClick={() => {
            void profileAction
              .runProfileAction(setAdaptiveCalories(suggestedCalories))
              .catch(() => undefined);
          }}
          sx={{
            alignSelf: "flex-start",
            textTransform: "none",
            fontWeight: 800,
          }}
        >
          {t("adaptive.apply")}
        </Button>
      </Stack>
    </Paper>
  );
};
