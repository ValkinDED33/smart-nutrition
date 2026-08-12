import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { LanguageMenuButton } from "@shared/components/LanguageMenuButton";
import { companionShopCatalog } from "../../companion";
import { useLanguage } from "../../shared/language";
import type { AssistantCompanionKind } from "@domain/profile/types";
import type { AppLanguage } from "../../shared/types/i18n";
import {
  cardSx,
  shellSx,
  stepPaths,
  type PersonalityPreset,
  type OnboardingStepProps,
} from "./types";

const assistantAvatarLabels = {
  uk: {
    cat: "Кіт",
    dog: "Собака",
    fox: "Лис",
    panda: "Панда",
    owl: "Сова",
    dragon: "Дракон",
    robot: "Робот",
    human: "Тренер",
    capybara: "Капібара",
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
  pl: {
    cat: "Kot",
    dog: "Pies",
    fox: "Lis",
    panda: "Panda",
    owl: "Sowa",
    dragon: "Smok",
    robot: "Robot",
    human: "Trener",
    capybara: "Kapibara",
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
  en: {
    cat: "Cat",
    dog: "Dog",
    fox: "Fox",
    panda: "Panda",
    owl: "Owl",
    dragon: "Dragon",
    robot: "Robot",
    human: "Trainer",
    capybara: "Capybara",
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
} as const;

type AssistantAvatarLabels = (typeof assistantAvatarLabels)[keyof typeof assistantAvatarLabels];

const getAssistantAvatarLabels = (
  language: AppLanguage
): AssistantAvatarLabels => {
  switch (language) {
    case "uk":
      return assistantAvatarLabels.uk;
    case "pl":
      return assistantAvatarLabels.pl;
    case "en":
    default:
      return assistantAvatarLabels.en;
  }
};

const getAssistantAvatarLabel = (
  labels: AssistantAvatarLabels,
  avatar: AssistantCompanionKind
): string => {
  switch (avatar) {
    case "dog":
      return labels.dog;
    case "fox":
      return labels.fox;
    case "panda":
      return labels.panda;
    case "owl":
      return labels.owl;
    case "dragon":
      return labels.dragon;
    case "robot":
      return labels.robot;
    case "human":
      return labels.human;
    case "capybara":
      return labels.capybara;
    case "raccoon":
      return labels.raccoon;
    case "corgi":
      return labels.corgi;
    case "wolf":
      return labels.wolf;
    case "tiger":
      return labels.tiger;
    case "bear":
      return labels.bear;
    case "rabbit":
      return labels.rabbit;
    case "chameleon":
      return labels.chameleon;
    case "lion":
      return labels.lion;
    case "otter":
      return labels.otter;
    case "hedgehog":
      return labels.hedgehog;
    case "koala":
      return labels.koala;
    case "deer":
      return labels.deer;
    case "turtle":
      return labels.turtle;
    case "axolotl":
      return labels.axolotl;
    case "phoenix":
      return labels.phoenix;
    case "forest_spirit":
      return labels.forest_spirit;
    case "cosmic_beast":
      return labels.cosmic_beast;
    case "cat":
    default:
      return labels.cat;
  }
};

const ASSISTANT_PREVIEW_FALLBACK_NAME = "Smart Nutrition";

const assistantWorkerCopy = {
  uk: {
    title: "Це твій AI-працівник, не просто картинка",
    body:
      "Образ можна змінювати, але мозок один: він працює з їжею, водою, ліками, тиском, родиною, фото, задачами й Telegram.",
    freeOnly: "На старті доступні тільки безкоштовні базові образи. Колекція відкриється в профілі.",
    tools: ["Їжа", "Вода", "Ліки", "Тиск", "Фото", "Telegram", "Родина"],
  },
  pl: {
    title: "To twój pracownik AI, nie tylko obrazek",
    body:
      "Wygląd można zmieniać, ale mózg jest jeden: pracuje z jedzeniem, wodą, lekami, ciśnieniem, rodziną, zdjęciami, zadaniami i Telegramem.",
    freeOnly: "Na start dostępne są tylko darmowe bazowe wyglądy. Kolekcja otworzy się w profilu.",
    tools: ["Jedzenie", "Woda", "Leki", "Ciśnienie", "Zdjęcia", "Telegram", "Rodzina"],
  },
  en: {
    title: "This is your AI worker, not just a picture",
    body:
      "You can change the look, but the brain stays one: it works with food, water, medication, pressure, family, photos, tasks, and Telegram.",
    freeOnly: "Only free base looks are available at setup. The full collection opens in profile.",
    tools: ["Food", "Water", "Medication", "Pressure", "Photos", "Telegram", "Family"],
  },
} as const;

type AssistantWorkerCopy = (typeof assistantWorkerCopy)[keyof typeof assistantWorkerCopy];

const getAssistantWorkerCopy = (language: AppLanguage): AssistantWorkerCopy => {
  switch (language) {
    case "pl":
      return assistantWorkerCopy.pl;
    case "en":
      return assistantWorkerCopy.en;
    case "uk":
    default:
      return assistantWorkerCopy.uk;
  }
};

const getAssistantPreviewName = (selectedName: string) => {
  const trimmedName = selectedName.trim();

  if (trimmedName.length > 0) {
    return trimmedName;
  }

  return ASSISTANT_PREVIEW_FALLBACK_NAME;
};

const getLocalizedCatalogText = (
  value: Record<AppLanguage, string>,
  language: AppLanguage
) => {
  switch (language) {
    case "pl":
      return value.pl;
    case "en":
      return value.en;
    case "uk":
    default:
      return value.uk;
  }
};

const freeAssistantAvatarItems = companionShopCatalog.filter(
  (item) =>
    item.available &&
    item.slot === "companion" &&
    item.price === 0 &&
    Boolean(item.companionKind)
);

export const OnboardingAssistantPage = ({ state, updateState }: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();
  const avatarLabels = getAssistantAvatarLabels(appLanguage);
  const workerCopy = getAssistantWorkerCopy(appLanguage);
  const previewName = getAssistantPreviewName(state.assistantName);
  const personalityOptions: PersonalityPreset[] = [
    "supportive",
    "strict",
    "scientific",
    "energetic",
  ];

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <AssistantAvatar name={previewName} variant={state.assistantAvatar} mood="happy" size={96} />
            <Stack spacing={0.8}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
                {t("onboarding.assistantTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.08rem", lineHeight: 1.55 }}>
                {t("onboarding.assistantBody")}
              </Typography>
            </Stack>
          </Stack>

          <Paper
            elevation={0}
            data-onboarding-assistant-worker-tools="true"
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              background:
                "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(132,204,22,0.08)), var(--sn-surface-glass)",
            }}
          >
            <Stack spacing={1.2}>
              <Typography sx={{ fontWeight: 950 }}>{workerCopy.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {workerCopy.body}
              </Typography>
              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                {workerCopy.tools.map((tool) => (
                  <Chip
                    key={tool}
                    label={tool}
                    size="small"
                    sx={{
                      fontWeight: 850,
                      color: "var(--sn-on-surface)",
                      backgroundColor: "var(--sn-accent-soft)",
                    }}
                  />
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {workerCopy.freeOnly}
              </Typography>
            </Stack>
          </Paper>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.avatarQuestion")}</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              {freeAssistantAvatarItems.map((item) => {
                const avatar = item.companionKind as AssistantCompanionKind;

                return (
                <Button
                  key={item.id}
                  variant={state.assistantAvatar === avatar ? "contained" : "outlined"}
                  onClick={() =>
                    updateState({
                      assistantAvatar: avatar,
                    })
                  }
                  sx={{
                    minHeight: 92,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  <Stack spacing={0.7} alignItems="center">
                    <AssistantAvatar
                      name={previewName}
                      variant={avatar}
                      mood="happy"
                      size={42}
                    />
                    <span>{getLocalizedCatalogText(item.title, appLanguage)}</span>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: state.assistantAvatar === avatar ? "inherit" : "text.secondary",
                        lineHeight: 1.25,
                      }}
                    >
                      {getAssistantAvatarLabel(avatarLabels, avatar)} ·{" "}
                      {getLocalizedCatalogText(item.tagLabel, appLanguage)}
                    </Typography>
                  </Stack>
                </Button>
                );
              })}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.personalityQuestion")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {personalityOptions.map((personality) => (
                <Button
                  key={personality}
                  variant={state.personality === personality ? "contained" : "outlined"}
                  onClick={() => updateState({ personality })}
                  sx={{ flex: 1, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                >
                  {t(`assistant.style.${personality}`)}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.assistantQuestion")}</Typography>
            <TextField
              autoFocus
              fullWidth
              value={state.assistantName}
              placeholder={t("onboarding.assistantPlaceholder")}
              onChange={(event) => updateState({ assistantName: event.target.value })}
              inputProps={{ maxLength: 32 }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{t("onboarding.languageTitle")}</Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <LanguageMenuButton
                id="onboarding-language-menu-button"
                value={appLanguage}
                labels={languageLabels}
                ariaLabel={t("navigation.languageAria")}
                onChange={setLanguage}
                sx={{
                  minWidth: 104,
                  borderRadius: 1,
                  justifyContent: "center",
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.name)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
