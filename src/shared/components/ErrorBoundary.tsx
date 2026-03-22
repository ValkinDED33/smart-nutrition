import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLanguage } from "../language";

interface Props {
  children: ReactNode;
  title: string;
  actionLabel: string;
}

interface WrapperProps {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
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
          <Typography variant="h5" textAlign="center">
            {this.props.title}
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
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
    >
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
