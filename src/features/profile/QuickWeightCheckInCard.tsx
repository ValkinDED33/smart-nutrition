import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { calculateBmi, getBmiStatus } from "@domain/profile/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { createCompanionRewardAnalyticsPayload } from "@features/companion";
import { applyCompanionRewardInCloud } from "@features/companion/companionCloudSync";
import { SectionCard } from "@shared/ui";
import { buildProfileStateAfterWeightSave } from "./profileSaveModel";
import { useProfileCloudAction } from "./useProfileCloudAction";

const quickWeightCopy = {
  uk: {
    title: "Вага сьогодні",
    subtitle: "Швидко запишіть check-in без переходу в профіль.",
    current: "Поточна",
    target: "Ціль",
    toGoal: "До цілі",
    noTarget: "Ціль ще не задана",
    bmi: "BMI",
    lastCheckIn: "Останній запис",
    empty: "Після першого запису тут зʼявиться тренд.",
    input: "Вага (кг)",
    save: "Записати вагу",
    saving: "Зберігаю...",
    saved: "Вага додана в історію.",
    saveError: "Не вдалося зберегти вагу в хмарі.",
    invalid: "Введіть вагу від 30 до 300 кг.",
    underweight: "Нижче норми",
    normal: "Норма",
    overweight: "Вище норми",
    obesity: "Ожиріння",
    progress: "Прогрес до цілі",
  },
  pl: {
    title: "Waga dzisiaj",
    subtitle: "Dodaj szybki check-in bez przechodzenia do profilu.",
    current: "Aktualna",
    target: "Cel",
    toGoal: "Do celu",
    noTarget: "Cel nie jest ustawiony",
    bmi: "BMI",
    lastCheckIn: "Ostatni zapis",
    empty: "Po pierwszym zapisie pojawi się tu trend.",
    input: "Waga (kg)",
    save: "Zapisz wagę",
    saving: "Zapisuję...",
    saved: "Waga dodana do historii.",
    saveError: "Nie udało się zapisać wagi w chmurze.",
    invalid: "Wpisz wagę od 30 do 300 kg.",
    underweight: "Poniżej normy",
    normal: "Norma",
    overweight: "Powyżej normy",
    obesity: "Otyłość",
    progress: "Postęp do celu",
  },
  en: {
    title: "Weight today",
    subtitle: "Log a quick check-in without going to profile.",
    current: "Current",
    target: "Target",
    toGoal: "To goal",
    noTarget: "Goal is not set yet",
    bmi: "BMI",
    lastCheckIn: "Last entry",
    empty: "After the first entry, the trend will appear here.",
    input: "Weight (kg)",
    save: "Log weight",
    saving: "Saving...",
    saved: "Weight added to history.",
    saveError: "Could not save weight to cloud.",
    invalid: "Enter a weight from 30 to 300 kg.",
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obesity: "Obesity",
    progress: "Goal progress",
  },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const formatWeight = (value: number) => `${value.toFixed(1)} kg`;

const calculateGoalProgress = ({
  latestWeight,
  targetWeight,
  targetWeightStart,
}: {
  latestWeight: number;
  targetWeight: number | null;
  targetWeightStart: number | null;
}) => {
  if (!targetWeight || !latestWeight) {
    return null;
  }

  const start = targetWeightStart ?? latestWeight;
  const total = Math.abs(start - targetWeight);
  const done = Math.abs(start - latestWeight);
  const percent = total > 0 ? clamp((done / total) * 100, 0, 100) : 100;
  const remaining = Math.abs(latestWeight - targetWeight);

  return { percent, remaining };
};

export const QuickWeightCheckInCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const companion = useSelector((state: RootState) => state.companion);
  const profileAction = useProfileCloudAction();
  const { targetWeight, targetWeightStart, weightHistory } = profile;
  const { appLanguage } = useLanguage();
  const copy = quickWeightCopy[appLanguage];
  const latestEntry = weightHistory.at(-1);
  const latestWeight = latestEntry?.weight ?? user?.weight ?? 0;
  const [weightDraft, setWeightDraft] = useState(
    latestWeight > 0 ? latestWeight.toFixed(1) : ""
  );
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const nextWeight = Number(weightDraft);
  const isValidWeight =
    Number.isFinite(nextWeight) && nextWeight >= 30 && nextWeight <= 300;
  const bmi = calculateBmi(latestWeight, user?.height ?? 0);
  const bmiStatus = getBmiStatus(bmi);
  const lastCheckInLabel = latestEntry
    ? formatLocalDateKey(getLocalDateKey(latestEntry.date), appLanguage, {
        month: "short",
        day: "numeric",
      })
    : copy.empty;

  const goalProgress = calculateGoalProgress({
    latestWeight,
    targetWeight,
    targetWeightStart,
  });

  const adjustDraft = (delta: number) => {
    const base = isValidWeight ? nextWeight : latestWeight || 70;
    setWeightDraft(clamp(base + delta, 30, 300).toFixed(1));
    setSaved(false);
    setSaveError(null);
    profileAction.clearError();
  };

  const handleSave = async () => {
    if (!isValidWeight || !user) {
      setSaved(false);
      return;
    }

    const roundedWeight = Math.round(nextWeight * 10) / 10;
    const nextProfile = buildProfileStateAfterWeightSave(profile, roundedWeight);

    setSaved(false);
    setSaveError(null);
    profileAction.clearError();

    try {
      await profileAction.runProfileAndUserSave(
        {
          ...user,
          weight: roundedWeight,
        },
        nextProfile
      );
      let companionRewardPayload = {};

      try {
        await applyCompanionRewardInCloud(
          dispatch,
          { companion },
          "weight_updated"
        );
        companionRewardPayload =
          createCompanionRewardAnalyticsPayload("weight_updated");
      } catch (rewardError) {
        setSaveError(
          rewardError instanceof Error
            ? `Weight saved, but companion progress could not sync: ${rewardError.message}`
            : "Weight saved, but companion progress could not sync."
        );
      }
      trackRuntimeEvent("weight_updated", {
        weightKg: roundedWeight,
        previousWeightKg: latestWeight || null,
        targetWeightKg: targetWeight,
        hasTarget: Boolean(targetWeight),
        ...companionRewardPayload,
      });
      setWeightDraft(roundedWeight.toFixed(1));
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : copy.saveError);
    }
  };

  return (
    <SectionCard>
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={`${copy.current}: ${latestWeight ? formatWeight(latestWeight) : "-"}`}
            color="primary"
          />
          <Chip
            label={
              targetWeight
                ? `${copy.target}: ${formatWeight(targetWeight)}`
                : copy.noTarget
            }
            variant="outlined"
          />
          <Chip
            label={`${copy.bmi}: ${bmi > 0 ? bmi.toFixed(1) : "-"} • ${
              copy[bmiStatus]
            }`}
            color={bmiStatus === "normal" ? "success" : "default"}
            variant={bmiStatus === "normal" ? "filled" : "outlined"}
          />
        </Stack>

        {goalProgress && (
          <Stack spacing={0.8}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
            >
              <Typography sx={{ fontWeight: 700 }}>{copy.progress}</Typography>
              <Typography color="text.secondary">
                {copy.toGoal}: {formatWeight(goalProgress.remaining)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={goalProgress.percent}
              sx={{ height: 10, borderRadius: 999 }}
            />
          </Stack>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
            gap: 1.2,
            alignItems: "start",
          }}
        >
          <TextField
            fullWidth
            type="text"
            label={copy.input}
            value={weightDraft}
            onChange={(event) => {
              setWeightDraft(event.target.value);
              setSaved(false);
              setSaveError(null);
              profileAction.clearError();
            }}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            error={weightDraft.length > 0 && !isValidWeight}
            helperText={
              weightDraft.length > 0 && !isValidWeight
                ? copy.invalid
                : `${copy.lastCheckIn}: ${lastCheckInLabel}`
            }
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                enterKeyHint: "done",
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => adjustDraft(-0.5)}>
              -0.5
            </Button>
            <Button variant="outlined" onClick={() => adjustDraft(0.5)}>
              +0.5
            </Button>
          </Stack>
        </Box>

        {saved && <Alert severity="success">{copy.saved}</Alert>}
        {(saveError || profileAction.error) && (
          <Alert severity="error">{saveError ?? profileAction.error}</Alert>
        )}

        <Button
          variant="contained"
          disabled={!isValidWeight || profileAction.saving}
          onClick={handleSave}
          sx={{
            alignSelf: "flex-start",
            px: 3,
            py: 1.1,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
            background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
          }}
        >
          {profileAction.saving ? copy.saving : copy.save}
        </Button>
      </Stack>
    </SectionCard>
  );
};

export default QuickWeightCheckInCard;
