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

const toneStyles: Record<SectionCardTone, { border: string; background: string }> = {
  default: {
    border: "rgba(15, 23, 42, 0.08)",
    background: "rgba(255,255,255,0.88)",
  },
  success: {
    border: "rgba(15,118,110,0.18)",
    background: "rgba(240,253,250,0.9)",
  },
  warning: {
    border: "rgba(245,158,11,0.22)",
    background: "rgba(255,251,235,0.9)",
  },
  info: {
    border: "rgba(14,165,233,0.2)",
    background: "rgba(240,249,255,0.9)",
  },
  premium: {
    border: "rgba(15,23,42,0.12)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(240,253,250,0.9) 100%)",
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
        p: { xs: 1.6, md: 2.25 },
        borderRadius: 1,
        border: `1px solid ${styles.border}`,
        bgcolor: tone === "premium" ? undefined : styles.background,
        background: tone === "premium" ? styles.background : undefined,
        overflow: "hidden",
      }}
    >
      <Stack spacing={1.6}>
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
