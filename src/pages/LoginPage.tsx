import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import type { AppDispatch } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import { replaceCommunityState } from "../features/community/communitySlice";
import { hydrateCompanionState } from "../features/companion";
import { replaceFridgeState } from "../features/fridge/fridgeSlice";
import { replaceMealState } from "../features/meal/mealSlice";
import { replaceProfileState } from "../features/profile/profileSlice";
import { replaceWaterState } from "../features/water/waterSlice";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  login as loginApi,
} from "../shared/api/auth";
import { getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { readAuthIdentityHint, writeAuthIdentityHint } from "@features/auth/authIdentity";
import { captureRuntimeEvent } from "@integration/runtime/analytics";
import { getSyncOutboxMeta } from "../shared/lib/syncOutbox";
import { useLanguage } from "../shared/language";
import { AuthSurface } from "@shared/ui";

type FormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const identityHint = useMemo(() => readAuthIdentityHint(), []);
  const loginNotice =
    typeof (location.state as { notice?: unknown } | null)?.notice === "string"
      ? String((location.state as { notice?: string }).notice)
      : null;

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.invalidEmail")),
        password: z.string().min(1, t("validation.passwordRequired")),
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
      email: identityHint.email ?? "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const { user, snapshot } = await loginApi(data.email, data.password);
      writeAuthIdentityHint({
        name: user.name,
        email: user.email,
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
        dispatch(replaceFridgeState(snapshot.fridge));
        dispatch(replaceCommunityState(snapshot.community));
        dispatch(hydrateCompanionState(snapshot.companion));
      }

      captureRuntimeEvent("login_completed", {
        authMode: getAuthRuntimeInfo().mode,
        hasCloudSnapshot: Boolean(snapshot),
        pendingSyncChanges: getSyncOutboxMeta().pendingChanges,
      });

      navigate("/home");
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === "TOO_MANY_ATTEMPTS") {
          setServerError(t("error.tooManyAttempts"));
        } else if (error.code === "REGISTRATION_NOT_VERIFIED") {
          setServerError(t("auth.notVerified"));
        } else if (error.code === "ACCOUNT_BANNED") {
          setServerError(t("auth.accountBanned"));
        } else if (error.code === "REMOTE_API_UNAVAILABLE") {
          setServerError(t("error.backendUnavailable"));
        } else {
          setServerError(t("error.invalidCredentials"));
        }
      } else {
        setServerError(t("error.genericLogin"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSurface>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {t("brand.name")}
            </Typography>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              {t("auth.loginTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {t("auth.loginSubtitle")}
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {serverError}
            </Alert>
          )}
          {loginNotice && (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              {loginNotice}
            </Alert>
          )}

          <Stack
            component="form"
            spacing={2}
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
          >
            <TextField
              label={t("form.email")}
              type="email"
              fullWidth
              {...register("email")}
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />

            <TextField
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              fullWidth
              {...register("password")}
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
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

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Typography
                component={Link}
                to="/forgot-password"
                sx={{
                  color: "#0f766e",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {t("auth.forgotPassword")}
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={
                submitting ? <CircularProgress size={18} color="inherit" /> : undefined
              }
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {submitting ? t("auth.signingIn") : t("auth.submitLogin")}
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
            {t("auth.noAccount")}{" "}
            <Box
              component={Link}
              to="/register"
              sx={{
                color: "#0f766e",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline",
              }}
            >
              {t("auth.registerLink")}
            </Box>
          </Typography>
        </Stack>
    </AuthSurface>
  );
};

export default LoginPage;
