import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import {
  applyRemoteSnapshotToStore,
  getRemoteSnapshotMeta,
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
  getAuthRuntimeInfo,
  register as registerApi,
  resendRegistrationVerification,
  type RegistrationVerificationPending,
} from "../shared/api/auth";
import type { AuthResponse } from "@domain/user/types";
import { useLanguage } from "../shared/language";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { getSyncOutboxMeta } from "../shared/lib/syncOutbox";
import { AuthSurface } from "@shared/ui";

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
  const nameField = register("name");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  const applyAuthenticatedSession = async ({ user, snapshot }: AuthResponse) => {
    dispatch(
      setCredentials({
        user,
        syncMode: getAuthRuntimeInfo().mode,
        syncOutbox: getSyncOutboxMeta(),
        cloudMeta: getRemoteSnapshotMeta(snapshot),
      })
    );

    const canApplySnapshot = snapshot && getSyncOutboxMeta().pendingChanges === 0;

    if (canApplySnapshot) {
      applyRemoteSnapshotToStore(dispatch, snapshot);
    }

    const sessionProfile = buildSessionProfileState({
      user,
      snapshot: canApplySnapshot ? snapshot : null,
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

  const onSubmit = async (data: FormData) => {
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
        setServerError(t("error.emailInUse"));
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
              autoComplete="name"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />

            <TextField
              fullWidth
              label={t("form.email")}
              type="email"
              {...emailField}
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
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
    </AuthSurface>
  );
};

export default RegisterPage;
