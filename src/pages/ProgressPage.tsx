import { Box, Stack, Typography } from "@mui/material";
import { MonthlyAnalyticsCard } from "../features/meal/MonthlyAnalyticsCard";
import { WeeklyInsights } from "../features/meal/WeeklyInsights";
import { BodyProgressPhotosCard } from "../features/profile/BodyProgressPhotosCard";
import { BodyWeeklyReportCard } from "../features/profile/BodyWeeklyReportCard";
import { MeasurementsCheckInCard } from "../features/profile/MeasurementsCheckInCard";
import { ProgressActionBar } from "../features/profile/ProgressActionBar";
import { QuickWeightCheckInCard } from "../features/profile/QuickWeightCheckInCard";
import { WeightTrendCard } from "../features/profile/WeightTrendCard";
import { WaterTracker } from "../features/water/WaterTracker";
import { useLanguage } from "../shared/language";

const progressPageCopy = {
  uk: {
    title: "Прогрес",
    subtitle:
      "Вага, вода, калорії та щотижневі заміри в одному адаптивному екрані.",
  },
  pl: {
    title: "Progres",
    subtitle:
      "Waga, woda, kalorie i cotygodniowe pomiary w jednym responsywnym widoku.",
  },
  en: {
    title: "Progress",
    subtitle:
      "Weight, water, calories, and weekly measurements in one responsive view.",
  },
} as const;

const ProgressPage = () => {
  const { appLanguage } = useLanguage();
  const copy = progressPageCopy[appLanguage];

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.8}>
        <Typography
          component="h1"
          variant="h4"
          sx={{ fontWeight: 900, fontSize: { xs: 32, md: 40 } }}
        >
          {copy.title}
        </Typography>
        <Typography color="text.secondary">{copy.subtitle}</Typography>
      </Stack>

      <ProgressActionBar />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
          },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={2.5}>
          <QuickWeightCheckInCard />
          <WeightTrendCard />
        </Stack>
        <WaterTracker />
      </Box>

      <WeeklyInsights />
      <MonthlyAnalyticsCard />
      <BodyWeeklyReportCard />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <MeasurementsCheckInCard />
        <BodyProgressPhotosCard />
      </Box>
    </Stack>
  );
};

export default ProgressPage;
