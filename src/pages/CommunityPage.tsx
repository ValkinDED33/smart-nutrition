import { lazy, Suspense } from "react";
import { CommunityHubCard } from "../features/community/CommunityHubCard";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
} from "../shared/ui";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";

const LearningHubCard = lazy(() =>
  import("../features/education/LearningHubCard").then((module) => ({
    default: module.LearningHubCard,
  }))
);

const CommunityPage = () => {
  const { appLanguage, t } = useLanguage();
  const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, "Learning Hub");

  return (
    <PageShell
      title={t("page.community.title")}
      subtitle={t("page.community.subtitle")}
      assistantHint={<EcosystemPulse focus="community" />}
    >
      <CommunityHubCard />
      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey="community:learning-hub"
      >
        <Suspense fallback={<LoadingSkeleton bodyRows={5} />}>
          <LearningHubCard />
        </Suspense>
      </LazyModuleBoundary>
    </PageShell>
  );
};

export default CommunityPage;
