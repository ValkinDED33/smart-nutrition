import { useSelector } from "react-redux";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import type { PremiumPlanId, PremiumSubscriptionState } from "@domain/profile/types";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const FREE_PLAN_PRICE = "0";
const PRO_PLAN_PRICE = "$7.99 / month";
const COACH_PLAN_PRICE = "$14.99 / month";

const premiumCopy = {
  uk: {
    title: "Premium",
    subtitle: "Pro-доступ, AI-супровід і статус підписки.",
    status: "Статус",
    renews: "Наступне оновлення",
    trialEnds: "Trial до",
    unavailable:
      "Доступ оновлюється через захищену синхронізацію. Якщо тариф зміниться, статус підтягнеться автоматично після синхронізації акаунта.",
    current: "Поточний",
    plans: {
      free: {
        name: "Базовий",
        price: FREE_PLAN_PRICE,
        features: ["Їжа і вода", "Базова вага", "Спільнота"],
      },
      pro: {
        name: "Pro",
        price: PRO_PLAN_PRICE,
        features: ["Розумний AI Pro", "Фото їжі з AI", "Тижневі звіти"],
      },
      coach: {
        name: "AI-супровід",
        price: COACH_PLAN_PRICE,
        features: ["Підсумок помічника", "Оцінка звичок", "Пріоритетні нагадування"],
      },
    },
    statuses: {
      inactive: "Без активної підписки",
      trial: "Пробний період",
      active: "Активна",
      cancelled: "Скасована",
    },
  },
  pl: {
    title: "Premium",
    subtitle: "Dostęp Pro, opieka AI i status subskrypcji.",
    status: "Status",
    renews: "Odnowienie",
    trialEnds: "Trial do",
    unavailable:
      "Dostęp odświeża się przez chronioną synchronizację. Po zmianie planu status zaktualizuje się automatycznie po synchronizacji konta.",
    current: "Aktualny",
    plans: {
      free: {
        name: "Podstawowy",
        price: FREE_PLAN_PRICE,
        features: ["Jedzenie i woda", "Podstawy wagi", "Społeczność"],
      },
      pro: {
        name: "Pro",
        price: PRO_PLAN_PRICE,
        features: ["Smart AI Pro", "Zdjęcia jedzenia AI", "Raporty tygodniowe"],
      },
      coach: {
        name: "Opieka AI",
        price: COACH_PLAN_PRICE,
        features: ["Podsumowanie asystenta", "Ocena nawyków", "Priorytetowe przypomnienia"],
      },
    },
    statuses: {
      inactive: "Brak aktywnej subskrypcji",
      trial: "Okres próbny",
      active: "Aktywna",
      cancelled: "Anulowana",
    },
  },
  en: {
    title: "Premium",
    subtitle: "Pro access, AI guidance, and subscription status.",
    status: "Status",
    renews: "Next renewal",
    trialEnds: "Trial until",
    unavailable:
      "Access updates through protected sync. When the plan changes, status updates automatically after account sync.",
    current: "Current",
    plans: {
      free: {
        name: "Free",
        price: FREE_PLAN_PRICE,
        features: ["Food and water", "Weight basics", "Community"],
      },
      pro: {
        name: "Pro",
        price: PRO_PLAN_PRICE,
        features: ["Smart AI Pro", "Photo Food AI", "Weekly reports"],
      },
      coach: {
        name: "AI Guidance",
        price: COACH_PLAN_PRICE,
        features: ["Assistant summary", "Habit score", "Priority reminders"],
      },
    },
    statuses: {
      inactive: "No active subscription",
      trial: "Trial",
      active: "Active",
      cancelled: "Cancelled",
    },
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

const getPremiumPlanCopy = (
  copy: ReturnType<typeof getPremiumCopy>,
  plan: PremiumPlanId
) => {
  switch (plan) {
    case "free":
      return copy.plans.free;
    case "pro":
      return copy.plans.pro;
    case "coach":
      return copy.plans.coach;
  }
};

const getPremiumStatusLabel = (
  copy: ReturnType<typeof getPremiumCopy>,
  status: PremiumSubscriptionState["status"]
) => {
  switch (status) {
    case "trial":
      return copy.statuses.trial;
    case "active":
      return copy.statuses.active;
    case "cancelled":
      return copy.statuses.cancelled;
    case "inactive":
    default:
      return copy.statuses.inactive;
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
          <Chip
            color={isPaid ? "success" : "default"}
            label={`${copy.status}: ${getPremiumStatusLabel(copy, premium.status)}`}
          />
          <Chip
            label={`${copy.current}: ${getPremiumPlanCopy(copy, premium.plan).name}`}
            variant="outlined"
          />
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
            const planCopy = getPremiumPlanCopy(copy, plan);
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
