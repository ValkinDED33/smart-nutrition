import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { selectTodayMealItems } from "../meal/selectors";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

type EcosystemPulseFocus =
  | "assistant"
  | "food"
  | "water"
  | "progress"
  | "profile"
  | "community"
  | "recipes";

interface EcosystemPulseProps {
  focus: EcosystemPulseFocus;
}

const pulseCopy = {
  uk: {
    label: "Жива екосистема",
    assistantFallback: "Помічник",
    meal: "їжа",
    water: "вода",
    companion: "зв'язок",
    focus: {
      assistant: "Помічник читає контекст дня і підказує наступну дію.",
      food: "Їжа, сканер і фото працюють як один шлях до денника.",
      water: "Вода впливає на ритм підказок, нагадувань і прогресу.",
      progress: "Прогрес збирає вагу, воду, харчування і зв'язок з companion.",
      profile: "Профіль керує тим, як екосистема звертається, рахує і підтримує.",
      community: "Спільнота підсилює звички, але не замінює особистий контекст.",
      recipes: "Рецепти підлаштовуються під цілі, продукти і реальний день.",
    },
  },
  pl: {
    label: "Żywy ekosystem",
    assistantFallback: "Asystent",
    meal: "jedzenie",
    water: "woda",
    companion: "więź",
    focus: {
      assistant: "Asystent czyta kontekst dnia i podpowiada kolejny krok.",
      food: "Jedzenie, skaner i zdjęcia prowadzą do jednego dziennika.",
      water: "Woda wpływa na rytm wskazówek, przypomnień i progresu.",
      progress: "Progres łączy wagę, wodę, jedzenie i więź z companion.",
      profile: "Profil steruje tym, jak ekosystem mówi, liczy i wspiera.",
      community: "Społeczność wzmacnia nawyki, ale nie zastępuje osobistego kontekstu.",
      recipes: "Przepisy dopasowują się do celów, produktów i realnego dnia.",
    },
  },
  en: {
    label: "Living ecosystem",
    assistantFallback: "Assistant",
    meal: "food",
    water: "water",
    companion: "bond",
    focus: {
      assistant: "The assistant reads the day context and guides the next action.",
      food: "Food, scanner, and photos flow into one diary path.",
      water: "Water shapes nudges, reminders, and progress rhythm.",
      progress: "Progress blends weight, water, food, and companion bond.",
      profile: "Profile controls how the ecosystem speaks, calculates, and supports.",
      community: "Community strengthens habits without replacing personal context.",
      recipes: "Recipes adapt to goals, products, and the real day.",
    },
  },
} as const;

type PulseCopy = (typeof pulseCopy)[keyof typeof pulseCopy];

const getPulseCopy = (language: AppLanguage): PulseCopy => {
  switch (language) {
    case "pl":
      return pulseCopy.pl;
    case "en":
      return pulseCopy.en;
    case "uk":
    default:
      return pulseCopy.uk;
  }
};

const getFocusText = (copy: PulseCopy, focus: EcosystemPulseFocus) => {
  switch (focus) {
    case "food":
      return copy.focus.food;
    case "water":
      return copy.focus.water;
    case "progress":
      return copy.focus.progress;
    case "profile":
      return copy.focus.profile;
    case "community":
      return copy.focus.community;
    case "recipes":
      return copy.focus.recipes;
    case "assistant":
    default:
      return copy.focus.assistant;
  }
};

const getDisplayAssistantName = (name: string, fallback: string) => {
  const trimmedName = name.trim();

  return trimmedName.length > 0 ? trimmedName : fallback;
};

const formatPercent = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const EcosystemPulse = ({ focus }: EcosystemPulseProps) => {
  const { appLanguage } = useLanguage();
  const copy = getPulseCopy(appLanguage);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const water = useSelector((state: RootState) => state.water);
  const companionState = useSelector((state: RootState) => state.companion);
  const meals = useSelector(selectTodayMealItems);
  const companionLevel = Math.max(1, Math.floor(companionState.level));
  const companionBondPercent = clampPercent((companionState.relationshipLevel / 10) * 100);
  const waterPercent = water.dailyWaterGoal
    ? (water.consumedMl / water.dailyWaterGoal) * 100
    : 0;
  const foodSignal = meals.length > 0 ? Math.min(100, 28 + meals.length * 18) : 0;
  const combinedSignal = Math.round(
    (Math.min(100, foodSignal) + Math.min(100, waterPercent) + companionBondPercent) / 3
  );
  const assistantName = getDisplayAssistantName(assistant.name, copy.assistantFallback);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 560,
        p: 1.2,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
        backdropFilter: "blur(18px)",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <AssistantAvatar
          name={assistantName}
          variant={assistant.companionKind}
          mood={combinedSignal >= 72 ? "celebrate" : combinedSignal >= 42 ? "happy" : "coach"}
          size={42}
          active
        />
        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography sx={{ fontWeight: 950 }}>{copy.label}</Typography>
            <Chip
              size="small"
              label={`L${companionLevel}`}
              color="success"
              variant="outlined"
            />
          </Stack>
          <Typography color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {getFocusText(copy, focus)}
          </Typography>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <Chip size="small" label={`${copy.meal}: ${meals.length}`} />
            <Chip size="small" label={`${copy.water}: ${formatPercent(waterPercent)}`} />
            <Chip size="small" label={`${copy.companion}: ${companionBondPercent}%`} />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={combinedSignal}
            sx={{
              height: 6,
              borderRadius: 999,
              backgroundColor: "var(--sn-surface-muted)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #84cc16 100%)",
              },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default EcosystemPulse;
