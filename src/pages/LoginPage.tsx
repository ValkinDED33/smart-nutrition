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
import { replaceProfileState } from "../features/profile/profileSlice";
import { replaceWaterState } from "../features/water/waterSlice";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  login as loginApi,
} from "../shared/api/auth";
import { getSnapshotMetaFromSnapshot } from "../shared/lib/appSnapshot";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { readAuthIdentityHint, writeAuthIdentityHint } from "../shared/lib/authIdentity";
import { getSyncOutboxMeta } from "../shared/lib/syncOutbox";
import { useLanguage } from "../shared/language";

type FormData = {
  email: string;
  password: string;
};

const authPageCopy = {
  uk: {
    forgotPassword: "Забули пароль?",
    showPassword: "Показати пароль",
    hidePassword: "Сховати пароль",
  },
  pl: {
    forgotPassword: "Zapomniałeś hasła?",
    showPassword: "Pokaż hasło",
    hidePassword: "Ukryj hasło",
  },
} as const;

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const identityHint = useMemo(() => readAuthIdentityHint(), []);
  const copy = authPageCopy[language];

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.invalidEmail")),
        password: z
          .string()
          .min(10, t("validation.passwordMin"))
          .regex(/[A-Z]/, t("validation.passwordUpper"))
          .regex(/[a-z]/, t("validation.passwordLower"))
          .regex(/\d/, t("validation.passwordDigit"))
          .regex(/[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]/, t("validation.passwordSymbol")),
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
      }

      navigate("/home");
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === "TOO_MANY_ATTEMPTS") {
          setServerError(t("error.tooManyAttempts"));
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
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "75vh" }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 540,
          p: { xs: 3, md: 4.5 },
          borderRadius: 7,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(247,250,252,0.9) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {t("brand.name")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
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

          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label={t("form.email")}
              type="email"
              fullWidth
              {...register("email")}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />

            <TextField
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              fullWidth
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
                {copy.forgotPassword}
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {t("auth.submitLogin")}
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
      </Paper>
    </Box>
  );
};

export default LoginPage;
