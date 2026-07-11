import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { createWeeklyBodyReport } from "@domain/profile/bodyMetrics";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { buildAssistantPersonalizationPlan } from "@core/assistant/personalizationPlan";

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
    bodyMapTitle: "Карта прогресу тіла",
    bodyMapSubtitle:
      "Кожна шкала показує окремий параметр: вага, BMI, заміри і регулярність записів.",
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
    targetMissing: "Ціль ваги ще не задана",
    enoughDataMissing: "Потрібно ще 2 записи для чесного тренду",
    onTrack: "в нормі / рух правильний",
    watch: "увага / перевірити ритм",
    missing: "даних поки мало",
    targetWeight: "Вага до цілі",
    consistency: "Регулярність",
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
    bodyMapTitle: "Mapa postępu ciała",
    bodyMapSubtitle:
      "Każda skala pokazuje osobny parametr: wagę, BMI, pomiary i regularność zapisów.",
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
    targetMissing: "Cel wagi nie jest jeszcze ustawiony",
    enoughDataMissing: "Potrzeba jeszcze 2 zapisów dla uczciwego trendu",
    onTrack: "w normie / dobry kierunek",
    watch: "uwaga / sprawdź rytm",
    missing: "za mało danych",
    targetWeight: "Waga do celu",
    consistency: "Regularność",
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
    bodyMapTitle: "Body progress map",
    bodyMapSubtitle:
      "Each scale shows a separate parameter: weight, BMI, measurements, and check-in rhythm.",
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
    targetMissing: "Target weight is not set yet",
    enoughDataMissing: "Need 2 more entries for an honest trend",
    onTrack: "healthy / moving well",
    watch: "watch / review rhythm",
    missing: "not enough data",
    targetWeight: "Weight to target",
    consistency: "Consistency",
  },
} as const;

type BodyReportCopy = (typeof bodyReportCopy)[AppLanguage];
type BodyProgressTone = "good" | "watch" | "missing";
type BodyProgressMapItem = {
  label: string;
  value: number | null;
  detail: string;
  color: string;
  tone: BodyProgressTone;
};

const getBodyReportCopy = (language: AppLanguage): BodyReportCopy => {
  switch (language) {
    case "pl":
      return bodyReportCopy.pl;
    case "en":
      return bodyReportCopy.en;
    case "uk":
    default:
      return bodyReportCopy.uk;
  }
};

const getBmiStatusCopy = (
  copy: BodyReportCopy,
  status: ReturnType<typeof createWeeklyBodyReport>["bmiStatus"]
) => {
  switch (status) {
    case "underweight":
      return copy.underweight;
    case "overweight":
      return copy.overweight;
    case "obesity":
      return copy.obesity;
    case "normal":
    default:
      return copy.normal;
  }
};

const formatSigned = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const buildGoalProgress = ({
  latestWeight,
  targetWeight,
  targetWeightStart,
}: {
  latestWeight: number;
  targetWeight: number | null;
  targetWeightStart: number | null;
}) => {
  if (!latestWeight || !targetWeight) {
    return null;
  }

  const startWeight = targetWeightStart ?? latestWeight;
  const totalDistance = Math.abs(startWeight - targetWeight);

  if (totalDistance === 0) {
    return 100;
  }

  return clamp(
    (Math.abs(startWeight - latestWeight) / totalDistance) * 100,
    0,
    100
  );
};

const getBmiProgressValue = (bmi: number) => {
  if (!bmi) {
    return null;
  }

  return clamp(((bmi - 16) / 19) * 100, 0, 100);
};

const getMeasurementTrendValue = (delta: number | null) => {
  if (delta === null || !Number.isFinite(delta)) {
    return null;
  }

  return clamp(50 - delta * 8, 5, 100);
};

const getMeasurementTone = (delta: number | null): BodyProgressTone => {
  if (delta === null || !Number.isFinite(delta)) {
    return "missing";
  }

  return Math.abs(delta) <= 1.5 || delta < 0 ? "good" : "watch";
};

const getBarColor = (tone: BodyProgressTone, color: string) => {
  switch (tone) {
    case "watch":
      return "#f59e0b";
    case "missing":
      return "rgba(148, 163, 184, 0.65)";
    case "good":
    default:
      return color;
  }
};

const getToneLabel = (
  copy: BodyReportCopy,
  tone: BodyProgressTone
) => {
  switch (tone) {
    case "watch":
      return copy.watch;
    case "missing":
      return copy.missing;
    case "good":
    default:
      return copy.onTrack;
  }
};

const getMeasurementColor = (index: number) => {
  switch (index) {
    case 0:
      return "#06b6d4";
    case 1:
      return "#22c55e";
    case 2:
      return "#f97316";
    case 3:
      return "#ec4899";
    default:
      return "#0ea5e9";
  }
};

export const BodyWeeklyReportCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    assistant,
    measurementHistory,
    targetWeight,
    targetWeightStart,
    weeklyCheckIn,
    weightHistory,
  } = useSelector(
    (state: RootState) => state.profile
  );
  const { appLanguage } = useLanguage();
  const copy = getBodyReportCopy(appLanguage);
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
  const goalProgress = buildGoalProgress({
    latestWeight: report.latestWeight,
    targetWeight,
    targetWeightStart,
  });
  const bmiProgress = getBmiProgressValue(report.bmi);
  const checkInProgress = clamp(
    (Math.min(report.checkIns, weeklyCheckIn.remindIntervalDays) /
      weeklyCheckIn.remindIntervalDays) *
      100,
    0,
    100
  );
  const progressMapItems: BodyProgressMapItem[] = [
    {
      label: copy.targetWeight,
      value: goalProgress,
      detail: targetWeight
        ? `${report.latestWeight.toFixed(1)} / ${targetWeight.toFixed(1)} kg`
        : copy.targetMissing,
      color: "#14b8a6",
      tone: goalProgress === null ? "missing" : "good",
    },
    {
      label: copy.bmi,
      value: bmiProgress,
      detail: `${report.bmi.toFixed(1)} ${getBmiStatusCopy(copy, report.bmiStatus)}`,
      color: "#8b5cf6",
      tone: report.bmiStatus === "normal" ? "good" : "watch",
    },
    ...measurementCards.map((item, index) => {
      const tone = getMeasurementTone(item.delta);
      return {
        label: item.label,
        value: getMeasurementTrendValue(item.delta),
        detail: item.current
          ? `${item.current.toFixed(1)} cm / ${formatSigned(item.delta)} ${copy.previousDelta}`
          : copy.enoughDataMissing,
        color: getMeasurementColor(index),
        tone,
      };
    }),
    {
      label: copy.consistency,
      value: checkInProgress,
      detail: `${report.checkIns} ${copy.checkIns.toLowerCase()}`,
      color: "#84cc16",
      tone: report.checkIns >= 2 ? "good" : "missing",
    },
  ];

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
                  getBmiStatusCopy(copy, report.bmiStatus)
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

            <Paper
              variant="outlined"
              sx={{
                p: 1.8,
                borderRadius: 1,
                background:
                  "linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(139, 92, 246, 0.08))",
              }}
            >
              <Stack spacing={1.6}>
                <Stack spacing={0.4}>
                  <Typography sx={{ fontWeight: 900 }}>{copy.bodyMapTitle}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {copy.bodyMapSubtitle}
                  </Typography>
                </Stack>

                <Stack spacing={1.25}>
                  {progressMapItems.map((item) => {
                    const barColor = getBarColor(item.tone, item.color);
                    return (
                      <Stack key={item.label} spacing={0.55}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <Box
                              aria-hidden
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                backgroundColor: barColor,
                                boxShadow: `0 0 0 4px ${barColor}22`,
                              }}
                            />
                            <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                          </Stack>
                          <Typography color="text.secondary" variant="body2">
                            {item.detail}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={item.value ?? 100}
                          sx={{
                            height: 9,
                            borderRadius: 999,
                            backgroundColor: "rgba(148, 163, 184, 0.18)",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 999,
                              background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                            },
                          }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {(["good", "watch", "missing"] as const).map((tone) => (
                    <Chip
                      key={tone}
                      size="small"
                      label={getToneLabel(copy, tone)}
                      sx={{
                        fontWeight: 800,
                        backgroundColor:
                          tone === "good"
                            ? "rgba(20, 184, 166, 0.14)"
                            : tone === "watch"
                              ? "rgba(245, 158, 11, 0.16)"
                              : "rgba(148, 163, 184, 0.18)",
                        color:
                          tone === "good"
                            ? "#0f766e"
                            : tone === "watch"
                              ? "#92400e"
                              : "text.secondary",
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Paper>

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
