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
    title: "РќРѕРІРёР№ РїР°СЂРѕР»СЊ",
    subtitle:
      "Р’СЃС‚Р°РЅРѕРІС–С‚СЊ РЅРѕРІРёР№ РїР°СЂРѕР»СЊ. РџРѕСЃРёР»Р°РЅРЅСЏ РґР»СЏ СЃРєРёРґР°РЅРЅСЏ РѕРґРЅРѕСЂР°Р·РѕРІРµ С– РјР°С” РѕР±РјРµР¶РµРЅРёР№ С‡Р°СЃ РґС–С—.",
    submit: "Р—Р±РµСЂРµРіС‚Рё РЅРѕРІРёР№ РїР°СЂРѕР»СЊ",
    saving: "Р—Р±РµСЂС–РіР°СЋ...",
    invalidToken:
      "РџРѕСЃРёР»Р°РЅРЅСЏ РґР»СЏ СЃРєРёРґР°РЅРЅСЏ РЅРµРґС–Р№СЃРЅРµ Р°Р±Рѕ РІР¶Рµ РїСЂРѕСЃС‚СЂРѕС‡РµРЅРµ.",
    weakPassword:
      "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С‰РѕРЅР°Р№РјРµРЅС€Рµ 10 СЃРёРјРІРѕР»С–РІ, РІРµР»РёРєСѓ, РјР°Р»Сѓ Р»С–С‚РµСЂСѓ, С†РёС„СЂСѓ С‚Р° СЃРёРјРІРѕР».",
    missingToken:
      "РўСѓС‚ РЅРµРјР°С” reset-С‚РѕРєРµРЅР°. Р’С–РґРєСЂРёР№С‚Рµ СЃС‚РѕСЂС–РЅРєСѓ Р· РїРѕСЃРёР»Р°РЅРЅСЏ Р· Р»РёСЃС‚Р° Р°Р±Рѕ preview.",
    backToLogin: "РџРµСЂРµР№С‚Рё РґРѕ РІС…РѕРґСѓ",
    showPassword: "РџРѕРєР°Р·Р°С‚Рё РїР°СЂРѕР»СЊ",
    hidePassword: "РЎС…РѕРІР°С‚Рё РїР°СЂРѕР»СЊ",
  },
  pl: {
    title: "Nowe hasЕ‚o",
    subtitle:
      "Ustaw nowe hasЕ‚o. Link resetu jest jednorazowy i ma ograniczony czas waЕјnoЕ›ci.",
    submit: "Zapisz nowe hasЕ‚o",
    saving: "ZapisujД™...",
    invalidToken: "Link resetu jest nieprawidЕ‚owy albo juЕј wygasЕ‚.",
    weakPassword:
      "HasЕ‚o musi mieД‡ co najmniej 10 znakГіw, wielkД…, maЕ‚Д… literД™, cyfrД™ i symbol.",
    missingToken:
      "Brakuje tokenu resetu. OtwГіrz stronД™ z linku z maila albo preview.",
    backToLogin: "PrzejdЕє do logowania",
    showPassword: "PokaЕј hasЕ‚o",
    hidePassword: "Ukryj hasЕ‚o",
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
