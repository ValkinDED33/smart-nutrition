import { useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import { SectionTabs } from "@shared/ui";

interface ProfileSectionTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ProfileSectionTabsProps {
  sections: ProfileSectionTab[];
  ariaLabel: string;
}

const getSectionIdFromHash = (hash: string) => {
  if (!hash.startsWith("#")) {
    return "";
  }

  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
};

export const ProfileSectionTabs = ({ sections, ariaLabel }: ProfileSectionTabsProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const firstSectionId = sections[0]?.id ?? "";
  const sectionIds = useMemo(() => new Set(sections.map((section) => section.id)), [sections]);
  const hashSectionId = getSectionIdFromHash(location.hash);
  const safeActiveSection = sectionIds.has(hashSectionId) ? hashSectionId : firstSectionId;
  const selectedSection =
    sections.find((section) => section.id === safeActiveSection) ?? sections[0];

  const handleSectionChange = (sectionId: string) => {
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: sectionId,
      },
      { replace: true }
    );
  };

  if (!selectedSection) {
    return null;
  }

  return (
    <Stack spacing={2.5}>
      <SectionTabs
        sections={sections.map(({ id, label }) => ({ id, label }))}
        activeSection={safeActiveSection}
        onChange={handleSectionChange}
        ariaLabel={ariaLabel}
      />

      <Box id={safeActiveSection}>{selectedSection.content}</Box>
    </Stack>
  );
};
