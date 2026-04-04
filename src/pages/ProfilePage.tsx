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
import { NotificationSettingsCard } from "../features/profile/NotificationSettingsCard";
import { WeightTrendCard } from "../features/profile/WeightTrendCard";
import { AccountDataCard } from "../features/profile/AccountDataCard";
import { CloudSyncStatusCard } from "../features/profile/CloudSyncStatusCard";
import MotivationHubCard from "../features/profile/MotivationHubCard";
import AssistantCustomizationCard from "../features/profile/AssistantCustomizationCard";
import { BehaviorPersonalizationCard } from "../features/profile/BehaviorPersonalizationCard";
import { useLanguage } from "../shared/language";
import { DailyHistoryExplorer } from "../features/meal/DailyHistoryExplorer";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import { MealDayOverview } from "../features/meal/MealDayOverview";
import {
  selectDailyMacroProgress,
  selectDailyMacroTargets,
} from "../features/profile/selectors";

const profileCopy = {
  uk: {
    weightGoal: "Цільова вага",
    weightGoalSubtitle: "Відстежуйте, як поточна вага рухається до вашої мети.",
    start: "Старт",
    current: "Поточна",
    target: "Ціль",
    remaining: "Залишилось",
    targetMissing: "Додайте цільову вагу в профілі, щоб увімкнути шкалу прогресу.",
    targetReached: "Цілі досягнуто. Можете встановити наступний рубіж.",
    targetSame: "Поточна вага вже збігається з ціллю.",
    targetAway: (value: string) => `До цілі залишилось ${value} кг.`,
    preferencesTitle: "Налаштування",
    noRestrictions: "Алергії або виключення ще не додані.",
    dietLabel: "Харчування",
    allergiesLabel: "Алергії",
    exclusionsLabel: "Виключено",
    languageLabel: "Мова",
    adaptiveAuto: "Адаптивні калорії оновлюються автоматично.",
    adaptiveManual: "Адаптивні калорії залишаються ручними, доки ви не застосуєте рекомендацію.",
    macroTitle: "Цілі за макроелементами",
    macroSubtitle: "Добові цілі за білками, жирами та вуглеводами на основі калорій, ваги та мети.",
  },
  pl: {
    weightGoal: "Waga docelowa",
    weightGoalSubtitle: "Śledź, jak aktualna masa ciała zbliża się do celu.",
    start: "Start",
    current: "Aktualna",
    target: "Cel",
    remaining: "Pozostało",
    targetMissing: "Dodaj wagę docelową w profilu, aby odblokować skalę postępu.",
    targetReached: "Cel został osiągnięty. Możesz ustawić kolejny etap.",
    targetSame: "Aktualna waga już odpowiada celowi.",
    targetAway: (value: string) => `Do celu pozostało ${value} kg.`,
    preferencesTitle: "Preferencje",
    noRestrictions: "Nie dodano jeszcze alergii ani wykluczeń.",
    dietLabel: "Styl żywienia",
    allergiesLabel: "Alergie",
    exclusionsLabel: "Wykluczone",
    languageLabel: "Język",
    adaptiveAuto: "Adaptacyjne kalorie aktualizują się automatycznie.",
    adaptiveManual: "Adaptacyjne kalorie pozostają ręczne, dopóki nie zastosujesz rekomendacji.",
    macroTitle: "Cele makroskładników",
    macroSubtitle: "Dzienne cele białka, tłuszczów i węglowodanów wyliczone z kalorii, masy ciała i celu.",
  },
} as const;

const dietStyleLabels = {
  uk: {
    balanced: "Збалансоване",
    vegetarian: "Вегетаріанське",
    vegan: "Веганське",
    pescatarian: "Пескетаріанське",
    low_carb: "Низьковуглеводне",
    gluten_free: "Без глютену",
  },
  pl: {
    balanced: "Zbilansowana",
    vegetarian: "Wegetariańska",
    vegan: "Wegańska",
    pescatarian: "Peskatariańska",
    low_carb: "Niskowęglowodanowa",
    gluten_free: "Bez glutenu",
  },
} as const;

const ProfilePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    dailyCalories,
    targetWeight,
    targetWeightStart,
    dietStyle,
    allergies,
    excludedIngredients,
    adaptiveMode,
    languagePreference,
  } = useSelector(
    (state: RootState) => state.profile
  );
  const totalMealNutrients = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const { t, language } = useLanguage();
  const copy = profileCopy[language];
  const localizedDietLabels = dietStyleLabels[language];

  if (!user) return <Typography>{t("profile.notFound")}</Typography>;

  const caloriePercent = dailyCalories
    ? Math.min((totalMealNutrients.calories / dailyCalories) * 100, 100)
    : 0;
  const currentWeight = user.weight;
  const hasTargetWeight = typeof targetWeight === "number" && Number.isFinite(targetWeight);
  const progressStart = targetWeightStart ?? currentWeight;
  const effectiveTargetWeight = hasTargetWeight ? targetWeight : currentWeight;
  const distanceToTarget = Math.abs(effectiveTargetWeight - currentWeight);
  const fullDistance = Math.abs(effectiveTargetWeight - progressStart);
  const targetReached = hasTargetWeight
    ? fullDistance === 0
      ? currentWeight === effectiveTargetWeight
      : effectiveTargetWeight < progressStart
        ? currentWeight <= effectiveTargetWeight
        : currentWeight >= effectiveTargetWeight
    : false;
  const remainingWeight = hasTargetWeight && !targetReached ? distanceToTarget : 0;
  const weightProgress = !hasTargetWeight
    ? 0
    : fullDistance === 0
      ? currentWeight === effectiveTargetWeight
        ? 100
        : 0
      : Math.min((Math.abs(currentWeight - progressStart) / fullDistance) * 100, 100);
  const weightSummary = !hasTargetWeight
    ? copy.targetMissing
    : targetReached
      ? fullDistance === 0
        ? copy.targetSame
        : copy.targetReached
      : copy.targetAway(remainingWeight.toFixed(1));

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
            {hasTargetWeight && (
              <Chip
                label={`${copy.target}: ${effectiveTargetWeight.toFixed(1)} ${t("common.kg")}`}
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 3,
        }}
      >
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
          <Stack spacing={1.6}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.weightGoal}
            </Typography>
            <Typography color="text.secondary">{copy.weightGoalSubtitle}</Typography>
            <Typography color="text.secondary">{weightSummary}</Typography>
            <LinearProgress
              variant="determinate"
              value={weightProgress}
              sx={{
                height: 12,
                borderRadius: 999,
                bgcolor: "rgba(15, 23, 42, 0.08)",
                "& .MuiLinearProgress-bar": {
                  background:
                    "linear-gradient(135deg, rgba(15,118,110,1) 0%, rgba(101,163,13,1) 100%)",
                },
              }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.start}: ${progressStart.toFixed(1)} ${t("common.kg")}`} />
              <Chip label={`${copy.current}: ${currentWeight.toFixed(1)} ${t("common.kg")}`} />
              <Chip
                label={
                  hasTargetWeight
                    ? `${copy.target}: ${effectiveTargetWeight.toFixed(1)} ${t("common.kg")}`
                    : copy.target
                }
                color={hasTargetWeight ? "primary" : "default"}
                variant={hasTargetWeight ? "filled" : "outlined"}
              />
              {hasTargetWeight && (
                <Chip
                  label={`${copy.remaining}: ${remainingWeight.toFixed(1)} ${t("common.kg")}`}
                  color={targetReached ? "success" : "default"}
                />
              )}
            </Stack>
            {hasTargetWeight && (
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  {progressStart.toFixed(1)} {t("common.kg")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {weightProgress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {effectiveTargetWeight.toFixed(1)} {t("common.kg")}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>

      <WeightTrendCard />

      <BehaviorPersonalizationCard />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={1.4}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.macroTitle}
          </Typography>
          <Typography color="text.secondary">{copy.macroSubtitle}</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {[
              {
                label: t("dashboard.protein"),
                current: macroProgress.protein.current,
                target: macroTargets.protein,
                progress: macroProgress.protein.progress,
              },
              {
                label: t("dashboard.fat"),
                current: macroProgress.fat.current,
                target: macroTargets.fat,
                progress: macroProgress.fat.progress,
              },
              {
                label: t("dashboard.carbs"),
                current: macroProgress.carbs.current,
                target: macroTargets.carbs,
                progress: macroProgress.carbs.progress,
              },
            ].map((macro) => (
              <Paper
                key={macro.label}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 4,
                  borderColor: "rgba(15, 23, 42, 0.08)",
                }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800 }}>{macro.label}</Typography>
                  <Typography color="text.secondary">
                    {macro.current.toFixed(1)} / {macro.target.toFixed(0)} {t("common.g")}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={macro.progress}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                </Stack>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>

      <MotivationHubCard />

      <AssistantCustomizationCard />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.preferencesTitle}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${copy.dietLabel}: ${localizedDietLabels[dietStyle]}`} />
            <Chip
              label={`${copy.languageLabel}: ${languagePreference === "pl" ? "Polski" : "Українська"}`}
            />
            {allergies.map((item) => (
              <Chip key={`allergy-${item}`} label={`${copy.allergiesLabel}: ${item}`} />
            ))}
            {excludedIngredients.map((item) => (
              <Chip key={`excluded-${item}`} label={`${copy.exclusionsLabel}: ${item}`} />
            ))}
          </Stack>
          {allergies.length === 0 && excludedIngredients.length === 0 && (
            <Typography color="text.secondary">{copy.noRestrictions}</Typography>
          )}
          <Typography color="text.secondary">
            {adaptiveMode === "automatic" ? copy.adaptiveAuto : copy.adaptiveManual}
          </Typography>
        </Stack>
      </Paper>

      <MealDayOverview />

      <DailyHistoryExplorer />

      <ProfileForm />

      <NotificationSettingsCard />

      <CloudSyncStatusCard />

      <AccountDataCard />
    </Stack>
  );
};

export default ProfilePage;
