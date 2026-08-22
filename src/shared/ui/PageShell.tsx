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

const PAGE_SHELL_GRID_BACKGROUND =
  "linear-gradient(rgba(45,212,191,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.035) 1px, transparent 1px)";
const PAGE_SHELL_SIGNAL_DOT =
  "radial-gradient(circle, rgba(94,234,212,0.92), rgba(94,234,212,0.24) 48%, transparent 70%)";
const PAGE_SHELL_ROUTE_LINE =
  "linear-gradient(90deg, transparent, rgba(94,234,212,0.46), rgba(132,204,22,0.38), transparent)";

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
    data-ai-space-shell="true"
    data-ai-master-page-grid="true"
    data-ai-page-route-space="true"
    sx={{
      width: "100%",
      maxWidth,
      mx: "auto",
      px: { xs: compact ? 0 : 0.5, sm: compact ? 0 : 1, md: 0 },
      overflowX: "hidden",
      position: "relative",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: { xs: "-18px -10px auto -10px", md: "-28px -42px auto -42px" },
        height: { xs: 260, md: 360 },
        pointerEvents: "none",
        backgroundImage: PAGE_SHELL_GRID_BACKGROUND,
        backgroundSize: "32px 32px",
        opacity: 0.46,
        maskImage:
          "radial-gradient(circle at 50% 0%, rgba(0,0,0,0.82), transparent 72%)",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        left: { xs: 18, md: 44 },
        right: { xs: 18, md: 44 },
        top: { xs: 90, md: 112 },
        height: 1,
        pointerEvents: "none",
        background: PAGE_SHELL_ROUTE_LINE,
        opacity: 0.58,
      },
    }}
  >
    <Stack
      spacing={compact ? 2 : { xs: 2, md: 2.75 }}
      sx={{ position: "relative", zIndex: 1 }}
    >
      <Box
        className="sn-premium-panel sn-page-hero"
        data-ai-space-page-hero="true"
        data-ai-shared-element-transition="page-hero"
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
          "[data-ai-page-signal-dot='true']": {
            position: "absolute",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: PAGE_SHELL_SIGNAL_DOT,
            boxShadow: "0 0 24px rgba(94,234,212,0.42)",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          aria-hidden
          data-ai-page-signal-dot="true"
          sx={{ right: { xs: 42, md: 116 }, top: { xs: 30, md: 42 } }}
        />
        <Box
          aria-hidden
          data-ai-page-signal-dot="true"
          sx={{ right: { xs: 88, md: 252 }, bottom: { xs: 24, md: 34 }, opacity: 0.62 }}
        />
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
