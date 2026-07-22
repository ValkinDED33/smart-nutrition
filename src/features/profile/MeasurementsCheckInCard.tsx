import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { RootState } from "../../app/store";
import { getDaysSince } from "@domain/profile/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { buildProfileStateAfterMeasurementSave } from "./profileSaveModel";
import { getProfileCloudActionCopy } from "./profileCloudActionCopy";
import { useProfileCloudAction } from "./useProfileCloudAction";

type FormData = {
  weight: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  chest?: number;
};

const checkInCopy = {
  uk: {
    title: "Вага і заміри",
    subtitle:
      "Оновлюйте вагу та об'єми щотижня, щоб бачити реальний прогрес.",
    dueNow: "Час оновити вагу і заміри.",
    nextInDays: "Наступний check-in через {days} дн.",
    lastCheckIn: "Останній check-in",
    submit: "Зберегти check-in",
    saving: "Зберігаю...",
    waist: "Талія (см)",
    abdomen: "Живіт (см)",
    hip: "Стегна (см)",
    chest: "Груди (см)",
    history: "Останні записи",
    empty: "Ще немає weekly check-in.",
    saveError: "Не вдалося зберегти заміри.",
    saved: "Заміри збережено.",
  },
  pl: {
    title: "Waga i pomiary",
    subtitle:
      "Aktualizuj wagę i obwody co tydzień, aby widzieć realny postęp.",
    dueNow: "To dobry moment, aby zaktualizować wagę i pomiary.",
    nextInDays: "Kolejny check-in za {days} dni.",
    lastCheckIn: "Ostatni check-in",
    submit: "Zapisz check-in",
    saving: "Zapisuję...",
    waist: "Talia (cm)",
    abdomen: "Brzuch (cm)",
    hip: "Biodra (cm)",
    chest: "Klatka (cm)",
    history: "Ostatnie wpisy",
    empty: "Brak zapisanych weekly check-in.",
    saveError: "Nie udało się zapisać pomiarów.",
    saved: "Pomiary zostały zapisane.",
  },
  en: {
    title: "Weight and measurements",
    subtitle:
      "Update weight and body measurements weekly to see real progress.",
    dueNow: "Time to update weight and measurements.",
    nextInDays: "Next check-in in {days} days.",
    lastCheckIn: "Last check-in",
    submit: "Save check-in",
    saving: "Saving...",
    waist: "Waist (cm)",
    abdomen: "Abdomen (cm)",
    hip: "Hips (cm)",
    chest: "Chest (cm)",
    history: "Recent entries",
    empty: "No weekly check-ins yet.",
    saveError: "Could not save measurements.",
    saved: "Measurements saved.",
  },
} as const;

type CheckInCopy = (typeof checkInCopy)[AppLanguage];

const getCheckInCopy = (language: AppLanguage): CheckInCopy => {
  switch (language) {
    case "pl":
      return checkInCopy.pl;
    case "en":
      return checkInCopy.en;
    case "uk":
    default:
      return checkInCopy.uk;
  }
};

const createMeasurementFormValues = (
  user: RootState["auth"]["user"]
): FormData => ({
  weight: user?.weight ?? 70,
  waist: user?.measurements?.waist,
  abdomen: user?.measurements?.abdomen,
  hip: user?.measurements?.hip,
  chest: user?.measurements?.chest,
});

export const MeasurementsCheckInCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const { measurementHistory, weeklyCheckIn } = profile;
  const { t, appLanguage } = useLanguage();
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const copy = getCheckInCopy(appLanguage);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        weight: z.number().min(30, t("validation.weightMin")),
        waist: z.number().min(30).max(250).optional(),
        abdomen: z.number().min(30).max(250).optional(),
        hip: z.number().min(30).max(250).optional(),
        chest: z.number().min(30).max(250).optional(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: createMeasurementFormValues(user),
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    reset(createMeasurementFormValues(user));
  }, [reset, user]);

  if (!user) {
    return null;
  }

  const daysSinceLastCheckIn = getDaysSince(weeklyCheckIn.lastRecordedAt);
  const daysUntilNextCheckIn = Math.max(
    weeklyCheckIn.remindIntervalDays - daysSinceLastCheckIn,
    0
  );
  const recentEntries = measurementHistory.slice(0, 4);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setSuccessMessage(null);
    profileAction.clearError();

    try {
      const measurementPayload = {
        weight: data.weight,
        waist: data.waist,
        abdomen: data.abdomen,
        hip: data.hip,
        chest: data.chest,
      };
      const nextProfile = buildProfileStateAfterMeasurementSave(
        profile,
        measurementPayload
      );
      await profileAction.runProfileAndUserSave(
        {
          ...user,
          weight: data.weight,
          measurements: {
            waist: data.waist,
            abdomen: data.abdomen,
            hip: data.hip,
            chest: data.chest,
          },
        },
        nextProfile
      );
      setSuccessMessage(copy.saved);
    } catch {
      setServerError(copy.saveError);
    }
  };

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
      <Stack spacing={2.2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {(serverError || profileAction.error) && (
          <Alert severity="error">{serverError ?? profileAction.error}</Alert>
        )}
        <Alert severity={daysSinceLastCheckIn >= weeklyCheckIn.remindIntervalDays ? "info" : "success"}>
          {daysSinceLastCheckIn >= weeklyCheckIn.remindIntervalDays
            ? copy.dueNow
            : copy.nextInDays.replace("{days}", String(daysUntilNextCheckIn))}
        </Alert>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={
              weeklyCheckIn.lastRecordedAt
                ? `${copy.lastCheckIn}: ${formatLocalDateKey(
                    getLocalDateKey(weeklyCheckIn.lastRecordedAt),
                    appLanguage,
                    { month: "short", day: "numeric" }
                  )}`
                : copy.dueNow
            }
            variant="outlined"
          />
        </Stack>

        <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              type="text"
              fullWidth
              label={t("form.weight")}
              {...register("weight", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.weight)}
              helperText={errors.weight?.message}
              onFocus={(event) => selectInputValue(event.target)}
              onClick={(event) => selectInputValue(event.currentTarget)}
              slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            />
            <TextField
              type="text"
              fullWidth
              label={copy.waist}
              {...register("waist", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.waist)}
              helperText={errors.waist?.message}
              onFocus={(event) => selectInputValue(event.target)}
              onClick={(event) => selectInputValue(event.currentTarget)}
              slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            />
            <TextField
              type="text"
              fullWidth
              label={copy.abdomen}
              {...register("abdomen", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.abdomen)}
              helperText={errors.abdomen?.message}
              onFocus={(event) => selectInputValue(event.target)}
              onClick={(event) => selectInputValue(event.currentTarget)}
              slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              type="text"
              fullWidth
              label={copy.hip}
              {...register("hip", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.hip)}
              helperText={errors.hip?.message}
              onFocus={(event) => selectInputValue(event.target)}
              onClick={(event) => selectInputValue(event.currentTarget)}
              slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            />
            <TextField
              type="text"
              fullWidth
              label={copy.chest}
              {...register("chest", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.chest)}
              helperText={errors.chest?.message}
              onFocus={(event) => selectInputValue(event.target)}
              onClick={(event) => selectInputValue(event.currentTarget)}
              slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "done" } }}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            disabled={profileAction.saving}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {profileAction.saving ? copy.saving : copy.submit}
          </Button>
        </Stack>

        <Stack spacing={1.2}>
          <Typography sx={{ fontWeight: 800 }}>{copy.history}</Typography>
          {recentEntries.length === 0 ? (
            <Typography color="text.secondary">{copy.empty}</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              {recentEntries.map((entry) => (
                <Paper key={`${entry.date}-${entry.weight}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.7}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {formatLocalDateKey(getLocalDateKey(entry.date), appLanguage, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                    <Typography color="text.secondary">
                      {t("form.weight")}: {entry.weight.toFixed(1)} {t("common.kg")}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {[
                        entry.waist ? `${copy.waist}: ${entry.waist}` : null,
                        entry.abdomen ? `${copy.abdomen}: ${entry.abdomen}` : null,
                        entry.hip ? `${copy.hip}: ${entry.hip}` : null,
                        entry.chest ? `${copy.chest}: ${entry.chest}` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "-"}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
