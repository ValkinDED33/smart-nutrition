import { Box, Stack, Typography } from "@mui/material";
import { MonthlyAnalyticsCard } from "../features/meal/MonthlyAnalyticsCard";
import { BodyProgressPhotosCard } from "../features/profile/BodyProgressPhotosCard";
import { BodyWeeklyReportCard } from "../features/profile/BodyWeeklyReportCard";
import { MeasurementsCheckInCard } from "../features/profile/MeasurementsCheckInCard";
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
} as const;

const ProgressPage = () => {
  const { language } = useLanguage();
  const copy = progressPageCopy[language];

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.8}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, fontSize: { xs: 32, md: 40 } }}
        >
          {copy.title}
        </Typography>
        <Typography color="text.secondary">{copy.subtitle}</Typography>
      </Stack>

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
