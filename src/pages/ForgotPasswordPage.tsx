import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AuthApiError,
  requestPasswordReset,
  type PasswordResetRequestResult,
} from "../shared/api/auth";
import { readAuthIdentityHint, writeAuthIdentityHint } from "@features/auth/authIdentity";
import { useLanguage } from "../shared/language";
import { AuthAssistantIntro, AuthSurface } from "@shared/ui";

type FormData = {
  email: string;
};

const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<PasswordResetRequestResult | null>(null);
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
            ? t("auth.resetDeliveryUnavailable")
            : error.code === "REMOTE_API_UNAVAILABLE"
              ? t("error.backendUnavailable")
            : t("auth.forgotGenericError")
        );
      } else {
        setServerError(t("auth.forgotGenericError"));
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
            title={t("auth.forgotTitle")}
            subtitle={t("auth.forgotSubtitle")}
            mood="coach"
            size={72}
          />

          {serverError && <Alert severity="error">{serverError}</Alert>}
          {result && <Alert severity="success">{t("auth.forgotSuccess")}</Alert>}

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
              autoComplete="email"
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
              {submitting ? t("auth.forgotSending") : t("auth.forgotSubmit")}
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

export default ForgotPasswordPage;
