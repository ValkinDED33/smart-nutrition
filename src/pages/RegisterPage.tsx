import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import { replaceMealState } from "../features/meal/mealSlice";
import { applyProfileTargets, replaceProfileState, setProfileLanguage } from "../features/profile/profileSlice";
import { replaceWaterState } from "../features/water/waterSlice";
import { calculateProfileTargets } from "../shared/lib/profileTargets";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  register as registerApi,
} from "../shared/api/auth";
import { useLanguage } from "../shared/language";
import { getSnapshotMetaFromSnapshot } from "../shared/lib/appSnapshot";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { getSyncOutboxMeta } from "../shared/lib/syncOutbox";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const defaultProfileBootstrap = {
  age: 25,
  weight: 70,
  height: 175,
  gender: "male" as const,
  activity: "moderate" as const,
  goal: "maintain" as const,
};

const registerPageCopy = {
  uk: {
    showPassword: "Показати пароль",
    hidePassword: "Сховати пароль",
    note: "Базовий профіль створиться відразу, а вагу, зріст і цілі ви доповните вже в профілі.",
  },
  pl: {
    showPassword: "Pokaż hasło",
    hidePassword: "Ukryj hasło",
    note: "Podstawowy profil utworzy się od razu, a wagę, wzrost i cele uzupełnisz już w profilu.",
  },
} as const;

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const copy = registerPageCopy[language];

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, t("validation.nameMin")),
          email: z.string().email(t("validation.invalidEmail")),
          password: z
            .string()
            .min(10, t("validation.passwordMin"))
            .regex(/[A-Z]/, t("validation.passwordUpper"))
            .regex(/[a-z]/, t("validation.passwordLower"))
            .regex(/\d/, t("validation.passwordDigit"))
            .regex(
              /[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]/,
              t("validation.passwordSymbol")
            ),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMatch"),
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const { user, snapshot } = await registerApi({
        ...defaultProfileBootstrap,
        name: data.name,
        email: data.email,
        password: data.password,
      });

      dispatch(
        setCredentials({
          user,
          syncMode: getAuthRuntimeInfo().mode,
          syncOutbox: getSyncOutboxMeta(),
          cloudMeta: getSnapshotMetaFromSnapshot(snapshot),
        })
      );

      if (snapshot && getSyncOutboxMeta().pendingChanges === 0) {
        dispatch(replaceProfileState(snapshot.profile));
        dispatch(replaceMealState(snapshot.meal));
        dispatch(replaceWaterState(snapshot.water));
      } else {
        const { maintenanceCalories, targetCalories } = calculateProfileTargets(
          defaultProfileBootstrap
        );
        dispatch(
          applyProfileTargets({
            goal: defaultProfileBootstrap.goal,
            weight: defaultProfileBootstrap.weight,
            maintenanceCalories,
            targetCalories,
            targetWeight: null,
            dietStyle: "balanced",
            allergies: [],
            excludedIngredients: [],
            adaptiveMode: "automatic",
          })
        );
      }

      dispatch(setProfileLanguage(language));
      navigate("/profile");
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_IN_USE") {
        setServerError(t("error.emailInUse"));
      } else {
        setServerError(t("error.genericRegister"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, md: 4 },
          borderRadius: 7,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,250,252,0.92) 100%)",
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {t("brand.name")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              {t("auth.registerTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {copy.note}
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {serverError}
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label={t("form.name")}
              {...register("name")}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />

            <TextField
              fullWidth
              label={t("form.email")}
              type="email"
              {...register("email")}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              {...register("password")}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((current) => !current)}
                      showLabel={copy.showPassword}
                      hideLabel={copy.hidePassword}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label={t("form.confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              {...register("confirmPassword")}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityButton
                      visible={confirmPasswordVisible}
                      onToggle={() => setConfirmPasswordVisible((current) => !current)}
                      showLabel={copy.showPassword}
                      hideLabel={copy.hidePassword}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {t("auth.submitRegister")}
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
            {t("auth.haveAccount")}{" "}
            <Box
              component={Link}
              to="/login"
              sx={{
                color: "#0f766e",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline",
              }}
            >
              {t("auth.loginLink")}
            </Box>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
