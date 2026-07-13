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
        className="sn-premium-panel sn-page-hero"
        sx={{
          position: "relative",
          overflow: "hidden",
          p: compact ? { xs: 1.6, md: 2 } : { xs: 1.8, sm: 2.2, md: 2.6 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          "&::after": {
            content: '""',
            position: "absolute",
            width: { xs: 220, md: 360 },
            height: { xs: 220, md: 360 },
            right: { xs: -98, md: -84 },
            top: { xs: -126, md: -164 },
            borderRadius: "50%",
            pointerEvents: "none",
            background: "var(--sn-portal-ring)",
            opacity: 0.66,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: { xs: "18%", md: "48%" },
            right: { xs: "-18%", md: "-4%" },
            bottom: -1,
            height: { xs: 74, md: 118 },
            pointerEvents: "none",
            background: "var(--sn-scene-landscape)",
            opacity: 0.7,
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
