import { type ChangeEvent, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Avatar,
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
import type { AppDispatch, RootState } from "../../app/store";
import { setUser } from "../auth/authSlice";
import {
  replaceProfileState,
} from "./profileSlice";
import { saveProfileAndUserToCloud } from "./profileCloudSync";
import { buildProfileStateAfterFullSave } from "./profileSaveModel";
import { calculateProfileTargets } from "@domain/profile/profileTargets";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import {
  avatarPresets,
  getDefaultAvatar,
  resizeAvatarFile,
} from "@shared/ui/avatar";
import {
  formatPreferenceList,
  parsePreferenceList,
} from "@domain/user/preferences";
import type { AppLanguage } from "../../shared/types/i18n";
import type { AdaptiveMode, DietStyle, WomenHealthMode } from "@domain/profile/types";
import type {
  BloodGroup,
  EyeColor,
  PetCompanion,
  RelationshipStatus,
  SupportSystem,
} from "@domain/profile/types";
import { createDefaultWomenHealthState } from "@domain/profile/womenHealth";

type FormData = {
  gender: "male" | "female";
  weight: number;
  height: number;
  age: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
  targetWeight?: number;
  dietStyle: DietStyle;
  allergies: string;
  excludedIngredients: string;
  adaptiveMode: AdaptiveMode;
  bloodGroup: BloodGroup;
  eyeColor: EyeColor;
  relationshipStatus: RelationshipStatus;
  supportSystem: SupportSystem;
  petCompanion: PetCompanion;
  womenHealthMode: WomenHealthMode;
  pregnancyWeek?: number;
  dueDate: string;
  lastPeriodStartDate: string;
  doctorConfirmed: boolean;
  womenHealthNotes: string;
};

const profileCopy = {
  uk: {
    sectionBasics: "Основні дані",
    sectionPersonal: "Контекст для помічника",
    personalSubtitle: (assistantName: string) =>
      `Ці дані допомагають ${assistantName} краще підібрати тон, підтримку й спосіб контакту. Група крові та колір очей не використовуються для медичних або харчових висновків.`,
    targetWeightLabel: "Цільова вага (кг)",
    targetWeightHint: "Необов'язково: додайте ціль, щоб увімкнути шкалу прогресу.",
    targetWeightMax: "Вкажіть реалістичну цільову вагу до 300 кг.",
    avatarTitle: "Аватар",
    avatarSubtitle: "Завантажте власне фото або виберіть готовий аватар.",
    avatarUpload: "Завантажити фото",
    avatarUploading: "Оптимізуємо фото...",
    avatarHint: "Великі фото автоматично стискаються, щоб профіль зберігав легшу версію.",
    avatarError: "Не вдалося обробити зображення. Спробуйте інше фото.",
    presets: "Виберіть зі списку",
    dietStyleLabel: "Стиль харчування",
    allergiesLabel: "Алергії",
    allergiesHint: "Через кому, наприклад: арахіс, лактоза",
    exclusionsLabel: "Виключити інгредієнти",
    exclusionsHint: "Через кому, наприклад: цукор, майонез",
    adaptiveModeLabel: "Адаптивні калорії",
    adaptiveAuto: "Автоматичний перерахунок",
    adaptiveManual: "Тільки вручну",
    bloodGroupLabel: "Група крові",
    eyeColorLabel: "Колір очей",
    relationshipLabel: "Статус",
    supportLabel: "Підтримка",
    petLabel: "Поруч є",
    womenHealthTitle: "Жіноче здоров'я",
    womenHealthSubtitle:
      "Цей блок бачать тільки профілі з жіночою статтю. Помічник використовує його лише для безпечних нагадувань і контексту, не для медичних призначень.",
    womenHealthModeLabel: "Режим",
    womenHealthNone: "Не потрібно",
    womenHealthTrying: "Готуюся до вагітності",
    womenHealthPregnant: "Вагітна",
    womenHealthPostpartum: "Після пологів",
    pregnancyWeekLabel: "Орієнтовний тиждень",
    dueDateLabel: "Орієнтовна дата пологів",
    lastPeriodLabel: "Дата останньої менструації",
    doctorConfirmedLabel: "Є підтвердження / план від лікаря",
    womenHealthNotesLabel: "Що важливо пам'ятати",
    womenHealthSafety:
      "Ліки, добавки, дозування і тривожні симптоми завжди перевіряються з лікарем.",
  },
  pl: {
    sectionBasics: "Dane podstawowe",
    sectionPersonal: "Kontekst dla asystenta",
    personalSubtitle: (assistantName: string) =>
      `Te dane pomagają ${assistantName} dobrać ton, wsparcie i sposób kontaktu. Grupa krwi i kolor oczu nie są używane do wniosków medycznych ani żywieniowych.`,
    targetWeightLabel: "Docelowa waga (kg)",
    targetWeightHint: "Opcjonalnie: dodaj cel, aby włączyć skalę postępu.",
    targetWeightMax: "Podaj realistyczną wagę docelową do 300 kg.",
    avatarTitle: "Awatar",
    avatarSubtitle: "Prześlij własne zdjęcie albo wybierz gotowy awatar.",
    avatarUpload: "Prześlij zdjęcie",
    avatarUploading: "Optymalizujemy zdjęcie...",
    avatarHint: "Duże zdjęcia są automatycznie zmniejszane, aby profil zapisywał lżejszą wersję.",
    avatarError: "Nie udało się przetworzyć obrazu. Spróbuj innego zdjęcia.",
    presets: "Wybierz z listy",
    dietStyleLabel: "Styl żywienia",
    allergiesLabel: "Alergie",
    allergiesHint: "Lista po przecinku, na przykład: orzechy, laktoza",
    exclusionsLabel: "Wykluczone składniki",
    exclusionsHint: "Lista po przecinku, na przykład: cukier, majonez",
    adaptiveModeLabel: "Adaptacyjne kalorie",
    adaptiveAuto: "Automatyczne przeliczanie",
    adaptiveManual: "Tylko ręcznie",
    bloodGroupLabel: "Grupa krwi",
    eyeColorLabel: "Kolor oczu",
    relationshipLabel: "Status",
    supportLabel: "Wsparcie",
    petLabel: "Kto jest obok",
    womenHealthTitle: "Zdrowie kobiet",
    womenHealthSubtitle:
      "Ten blok widzą tylko profile z płcią żeńską. Asystent używa go do bezpiecznego kontekstu i przypomnień, nie do zaleceń medycznych.",
    womenHealthModeLabel: "Tryb",
    womenHealthNone: "Nie dotyczy",
    womenHealthTrying: "Przygotowuję się do ciąży",
    womenHealthPregnant: "Jestem w ciąży",
    womenHealthPostpartum: "Po porodzie",
    pregnancyWeekLabel: "Orientacyjny tydzień",
    dueDateLabel: "Przewidywany termin porodu",
    lastPeriodLabel: "Data ostatniej miesiączki",
    doctorConfirmedLabel: "Mam potwierdzenie / plan od lekarza",
    womenHealthNotesLabel: "Co warto pamiętać",
    womenHealthSafety:
      "Leki, suplementy, dawki i niepokojące objawy zawsze konsultuj z lekarzem.",
  },
  en: {
    sectionBasics: "Basic data",
    sectionPersonal: "Assistant context",
    personalSubtitle: (assistantName: string) =>
      `These details help ${assistantName} choose tone, support, and contact style. Blood group and eye color are not used for medical or nutrition conclusions.`,
    targetWeightLabel: "Target weight (kg)",
    targetWeightHint: "Optional: add a goal to unlock the progress scale.",
    targetWeightMax: "Enter a realistic target weight up to 300 kg.",
    avatarTitle: "Avatar",
    avatarSubtitle: "Upload your own photo or choose one of the ready-made avatars.",
    avatarUpload: "Upload photo",
    avatarUploading: "Optimizing photo...",
    avatarHint: "Large photos are resized automatically, so the profile saves a lighter version.",
    avatarError: "The image could not be processed. Try another photo.",
    presets: "Choose from the list",
    dietStyleLabel: "Diet style",
    allergiesLabel: "Allergies",
    allergiesHint: "Comma-separated list, for example: peanuts, lactose",
    exclusionsLabel: "Exclude ingredients",
    exclusionsHint: "Comma-separated list, for example: sugar, mayo",
    adaptiveModeLabel: "Adaptive calories",
    adaptiveAuto: "Automatic recalculation",
    adaptiveManual: "Manual only",
    bloodGroupLabel: "Blood group",
    eyeColorLabel: "Eye color",
    relationshipLabel: "Relationship status",
    supportLabel: "Support",
    petLabel: "Nearby companion",
    womenHealthTitle: "Women health",
    womenHealthSubtitle:
      "This block is shown only for female profiles. The assistant uses it for safe context and reminders, not for medical prescriptions.",
    womenHealthModeLabel: "Mode",
    womenHealthNone: "Not needed",
    womenHealthTrying: "Preparing for pregnancy",
    womenHealthPregnant: "Pregnant",
    womenHealthPostpartum: "Postpartum",
    pregnancyWeekLabel: "Estimated week",
    dueDateLabel: "Estimated due date",
    lastPeriodLabel: "Last period start date",
    doctorConfirmedLabel: "Doctor confirmation / plan exists",
    womenHealthNotesLabel: "Important context",
    womenHealthSafety:
      "Medication, supplements, dosages, and worrying symptoms must always be checked with a clinician.",
  },
} as const;

const dietStyleLabels: Record<AppLanguage, Record<DietStyle, string>> = {
  uk: {
    balanced: "Збалансований",
    vegetarian: "Вегетаріанський",
    vegan: "Веганський",
    pescatarian: "Пескетаріанський",
    low_carb: "Низьковуглеводний",
    gluten_free: "Без глютену",
  },
  pl: {
    balanced: "Zbilansowany",
    vegetarian: "Wegetariański",
    vegan: "Wegański",
    pescatarian: "Pescetariański",
    low_carb: "Low carb",
    gluten_free: "Bez glutenu",
  },
  en: {
    balanced: "Balanced",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescatarian: "Pescatarian",
    low_carb: "Low carb",
    gluten_free: "Gluten free",
  },
};

const bloodGroupLabels: Record<AppLanguage, Record<BloodGroup, string>> = {
  uk: {
    unknown: "Не вказано",
    o_positive: "O+",
    o_negative: "O-",
    a_positive: "A+",
    a_negative: "A-",
    b_positive: "B+",
    b_negative: "B-",
    ab_positive: "AB+",
    ab_negative: "AB-",
  },
  pl: {
    unknown: "Nie podano",
    o_positive: "O+",
    o_negative: "O-",
    a_positive: "A+",
    a_negative: "A-",
    b_positive: "B+",
    b_negative: "B-",
    ab_positive: "AB+",
    ab_negative: "AB-",
  },
  en: {
    unknown: "Not specified",
    o_positive: "O+",
    o_negative: "O-",
    a_positive: "A+",
    a_negative: "A-",
    b_positive: "B+",
    b_negative: "B-",
    ab_positive: "AB+",
    ab_negative: "AB-",
  },
};

const eyeColorLabels: Record<AppLanguage, Record<EyeColor, string>> = {
  uk: {
    unknown: "Не вказано",
    brown: "Карі",
    blue: "Блакитні",
    green: "Зелені",
    gray: "Сірі",
    hazel: "Горіхові",
    amber: "Бурштинові",
    other: "Інший",
  },
  pl: {
    unknown: "Nie podano",
    brown: "Brązowe",
    blue: "Niebieskie",
    green: "Zielone",
    gray: "Szare",
    hazel: "Piwne",
    amber: "Bursztynowe",
    other: "Inny",
  },
  en: {
    unknown: "Not specified",
    brown: "Brown",
    blue: "Blue",
    green: "Green",
    gray: "Gray",
    hazel: "Hazel",
    amber: "Amber",
    other: "Other",
  },
};

const relationshipLabels: Record<AppLanguage, Record<RelationshipStatus, string>> = {
  uk: {
    single: "Без пари",
    dating: "У стосунках",
    married: "Одружений / заміжня",
    complicated: "Складно",
    prefer_not: "Не вказувати",
  },
  pl: {
    single: "Bez pary",
    dating: "W związku",
    married: "Małżeństwo",
    complicated: "To skomplikowane",
    prefer_not: "Nie podawać",
  },
  en: {
    single: "Single",
    dating: "In a relationship",
    married: "Married",
    complicated: "Complicated",
    prefer_not: "Prefer not to say",
  },
};

const supportLabels: Record<AppLanguage, Record<SupportSystem, string>> = {
  uk: {
    self: "Справляюся самостійно",
    partner_supports: "Партнер підтримує",
    partner_neutral: "Партнер нейтральний",
    family_friends: "Підтримують близькі",
    low_support: "Підтримки мало",
    prefer_not: "Не вказувати",
  },
  pl: {
    self: "Radzę sobie samodzielnie",
    partner_supports: "Partner wspiera",
    partner_neutral: "Partner jest neutralny",
    family_friends: "Wspierają bliscy",
    low_support: "Mało wsparcia",
    prefer_not: "Nie podawać",
  },
  en: {
    self: "I manage on my own",
    partner_supports: "Partner supports me",
    partner_neutral: "Partner is neutral",
    family_friends: "Family or friends support me",
    low_support: "Low support",
    prefer_not: "Prefer not to say",
  },
};

const petLabels: Record<AppLanguage, Record<PetCompanion, string>> = {
  uk: {
    none: "Без улюбленця",
    cat: "Кіт",
    dog: "Собака",
    cat_and_dog: "Кіт і собака",
    other: "Інший улюбленець",
  },
  pl: {
    none: "Bez zwierzaka",
    cat: "Kot",
    dog: "Pies",
    cat_and_dog: "Kot i pies",
    other: "Inny zwierzak",
  },
  en: {
    none: "No pet",
    cat: "Cat",
    dog: "Dog",
    cat_and_dog: "Cat and dog",
    other: "Other pet",
  },
};

const toDateInputValue = (value: string | null) =>
  value && !Number.isNaN(Date.parse(value)) ? value.slice(0, 10) : "";

const ProfileForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const {
    targetWeight,
    dietStyle,
    allergies,
    excludedIngredients,
    adaptiveMode,
    personalDetails,
    womenHealth,
    assistant,
  } = profile;
  const { t, appLanguage } = useLanguage();
  const copy = profileCopy[appLanguage];
  const dietLabels = dietStyleLabels[appLanguage];
  const bloodLabels = bloodGroupLabels[appLanguage];
  const eyeLabels = eyeColorLabels[appLanguage];
  const relationshipOptions = relationshipLabels[appLanguage];
  const supportOptions = supportLabels[appLanguage];
  const petOptions = petLabels[appLanguage];
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(
    user?.avatar ?? getDefaultAvatar(user?.email ?? user?.name ?? "smart-nutrition")
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        gender: z.enum(["male", "female"]),
        weight: z.number().min(30, t("validation.weightMin")),
        height: z.number().min(120, t("validation.heightMin")),
        age: z.number().min(10, t("validation.ageMin")),
        activity: z.enum([
          "sedentary",
          "light",
          "moderate",
          "active",
          "very_active",
        ]),
        goal: z.enum(["cut", "maintain", "bulk"]),
        targetWeight: z
          .number()
          .min(30, t("validation.weightMin"))
          .max(300, copy.targetWeightMax)
          .optional(),
        dietStyle: z.enum([
          "balanced",
          "vegetarian",
          "vegan",
          "pescatarian",
          "low_carb",
          "gluten_free",
        ]),
        allergies: z.string(),
        excludedIngredients: z.string(),
        adaptiveMode: z.enum(["automatic", "manual"]),
        bloodGroup: z.enum([
          "unknown",
          "o_positive",
          "o_negative",
          "a_positive",
          "a_negative",
          "b_positive",
          "b_negative",
          "ab_positive",
          "ab_negative",
        ]),
        eyeColor: z.enum([
          "unknown",
          "brown",
          "blue",
          "green",
          "gray",
          "hazel",
          "amber",
          "other",
        ]),
        relationshipStatus: z.enum([
          "single",
          "dating",
          "married",
          "complicated",
          "prefer_not",
        ]),
        supportSystem: z.enum([
          "self",
          "partner_supports",
          "partner_neutral",
          "family_friends",
          "low_support",
          "prefer_not",
        ]),
        petCompanion: z.enum(["none", "cat", "dog", "cat_and_dog", "other"]),
        womenHealthMode: z.enum([
          "none",
          "trying_to_conceive",
          "pregnant",
          "postpartum",
        ]),
        pregnancyWeek: z.number().min(1).max(42).optional(),
        dueDate: z.string(),
        lastPeriodStartDate: z.string(),
        doctorConfirmed: z.boolean(),
        womenHealthNotes: z.string().max(220),
      }),
    [copy.targetWeightMax, t]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: user?.gender ?? "male",
      weight: user?.weight ?? 70,
      height: user?.height ?? 175,
      age: user?.age ?? 25,
      activity: user?.activity ?? "moderate",
      goal: user?.goal ?? "maintain",
      targetWeight: targetWeight ?? undefined,
      dietStyle,
      allergies: formatPreferenceList(allergies),
      excludedIngredients: formatPreferenceList(excludedIngredients),
      adaptiveMode,
      bloodGroup: personalDetails.bloodGroup,
      eyeColor: personalDetails.eyeColor,
      relationshipStatus: personalDetails.relationshipStatus,
      supportSystem: personalDetails.supportSystem,
      petCompanion: personalDetails.petCompanion,
      womenHealthMode: womenHealth.mode,
      pregnancyWeek: womenHealth.pregnancyWeek ?? undefined,
      dueDate: toDateInputValue(womenHealth.dueDate),
      lastPeriodStartDate: toDateInputValue(womenHealth.lastPeriodStartDate),
      doctorConfirmed: womenHealth.doctorConfirmed,
      womenHealthNotes: womenHealth.notes,
    },
  });
  const selectedGender = useWatch({ control, name: "gender" });
  const selectedWomenHealthMode = useWatch({ control, name: "womenHealthMode" });
  const shouldShowWomenHealth = selectedGender === "female";
  const shouldShowPregnancyFields =
    shouldShowWomenHealth && selectedWomenHealthMode === "pregnant";
  const shouldShowCycleFields =
    shouldShowWomenHealth &&
    (selectedWomenHealthMode === "pregnant" ||
      selectedWomenHealthMode === "trying_to_conceive");

  if (!user) return null;

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const optimizedAvatar = await resizeAvatarFile(file);
      setAvatarDraft(optimizedAvatar);
    } catch {
      setAvatarError(copy.avatarError);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);
    setAvatarError(null);

    try {
      const {
        targetWeight: nextTargetWeight,
        bloodGroup,
        eyeColor,
        relationshipStatus,
        supportSystem,
        petCompanion,
        womenHealthMode,
        pregnancyWeek,
        dueDate,
        lastPeriodStartDate,
        doctorConfirmed,
        womenHealthNotes,
        ...userProfileData
      } = data;
      const nextWomenHealth =
        data.gender === "female"
          ? {
              mode: womenHealthMode,
              pregnancyWeek:
                womenHealthMode === "pregnant" ? pregnancyWeek ?? null : null,
              dueDate:
                womenHealthMode === "pregnant" && dueDate
                  ? new Date(dueDate).toISOString()
                  : null,
              lastPeriodStartDate:
                (womenHealthMode === "pregnant" ||
                  womenHealthMode === "trying_to_conceive") &&
                lastPeriodStartDate
                  ? new Date(lastPeriodStartDate).toISOString()
                  : null,
              doctorConfirmed:
                womenHealthMode === "pregnant" ||
                womenHealthMode === "trying_to_conceive"
                  ? doctorConfirmed
                  : false,
              notes: womenHealthNotes,
            }
          : createDefaultWomenHealthState();
      const { maintenanceCalories, targetCalories } = calculateProfileTargets(data);
      const profileTargets = {
        goal: data.goal,
        weight: data.weight,
        maintenanceCalories,
        targetCalories,
        targetWeight: nextTargetWeight ?? null,
        dietStyle: data.dietStyle,
        allergies: parsePreferenceList(data.allergies),
        excludedIngredients: parsePreferenceList(data.excludedIngredients),
        adaptiveMode: data.adaptiveMode,
      };
      const personalDetailsPatch = {
        bloodGroup,
        eyeColor,
        relationshipStatus,
        supportSystem,
        petCompanion,
      };
      const nextProfile = buildProfileStateAfterFullSave(profile, {
        targets: profileTargets,
        personalDetails: personalDetailsPatch,
        womenHealth: nextWomenHealth,
      });

      const updatedUser = await saveProfileAndUserToCloud(dispatch, {
        ...user,
        ...userProfileData,
        avatar: avatarDraft || getDefaultAvatar(user.email),
      }, nextProfile);
      dispatch(setUser(updatedUser));
      dispatch(replaceProfileState(nextProfile));
      setSuccessMessage(t("profile.saved"));
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : t("error.genericProfile")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
        boxShadow: "var(--sn-shadow-card)",
      }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("profile.title")}
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: 1,
            backgroundColor: "var(--sn-surface-elevated)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Avatar
                src={avatarDraft || getDefaultAvatar(user.email)}
                sx={{ width: 92, height: 92 }}
              >
                {user.name[0]}
              </Avatar>
              <Stack spacing={0.7} sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>{copy.avatarTitle}</Typography>
                <Typography color="text.secondary">{copy.avatarSubtitle}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button component="label" variant="outlined" disabled={avatarUploading}>
                    {avatarUploading ? copy.avatarUploading : copy.avatarUpload}
                    <input hidden accept="image/*" type="file" onChange={handleAvatarUpload} />
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                    {copy.avatarHint}
                  </Typography>
                </Stack>
                {avatarError && <Alert severity="warning">{avatarError}</Alert>}
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {copy.presets}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {avatarPresets.map((preset) => {
                  const isSelected = avatarDraft === preset.url;

                  return (
                    <Box
                      key={preset.id}
                      component="button"
                      type="button"
                      onClick={() => setAvatarDraft(preset.url)}
                      sx={{
                        p: 0.75,
                        borderRadius: 3,
                        border: isSelected
                          ? "2px solid rgba(15, 118, 110, 0.92)"
                          : "1px solid var(--sn-border-soft)",
                        backgroundColor: isSelected
                          ? "rgba(236, 253, 245, 0.86)"
                          : "var(--sn-surface-glass)",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        minWidth: 78,
                      }}
                    >
                      <Avatar src={preset.url} sx={{ width: 52, height: 52, mb: 0.75 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {preset.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {copy.sectionBasics}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={t("form.gender")}
            defaultValue={user.gender}
            {...register("gender")}
            error={Boolean(errors.gender)}
            helperText={errors.gender?.message}
          >
            <MenuItem value="male">{t("option.gender.male")}</MenuItem>
            <MenuItem value="female">{t("option.gender.female")}</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={t("form.activity")}
            defaultValue={user.activity}
            {...register("activity")}
            error={Boolean(errors.activity)}
            helperText={errors.activity?.message}
          >
            <MenuItem value="sedentary">{t("option.activity.sedentary")}</MenuItem>
            <MenuItem value="light">{t("option.activity.light")}</MenuItem>
            <MenuItem value="moderate">{t("option.activity.moderate")}</MenuItem>
            <MenuItem value="active">{t("option.activity.active")}</MenuItem>
            <MenuItem value="very_active">
              {t("option.activity.very_active")}
            </MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={t("form.goal")}
            defaultValue={user.goal}
            {...register("goal")}
            error={Boolean(errors.goal)}
            helperText={errors.goal?.message}
          >
            <MenuItem value="cut">{t("option.goal.cut")}</MenuItem>
            <MenuItem value="maintain">{t("option.goal.maintain")}</MenuItem>
            <MenuItem value="bulk">{t("option.goal.bulk")}</MenuItem>
          </TextField>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: 1,
            backgroundColor: "rgba(248,250,252,0.86)",
          }}
        >
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {copy.sectionPersonal}
              </Typography>
              <Typography color="text.secondary">
                {copy.personalSubtitle(assistant.name)}
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={copy.bloodGroupLabel}
                defaultValue={personalDetails.bloodGroup}
                {...register("bloodGroup")}
                error={Boolean(errors.bloodGroup)}
                helperText={errors.bloodGroup?.message}
              >
                {Object.entries(bloodLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label={copy.eyeColorLabel}
                defaultValue={personalDetails.eyeColor}
                {...register("eyeColor")}
                error={Boolean(errors.eyeColor)}
                helperText={errors.eyeColor?.message}
              >
                {Object.entries(eyeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={copy.relationshipLabel}
                defaultValue={personalDetails.relationshipStatus}
                {...register("relationshipStatus")}
                error={Boolean(errors.relationshipStatus)}
                helperText={errors.relationshipStatus?.message}
              >
                {Object.entries(relationshipOptions).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label={copy.supportLabel}
                defaultValue={personalDetails.supportSystem}
                {...register("supportSystem")}
                error={Boolean(errors.supportSystem)}
                helperText={errors.supportSystem?.message}
              >
                {Object.entries(supportOptions).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label={copy.petLabel}
                defaultValue={personalDetails.petCompanion}
                {...register("petCompanion")}
                error={Boolean(errors.petCompanion)}
                helperText={errors.petCompanion?.message}
              >
                {Object.entries(petOptions).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </Paper>

        {shouldShowWomenHealth && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              borderRadius: 1,
              backgroundColor: "rgba(240,253,250,0.72)",
              borderColor: "rgba(20, 184, 166, 0.28)",
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {copy.womenHealthTitle}
                </Typography>
                <Typography color="text.secondary">
                  {copy.womenHealthSubtitle}
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label={copy.womenHealthModeLabel}
                  defaultValue={womenHealth.mode}
                  {...register("womenHealthMode")}
                  error={Boolean(errors.womenHealthMode)}
                  helperText={errors.womenHealthMode?.message}
                >
                  <MenuItem value="none">{copy.womenHealthNone}</MenuItem>
                  <MenuItem value="trying_to_conceive">
                    {copy.womenHealthTrying}
                  </MenuItem>
                  <MenuItem value="pregnant">{copy.womenHealthPregnant}</MenuItem>
                  <MenuItem value="postpartum">{copy.womenHealthPostpartum}</MenuItem>
                </TextField>

                {shouldShowPregnancyFields && (
                  <TextField
                    fullWidth
                    type="text"
                    label={copy.pregnancyWeekLabel}
                    {...register("pregnancyWeek", {
                      setValueAs: (value) =>
                        value === "" ? undefined : Number(value),
                    })}
                    error={Boolean(errors.pregnancyWeek)}
                    helperText={errors.pregnancyWeek?.message}
                    onFocus={(event) => selectInputValue(event.target)}
                    onClick={(event) => selectInputValue(event.currentTarget)}
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        enterKeyHint: "next",
                      },
                    }}
                  />
                )}
              </Stack>

              {shouldShowCycleFields && (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  {shouldShowPregnancyFields && (
                    <TextField
                      fullWidth
                      type="date"
                      label={copy.dueDateLabel}
                      InputLabelProps={{ shrink: true }}
                      {...register("dueDate")}
                      error={Boolean(errors.dueDate)}
                      helperText={errors.dueDate?.message}
                    />
                  )}
                  <TextField
                    fullWidth
                    type="date"
                    label={copy.lastPeriodLabel}
                    InputLabelProps={{ shrink: true }}
                    {...register("lastPeriodStartDate")}
                    error={Boolean(errors.lastPeriodStartDate)}
                    helperText={errors.lastPeriodStartDate?.message}
                  />
                </Stack>
              )}

              {selectedWomenHealthMode !== "none" && (
                <>
                  <FormControlLabel
                    control={<Checkbox {...register("doctorConfirmed")} />}
                    label={copy.doctorConfirmedLabel}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={copy.womenHealthNotesLabel}
                    {...register("womenHealthNotes")}
                    error={Boolean(errors.womenHealthNotes)}
                    helperText={
                      errors.womenHealthNotes?.message ?? copy.womenHealthSafety
                    }
                  />
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    {copy.womenHealthSafety}
                  </Alert>
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="text"
            label={t("form.age")}
            {...register("age", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            error={Boolean(errors.age)}
            helperText={errors.age?.message}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
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
            type="text"
            label={t("form.weight")}
            {...register("weight", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            error={Boolean(errors.weight)}
            helperText={errors.weight?.message}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{
              htmlInput: { inputMode: "decimal", enterKeyHint: "next" },
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="text"
            label={t("form.height")}
            {...register("height", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            error={Boolean(errors.height)}
            helperText={errors.height?.message}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
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
            type="text"
            label={copy.targetWeightLabel}
            placeholder="65"
            {...register("targetWeight", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            error={Boolean(errors.targetWeight)}
            helperText={errors.targetWeight?.message ?? copy.targetWeightHint}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{
              htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.dietStyleLabel}
            defaultValue={dietStyle}
            {...register("dietStyle")}
            error={Boolean(errors.dietStyle)}
            helperText={errors.dietStyle?.message}
          >
            {Object.entries(dietLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label={copy.adaptiveModeLabel}
            defaultValue={adaptiveMode}
            {...register("adaptiveMode")}
            error={Boolean(errors.adaptiveMode)}
            helperText={errors.adaptiveMode?.message}
          >
            <MenuItem value="automatic">{copy.adaptiveAuto}</MenuItem>
            <MenuItem value="manual">{copy.adaptiveManual}</MenuItem>
          </TextField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label={copy.allergiesLabel}
            {...register("allergies")}
            error={Boolean(errors.allergies)}
            helperText={errors.allergies?.message ?? copy.allergiesHint}
          />
          <TextField
            fullWidth
            label={copy.exclusionsLabel}
            {...register("excludedIngredients")}
            error={Boolean(errors.excludedIngredients)}
            helperText={errors.excludedIngredients?.message ?? copy.exclusionsHint}
          />
        </Stack>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{
            alignSelf: "flex-start",
            px: 3,
            py: 1.2,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
            background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
          }}
        >
          {t("form.save")}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ProfileForm;
