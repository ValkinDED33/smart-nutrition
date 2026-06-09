import { useMemo, useState, type ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { SectionTabs } from "@shared/ui";

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
      <SectionTabs
        sections={sections.map(({ id, label }) => ({ id, label }))}
        activeSection={safeActiveSection}
        onChange={setActiveSection}
        ariaLabel="Profile sections"
      />

      <Box>{selectedSection.content}</Box>
    </Stack>
  );
};

export default ProfileSectionTabs;
