import type { ReactNode } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

type SectionCardTone = "default" | "success" | "warning" | "info" | "premium";

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: SectionCardTone;
}

const SECTION_CARD_BORDER_SOFT = "var(--sn-border-soft)";
const SECTION_CARD_BORDER_STRONG = "var(--sn-border-strong)";
const SECTION_CARD_SIGNAL_LINE =
  "linear-gradient(90deg, transparent, rgba(94,234,212,0.82), rgba(132,204,22,0.72), transparent)";
const SECTION_CARD_WORKER_SIGNAL =
  "radial-gradient(circle, rgba(94,234,212,0.96), rgba(94,234,212,0.18) 50%, transparent 72%)";
const SECTION_CARD_AI_ORBIT =
  "conic-gradient(from 180deg, transparent 0deg, rgba(94,234,212,0.62) 72deg, transparent 144deg, rgba(132,204,22,0.46) 238deg, transparent 360deg)";
const SECTION_CARD_MOTION_TRANSITION =
  "opacity 180ms ease, transform 180ms ease";

const toneStyles: Record<
  SectionCardTone,
  { border: string; background: string; glow: string }
> = {
  default: {
    border: SECTION_CARD_BORDER_SOFT,
    background:
      "linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
    glow: "transparent",
  },
  success: {
    border: "rgba(15,118,110,0.18)",
    background:
      "linear-gradient(135deg, rgba(240,253,250,0.82), var(--sn-surface-glass))",
    glow: "rgba(20,184,166,0.12)",
  },
  warning: {
    border: "rgba(245,158,11,0.22)",
    background:
      "linear-gradient(135deg, rgba(255,251,235,0.82), var(--sn-surface-glass))",
    glow: "rgba(245,158,11,0.12)",
  },
  info: {
    border: "rgba(14,165,233,0.2)",
    background:
      "linear-gradient(135deg, rgba(240,249,255,0.82), var(--sn-surface-glass))",
    glow: "rgba(14,165,233,0.12)",
  },
  premium: {
    border: SECTION_CARD_BORDER_STRONG,
    background:
      "radial-gradient(circle at 92% 0%, var(--sn-accent-soft), transparent 30%), linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
    glow: "rgba(132,204,22,0.14)",
  },
};

const getToneStyles = (tone: SectionCardTone) => {
  switch (tone) {
    case "default":
      return toneStyles.default;
    case "success":
      return toneStyles.success;
    case "warning":
      return toneStyles.warning;
    case "info":
      return toneStyles.info;
    case "premium":
      return toneStyles.premium;
    default:
      return toneStyles.default;
  }
};

export const SectionCard = ({
  title,
  description,
  action,
  children,
  tone = "default",
}: SectionCardProps) => {
  const styles = getToneStyles(tone);

  return (
    <Paper
      className="sn-premium-panel"
      data-ai-living-card="true"
      data-ai-worker-card="true"
      data-ai-shared-element-transition="living-card"
      elevation={0}
      sx={{
        position: "relative",
        p: { xs: 1.6, md: 2.25 },
        borderRadius: 1,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        boxShadow: "var(--sn-shadow-soft)",
        backdropFilter: "blur(22px)",
        overflow: "hidden",
        transform: "translateZ(0)",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, background-color 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: SECTION_CARD_BORDER_STRONG,
          boxShadow: "var(--sn-shadow-strong)",
        },
        "&:focus-within": {
          borderColor: SECTION_CARD_BORDER_STRONG,
          boxShadow: "var(--sn-glow)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: -1,
          pointerEvents: "none",
          background: `radial-gradient(circle at 88% 0%, ${styles.glow}, transparent 34%)`,
          opacity: tone === "default" ? 0 : 1,
          transition: SECTION_CARD_MOTION_TRANSITION,
        },
        "&:hover::before, &:focus-within::before": {
          opacity: 1,
          transform: "scale(1.02)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 0,
          height: 2,
          borderRadius: 999,
          background: SECTION_CARD_SIGNAL_LINE,
          opacity: 0,
          transform: "scaleX(0.36)",
          transition: SECTION_CARD_MOTION_TRANSITION,
        },
        "&:hover::after, &:focus-within::after": {
          opacity: 1,
          transform: "scaleX(1)",
        },
        "[data-ai-card-worker-signal='true']": {
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: SECTION_CARD_WORKER_SIGNAL,
          boxShadow: "0 0 24px rgba(94,234,212,0.42)",
          opacity: 0.68,
          pointerEvents: "none",
          transition: SECTION_CARD_MOTION_TRANSITION,
        },
        "[data-ai-card-worker-orbit='true']": {
          position: "absolute",
          width: 92,
          height: 92,
          right: -38,
          top: -42,
          borderRadius: "50%",
          background: SECTION_CARD_AI_ORBIT,
          opacity: 0.2,
          filter: "blur(0.2px)",
          pointerEvents: "none",
          transform: "rotate(-18deg)",
          transition: SECTION_CARD_MOTION_TRANSITION,
        },
        "&:hover [data-ai-card-worker-orbit='true'], &:focus-within [data-ai-card-worker-orbit='true']":
          {
            opacity: 0.46,
            transform: "rotate(28deg) scale(1.06)",
          },
        "&:hover [data-ai-card-worker-signal='true'], &:focus-within [data-ai-card-worker-signal='true']":
          {
            opacity: 1,
            transform: "scale(1.18)",
          },
      }}
    >
      <Box aria-hidden data-ai-card-worker-orbit="true" />
      <Box aria-hidden data-ai-card-worker-signal="true" sx={{ right: 18, top: 16 }} />
      <Box
        aria-hidden
        data-ai-card-worker-signal="true"
        sx={{ right: 46, top: 42, opacity: 0.38 }}
      />
      <Stack spacing={1.6} sx={{ position: "relative", zIndex: 1 }}>
        {title || description || action ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.35} minWidth={0}>
              {title ? (
                <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                  {title}
                </Typography>
              ) : null}
              {description ? (
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>
            {action ? <Stack sx={{ flexShrink: 0 }}>{action}</Stack> : null}
          </Stack>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
};
