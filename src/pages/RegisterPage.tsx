import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import {
  applyRemoteSnapshotWithSyncPolicy,
} from "@features/auth/sessionSnapshot";
import { buildSessionProfileState } from "@features/auth/authSessionProfile";
import { createCompanionRewardAnalyticsPayload } from "../features/companion";
import { applyCompanionRewardInCloud } from "../features/companion/companionCloudSync";
import {
  replaceProfileState,
} from "../features/profile/profileSlice";
import { saveProfileStateToCloud } from "../features/profile/profileCloudSync";
import { normalizeCompanionState } from "../features/companion/model/store";
import {
  AuthApiError,
  checkRegistrationAvailability,
  getAuthRuntimeInfo,
  register as registerApi,
  resendRegistrationVerification,
  type RegistrationAvailabilityResult,
  type RegistrationVerificationPending,
} from "../shared/api/auth";
import type { AuthResponse } from "@domain/user/types";
import { useLanguage } from "../shared/language";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { AuthSurface } from "@shared/ui";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AvailabilityFieldState = "idle" | "checking" | "available" | "taken" | "invalid" | "unavailable";

type AvailabilitySnapshot = {
  value: string;
  state: AvailabilityFieldState;
};

const availabilityIconSx = {
  width: 22,
  height: 22,
};

const CheckCircleIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ ...availabilityIconSx, color: "#22c55e" }}>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 13.6-3.7-3.7 1.4-1.4 2.3 2.3 4.8-4.8 1.4 1.4-6.2 6.2Z"
    />
  </SvgIcon>
);

const XCircleIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ ...availabilityIconSx, color: "#ef4444" }}>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 12.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1Z"
    />
  </SvgIcon>
);

const normalizeAvailabilityInput = (value: string) => value.trim();

const isEmailInputValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const availabilityTranslationKeys = {
  checking: "auth.checkingAvailability",
  unavailable: "auth.availabilityUnavailable",
  nameInUse: "auth.nameInUse",
  emailInUse: "error.emailInUse",
} as const;

const resolveAvailabilityState = (
  field: RegistrationAvailabilityResult["email"] | RegistrationAvailabilityResult["name"],
  fallbackInvalid: boolean
): AvailabilityFieldState => {
  if (!field.checked) {
    return fallbackInvalid ? "invalid" : "idle";
  }

  if (!field.valid) {
    return "invalid";
  }

  return field.available ? "available" : "taken";
};

const getCurrentAvailabilityState = (
  snapshot: AvailabilitySnapshot,
  value: string,
  canCheck: boolean
): AvailabilityFieldState => {
  if (!value) {
    return "idle";
  }

  if (!canCheck) {
    return "invalid";
  }

  return snapshot.value === value ? snapshot.state : "idle";
};

const AvailabilityAdornment = ({ state }: { state: AvailabilityFieldState }) => {
  if (state === "checking") {
    return <CircularProgress size={18} />;
  }

  if (state === "available") {
    return <CheckCircleIcon />;
  }

  if (state === "taken" || state === "invalid") {
    return <XCircleIcon />;
  }

  return null;
};

const defaultProfileBootstrap = {
  age: 25,
  weight: 70,
  height: 175,
  gender: "male" as const,
  activity: "moderate" as const,
  goal: "maintain" as const,
};

const isVerificationPending = (
  value: unknown
): value is RegistrationVerificationPending =>
  typeof value === "object" &&
  value !== null &&
  (value as { requiresVerification?: unknown }).requiresVerification === true;

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const companion = useSelector((state: RootState) => state.companion);
  const navigate = useNavigate();
  const { t, appLanguage, resetOnboarding } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] =
    useState<RegistrationVerificationPending | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [nameAvailability, setNameAvailability] =
    useState<AvailabilitySnapshot>({ value: "", state: "idle" });
  const [emailAvailability, setEmailAvailability] =
    useState<AvailabilitySnapshot>({ value: "", state: "idle" });

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
    control,
    setError,
    clearErrors,
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
  const nameField = register("name");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");
  const watchedName = useWatch({ control, name: "name" });
  const watchedEmail = useWatch({ control, name: "email" });
  const availabilityName = normalizeAvailabilityInput(watchedName ?? "");
  const availabilityEmail = normalizeAvailabilityInput(watchedEmail ?? "").toLowerCase();
  const nameCanCheck = availabilityName.length >= 2;
  const emailCanCheck = isEmailInputValid(availabilityEmail);
  const displayedNameAvailability = getCurrentAvailabilityState(
    nameAvailability,
    availabilityName,
    nameCanCheck
  );
  const displayedEmailAvailability = getCurrentAvailabilityState(
    emailAvailability,
    availabilityEmail,
    emailCanCheck
  );

  useEffect(() => {
    if (!nameCanCheck && !emailCanCheck) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      if (nameCanCheck) {
        setNameAvailability({ value: availabilityName, state: "checking" });
      }

      if (emailCanCheck) {
        setEmailAvailability({ value: availabilityEmail, state: "checking" });
      }

      checkRegistrationAvailability({
        name: nameCanCheck ? availabilityName : undefined,
        email: emailCanCheck ? availabilityEmail : undefined,
      })
        .then((result) => {
          if (controller.signal.aborted) {
            return;
          }

          if (nameCanCheck) {
            setNameAvailability({
              value: availabilityName,
              state: resolveAvailabilityState(result.name, false),
            });
          }

          if (emailCanCheck) {
            setEmailAvailability({
              value: availabilityEmail,
              state: resolveAvailabilityState(result.email, false),
            });
          }

          if (result.name.checked && result.name.available) {
            clearErrors("name");
          }

          if (result.email.checked && result.email.available) {
            clearErrors("email");
          }
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }

          setNameAvailability((current) =>
            nameCanCheck &&
            current.value === availabilityName &&
            current.state === "checking"
              ? { value: availabilityName, state: "unavailable" }
              : current
          );
          setEmailAvailability((current) =>
            emailCanCheck &&
            current.value === availabilityEmail &&
            current.state === "checking"
              ? { value: availabilityEmail, state: "unavailable" }
              : current
          );

          if (
            error instanceof AuthApiError &&
            error.code === "REMOTE_API_UNAVAILABLE"
          ) {
            return;
          }
        });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [availabilityEmail, availabilityName, clearErrors, emailCanCheck, nameCanCheck]);

  const applyAuthenticatedSession = async ({ user, snapshot }: AuthResponse) => {
    const hydrationResult = applyRemoteSnapshotWithSyncPolicy(dispatch, snapshot);

    dispatch(
      setCredentials({
        user,
        syncMode: getAuthRuntimeInfo().mode,
        syncOutbox: hydrationResult.syncOutbox,
        cloudMeta: hydrationResult.cloudMeta,
      })
    );

    const sessionProfile = buildSessionProfileState({
      user,
      snapshot: hydrationResult.useSnapshotForSessionBootstrap ? snapshot : null,
      language: appLanguage,
    });

    try {
      await saveProfileStateToCloud(dispatch, sessionProfile);
      dispatch(replaceProfileState(sessionProfile));
    } catch {
      // Registration/session succeeded. The sync slice records the profile
      // language failure, and we avoid showing unsaved profile data locally.
    }

    resetOnboarding();

    const sessionCompanion =
      snapshot && "companion" in snapshot
        ? normalizeCompanionState(snapshot.companion)
        : companion;

    try {
      await applyCompanionRewardInCloud(
        dispatch,
        { companion: sessionCompanion },
        "registration_completed"
      );

      return createCompanionRewardAnalyticsPayload("registration_completed");
    } catch {
      return {};
    }
  };

  const getNameHelperText = () => {
    if (errors.name?.message) {
      return errors.name.message;
    }

    if (displayedNameAvailability === "available") {
      return t("auth.nameAvailable");
    }

    if (displayedNameAvailability === "taken") {
      return t(availabilityTranslationKeys.nameInUse);
    }

    if (displayedNameAvailability === "checking") {
      return t(availabilityTranslationKeys.checking);
    }

    if (displayedNameAvailability === "unavailable") {
      return t(availabilityTranslationKeys.unavailable);
    }

    return undefined;
  };

  const getEmailHelperText = () => {
    if (errors.email?.message) {
      return errors.email.message;
    }

    if (displayedEmailAvailability === "available") {
      return t("auth.emailAvailable");
    }

    if (displayedEmailAvailability === "taken") {
      return t(availabilityTranslationKeys.emailInUse);
    }

    if (displayedEmailAvailability === "checking") {
      return t(availabilityTranslationKeys.checking);
    }

    if (displayedEmailAvailability === "unavailable") {
      return t(availabilityTranslationKeys.unavailable);
    }

    return undefined;
  };

  const availabilityBlocksSubmit =
    displayedNameAvailability === "checking" ||
    displayedEmailAvailability === "checking" ||
    displayedNameAvailability === "taken" ||
    displayedEmailAvailability === "taken";

  const onSubmit = async (data: FormData) => {
    if (displayedNameAvailability === "taken") {
      setError("name", {
        type: "manual",
        message: t(availabilityTranslationKeys.nameInUse),
      });
      return;
    }

    if (displayedEmailAvailability === "taken") {
      setError("email", {
        type: "manual",
        message: t(availabilityTranslationKeys.emailInUse),
      });
      return;
    }

    setSubmitting(true);
    setServerError(null);
    setPendingVerification(null);
    trackRuntimeEvent("signup_started", {
      authMode: getAuthRuntimeInfo().mode,
      language: appLanguage,
    });

    try {
      const response = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        ...defaultProfileBootstrap,
      });

      if (isVerificationPending(response)) {
        trackRuntimeEvent("signup_completed", {
          authMode: getAuthRuntimeInfo().mode,
          requiresVerification: true,
          language: appLanguage,
        });
        setPendingVerification(response);
        return;
      }

      const companionRewardPayload = await applyAuthenticatedSession(response);
      trackRuntimeEvent("signup_completed", {
        authMode: getAuthRuntimeInfo().mode,
        requiresVerification: false,
        hasCloudSnapshot: Boolean(response.snapshot),
        language: appLanguage,
        ...companionRewardPayload,
      });
      navigate("/onboarding");
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_IN_USE") {
        setError("email", {
          type: "manual",
          message: t(availabilityTranslationKeys.emailInUse),
        });
        setEmailAvailability({
          value: normalizeAvailabilityInput(data.email).toLowerCase(),
          state: "taken",
        });
      } else if (error instanceof AuthApiError && error.code === "NAME_IN_USE") {
        setError("name", {
          type: "manual",
          message: t(availabilityTranslationKeys.nameInUse),
        });
        setNameAvailability({
          value: normalizeAvailabilityInput(data.name),
          state: "taken",
        });
      } else if (
        error instanceof AuthApiError &&
        error.code === "REMOTE_API_UNAVAILABLE"
      ) {
        setServerError(t("error.backendUnavailable"));
      } else if (
        error instanceof AuthApiError &&
        error.code === "WEAK_PASSWORD"
      ) {
        setServerError(t("validation.passwordMin"));
      } else if (
        error instanceof AuthApiError &&
        error.code === "VERIFICATION_DELIVERY_UNAVAILABLE"
      ) {
        setServerError(t("auth.deliveryUnavailable"));
      } else {
        setServerError(t("error.genericRegister"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationError = (error: unknown) => {
    if (error instanceof AuthApiError) {
      if (error.code === "INVALID_VERIFICATION_LINK") {
        setServerError(t("auth.invalidConfirmationLink"));
        return;
      }

      if (error.code === "ACCOUNT_BANNED") {
        setServerError(t("auth.accountBanned"));
        return;
      }

      if (error.code === "VERIFICATION_DELIVERY_UNAVAILABLE") {
        setServerError(t("auth.deliveryUnavailable"));
        return;
      }
    }

    setServerError(t("error.genericRegister"));
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
      });
      setPendingVerification(nextVerification);
    } catch (error) {
      handleVerificationError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSurface maxWidth={520} minHeight="70vh">
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AssistantAvatar name="Alex" variant="dragon" mood="happy" size={72} />
            <Box>
              <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
                {t("brand.name")}
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                {t("auth.registerTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {t("auth.registrationNote")}
              </Typography>
            </Box>
          </Stack>

          <Alert severity="success" icon={false} sx={{ borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800 }}>{t("auth.registrationAssistantIntro")}</Typography>
          </Alert>

          {serverError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {serverError}
            </Alert>
          )}

          {pendingVerification && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800 }}>
                  {t("auth.confirmationSent", { target: pendingVerification.maskedTarget })}
                </Typography>
                <Typography color="text.secondary">{t("auth.openConfirmationEmail")}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    disabled={submitting}
                    onClick={() => {
                      void handleResend();
                    }}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    {t("auth.resend")}
                  </Button>
                </Stack>
              </Stack>
            </Alert>
          )}

          <Stack
            component="form"
            spacing={2}
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
          >
            <TextField
              fullWidth
              label={t("form.name")}
              {...nameField}
              onChange={(event) => {
                setServerError(null);
                void nameField.onChange(event);
              }}
              autoComplete="name"
              error={Boolean(errors.name) || displayedNameAvailability === "taken"}
              helperText={getNameHelperText()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <AvailabilityAdornment state={displayedNameAvailability} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label={t("form.email")}
              type="email"
              {...emailField}
              onChange={(event) => {
                setServerError(null);
                void emailField.onChange(event);
              }}
              autoComplete="email"
              error={Boolean(errors.email) || displayedEmailAvailability === "taken"}
              helperText={getEmailHelperText()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <AvailabilityAdornment state={displayedEmailAvailability} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              {...passwordField}
              autoComplete="new-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              inputProps={{
                autoComplete: "new-password",
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((current) => !current)}
                      showLabel={t("auth.showPassword")}
                      hideLabel={t("auth.hidePassword")}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label={t("form.confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              {...confirmPasswordField}
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              inputProps={{
                autoComplete: "new-password",
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityButton
                      visible={confirmPasswordVisible}
                      onToggle={() => setConfirmPasswordVisible((current) => !current)}
                      showLabel={t("auth.showPassword")}
                      hideLabel={t("auth.hidePassword")}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || availabilityBlocksSubmit}
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
    </AuthSurface>
  );
};

export default RegisterPage;
