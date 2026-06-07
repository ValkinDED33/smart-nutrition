import { useMemo, useState, type ReactNode } from "react";
import { Box, Paper, Stack, Tab, Tabs } from "@mui/material";

export interface ProfileSectionTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ProfileSectionTabsProps {
  sections: ProfileSectionTab[];
}

export const ProfileSectionTabs = ({ sections }: ProfileSectionTabsProps) => {
  const firstSectionId = sections[0]?.id ?? "";
  const [activeSection, setActiveSection] = useState(firstSectionId);
  const sectionIds = useMemo(() => new Set(sections.map((section) => section.id)), [sections]);
  const safeActiveSection = sectionIds.has(activeSection) ? activeSection : firstSectionId;
  const selectedSection =
    sections.find((section) => section.id === safeActiveSection) ?? sections[0];

  if (!selectedSection) {
    return null;
  }

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.88)",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={safeActiveSection}
          onChange={(_, nextSection: string) => setActiveSection(nextSection)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Profile sections"
          sx={{
            minHeight: 48,
            px: { xs: 1, sm: 1.5 },
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 900,
            },
          }}
        >
          {sections.map((section) => (
            <Tab key={section.id} value={section.id} label={section.label} />
          ))}
        </Tabs>
      </Paper>

      <Box>{selectedSection.content}</Box>
    </Stack>
  );
};

export default ProfileSectionTabs;
