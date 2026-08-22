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
}: AuthSurfaceProps) => {
  return (
    <Box
      data-auth-blueprint-surface="true"
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight,
        width: "100%",
        px: { xs: 0.75, sm: 1.25 },
        py: { xs: 2, md: 4 },
        background:
          "radial-gradient(circle at 70% 18%, rgba(34,211,238,0.14), transparent 28%), radial-gradient(circle at 35% 72%, rgba(34,197,94,0.13), transparent 34%)",
      }}
    >
      <Paper
        className="sn-premium-panel sn-auth-blueprint-panel"
        elevation={0}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth,
          p: { xs: 2.4, md: 4 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-strong)",
          background:
            "radial-gradient(circle at 78% 18%, rgba(34,197,94,0.18), transparent 32%), radial-gradient(circle at 14% 0%, rgba(34,211,238,0.14), transparent 30%), var(--sn-companion-hero)",
          boxShadow: "var(--sn-shadow-strong)",
          backdropFilter: "blur(22px)",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(rgba(45,212,191,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.24))",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: { xs: 280, sm: 420 },
            height: { xs: 280, sm: 420 },
            right: { xs: -160, sm: -174 },
            top: { xs: -176, sm: -214 },
            borderRadius: "50%",
            pointerEvents: "none",
            border: "1px solid rgba(34,211,238,0.18)",
            background: "var(--sn-portal-ring)",
            opacity: 0.66,
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
      </Paper>
    </Box>
  );
};
