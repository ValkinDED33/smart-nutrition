import type { ReactNode } from "react";
import { Box, Button, Paper, Stack, Typography, type SxProps, type Theme } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  sx?: SxProps<Theme>;
}

export const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  compact = false,
  sx,
}: EmptyStateProps) => (
  <Paper
    elevation={0}
    sx={[
      {
        p: compact ? 2 : { xs: 2.25, md: 3 },
        borderRadius: 1,
        border: "1px dashed var(--sn-border-strong)",
        backgroundColor: "var(--sn-surface-muted)",
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    <Stack spacing={compact ? 1 : 1.35} alignItems="flex-start">
      {icon ? (
        <Box
          sx={{
            width: compact ? 36 : 44,
            height: compact ? 36 : 44,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "#0f766e",
            backgroundColor: "rgba(15,118,110,0.1)",
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Stack spacing={0.45}>
        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {description}
          </Typography>
        ) : null}
      </Stack>

      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outlined"
          onClick={onAction}
          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  </Paper>
);
