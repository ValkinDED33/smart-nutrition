import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Bell,
  Camera,
  Droplets,
  HeartPulse,
  MessageCircle,
  Salad,
  Users,
} from "lucide-react";
import type { RootState } from "../../app/store";
import { setAssistantCustomization, type ProfileState } from "./profileSlice";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import {
  Companion3DLoadingFallback,
  CompanionAvatar as AssistantAvatar,
} from "@features/assistant-3d";
import CompanionProgressCard from "../companion/CompanionProgressCard";
import { useCompanionRenderModePreference } from "./useCompanionRenderModePreference";
import { getProfileCloudActionCopy } from "./profileCloudActionCopy";
import { useProfileCloudAction } from "./useProfileCloudAction";
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
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

const assistantCopy = {
  uk: {
    title: "Мій помічник",
    subtitle:
      "Налаштуйте, як асистент має звертатися до вас і яким тоном підтримувати вас у щоденній роботі.",
    workerTitle: "Один AI-працівник для всього проєкту",
    workerSubtitle:
      "Він працює в застосунку й Telegram: читає контекст дня, допомагає з їжею, водою, ліками, тиском, фото, родиною й нагадуваннями. Образ змінюється, мозок і пам'ять залишаються єдиними.",
    workerTools: ["Їжа", "Вода", "Фото", "Тиск", "Telegram", "Родина", "Нагадування"],
    name: "Ім'я асистента",
    companion: "Персонаж",
    role: "Роль",
    tone: "Тон",
    humor: "Легкий гумор",
    widget: "Плаваючий помічник",
    proactiveHints: "Контекстні підказки",
    memoryTitle: "Пам'ять і стиль підтримки",
    memorySubtitle:
      "Це той контекст, який робить помічника постійним провідником, а не окремим чатом.",
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
    appearanceTitle: "Образ помічника",
    appearanceHint:
      "Образ підлаштовується під ваш пристрій, щоб помічник залишався поруч без зависань.",
    renderModeLoading: "Готую образ",
    renderModeError: "Показую легкий образ, щоб сторінка не зависла",
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
      raccoon: "Єнот",
      corgi: "Коргі",
      wolf: "Вовк",
      tiger: "Тигр",
      bear: "Ведмідь",
      rabbit: "Кролик",
      chameleon: "Хамелеон",
      lion: "Лев",
      otter: "Видра",
      hedgehog: "Їжак",
      koala: "Коала",
      deer: "Олень",
      turtle: "Черепаха",
      axolotl: "Аксолотль",
      phoenix: "Фенікс",
      forest_spirit: "Дух лісу",
      cosmic_beast: "Космічний звір",
    },
  },
  pl: {
    title: "Mój asystent",
    subtitle:
      "Ustaw, jak asystent ma się do Ciebie zwracać i jakim tonem wspierać Cię na co dzień.",
    workerTitle: "Jeden pracownik AI dla całego projektu",
    workerSubtitle:
      "Działa w aplikacji i Telegramie: czyta kontekst dnia, pomaga z jedzeniem, wodą, lekami, ciśnieniem, zdjęciami, rodziną i przypomnieniami. Wygląd się zmienia, ale mózg i pamięć zostają wspólne.",
    workerTools: ["Jedzenie", "Woda", "Zdjęcia", "Ciśnienie", "Telegram", "Rodzina", "Przypomnienia"],
    name: "Imię asystenta",
    companion: "Postać",
    role: "Rola",
    tone: "Ton",
    humor: "Lekki humor",
    widget: "Pływający asystent",
    proactiveHints: "Podpowiedzi kontekstowe",
    memoryTitle: "Pamięć i styl wsparcia",
    memorySubtitle:
      "To kontekst, który robi z asystenta stałego przewodnika, a nie osobny czat.",
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
    appearanceTitle: "Wygląd asystenta",
    appearanceHint:
      "Wygląd dopasowuje się do urządzenia, żeby asystent był zawsze pod ręką bez zacięć.",
    renderModeLoading: "Przygotowuję wygląd",
    renderModeError: "Pokazuję lżejszy wygląd, żeby strona działała płynnie",
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
      raccoon: "Szop",
      corgi: "Corgi",
      wolf: "Wilk",
      tiger: "Tygrys",
      bear: "Niedźwiedź",
      rabbit: "Królik",
      chameleon: "Kameleon",
      lion: "Lew",
      otter: "Wydra",
      hedgehog: "Jeż",
      koala: "Koala",
      deer: "Jeleń",
      turtle: "Żółw",
      axolotl: "Aksolotl",
      phoenix: "Feniks",
      forest_spirit: "Duch lasu",
      cosmic_beast: "Kosmiczny zwierz",
    },
  },
  en: {
    title: "My assistant",
    subtitle:
      "Set how the assistant addresses you and what tone it uses for daily support.",
    workerTitle: "One AI worker for the whole project",
    workerSubtitle:
      "It works in the app and Telegram: reads day context, helps with food, water, medication, pressure, photos, family, and reminders. The look changes, but the brain and memory stay unified.",
    workerTools: ["Food", "Water", "Photos", "Pressure", "Telegram", "Family", "Reminders"],
    name: "Assistant name",
    companion: "Character",
    role: "Role",
    tone: "Tone",
    humor: "Light humor",
    widget: "Floating assistant",
    proactiveHints: "Context hints",
    memoryTitle: "Memory and support style",
    memorySubtitle:
      "This context makes the assistant feel present and personal, not like a separate chat.",
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
    appearanceTitle: "Assistant appearance",
    appearanceHint:
      "The look adapts to the device so the assistant stays present without slowing the page.",
    renderModeLoading: "Preparing look",
    renderModeError: "Showing a lighter look so the page stays smooth",
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
      raccoon: "Raccoon",
      corgi: "Corgi",
      wolf: "Wolf",
      tiger: "Tiger",
      bear: "Bear",
      rabbit: "Rabbit",
      chameleon: "Chameleon",
      lion: "Lion",
      otter: "Otter",
      hedgehog: "Hedgehog",
      koala: "Koala",
      deer: "Deer",
      turtle: "Turtle",
      axolotl: "Axolotl",
      phoenix: "Phoenix",
      forest_spirit: "Forest spirit",
      cosmic_beast: "Cosmic beast",
    },
  },
} as const;

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

const getAssistantWorkerToolIcon = (index: number) => {
  switch (index) {
    case 0:
      return Salad;
    case 1:
      return Droplets;
    case 2:
      return Camera;
    case 3:
      return HeartPulse;
    case 4:
      return MessageCircle;
    case 5:
      return Users;
    case 6:
      return Bell;
    default:
      return MessageCircle;
  }
};

const getAssistantCopy = (language: AppLanguage): AssistantCopy => {
  switch (language) {
    case "uk":
      return assistantCopy.uk;
    case "pl":
      return assistantCopy.pl;
    case "en":
    default:
      return assistantCopy.en;
  }
};

const getCompanionLabel = (
  copy: AssistantCopy,
  kind: AssistantCompanionKind
): string => {
  switch (kind) {
    case "dog":
      return copy.companions.dog;
    case "fox":
      return copy.companions.fox;
    case "panda":
      return copy.companions.panda;
    case "owl":
      return copy.companions.owl;
    case "human":
      return copy.companions.human;
    case "capybara":
      return copy.companions.capybara;
    case "dragon":
      return copy.companions.dragon;
    case "raccoon":
      return copy.companions.raccoon;
    case "corgi":
      return copy.companions.corgi;
    case "wolf":
      return copy.companions.wolf;
    case "tiger":
      return copy.companions.tiger;
    case "bear":
      return copy.companions.bear;
    case "rabbit":
      return copy.companions.rabbit;
    case "chameleon":
      return copy.companions.chameleon;
    case "lion":
      return copy.companions.lion;
    case "otter":
      return copy.companions.otter;
    case "hedgehog":
      return copy.companions.hedgehog;
    case "koala":
      return copy.companions.koala;
    case "deer":
      return copy.companions.deer;
    case "turtle":
      return copy.companions.turtle;
    case "axolotl":
      return copy.companions.axolotl;
    case "phoenix":
      return copy.companions.phoenix;
    case "forest_spirit":
      return copy.companions.forest_spirit;
    case "cosmic_beast":
      return copy.companions.cosmic_beast;
    case "robot":
      return copy.companions.robot;
    case "cat":
    default:
      return copy.companions.cat;
  }
};

const getFrictionLabel = (
  copy: AssistantCopy,
  friction: AssistantDietFriction
): string => {
  switch (friction) {
    case "emotional_eating":
      return copy.frictions.emotional_eating;
    case "chaotic_schedule":
      return copy.frictions.chaotic_schedule;
    case "evening_snacking":
      return copy.frictions.evening_snacking;
    case "low_energy":
      return copy.frictions.low_energy;
    case "social_pressure":
      return copy.frictions.social_pressure;
    case "unknown":
    default:
      return copy.frictions.unknown;
  }
};

const AssistantCustomizationCard = () => {
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = getAssistantCopy(appLanguage);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
  const companionRenderModePreference = useCompanionRenderModePreference();
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
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

  const commitAssistantCustomization = async (
    payload: Parameters<typeof setAssistantCustomization>[0]
  ) => {
    const nextProfile = await profileAction.runProfileAction(
      setAssistantCustomization(payload)
    );

    if (!nextProfile) {
      throw new Error(copy.saveError);
    }

    return nextProfile;
  };

  const updateFrictionSelections = (
    nextFrictions: Exclude<AssistantDietFriction, "unknown">[]
  ) => {
    void commitAssistantCustomization({
      onboarding: {
        ...assistant.onboarding,
        mainFriction: nextFrictions[0] ?? "unknown",
        mainFrictions: nextFrictions,
      },
    }).catch(() => undefined);
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
    }).catch(() => undefined);
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

        {profileAction.saving ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {copy.saving}
          </Alert>
        ) : null}

        {profileAction.hasError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }} onClose={profileAction.clearError}>
            {copy.saveError}
          </Alert>
        ) : null}

        <Paper
          variant="outlined"
          data-assistant-customization-worker-card="true"
          sx={{
            p: { xs: 1.6, md: 2 },
            borderRadius: 1,
            borderColor: "rgba(20, 184, 166, 0.28)",
            background:
              "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(132,204,22,0.08))",
          }}
        >
          <Stack spacing={1.4}>
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 950 }}>
                {copy.workerTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.workerSubtitle}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              data-assistant-customization-worker-toolbelt="true"
            >
              {copy.workerTools.map((tool, index) => {
                const ToolIcon = getAssistantWorkerToolIcon(index);

                return (
                  <Chip
                    key={tool}
                    icon={<ToolIcon size={15} />}
                    label={tool}
                    variant="outlined"
                    sx={{
                      minHeight: 34,
                      borderColor: "rgba(20, 184, 166, 0.34)",
                      color: "text.primary",
                      fontWeight: 900,
                      "& .MuiChip-icon": {
                        color: "var(--sn-accent-strong)",
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>
        </Paper>

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
            label={copy.role}
            value={assistant.role}
            disabled={profileAction.saving}
            onChange={(event) =>
              void commitAssistantCustomization({
                role: event.target.value as "friend" | "assistant" | "coach",
              }).catch(() => undefined)
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
            disabled={profileAction.saving}
            onChange={(event) =>
              void commitAssistantCustomization({
                tone: event.target.value as AssistantTone,
                assistantPersonality: event.target.value as AssistantTone,
              }).catch(() => undefined)
            }
          >
            <MenuItem value="gentle">{copy.toneGentle}</MenuItem>
            <MenuItem value="focused">{copy.toneFocused}</MenuItem>
            <MenuItem value="scientific">{copy.toneScientific}</MenuItem>
            <MenuItem value="playful">{copy.tonePlayful}</MenuItem>
          </TextField>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box
            sx={{
              width: 136,
              height: 136,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 58%, rgba(163,230,53,0.2), transparent 46%), radial-gradient(circle at 50% 50%, rgba(45,212,191,0.14), transparent 70%)",
              boxShadow:
                "0 18px 46px rgba(15,118,110,0.2), inset 0 0 32px rgba(255,255,255,0.08)",
            }}
          >
            <AssistantAvatar
              name={assistantDisplayName}
              variant={assistant.companionKind}
              size={136}
              mood="happy"
              renderMode={companionRenderModePreference.value}
              loadingFallback={
                <Companion3DLoadingFallback
                  label={copy.renderModeLoading}
                  size={136}
                />
              }
              on3dLoadError={companionRenderModePreference.mark3dRuntimeError}
              active
            />
          </Box>
          <Stack spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900 }}>
              {copy.appearanceTitle}
            </Typography>
            <Typography color="text.secondary">
              {getCompanionLabel(copy, assistant.companionKind)} · {assistantDisplayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {copy.appearanceHint}
            </Typography>
            {companionRenderModePreference.hasError ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                {copy.renderModeError}
              </Alert>
            ) : null}
          </Stack>
        </Stack>

        <CompanionProgressCard embedded />

        <BoxHeader title={copy.memoryTitle} subtitle={copy.memorySubtitle} />

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{copy.mainFriction}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={selectedFrictions.length === frictionOptions.length ? "contained" : "outlined"}
              disabled={profileAction.saving}
              onClick={() => updateFrictionSelections(frictionOptions.filter((friction) => friction !== "unknown"))}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.selectAll}
            </Button>
            <Button
              variant="outlined"
              disabled={profileAction.saving}
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
                    disabled={profileAction.saving}
                    onClick={() =>
                      updateFrictionSelections(
                        selected
                          ? selectedFrictions.filter((item) => item !== friction)
                          : [...selectedFrictions, friction]
                      )
                    }
                    sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                  >
                    {getFrictionLabel(copy, friction)}
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
              disabled={profileAction.saving}
              onClick={() => updateMotivationSelections([...motivationStyleOptions])}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {copy.selectAll}
            </Button>
            <Button
              variant="outlined"
              disabled={profileAction.saving}
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
                  disabled={profileAction.saving}
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
              disabled={profileAction.saving}
              onChange={(_, checked) =>
                void commitAssistantCustomization({ humorEnabled: checked }).catch(() => undefined)
              }
            />
          }
          label={copy.humor}
        />

        <FormControlLabel
          control={
            <Switch
              checked={assistant.widgetEnabled}
              disabled={profileAction.saving}
              onChange={(_, checked) =>
                void commitAssistantCustomization({ widgetEnabled: checked }).catch(() => undefined)
              }
            />
          }
          label={copy.widget}
        />

        <FormControlLabel
          control={
            <Switch
              checked={assistant.proactiveHintsEnabled}
              disabled={!assistant.widgetEnabled || profileAction.saving}
              onChange={(_, checked) =>
                void commitAssistantCustomization({ proactiveHintsEnabled: checked }).catch(() => undefined)
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
