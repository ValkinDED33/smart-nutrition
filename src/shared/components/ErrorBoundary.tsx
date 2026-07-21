import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { reportClientErrorDiagnostic } from "@shared/api/clientErrors";
import { useLanguage } from "../language";
import {
  buildErrorRecoveryDiagnostic,
  buildRecoveryReloadUrl,
  clearRuntimeCaches,
  clearVolatileBrowserState,
  getSessionStorageItem,
  persistErrorRecoveryDiagnostic,
  removeSessionStorageItem,
  setSessionStorageItem,
  shouldAttemptStaleBuildRecovery,
  shouldRecoverOnManualRetry,
  STALE_BUILD_RECOVERY_KEY,
  STALE_BUILD_RECOVERY_TTL_MS,
  type ErrorRecoveryDiagnostic,
} from "@shared/lib/errorRecovery";

interface Props {
  children: ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  retryLabel: string;
  safeResetLabel: string;
  homeLabel: string;
  diagnosticLabel: string;
  recoveryDetailsLabel: string;
  recoveringLabel: string;
  resettingLabel: string;
  resetKey: string;
}

interface WrapperProps {
  children: ReactNode;
}

interface State {
  diagnostic: ErrorRecoveryDiagnostic | null;
  hasError: boolean;
  isRecovering: boolean;
  recoveryMode: "refresh" | "reset";
}

const reportErrorBoundaryDiagnostic = (
  diagnostic: ErrorRecoveryDiagnostic,
  componentStack?: string | null
) => {
  void (async () => {
    try {
      await reportClientErrorDiagnostic(diagnostic, componentStack);
    } catch {
      // Error reporting must never block the recovery UI.
    }
  })();
};

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = {
    diagnostic: null,
    hasError: false,
    isRecovering: false,
    recoveryMode: "refresh",
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
      this.setState({
        diagnostic: null,
        hasError: false,
        isRecovering: false,
        recoveryMode: "refresh",
      });
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const diagnostic = buildErrorRecoveryDiagnostic(
      error,
      typeof window === "undefined"
        ? "/"
        : `${window.location.pathname}${window.location.search}`,
      new Date(),
      typeof navigator === "undefined" ? undefined : navigator.userAgent
    );

    persistErrorRecoveryDiagnostic(diagnostic);
    console.warn("Smart Nutrition UI recovery diagnostic", {
      ...diagnostic,
      componentStackLines: errorInfo.componentStack
        ? errorInfo.componentStack.trim().split("\n").slice(0, 4)
        : [],
    });
    reportErrorBoundaryDiagnostic(diagnostic, errorInfo.componentStack);
    this.setState({ diagnostic });

    if (
      !shouldAttemptStaleBuildRecovery(
        error,
        getSessionStorageItem(STALE_BUILD_RECOVERY_KEY),
        Date.now(),
        typeof window === "undefined" ? "" : window.location.href
      )
    ) {
      return;
    }

    setSessionStorageItem(STALE_BUILD_RECOVERY_KEY, String(Date.now()));
    this.setState({ isRecovering: true, recoveryMode: "refresh" });
    void this.recoverApplication({ clearVolatileState: false });
  }

  handleRetry = () => {
    if (shouldRecoverOnManualRetry(this.state.diagnostic)) {
      this.handleReload();
      return;
    }

    this.setState({
      diagnostic: null,
      hasError: false,
      isRecovering: false,
      recoveryMode: "refresh",
    });
  }

  handleReload = () => {
    this.setState({ isRecovering: true, recoveryMode: "refresh" });
    void this.recoverApplication({ clearVolatileState: false });
  };

  handleSafeReset = () => {
    this.setState({ isRecovering: true, recoveryMode: "reset" });
    void this.recoverApplication({ clearVolatileState: true });
  };

  handleHome = () => {
    window.location.assign("/");
  };

  recoverApplication = async ({
    clearVolatileState,
  }: {
    clearVolatileState: boolean;
  }) => {
    if (clearVolatileState) {
      clearVolatileBrowserState();
    }

    await clearRuntimeCaches();
    window.location.replace(buildRecoveryReloadUrl(window.location.href));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 3 },
            py: 4,
            bgcolor: "background.default",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "min(100%, 560px)",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: { xs: 2.5, sm: 4 },
            }}
          >
            <Stack spacing={2.5}>
              <Stack spacing={1}>
                <Typography component="h1" variant="h4">
                  {this.state.isRecovering
                    ? this.state.recoveryMode === "reset"
                      ? this.props.resettingLabel
                      : this.props.recoveringLabel
                    : this.props.title}
                </Typography>
                <Typography color="text.secondary" variant="body1">
                  {this.props.subtitle}
                </Typography>
              </Stack>

              {this.state.diagnostic ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Chip
                    label={`${this.props.diagnosticLabel}: ${this.state.diagnostic.id}`}
                    size="small"
                    variant="outlined"
                  />
                  {this.state.diagnostic.staleBuildLikely ? (
                    <Chip label={this.props.recoveryDetailsLabel} size="small" color="warning" />
                  ) : null}
                </Stack>
              ) : null}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{
                  "& > .MuiButton-root": {
                    minHeight: 44,
                  },
                }}
              >
                <Button
                  variant="contained"
                  disabled={this.state.isRecovering}
                  onClick={this.handleRetry}
                >
                  {this.props.retryLabel}
                </Button>
                <Button
                  variant="outlined"
                  disabled={this.state.isRecovering}
                  onClick={this.handleReload}
                >
                  {this.props.actionLabel}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={this.state.isRecovering}
                  onClick={this.handleSafeReset}
                >
                  {this.props.safeResetLabel}
                </Button>
              </Stack>

              <Button
                variant="text"
                disabled={this.state.isRecovering}
                onClick={this.handleHome}
                sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
              >
                {this.props.homeLabel}
              </Button>
            </Stack>
          </Paper>
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
      subtitle={t("errorBoundary.subtitle")}
      actionLabel={t("errorBoundary.action")}
      retryLabel={t("errorBoundary.retry")}
      safeResetLabel={t("errorBoundary.safeReset")}
      homeLabel={t("errorBoundary.home")}
      diagnosticLabel={t("errorBoundary.diagnostic")}
      recoveryDetailsLabel={t("errorBoundary.recoveryDetails")}
      recoveringLabel={t("errorBoundary.recovering")}
      resettingLabel={t("errorBoundary.resetting")}
      resetKey={appLanguage}
    >
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
