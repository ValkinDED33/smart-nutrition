import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface PageShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  assistantHint?: ReactNode;
  children: ReactNode;
  maxWidth?: number | string;
  compact?: boolean;
}

export const PageShell = ({
  title,
  subtitle,
  action,
  assistantHint,
  children,
  maxWidth = 1120,
  compact = false,
}: PageShellProps) => (
  <Box
    sx={{
      width: "100%",
      maxWidth,
      mx: "auto",
      px: { xs: compact ? 0 : 0.5, sm: compact ? 0 : 1, md: 0 },
      overflowX: "hidden",
    }}
  >
    <Stack spacing={compact ? 2 : { xs: 2, md: 2.75 }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          p: compact ? { xs: 1.6, md: 2 } : { xs: 1.8, sm: 2.2, md: 2.6 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          background:
            "radial-gradient(circle at 92% 8%, var(--sn-accent-soft), transparent 34%), linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
          boxShadow: "var(--sn-shadow-soft)",
          backdropFilter: "blur(20px)",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.18), transparent 36%, rgba(20,184,166,0.08))",
            opacity: 0.72,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 1.25, md: 2 }}
          alignItems={{ xs: "stretch", md: "flex-start" }}
          justifyContent="space-between"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Stack spacing={0.65} sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 900,
                fontSize: { xs: compact ? 28 : 32, md: compact ? 34 : 40 },
                lineHeight: 1.05,
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                color="text.secondary"
                sx={{
                  maxWidth: 760,
                  lineHeight: 1.65,
                  overflowWrap: "anywhere",
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
            {assistantHint ? <Box sx={{ pt: 0.25 }}>{assistantHint}</Box> : null}
          </Stack>
          {action ? (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: "stretch", md: "center" } }}>
              {action}
            </Box>
          ) : null}
        </Stack>
      </Box>

      {children}
    </Stack>
  </Box>
);

export default PageShell;
