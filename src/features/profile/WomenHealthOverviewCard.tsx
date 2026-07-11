import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { WomenHealthMode, WomenHealthState } from "@domain/profile/types";
import { isWomenHealthVisibleForGender } from "@domain/profile/womenHealth";
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

export const WomenHealthOverviewCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
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
            {pageTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {pageSubtitle}
          </Typography>
        </Stack>

        {isWomenHealthOwner && !hasPersonalContext && <Alert severity="info">{copy.addContext}</Alert>}

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
        )}

        {isWomenHealthOwner && <Box
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
        </Box>}

        {isWomenHealthOwner && <Box
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
        </Box>}

        {isWomenHealthOwner && <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 1 }}>
          <Stack spacing={0.8}>
            <Typography sx={{ fontWeight: 850 }}>{copy.notes}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {womenHealth.notes || copy.noNotes}
            </Typography>
          </Stack>
        </Paper>}

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
                  sx={{ alignSelf: "flex-start" }}
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
                          border: "1px solid var(--sn-border-soft)",
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
