import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import {
  Avatar,
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "../shared/i18n/I18nProvider";

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const mealSummary = useSelector((state: RootState) => state.meal.items);
  const { t } = useLanguage();

  const totalMacros = mealSummary.reduce(
    (acc, item) => {
      const factor = item.quantity / 100;
      acc.calories += (item.product?.nutrients?.calories ?? 0) * factor;
      acc.protein += (item.product?.nutrients?.protein ?? 0) * factor;
      acc.fat += (item.product?.nutrients?.fat ?? 0) * factor;
      acc.carbs += (item.product?.nutrients?.carbs ?? 0) * factor;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  if (!user) return <Typography>{t("dashboard.needLogin")}</Typography>;

  const remainingCalories = Math.max(dailyCalories - totalMacros.calories, 0);
  const progress = dailyCalories
    ? Math.min((totalMacros.calories / dailyCalories) * 100, 100)
    : 0;

  const stats = [
    { label: t("dashboard.dailyGoal"), value: `${dailyCalories} ${t("common.kcal")}` },
    {
      label: t("dashboard.consumed"),
      value: `${totalMacros.calories.toFixed(0)} ${t("common.kcal")}`,
    },
    {
      label: t("dashboard.remaining"),
      value: `${remainingCalories.toFixed(0)} ${t("common.kcal")}`,
    },
    { label: t("dashboard.goal"), value: t(`option.goal.${user.goal}`) },
  ];

  const macros = [
    { label: t("dashboard.protein"), value: totalMacros.protein.toFixed(1) },
    { label: t("dashboard.fat"), value: totalMacros.fat.toFixed(1) },
    { label: t("dashboard.carbs"), value: totalMacros.carbs.toFixed(1) },
  ];

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 7,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,118,110,0.9) 100%)",
          color: "white",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.avatar} sx={{ width: 72, height: 72 }}>
              {user.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {t("dashboard.welcome", { name: user.name })}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)", maxWidth: 540 }}>
                {t("dashboard.subtitle")}
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={0.5} sx={{ color: "rgba(255,255,255,0.82)" }}>
            <Typography>{t("dashboard.age")}: {user.age}</Typography>
            <Typography>{t("dashboard.weight")}: {user.weight} {t("common.kg")}</Typography>
            <Typography>{t("dashboard.height")}: {user.height} {t("common.cm")}</Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {stats.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 5,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              backgroundColor: "rgba(255,255,255,0.84)",
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 0.6 }}>
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

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
          {t("meal.progress")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          {totalMacros.calories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 12, borderRadius: 999 }}
        />
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {macros.map((macro) => (
          <Paper
            key={macro.label}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 5,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(239,246,255,0.86) 100%)",
              border: "1px solid rgba(15, 23, 42, 0.08)",
            }}
          >
            <Typography color="text.secondary">{macro.label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.4 }}>
              {macro.value} {t("common.g")}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
};

export default DashboardPage;
