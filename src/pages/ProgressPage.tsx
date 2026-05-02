import { Stack, Typography } from "@mui/material";
import { MonthlyAnalyticsCard } from "../features/meal/MonthlyAnalyticsCard";
import { BodyProgressPhotosCard } from "../features/profile/BodyProgressPhotosCard";
import { BodyWeeklyReportCard } from "../features/profile/BodyWeeklyReportCard";
import { MeasurementsCheckInCard } from "../features/profile/MeasurementsCheckInCard";
import { WeightTrendCard } from "../features/profile/WeightTrendCard";
import { WaterTracker } from "../features/water/WaterTracker";

const ProgressPage = () => {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Progress
      </Typography>
      <Typography color="text.secondary">
        Track weight, hydration, calories, and weekly body changes in one place.
      </Typography>
      <WeightTrendCard />
      <BodyWeeklyReportCard />
      <WaterTracker />
      <MonthlyAnalyticsCard />
      <MeasurementsCheckInCard />
      <BodyProgressPhotosCard />
    </Stack>
  );
};

export default ProgressPage;
