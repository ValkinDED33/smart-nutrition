import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import {
  Avatar,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ProfileForm from "../features/profile/ProfileForm";
import { useLanguage } from "../shared/i18n/I18nProvider";

const ProfilePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const mealItems = useSelector((state: RootState) => state.meal.items);
  const { t } = useLanguage();

  if (!user) return <Typography>{t("profile.notFound")}</Typography>;

  const totalMealCalories = mealItems.reduce((sum, item) => {
    const calories = item.product?.nutrients?.calories ?? 0;
    return sum + calories * (item.quantity / 100);
  }, 0);

  const caloriePercent = dailyCalories
    ? Math.min((totalMealCalories / dailyCalories) * 100, 100)
    : 0;

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 7,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(101,163,13,0.14) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.avatar} sx={{ width: 84, height: 84 }}>
              {user.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {t("profile.title")}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {t("profile.subtitle")}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`${t("dashboard.age")}: ${user.age}`} />
            <Chip label={`${t("dashboard.weight")}: ${user.weight} ${t("common.kg")}`} />
            <Chip label={`${t("dashboard.height")}: ${user.height} ${t("common.cm")}`} />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          {t("profile.progress")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          {totalMealCalories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={caloriePercent}
          sx={{ height: 12, borderRadius: 999 }}
        />
      </Paper>

      <ProfileForm />
    </Stack>
  );
};

export default ProfilePage;
