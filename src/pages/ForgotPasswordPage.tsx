import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AuthApiError,
  requestPasswordReset,
  type PasswordResetRequestResult,
} from "../shared/api/auth";
import { readAuthIdentityHint, writeAuthIdentityHint } from "../shared/lib/authIdentity";
import { useLanguage } from "../shared/language";

type FormData = {
  email: string;
};

const forgotPasswordCopy = {
  uk: {
    title: "Відновлення пароля",
    subtitle:
      "Введіть email акаунта, і ми підготуємо посилання для скидання пароля.",
    submit: "Надіслати посилання",
    sending: "Готую посилання...",
    previewTitle: "Попередній перегляд посилання",
    previewHint:
      "У цій збірці email-доставка ще не налаштована. Нижче показано чесний preview reset-посилання.",
    backToLogin: "Повернутися до входу",
    genericError: "Не вдалося підготувати посилання.",
    deliveryUnavailable:
      "На сервері ще не налаштована email-доставка для скидання пароля.",
    openResetLink: "Відкрити скидання",
  },
  pl: {
    title: "Reset hasła",
    subtitle:
      "Podaj email konta, a przygotujemy link do ustawienia nowego hasła.",
    submit: "Wyślij link resetu",
    sending: "Przygotowuję link...",
    previewTitle: "Podgląd linku resetu",
    previewHint:
      "W tej konfiguracji wysyłka email nie jest jeszcze podpięta. Poniżej pokazujemy uczciwy preview linku resetu.",
    backToLogin: "Wróć do logowania",
    genericError: "Nie udało się przygotować linku resetu.",
    deliveryUnavailable:
      "Na serwerze nie skonfigurowano jeszcze wysyłki email dla resetu hasła.",
    openResetLink: "Otwórz reset hasła",
  },
} as const;

const ForgotPasswordPage = () => {
  const { t, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<PasswordResetRequestResult | null>(null);
  const copy = forgotPasswordCopy[language];
  const identityHint = useMemo(() => readAuthIdentityHint(), []);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.invalidEmail")),
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
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const nextResult = await requestPasswordReset(data.email);
      writeAuthIdentityHint({ email: data.email });
      setResult(nextResult);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setServerError(
          error.code === "EMAIL_DELIVERY_UNAVAILABLE"
            ? copy.deliveryUnavailable
            : error.message
        );
      } else {
        setServerError(copy.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewHref = result?.previewToken
    ? `/reset-password?token=${encodeURIComponent(result.previewToken)}`
    : null;

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

          {serverError && <Alert severity="error">{serverError}</Alert>}
          {result && <Alert severity="success">{result.message}</Alert>}

          {previewHref && (
            <Alert severity="info">
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800 }}>{copy.previewTitle}</Typography>
                <Typography variant="body2">{copy.previewHint}</Typography>
                <Button
                  component={Link}
                  to={previewHref}
                  variant="outlined"
                  sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                >
                  {copy.openResetLink}
                </Button>
              </Stack>
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
              {submitting ? copy.sending : copy.submit}
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

export default ForgotPasswordPage;
