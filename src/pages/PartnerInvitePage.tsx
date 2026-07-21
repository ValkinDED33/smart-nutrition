import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { RootState } from "../app/store";
import { acceptRemotePartnerInvite } from "../shared/api/auth";
import { useLanguage } from "../shared/language";
import {
  PENDING_PARTNER_INVITE_KEY,
  removeClientStorageItem,
  setClientStorageItem,
} from "@shared/lib/clientPersistence";
import { AuthSurface } from "@shared/ui";
import type { AppLanguage } from "@shared/types/i18n";

const normalizePartnerInviteCode = (value: string | null) => {
  const code = value?.trim().toUpperCase() ?? "";

  return /^SN-[A-Z0-9]{6,12}$/.test(code) ? code : "";
};

const partnerInviteCopy = {
  uk: {
    title: "Сімейний доступ",
    body:
      "Це посилання підключає профілі через захищену хмарну синхронізацію і відкриває тільки контекст вагітності: термін, розвиток дитини та спільні підказки без повної синхронізації акаунтів.",
    connecting: "Підключаю профілі партнерів...",
    connected: "Профілі партнерів підключено.",
    invalid: "Код запрошення партнера недійсний.",
    genericError: "Не вдалося підключити профілі партнерів.",
    waiting:
      "Запрошення збережено для цього браузера. Увійдіть, якщо акаунт уже є, або створіть акаунт і підтвердьте email, щоб підключення виконалося автоматично.",
    login: "Увійти",
    register: "Створити акаунт",
  },
  pl: {
    title: "Dostęp rodzinny",
    body:
      "Ten link łączy profile przez bezpieczną synchronizację w chmurze i udostępnia tylko kontekst ciąży: tydzień, rozwój dziecka i wspólne wskazówki bez pełnej synchronizacji kont.",
    connecting: "Łączę profile partnerów...",
    connected: "Profile partnerów połączone.",
    invalid: "Kod zaproszenia partnera jest nieprawidłowy.",
    genericError: "Nie udało się połączyć profili partnerów.",
    waiting:
      "Zaproszenie zapisano w tej przeglądarce. Zaloguj się, jeśli masz już konto, albo utwórz konto i potwierdź email, aby połączyć profile automatycznie.",
    login: "Zaloguj się",
    register: "Utwórz konto",
  },
  en: {
    title: "Family access",
    body:
      "This link connects profiles through secure cloud sync and shares only pregnancy context: week, baby development, and shared guidance without full account synchronization.",
    connecting: "Connecting partner profiles...",
    connected: "Partner profiles connected.",
    invalid: "Partner invite code is invalid.",
    genericError: "Could not connect partner profiles.",
    waiting:
      "The invite is saved for this browser. Log in if you already have an account, or create one and confirm email to connect automatically.",
    login: "Log in",
    register: "Create account",
  },
} as const;

const getPartnerInviteCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return partnerInviteCopy.pl;
    case "en":
      return partnerInviteCopy.en;
    case "uk":
    default:
      return partnerInviteCopy.uk;
  }
};

const PartnerInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, appLanguage } = useLanguage();
  const copy = getPartnerInviteCopy(appLanguage);
  const { isInitialized, isLoading, user } = useSelector((state: RootState) => state.auth);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const code = normalizePartnerInviteCode(searchParams.get("code"));
  const invalidInvite = !code;

  useEffect(() => {
    if (code) {
      setClientStorageItem(PENDING_PARTNER_INVITE_KEY, code);
    }
  }, [code]);

  useEffect(() => {
    if (!code || !isInitialized || isLoading || !user) {
      return;
    }

    let cancelled = false;

    const connectPartner = async () => {
      setStatus("connecting");
      setError(null);

      try {
        await acceptRemotePartnerInvite(code);

        if (!cancelled) {
          removeClientStorageItem(PENDING_PARTNER_INVITE_KEY);
          setStatus("connected");
          window.setTimeout(() => {
            navigate("/profile", { replace: true });
          }, 700);
        }
      } catch (connectError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            connectError instanceof Error
              ? connectError.message
              : copy.genericError
          );
        }
      }
    };

    void connectPartner();

    return () => {
      cancelled = true;
    };
  }, [code, copy.genericError, isInitialized, isLoading, navigate, user]);

  const waitingForAuth = code && isInitialized && !isLoading && !user;
  const checkingSession = code && (!isInitialized || isLoading);

  return (
    <AuthSurface maxWidth={520} minHeight="70vh">
      <Stack spacing={2.5} alignItems="flex-start">
        <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
          {t("brand.name")}
        </Typography>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
          {copy.title}
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {copy.body}
        </Typography>

        {checkingSession && <CircularProgress size={28} />}
        {status === "connecting" && (
          <Alert severity="info" sx={{ width: "100%", borderRadius: 3 }}>
            {copy.connecting}
          </Alert>
        )}
        {status === "connected" && (
          <Alert severity="success" sx={{ width: "100%", borderRadius: 3 }}>
            {copy.connected}
          </Alert>
        )}
        {(invalidInvite || status === "error") && (
          <Alert severity="error" sx={{ width: "100%", borderRadius: 3 }}>
            {invalidInvite ? copy.invalid : error}
          </Alert>
        )}

        {waitingForAuth && (
          <>
            <Alert severity="info" sx={{ width: "100%", borderRadius: 3 }}>
              {copy.waiting}
            </Alert>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button component={Link} to="/login" variant="contained">
                {copy.login}
              </Button>
              <Button component={Link} to="/register" variant="outlined">
                {copy.register}
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </AuthSurface>
  );
};

export default PartnerInvitePage;
