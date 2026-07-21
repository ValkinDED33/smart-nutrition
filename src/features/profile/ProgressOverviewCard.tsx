import {
  Box,
  ButtonBase,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { createWaterGlassSlots } from "../water/waterModel";
import {
  createProgressOverviewItems,
  formatProgressPercent,
  getProgressToneColor,
  type ProgressDomain,
} from "./progressOverviewModel";

const progressOverviewCopy = {
  uk: {
    title: "Загальний прогрес",
    subtitle: "Одна карта для всього, що веде рахунок сьогодні.",
    calories: "Калорії",
    protein: "Білок",
    water: "Вода",
    meals: "Прийоми їжі",
    weightGoal: "Вага до цілі",
    checkIn: "Check-in",
    noTarget: "ціль не задана",
    legend: "Легенда",
    good: "у темпі",
    watch: "потрібна увага",
    missing: "мало даних",
    mealsDetail: (count: number) => `${count}/4 за сьогодні`,
    checkInDetail: (count: number) => `${count} записів`,
  },
  pl: {
    title: "Ogólny postęp",
    subtitle: "Jedna karta dla wszystkiego, co dziś jest liczone.",
    calories: "Kalorie",
    protein: "Białko",
    water: "Woda",
    meals: "Posiłki",
    weightGoal: "Waga do celu",
    checkIn: "Check-in",
    noTarget: "cel nieustawiony",
    legend: "Legenda",
    good: "w tempie",
    watch: "do sprawdzenia",
    missing: "mało danych",
    mealsDetail: (count: number) => `${count}/4 dzisiaj`,
    checkInDetail: (count: number) => `${count} zapisów`,
  },
  en: {
    title: "Overall progress",
    subtitle: "One card for everything that is being counted today.",
    calories: "Calories",
    protein: "Protein",
    water: "Water",
    meals: "Meals",
    weightGoal: "Weight goal",
    checkIn: "Check-in",
    noTarget: "target not set",
    legend: "Legend",
    good: "on pace",
    watch: "needs attention",
    missing: "not enough data",
    mealsDetail: (count: number) => `${count}/4 today`,
    checkInDetail: (count: number) => `${count} entries`,
  },
} as const;

export type { ProgressDomain } from "./progressOverviewModel";
type ProgressOverviewCopy = (typeof progressOverviewCopy)[AppLanguage];

interface ProgressOverviewCardProps {
  onSelectDomain?: (domain: ProgressDomain) => void;
}

const getProgressOverviewCopy = (language: AppLanguage): ProgressOverviewCopy => {
  switch (language) {
    case "pl":
      return progressOverviewCopy.pl;
    case "en":
      return progressOverviewCopy.en;
    case "uk":
    default:
      return progressOverviewCopy.uk;
  }
};

export const ProgressOverviewCard = ({ onSelectDomain }: ProgressOverviewCardProps) => {
  const { appLanguage } = useLanguage();
  const copy = getProgressOverviewCopy(appLanguage);
  const profile = useSelector((state: RootState) => state.profile);
  const meal = useSelector((state: RootState) => state.meal);
  const water = useSelector((state: RootState) => state.water);
  const overviewWaterGlasses = createWaterGlassSlots(
    water.consumedMl,
    water.dailyWaterGoal,
    water.glassSizeMl,
    6
  ).slice(0, 8);
  const items = createProgressOverviewItems({ profile, meal, water, labels: copy });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        background:
          "linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(14, 165, 233, 0.07))",
      }}
    >
      <Stack spacing={1.8}>
        <Stack spacing={0.4}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
            gap: 1.25,
          }}
        >
          {items.map((item) => {
            const barColor = getProgressToneColor(item.tone, item.color);

            return (
              <Paper
                key={item.label}
                variant="outlined"
                component={ButtonBase}
                type="button"
                onClick={() => onSelectDomain?.(item.domain)}
                data-progress-domain={item.domain}
                sx={{
                  p: 1.35,
                  borderRadius: 1,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  color: "inherit",
                  transition: "border-color 160ms ease, transform 160ms ease",
                  "&:hover, &:focus-visible": {
                    borderColor: barColor,
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 850 }}>{item.label}</Typography>
                    <Typography sx={{ fontWeight: 900, color: barColor }}>
                      {formatProgressPercent(item.value)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.value ?? 100}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "rgba(148, 163, 184, 0.18)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        backgroundColor: barColor,
                      },
                    }}
                  />
                  <Typography color="text.secondary" variant="body2">
                    {item.detail}
                  </Typography>
                  {item.domain === "water" ? (
                    <Box
                      aria-label={copy.water}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${overviewWaterGlasses.length}, minmax(12px, 1fr))`,
                        gap: 0.55,
                        minHeight: 32,
                      }}
                    >
                      {overviewWaterGlasses.map((glass) => (
                        <Box
                          key={`overview-water-glass-${glass.index}`}
                          data-testid="overview-water-glass"
                          sx={{
                            position: "relative",
                            height: 32,
                            borderRadius: "0 0 8px 8px",
                            border: "1px solid rgba(14, 165, 233, 0.32)",
                            backgroundColor: "rgba(14, 165, 233, 0.08)",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              insetInline: 0,
                              bottom: 0,
                              height: `${glass.fill * 100}%`,
                              minHeight: glass.fill > 0 ? 4 : 0,
                              background:
                                "linear-gradient(180deg, rgba(56, 189, 248, 0.75), rgba(14, 165, 233, 0.95))",
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 850 }}>
            {copy.legend}
          </Typography>
          <Chip size="small" label={copy.good} sx={{ bgcolor: "rgba(20,184,166,0.14)", color: "#0f766e", fontWeight: 800 }} />
          <Chip size="small" label={copy.watch} sx={{ bgcolor: "rgba(245,158,11,0.16)", color: "#92400e", fontWeight: 800 }} />
          <Chip size="small" label={copy.missing} sx={{ bgcolor: "rgba(148,163,184,0.18)", fontWeight: 800 }} />
        </Stack>
      </Stack>
    </Paper>
  );
};
