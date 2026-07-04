import { Component, type ReactNode } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { buildRecoveryReloadUrl, clearRuntimeCaches } from "@shared/lib/errorRecovery";
import { SectionCard } from "./SectionCard";

interface LazyModuleBoundaryProps {
  children: ReactNode;
  errorTitle: string;
  errorBody: string;
  reloadLabel: string;
  resetKey: string;
  diagnosticLabel?: string;
}

interface LazyModuleBoundaryState {
  hasError: boolean;
  isRecovering: boolean;
}

export class LazyModuleBoundary extends Component<
  LazyModuleBoundaryProps,
  LazyModuleBoundaryState
> {
  state: LazyModuleBoundaryState = {
    hasError: false,
    isRecovering: false,
  };

  static getDerivedStateFromError(): LazyModuleBoundaryState {
    return { hasError: true, isRecovering: false };
  }

  componentDidUpdate(previousProps: LazyModuleBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, isRecovering: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.warn("Lazy module failed to load", {
      boundary: this.props.diagnosticLabel ?? this.props.resetKey,
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  recoverModule = async () => {
    this.setState({ isRecovering: true });

    try {
      await clearRuntimeCaches();
    } finally {
      window.location.replace(buildRecoveryReloadUrl(window.location.href));
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SectionCard tone="warning">
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 900 }}>{this.props.errorTitle}</Typography>
          <Typography color="text.secondary">{this.props.errorBody}</Typography>
          <Button
            type="button"
            variant="outlined"
            disabled={this.state.isRecovering}
            onClick={() => {
              void this.recoverModule();
            }}
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
          >
            {this.props.reloadLabel}
          </Button>
        </Stack>
      </SectionCard>
    );
  }
}

export default LazyModuleBoundary;
