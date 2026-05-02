import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { calculateBmi, getBmiStatus } from "../../shared/lib/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";
import { updateWeight } from "./profileSlice";

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
    saved: "Вага додана в історію.",
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
    saved: "Waga dodana do historii.",
    invalid: "Wpisz wagę od 30 do 300 kg.",
    underweight: "Poniżej normy",
    normal: "Norma",
    overweight: "Powyżej normy",
    obesity: "Otyłość",
    progress: "Postęp do celu",
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
  const { targetWeight, targetWeightStart, weightHistory } = useSelector(
    (state: RootState) => state.profile
  );
  const { language } = useLanguage();
  const copy = quickWeightCopy[language];
  const latestEntry = weightHistory.at(-1);
  const latestWeight = latestEntry?.weight ?? user?.weight ?? 0;
  const [weightDraft, setWeightDraft] = useState(
    latestWeight > 0 ? latestWeight.toFixed(1) : ""
  );
  const [saved, setSaved] = useState(false);

  const nextWeight = Number(weightDraft);
  const isValidWeight =
    Number.isFinite(nextWeight) && nextWeight >= 30 && nextWeight <= 300;
  const bmi = calculateBmi(latestWeight, user?.height ?? 0);
  const bmiStatus = getBmiStatus(bmi);
  const lastCheckInLabel = latestEntry
    ? formatLocalDateKey(getLocalDateKey(latestEntry.date), language, {
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
  };

  const handleSave = () => {
    if (!isValidWeight) {
      setSaved(false);
      return;
    }

    dispatch(updateWeight(Math.round(nextWeight * 10) / 10));
    setWeightDraft(nextWeight.toFixed(1));
    setSaved(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
            type="number"
            label={copy.input}
            value={weightDraft}
            onChange={(event) => {
              setWeightDraft(event.target.value);
              setSaved(false);
            }}
            error={weightDraft.length > 0 && !isValidWeight}
            helperText={
              weightDraft.length > 0 && !isValidWeight
                ? copy.invalid
                : `${copy.lastCheckIn}: ${lastCheckInLabel}`
            }
            inputProps={{ min: 30, max: 300, step: 0.1 }}
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

        <Button
          variant="contained"
          disabled={!isValidWeight}
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
          {copy.save}
        </Button>
      </Stack>
    </Paper>
  );
};

export default QuickWeightCheckInCard;
