import { useEffect, useState } from "react";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { MessageCircle } from "lucide-react";
import {
  createTelegramConnectLink,
  disconnectTelegram,
  getRemoteTelegramStatus,
  type TelegramConnectLink,
  type TelegramConnectionStatus,
} from "@shared/api/auth";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";
import { accountCopy } from "./accountDataCardCopy";
import {
  TELEGRAM_CONNECT_STATUS_POLL_INTERVAL_MS,
  shouldPollTelegramConnectStatus,
} from "./telegramConnectStatusModel";

type AccountCopy = (typeof accountCopy)[keyof typeof accountCopy];

const getCopy = (language: AppLanguage): AccountCopy => {
  if (language === "pl") return accountCopy.pl;
  if (language === "en") return accountCopy.en;

  return accountCopy.uk;
};

const getLocale = (language: AppLanguage) => {
  if (language === "pl") return "pl-PL";
  if (language === "en") return "en-US";

  return "uk-UA";
};

const formatConnectedAt = (value: string, language: AppLanguage) =>
  new Date(value).toLocaleString(getLocale(language));

export const TelegramConnectionCard = () => {
  const { appLanguage } = useLanguage();
  const copy = getCopy(appLanguage);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [telegramStatus, setTelegramStatus] =
    useState<TelegramConnectionStatus | null>(null);
  const [telegramConnectLink, setTelegramConnectLink] =
    useState<TelegramConnectLink | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramConnectStartedAtMs, setTelegramConnectStartedAtMs] = useState<
    number | null
  >(null);

  const telegramConfigured = Boolean(telegramStatus?.configured);
  const telegramConnected = Boolean(telegramStatus?.connected);
  const telegramBotUsername = telegramStatus?.botUsername
    ? `@${telegramStatus.botUsername.replace(/^@+/, "")}`
    : null;

  useEffect(() => {
    let cancelled = false;

    void getRemoteTelegramStatus()
      .then((status) => {
        if (!cancelled) {
          setTelegramStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTelegramStatus(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTelegramLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasConnectLink = Boolean(telegramConnectLink?.url);
    const shouldPoll = () =>
      shouldPollTelegramConnectStatus({
        connected: telegramConnected,
        hasConnectLink,
        nowMs: Date.now(),
        startedAtMs: telegramConnectStartedAtMs,
      });

    if (!shouldPoll()) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (!shouldPoll()) {
        window.clearInterval(intervalId);
        return;
      }

      void getRemoteTelegramStatus()
        .then((status) => {
          setTelegramStatus(status);
          if (status.connected) {
            setTelegramConnectLink(null);
            setTelegramConnectStartedAtMs(null);
            setNotice({ type: "success", message: copy.telegramConnected });
          }
        })
        .catch(() => undefined);
    }, TELEGRAM_CONNECT_STATUS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    copy.telegramConnected,
    telegramConnectLink?.url,
    telegramConnectStartedAtMs,
    telegramConnected,
  ]);

  const handleTelegramConnect = async () => {
    setTelegramBusy(true);
    setNotice(null);
    const pendingWindow = window.open("about:blank", "_blank");
    if (pendingWindow) {
      pendingWindow.opener = null;
    }

    try {
      const status = await createTelegramConnectLink();
      setTelegramStatus(status);
      setTelegramConnectLink(status);
      setTelegramConnectStartedAtMs(Date.now());

      if (pendingWindow) {
        pendingWindow.location.href = status.url;
      } else {
        window.location.assign(status.url);
      }

      setNotice({ type: "info", message: copy.telegramConnectPending });
    } catch {
      pendingWindow?.close();
      setNotice({ type: "error", message: copy.telegramConnectError });
    } finally {
      setTelegramBusy(false);
    }
  };

  const handleTelegramCopyLink = async () => {
    if (!telegramConnectLink?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(telegramConnectLink.url);
      setNotice({ type: "success", message: copy.telegramCopySuccess });
    } catch {
      setNotice({ type: "error", message: copy.telegramConnectError });
    }
  };

  const handleTelegramDisconnect = async () => {
    setTelegramBusy(true);
    setNotice(null);

    try {
      const status = await disconnectTelegram();
      setTelegramStatus(status);
      setTelegramConnectLink(null);
      setTelegramConnectStartedAtMs(null);
      setNotice({ type: "success", message: copy.telegramDisconnectSuccess });
    } catch {
      setNotice({ type: "error", message: copy.telegramDisconnectError });
    } finally {
      setTelegramBusy(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        background:
          "linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(132, 204, 22, 0.08))",
      }}
    >
      <Stack spacing={1.5}>
        {notice && (
          <Alert severity={notice.type} sx={{ borderRadius: 3 }}>
            {notice.message}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <MessageCircle size={20} aria-hidden="true" />
              <Typography sx={{ fontWeight: 900 }}>{copy.telegramTitle}</Typography>
              <Chip
                size="small"
                color={telegramConnected ? "success" : "default"}
                label={
                  telegramLoading
                    ? copy.telegramLoading
                    : telegramConnected
                      ? copy.telegramConnected
                      : copy.telegramDisconnected
                }
              />
              {telegramBotUsername && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${copy.telegramBot}: ${telegramBotUsername}`}
                />
              )}
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {copy.telegramSubtitle}
            </Typography>
            {!telegramLoading && !telegramConfigured && (
              <Typography variant="body2" color="warning.main">
                {copy.telegramUnavailable}
              </Typography>
            )}
            {telegramConnected && telegramStatus?.connectedAt && (
              <Typography variant="body2" color="text.secondary">
                {formatConnectedAt(telegramStatus.connectedAt, appLanguage)}
              </Typography>
            )}
          </Stack>

          <Button
            variant={telegramConnected ? "outlined" : "contained"}
            disabled={telegramLoading || telegramBusy || !telegramConfigured}
            onClick={() => {
              void (telegramConnected
                ? handleTelegramDisconnect()
                : handleTelegramConnect());
            }}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              whiteSpace: "nowrap",
              ...(telegramConnected
                ? {}
                : {
                    background:
                      "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }),
            }}
          >
            {telegramBusy
              ? telegramConnected
                ? copy.telegramDisconnecting
                : copy.telegramConnecting
              : telegramConnected
                ? copy.telegramDisconnect
                : copy.telegramConnect}
          </Button>
        </Stack>

        {!telegramConnected && telegramConnectLink?.url && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Stack spacing={1.2}>
              <Typography variant="body2">{copy.telegramConnectInstruction}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                <Button
                  component="a"
                  href={telegramConnectLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                >
                  {copy.telegramOpenPersonalLink}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    void handleTelegramCopyLink();
                  }}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                >
                  {copy.telegramCopyLink}
                </Button>
              </Stack>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default TelegramConnectionCard;
