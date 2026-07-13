import { lazy, Suspense, useState } from "react";
import { Box, Stack } from "@mui/material";
import { ProgressActionBar } from "../features/profile/ProgressActionBar";
import { ProgressOverviewCard } from "../features/profile/ProgressOverviewCard";
import { QuickWeightCheckInCard } from "../features/profile/QuickWeightCheckInCard";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionTabs,
} from "@shared/ui";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import type { AppLanguage } from "../shared/types/i18n";

const WaterTracker = lazy(() => import("../features/water/WaterTracker"));
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
type ProgressPageCopy = (typeof progressPageCopy)[keyof typeof progressPageCopy];

const getProgressPageCopy = (language: AppLanguage): ProgressPageCopy => {
  switch (language) {
    case "uk":
      return progressPageCopy.uk;
    case "pl":
      return progressPageCopy.pl;
    case "en":
    default:
      return progressPageCopy.en;
  }
};

const getProgressSectionLabel = (
  copy: ProgressPageCopy,
  section: ProgressSection
): string => {
  switch (section) {
    case "water":
      return copy.sections.water;
    case "body":
      return copy.sections.body;
    case "trends":
      return copy.sections.trends;
    case "weight":
    default:
      return copy.sections.weight;
  }
};

const ProgressPage = () => {
  const { appLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState<ProgressSection>("weight");
  const copy = getProgressPageCopy(appLanguage);
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    getProgressSectionLabel(copy, activeSection)
  );
  const sections = [
    { id: "weight", label: getProgressSectionLabel(copy, "weight") },
    { id: "water", label: getProgressSectionLabel(copy, "water") },
    { id: "body", label: getProgressSectionLabel(copy, "body") },
    { id: "trends", label: getProgressSectionLabel(copy, "trends") },
  ];

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      assistantHint={<EcosystemPulse focus="progress" />}
    >
      <ProgressActionBar />
      <ProgressOverviewCard />

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as ProgressSection)}
        ariaLabel="Progress sections"
      />

      {activeSection === "weight" ? (
        <Stack spacing={2.5}>
          <QuickWeightCheckInCard />
          <LazyModuleBoundary
            errorTitle={recoveryCopy.errorTitle}
            errorBody={recoveryCopy.errorBody}
            reloadLabel={recoveryCopy.reloadLabel}
            resetKey="progress:weight"
          >
            <Suspense fallback={<LoadingSkeleton cards={1} chart bodyRows={2} />}>
              <WeightTrendCard />
            </Suspense>
          </LazyModuleBoundary>
        </Stack>
      ) : null}

      {activeSection === "water" ? (
        <LazyModuleBoundary
          errorTitle={recoveryCopy.errorTitle}
          errorBody={recoveryCopy.errorBody}
          reloadLabel={recoveryCopy.reloadLabel}
          resetKey="progress:water"
        >
          <Suspense fallback={<LoadingSkeleton cards={2} bodyRows={3} />}>
            <WaterTracker />
          </Suspense>
        </LazyModuleBoundary>
      ) : null}

      {activeSection === "body" ? (
        <LazyModuleBoundary
          errorTitle={recoveryCopy.errorTitle}
          errorBody={recoveryCopy.errorBody}
          reloadLabel={recoveryCopy.reloadLabel}
          resetKey="progress:body"
        >
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
        </LazyModuleBoundary>
      ) : null}

      {activeSection === "trends" ? (
        <LazyModuleBoundary
          errorTitle={recoveryCopy.errorTitle}
          errorBody={recoveryCopy.errorBody}
          reloadLabel={recoveryCopy.reloadLabel}
          resetKey="progress:trends"
        >
          <Suspense fallback={<LoadingSkeleton cards={2} chart bodyRows={3} />}>
            <Stack spacing={2.5}>
              <WeeklyInsights />
              <MonthlyAnalyticsCard />
            </Stack>
          </Suspense>
        </LazyModuleBoundary>
      ) : null}
    </PageShell>
  );
};

export default ProgressPage;
