import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { createWeeklyBodyReport } from "@domain/profile/bodyMetrics";
import { useLanguage } from "../../shared/language";
import { buildAssistantPersonalizationPlan } from "@core/assistant";

const bodyReportCopy = {
  uk: {
    title: "Щотижневий звіт тіла",
    subtitle: "Вага, BMI, заміри тіла і сигнал plateau в одному тижневому підсумку.",
    weight: "Вага",
    bmi: "BMI",
    waist: "Талія",
    abdomen: "Живіт",
    hip: "Стегна",
    chest: "Груди",
    checkIns: "Check-in",
    plateauTitle: "AI визначення plateau",
    personalTitle: "Персональний фокус асистента",
    plateauBody: (weeks: number, delta: string) =>
      `Вага тримається в межах ${delta} кг приблизно ${weeks} тиж. Спершу перевірте калорії, білок, воду і регулярність записів перед зміною цілі.`,
    progressBody: (delta: string) =>
      `Зміна ваги цього тижня: ${delta} кг. Зважуйтеся в однакових умовах, щоб тренд був чистішим.`,
    empty: "Додайте хоча б один weekly check-in, щоб відкрити звіт тіла.",
    previousDelta: "см до попереднього",
    normal: "Норма",
    underweight: "Нижче норми",
    overweight: "Вище норми",
    obesity: "Ожиріння",
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
    personalTitle: "Osobisty fokus asystenta",
    plateauBody: (weeks: number, delta: string) =>
      `Waga utrzymuje się w zakresie ${delta} kg przez około ${weeks} tyg. Sprawdź kalorie, białko, wodę i regularność zapisów przed zmianą celu.`,
    progressBody: (delta: string) =>
      `Zmiana masy w tym tygodniu to ${delta} kg. Waż się w tych samych warunkach, aby trend był czytelniejszy.`,
    empty: "Dodaj przynajmniej jeden weekly check-in, aby odblokować raport ciała.",
    previousDelta: "cm vs poprzedni",
    normal: "Normal",
    underweight: "Underweight",
    overweight: "Overweight",
    obesity: "Obesity",
  },
  en: {
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
    personalTitle: "Personal assistant focus",
    plateauBody: (weeks: number, delta: string) =>
      `Weight has stayed within ${delta} kg for about ${weeks} weeks. Keep calories, protein, water, and check-in consistency visible before changing the goal.`,
    progressBody: (delta: string) =>
      `This week's weight movement is ${delta} kg. Keep using the same weigh-in conditions for cleaner trend data.`,
    empty: "Add at least one weekly check-in to unlock the body report.",
    previousDelta: "cm vs previous",
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
  const { assistant, measurementHistory, weightHistory } = useSelector(
    (state: RootState) => state.profile
  );
  const { appLanguage } = useLanguage();
  const copy = bodyReportCopy[appLanguage];
  const personalization = buildAssistantPersonalizationPlan(
    assistant.onboarding,
    appLanguage
  );

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

            <Alert severity="info">
              <Typography sx={{ fontWeight: 800 }}>{copy.personalTitle}</Typography>
              <Typography variant="body2">{personalization.reportHint}</Typography>
            </Alert>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              {measurementCards.map((item) => (
                <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                    <Typography color="text.secondary">
                      {item.current ? `${item.current.toFixed(1)} cm` : "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSigned(item.delta)} {copy.previousDelta}
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
