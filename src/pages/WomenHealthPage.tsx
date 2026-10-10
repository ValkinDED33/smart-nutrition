import { lazy, Suspense } from "react";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { buildLazyModuleRecoveryCopy, LazyModuleBoundary, LoadingSkeleton, PageShell } from "@shared/ui";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const WomenHealthOverviewCard = lazy(() =>
  import("../features/profile/WomenHealthOverviewCard")
);

const copyByLanguage: Record<AppLanguage, { title: string; subtitle: string }> = {
  uk: {
    title: "Жiноче здоров'я",
    subtitle:
      "Цикл, вагiтнiсть, партнер, пiсля пологiв i родиннi сценарiї в одному центрi.",
  },
  pl: {
    title: "Zdrowie kobiet",
    subtitle: "Cykl, ciaza, partner, polog i rodzinne scenariusze w jednym centrum.",
  },
  en: {
    title: "Women's health",
    subtitle: "Cycle, pregnancy, partner, postpartum, and family scenarios in one center.",
  },
};

const getCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return copyByLanguage.uk;
    case "pl":
      return copyByLanguage.pl;
    case "en":
    default:
      return copyByLanguage.en;
  }
};

const WomenHealthPage = () => {
  const { appLanguage } = useLanguage();
  const copy = getCopy(appLanguage);
  const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, copy.title);

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      assistantHint={<EcosystemPulse focus="profile" />}
      compact
    >
      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey="route:women-health"
      >
        <Suspense fallback={<LoadingSkeleton cards={3} chart bodyRows={3} />}>
          <WomenHealthOverviewCard />
        </Suspense>
      </LazyModuleBoundary>
    </PageShell>
  );
};

export default WomenHealthPage;
