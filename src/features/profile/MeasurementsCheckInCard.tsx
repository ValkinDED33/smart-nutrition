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
  hip?: number;
  chest?: number;
};

const checkInCopy = {
  uk: {
    title: "Р’Р°РіР° С– Р·Р°РјС–СЂРё",
    subtitle:
      "РћРЅРѕРІР»СЋР№С‚Рµ РІР°РіСѓ С‚Р° РѕР±'С”РјРё С‰РѕС‚РёР¶РЅСЏ, С‰РѕР± Р±Р°С‡РёС‚Рё СЂРµР°Р»СЊРЅРёР№ РїСЂРѕРіСЂРµСЃ.",
    dueNow: "Р§Р°СЃ РѕРЅРѕРІРёС‚Рё РІР°РіСѓ С– Р·Р°РјС–СЂРё.",
    nextInDays: "РќР°СЃС‚СѓРїРЅРёР№ check-in С‡РµСЂРµР· {days} РґРЅ.",
    lastCheckIn: "РћСЃС‚Р°РЅРЅС–Р№ check-in",
    submit: "Р—Р±РµСЂРµРіС‚Рё check-in",
    saving: "Р—Р±РµСЂС–РіР°СЋ...",
    waist: "РўР°Р»С–СЏ (СЃРј)",
    hip: "РЎС‚РµРіРЅР° (СЃРј)",
    chest: "Р“СЂСѓРґРё (СЃРј)",
    history: "РћСЃС‚Р°РЅРЅС– Р·Р°РїРёСЃРё",
    empty: "Р©Рµ РЅРµРјР°С” weekly check-in.",
    saveError: "РќРµ РІРґР°Р»РѕСЃСЏ Р·Р±РµСЂРµРіС‚Рё Р·Р°РјС–СЂРё.",
    saved: "Р—Р°РјС–СЂРё Р·Р±РµСЂРµР¶РµРЅРѕ.",
  },
  pl: {
    title: "Waga i pomiary",
    subtitle:
      "Aktualizuj wagД™ i obwody co tydzieЕ„, aby widzieД‡ realny postД™p.",
    dueNow: "To dobry moment, aby zaktualizowaД‡ wagД™ i pomiary.",
    nextInDays: "Kolejny check-in za {days} dni.",
    lastCheckIn: "Ostatni check-in",
    submit: "Zapisz check-in",
    saving: "ZapisujД™...",
    waist: "Talia (cm)",
    hip: "Biodra (cm)",
    chest: "Klatka (cm)",
    history: "Ostatnie wpisy",
    empty: "Brak zapisanych weekly check-in.",
    saveError: "Nie udaЕ‚o siД™ zapisaД‡ pomiarГіw.",
    saved: "Pomiary zostaЕ‚y zapisane.",
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
          hip: data.hip,
          chest: data.chest,
        },
      });

      dispatch(setUser(updatedUser));
      dispatch(
        recordMeasurementCheckIn({
          weight: data.weight,
          waist: data.waist,
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
