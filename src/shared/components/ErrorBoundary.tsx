import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLanguage } from "../language";

interface Props {
  children: ReactNode;
  title: string;
  actionLabel: string;
  recoveringLabel: string;
}

interface WrapperProps {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRecovering: boolean;
}

const STALE_BUILD_RECOVERY_KEY = "smart-nutrition.stale-build-recovery";

const staleBuildErrorPattern =
  /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|module script/i;

const isLikelyStaleBuildError = (error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message} ${error.stack ?? ""}`
      : String(error);

  return staleBuildErrorPattern.test(message);
};

const clearRuntimeCaches = async () => {
  await Promise.all([
    "serviceWorker" in navigator
      ? navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister()))
          )
      : Promise.resolve(),
    "caches" in window
      ? caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("smart-nutrition-"))
                .map((key) => caches.delete(key))
            )
          )
      : Promise.resolve(),
  ]);
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
      sessionStorage.removeItem(STALE_BUILD_RECOVERY_KEY);
    }, 5000);
  }

  componentDidCatch(error: unknown) {
    if (
      !isLikelyStaleBuildError(error) ||
      sessionStorage.getItem(STALE_BUILD_RECOVERY_KEY)
    ) {
      return;
    }

    sessionStorage.setItem(STALE_BUILD_RECOVERY_KEY, "true");
    this.setState({ isRecovering: true });
    void this.recoverApplication();
  }

  handleReload = () => {
    this.setState({ isRecovering: true });
    void this.recoverApplication();
  };

  recoverApplication = async () => {
    await clearRuntimeCaches();
    window.location.reload();
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
  const { t } = useLanguage();

  return (
    <ErrorBoundaryInner
      title={t("errorBoundary.title")}
      actionLabel={t("errorBoundary.action")}
      recoveringLabel={t("errorBoundary.recovering")}
    >
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
