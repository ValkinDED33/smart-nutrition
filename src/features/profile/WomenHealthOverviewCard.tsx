import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { WomenHealthMode, WomenHealthState } from "@domain/profile/types";
import { isWomenHealthVisibleForGender } from "@domain/profile/womenHealth";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CYCLE_DAYS = 28;
const DEFAULT_LUTEAL_DAYS = 14;

const womenHealthCopy = {
  uk: {
    title: "Жіночий ритм",
    subtitle:
      "Обережний центр циклу, вагітності або відновлення після пологів. Помічник використовує це як контекст для харчування, води і нагадувань.",
    hidden: "Блок доступний для жіночого профілю.",
    none: "Режим не ввімкнено",
    trying: "Підготовка до вагітності",
    pregnant: "Вагітність",
    postpartum: "Після пологів",
    cycleDay: "День циклу",
    fertileWindow: "Орієнтовне фертильне вікно",
    ovulation: "Орієнтовна овуляція",
    pregnancyWeek: "Тиждень",
    trimester: "Триместр",
    dueIn: "До орієнтовної дати",
    doctorPlan: "План лікаря",
    doctorYes: "підтверджено",
    doctorNo: "не вказано",
    notes: "Важливо пам'ятати",
    noNotes: "Нотаток поки немає.",
    nutrition: "Фокус харчування",
    hydration: "Вода і самопочуття",
    reminders: "Нагадування",
    safetyTitle: "Без медичних призначень",
    safety:
      "Ліки, добавки, дозування, сильний біль, кровотеча, запаморочення або тривожні симптоми перевіряються з лікарем.",
    tryingFocus:
      "Тримати регулярне харчування, білок, залізо/фолати тільки за підтвердженим планом і без жорстких дієт.",
    pregnantFocus:
      "Підказки мають бути м'якими: достатньо води, стабільні прийоми їжі, без самостійного підбору добавок.",
    postpartumFocus:
      "Фокус на відновленні, воді, регулярній їжі і дуже м'якому темпі без тиску на вагу.",
    cycleFocus:
      "Цикл може впливати на апетит, воду, вагу і енергію. Тренд важливіший за один день.",
    addContext: "Додайте дату останньої менструації або режим у профілі, щоб відкрити персональні підказки.",
    days: (value: number) => `${value} дн.`,
    dayRange: (from: number, to: number) => `${from}-${to} день`,
  },
  pl: {
    title: "Rytm kobiecy",
    subtitle:
      "Ostrożne centrum cyklu, ciąży albo regeneracji po porodzie. Asystent używa tego jako kontekstu dla jedzenia, wody i przypomnień.",
    hidden: "Blok jest dostępny dla profilu kobiecego.",
    none: "Tryb nie jest włączony",
    trying: "Przygotowanie do ciąży",
    pregnant: "Ciąża",
    postpartum: "Po porodzie",
    cycleDay: "Dzień cyklu",
    fertileWindow: "Orientacyjne okno płodne",
    ovulation: "Orientacyjna owulacja",
    pregnancyWeek: "Tydzień",
    trimester: "Trymestr",
    dueIn: "Do orientacyjnej daty",
    doctorPlan: "Plan lekarza",
    doctorYes: "potwierdzony",
    doctorNo: "brak",
    notes: "Ważny kontekst",
    noNotes: "Brak notatek.",
    nutrition: "Fokus żywienia",
    hydration: "Woda i samopoczucie",
    reminders: "Przypomnienia",
    safetyTitle: "Bez zaleceń medycznych",
    safety:
      "Leki, suplementy, dawki, silny ból, krwawienie, zawroty głowy lub niepokojące objawy konsultuj z lekarzem.",
    tryingFocus:
      "Utrzymaj regularne jedzenie, białko, żelazo/foliany tylko według potwierdzonego planu i bez ostrych diet.",
    pregnantFocus:
      "Wskazówki powinny być łagodne: woda, stabilne posiłki i bez samodzielnego dobierania suplementów.",
    postpartumFocus:
      "Fokus na regeneracji, wodzie, regularnym jedzeniu i bardzo łagodnym tempie bez presji na wagę.",
    cycleFocus:
      "Cykl może wpływać na apetyt, wodę, wagę i energię. Trend jest ważniejszy niż jeden dzień.",
    addContext: "Dodaj datę ostatniej miesiączki albo tryb w profilu, aby odblokować osobiste wskazówki.",
    days: (value: number) => `${value} dni`,
    dayRange: (from: number, to: number) => `${from}-${to} dzień`,
  },
  en: {
    title: "Women rhythm",
    subtitle:
      "A careful center for cycle, pregnancy, or postpartum recovery. The assistant uses this as context for food, water, and reminders.",
    hidden: "This block is available for female profiles.",
    none: "Mode is not enabled",
    trying: "Preparing for pregnancy",
    pregnant: "Pregnancy",
    postpartum: "Postpartum",
    cycleDay: "Cycle day",
    fertileWindow: "Estimated fertile window",
    ovulation: "Estimated ovulation",
    pregnancyWeek: "Week",
    trimester: "Trimester",
    dueIn: "Until estimated date",
    doctorPlan: "Clinician plan",
    doctorYes: "confirmed",
    doctorNo: "not set",
    notes: "Important context",
    noNotes: "No notes yet.",
    nutrition: "Nutrition focus",
    hydration: "Water and wellbeing",
    reminders: "Reminders",
    safetyTitle: "No medical prescriptions",
    safety:
      "Medication, supplements, dosages, severe pain, bleeding, dizziness, or worrying symptoms must be checked with a clinician.",
    tryingFocus:
      "Keep regular meals, protein, iron/folate only from a confirmed plan, and avoid harsh dieting.",
    pregnantFocus:
      "Guidance should stay gentle: enough water, stable meals, and no self-prescribed supplements.",
    postpartumFocus:
      "Focus on recovery, water, regular meals, and a very gentle pace without weight pressure.",
    cycleFocus:
      "Cycle can affect appetite, water, weight, and energy. The trend matters more than one day.",
    addContext: "Add last period date or mode in profile to unlock personal guidance.",
    days: (value: number) => `${value} days`,
    dayRange: (from: number, to: number) => `day ${from}-${to}`,
  },
} as const;

type WomenHealthCopy = (typeof womenHealthCopy)[AppLanguage];

const getWomenHealthCopy = (language: AppLanguage): WomenHealthCopy => {
  switch (language) {
    case "pl":
      return womenHealthCopy.pl;
    case "en":
      return womenHealthCopy.en;
    case "uk":
    default:
      return womenHealthCopy.uk;
  }
};

const getModeLabel = (copy: WomenHealthCopy, mode: WomenHealthMode) => {
  switch (mode) {
    case "trying_to_conceive":
      return copy.trying;
    case "pregnant":
      return copy.pregnant;
    case "postpartum":
      return copy.postpartum;
    case "none":
    default:
      return copy.none;
  }
};

const getDaysFromIso = (value: string | null) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.floor((Date.now() - timestamp) / DAY_MS);
};

const getDaysUntilIso = (value: string | null) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.max(0, Math.ceil((timestamp - Date.now()) / DAY_MS));
};

const getCycleDay = (lastPeriodStartDate: string | null) => {
  const elapsedDays = getDaysFromIso(lastPeriodStartDate);

  if (elapsedDays === null || elapsedDays < 0) {
    return null;
  }

  return (elapsedDays % DEFAULT_CYCLE_DAYS) + 1;
};

const getTrimester = (week: number | null) => {
  if (!week) {
    return null;
  }

  if (week <= 13) {
    return 1;
  }

  if (week <= 27) {
    return 2;
  }

  return 3;
};

const getFocusText = (copy: WomenHealthCopy, state: WomenHealthState) => {
  switch (state.mode) {
    case "trying_to_conceive":
      return copy.tryingFocus;
    case "pregnant":
      return copy.pregnantFocus;
    case "postpartum":
      return copy.postpartumFocus;
    case "none":
    default:
      return copy.cycleFocus;
  }
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const WomenHealthOverviewCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const womenHealth = useSelector((state: RootState) => state.profile.womenHealth);
  const { appLanguage } = useLanguage();
  const copy = getWomenHealthCopy(appLanguage);

  if (!isWomenHealthVisibleForGender(user?.gender)) {
    return null;
  }

  const cycleDay = getCycleDay(womenHealth.lastPeriodStartDate);
  const trimester = getTrimester(womenHealth.pregnancyWeek);
  const dueInDays = getDaysUntilIso(womenHealth.dueDate);
  const pregnancyProgress = womenHealth.pregnancyWeek
    ? clampPercent((womenHealth.pregnancyWeek / 40) * 100)
    : 0;
  const cycleProgress = cycleDay ? clampPercent((cycleDay / DEFAULT_CYCLE_DAYS) * 100) : 0;
  const ovulationDay = DEFAULT_CYCLE_DAYS - DEFAULT_LUTEAL_DAYS;
  const fertileFrom = Math.max(1, ovulationDay - 5);
  const fertileTo = Math.min(DEFAULT_CYCLE_DAYS, ovulationDay + 1);
  const hasPersonalContext =
    womenHealth.mode !== "none" ||
    Boolean(womenHealth.lastPeriodStartDate) ||
    Boolean(womenHealth.pregnancyWeek) ||
    Boolean(womenHealth.notes);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        background:
          "linear-gradient(135deg, rgba(236, 72, 153, 0.09), rgba(20, 184, 166, 0.08))",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {copy.subtitle}
          </Typography>
        </Stack>

        {!hasPersonalContext && <Alert severity="info">{copy.addContext}</Alert>}

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip color="secondary" label={getModeLabel(copy, womenHealth.mode)} />
          <Chip
            label={`${copy.doctorPlan}: ${
              womenHealth.doctorConfirmed ? copy.doctorYes : copy.doctorNo
            }`}
            color={womenHealth.doctorConfirmed ? "success" : "default"}
            variant="outlined"
          />
          {cycleDay && <Chip label={`${copy.cycleDay}: ${cycleDay}`} variant="outlined" />}
          {womenHealth.pregnancyWeek && (
            <Chip
              label={`${copy.pregnancyWeek}: ${womenHealth.pregnancyWeek}`}
              color="primary"
              variant="outlined"
            />
          )}
          {trimester && <Chip label={`${copy.trimester}: ${trimester}`} variant="outlined" />}
          {dueInDays !== null && <Chip label={`${copy.dueIn}: ${copy.days(dueInDays)}`} />}
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 1.4,
          }}
        >
          <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 850 }}>{copy.cycleDay}</Typography>
              <Typography color="text.secondary">
                {cycleDay ? `${cycleDay} / ${DEFAULT_CYCLE_DAYS}` : copy.addContext}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={cycleProgress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  "& .MuiLinearProgress-bar": { backgroundColor: "#ec4899" },
                }}
              />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 850 }}>{copy.fertileWindow}</Typography>
              <Typography color="text.secondary">{copy.dayRange(fertileFrom, fertileTo)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {copy.ovulation}: {ovulationDay}
              </Typography>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 850 }}>{copy.pregnancyWeek}</Typography>
              <Typography color="text.secondary">
                {womenHealth.pregnancyWeek
                  ? `${womenHealth.pregnancyWeek} / 40`
                  : getModeLabel(copy, womenHealth.mode)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={pregnancyProgress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  "& .MuiLinearProgress-bar": { backgroundColor: "#14b8a6" },
                }}
              />
            </Stack>
          </Paper>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 1.4,
          }}
        >
          {[copy.nutrition, copy.hydration, copy.reminders].map((label) => (
            <Paper key={label} variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
              <Stack spacing={0.8}>
                <Typography sx={{ fontWeight: 850 }}>{label}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                  {getFocusText(copy, womenHealth)}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
          <Stack spacing={0.8}>
            <Typography sx={{ fontWeight: 850 }}>{copy.notes}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {womenHealth.notes || copy.noNotes}
            </Typography>
          </Stack>
        </Paper>

        <Alert severity="warning">
          <Typography sx={{ fontWeight: 850 }}>{copy.safetyTitle}</Typography>
          <Typography variant="body2">{copy.safety}</Typography>
        </Alert>
      </Stack>
    </Paper>
  );
};

export default WomenHealthOverviewCard;
