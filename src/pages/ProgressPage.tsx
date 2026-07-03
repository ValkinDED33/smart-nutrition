import { lazy, Suspense, useState } from "react";
import { Box, Stack } from "@mui/material";
import { ProgressActionBar } from "../features/profile/ProgressActionBar";
import { QuickWeightCheckInCard } from "../features/profile/QuickWeightCheckInCard";
import { useLanguage } from "../shared/language";
import { LoadingSkeleton, PageShell, SectionTabs } from "@shared/ui";

const WaterTracker = lazy(() =>
  import("../features/water/WaterTracker").then((module) => ({
    default: module.WaterTracker,
  }))
);
const WeightTrendCard = lazy(() =>
  import("../features/profile/WeightTrendCard").then((module) => ({
    default: module.WeightTrendCard,
  }))
);
const BodyWeeklyReportCard = lazy(() =>
  import("../features/profile/BodyWeeklyReportCard").then((module) => ({
    default: module.BodyWeeklyReportCard,
  }))
);
const MeasurementsCheckInCard = lazy(() =>
  import("../features/profile/MeasurementsCheckInCard").then((module) => ({
    default: module.MeasurementsCheckInCard,
  }))
);
const BodyProgressPhotosCard = lazy(() =>
  import("../features/profile/BodyProgressPhotosCard").then((module) => ({
    default: module.BodyProgressPhotosCard,
  }))
);
const WeeklyInsights = lazy(() =>
  import("../features/meal/WeeklyInsights").then((module) => ({
    default: module.WeeklyInsights,
  }))
);
const MonthlyAnalyticsCard = lazy(() =>
  import("../features/meal/MonthlyAnalyticsCard").then((module) => ({
    default: module.MonthlyAnalyticsCard,
  }))
);

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
          <Suspense fallback={<LoadingSkeleton cards={1} chart bodyRows={2} />}>
            <WeightTrendCard />
          </Suspense>
        </Stack>
      ) : null}

      {activeSection === "water" ? (
        <Suspense fallback={<LoadingSkeleton cards={2} bodyRows={3} />}>
          <WaterTracker />
        </Suspense>
      ) : null}

      {activeSection === "body" ? (
        <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={3} />}>
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
        </Suspense>
      ) : null}

      {activeSection === "trends" ? (
        <Suspense fallback={<LoadingSkeleton cards={2} chart bodyRows={3} />}>
          <Stack spacing={2.5}>
            <WeeklyInsights />
            <MonthlyAnalyticsCard />
          </Stack>
        </Suspense>
      ) : null}
    </PageShell>
  );
};

export default ProgressPage;
