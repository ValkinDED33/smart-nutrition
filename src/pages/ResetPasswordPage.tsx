import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AuthApiError, resetPassword } from "../shared/api/auth";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { useLanguage } from "../shared/language";
import { clearSensitiveSearchParamsFromCurrentUrl } from "../shared/lib/sensitiveUrl";
import { AuthAssistantIntro, AuthSurface } from "@shared/ui";

type FormData = {
  password: string;
  confirmPassword: string;
};

const AUTH_INVALID_RESET_TOKEN_KEY = "auth.invalidResetToken";

const ResetPasswordPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [token] = useState(() => searchParams.get("token")?.trim() ?? "");

  useEffect(() => {
    clearSensitiveSearchParamsFromCurrentUrl(["token"]);
  }, []);

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, t("validation.passwordMin"))
            .max(10, t("validation.passwordMax"))
            .regex(/[A-Z]/, t("validation.passwordUpper"))
            .regex(/\d/, t("validation.passwordDigit")),
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
      password: "",
      confirmPassword: "",
    },
  });
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setServerError(t("auth.missingResetToken"));
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      await resetPassword(token, data.password);
      const localizedSuccessMessage = t("auth.resetSuccess");
      setSuccessMessage(localizedSuccessMessage);
      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { notice: localizedSuccessMessage },
        });
      }, 900);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === "INVALID_RESET_TOKEN") {
          setServerError(t(AUTH_INVALID_RESET_TOKEN_KEY));
        } else if (error.code === "WEAK_PASSWORD") {
          setServerError(t("auth.weakResetPassword"));
        } else if (error.code === "REMOTE_API_UNAVAILABLE") {
          setServerError(t("error.backendUnavailable"));
        } else {
          setServerError(t(AUTH_INVALID_RESET_TOKEN_KEY));
        }
      } else {
        setServerError(t(AUTH_INVALID_RESET_TOKEN_KEY));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSurface>
        <Stack spacing={3}>
          <AuthAssistantIntro
            eyebrow={t("brand.name")}
            title={t("auth.resetTitle")}
            subtitle={t("auth.resetSubtitle")}
            mood="coach"
            size={72}
          />

          {!token && <Alert severity="warning">{t("auth.missingResetToken")}</Alert>}
          {serverError && <Alert severity="error">{serverError}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <Stack
            component="form"
            spacing={2}
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="on"
          >
            <TextField
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              fullWidth
              disabled={!token || Boolean(successMessage)}
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
              label={t("form.confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              fullWidth
              disabled={!token || Boolean(successMessage)}
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
                      onToggle={() =>
                        setConfirmPasswordVisible((current) => !current)
                      }
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
              disabled={!token || submitting || Boolean(successMessage)}
              sx={{
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {submitting ? t("auth.resetSaving") : t("auth.resetSubmit")}
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
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
              {t("auth.backToLogin")}
            </Box>
          </Typography>
        </Stack>
    </AuthSurface>
  );
};

export default ResetPasswordPage;
