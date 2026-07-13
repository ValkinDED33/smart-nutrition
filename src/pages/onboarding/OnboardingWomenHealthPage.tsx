import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import type {
  ChineseZodiacSign,
  EyeColor,
  WomenHealthMode,
  ZodiacSign,
} from "@domain/profile/types";
import {
  chineseZodiacSigns,
  eyeColors,
  zodiacSigns,
} from "@domain/profile/womenHealth";
import {
  cardSx,
  parseOnboardingNumber,
  sanitizeOnboardingIntegerInput,
  selectOnboardingInputValue,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

const copy = {
  uk: {
    title: "Чи потрібен режим жіночого здоров'я?",
    body:
      "Якщо ви готуєтесь до вагітності або вже вагітні, помічник буде обережніше працювати з харчуванням, ліками, водою і нагадуваннями.",
    pregnancyBlockTitle: "Блок вагітності",
    pregnancyBlockBody:
      "Якщо це актуально, я збережу термін, орієнтовну дату пологів і план лікаря. Партнерський доступ показує тільки розвиток вагітності, без ваги, харчування чи приватних нотаток.",
    pregnancyData: "Термін, дата пологів, цикл і медичний план",
    pregnancyPrivate: "Приватні дані не відкриваються партнеру",
    familyPreviewTitle: "Сімейний прогноз",
    familyPreviewBody:
      "Можна додати колір очей і знаки обох партнерів. Колір очей буде показано як приблизну оцінку, а характер — як теплий ігровий шар.",
    motherEyeColor: "Очі мами",
    fatherEyeColor: "Очі тата",
    motherZodiac: "Знак мами",
    fatherZodiac: "Знак тата",
    motherChineseZodiac: "Рік мами",
    fatherChineseZodiac: "Рік тата",
    familyPreviewSafety:
      "Це не УЗД, не генетичний тест і не висновок лікаря. Стать чесно не прогнозується з профілю батьків.",
    none: "Не потрібно",
    trying: "Готуюся до вагітності",
    pregnant: "Вагітна",
    postpartum: "Після пологів",
    week: "Орієнтовний тиждень",
    dueDate: "Орієнтовна дата пологів",
    lastPeriod: "Дата останньої менструації",
    confirmed: "Є підтвердження / план від лікаря",
    notes: "Що важливо пам'ятати?",
    notesPlaceholder: "Наприклад: не радити добавки без лікаря",
    safety:
      "Помічник не змінює дозування, не призначає ліки і не замінює лікаря. Він лише нагадує та допомагає структурувати день.",
  },
  pl: {
    title: "Czy potrzebujesz trybu zdrowia kobiet?",
    body:
      "Jeśli przygotowujesz się do ciąży albo jesteś w ciąży, asystent będzie ostrożniej prowadził żywienie, leki, wodę i przypomnienia.",
    pregnancyBlockTitle: "Blok ciąży",
    pregnancyBlockBody:
      "Jeśli to aktualne, zapiszę tydzień, przewidywany termin porodu i plan lekarza. Dostęp partnera pokazuje tylko rozwój ciąży, bez wagi, jedzenia i prywatnych notatek.",
    pregnancyData: "Tydzień, termin porodu, cykl i plan medyczny",
    pregnancyPrivate: "Dane prywatne nie są udostępniane partnerowi",
    familyPreviewTitle: "Podgląd rodzinny",
    familyPreviewBody:
      "Możesz dodać kolor oczu i znaki obojga partnerów. Kolor oczu pokażemy jako przybliżoną ocenę, a charakter jako ciepłą warstwę zabawową.",
    motherEyeColor: "Oczy mamy",
    fatherEyeColor: "Oczy taty",
    motherZodiac: "Znak mamy",
    fatherZodiac: "Znak taty",
    motherChineseZodiac: "Rok mamy",
    fatherChineseZodiac: "Rok taty",
    familyPreviewSafety:
      "To nie jest USG, test genetyczny ani wniosek lekarza. Płci nie przewidujemy uczciwie z profilu rodziców.",
    none: "Nie dotyczy",
    trying: "Przygotowuję się do ciąży",
    pregnant: "Jestem w ciąży",
    postpartum: "Po porodzie",
    week: "Orientacyjny tydzień",
    dueDate: "Przewidywany termin porodu",
    lastPeriod: "Data ostatniej miesiączki",
    confirmed: "Mam potwierdzenie / plan od lekarza",
    notes: "Co warto pamiętać?",
    notesPlaceholder: "Np. nie sugerować suplementów bez lekarza",
    safety:
      "Asystent nie zmienia dawek, nie przepisuje leków i nie zastępuje lekarza. Pomaga tylko przypominać i porządkować dzień.",
  },
  en: {
    title: "Do you need women health mode?",
    body:
      "If you are preparing for pregnancy or already pregnant, the assistant will handle nutrition, medication, water, and reminders more carefully.",
    pregnancyBlockTitle: "Pregnancy block",
    pregnancyBlockBody:
      "If this is relevant, I will save week, estimated due date, and clinician plan. Partner access shows only pregnancy development, not weight, food, or private notes.",
    pregnancyData: "Week, due date, cycle, and clinician plan",
    pregnancyPrivate: "Private data is not shared with a partner",
    familyPreviewTitle: "Family preview",
    familyPreviewBody:
      "You can add both partners' eye colors and signs. Eye color is shown as a rough estimate, while personality is a warm playful layer.",
    motherEyeColor: "Mother eyes",
    fatherEyeColor: "Father eyes",
    motherZodiac: "Mother zodiac",
    fatherZodiac: "Father zodiac",
    motherChineseZodiac: "Mother birth year",
    fatherChineseZodiac: "Father birth year",
    familyPreviewSafety:
      "This is not ultrasound, a genetic test, or a clinician result. Sex is not honestly predicted from parent profile data.",
    none: "Not needed",
    trying: "Preparing for pregnancy",
    pregnant: "Pregnant",
    postpartum: "Postpartum",
    week: "Estimated week",
    dueDate: "Estimated due date",
    lastPeriod: "Last period start date",
    confirmed: "Doctor confirmation / plan exists",
    notes: "What should I remember?",
    notesPlaceholder: "For example: do not suggest supplements without clinician",
    safety:
      "The assistant does not change dosages, prescribe medication, or replace a clinician. It only reminds and helps structure the day.",
  },
} as const;

type WomenHealthCopy = (typeof copy)[AppLanguage];

const getWomenHealthCopy = (language: AppLanguage): WomenHealthCopy => {
  switch (language) {
    case "pl":
      return copy.pl;
    case "en":
      return copy.en;
    case "uk":
    default:
      return copy.uk;
  }
};

const getModeOptionLabel = (
  text: WomenHealthCopy,
  labelKey: (typeof modeOptions)[number]["labelKey"]
) => {
  switch (labelKey) {
    case "trying":
      return text.trying;
    case "pregnant":
      return text.pregnant;
    case "postpartum":
      return text.postpartum;
    case "none":
    default:
      return text.none;
  }
};

const modeOptions: Array<{ id: WomenHealthMode; labelKey: keyof typeof copy.uk }> = [
  { id: "none", labelKey: "none" },
  { id: "trying_to_conceive", labelKey: "trying" },
  { id: "pregnant", labelKey: "pregnant" },
  { id: "postpartum", labelKey: "postpartum" },
];

const eyeColorOptions: EyeColor[] = eyeColors;
const zodiacOptions: ZodiacSign[] = zodiacSigns;
const chineseZodiacOptions: ChineseZodiacSign[] = chineseZodiacSigns;

const UK_NOT_SET = "Не вказано";
const PL_NOT_SET = "Nie podano";

const valueLabels = {
  uk: {
    eyeColor: {
      unknown: UK_NOT_SET,
      brown: "Карі",
      blue: "Блакитні",
      green: "Зелені",
      gray: "Сірі",
      hazel: "Горіхові",
      amber: "Бурштинові",
      other: "Інші",
    },
    zodiac: {
      unknown: UK_NOT_SET,
      aries: "Овен",
      taurus: "Телець",
      gemini: "Близнюки",
      cancer: "Рак",
      leo: "Лев",
      virgo: "Діва",
      libra: "Терези",
      scorpio: "Скорпіон",
      sagittarius: "Стрілець",
      capricorn: "Козеріг",
      aquarius: "Водолій",
      pisces: "Риби",
    },
    chineseZodiac: {
      unknown: UK_NOT_SET,
      rat: "Щур",
      ox: "Бик",
      tiger: "Тигр",
      rabbit: "Кролик",
      dragon: "Дракон",
      snake: "Змія",
      horse: "Кінь",
      goat: "Коза",
      monkey: "Мавпа",
      rooster: "Півень",
      dog: "Собака",
      pig: "Свиня",
    },
  },
  pl: {
    eyeColor: {
      unknown: PL_NOT_SET,
      brown: "Brązowe",
      blue: "Niebieskie",
      green: "Zielone",
      gray: "Szare",
      hazel: "Piwne",
      amber: "Bursztynowe",
      other: "Inne",
    },
    zodiac: {
      unknown: PL_NOT_SET,
      aries: "Baran",
      taurus: "Byk",
      gemini: "Bliźnięta",
      cancer: "Rak",
      leo: "Lew",
      virgo: "Panna",
      libra: "Waga",
      scorpio: "Skorpion",
      sagittarius: "Strzelec",
      capricorn: "Koziorożec",
      aquarius: "Wodnik",
      pisces: "Ryby",
    },
    chineseZodiac: {
      unknown: PL_NOT_SET,
      rat: "Szczur",
      ox: "Wół",
      tiger: "Tygrys",
      rabbit: "Królik",
      dragon: "Smok",
      snake: "Wąż",
      horse: "Koń",
      goat: "Koza",
      monkey: "Małpa",
      rooster: "Kogut",
      dog: "Pies",
      pig: "Świnia",
    },
  },
  en: {
    eyeColor: {
      unknown: "Not set",
      brown: "Brown",
      blue: "Blue",
      green: "Green",
      gray: "Gray",
      hazel: "Hazel",
      amber: "Amber",
      other: "Other",
    },
    zodiac: {
      unknown: "Not set",
      aries: "Aries",
      taurus: "Taurus",
      gemini: "Gemini",
      cancer: "Cancer",
      leo: "Leo",
      virgo: "Virgo",
      libra: "Libra",
      scorpio: "Scorpio",
      sagittarius: "Sagittarius",
      capricorn: "Capricorn",
      aquarius: "Aquarius",
      pisces: "Pisces",
    },
    chineseZodiac: {
      unknown: "Not set",
      rat: "Rat",
      ox: "Ox",
      tiger: "Tiger",
      rabbit: "Rabbit",
      dragon: "Dragon",
      snake: "Snake",
      horse: "Horse",
      goat: "Goat",
      monkey: "Monkey",
      rooster: "Rooster",
      dog: "Dog",
      pig: "Pig",
    },
  },
} as const;

const getValueLabels = (language: AppLanguage) =>
  language === "pl" ? valueLabels.pl : language === "en" ? valueLabels.en : valueLabels.uk;

const getEyeColorLabel = (language: AppLanguage, value: EyeColor) => {
  const labels = getValueLabels(language).eyeColor;

  switch (value) {
    case "brown":
      return labels.brown;
    case "blue":
      return labels.blue;
    case "green":
      return labels.green;
    case "gray":
      return labels.gray;
    case "hazel":
      return labels.hazel;
    case "amber":
      return labels.amber;
    case "other":
      return labels.other;
    case "unknown":
    default:
      return labels.unknown;
  }
};

const getZodiacLabel = (language: AppLanguage, value: ZodiacSign) => {
  const labels = getValueLabels(language).zodiac;

  switch (value) {
    case "aries":
      return labels.aries;
    case "taurus":
      return labels.taurus;
    case "gemini":
      return labels.gemini;
    case "cancer":
      return labels.cancer;
    case "leo":
      return labels.leo;
    case "virgo":
      return labels.virgo;
    case "libra":
      return labels.libra;
    case "scorpio":
      return labels.scorpio;
    case "sagittarius":
      return labels.sagittarius;
    case "capricorn":
      return labels.capricorn;
    case "aquarius":
      return labels.aquarius;
    case "pisces":
      return labels.pisces;
    case "unknown":
    default:
      return labels.unknown;
  }
};

const getChineseZodiacLabel = (
  language: AppLanguage,
  value: ChineseZodiacSign
) => {
  const labels = getValueLabels(language).chineseZodiac;

  switch (value) {
    case "rat":
      return labels.rat;
    case "ox":
      return labels.ox;
    case "tiger":
      return labels.tiger;
    case "rabbit":
      return labels.rabbit;
    case "dragon":
      return labels.dragon;
    case "snake":
      return labels.snake;
    case "horse":
      return labels.horse;
    case "goat":
      return labels.goat;
    case "monkey":
      return labels.monkey;
    case "rooster":
      return labels.rooster;
    case "dog":
      return labels.dog;
    case "pig":
      return labels.pig;
    case "unknown":
    default:
      return labels.unknown;
  }
};

export const OnboardingWomenHealthPage = ({
  state,
  updateState,
}: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { appLanguage, t } = useLanguage();
  const text = getWomenHealthCopy(appLanguage);
  const isPregnant = state.womenHealthMode === "pregnant";
  const usesCycleContext =
    state.womenHealthMode === "pregnant" ||
    state.womenHealthMode === "trying_to_conceive";
  const weekValue = useMemo(
    () => (state.pregnancyWeek ? String(state.pregnancyWeek) : ""),
    [state.pregnancyWeek]
  );

  const updateMode = (mode: WomenHealthMode) => {
    updateState({
      womenHealthMode: mode,
      pregnancyWeek: mode === "pregnant" ? state.pregnancyWeek : null,
      dueDate: mode === "pregnant" ? state.dueDate : "",
      lastPeriodStartDate:
        mode === "pregnant" || mode === "trying_to_conceive"
          ? state.lastPeriodStartDate
          : "",
      doctorConfirmed:
        mode === "pregnant" || mode === "trying_to_conceive"
          ? state.doctorConfirmed
          : false,
      womenHealthNotes: mode === "none" ? "" : state.womenHealthNotes,
    });
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {text.title}
            </Typography>
            <Typography color="text.secondary">{text.body}</Typography>
          </Stack>

          <Box
            data-onboarding-pregnancy-block="true"
            sx={{
              p: { xs: 1.6, sm: 2 },
              border: 1,
              borderColor: "rgba(20, 184, 166, 0.32)",
              borderRadius: 1,
              background:
                "linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(236, 72, 153, 0.08))",
            }}
          >
            <Stack spacing={1.2}>
              <Stack spacing={0.35}>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 950 }}>
                  {text.pregnancyBlockTitle}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                  {text.pregnancyBlockBody}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.7,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 999,
                    color: "text.secondary",
                    fontSize: 13,
                    fontWeight: 850,
                  }}
                >
                  {text.pregnancyData}
                </Box>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.7,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 999,
                    color: "text.secondary",
                    fontSize: 13,
                    fontWeight: 850,
                  }}
                >
                  {text.pregnancyPrivate}
                </Box>
              </Stack>
            </Stack>
          </Box>

          <Stack spacing={1.2}>
            {modeOptions.map((option) => (
              <Button
                key={option.id}
                variant={state.womenHealthMode === option.id ? "contained" : "outlined"}
                size="large"
                onClick={() => updateMode(option.id)}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                {getModeOptionLabel(text, option.labelKey)}
              </Button>
            ))}
          </Stack>

          {isPregnant && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                type="text"
                label={text.week}
                value={weekValue}
                onChange={(event) => {
                  const safeValue = sanitizeOnboardingIntegerInput(event.target.value, 2);
                  const parsed = parseOnboardingNumber(safeValue);
                  updateState({
                    pregnancyWeek:
                      parsed === null ? null : Math.max(1, Math.min(42, Math.round(parsed))),
                  });
                }}
                onFocus={(event) => selectOnboardingInputValue(event.target)}
                onClick={(event) => selectOnboardingInputValue(event.currentTarget)}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    enterKeyHint: "next",
                  },
                }}
              />
              <TextField
                fullWidth
                type="date"
                label={text.dueDate}
                value={state.dueDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => updateState({ dueDate: event.target.value })}
              />
            </Stack>
          )}

          {usesCycleContext && (
            <Stack spacing={1.2}>
              <TextField
                fullWidth
                type="date"
                label={text.lastPeriod}
                value={state.lastPeriodStartDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  updateState({ lastPeriodStartDate: event.target.value })
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.doctorConfirmed}
                    onChange={(event) =>
                      updateState({ doctorConfirmed: event.target.checked })
                    }
                  />
                }
                label={text.confirmed}
              />
            </Stack>
          )}

          {state.womenHealthMode !== "none" && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={text.notes}
              placeholder={text.notesPlaceholder}
              value={state.womenHealthNotes}
              onChange={(event) =>
                updateState({ womenHealthNotes: event.target.value.slice(0, 220) })
              }
            />
          )}

          {state.womenHealthMode !== "none" && (
            <Box
              data-onboarding-family-preview-block="true"
              sx={{
                p: { xs: 1.6, sm: 2 },
                border: 1,
                borderColor: "rgba(168, 85, 247, 0.28)",
                borderRadius: 1,
                background:
                  "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(20, 184, 166, 0.08))",
              }}
            >
              <Stack spacing={1.4}>
                <Stack spacing={0.35}>
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 950 }}>
                    {text.familyPreviewTitle}
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                    {text.familyPreviewBody}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.2,
                  }}
                >
                  <TextField
                    select
                    label={text.motherEyeColor}
                    value={state.motherEyeColor}
                    onChange={(event) =>
                      updateState({ motherEyeColor: event.target.value as EyeColor })
                    }
                  >
                    {eyeColorOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getEyeColorLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={text.fatherEyeColor}
                    value={state.partnerEyeColor}
                    onChange={(event) =>
                      updateState({ partnerEyeColor: event.target.value as EyeColor })
                    }
                  >
                    {eyeColorOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getEyeColorLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={text.motherZodiac}
                    value={state.motherZodiac}
                    onChange={(event) =>
                      updateState({ motherZodiac: event.target.value as ZodiacSign })
                    }
                  >
                    {zodiacOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getZodiacLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={text.fatherZodiac}
                    value={state.fatherZodiac}
                    onChange={(event) =>
                      updateState({ fatherZodiac: event.target.value as ZodiacSign })
                    }
                  >
                    {zodiacOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getZodiacLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={text.motherChineseZodiac}
                    value={state.motherChineseZodiac}
                    onChange={(event) =>
                      updateState({
                        motherChineseZodiac: event.target.value as ChineseZodiacSign,
                      })
                    }
                  >
                    {chineseZodiacOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getChineseZodiacLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={text.fatherChineseZodiac}
                    value={state.fatherChineseZodiac}
                    onChange={(event) =>
                      updateState({
                        fatherChineseZodiac: event.target.value as ChineseZodiacSign,
                      })
                    }
                  >
                    {chineseZodiacOptions.map((item) => (
                      <MenuItem key={item} value={item}>
                        {getChineseZodiacLabel(appLanguage, item)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Alert severity="info" sx={{ borderRadius: 1 }}>
                  {text.familyPreviewSafety}
                </Alert>
              </Stack>
            </Box>
          )}

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {text.safety}
          </Alert>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.gender)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.height)}
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
