import { useDispatch, useSelector } from "react-redux";
import {
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setAssistantCustomization } from "./profileSlice";
import { useLanguage } from "../../shared/language";
import { CompanionAvatar as AssistantAvatar } from "@features/assistant-3d";
import { CompanionProgressCard } from "../companion";
import {
  assistantDietFrictions,
  assistantMotivationStyles,
} from "../../core/assistant";
import type {
  AssistantCompanionKind,
  AssistantDietFriction,
  AssistantMotivationStyle,
  AssistantTone,
} from "@domain/profile/types";

const assistantCopy = {
  uk: {
    title: "Мій помічник",
    subtitle:
      "Налаштуйте, як асистент має звертатися до вас і яким тоном підтримувати вас у щоденній роботі.",
    name: "Ім'я асистента",
    companion: "Персонаж",
    role: "Роль",
    tone: "Тон",
    humor: "Легкий гумор",
    widget: "Плаваючий помічник",
    proactiveHints: "Контекстні підказки",
    memoryTitle: "Пам'ять і стиль підтримки",
    memorySubtitle:
      "Це той контекст, який робить помічника постійним companion, а не окремим чатом.",
    primaryGoalNote: "Що саме важливо змінити",
    healthyGoalNote: "Харчуватись здоровіше",
    supportNote: "Що помічнику варто пам'ятати",
    mainFriction: "Що найчастіше збиває",
    motivationStyle: "Як підтримувати",
    roleFriend: "Друг",
    roleAssistant: "Асистент",
    roleCoach: "Коуч",
    toneGentle: "М'який",
    tonePlayful: "Мотиватор",
    toneFocused: "Тренер",
    toneCalm: "Спокійний",
    toneScientific: "Експерт",
    motivationGentle: "М'яко",
    motivationDirect: "Прямо",
    motivationEnergetic: "Енергійно",
    frictions: {
      unknown: "Ще не визначено",
      emotional_eating: "Емоційна їжа",
      chaotic_schedule: "Хаотичний графік",
      evening_snacking: "Вечірні перекуси",
      low_energy: "Мало енергії",
      social_pressure: "Соціальний тиск",
    },
    companions: {
      cat: "Кіт",
      dog: "Собака",
      fox: "Лис",
      panda: "Панда",
      owl: "Сова",
      human: "Тренер",
      capybara: "Капібара",
      dragon: "Дракон",
      robot: "Робот",
    },
  },
  pl: {
    title: "Mój asystent",
    subtitle:
      "Ustaw, jak asystent ma się do Ciebie zwracać i jakim tonem wspierać Cię na co dzień.",
    name: "Imię asystenta",
    companion: "Postać",
    role: "Rola",
    tone: "Ton",
    humor: "Lekki humor",
    widget: "Pływający asystent",
    proactiveHints: "Podpowiedzi kontekstowe",
    memoryTitle: "Pamięć i styl wsparcia",
    memorySubtitle:
      "To kontekst, który robi z asystenta stałego companion, nie osobny chat.",
    primaryGoalNote: "Co konkretnie ma się zmienić",
    healthyGoalNote: "Jeść zdrowiej",
    supportNote: "Co asystent ma pamiętać",
    mainFriction: "Co najczęściej wybija rytm",
    motivationStyle: "Jak wspierać",
    roleFriend: "Znajomy",
    roleAssistant: "Asystent",
    roleCoach: "Coach",
    toneGentle: "Przyjazny",
    tonePlayful: "Motywator",
    toneFocused: "Trener",
    toneCalm: "Łagodny",
    toneScientific: "Ekspert",
    motivationGentle: "Łagodnie",
    motivationDirect: "Konkretnie",
    motivationEnergetic: "Energicznie",
    frictions: {
      unknown: "Jeszcze nie ustawiono",
      emotional_eating: "Jedzenie emocjonalne",
      chaotic_schedule: "Chaotyczny grafik",
      evening_snacking: "Wieczorne podjadanie",
      low_energy: "Mało energii",
      social_pressure: "Presja społeczna",
    },
    companions: {
      cat: "Kot",
      dog: "Pies",
      fox: "Lis",
      panda: "Panda",
      owl: "Sowa",
      human: "Trener",
      capybara: "Kapibara",
      dragon: "Smok",
      robot: "Robot",
    },
  },
  en: {
    title: "My assistant",
    subtitle:
      "Set how the assistant addresses you and what tone it uses for daily support.",
    name: "Assistant name",
    companion: "Character",
    role: "Role",
    tone: "Tone",
    humor: "Light humor",
    widget: "Floating assistant",
    proactiveHints: "Context hints",
    memoryTitle: "Memory and support style",
    memorySubtitle:
      "This context makes the assistant feel like a persistent companion, not a separate chat.",
    primaryGoalNote: "What should change",
    healthyGoalNote: "Eat healthier",
    supportNote: "What the assistant should remember",
    mainFriction: "What usually breaks rhythm",
    motivationStyle: "How to support you",
    roleFriend: "Friend",
    roleAssistant: "Assistant",
    roleCoach: "Coach",
    toneGentle: "Friendly",
    tonePlayful: "Motivator",
    toneFocused: "Trainer",
    toneCalm: "Calm",
    toneScientific: "Expert",
    motivationGentle: "Gently",
    motivationDirect: "Directly",
    motivationEnergetic: "Energetically",
    frictions: {
      unknown: "Not set yet",
      emotional_eating: "Emotional eating",
      chaotic_schedule: "Chaotic schedule",
      evening_snacking: "Evening snacking",
      low_energy: "Low energy",
      social_pressure: "Social pressure",
    },
    companions: {
      cat: "Cat",
      dog: "Dog",
      fox: "Fox",
      panda: "Panda",
      owl: "Owl",
      human: "Trainer",
      capybara: "Capybara",
      dragon: "Dragon",
      robot: "Robot",
    },
  },
} as const;

const companionKinds: AssistantCompanionKind[] = [
  "cat",
  "dog",
  "fox",
  "panda",
  "owl",
  "dragon",
];

const frictionOptions = assistantDietFrictions;
const motivationStyleOptions = assistantMotivationStyles;

export const AssistantCustomizationCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = assistantCopy[appLanguage];
  const primaryGoalNoteValue =
    assistant.onboarding.primaryGoalNote === "healthy"
      ? copy.healthyGoalNote
      : assistant.onboarding.primaryGoalNote;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <BoxHeader title={copy.title} subtitle={copy.subtitle} />

        <TextField
          label={copy.name}
          value={assistant.name}
          onChange={(event) =>
            dispatch(
              setAssistantCustomization({
                name: event.target.value,
                assistantName: event.target.value,
              })
            )
          }
          inputProps={{ maxLength: 32 }}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.companion}
            value={assistant.companionKind}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  companionKind: event.target.value as AssistantCompanionKind,
                  assistantAvatar: event.target.value as AssistantCompanionKind,
                })
              )
            }
          >
            {companionKinds.map((kind) => (
              <MenuItem key={kind} value={kind}>
                {copy.companions[kind]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label={copy.role}
            value={assistant.role}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  role: event.target.value as "friend" | "assistant" | "coach",
                })
              )
            }
          >
            <MenuItem value="friend">{copy.roleFriend}</MenuItem>
            <MenuItem value="assistant">{copy.roleAssistant}</MenuItem>
            <MenuItem value="coach">{copy.roleCoach}</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={copy.tone}
            value={assistant.tone}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  tone: event.target.value as AssistantTone,
                  assistantPersonality: event.target.value as AssistantTone,
                })
              )
            }
          >
            <MenuItem value="gentle">{copy.toneGentle}</MenuItem>
            <MenuItem value="focused">{copy.toneFocused}</MenuItem>
            <MenuItem value="scientific">{copy.toneScientific}</MenuItem>
            <MenuItem value="playful">{copy.tonePlayful}</MenuItem>
          </TextField>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <AssistantAvatar
            name={assistant.name}
            variant={assistant.companionKind}
            mood="happy"
            active
          />
          <Typography color="text.secondary">
            {copy.companions[assistant.companionKind]} · {assistant.name}
          </Typography>
        </Stack>

        <CompanionProgressCard embedded />

        <BoxHeader title={copy.memoryTitle} subtitle={copy.memorySubtitle} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.mainFriction}
            value={assistant.onboarding.mainFriction}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  onboarding: {
                    ...assistant.onboarding,
                    mainFriction: event.target.value as AssistantDietFriction,
                  },
                })
              )
            }
          >
            {frictionOptions.map((friction) => (
              <MenuItem key={friction} value={friction}>
                {copy.frictions[friction]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label={copy.motivationStyle}
            value={assistant.onboarding.motivationStyle}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  onboarding: {
                    ...assistant.onboarding,
                    motivationStyle: event.target.value as AssistantMotivationStyle,
                  },
                })
              )
            }
          >
            {motivationStyleOptions.map((style) => (
              <MenuItem key={style} value={style}>
                {style === "gentle"
                  ? copy.motivationGentle
                  : style === "direct"
                    ? copy.motivationDirect
                    : copy.motivationEnergetic}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <TextField
          label={copy.primaryGoalNote}
          value={primaryGoalNoteValue}
          multiline
          minRows={2}
          onChange={(event) =>
            dispatch(
              setAssistantCustomization({
                onboarding: {
                  ...assistant.onboarding,
                  primaryGoalNote: event.target.value,
                },
              })
            )
          }
          inputProps={{ maxLength: 180 }}
        />

        <TextField
          label={copy.supportNote}
          value={assistant.onboarding.supportNote}
          multiline
          minRows={2}
          onChange={(event) =>
            dispatch(
              setAssistantCustomization({
                onboarding: {
                  ...assistant.onboarding,
                  supportNote: event.target.value,
                },
              })
            )
          }
          inputProps={{ maxLength: 180 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={assistant.humorEnabled}
              onChange={(_, checked) =>
                dispatch(setAssistantCustomization({ humorEnabled: checked }))
              }
            />
          }
          label={copy.humor}
        />

        <FormControlLabel
          control={
            <Switch
              checked={assistant.widgetEnabled}
              onChange={(_, checked) =>
                dispatch(setAssistantCustomization({ widgetEnabled: checked }))
              }
            />
          }
          label={copy.widget}
        />

        <FormControlLabel
          control={
            <Switch
              checked={assistant.proactiveHintsEnabled}
              disabled={!assistant.widgetEnabled}
              onChange={(_, checked) =>
                dispatch(setAssistantCustomization({ proactiveHintsEnabled: checked }))
              }
            />
          }
          label={copy.proactiveHints}
        />
      </Stack>
    </Paper>
  );
};

const BoxHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Stack spacing={0.8}>
    <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography color="text.secondary">{subtitle}</Typography>
  </Stack>
);

export default AssistantCustomizationCard;
