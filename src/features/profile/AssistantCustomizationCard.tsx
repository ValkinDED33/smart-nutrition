import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setAssistantCustomization, type ProfileState } from "./profileSlice";
import { applyProfileActionInCloud } from "./profileCloudSync";
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
    selectAll: "Вибрати всі",
    clearSelection: "Очистити",
    saveSettings: "Зберегти зміни",
    saving: "Зберігаю...",
    saved: "Збережено в хмарі",
    saveError: "Не вдалося зберегти. Спробуйте ще раз.",
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
    selectAll: "Wybierz wszystkie",
    clearSelection: "Wyczyść",
    saveSettings: "Zapisz zmiany",
    saving: "Zapisuję...",
    saved: "Zapisano w chmurze",
    saveError: "Nie udało się zapisać. Spróbuj ponownie.",
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
    selectAll: "Select all",
    clearSelection: "Clear",
    saveSettings: "Save changes",
    saving: "Saving...",
    saved: "Saved to cloud",
    saveError: "Could not save. Try again.",
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
type AssistantCopy = (typeof assistantCopy)[keyof typeof assistantCopy];
type AssistantCustomizationPayload = Parameters<
  typeof setAssistantCustomization
>[0];
type AssistantTextDraftFieldsProps = {
  copy: AssistantCopy;
  initialName: string;
  initialPrimaryGoalNote: string;
  initialSupportNote: string;
  onboarding: ProfileState["assistant"]["onboarding"];
  onSave: (payload: AssistantCustomizationPayload) => Promise<ProfileState>;
};

export const AssistantCustomizationCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = assistantCopy[appLanguage];
  const primaryGoalNoteValue =
    assistant.onboarding.primaryGoalNote === "healthy"
      ? copy.healthyGoalNote
      : assistant.onboarding.primaryGoalNote;
  const selectedFrictions =
    assistant.onboarding.mainFrictions.length > 0
      ? assistant.onboarding.mainFrictions.filter((friction) => friction !== "unknown")
      : assistant.onboarding.mainFriction === "unknown"
        ? []
        : [assistant.onboarding.mainFriction];
  const selectedMotivationStyles =
    assistant.onboarding.motivationStyles.length > 0
      ? assistant.onboarding.motivationStyles
      : [assistant.onboarding.motivationStyle];

  const commitAssistantCustomization = (
    payload: Parameters<typeof setAssistantCustomization>[0]
  ) =>
    applyProfileActionInCloud(
      dispatch,
      profile,
      setAssistantCustomization(payload)
    );

  const updateFrictionSelections = (
    nextFrictions: Exclude<AssistantDietFriction, "unknown">[]
  ) => {
    void commitAssistantCustomization({
      onboarding: {
        ...assistant.onboarding,
        mainFriction: nextFrictions[0] ?? "unknown",
        mainFrictions: nextFrictions,
      },
    });
  };

  const updateMotivationSelections = (
    nextStyles: AssistantMotivationStyle[]
  ) => {
    void commitAssistantCustomization({
      onboarding: {
        ...assistant.onboarding,
        motivationStyle: nextStyles[0] ?? "gentle",
        motivationStyles: nextStyles.length > 0 ? nextStyles : ["gentle"],
      },
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <BoxHeader title={copy.title} subtitle={copy.subtitle} />

        <AssistantTextDraftFields
          key={`${assistant.name}|${primaryGoalNoteValue}|${assistant.onboarding.supportNote}`}
          copy={copy}
          initialName={assistant.name}
          initialPrimaryGoalNote={primaryGoalNoteValue}
          initialSupportNote={assistant.onboarding.supportNote}
          onboarding={assistant.onboarding}
          onSave={commitAssistantCustomization}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.companion}
            value={assistant.companionKind}
            onChange={(event) =>
              void commitAssistantCustomization({
                companionKind: event.target.value as AssistantCompanionKind,
                assistantAvatar: event.target.value as AssistantCompanionKind,
              })
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
              void commitAssistantCustomization({
                role: event.target.value as "friend" | "assistant" | "coach",
              })
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
              void commitAssistantCustomization({
                tone: event.target.value as AssistantTone,
                assistantPersonality: event.target.value as AssistantTone,
              })
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
            renderMode="3d"
            active
          />
          <Typography color="text.secondary">
            {copy.companions[assistant.companionKind]} · {assistant.name}
          </Typography>
        </Stack>

        <CompanionProgressCard embedded />

        <BoxHeader title={copy.memoryTitle} subtitle={copy.memorySubtitle} />

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{copy.mainFriction}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={selectedFrictions.length === frictionOptions.length ? "contained" : "outlined"}
              onClick={() => updateFrictionSelections(frictionOptions.filter((friction) => friction !== "unknown"))}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.selectAll}
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateFrictionSelections([])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.clearSelection}
            </Button>
            {frictionOptions
              .filter((friction) => friction !== "unknown")
              .map((friction) => {
                const selected = selectedFrictions.includes(friction);
                return (
                  <Button
                    key={friction}
                    variant={selected ? "contained" : "outlined"}
                    onClick={() =>
                      updateFrictionSelections(
                        selected
                          ? selectedFrictions.filter((item) => item !== friction)
                          : [...selectedFrictions, friction]
                      )
                    }
                    sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                  >
                    {copy.frictions[friction]}
                  </Button>
                );
              })}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{copy.motivationStyle}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={
                selectedMotivationStyles.length === motivationStyleOptions.length
                  ? "contained"
                  : "outlined"
              }
              onClick={() => updateMotivationSelections([...motivationStyleOptions])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.selectAll}
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateMotivationSelections(["gentle"])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.clearSelection}
            </Button>
            {motivationStyleOptions.map((style) => {
              const selected = selectedMotivationStyles.includes(style);
              return (
                <Button
                  key={style}
                  variant={selected ? "contained" : "outlined"}
                  onClick={() =>
                    updateMotivationSelections(
                      selected
                        ? selectedMotivationStyles.filter((item) => item !== style)
                        : [...selectedMotivationStyles, style]
                    )
                  }
                  sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                >
                  {style === "gentle"
                    ? copy.motivationGentle
                    : style === "direct"
                      ? copy.motivationDirect
                      : copy.motivationEnergetic}
                </Button>
              );
            })}
          </Stack>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={assistant.humorEnabled}
              onChange={(_, checked) =>
                void commitAssistantCustomization({ humorEnabled: checked })
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
                void commitAssistantCustomization({ widgetEnabled: checked })
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
                void commitAssistantCustomization({ proactiveHintsEnabled: checked })
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

const AssistantTextDraftFields = ({
  copy,
  initialName,
  initialPrimaryGoalNote,
  initialSupportNote,
  onboarding,
  onSave,
}: AssistantTextDraftFieldsProps) => {
  const [nameDraft, setNameDraft] = useState(initialName);
  const [primaryGoalNoteDraft, setPrimaryGoalNoteDraft] = useState(
    initialPrimaryGoalNote
  );
  const [supportNoteDraft, setSupportNoteDraft] = useState(initialSupportNote);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const resetSaveStatus = () => {
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
    }
  };

  const normalizedNameDraft = nameDraft.trim();
  const normalizedPrimaryGoalNoteDraft = primaryGoalNoteDraft.trim();
  const normalizedSupportNoteDraft = supportNoteDraft.trim();
  const hasTextDraftChanges =
    (normalizedNameDraft.length > 0 && normalizedNameDraft !== initialName) ||
    normalizedPrimaryGoalNoteDraft !== initialPrimaryGoalNote ||
    normalizedSupportNoteDraft !== initialSupportNote;

  const saveAssistantTextDraft = async () => {
    const nextName = normalizedNameDraft || initialName;

    setSaveStatus("saving");

    try {
      await onSave({
        name: nextName,
        assistantName: nextName,
        onboarding: {
          ...onboarding,
          primaryGoalNote: normalizedPrimaryGoalNoteDraft,
          supportNote: normalizedSupportNoteDraft,
        },
      });

      setNameDraft(nextName);
      setPrimaryGoalNoteDraft(normalizedPrimaryGoalNoteDraft);
      setSupportNoteDraft(normalizedSupportNoteDraft);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label={copy.name}
        value={nameDraft}
        onChange={(event) => {
          resetSaveStatus();
          setNameDraft(event.target.value);
        }}
        inputProps={{ maxLength: 32 }}
      />

      <TextField
        label={copy.primaryGoalNote}
        value={primaryGoalNoteDraft}
        multiline
        minRows={2}
        onChange={(event) => {
          resetSaveStatus();
          setPrimaryGoalNoteDraft(event.target.value);
        }}
        inputProps={{ maxLength: 180 }}
      />

      <TextField
        label={copy.supportNote}
        value={supportNoteDraft}
        multiline
        minRows={2}
        onChange={(event) => {
          resetSaveStatus();
          setSupportNoteDraft(event.target.value);
        }}
        inputProps={{ maxLength: 180 }}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Button
          variant="contained"
          disabled={!hasTextDraftChanges || saveStatus === "saving"}
          onClick={() => void saveAssistantTextDraft()}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          {saveStatus === "saving" ? copy.saving : copy.saveSettings}
        </Button>
        {(saveStatus === "saved" || saveStatus === "error") && (
          <Typography
            variant="body2"
            color={saveStatus === "error" ? "error" : "success.main"}
            sx={{ fontWeight: 700 }}
          >
            {saveStatus === "error" ? copy.saveError : copy.saved}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default AssistantCustomizationCard;
