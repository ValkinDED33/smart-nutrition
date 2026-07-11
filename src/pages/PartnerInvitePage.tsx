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

const normalizePartnerInviteCode = (value: string | null) => {
  const code = value?.trim().toUpperCase() ?? "";

  return /^SN-[A-Z0-9]{6,12}$/.test(code) ? code : "";
};

const PartnerInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
              : "Could not connect partner profiles."
          );
        }
      }
    };

    void connectPartner();

    return () => {
      cancelled = true;
    };
  }, [code, isInitialized, isLoading, navigate, user]);

  const waitingForAuth = code && isInitialized && !isLoading && !user;
  const checkingSession = code && (!isInitialized || isLoading);

  return (
    <AuthSurface maxWidth={520} minHeight="70vh">
      <Stack spacing={2.5} alignItems="flex-start">
        <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
          {t("brand.name")}
        </Typography>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
          Family access
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          This link connects profiles through the cloud backend and shares only pregnancy timeline
          context.
        </Typography>

        {checkingSession && <CircularProgress size={28} />}
        {status === "connecting" && (
          <Alert severity="info" sx={{ width: "100%", borderRadius: 3 }}>
            Connecting partner profiles...
          </Alert>
        )}
        {status === "connected" && (
          <Alert severity="success" sx={{ width: "100%", borderRadius: 3 }}>
            Partner profiles connected.
          </Alert>
        )}
        {(invalidInvite || status === "error") && (
          <Alert severity="error" sx={{ width: "100%", borderRadius: 3 }}>
            {invalidInvite ? "Partner invite code is invalid." : error}
          </Alert>
        )}

        {waitingForAuth && (
          <>
            <Alert severity="info" sx={{ width: "100%", borderRadius: 3 }}>
              The invite is saved for this browser. Log in if you already have an account, or
              create one and confirm email to connect automatically.
            </Alert>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button component={Link} to="/login" variant="contained">
                Log in
              </Button>
              <Button component={Link} to="/register" variant="outlined">
                Create account
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </AuthSurface>
  );
};

export default PartnerInvitePage;
