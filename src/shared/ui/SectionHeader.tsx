import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={1}
    alignItems={{ xs: "stretch", sm: "flex-start" }}
    justifyContent="space-between"
  >
    <Stack spacing={0.35} minWidth={0}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {description}
        </Typography>
      ) : null}
    </Stack>
    {action ? <Stack sx={{ flexShrink: 0 }}>{action}</Stack> : null}
  </Stack>
);

export default SectionHeader;
