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
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { AppDispatch } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import { replaceCommunityState } from "../features/community/communitySlice";
import { replaceFridgeState } from "../features/fridge/fridgeSlice";
import { replaceMealState } from "../features/meal/mealSlice";
import { applyProfileTargets, replaceProfileState, setProfileLanguage } from "../features/profile/profileSlice";
import { replaceWaterState } from "../features/water/waterSlice";
import { calculateProfileTargets } from "../shared/lib/profileTargets";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  register as registerApi,
  resendRegistrationVerification,
  verifyRegistration,
  type RegistrationVerificationPending,
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
  verificationChannel: "email" | "sms";
  phone: string;
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
    note: "Оберіть, куди надіслати код підтвердження. Профіль відкриється після перевірки.",
    channel: "Підтвердження",
    emailChannel: "Email",
    smsChannel: "SMS",
    phone: "Телефон для SMS",
    code: "Код підтвердження",
    verify: "Підтвердити",
    verifying: "Перевіряємо...",
    resend: "Надіслати ще раз",
    preview: "Preview-код",
    sent: "Код надіслано: {target}",
    verified: "Реєстрацію підтверджено.",
  },
  pl: {
    showPassword: "Pokaż hasło",
    hidePassword: "Ukryj hasło",
    note: "Wybierz, gdzie wysłać kod potwierdzający. Profil otworzy się po weryfikacji.",
    channel: "Potwierdzenie",
    emailChannel: "Email",
    smsChannel: "SMS",
    phone: "Telefon do SMS",
    code: "Kod potwierdzający",
    verify: "Potwierdź",
    verifying: "Sprawdzam...",
    resend: "Wyślij ponownie",
    preview: "Kod preview",
    sent: "Kod wysłany: {target}",
    verified: "Rejestracja potwierdzona.",
  },
} as const;

const isVerificationPending = (
  value: unknown
): value is RegistrationVerificationPending =>
  typeof value === "object" &&
  value !== null &&
  (value as { requiresVerification?: unknown }).requiresVerification === true;

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] =
    useState<RegistrationVerificationPending | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
          verificationChannel: z.enum(["email", "sms"]),
          phone: z.string(),
        })
        .refine(
          (data) =>
            data.verificationChannel === "email" ||
            /^[+\d][\d\s().-]{6,24}$/.test(data.phone.trim()),
          {
            path: ["phone"],
            message: "Phone number is required for SMS verification.",
          }
        )
        .refine((data) => data.password === data.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMatch"),
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      verificationChannel: "email",
      phone: "",
    },
  });
  const verificationChannel = watch("verificationChannel");

  const applyAuthenticatedSession = ({
    user,
    snapshot,
  }: Awaited<ReturnType<typeof verifyRegistration>>) => {
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
      dispatch(replaceFridgeState(snapshot.fridge));
      dispatch(replaceCommunityState(snapshot.community));
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
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);
    setPendingVerification(null);

    try {
      const response = await registerApi({
        ...defaultProfileBootstrap,
        name: data.name,
        email: data.email,
        password: data.password,
        verificationChannel: data.verificationChannel,
        phone: data.verificationChannel === "sms" ? data.phone : undefined,
      });

      if (isVerificationPending(response)) {
        setPendingVerification(response);
        setVerificationCode(response.previewCode ?? "");
        return;
      }

      applyAuthenticatedSession(response);
      navigate("/profile");
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_IN_USE") {
        setServerError(t("error.emailInUse"));
      } else if (
        error instanceof AuthApiError &&
        error.code === "BACKEND_UNAVAILABLE"
      ) {
        setServerError(t("error.backendUnavailable"));
      } else if (
        error instanceof AuthApiError &&
        error.code === "WEAK_PASSWORD"
      ) {
        setServerError(t("validation.passwordMin"));
      } else {
        setServerError(t("error.genericRegister"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationError = (error: unknown) => {
    if (error instanceof AuthApiError) {
      if (error.code === "INVALID_VERIFICATION_CODE") {
        setServerError("Invalid or expired confirmation code.");
        return;
      }

      if (error.code === "ACCOUNT_BANNED") {
        setServerError("This account is banned.");
        return;
      }
    }

    setServerError(t("error.genericRegister"));
  };

  const handleVerify = async () => {
    if (!pendingVerification || !verificationCode.trim()) {
      return;
    }

    setVerifying(true);
    setServerError(null);

    try {
      const response = await verifyRegistration({
        email: pendingVerification.email,
        code: verificationCode,
      });
      applyAuthenticatedSession(response);
      navigate("/profile");
    } catch (error) {
      handleVerificationError(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!pendingVerification) {
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const nextVerification = await resendRegistrationVerification({
        email: pendingVerification.email,
        channel: pendingVerification.channel,
      });
      setPendingVerification(nextVerification);
      setVerificationCode("");
    } catch (error) {
      handleVerificationError(error);
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

          {pendingVerification && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800 }}>
                  {copy.sent.replace("{target}", pendingVerification.maskedTarget)}
                </Typography>
                {pendingVerification.previewCode && (
                  <Typography>
                    {copy.preview}: <strong>{pendingVerification.previewCode}</strong>
                  </Typography>
                )}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label={copy.code}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        autoComplete: "one-time-code",
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    disabled={verifying || !verificationCode.trim()}
                    onClick={() => {
                      void handleVerify();
                    }}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    {verifying ? copy.verifying : copy.verify}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={submitting || verifying}
                    onClick={() => {
                      void handleResend();
                    }}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    {copy.resend}
                  </Button>
                </Stack>
              </Stack>
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

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {copy.channel}
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={verificationChannel}
                onChange={(_, nextChannel: "email" | "sms" | null) => {
                  if (nextChannel) {
                    setValue("verificationChannel", nextChannel, {
                      shouldValidate: true,
                    });
                  }
                }}
                size="small"
              >
                <ToggleButton value="email">{copy.emailChannel}</ToggleButton>
                <ToggleButton value="sms">{copy.smsChannel}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {verificationChannel === "sms" && (
              <TextField
                fullWidth
                label={copy.phone}
                {...register("phone")}
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                slotProps={{
                  htmlInput: {
                    inputMode: "tel",
                    autoComplete: "tel",
                  },
                }}
              />
            )}

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
              startIcon={
                submitting ? <CircularProgress size={18} color="inherit" /> : undefined
              }
              sx={{
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {submitting ? t("auth.creatingAccount") : t("auth.submitRegister")}
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
