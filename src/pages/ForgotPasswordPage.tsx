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
import { CompanionAvatar as AssistantAvatar } from "@features/assistant-3d";
import {
  AuthApiError,
  requestPasswordReset,
  type PasswordResetRequestResult,
} from "../shared/api/auth";
import { readAuthIdentityHint, writeAuthIdentityHint } from "@features/auth/authIdentity";
import { useLanguage } from "../shared/language";

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
            : error.message
        );
      } else {
        setServerError(t("auth.forgotGenericError"));
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
          <Stack direction="row" spacing={2} alignItems="center">
            <AssistantAvatar name="Alex" variant="dragon" mood="coach" size={72} />
            <Box>
              <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
                {t("brand.name")}
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                {t("auth.forgotTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {t("auth.forgotSubtitle")}
              </Typography>
            </Box>
          </Stack>

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
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
