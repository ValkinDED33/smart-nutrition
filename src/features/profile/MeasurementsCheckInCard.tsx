import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import type { AppDispatch, RootState } from "../../app/store";
import { setUser } from "../auth/authSlice";
import { updateStoredProfile } from "../../shared/api/auth";
import { getDaysSince } from "../../shared/lib/bodyMetrics";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";
import { recordMeasurementCheckIn } from "./profileSlice";

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
} as const;

export const MeasurementsCheckInCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { measurementHistory, weeklyCheckIn } = useSelector(
    (state: RootState) => state.profile
  );
  const { t, language } = useLanguage();
  const copy = checkInCopy[language];
  const [submitting, setSubmitting] = useState(false);
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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      weight: user?.weight ?? 70,
      waist: user?.measurements?.waist,
      abdomen: user?.measurements?.abdomen,
      hip: user?.measurements?.hip,
      chest: user?.measurements?.chest,
    },
  });

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
    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateStoredProfile({
        ...user,
        weight: data.weight,
        measurements: {
          waist: data.waist,
          abdomen: data.abdomen,
          hip: data.hip,
          chest: data.chest,
        },
      });

      dispatch(setUser(updatedUser));
      dispatch(
        recordMeasurementCheckIn({
          weight: data.weight,
          waist: data.waist,
          abdomen: data.abdomen,
          hip: data.hip,
          chest: data.chest,
        })
      );
      setSuccessMessage(copy.saved);
    } catch {
      setServerError(copy.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2.2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}
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
                    language,
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
              type="number"
              fullWidth
              label={t("form.weight")}
              {...register("weight", { valueAsNumber: true })}
              error={Boolean(errors.weight)}
              helperText={errors.weight?.message}
            />
            <TextField
              type="number"
              fullWidth
              label={copy.waist}
              {...register("waist", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.waist)}
              helperText={errors.waist?.message}
            />
            <TextField
              type="number"
              fullWidth
              label={copy.abdomen}
              {...register("abdomen", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.abdomen)}
              helperText={errors.abdomen?.message}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              type="number"
              fullWidth
              label={copy.hip}
              {...register("hip", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.hip)}
              helperText={errors.hip?.message}
            />
            <TextField
              type="number"
              fullWidth
              label={copy.chest}
              {...register("chest", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              error={Boolean(errors.chest)}
              helperText={errors.chest?.message}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {submitting ? copy.saving : copy.submit}
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
                <Paper key={`${entry.date}-${entry.weight}`} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Stack spacing={0.7}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {formatLocalDateKey(getLocalDateKey(entry.date), language, {
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
