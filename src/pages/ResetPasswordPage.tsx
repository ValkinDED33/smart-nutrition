import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
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
import { AuthApiError, resetPassword } from "../shared/api/auth";
import { PasswordVisibilityButton } from "../shared/components/PasswordVisibilityButton";
import { useLanguage } from "../shared/language";

type FormData = {
  password: string;
  confirmPassword: string;
};

const resetPasswordCopy = {
  uk: {
    title: "Новий пароль",
    subtitle:
      "Встановіть новий пароль. Посилання для скидання одноразове і має обмежений час дії.",
    submit: "Зберегти новий пароль",
    saving: "Зберігаю...",
    invalidToken:
      "Посилання для скидання недійсне або вже прострочене.",
    weakPassword:
      "Пароль має містити щонайменше 10 символів, велику, малу літеру, цифру та символ.",
    missingToken:
      "Тут немає reset-токена. Відкрийте сторінку з посилання з листа або preview.",
    backToLogin: "Перейти до входу",
    showPassword: "Показати пароль",
    hidePassword: "Сховати пароль",
  },
  pl: {
    title: "Nowe hasło",
    subtitle:
      "Ustaw nowe hasło. Link resetu jest jednorazowy i ma ograniczony czas ważności.",
    submit: "Zapisz nowe hasło",
    saving: "Zapisuję...",
    invalidToken: "Link resetu jest nieprawidłowy albo już wygasł.",
    weakPassword:
      "Hasło musi mieć co najmniej 10 znaków, wielką, małą literę, cyfrę i symbol.",
    missingToken:
      "Brakuje tokenu resetu. Otwórz stronę z linku z maila albo preview.",
    backToLogin: "Przejdź do logowania",
    showPassword: "Pokaż hasło",
    hidePassword: "Ukryj hasło",
  },
} as const;

const ResetPasswordPage = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const copy = resetPasswordCopy[language];
  const token = searchParams.get("token")?.trim() ?? "";

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(10, t("validation.passwordMin"))
            .regex(/[A-Z]/, t("validation.passwordUpper"))
            .regex(/[a-z]/, t("validation.passwordLower"))
            .regex(/\d/, t("validation.passwordDigit"))
            .regex(/[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]/, t("validation.passwordSymbol")),
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

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setServerError(copy.missingToken);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const result = await resetPassword(token, data.password);
      setSuccessMessage(result.message);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === "INVALID_RESET_TOKEN") {
          setServerError(copy.invalidToken);
        } else if (error.code === "WEAK_PASSWORD") {
          setServerError(copy.weakPassword);
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError(copy.invalidToken);
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
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {t("brand.name")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {copy.subtitle}
            </Typography>
          </Box>

          {!token && <Alert severity="warning">{copy.missingToken}</Alert>}
          {serverError && <Alert severity="error">{serverError}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label={t("form.password")}
              type={passwordVisible ? "text" : "password"}
              fullWidth
              disabled={!token || Boolean(successMessage)}
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
              label={t("form.confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              fullWidth
              disabled={!token || Boolean(successMessage)}
              {...register("confirmPassword")}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PasswordVisibilityButton
                      visible={confirmPasswordVisible}
                      onToggle={() =>
                        setConfirmPasswordVisible((current) => !current)
                      }
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
              disabled={!token || submitting || Boolean(successMessage)}
              sx={{
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {submitting ? copy.saving : copy.submit}
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
              {copy.backToLogin}
            </Box>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
