import type { ReactNode } from "react";
import { Box, Paper } from "@mui/material";

interface AuthSurfaceProps {
  children: ReactNode;
  maxWidth?: number;
  minHeight?: string;
}

export const AuthSurface = ({
  children,
  maxWidth = 540,
  minHeight = "75vh",
}: AuthSurfaceProps) => (
  <Box
    sx={{
      display: "grid",
      placeItems: "center",
      minHeight,
      width: "100%",
      px: { xs: 0.5, sm: 1 },
      py: { xs: 2, md: 4 },
    }}
  >
    <Paper
      className="sn-premium-panel"
      elevation={0}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth,
        p: { xs: 2.4, md: 4 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-strong)",
        background:
          "radial-gradient(circle at 92% 0%, var(--sn-accent-soft), transparent 30%), var(--sn-companion-hero)",
        boxShadow: "var(--sn-shadow-strong)",
        backdropFilter: "blur(22px)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "var(--sn-companion-overlay)",
          opacity: 0.86,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: { xs: 280, sm: 420 },
          height: { xs: 280, sm: 420 },
          right: { xs: -156, sm: -180 },
          top: { xs: -164, sm: -210 },
          borderRadius: "50%",
          pointerEvents: "none",
          background: "var(--sn-portal-ring)",
          opacity: 0.62,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Paper>
  </Box>
);
