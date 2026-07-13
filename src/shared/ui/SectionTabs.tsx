import type { ReactNode } from "react";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";

interface SectionTabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface SectionTabsProps {
  sections: SectionTabItem[];
  activeSection: string;
  onChange: (sectionId: string) => void;
  ariaLabel?: string;
}

export const SectionTabs = ({
  sections,
  activeSection,
  onChange,
  ariaLabel = "Page sections",
}: SectionTabsProps) => (
  <Box
    sx={{
      width: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      pb: 0.25,
      scrollbarWidth: "thin",
    }}
  >
    <Stack
      role="tablist"
      aria-label={ariaLabel}
      direction="row"
      spacing={0.8}
      sx={{
        minWidth: "max-content",
        p: 0.5,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        bgcolor: "var(--sn-surface-glass)",
        boxShadow: "var(--sn-shadow-soft)",
        backdropFilter: "blur(18px)",
      }}
    >
      {sections.map((section) => {
        const active = section.id === activeSection;

        return (
          <ButtonBase
            key={section.id}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(section.id)}
            sx={{
              minHeight: 42,
              minWidth: { xs: 92, sm: 118 },
              px: { xs: 1.25, sm: 1.6 },
              borderRadius: 1,
              border: "1px solid",
              borderColor: active ? "var(--sn-border-strong)" : "transparent",
              color: active ? "var(--sn-accent)" : "text.secondary",
              bgcolor: active ? "var(--sn-accent-soft)" : "transparent",
              boxShadow: active ? "var(--sn-glow)" : "none",
              transition:
                "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
              "&:hover": {
                bgcolor: active ? "var(--sn-accent-soft)" : "rgba(20,184,166,0.08)",
              },
              "&:focus-visible": {
                outline: "3px solid rgba(20,184,166,0.28)",
                outlineOffset: 2,
              },
            }}
          >
            <Stack direction="row" spacing={0.8} alignItems="center" minWidth={0}>
              {section.icon ? <Box sx={{ display: "grid", placeItems: "center" }}>{section.icon}</Box> : null}
              <Typography
                component="span"
                sx={{
                  fontWeight: 900,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {section.label}
              </Typography>
              {section.badge ? (
                <Chip
                  label={section.badge}
                  size="small"
                  sx={{ height: 20, fontSize: 11, fontWeight: 800 }}
                />
              ) : null}
            </Stack>
          </ButtonBase>
        );
      })}
    </Stack>
  </Box>
);
