import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { createWeeklyBodyReport } from "../../shared/lib/bodyMetrics";
import { useLanguage } from "../../shared/language";

const bodyReportCopy = {
  uk: {
    title: "Weekly body report",
    subtitle: "Weight, BMI, body measurements, and plateau signal in one weekly summary.",
    weight: "Weight",
    bmi: "BMI",
    waist: "Waist",
    abdomen: "Abdomen",
    hip: "Hips",
    chest: "Chest",
    checkIns: "Check-ins",
    plateauTitle: "AI plateau detection",
    plateauBody: (weeks: number, delta: string) =>
      `Weight has stayed within ${delta} kg for about ${weeks} weeks. Keep calories, protein, water, and check-in consistency visible before changing the goal.`,
    progressBody: (delta: string) =>
      `This week's weight movement is ${delta} kg. Keep using the same weigh-in conditions for cleaner trend data.`,
    empty: "Add at least one weekly check-in to unlock the body report.",
    normal: "Normal",
    underweight: "Underweight",
    overweight: "Overweight",
    obesity: "Obesity",
  },
  pl: {
    title: "Weekly body report",
    subtitle: "Weight, BMI, body measurements, and plateau signal in one weekly summary.",
    weight: "Waga",
    bmi: "BMI",
    waist: "Talia",
    abdomen: "Brzuch",
    hip: "Biodra",
    chest: "Klatka",
    checkIns: "Check-ins",
    plateauTitle: "AI plateau detection",
    plateauBody: (weeks: number, delta: string) =>
      `Waga utrzymuje się w zakresie ${delta} kg przez około ${weeks} tyg. Sprawdź kalorie, białko, wodę i regularność zapisów przed zmianą celu.`,
    progressBody: (delta: string) =>
      `Zmiana masy w tym tygodniu to ${delta} kg. Waż się w tych samych warunkach, aby trend był czytelniejszy.`,
    empty: "Dodaj przynajmniej jeden weekly check-in, aby odblokować raport ciała.",
    normal: "Normal",
    underweight: "Underweight",
    overweight: "Overweight",
    obesity: "Obesity",
  },
} as const;

const formatSigned = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
};

export const BodyWeeklyReportCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { measurementHistory, weightHistory } = useSelector(
    (state: RootState) => state.profile
  );
  const { language } = useLanguage();
  const copy = bodyReportCopy[language];

  const report = useMemo(
    () =>
      createWeeklyBodyReport({
        weightHistory,
        measurementHistory,
        heightCm: user?.height ?? 0,
      }),
    [measurementHistory, user?.height, weightHistory]
  );

  if (!user) {
    return null;
  }

  const measurementCards = [
    {
      label: copy.waist,
      current: report.waist.current,
      delta: report.waist.delta,
    },
    {
      label: copy.abdomen,
      current: report.abdomen.current,
      delta: report.abdomen.delta,
    },
    {
      label: copy.hip,
      current: report.hip.current,
      delta: report.hip.delta,
    },
    {
      label: copy.chest,
      current: report.chest.current,
      delta: report.chest.delta,
    },
  ];
  const weeklyDelta = formatSigned(report.weeklyWeightDelta);
  const plateauDelta = Math.abs(report.plateau.deltaKg).toFixed(1);

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

        {report.checkIns === 0 ? (
          <Alert severity="info">{copy.empty}</Alert>
        ) : (
          <>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={`${copy.weight}: ${report.latestWeight.toFixed(1)} kg (${weeklyDelta})`}
                color="primary"
              />
              <Chip
                label={`${copy.bmi}: ${report.bmi.toFixed(1)} ${
                  copy[report.bmiStatus]
                }`}
                variant="outlined"
              />
              <Chip label={`${copy.checkIns}: ${report.checkIns}`} variant="outlined" />
            </Stack>

            <Alert severity={report.plateau.hasPlateau ? "warning" : "success"}>
              <Typography sx={{ fontWeight: 800 }}>{copy.plateauTitle}</Typography>
              <Typography variant="body2">
                {report.plateau.hasPlateau
                  ? copy.plateauBody(report.plateau.weeksStable || 2, plateauDelta)
                  : copy.progressBody(weeklyDelta)}
              </Typography>
            </Alert>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              {measurementCards.map((item) => (
                <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                    <Typography color="text.secondary">
                      {item.current ? `${item.current.toFixed(1)} cm` : "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSigned(item.delta)} cm vs previous
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};
