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
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1.25, md: 2 }}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
      >
        <Stack spacing={0.65} sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 900,
              fontSize: { xs: compact ? 28 : 32, md: compact ? 34 : 40 },
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 760, lineHeight: 1.65, overflowWrap: "anywhere" }}
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

      {children}
    </Stack>
  </Box>
);

export default PageShell;
