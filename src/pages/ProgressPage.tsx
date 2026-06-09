import { useState } from "react";
import { Box, Stack } from "@mui/material";
import { MonthlyAnalyticsCard } from "../features/meal/MonthlyAnalyticsCard";
import { WeeklyInsights } from "../features/meal/WeeklyInsights";
import { BodyProgressPhotosCard } from "../features/profile/BodyProgressPhotosCard";
import { BodyWeeklyReportCard } from "../features/profile/BodyWeeklyReportCard";
import { MeasurementsCheckInCard } from "../features/profile/MeasurementsCheckInCard";
import { ProgressActionBar } from "../features/profile/ProgressActionBar";
import { QuickWeightCheckInCard } from "../features/profile/QuickWeightCheckInCard";
import { WeightTrendCard } from "../features/profile/WeightTrendCard";
import { WaterTracker } from "../features/water/WaterTracker";
import { useLanguage } from "../shared/language";
import { PageShell, SectionTabs } from "@shared/ui";

const progressPageCopy = {
  uk: {
    title: "Прогрес",
    subtitle:
      "Вага, вода, калорії та щотижневі заміри в одному адаптивному екрані.",
    sections: {
      weight: "Вага",
      water: "Вода",
      body: "Тіло",
      trends: "Тренди",
    },
  },
  pl: {
    title: "Progres",
    subtitle:
      "Waga, woda, kalorie i cotygodniowe pomiary w jednym responsywnym widoku.",
    sections: {
      weight: "Waga",
      water: "Woda",
      body: "Ciało",
      trends: "Trendy",
    },
  },
  en: {
    title: "Progress",
    subtitle:
      "Weight, water, calories, and weekly measurements in one responsive view.",
    sections: {
      weight: "Weight",
      water: "Water",
      body: "Body",
      trends: "Trends",
    },
  },
} as const;

type ProgressSection = "weight" | "water" | "body" | "trends";

const ProgressPage = () => {
  const { appLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState<ProgressSection>("weight");
  const copy = progressPageCopy[appLanguage];
  const sections = [
    { id: "weight", label: copy.sections.weight },
    { id: "water", label: copy.sections.water },
    { id: "body", label: copy.sections.body },
    { id: "trends", label: copy.sections.trends },
  ];

  return (
    <PageShell title={copy.title} subtitle={copy.subtitle}>
      <ProgressActionBar />

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as ProgressSection)}
        ariaLabel="Progress sections"
      />

      {activeSection === "weight" ? (
        <Stack spacing={2.5}>
          <QuickWeightCheckInCard />
          <WeightTrendCard />
        </Stack>
      ) : null}

      {activeSection === "water" ? <WaterTracker /> : null}

      {activeSection === "body" ? (
        <Stack spacing={2.5}>
          <BodyWeeklyReportCard />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <MeasurementsCheckInCard />
            <BodyProgressPhotosCard />
          </Box>
        </Stack>
      ) : null}

      {activeSection === "trends" ? (
        <Stack spacing={2.5}>
          <WeeklyInsights />
          <MonthlyAnalyticsCard />
        </Stack>
      ) : null}
    </PageShell>
  );
};

export default ProgressPage;
