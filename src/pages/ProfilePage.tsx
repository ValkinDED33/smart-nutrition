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
import { useLanguage } from "../shared/language";
import { DailyHistoryExplorer } from "../features/meal/DailyHistoryExplorer";
import {
  selectMealItems,
  selectMealTotalNutrients,
} from "../features/meal/selectors";

const ProfilePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const mealItems = useSelector(selectMealItems);
  const totalMealNutrients = useSelector(selectMealTotalNutrients);
  const { t, language } = useLanguage();

  const diaryText =
    language === "pl"
      ? {
          diary: "Dziennik jedzenia",
          empty: "Brak wpisów.",
          labels: {
            breakfast: "Śniadanie",
            lunch: "Obiad",
            dinner: "Kolacja",
            snack: "Przekąska",
          },
        }
      : {
          diary: "Щоденник харчування",
          empty: "Записів поки немає.",
          labels: {
            breakfast: "Сніданок",
            lunch: "Обід",
            dinner: "Вечеря",
            snack: "Перекус",
          },
        };

  if (!user) return <Typography>{t("profile.notFound")}</Typography>;

  const caloriePercent = dailyCalories
    ? Math.min((totalMealNutrients.calories / dailyCalories) * 100, 100)
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
          {totalMealNutrients.calories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={caloriePercent}
          sx={{ height: 12, borderRadius: 999 }}
        />
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
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          {diaryText.diary}
        </Typography>
        <Stack spacing={1.2}>
          {mealItems.length === 0 ? (
            <Typography color="text.secondary">{diaryText.empty}</Typography>
          ) : (
            mealItems.slice(0, 8).map((item) => {
              const calories = (item.product.nutrients.calories * item.quantity) / 100;

              return (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Typography sx={{ fontWeight: 700 }}>{item.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {diaryText.labels[item.mealType]} - {item.quantity} {item.product.unit} -{" "}
                    {calories.toFixed(0)} {t("common.kcal")}
                  </Typography>
                </Paper>
              );
            })
          )}
        </Stack>
      </Paper>

      <DailyHistoryExplorer />

      <ProfileForm />
    </Stack>
  );
};

export default ProfilePage;
