import { Component, type ErrorInfo, type ReactNode } from "react";

interface CompanionErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface CompanionErrorBoundaryState {
  hasError: boolean;
}

export class CompanionErrorBoundary extends Component<
  CompanionErrorBoundaryProps,
  CompanionErrorBoundaryState
> {
  state: CompanionErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CompanionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[assistant-3d] companion renderer failed", {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
