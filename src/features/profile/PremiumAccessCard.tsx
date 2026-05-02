import { useDispatch, useSelector } from "react-redux";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import type { PremiumPlanId } from "../../shared/types/profile";
import { useLanguage } from "../../shared/language";
import {
  activatePremiumPlan,
  cancelPremiumSubscription,
  startPremiumTrial,
} from "./profileSlice";

const premiumCopy = {
  uk: {
    title: "Premium",
    subtitle: "Pro-доступ, coach-режим і статус підписки.",
    status: "Статус",
    renews: "Наступне оновлення",
    trialEnds: "Trial до",
    startTrial: "Start 7-day trial",
    activatePro: "Activate Pro",
    activateCoach: "Activate Coach",
    cancel: "Cancel",
    current: "Current",
    plans: {
      free: {
        name: "Free",
        price: "0",
        features: ["Food + water tracking", "Weight basics", "Community"],
      },
      pro: {
        name: "Pro",
        price: "$7.99 / month",
        features: ["Smart AI Pro", "Photo Food AI", "Weekly reports"],
      },
      coach: {
        name: "Coach",
        price: "$14.99 / month",
        features: ["Coach summary", "Habit score", "Priority reminders"],
      },
    },
  },
  pl: {
    title: "Premium",
    subtitle: "Dostęp Pro, tryb coach i status subskrypcji.",
    status: "Status",
    renews: "Odnowienie",
    trialEnds: "Trial do",
    startTrial: "Start 7-day trial",
    activatePro: "Activate Pro",
    activateCoach: "Activate Coach",
    cancel: "Cancel",
    current: "Current",
    plans: {
      free: {
        name: "Free",
        price: "0",
        features: ["Food + water tracking", "Weight basics", "Community"],
      },
      pro: {
        name: "Pro",
        price: "$7.99 / month",
        features: ["Smart AI Pro", "Photo Food AI", "Weekly reports"],
      },
      coach: {
        name: "Coach",
        price: "$14.99 / month",
        features: ["Coach summary", "Habit score", "Priority reminders"],
      },
    },
  },
} as const;

const planOrder: PremiumPlanId[] = ["free", "pro", "coach"];

const formatDate = (value: string | null, language: "uk" | "pl") =>
  value
    ? new Date(value).toLocaleDateString(language === "pl" ? "pl-PL" : "uk-UA", {
        dateStyle: "medium",
      })
    : null;

export const PremiumAccessCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const premium = useSelector((state: RootState) => state.profile.premium);
  const { language } = useLanguage();
  const copy = premiumCopy[language];
  const isPaid = premium.status === "trial" || premium.status === "active";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip color={isPaid ? "success" : "default"} label={`${copy.status}: ${premium.status}`} />
          <Chip label={`${copy.current}: ${copy.plans[premium.plan].name}`} variant="outlined" />
          {premium.trialEndsAt ? (
            <Chip
              label={`${copy.trialEnds}: ${formatDate(premium.trialEndsAt, language)}`}
              variant="outlined"
            />
          ) : null}
          {premium.renewsAt ? (
            <Chip
              label={`${copy.renews}: ${formatDate(premium.renewsAt, language)}`}
              variant="outlined"
            />
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          {planOrder.map((plan) => {
            const planCopy = copy.plans[plan];
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

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {!isPaid ? (
            <Button
              variant="contained"
              onClick={() => dispatch(startPremiumTrial())}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {copy.startTrial}
            </Button>
          ) : null}
          <Button
            variant={premium.plan === "pro" && isPaid ? "outlined" : "contained"}
            onClick={() => dispatch(activatePremiumPlan({ plan: "pro" }))}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.activatePro}
          </Button>
          <Button
            variant={premium.plan === "coach" && isPaid ? "outlined" : "contained"}
            onClick={() => dispatch(activatePremiumPlan({ plan: "coach" }))}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.activateCoach}
          </Button>
          {isPaid ? (
            <Button
              color="error"
              onClick={() => dispatch(cancelPremiumSubscription())}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {copy.cancel}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
};
