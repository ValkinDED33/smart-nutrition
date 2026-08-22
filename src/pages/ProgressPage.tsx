import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, Stack } from "@mui/material";
import { Activity, BarChart3, Droplets, Scale, ScanLine, Sparkles } from "lucide-react";
import type { RootState } from "../app/store";
import { ProgressActionBar } from "../features/profile/ProgressActionBar";
import {
  ProgressOverviewCard,
  type ProgressDomain,
} from "../features/profile/ProgressOverviewCard";
import { QuickWeightCheckInCard } from "../features/profile/QuickWeightCheckInCard";
import { useLanguage } from "../shared/language";
import {
  AIMasterBlueprintPanel,
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionTabs,
} from "@shared/ui";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";
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
    sectionsAriaLabel: "Розділи прогресу",
    blueprintTitle: "Живі шкали дня",
    blueprintSubtitle:
      "Кожна шкала відкриває реальний розділ: вага, вода, заміри, тренди, скан їжі або підказка помічника.",
    blueprintPatterns: {
      weight: "Вага",
      water: "Вода",
      body: "Тіло",
      trends: "Тренди",
      food: "Їжа",
      assistant: "AI-підказка",
    },
    blueprintPatternDescriptions: {
      weight: "Записати вагу і побачити історію без зайвого переходу.",
      water: "Повернути стаканчики, темп і норму води.",
      body: "Зібрати заміри, фото прогресу і зміни тіла.",
      trends: "Побачити калорії, білок, прийоми їжі і місячну аналітику.",
      food: "Перейти до сканера або фото їжі, щоб прогрес був з реальних даних.",
      assistant: "Попросити помічника пояснити, що важливіше саме зараз.",
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
    sectionsAriaLabel: "Sekcje postępu",
    blueprintTitle: "Żywe skale dnia",
    blueprintSubtitle:
      "Każda skala otwiera realną sekcję: wagę, wodę, pomiary, trendy, skan jedzenia albo podpowiedź asystenta.",
    blueprintPatterns: {
      weight: "Waga",
      water: "Woda",
      body: "Ciało",
      trends: "Trendy",
      food: "Jedzenie",
      assistant: "Rada AI",
    },
    blueprintPatternDescriptions: {
      weight: "Zapisz wagę i zobacz historię bez zbędnych przejść.",
      water: "Przywróć szklanki, tempo i normę wody.",
      body: "Zbierz pomiary, zdjęcia progresu i zmiany ciała.",
      trends: "Zobacz kalorie, białko, posiłki i analizę miesiąca.",
      food: "Przejdź do skanera albo zdjęcia jedzenia dla realnych danych.",
      assistant: "Poproś asystenta o wyjaśnienie, co jest teraz najważniejsze.",
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
    sectionsAriaLabel: "Progress sections",
    blueprintTitle: "Living daily scales",
    blueprintSubtitle:
      "Each scale opens a real surface: weight, water, body, trends, food scan, or assistant guidance.",
    blueprintPatterns: {
      weight: "Weight",
      water: "Water",
      body: "Body",
      trends: "Trends",
      food: "Food",
      assistant: "AI insight",
    },
    blueprintPatternDescriptions: {
      weight: "Log weight and review history without a dead-end card.",
      water: "Bring back glasses, pace, and the daily water target.",
      body: "Collect measurements, progress photos, and body changes.",
      trends: "See calories, protein, meals, and monthly analytics.",
      food: "Open scanner or meal photo so progress comes from real logs.",
      assistant: "Ask the assistant to explain what matters most right now.",
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

const getSectionForProgressDomain = (domain: ProgressDomain): ProgressSection => {
  switch (domain) {
    case "water":
      return "water";
    case "checkIn":
      return "body";
    case "calories":
    case "protein":
    case "meals":
      return "trends";
    case "weight":
    default:
      return "weight";
  }
};

const ProgressPage = () => {
  const { appLanguage } = useLanguage();
  const navigate = useNavigate();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const [activeSection, setActiveSection] = useState<ProgressSection>("weight");
  const copy = getProgressPageCopy(appLanguage);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
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
  const progressBlueprintPatterns = [
    {
      key: "weight",
      label: copy.blueprintPatterns.weight,
      description: copy.blueprintPatternDescriptions.weight,
      icon: Scale,
      accent: "#22c55e",
      onClick: () => setActiveSection("weight"),
    },
    {
      key: "water",
      label: copy.blueprintPatterns.water,
      description: copy.blueprintPatternDescriptions.water,
      icon: Droplets,
      accent: "#22d3ee",
      onClick: () => setActiveSection("water"),
    },
    {
      key: "body",
      label: copy.blueprintPatterns.body,
      description: copy.blueprintPatternDescriptions.body,
      icon: Activity,
      accent: "#a78bfa",
      onClick: () => setActiveSection("body"),
    },
    {
      key: "trends",
      label: copy.blueprintPatterns.trends,
      description: copy.blueprintPatternDescriptions.trends,
      icon: BarChart3,
      accent: "#f59e0b",
      onClick: () => setActiveSection("trends"),
    },
    {
      key: "food",
      label: copy.blueprintPatterns.food,
      description: copy.blueprintPatternDescriptions.food,
      icon: ScanLine,
      accent: "#14b8a6",
      onClick: () => navigate("/meals?mode=barcode"),
    },
    {
      key: "assistant",
      label: copy.blueprintPatterns.assistant,
      description: copy.blueprintPatternDescriptions.assistant,
      icon: Sparkles,
      accent: "#60a5fa",
      onClick: () => navigate("/coach"),
    },
  ];

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      assistantHint={<EcosystemPulse focus="progress" />}
    >
      <ProgressActionBar />
      <ProgressOverviewCard
        onSelectDomain={(domain) => setActiveSection(getSectionForProgressDomain(domain))}
      />

      <AIMasterBlueprintPanel
        eyebrow="Smart Nutrition AI"
        title={copy.blueprintTitle}
        description={copy.blueprintSubtitle}
        patterns={progressBlueprintPatterns}
        assistantName={assistantDisplayName}
        assistantVariant={assistant.companionKind}
      />

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as ProgressSection)}
        ariaLabel={copy.sectionsAriaLabel}
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
