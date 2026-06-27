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
    }}
  >
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth,
        p: { xs: 2.4, md: 4 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        background:
          "radial-gradient(circle at 96% 0%, var(--sn-accent-soft), transparent 34%), linear-gradient(180deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
        boxShadow: "var(--sn-shadow-strong)",
        backdropFilter: "blur(22px)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.16), transparent 40%, rgba(20,184,166,0.08))",
          opacity: 0.72,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Paper>
  </Box>
);

export default AuthSurface;
