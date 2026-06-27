import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import { replaceCommunityState } from "../features/community/communitySlice";
import {
  awardCompanionReward,
  createCompanionRewardAnalyticsPayload,
  hydrateCompanionState,
} from "../features/companion";
import { replaceFridgeState } from "../features/fridge/fridgeSlice";
import { replaceMealState } from "../features/meal/mealSlice";
import { replaceProfileState, setProfileLanguage } from "../features/profile/profileSlice";
import { replaceWaterState } from "../features/water/waterSlice";
import { AuthApiError, getAuthRuntimeInfo, verifyRegistration } from "../shared/api/auth";
import { getSnapshotMetaFromSnapshot } from "@domain/appSnapshot";
import { writeAuthIdentityHint } from "@features/auth/authIdentity";
import { getSyncOutboxMeta } from "../shared/lib/syncOutbox";
import { useLanguage } from "../shared/language";
import type { AppSnapshot } from "../shared/types/appSnapshot";
import { captureRuntimeEvent } from "@integration/runtime/analytics";
import { AuthSurface } from "@shared/ui";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasCompletedOnboardingSnapshot = (snapshot?: AppSnapshot | null) => {
  if (!isRecord(snapshot?.profile)) {
    return false;
  }

  const { assistant } = snapshot.profile;

  if (!isRecord(assistant) || !isRecord(assistant.onboarding)) {
    return false;
  }

  return typeof assistant.onboarding.completedAt === "string" &&
    assistant.onboarding.completedAt.trim().length > 0;
};

const VerifyEmailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, appLanguage } = useLanguage();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage(t("auth.invalidConfirmationLink"));
        return;
      }

      try {
        const { user, snapshot } = await verifyRegistration({ token });

        if (cancelled) {
          return;
        }

        writeAuthIdentityHint({
          name: user.name,
          email: user.email,
        });
        dispatch(
          setCredentials({
            user,
            syncMode: getAuthRuntimeInfo().mode,
            syncOutbox: getSyncOutboxMeta(),
            cloudMeta: getSnapshotMetaFromSnapshot(snapshot),
          })
        );

        if (snapshot && getSyncOutboxMeta().pendingChanges === 0) {
          dispatch(replaceProfileState(snapshot.profile));
          dispatch(replaceMealState(snapshot.meal));
          dispatch(replaceWaterState(snapshot.water));
          dispatch(replaceFridgeState(snapshot.fridge));
          dispatch(replaceCommunityState(snapshot.community));
          dispatch(hydrateCompanionState(snapshot.companion));
        }

        dispatch(setProfileLanguage(appLanguage));
        dispatch(awardCompanionReward("registration_completed"));
        setStatus("success");
        const nextPath = hasCompletedOnboardingSnapshot(snapshot)
          ? "/dashboard"
          : "/onboarding";
        captureRuntimeEvent("signup_completed", {
          authMode: getAuthRuntimeInfo().mode,
          requiresVerification: true,
          verified: true,
          hasCloudSnapshot: Boolean(snapshot),
          language: appLanguage,
          ...createCompanionRewardAnalyticsPayload("registration_completed"),
        });
        window.setTimeout(() => {
          navigate(nextPath, { replace: true });
        }, 700);
      } catch (error) {
        if (cancelled) {
          return;
        }

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
