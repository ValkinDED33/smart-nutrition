import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import {
  applyRemoteSnapshotWithSyncPolicy,
  hasCompletedOnboardingSnapshot,
} from "@features/auth/sessionSnapshot";
import {
  buildSessionProfileState,
  shouldSaveSessionProfileBootstrap,
} from "@features/auth/authSessionProfile";
import { createCompanionRewardAnalyticsPayload } from "../features/companion";
import { applyCompanionRewardInCloud } from "../features/companion/companionCloudSync";
import { normalizeCompanionState } from "../features/companion/model/store";
import { getProfileCloudActionCopy } from "../features/profile/profileCloudActionCopy";
import { useProfileCloudAction } from "../features/profile/useProfileCloudAction";
import {
  AuthApiError,
  acceptRemotePartnerInvite,
  getAuthRuntimeInfo,
  verifyRegistration,
} from "../shared/api/auth";
import { writeAuthIdentityHint } from "@features/auth/authIdentity";
import { useLanguage } from "../shared/language";
import { clearSensitiveSearchParamsFromCurrentUrl } from "../shared/lib/sensitiveUrl";
import {
  PENDING_PARTNER_INVITE_KEY,
  getClientStorageItem,
  removeClientStorageItem,
} from "@shared/lib/clientPersistence";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import { AuthSurface } from "@shared/ui";

const VerifyEmailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const companion = useSelector((state: RootState) => state.companion);
  const companionRef = useRef(companion);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, appLanguage } = useLanguage();
  const [token] = useState(() => searchParams.get("token")?.trim() ?? "");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verifiedTokenRef = useRef<string | null>(null);
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const profileActionRef = useRef(profileAction);

  useEffect(() => {
    clearSensitiveSearchParamsFromCurrentUrl(["token"]);
  }, []);

  useEffect(() => {
    companionRef.current = companion;
  }, [companion]);

  useEffect(() => {
    profileActionRef.current = profileAction;
  }, [profileAction]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage(t("auth.invalidConfirmationLink"));
        return;
      }

      if (verifiedTokenRef.current === token) {
        return;
      }

      verifiedTokenRef.current = token;

      try {
        const { user, snapshot } = await verifyRegistration({ token });

        if (cancelled) {
          return;
        }

        writeAuthIdentityHint({
          name: user.name,
          email: user.email,
        });
        const hydrationResult = applyRemoteSnapshotWithSyncPolicy(dispatch, snapshot);

        dispatch(
          setCredentials({
            user,
            syncMode: getAuthRuntimeInfo().mode,
            syncOutbox: hydrationResult.syncOutbox,
            cloudMeta: hydrationResult.cloudMeta,
          })
        );

        if (
          shouldSaveSessionProfileBootstrap({
            snapshot,
            useSnapshotForSessionBootstrap:
              hydrationResult.useSnapshotForSessionBootstrap,
          })
        ) {
          const sessionProfile = buildSessionProfileState({
            user,
            snapshot: hydrationResult.useSnapshotForSessionBootstrap
              ? snapshot
              : null,
            language: appLanguage,
          });

          try {
            await profileActionRef.current.runProfileStateSave(sessionProfile);
          } catch {
            // Email verification/session succeeded. The sync slice records the
            // profile bootstrap failure without showing unsaved profile data.
          }
        }

        const pendingPartnerInvite = getClientStorageItem(PENDING_PARTNER_INVITE_KEY);

        if (pendingPartnerInvite) {
          try {
            await acceptRemotePartnerInvite(pendingPartnerInvite);
            removeClientStorageItem(PENDING_PARTNER_INVITE_KEY);
          } catch {
            // The account remains valid. The user can paste the invite code
            // again from the family access block if the invite expired.
          }
        }

        let companionRewardPayload = {};
        const sessionCompanion =
          snapshot && "companion" in snapshot
            ? normalizeCompanionState(snapshot.companion)
            : companionRef.current;

        try {
          await applyCompanionRewardInCloud(
            dispatch,
            { companion: sessionCompanion },
            "registration_completed"
          );
          companionRewardPayload =
            createCompanionRewardAnalyticsPayload("registration_completed");
        } catch {
          // Verification/session succeeded. The sync slice records companion
          // reward failures without blocking the user from entering the app.
        }

        setStatus("success");
        const nextPath = hasCompletedOnboardingSnapshot(snapshot)
          ? "/dashboard"
          : "/onboarding/choice";
        trackRuntimeEvent("signup_completed", {
          authMode: getAuthRuntimeInfo().mode,
          requiresVerification: true,
          verified: true,
          hasCloudSnapshot: Boolean(snapshot),
          language: appLanguage,
          ...companionRewardPayload,
        });
        window.setTimeout(() => {
          navigate(nextPath, { replace: true });
        }, 700);
      } catch (error) {
        if (cancelled) {
          return;
        }

        verifiedTokenRef.current = null;

        setStatus("error");
        setErrorMessage(
          error instanceof AuthApiError && error.code === "INVALID_VERIFICATION_LINK"
            ? t("auth.invalidConfirmationLink")
            : t("auth.verifyGeneric")
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [appLanguage, dispatch, navigate, t, token]);

  return (
    <AuthSurface maxWidth={520} minHeight="70vh">
        <Stack spacing={2.5} alignItems="flex-start">
          <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
            {t("brand.name")}
          </Typography>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
            {t("auth.verifyTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("auth.verifyBody")}
          </Typography>

          {status === "pending" && <CircularProgress size={28} />}
          {status === "success" && (
            <Alert severity="success" sx={{ width: "100%", borderRadius: 3 }}>
              {t("auth.verifySuccess")}
            </Alert>
          )}
          {status === "error" && (
            <>
              <Alert severity="error" sx={{ width: "100%", borderRadius: 3 }}>
                {errorMessage}
              </Alert>
              <Button component={Link} to="/register" variant="contained">
                {t("auth.backToRegister")}
              </Button>
            </>
          )}
        </Stack>
    </AuthSurface>
  );
};

export default VerifyEmailPage;
