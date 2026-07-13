import { Box, Paper, Skeleton, Stack, type SxProps, type Theme } from "@mui/material";

interface LoadingSkeletonProps {
  titleRows?: number;
  bodyRows?: number;
  cards?: number;
  chart?: boolean;
  compact?: boolean;
  sx?: SxProps<Theme>;
}

export const LoadingSkeleton = ({
  titleRows = 2,
  bodyRows = 3,
  cards = 0,
  chart = false,
  compact = false,
  sx,
}: LoadingSkeletonProps) => (
  <Paper
    elevation={0}
    aria-busy="true"
    sx={[
      {
        p: compact ? 2 : { xs: 2.25, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    <Stack spacing={2}>
      <Stack spacing={0.8}>
        {Array.from({ length: titleRows }).map((_, index) => (
          <Skeleton
            key={`title-${index}`}
            variant="text"
            width={index === 0 ? "48%" : "72%"}
            height={index === 0 ? 32 : 22}
          />
        ))}
      </Stack>

      {cards > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: cards > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr",
              md: cards > 2 ? "repeat(3, minmax(0, 1fr))" : undefined,
            },
            gap: 1.5,
          }}
        >
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={`card-${index}`} variant="rounded" height={84} />
          ))}
        </Box>
      ) : null}

      {chart ? <Skeleton variant="rounded" height={compact ? 160 : 260} /> : null}

      <Stack spacing={1}>
        {Array.from({ length: bodyRows }).map((_, index) => (
          <Skeleton
            key={`row-${index}`}
            variant="rounded"
            height={compact ? 36 : 44}
            width={index % 2 === 0 ? "100%" : "86%"}
          />
        ))}
      </Stack>
    </Stack>
  </Paper>
);
