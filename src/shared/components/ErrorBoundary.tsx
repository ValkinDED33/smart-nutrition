import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLanguage } from "../language";

interface Props {
  children: ReactNode;
  title: string;
  actionLabel: string;
  recoveringLabel: string;
  resetKey: string;
}

interface WrapperProps {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRecovering: boolean;
}

const STALE_BUILD_RECOVERY_KEY = "smart-nutrition.stale-build-recovery";
const STALE_BUILD_RECOVERY_TTL_MS = 15_000;

const staleBuildErrorPattern =
  /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|module script/i;

const isLikelyStaleBuildError = (error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message} ${error.stack ?? ""}`
      : String(error);

  return staleBuildErrorPattern.test(message);
};

const getSessionStorageItem = (key: string) => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionStorageItem = (key: string, value: string) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Recovery must keep working in restricted mobile storage modes.
  }
};

const removeSessionStorageItem = (key: string) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Best-effort cleanup only.
  }
};

const isRecoveryRecentlyAttempted = () => {
  const rawValue = getSessionStorageItem(STALE_BUILD_RECOVERY_KEY);
  const attemptedAt = rawValue ? Number(rawValue) : Number.NaN;

  return Number.isFinite(attemptedAt)
    ? Date.now() - attemptedAt < STALE_BUILD_RECOVERY_TTL_MS
    : rawValue !== null;
};

const clearRuntimeCaches = async () => {
  const clearServiceWorkers = async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  };

  const clearOriginCaches = async () => {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    const keys = await window.caches.keys();
    await Promise.all(keys.map((key) => window.caches.delete(key)));
  };

  await Promise.allSettled([clearServiceWorkers(), clearOriginCaches()]);
};

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = {
    hasError: false,
    isRecovering: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true, isRecovering: false };
  }

  componentDidMount() {
    window.setTimeout(() => {
      removeSessionStorageItem(STALE_BUILD_RECOVERY_KEY);
    }, STALE_BUILD_RECOVERY_TTL_MS);
  }

  componentDidUpdate(previousProps: Props) {
    if (
      previousProps.resetKey !== this.props.resetKey &&
      this.state.hasError &&
      !this.state.isRecovering
    ) {
      this.setState({ hasError: false, isRecovering: false });
    }
  }

  componentDidCatch(error: unknown) {
    if (
      !isLikelyStaleBuildError(error) ||
      isRecoveryRecentlyAttempted()
    ) {
      return;
    }

    setSessionStorageItem(STALE_BUILD_RECOVERY_KEY, String(Date.now()));
    this.setState({ isRecovering: true });
    void this.recoverApplication();
  }

  handleReload = () => {
    this.setState({ isRecovering: true });
    void this.recoverApplication();
  };

  recoverApplication = async () => {
    await clearRuntimeCaches();
    window.location.replace(window.location.href);
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            px: 3,
          }}
        >
          <Typography component="h1" variant="h5" textAlign="center">
            {this.state.isRecovering ? this.props.recoveringLabel : this.props.title}
          </Typography>
          <Button
            variant="contained"
            disabled={this.state.isRecovering}
            onClick={this.handleReload}
          >
            {this.props.actionLabel}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary = ({ children }: WrapperProps) => {
  const { appLanguage, t } = useLanguage();

  return (
    <ErrorBoundaryInner
      title={t("errorBoundary.title")}
      actionLabel={t("errorBoundary.action")}
      recoveringLabel={t("errorBoundary.recovering")}
      resetKey={appLanguage}
    >
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
