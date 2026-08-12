import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import {
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Droplets,
  HeartPulse,
  MessageCircle,
  ScanLine,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { selectTodayMealItems } from "../meal/selectors";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import { getAssistantDisplayName } from "./assistantDisplayName";
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
    label: "AI-працівник поруч",
    assistantFallback: "Помічник",
    meal: "їжа",
    water: "вода",
    companion: "зв'язок",
    worker: "AI-працівник",
    drawerTitle: "Що я зараз роблю",
    drawerIntro: "Я не просто висю на екрані: перевіряю реальні частини дня і підказую дію.",
    workerActions: [
      "Збираю їжу, воду і прогрес в одну картину.",
      "Тримаю поруч фото їжі, Telegram, сімейні задачі й нагадування.",
      "Показую тільки наступний корисний крок, без фейкових перемог.",
    ],
    tools: ["Їжа", "Вода", "Фото", "Telegram", "Здоров'я", "Сім'я", "Ліки", "Події"],
    focus: {
      assistant: "Я читаю контекст дня, звіряю підтверджені дані і готую наступну дію.",
      food: "Їжа, сканер і фото працюють як один шлях до денника.",
      water: "Вода впливає на ритм підказок, нагадувань і прогресу.",
      progress: "Прогрес збирає вагу, воду, харчування і зв'язок з помічником.",
      profile: "Профіль керує тим, як екосистема звертається, рахує і підтримує.",
      community: "Спільнота підсилює звички, але не замінює особистий контекст.",
      recipes: "Рецепти підлаштовуються під цілі, продукти і реальний день.",
    },
  },
  pl: {
    label: "Pracownik AI obok",
    assistantFallback: "Asystent",
    meal: "jedzenie",
    water: "woda",
    companion: "więź",
    worker: "Pracownik AI",
    drawerTitle: "Co teraz robię",
    drawerIntro: "Nie jestem tylko ikoną: sprawdzam realne części dnia i podpowiadam działanie.",
    workerActions: [
      "Łączę jedzenie, wodę i postęp w jeden obraz.",
      "Trzymam blisko zdjęcia jedzenia, Telegram, rodzinę i przypomnienia.",
      "Pokazuję następny przydatny krok bez fałszywych sukcesów.",
    ],
    tools: ["Jedzenie", "Woda", "Zdjęcia", "Telegram", "Zdrowie", "Rodzina", "Leki", "Wydarzenia"],
    focus: {
      assistant: "Czytam kontekst dnia, sprawdzam potwierdzone dane i szykuję kolejny krok.",
      food: "Jedzenie, skaner i zdjęcia prowadzą do jednego dziennika.",
      water: "Woda wpływa na rytm wskazówek, przypomnień i progresu.",
      progress: "Progres łączy wagę, wodę, jedzenie i więź z asystentem.",
      profile: "Profil steruje tym, jak ekosystem mówi, liczy i wspiera.",
      community: "Społeczność wzmacnia nawyki, ale nie zastępuje osobistego kontekstu.",
      recipes: "Przepisy dopasowują się do celów, produktów i realnego dnia.",
    },
  },
  en: {
    label: "AI worker nearby",
    assistantFallback: "Assistant",
    meal: "food",
    water: "water",
    companion: "assistant bond",
    worker: "AI worker",
    drawerTitle: "What I am doing now",
    drawerIntro: "I am not just an icon: I check real parts of the day and suggest an action.",
    workerActions: [
      "I combine food, water, and progress into one picture.",
      "I keep food photos, Telegram, family tasks, and reminders nearby.",
      "I surface the next useful step without fake success.",
    ],
    tools: ["Food", "Water", "Photos", "Telegram", "Health", "Family", "Meds", "Events"],
    focus: {
      assistant: "I read the day context, check confirmed data, and prepare the next action.",
      food: "Food, scanner, and photos flow into one diary path.",
      water: "Water shapes nudges, reminders, and progress rhythm.",
      progress: "Progress blends weight, water, food, and assistant bond.",
      profile: "Profile controls how the ecosystem speaks, calculates, and supports.",
      community: "Community strengthens habits without replacing personal context.",
      recipes: "Recipes adapt to goals, products, and the real day.",
    },
  },
} as const;

type PulseCopy = (typeof pulseCopy)[keyof typeof pulseCopy];
const pulseToolIcons = [
  Utensils,
  Droplets,
  ScanLine,
  MessageCircle,
  HeartPulse,
  Users,
  ClipboardCheck,
  CalendarDays,
];

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
  const assistantName = getAssistantDisplayName(
    assistant.name,
    appLanguage,
    copy.assistantFallback
  );

  return (
    <Box
      data-ai-worker-pulse="true"
      sx={{
        width: "100%",
        maxWidth: 560,
        p: 1.35,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        background:
          "radial-gradient(circle at 12% 18%, rgba(34,211,238,0.18), transparent 30%), radial-gradient(circle at 92% 80%, rgba(132,204,22,0.14), transparent 32%), linear-gradient(135deg, var(--sn-surface-glass), var(--sn-surface-muted))",
        backdropFilter: "blur(18px)",
        overflow: "hidden",
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
            <Chip
              size="small"
              icon={<Sparkles size={14} />}
              label={copy.worker}
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />
          </Stack>
          <Typography color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {getFocusText(copy, focus)}
          </Typography>
          <Box
            component="details"
            data-ai-worker-pulse-drawer="true"
            sx={{
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              backgroundColor: "rgba(255, 255, 255, 0.44)",
              overflow: "hidden",
              "&[open] [data-ai-worker-pulse-chevron='true']": {
                transform: "rotate(180deg)",
              },
            }}
          >
            <Box
              component="summary"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1,
                py: 0.85,
                cursor: "pointer",
                listStyle: "none",
                fontWeight: 950,
                "&::-webkit-details-marker": {
                  display: "none",
                },
                "&:hover": {
                  backgroundColor: "rgba(20, 184, 166, 0.08)",
                },
                "&:focus-visible": {
                  outline: "2px solid var(--sn-accent)",
                  outlineOffset: -2,
                },
              }}
            >
              <span>{copy.drawerTitle}</span>
              <ChevronDown
                size={17}
                data-ai-worker-pulse-chevron="true"
                style={{ transition: "transform 180ms ease" }}
              />
            </Box>
            <Stack spacing={0.8} sx={{ px: 1, pb: 1 }}>
              <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.35 }}>
                {copy.drawerIntro}
              </Typography>
              {copy.workerActions.map((action) => (
                <Stack key={action} direction="row" spacing={0.8} alignItems="flex-start">
                  <Sparkles size={14} color="var(--sn-accent)" />
                  <Typography sx={{ fontSize: 13, lineHeight: 1.35 }}>
                    {action}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
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
          <Stack
            direction="row"
            spacing={0.65}
            useFlexGap
            flexWrap="wrap"
            data-ai-worker-pulse-tools="true"
          >
            {copy.tools.map((tool, index) => {
              const Icon = pulseToolIcons.at(index) ?? Sparkles;

              return (
                <Chip
                  key={tool}
                  size="small"
                  icon={<Icon size={13} />}
                  label={tool}
                  variant="outlined"
                  sx={{
                    maxWidth: "100%",
                    borderColor: "var(--sn-border-soft)",
                    backgroundColor: "var(--sn-surface-glass)",
                    fontWeight: 850,
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
