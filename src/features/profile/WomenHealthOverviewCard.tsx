import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import type {
  ChineseZodiacSign,
  EyeColor,
  WomenHealthMode,
  WomenHealthState,
  ZodiacSign,
} from "@domain/profile/types";
import { buildBabyPreview } from "@domain/profile/babyPreview";
import {
  chineseZodiacSigns,
  eyeColors,
  getEffectivePregnancyWeek,
  isWomenHealthVisibleForGender,
  zodiacSigns,
} from "@domain/profile/womenHealth";
import {
  buildProfileStateAfterAction,
  saveProfileStateToCloud,
} from "./profileCloudSync";
import {
  replaceProfileState,
  updatePersonalDetails,
  updateWomenHealth,
} from "./profileSlice";
import {
  acceptRemotePartnerInvite,
  createRemotePartnerInvite,
  fetchRemotePartnerPregnancyShares,
  type PartnerInviteResult,
  type PartnerPregnancyShare,
} from "@shared/api/authRemote";
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
    pregnancyTitle: "Вагітність",
    pregnancySubtitle:
      "Окремий простір для терміну, триместру, дати пологів, м'яких підказок і сімейного доступу.",
    pregnancyNotEnabled:
      "Увімкніть режим вагітності або підготовки в редагуванні профілю, щоб відкрити цей блок.",
    pregnancyTimeline: "Прогрес вагітності",
    pregnancySafety:
      "Підказки тут не замінюють лікаря: добавки, дозування, біль, кровотеча або тривожні симптоми тільки через медичного спеціаліста.",
    babyPreviewTitle: "Майбутній малюк",
    babyPreviewSubtitle:
      "М'який сімейний прогноз за даними пари: колір очей як спрощена генетична оцінка, характер як ігровий шар.",
    motherEyeColor: "Очі мами",
    fatherEyeColor: "Очі тата",
    motherZodiac: "Знак мами",
    fatherZodiac: "Знак тата",
    motherChineseZodiac: "Рік мами",
    fatherChineseZodiac: "Рік тата",
    saveBabyPreview: "Зберегти прогноз",
    babyPreviewSaved: "Дані прогнозу збережено.",
    babyPreviewError: "Не вдалося зберегти прогноз у хмарі.",
    eyeChanceTitle: "Ймовірність кольору очей",
    eyeChanceMissing: "Укажіть колір очей обох партнерів, щоб побачити оцінку.",
    sexChanceTitle: "Дівчинка / хлопчик",
    sexChanceBody:
      "За профілем батьків це не прогнозується чесно, тому показуємо базово 50% / 50%. Це не УЗД і не висновок лікаря.",
    playfulTraitsTitle: "Можливі риси",
    playfulTraitsMissing: "Додайте знаки або роки народження, щоб побачити ігровий опис.",
    babyPreviewDisclaimer:
      "Це не медичний і не генетичний висновок. Колір очей є спрощеною оцінкою, стать не прогнозується за профілем, знаки — лише розважальний шар.",
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
    symptomHistoryTitle: "Журнал самопочуття",
    symptomHistorySubtitle:
      "Останні симптоми, які ви або помічник зберегли в хмарному профілі.",
    symptomHistoryEmpty:
      "Поки немає записів. Можна сказати помічнику: \"болить голова 6 з 10\", і він збереже це як контекст.",
    symptomSeverity: "Інтенсивність",
    symptomSourceAssistant: "помічник",
    symptomSourceManual: "вручну",
    symptomSafetyNote:
      "Це журнал спостережень, не діагноз. Сильний біль, кровотеча, запаморочення або швидке погіршення — привід звернутися до лікаря.",
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
    partnerTitle: "Сімейний доступ",
    partnerHelp:
      "Партнер бачить тільки термін вагітності, розвиток малюка і орієнтовну дату. Харчування, вага, нотатки і приватний профіль не передаються.",
    createPartnerInvite: "Підключити партнера",
    acceptPartnerInvite: "Прийняти код партнера",
    partnerCode: "Код",
    partnerLink: "Посилання",
    partnerInviteReady: "Запрошення створено. Код діє 7 днів.",
    partnerCodeLabel: "Код SN-...",
    partnerConnected: "Профілі підключені",
    partnerEmpty: "Партнерських даних поки немає.",
    babySize: "Орієнтовний розмір",
    copy: "Копіювати",
    copied: "Скопійовано",
    loading: "Зачекайте...",
    shareLoadError: "Не вдалося отримати партнерські дані.",
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
    pregnancyTitle: "Ciąża",
    pregnancySubtitle:
      "Osobna przestrzeń na tydzień, trymestr, termin, łagodne wskazówki i dostęp rodzinny.",
    pregnancyNotEnabled:
      "Włącz tryb ciąży albo przygotowania w edycji profilu, aby odblokować ten blok.",
    pregnancyTimeline: "Postęp ciąży",
    pregnancySafety:
      "Wskazówki tutaj nie zastępują lekarza: suplementy, dawki, ból, krwawienie lub niepokojące objawy zawsze konsultuj ze specjalistą.",
    babyPreviewTitle: "Przyszłe dziecko",
    babyPreviewSubtitle:
      "Łagodny rodzinny podgląd na podstawie danych pary: kolor oczu jako uproszczona ocena genetyczna, charakter jako warstwa zabawowa.",
    motherEyeColor: "Oczy mamy",
    fatherEyeColor: "Oczy taty",
    motherZodiac: "Znak mamy",
    fatherZodiac: "Znak taty",
    motherChineseZodiac: "Rok mamy",
    fatherChineseZodiac: "Rok taty",
    saveBabyPreview: "Zapisz podgląd",
    babyPreviewSaved: "Dane podglądu zapisane.",
    babyPreviewError: "Nie udało się zapisać podglądu w chmurze.",
    eyeChanceTitle: "Szansa koloru oczu",
    eyeChanceMissing: "Podaj kolor oczu obojga partnerów, aby zobaczyć ocenę.",
    sexChanceTitle: "Dziewczynka / chłopiec",
    sexChanceBody:
      "Nie da się tego uczciwie przewidzieć z profilu rodziców, więc pokazujemy bazowe 50% / 50%. To nie jest USG ani wniosek lekarza.",
    playfulTraitsTitle: "Możliwe cechy",
    playfulTraitsMissing: "Dodaj znaki albo lata urodzenia, aby zobaczyć opis zabawowy.",
    babyPreviewDisclaimer:
      "To nie jest wniosek medyczny ani genetyczny. Kolor oczu jest uproszczoną oceną, płeć nie jest przewidywana z profilu, a znaki są tylko warstwą rozrywkową.",
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
    symptomHistoryTitle: "Dziennik samopoczucia",
    symptomHistorySubtitle:
      "Ostatnie objawy zapisane przez Ciebie albo asystenta w profilu chmurowym.",
    symptomHistoryEmpty:
      "Nie ma jeszcze wpisów. Możesz powiedzieć asystentowi: \"boli mnie głowa 6 na 10\", a zapisze to jako kontekst.",
    symptomSeverity: "Natężenie",
    symptomSourceAssistant: "asystent",
    symptomSourceManual: "ręcznie",
    symptomSafetyNote:
      "To dziennik obserwacji, nie diagnoza. Silny ból, krwawienie, zawroty głowy albo szybkie pogorszenie wymagają kontaktu z lekarzem.",
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
    partnerTitle: "Dostęp rodzinny",
    partnerHelp:
      "Partner widzi tylko tydzień ciąży, rozwój dziecka i orientacyjną datę. Jedzenie, waga, notatki i prywatny profil nie są udostępniane.",
    createPartnerInvite: "Dołącz partnera",
    acceptPartnerInvite: "Przyjmij kod partnera",
    partnerCode: "Kod",
    partnerLink: "Link",
    partnerInviteReady: "Zaproszenie utworzone. Kod działa 7 dni.",
    partnerCodeLabel: "Kod SN-...",
    partnerConnected: "Profile połączone",
    partnerEmpty: "Nie ma jeszcze danych partnera.",
    babySize: "Orientacyjny rozmiar",
    copy: "Kopiuj",
    copied: "Skopiowano",
    loading: "Chwila...",
    shareLoadError: "Nie udało się pobrać danych partnera.",
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
    pregnancyTitle: "Pregnancy",
    pregnancySubtitle:
      "A dedicated space for week, trimester, due date, gentle guidance, and family access.",
    pregnancyNotEnabled:
      "Enable pregnancy or preparing mode in profile editing to unlock this block.",
    pregnancyTimeline: "Pregnancy progress",
    pregnancySafety:
      "Guidance here does not replace a clinician: supplements, dosages, pain, bleeding, or worrying symptoms must be checked with a qualified specialist.",
    babyPreviewTitle: "Future baby",
    babyPreviewSubtitle:
      "A gentle family preview from partner data: eye color as a simplified genetics estimate, personality as a playful layer.",
    motherEyeColor: "Mother eyes",
    fatherEyeColor: "Father eyes",
    motherZodiac: "Mother zodiac",
    fatherZodiac: "Father zodiac",
    motherChineseZodiac: "Mother birth year",
    fatherChineseZodiac: "Father birth year",
    saveBabyPreview: "Save preview",
    babyPreviewSaved: "Preview data saved.",
    babyPreviewError: "Could not save preview to cloud.",
    eyeChanceTitle: "Eye color chance",
    eyeChanceMissing: "Set both partners' eye colors to see an estimate.",
    sexChanceTitle: "Girl / boy",
    sexChanceBody:
      "This cannot be honestly predicted from parent profile data, so we show the base 50% / 50%. This is not ultrasound or a clinician result.",
    playfulTraitsTitle: "Possible traits",
    playfulTraitsMissing: "Add zodiac or birth-year signs to see a playful description.",
    babyPreviewDisclaimer:
      "This is not a medical or genetic conclusion. Eye color is a simplified estimate, sex is not predicted from profile data, and zodiac signs are only a playful layer.",
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
    symptomHistoryTitle: "Wellbeing log",
    symptomHistorySubtitle:
      "Recent symptoms saved by you or the assistant into the cloud profile.",
    symptomHistoryEmpty:
      "No entries yet. You can tell the assistant: \"headache 6 out of 10\", and it will save it as context.",
    symptomSeverity: "Intensity",
    symptomSourceAssistant: "assistant",
    symptomSourceManual: "manual",
    symptomSafetyNote:
      "This is an observation log, not a clinical conclusion. Severe pain, bleeding, dizziness, or quickly worsening symptoms need clinician support.",
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
    partnerTitle: "Family access",
    partnerHelp:
      "A partner sees only pregnancy week, baby development, and estimated date. Food, weight, notes, and private profile data are not shared.",
    createPartnerInvite: "Connect partner",
    acceptPartnerInvite: "Accept partner code",
    partnerCode: "Code",
    partnerLink: "Link",
    partnerInviteReady: "Invite created. The code works for 7 days.",
    partnerCodeLabel: "SN-... code",
    partnerConnected: "Profiles connected",
    partnerEmpty: "No partner data yet.",
    babySize: "Estimated size",
    copy: "Copy",
    copied: "Copied",
    loading: "Please wait...",
    shareLoadError: "Partner data could not be loaded.",
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

const getSymptomSeverityColor = (severity: number) => {
  if (severity >= 8) {
    return "#ef4444";
  }

  if (severity >= 5) {
    return "#f59e0b";
  }

  return "#14b8a6";
};

const formatSymptomDate = (value: string, language: AppLanguage) => {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const babySizeLabels = {
  uk: new Map([
    ["poppy_seed", "макове зернятко"],
    ["raspberry", "малина"],
    ["lime", "лайм"],
    ["avocado", "авокадо"],
    ["banana", "банан"],
    ["corn", "кукурудза"],
    ["eggplant", "баклажан"],
    ["squash", "гарбуз"],
    ["romaine", "лист салату"],
    ["watermelon", "кавун"],
  ]),
  pl: new Map([
    ["poppy_seed", "ziarenko maku"],
    ["raspberry", "malina"],
    ["lime", "limonka"],
    ["avocado", "awokado"],
    ["banana", "banan"],
    ["corn", "kukurydza"],
    ["eggplant", "bakłażan"],
    ["squash", "dynia"],
    ["romaine", "liść sałaty"],
    ["watermelon", "arbuz"],
  ]),
  en: new Map([
    ["poppy_seed", "poppy seed"],
    ["raspberry", "raspberry"],
    ["lime", "lime"],
    ["avocado", "avocado"],
    ["banana", "banana"],
    ["corn", "corn"],
    ["eggplant", "eggplant"],
    ["squash", "squash"],
    ["romaine", "romaine leaf"],
    ["watermelon", "watermelon"],
  ]),
} as const;

const getBabySizeLabel = (language: AppLanguage, sizeKey: string) => {
  const labels =
    language === "pl"
      ? babySizeLabels.pl
      : language === "en"
        ? babySizeLabels.en
        : babySizeLabels.uk;

  return labels.get(sizeKey) ?? sizeKey;
};

const eyeColorOptions: EyeColor[] = eyeColors;
const zodiacOptions: ZodiacSign[] = zodiacSigns;
const chineseZodiacOptions: ChineseZodiacSign[] = chineseZodiacSigns;

const UK_NOT_SET = "Не вказано";
const PL_NOT_SET = "Nie podano";
const THREE_COLUMN_GRID = "repeat(3, minmax(0, 1fr))";
const SOFT_BORDER = "1px solid var(--sn-border-soft)";
const FLEX_START_SX = { alignSelf: "flex-start" } as const;

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

const getChineseZodiacLabel = (language: AppLanguage, value: ChineseZodiacSign) => {
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

const traitLabels = {
  uk: {
    initiative: "ініціативність",
    steadiness: "стійкість",
    curiosity: "допитливість",
    sensitivity: "чутливість",
    "warm confidence": "тепла впевненість",
    "attention to detail": "увага до деталей",
    "social balance": "соціальна рівновага",
    "emotional depth": "емоційна глибина",
    independence: "самостійність",
    persistence: "наполегливість",
    "original thinking": "оригінальне мислення",
    imagination: "уяву",
    "quick adaptation": "швидка адаптація",
    patience: "терпіння",
    boldness: "сміливість",
    gentleness: "м'якість",
    "expressive energy": "виразна енергія",
    "observant calm": "спостережливий спокій",
    "movement and drive": "рух і драйв",
    "soft creativity": "м'яка творчість",
    "playful problem-solving": "грайливе мислення",
    precision: "точність",
    loyalty: "вірність",
    "kind openness": "добра відкритість",
  },
  pl: {
    initiative: "inicjatywa",
    steadiness: "stabilność",
    curiosity: "ciekawość",
    sensitivity: "wrażliwość",
    "warm confidence": "ciepła pewność siebie",
    "attention to detail": "uważność na detale",
    "social balance": "równowaga społeczna",
    "emotional depth": "głębia emocjonalna",
    independence: "samodzielność",
    persistence: "wytrwałość",
    "original thinking": "oryginalne myślenie",
    imagination: "wyobraźnia",
    "quick adaptation": "szybka adaptacja",
    patience: "cierpliwość",
    boldness: "odwaga",
    gentleness: "łagodność",
    "expressive energy": "wyrazista energia",
    "observant calm": "spokojna spostrzegawczość",
    "movement and drive": "ruch i napęd",
    "soft creativity": "miękka kreatywność",
    "playful problem-solving": "zabawowe rozwiązywanie problemów",
    precision: "precyzja",
    loyalty: "lojalność",
    "kind openness": "życzliwa otwartość",
  },
  en: {
    initiative: "initiative",
    steadiness: "steadiness",
    curiosity: "curiosity",
    sensitivity: "sensitivity",
    "warm confidence": "warm confidence",
    "attention to detail": "attention to detail",
    "social balance": "social balance",
    "emotional depth": "emotional depth",
    independence: "independence",
    persistence: "persistence",
    "original thinking": "original thinking",
    imagination: "imagination",
    "quick adaptation": "quick adaptation",
    patience: "patience",
    boldness: "boldness",
    gentleness: "gentleness",
    "expressive energy": "expressive energy",
    "observant calm": "observant calm",
    "movement and drive": "movement and drive",
    "soft creativity": "soft creativity",
    "playful problem-solving": "playful problem-solving",
    precision: "precision",
    loyalty: "loyalty",
    "kind openness": "kind openness",
  },
} as const;

const getTraitLabel = (language: AppLanguage, value: string) => {
  const labels = language === "pl" ? traitLabels.pl : language === "en" ? traitLabels.en : traitLabels.uk;
  return labels[value as keyof typeof labels] ?? value;
};

const WomenHealthOverviewCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const womenHealth = useSelector((state: RootState) => state.profile.womenHealth);
  const partnerSharing = useSelector((state: RootState) => state.profile.partnerSharing);
  const { appLanguage } = useLanguage();
  const copy = getWomenHealthCopy(appLanguage);
  const [invite, setInvite] = useState<PartnerInviteResult | null>(null);
  const [inviteQrDataUrl, setInviteQrDataUrl] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerShares, setPartnerShares] = useState<PartnerPregnancyShare[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [babyPreviewDraft, setBabyPreviewDraft] = useState({
    motherEyeColor: profile.personalDetails.eyeColor,
    partnerEyeColor: womenHealth.partnerEyeColor,
    motherZodiac: womenHealth.motherZodiac,
    fatherZodiac: womenHealth.fatherZodiac,
    motherChineseZodiac: womenHealth.motherChineseZodiac,
    fatherChineseZodiac: womenHealth.fatherChineseZodiac,
  });
  const [babyPreviewSaving, setBabyPreviewSaving] = useState(false);
  const [babyPreviewStatus, setBabyPreviewStatus] = useState<string | null>(null);
  const [babyPreviewError, setBabyPreviewError] = useState<string | null>(null);
  const isWomenHealthOwner = isWomenHealthVisibleForGender(user?.gender);
  const hasPartnerLink = partnerSharing.links.some(
    (link) => link.role === "partner" && link.status === "active"
  );
  const pageTitle = isWomenHealthOwner ? copy.title : copy.partnerTitle;
  const pageSubtitle = isWomenHealthOwner ? copy.subtitle : copy.partnerHelp;

  useEffect(() => {
    if (!hasPartnerLink) {
      return;
    }

    let cancelled = false;

    const loadShares = async () => {
      try {
        const result = await fetchRemotePartnerPregnancyShares();

        if (!cancelled) {
          setPartnerShares(result.items);
        }
      } catch {
        if (!cancelled) {
          setPartnerError(copy.shareLoadError);
        }
      }
    };

    void loadShares();

    return () => {
      cancelled = true;
    };
  }, [copy.shareLoadError, hasPartnerLink]);

  useEffect(() => {
    if (!invite?.inviteUrl) {
      return;
    }

    let cancelled = false;

    const renderQr = async () => {
      const dataUrl = await QRCode.toDataURL(invite.inviteUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 192,
      });

      if (!cancelled) {
        setInviteQrDataUrl(dataUrl);
      }
    };

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [invite]);

  const createPartnerInvite = async () => {
    setPartnerLoading(true);
    setPartnerError(null);
    setPartnerStatus(null);

    try {
      const result = await createRemotePartnerInvite();
      setInvite(result);
      setPartnerStatus(copy.partnerInviteReady);
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : copy.shareLoadError);
    } finally {
      setPartnerLoading(false);
    }
  };

  const acceptPartnerInvite = async () => {
    setPartnerLoading(true);
    setPartnerError(null);
    setPartnerStatus(null);

    try {
      const result = await acceptRemotePartnerInvite(partnerCode);
      setPartnerShares([result.share]);
      setPartnerStatus(copy.partnerConnected);
      setPartnerCode("");
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : copy.shareLoadError);
    } finally {
      setPartnerLoading(false);
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard?.writeText(value);
    setPartnerStatus(copy.copied);
  };

  const saveBabyPreview = async () => {
    setBabyPreviewSaving(true);
    setBabyPreviewStatus(null);
    setBabyPreviewError(null);

    try {
      const womenHealthPatch = {
        partnerEyeColor: babyPreviewDraft.partnerEyeColor,
        motherZodiac: babyPreviewDraft.motherZodiac,
        fatherZodiac: babyPreviewDraft.fatherZodiac,
        motherChineseZodiac: babyPreviewDraft.motherChineseZodiac,
        fatherChineseZodiac: babyPreviewDraft.fatherChineseZodiac,
      };
      const profileWithMotherEyes = buildProfileStateAfterAction(
        profile,
        updatePersonalDetails({ eyeColor: babyPreviewDraft.motherEyeColor })
      );
      const nextProfile = buildProfileStateAfterAction(
        profileWithMotherEyes,
        updateWomenHealth(womenHealthPatch)
      );

      await saveProfileStateToCloud(dispatch, nextProfile);
      dispatch(replaceProfileState(nextProfile));
      setBabyPreviewStatus(copy.babyPreviewSaved);
    } catch (error) {
      setBabyPreviewError(
        error instanceof Error ? error.message : copy.babyPreviewError
      );
    } finally {
      setBabyPreviewSaving(false);
    }
  };

  const cycleDay = getCycleDay(womenHealth.lastPeriodStartDate);
  const effectivePregnancyWeek = getEffectivePregnancyWeek(womenHealth);
  const trimester = getTrimester(effectivePregnancyWeek);
  const dueInDays = getDaysUntilIso(womenHealth.dueDate);
  const pregnancyProgress = effectivePregnancyWeek
    ? clampPercent((effectivePregnancyWeek / 40) * 100)
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
  const hasPregnancyContext =
    womenHealth.mode === "pregnant" ||
    womenHealth.mode === "trying_to_conceive" ||
    Boolean(womenHealth.pregnancyWeek) ||
    Boolean(womenHealth.dueDate);
  const babyPreview = buildBabyPreview({
    motherEyeColor: babyPreviewDraft.motherEyeColor,
    fatherEyeColor: babyPreviewDraft.partnerEyeColor,
    motherZodiac: babyPreviewDraft.motherZodiac,
    fatherZodiac: babyPreviewDraft.fatherZodiac,
    motherChineseZodiac: babyPreviewDraft.motherChineseZodiac,
    fatherChineseZodiac: babyPreviewDraft.fatherChineseZodiac,
  });
  const recentSymptomHistory = [...womenHealth.symptomHistory]
    .sort((first, second) => Date.parse(second.recordedAt) - Date.parse(first.recordedAt))
    .slice(0, 4);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: SOFT_BORDER,
        background:
          "linear-gradient(135deg, rgba(236, 72, 153, 0.09), rgba(20, 184, 166, 0.08))",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
            {pageTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {pageSubtitle}
          </Typography>
        </Stack>

        {isWomenHealthOwner && !hasPersonalContext && <Alert severity="info">{copy.addContext}</Alert>}

        {isWomenHealthOwner && (
          <Box
            sx={{
              p: { xs: 1.6, md: 2 },
              borderRadius: 1,
              border: 1,
              borderColor: "rgba(20, 184, 166, 0.32)",
              background:
                "linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(236, 72, 153, 0.08))",
            }}
            data-women-health-pregnancy-block="true"
          >
            <Stack spacing={1.4}>
              <Stack spacing={0.4}>
                <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 950 }}>
                  {copy.pregnancyTitle}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                  {copy.pregnancySubtitle}
                </Typography>
              </Stack>

              {!hasPregnancyContext && <Alert severity="info">{copy.pregnancyNotEnabled}</Alert>}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.pregnancyWeek}
                    </Typography>
                    <Typography color="text.secondary">
                      {effectivePregnancyWeek ? `${effectivePregnancyWeek} / 40` : copy.none}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.trimester}
                    </Typography>
                    <Typography color="text.secondary">{trimester ?? copy.none}</Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.dueIn}
                    </Typography>
                    <Typography color="text.secondary">
                      {dueInDays !== null ? copy.days(dueInDays) : copy.none}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.doctorPlan}
                    </Typography>
                    <Typography color="text.secondary">
                      {womenHealth.doctorConfirmed ? copy.doctorYes : copy.doctorNo}
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              <Stack spacing={0.8}>
                <Typography variant="body2" sx={{ fontWeight: 850 }}>
                  {copy.pregnancyTimeline}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pregnancyProgress}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    "& .MuiLinearProgress-bar": { backgroundColor: "#14b8a6" },
                  }}
                />
              </Stack>

              <Alert severity="warning">
                <Typography sx={{ fontWeight: 850 }}>{copy.safetyTitle}</Typography>
                <Typography variant="body2">{copy.pregnancySafety}</Typography>
              </Alert>
            </Stack>
          </Box>
        )}

        {isWomenHealthOwner && (
          <Box
            data-baby-preview-block="true"
            sx={{
              p: { xs: 1.6, md: 2 },
              borderRadius: 1,
              border: 1,
              borderColor: "rgba(168, 85, 247, 0.28)",
              background:
                "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(20, 184, 166, 0.08))",
            }}
          >
            <Stack spacing={1.5}>
              <Stack spacing={0.4}>
                <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 950 }}>
                  {copy.babyPreviewTitle}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                  {copy.babyPreviewSubtitle}
                </Typography>
              </Stack>

              {babyPreviewStatus && <Alert severity="success">{babyPreviewStatus}</Alert>}
              {babyPreviewError && <Alert severity="error">{babyPreviewError}</Alert>}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
                  gap: 1,
                }}
              >
                <TextField
                  select
                  label={copy.motherEyeColor}
                  value={babyPreviewDraft.motherEyeColor}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      motherEyeColor: event.target.value as EyeColor,
                    }))
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
                  label={copy.fatherEyeColor}
                  value={babyPreviewDraft.partnerEyeColor}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      partnerEyeColor: event.target.value as EyeColor,
                    }))
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
                  label={copy.motherZodiac}
                  value={babyPreviewDraft.motherZodiac}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      motherZodiac: event.target.value as ZodiacSign,
                    }))
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
                  label={copy.fatherZodiac}
                  value={babyPreviewDraft.fatherZodiac}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      fatherZodiac: event.target.value as ZodiacSign,
                    }))
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
                  label={copy.motherChineseZodiac}
                  value={babyPreviewDraft.motherChineseZodiac}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      motherChineseZodiac: event.target.value as ChineseZodiacSign,
                    }))
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
                  label={copy.fatherChineseZodiac}
                  value={babyPreviewDraft.fatherChineseZodiac}
                  size="small"
                  onChange={(event) =>
                    setBabyPreviewDraft((current) => ({
                      ...current,
                      fatherChineseZodiac: event.target.value as ChineseZodiacSign,
                    }))
                  }
                >
                  {chineseZodiacOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {getChineseZodiacLabel(appLanguage, item)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Button
                variant="contained"
                onClick={() => void saveBabyPreview()}
                disabled={babyPreviewSaving}
                sx={FLEX_START_SX}
              >
                {babyPreviewSaving ? copy.loading : copy.saveBabyPreview}
              </Button>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
                  gap: 1,
                }}
              >
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.8}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.eyeChanceTitle}
                    </Typography>
                    {babyPreview.eyeColorChances.length > 0 ? (
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {babyPreview.eyeColorChances.map((item) => (
                          <Chip
                            key={item.color}
                            label={`${getEyeColorLabel(appLanguage, item.color)} ${item.probability}%`}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        {copy.eyeChanceMissing}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.8}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.sexChanceTitle}
                    </Typography>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                      <Chip label={`♀ ${babyPreview.sexChances.girl}%`} color="secondary" />
                      <Chip label={`♂ ${babyPreview.sexChances.boy}%`} color="info" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {copy.sexChanceBody}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Stack spacing={0.8}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      {copy.playfulTraitsTitle}
                    </Typography>
                    {babyPreview.playfulTraits.length > 0 ? (
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {babyPreview.playfulTraits.map((item) => (
                          <Chip
                            key={item}
                            label={getTraitLabel(appLanguage, item)}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        {copy.playfulTraitsMissing}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>

              <Alert severity="info">
                <Typography variant="body2">{copy.babyPreviewDisclaimer}</Typography>
              </Alert>
            </Stack>
          </Box>
        )}

        {isWomenHealthOwner && (
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
            {effectivePregnancyWeek && (
              <Chip
                label={`${copy.pregnancyWeek}: ${effectivePregnancyWeek}`}
                color="primary"
                variant="outlined"
              />
            )}
            {trimester && <Chip label={`${copy.trimester}: ${trimester}`} variant="outlined" />}
            {dueInDays !== null && <Chip label={`${copy.dueIn}: ${copy.days(dueInDays)}`} />}
          </Stack>
        )}

        {isWomenHealthOwner && <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
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
                {effectivePregnancyWeek
                  ? `${effectivePregnancyWeek} / 40`
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
        </Box>}

        {isWomenHealthOwner && <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: THREE_COLUMN_GRID },
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
        </Box>}

        {isWomenHealthOwner && <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
          <Stack spacing={0.8}>
            <Typography sx={{ fontWeight: 850 }}>{copy.notes}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {womenHealth.notes || copy.noNotes}
            </Typography>
          </Stack>
        </Paper>}

        {isWomenHealthOwner && (
          <Paper
            variant="outlined"
            sx={{ p: 1.6, borderRadius: 1 }}
            data-women-health-symptom-history="true"
          >
            <Stack spacing={1.2}>
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 900 }}>{copy.symptomHistoryTitle}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                  {copy.symptomHistorySubtitle}
                </Typography>
              </Stack>

              {recentSymptomHistory.length > 0 ? (
                <Stack spacing={1}>
                  {recentSymptomHistory.map((symptom) => {
                    const severityColor = getSymptomSeverityColor(symptom.severity);
                    const recordedAt = formatSymptomDate(symptom.recordedAt, appLanguage);

                    return (
                      <Box
                        key={symptom.id}
                        sx={{
                          p: 1.2,
                          borderRadius: 1,
                          border: SOFT_BORDER,
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(20,184,166,0.06))",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={0.8}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                          >
                            <Typography sx={{ fontWeight: 850 }}>{symptom.label}</Typography>
                            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                              {recordedAt && <Chip size="small" label={recordedAt} />}
                              <Chip
                                size="small"
                                variant="outlined"
                                label={
                                  symptom.source === "assistant"
                                    ? copy.symptomSourceAssistant
                                    : copy.symptomSourceManual
                                }
                              />
                            </Stack>
                          </Stack>
                          <Stack spacing={0.5}>
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography color="text.secondary" variant="body2">
                                {copy.symptomSeverity}
                              </Typography>
                              <Typography sx={{ color: severityColor, fontWeight: 900 }}>
                                {symptom.severity}/10
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={clampPercent((symptom.severity / 10) * 100)}
                              sx={{
                                height: 8,
                                borderRadius: 999,
                                backgroundColor: "rgba(148, 163, 184, 0.18)",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: severityColor,
                                },
                              }}
                            />
                          </Stack>
                          {symptom.note && (
                            <Typography color="text.secondary" variant="body2">
                              {symptom.note}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Alert severity="info">{copy.symptomHistoryEmpty}</Alert>
              )}

              <Alert severity="warning">
                <Typography variant="body2">{copy.symptomSafetyNote}</Typography>
              </Alert>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
          <Stack spacing={1.4}>
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 900 }}>{copy.partnerTitle}</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                {copy.partnerHelp}
              </Typography>
            </Stack>

            {partnerStatus && <Alert severity="success">{partnerStatus}</Alert>}
            {partnerError && <Alert severity="error">{partnerError}</Alert>}

            {isWomenHealthOwner && (
              <Stack spacing={1.2}>
                <Button
                  variant="contained"
                  onClick={createPartnerInvite}
                  disabled={partnerLoading}
                  sx={FLEX_START_SX}
                >
                  {partnerLoading ? copy.loading : copy.createPartnerInvite}
                </Button>
                {invite && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
                      gap: 1.2,
                      alignItems: "center",
                    }}
                  >
                    {inviteQrDataUrl && (
                      <Box
                        component="img"
                        src={inviteQrDataUrl}
                        alt={copy.partnerTitle}
                        sx={{
                          width: 160,
                          height: 160,
                          borderRadius: 1,
                          border: SOFT_BORDER,
                        }}
                      />
                    )}
                    <Stack spacing={0.8}>
                      <Typography sx={{ fontWeight: 850 }}>
                        {copy.partnerCode}: {invite.code}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {copy.partnerLink}: {invite.inviteUrl}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Button variant="outlined" onClick={() => void copyText(invite.code)}>
                          {copy.copy} {copy.partnerCode}
                        </Button>
                        <Button variant="outlined" onClick={() => void copyText(invite.inviteUrl)}>
                          {copy.copy} {copy.partnerLink}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label={copy.partnerCodeLabel}
                value={partnerCode}
                onChange={(event) => setPartnerCode(event.target.value)}
                size="small"
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={acceptPartnerInvite}
                disabled={partnerLoading || partnerCode.trim().length < 6}
              >
                {copy.acceptPartnerInvite}
              </Button>
            </Stack>

            <Stack spacing={1}>
              {partnerShares.length === 0 && hasPartnerLink && (
                <Typography color="text.secondary">{copy.partnerEmpty}</Typography>
              )}
              {partnerShares.map((share) => {
                const progress = share.pregnancy.pregnancyWeek
                  ? clampPercent((share.pregnancy.pregnancyWeek / 40) * 100)
                  : 0;
                const sizeLabel = share.baby
                  ? getBabySizeLabel(appLanguage, share.baby.sizeKey)
                  : null;

                return (
                  <Paper key={share.owner.id} variant="outlined" sx={{ p: 1.4, borderRadius: 1 }}>
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 850 }}>
                        {share.owner.name}: {getModeLabel(copy, share.pregnancy.mode)}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {share.pregnancy.pregnancyWeek && (
                          <Chip
                            color="primary"
                            label={`${copy.pregnancyWeek}: ${share.pregnancy.pregnancyWeek}`}
                          />
                        )}
                        {share.pregnancy.dueDate && (
                          <Chip
                            variant="outlined"
                            label={`${copy.dueIn}: ${copy.days(
                              getDaysUntilIso(share.pregnancy.dueDate) ?? 0
                            )}`}
                          />
                        )}
                        {sizeLabel && (
                          <Chip variant="outlined" label={`${copy.babySize}: ${sizeLabel}`} />
                        )}
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 8,
                          borderRadius: 999,
                          "& .MuiLinearProgress-bar": { backgroundColor: "#14b8a6" },
                        }}
                      />
                      {share.baby && (
                        <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55 }}>
                          {share.baby.note} {share.baby.disclaimer}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
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
