import type { ReactNode } from "react";
import { Paper, Stack, Typography } from "@mui/material";

type SectionCardTone = "default" | "success" | "warning" | "info" | "premium";

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: SectionCardTone;
}

const toneStyles: Record<
  SectionCardTone,
  { border: string; background: string; glow: string }
> = {
  default: {
    border: "var(--sn-border-soft)",
    background: "var(--sn-surface-glass)",
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
    border: "var(--sn-border-strong)",
    background:
      "radial-gradient(circle at 92% 0%, var(--sn-accent-soft), transparent 30%), linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
    glow: "rgba(132,204,22,0.14)",
  },
};

export const SectionCard = ({
  title,
  description,
  action,
  children,
  tone = "default",
}: SectionCardProps) => {
  const styles = toneStyles[tone];

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        p: { xs: 1.6, md: 2.25 },
        borderRadius: 1,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        boxShadow: "var(--sn-shadow-soft)",
        backdropFilter: "blur(18px)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: -1,
          pointerEvents: "none",
          background: `radial-gradient(circle at 88% 0%, ${styles.glow}, transparent 34%)`,
          opacity: tone === "default" ? 0 : 1,
        },
      }}
    >
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

export default SectionCard;
