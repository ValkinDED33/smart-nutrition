import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
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
import { getProfileCloudActionCopy } from "../features/profile/profileCloudActionCopy";
import { useProfileCloudAction } from "../features/profile/useProfileCloudAction";
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
import { useAppColorMode } from "../shared/theme/colorMode";
import type { AppLanguage } from "../shared/types/i18n";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { AuthSurface } from "@shared/ui";
import {
  PENDING_PARTNER_INVITE_KEY,
  setClientStorageItem,
} from "@shared/lib/clientPersistence";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegistrationStep =
  | "language"
  | "theme"
  | "name"
  | "email"
  | "password";

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

const gmailInboxUrl = "https://mail.google.com/mail/u/0/#inbox";
const outlookInboxUrl = "https://outlook.live.com/mail/0/inbox";
const icloudInboxUrl = "https://www.icloud.com/mail/";
const protonInboxUrl = "https://mail.proton.me/u/0/inbox";

const emailInboxUrlsByDomain = new Map<string, string>([
  ["gmail.com", gmailInboxUrl],
  ["googlemail.com", gmailInboxUrl],
  ["outlook.com", outlookInboxUrl],
  ["hotmail.com", outlookInboxUrl],
  ["live.com", outlookInboxUrl],
  ["yahoo.com", "https://mail.yahoo.com/"],
  ["icloud.com", icloudInboxUrl],
  ["me.com", icloudInboxUrl],
  ["proton.me", protonInboxUrl],
  ["protonmail.com", protonInboxUrl],
  ["ukr.net", "https://mail.ukr.net/"],
  ["i.ua", "https://mail.i.ua/"],
  ["mail.ru", "https://e.mail.ru/inbox/"],
  ["yandex.ru", "https://mail.yandex.ru/"],
  ["yandex.com", "https://mail.yandex.com/"],
  ["rambler.ru", "https://mail.rambler.ru/"],
]);

const getEmailInboxUrl = (email: string) => {
  const domain = email.split("@").pop()?.trim().toLowerCase();

  if (!domain) {
    return "mailto:";
  }

  return emailInboxUrlsByDomain.get(domain) ?? `https://${domain}`;
};

const getAvailabilityBlockMessageKey = (
  field: "name" | "email",
  state: AvailabilityFieldState
) => {
  if (state === "taken") {
    return field === "name"
      ? availabilityTranslationKeys.nameInUse
      : availabilityTranslationKeys.emailInUse;
  }

  if (state === "checking" || state === "idle") {
    return availabilityTranslationKeys.checking;
  }

  return availabilityTranslationKeys.unavailable;
};

const defaultProfileBootstrap = {
  age: 25,
  weight: 70,
  height: 175,
  gender: "male" as const,
  activity: "moderate" as const,
  goal: "maintain" as const,
};

const registrationStepOrder: RegistrationStep[] = [
  "language",
  "theme",
  "name",
  "email",
  "password",
];

const registrationCopy = {
  uk: {
    languageTitle: "Оберіть мову",
    themeTitle: "Оберіть тему",
    nameTitle: "Ваш нікнейм",
    emailTitle: "Ваш email",
    passwordTitle: "Створіть пароль",
    next: "Далі",
    back: "Назад",
    light: "Світла",
    dark: "Темна",
    portalTitle: "Ваш AI-помічник готує простір",
    portalSubtitle:
      "Це не калькулятор калорій. Ми збираємо живий wellness-профіль: харчування, воду, нагадування і AI-підказки в одному місці.",
    progressLabel: "Крок",
    capabilities: ["AI-помічник", "Сканер їжі", "Розумні нагадування"],
    stepHint: "Один маленький крок, і помічник підлаштується під вас.",
  },
  pl: {
    languageTitle: "Wybierz język",
    themeTitle: "Wybierz motyw",
    nameTitle: "Twój nick",
    emailTitle: "Twój email",
    passwordTitle: "Utwórz hasło",
    next: "Dalej",
    back: "Wstecz",
    light: "Jasny",
    dark: "Ciemny",
    portalTitle: "Twój asystent AI przygotowuje przestrzeń",
    portalSubtitle:
      "To nie jest kalkulator kalorii. Budujemy żywy profil wellness: jedzenie, wodę, przypomnienia i wskazówki AI w jednym miejscu.",
    progressLabel: "Krok",
    capabilities: ["Asystent AI", "Skaner jedzenia", "Mądre przypomnienia"],
    stepHint: "Jeden mały krok i asystent dopasuje się do Ciebie.",
  },
  en: {
    languageTitle: "Choose language",
    themeTitle: "Choose theme",
    nameTitle: "Your nickname",
    emailTitle: "Your email",
    passwordTitle: "Create password",
    next: "Next",
    back: "Back",
    light: "Light",
    dark: "Dark",
    portalTitle: "Your AI assistant is preparing your space",
    portalSubtitle:
      "This is not a calorie calculator. We build a living wellness profile: food, water, reminders, and AI guidance in one place.",
    progressLabel: "Step",
    capabilities: ["AI companion", "Food scanner", "Smart reminders"],
    stepHint: "One small step and the assistant adapts to you.",
  },
} as const;

const getStepField = (step: RegistrationStep): keyof FormData | null => {
  switch (step) {
    case "name":
      return "name";
    case "email":
      return "email";
    case "password":
      return "password";
    case "language":
    case "theme":
    default:
      return null;
  }
};

const getRegistrationCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return registrationCopy.pl;
    case "en":
      return registrationCopy.en;
    case "uk":
    default:
      return registrationCopy.uk;
  }
};

const getRegistrationLanguageLabel = (
  labels: Record<AppLanguage, string>,
  language: AppLanguage
) => {
  switch (language) {
    case "pl":
      return labels.pl;
    case "en":
      return labels.en;
    case "uk":
    default:
      return labels.uk;
  }
};

const getRegistrationStepTitle = (
  copy: (typeof registrationCopy)[keyof typeof registrationCopy],
  step: RegistrationStep
) => {
  switch (step) {
    case "language":
      return copy.languageTitle;
    case "theme":
      return copy.themeTitle;
    case "name":
      return copy.nameTitle;
    case "email":
      return copy.emailTitle;
    case "password":
    default:
      return copy.passwordTitle;
  }
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
  const [searchParams] = useSearchParams();
  const { t, appLanguage, languageLabels, setLanguage, resetOnboarding } = useLanguage();
  const { mode: colorMode, setMode: setColorMode } = useAppColorMode();
  const stepCopy = getRegistrationCopy(appLanguage);
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const [registrationStep, setRegistrationStep] =
    useState<RegistrationStep>("language");
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
    trigger,
    setError,
    clearErrors,
    formState: { dirtyFields, errors, submitCount, touchedFields },
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
  const verificationInboxUrl = pendingVerification
    ? getEmailInboxUrl(pendingVerification.email)
    : null;
  const shouldShowConfirmPasswordError =
    Boolean(errors.confirmPassword) &&
    (Boolean(dirtyFields.confirmPassword) ||
      Boolean(touchedFields.confirmPassword) ||
      submitCount > 0);

  useEffect(() => {
    const partnerInvite = searchParams.get("partnerInvite")?.trim().toUpperCase();

    if (/^SN-[A-Z0-9]{6,12}$/.test(partnerInvite ?? "")) {
      setClientStorageItem(PENDING_PARTNER_INVITE_KEY, partnerInvite ?? "");
    }
  }, [searchParams]);

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
      await profileAction.runProfileStateSave(sessionProfile);
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
    displayedNameAvailability !== "available" ||
    displayedEmailAvailability !== "available";
  const availabilityBlocksNext =
    (registrationStep === "name" &&
      nameCanCheck &&
      displayedNameAvailability !== "available") ||
    (registrationStep === "email" &&
      emailCanCheck &&
      displayedEmailAvailability !== "available");
  const currentStepIndex = registrationStepOrder.indexOf(registrationStep);
  const currentStepField = getStepField(registrationStep);
  const canGoBack = currentStepIndex > 0;
  const registrationProgress =
    ((currentStepIndex + 1) / registrationStepOrder.length) * 100;
  const activeStepTitle = getRegistrationStepTitle(stepCopy, registrationStep);

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    setServerError(null);
    const previousStep = registrationStepOrder[currentStepIndex - 1];

    if (previousStep) {
      setRegistrationStep(previousStep);
    }
  };

  const goNext = async () => {
    setServerError(null);

    if (currentStepField) {
      const valid = await trigger(currentStepField);

      if (!valid) {
        return;
      }
    }

    if (registrationStep === "name" && displayedNameAvailability !== "available") {
      setError("name", {
        type: "manual",
        message: t(getAvailabilityBlockMessageKey("name", displayedNameAvailability)),
      });
      return;
    }

    if (registrationStep === "email" && displayedEmailAvailability !== "available") {
      setError("email", {
        type: "manual",
        message: t(getAvailabilityBlockMessageKey("email", displayedEmailAvailability)),
      });
      return;
    }

    if (currentStepIndex < registrationStepOrder.length - 1) {
      const nextStep = registrationStepOrder[currentStepIndex + 1];
      if (nextStep) {
        setRegistrationStep(nextStep);
      }
    }
  };

  const handleLanguageSelect = (language: AppLanguage) => {
    setLanguage(language);
    setRegistrationStep("theme");
  };

  const onSubmit = async (data: FormData) => {
    if (displayedNameAvailability !== "available") {
      setError("name", {
        type: "manual",
        message: t(getAvailabilityBlockMessageKey("name", displayedNameAvailability)),
      });
      setRegistrationStep("name");
      return;
    }

    if (displayedEmailAvailability !== "available") {
      setError("email", {
        type: "manual",
        message: t(getAvailabilityBlockMessageKey("email", displayedEmailAvailability)),
      });
      setRegistrationStep("email");
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
        languagePreference: appLanguage,
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
          <Box
            sx={{
              position: "relative",
              p: { xs: 2, sm: 2.5 },
              borderRadius: 1,
              border: "1px solid var(--sn-border-strong)",
              background:
                "radial-gradient(circle at 82% 18%, rgba(132,204,22,0.22), transparent 30%), radial-gradient(circle at 8% 0%, rgba(20,184,166,0.18), transparent 34%), rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    width: 104,
                    height: 104,
                    borderRadius: "50%",
                    background: "var(--sn-portal-ring)",
                    opacity: 0.72,
                  },
                }}
              >
                <AssistantAvatar name="Assistant" variant="dragon" mood="celebrate" size={76} active />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" sx={{ color: "var(--sn-accent)", fontWeight: 900 }}>
                  {t("brand.name")}
                </Typography>
                <Typography component="h1" variant="h4" sx={{ fontWeight: 950, mb: 0.8 }}>
                  {stepCopy.portalTitle}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {stepCopy.portalSubtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
              {stepCopy.capabilities.map((capability) => (
                <Chip
                  key={capability}
                  label={capability}
                  size="small"
                  sx={{
                    border: "1px solid var(--sn-border-soft)",
                    backgroundColor: "var(--sn-surface-glass)",
                    color: "var(--sn-text-primary)",
                    fontWeight: 850,
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              backgroundColor: "var(--sn-surface-glass)",
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>{activeStepTitle}</Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }}>
                  {stepCopy.progressLabel} {currentStepIndex + 1}/{registrationStepOrder.length}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={registrationProgress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: "var(--sn-surface-muted)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #84cc16 100%)",
                  },
                }}
              />
              <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {stepCopy.stepHint}
              </Typography>
            </Stack>
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
                  {t("auth.confirmationSent", { target: pendingVerification.maskedTarget })}
                </Typography>
                <Typography color="text.secondary">{t("auth.openConfirmationEmail")}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  {verificationInboxUrl && (
                    <Button
                      component="a"
                      href={verificationInboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      sx={{ textTransform: "none", fontWeight: 900 }}
                    >
                      {t("auth.openMailbox")}
                    </Button>
                  )}
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
            {registrationStep === "language" && (
              <Stack spacing={1.2}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {stepCopy.languageTitle}
                </Typography>
                {(["uk", "pl", "en"] as const).map((language) => (
                  <Button
                    key={language}
                    type="button"
                    variant={appLanguage === language ? "contained" : "outlined"}
                    size="large"
                    onClick={() => handleLanguageSelect(language)}
                    sx={{ justifyContent: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                  >
                    {language === "uk" ? "🇺🇦" : language === "pl" ? "🇵🇱" : "🇬🇧"}{" "}
                    {getRegistrationLanguageLabel(languageLabels, language)}
                  </Button>
                ))}
              </Stack>
            )}

            {registrationStep === "theme" && (
              <Stack spacing={1.2}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {stepCopy.themeTitle}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  {(["light", "dark"] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={colorMode === mode ? "contained" : "outlined"}
                      size="large"
                      onClick={() => {
                        setColorMode(mode);
                        setRegistrationStep("name");
                      }}
                      sx={{ flex: 1, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                    >
                      {mode === "light" ? stepCopy.light : stepCopy.dark}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}

            {registrationStep === "name" && (
              <Stack spacing={1.2}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {stepCopy.nameTitle}
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
                  label={t("form.name")}
                  {...nameField}
                  onChange={(event) => {
                    setServerError(null);
                    void nameField.onChange(event);
                  }}
                  autoComplete="nickname"
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
              </Stack>
            )}

            {registrationStep === "email" && (
              <Stack spacing={1.2}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {stepCopy.emailTitle}
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
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
              </Stack>
            )}

            {registrationStep === "password" && (
              <Stack spacing={1.2}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {stepCopy.passwordTitle}
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
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
                  error={shouldShowConfirmPasswordError}
                  helperText={
                    shouldShowConfirmPasswordError
                      ? errors.confirmPassword?.message
                      : undefined
                  }
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
              </Stack>
            )}

            <Stack direction="row" spacing={1.2}>
              {canGoBack && (
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={goBack}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                >
                  {stepCopy.back}
                </Button>
              )}
              {registrationStep === "password" ? (
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting || availabilityBlocksSubmit}
                  startIcon={
                    submitting ? <CircularProgress size={18} color="inherit" /> : undefined
                  }
                  sx={{
                    flex: 1,
                    py: 1.5,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }}
                >
                  {submitting ? t("auth.creatingAccount") : t("auth.submitRegister")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  size="large"
                  disabled={availabilityBlocksNext}
                  onClick={() => {
                    void goNext();
                  }}
                  sx={{ flex: 1, py: 1.5, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                >
                  {stepCopy.next}
                </Button>
              )}
            </Stack>
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
