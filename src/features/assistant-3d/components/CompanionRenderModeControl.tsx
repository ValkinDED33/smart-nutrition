import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import type { CompanionAvatarRenderMode } from "./companionAvatarModel";

type CompanionRenderModeValue = Extract<
  CompanionAvatarRenderMode,
  "2d" | "3d"
>;

interface CompanionRenderModeControlProps {
  value: CompanionRenderModeValue;
  onChange: (value: CompanionRenderModeValue) => void;
  labels: {
    title: string;
    twoD: string;
    threeD: string;
    hint: string;
    loading?: string;
    error?: string;
  };
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const CompanionRenderModeControl = ({
  value,
  onChange,
  labels,
  loading = false,
  error = false,
  disabled = false,
}: CompanionRenderModeControlProps) => (
  <Stack spacing={0.8}>
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      useFlexGap
      flexWrap="wrap"
    >
      <Typography sx={{ fontWeight: 900 }}>{labels.title}</Typography>
      {loading ? (
        <Chip size="small" color="info" variant="outlined" label={labels.loading} />
      ) : null}
      {error ? (
        <Chip size="small" color="warning" variant="outlined" label={labels.error} />
      ) : null}
    </Stack>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 1,
        width: "100%",
      }}
    >
      {(["2d", "3d"] as const).map((mode) => {
        const active = value === mode;

        return (
          <Button
            key={mode}
            type="button"
            variant={active ? "contained" : "outlined"}
            onClick={() => onChange(mode)}
            disabled={disabled || loading}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
          >
            {mode === "2d" ? labels.twoD : labels.threeD}
          </Button>
        );
      })}
    </Box>
    <Typography color="text.secondary" variant="body2">
      {labels.hint}
    </Typography>
  </Stack>
);

export const Companion3DLoadingFallback = ({
  label,
  size,
}: {
  label: string;
  size: number;
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      background:
        "radial-gradient(circle at 50% 58%, rgba(163,230,53,0.2), transparent 46%), radial-gradient(circle at 50% 50%, rgba(45,212,191,0.14), transparent 70%)",
      color: "text.secondary",
      textAlign: "center",
    }}
  >
    <Stack spacing={0.8} alignItems="center">
      <CircularProgress size={28} thickness={4} />
      <Typography variant="caption" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
    </Stack>
  </Box>
);
