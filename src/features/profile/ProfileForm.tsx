import { type ChangeEvent, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Avatar,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setUser } from "../auth/authSlice";
import { applyProfileTargets, updatePersonalDetails } from "./profileSlice";
import { calculateProfileTargets } from "../../shared/lib/profileTargets";
import { updateStoredProfile } from "../../shared/api/auth";
import { useLanguage } from "../../shared/language";
import {
  avatarPresets,
  getDefaultAvatar,
  resizeAvatarFile,
} from "../../shared/lib/avatar";
import {
  formatPreferenceList,
  parsePreferenceList,
} from "../../shared/lib/preferences";
import type { AdaptiveMode, DietStyle } from "../../shared/types/profile";
import type {
  BloodGroup,
  EyeColor,
  PetCompanion,
  RelationshipStatus,
  SupportSystem,
} from "../../shared/types/profile";

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
};

const profileCopy = {
  uk: {
    sectionBasics: "Основні дані",
    sectionPersonal: "Контекст для помічника",
    personalSubtitle:
      "Ці дані допомагають Nova краще підібрати тон, підтримку й спосіб контакту. Група крові та колір очей не використовуються для медичних або харчових висновків.",
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
    bloodGroupLabel: "Група крові",
    eyeColorLabel: "Колір очей",
    relationshipLabel: "Статус",
    supportLabel: "Підтримка",
    petLabel: "Поруч є",
  },
  pl: {
    sectionBasics: "Dane podstawowe",
    sectionPersonal: "Kontekst dla asystenta",
    personalSubtitle:
      "Te dane pomagają Nova dobrać ton, wsparcie i sposób kontaktu. Grupa krwi i kolor oczu nie są używane do wniosków medycznych ani żywieniowych.",
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
    bloodGroupLabel: "Grupa krwi",
    eyeColorLabel: "Kolor oczu",
    relationshipLabel: "Status",
    supportLabel: "Wsparcie",
    petLabel: "Kto jest obok",
  },
} as const;

const dietStyleLabels: Record<DietStyle, string> = {
  balanced: "Balanced",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  low_carb: "Low carb",
  gluten_free: "Gluten free",
};

const bloodGroupLabels: Record<BloodGroup, string> = {
  unknown: "Не указано",
  o_positive: "O+",
  o_negative: "O-",
  a_positive: "A+",
  a_negative: "A-",
  b_positive: "B+",
  b_negative: "B-",
  ab_positive: "AB+",
  ab_negative: "AB-",
};

const eyeColorLabels: Record<EyeColor, string> = {
  unknown: "Не указано",
  brown: "Карие",
  blue: "Голубые",
  green: "Зелёные",
  gray: "Серые",
  hazel: "Ореховые",
  amber: "Янтарные",
  other: "Другой",
};

const relationshipLabels: Record<RelationshipStatus, string> = {
  single: "Холостой / не замужем",
  dating: "В отношениях",
  married: "Женат / замужем",
  complicated: "Сложно",
  prefer_not: "Не указывать",
};

const supportLabels: Record<SupportSystem, string> = {
  self: "Справляюсь сам/а",
  partner_supports: "Вторая половинка поддерживает",
  partner_neutral: "Вторая половинка нейтральна",
  family_friends: "Поддерживают близкие",
  low_support: "Поддержки мало",
  prefer_not: "Не указывать",
};

const petLabels: Record<PetCompanion, string> = {
  none: "Без питомца",
  cat: "Кот",
  dog: "Собака",
  cat_and_dog: "Кот и собака",
  other: "Другой питомец",
};

const ProfileForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    targetWeight,
    dietStyle,
    allergies,
    excludedIngredients,
    adaptiveMode,
    personalDetails,
  } = useSelector((state: RootState) => state.profile);
  const { t, language } = useLanguage();
  const copy = profileCopy[language];
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
      }),
    [copy.targetWeightMax, t]
  );

  const {
    register,
    handleSubmit,
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
    },
  });

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
        ...userProfileData
      } = data;
      const updatedUser = await updateStoredProfile({
        ...user,
        ...userProfileData,
        avatar: avatarDraft || getDefaultAvatar(user.email),
      });
      const { maintenanceCalories, targetCalories } = calculateProfileTargets(data);

      dispatch(setUser(updatedUser));
      dispatch(
        applyProfileTargets({
          goal: data.goal,
          weight: data.weight,
          maintenanceCalories,
          targetCalories,
          targetWeight: nextTargetWeight ?? null,
          dietStyle: data.dietStyle,
          allergies: parsePreferenceList(data.allergies),
          excludedIngredients: parsePreferenceList(data.excludedIngredients),
          adaptiveMode: data.adaptiveMode,
        })
      );
      dispatch(
        updatePersonalDetails({
          bloodGroup,
          eyeColor,
          relationshipStatus,
          supportSystem,
          petCompanion,
        })
      );
      setSuccessMessage(t("profile.saved"));
    } catch {
      setServerError(t("error.genericProfile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.84)",
      }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("profile.title")}
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: 5,
            backgroundColor: "rgba(248,250,252,0.86)",
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
                          : "1px solid rgba(15, 23, 42, 0.08)",
                        backgroundColor: isSelected
                          ? "rgba(236, 253, 245, 0.86)"
                          : "rgba(255,255,255,0.9)",
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
            borderRadius: 5,
            backgroundColor: "rgba(248,250,252,0.86)",
          }}
        >
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {copy.sectionPersonal}
              </Typography>
              <Typography color="text.secondary">{copy.personalSubtitle}</Typography>
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
                {Object.entries(bloodGroupLabels).map(([value, label]) => (
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
                {Object.entries(eyeColorLabels).map(([value, label]) => (
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
                {Object.entries(relationshipLabels).map(([value, label]) => (
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
                {Object.entries(supportLabels).map(([value, label]) => (
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
                {Object.entries(petLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label={t("form.age")}
            {...register("age", { valueAsNumber: true })}
            error={Boolean(errors.age)}
            helperText={errors.age?.message}
          />
          <TextField
            fullWidth
            type="number"
            label={t("form.weight")}
            {...register("weight", { valueAsNumber: true })}
            error={Boolean(errors.weight)}
            helperText={errors.weight?.message}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label={t("form.height")}
            {...register("height", { valueAsNumber: true })}
            error={Boolean(errors.height)}
            helperText={errors.height?.message}
          />
          <TextField
            fullWidth
            type="number"
            label={copy.targetWeightLabel}
            placeholder="65"
            {...register("targetWeight", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            error={Boolean(errors.targetWeight)}
            helperText={errors.targetWeight?.message ?? copy.targetWeightHint}
            inputProps={{ min: 30, max: 300, step: 0.1 }}
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
            {Object.entries(dietStyleLabels).map(([value, label]) => (
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
