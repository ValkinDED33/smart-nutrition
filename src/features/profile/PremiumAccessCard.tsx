import { useSelector } from "react-redux";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import type { PremiumPlanId } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const FREE_PLAN_NAME = "Free";
const PRO_PLAN_NAME = "Pro";
const COACH_PLAN_NAME = "Coach";
const FREE_PLAN_PRICE = "0";
const PRO_PLAN_PRICE = "$7.99 / month";
const COACH_PLAN_PRICE = "$14.99 / month";
const FOOD_WATER_TRACKING_FEATURE = "Food + water tracking";
const WEIGHT_BASICS_FEATURE = "Weight basics";
const COMMUNITY_FEATURE = "Community";
const SMART_AI_PRO_FEATURE = "Smart AI Pro";
const PHOTO_FOOD_AI_FEATURE = "Photo Food AI";
const WEEKLY_REPORTS_FEATURE = "Weekly reports";
const COACH_SUMMARY_FEATURE = "Coach summary";
const HABIT_SCORE_FEATURE = "Habit score";
const PRIORITY_REMINDERS_FEATURE = "Priority reminders";

const premiumPlanCopy = {
  free: {
    name: FREE_PLAN_NAME,
    price: FREE_PLAN_PRICE,
    features: [FOOD_WATER_TRACKING_FEATURE, WEIGHT_BASICS_FEATURE, COMMUNITY_FEATURE],
  },
  pro: {
    name: PRO_PLAN_NAME,
    price: PRO_PLAN_PRICE,
    features: [SMART_AI_PRO_FEATURE, PHOTO_FOOD_AI_FEATURE, WEEKLY_REPORTS_FEATURE],
  },
  coach: {
    name: COACH_PLAN_NAME,
    price: COACH_PLAN_PRICE,
    features: [COACH_SUMMARY_FEATURE, HABIT_SCORE_FEATURE, PRIORITY_REMINDERS_FEATURE],
  },
} as const;

const premiumCopy = {
  uk: {
    title: "Premium",
    subtitle: "Pro-доступ, coach-режим і статус підписки.",
    status: "Статус",
    renews: "Наступне оновлення",
    trialEnds: "Trial до",
    unavailable:
      "Доступ керується сервером. Якщо тариф зміниться, статус оновиться автоматично після синхронізації акаунта.",
    current: "Current",
  },
  pl: {
    title: "Premium",
    subtitle: "Dostęp Pro, tryb coach i status subskrypcji.",
    status: "Status",
    renews: "Odnowienie",
    trialEnds: "Trial do",
    unavailable:
      "Dostęp jest zarządzany przez serwer. Po zmianie planu status odświeży się automatycznie po synchronizacji konta.",
    current: "Current",
  },
  en: {
    title: "Premium",
    subtitle: "Pro access, coach mode, and subscription status.",
    status: "Status",
    renews: "Next renewal",
    trialEnds: "Trial until",
    unavailable:
      "Access is managed by the server. When the plan changes, status updates automatically after account sync.",
    current: "Current",
  },
} as const;

const planOrder: PremiumPlanId[] = ["free", "pro", "coach"];

const premiumLocaleByLanguage: Record<AppLanguage, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};

const getPremiumCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return premiumCopy.uk;
    case "pl":
      return premiumCopy.pl;
    case "en":
      return premiumCopy.en;
  }
};

const getPremiumLocale = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return premiumLocaleByLanguage.uk;
    case "pl":
      return premiumLocaleByLanguage.pl;
    case "en":
      return premiumLocaleByLanguage.en;
  }
};

const getPremiumPlanCopy = (plan: PremiumPlanId) => {
  switch (plan) {
    case "free":
      return premiumPlanCopy.free;
    case "pro":
      return premiumPlanCopy.pro;
    case "coach":
      return premiumPlanCopy.coach;
  }
};

const formatDate = (value: string | null, language: AppLanguage) =>
  value
    ? new Date(value).toLocaleDateString(getPremiumLocale(language), {
        dateStyle: "medium",
      })
    : null;

export const PremiumAccessCard = () => {
  const premium = useSelector((state: RootState) => state.profile.premium);
  const { appLanguage } = useLanguage();
  const copy = getPremiumCopy(appLanguage);
  const isPaid = premium.status === "trial" || premium.status === "active";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip color={isPaid ? "success" : "default"} label={`${copy.status}: ${premium.status}`} />
          <Chip label={`${copy.current}: ${getPremiumPlanCopy(premium.plan).name}`} variant="outlined" />
          {premium.trialEndsAt ? (
            <Chip
              label={`${copy.trialEnds}: ${formatDate(premium.trialEndsAt, appLanguage)}`}
              variant="outlined"
            />
          ) : null}
          {premium.renewsAt ? (
            <Chip
              label={`${copy.renews}: ${formatDate(premium.renewsAt, appLanguage)}`}
              variant="outlined"
            />
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          {planOrder.map((plan) => {
            const planCopy = getPremiumPlanCopy(plan);
            const selected = premium.plan === plan;

            return (
              <Paper
                key={plan}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  flex: 1,
                  borderColor: selected ? "success.main" : "rgba(15, 23, 42, 0.12)",
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 900 }}>{planCopy.name}</Typography>
                    {selected ? <Chip size="small" color="success" label={copy.current} /> : null}
                  </Stack>
                  <Typography color="text.secondary">{planCopy.price}</Typography>
                  <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                    {planCopy.features.map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Typography color="text.secondary" variant="body2">
          {copy.unavailable}
        </Typography>

      </Stack>
    </Paper>
  );
};
