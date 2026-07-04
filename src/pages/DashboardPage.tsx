import { lazy, Suspense } from "react";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
} from "@shared/ui";
import { useLanguage } from "../shared/language";

const HomePage = lazy(() => import("./HomePage"));

const DashboardPage = () => {
  const { appLanguage, t } = useLanguage();
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    t("nav.home")
  );

  return (
    <LazyModuleBoundary
      errorTitle={recoveryCopy.errorTitle}
      errorBody={recoveryCopy.errorBody}
      reloadLabel={recoveryCopy.reloadLabel}
      resetKey="route:dashboard"
    >
      <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={2} />}>
        <HomePage />
      </Suspense>
    </LazyModuleBoundary>
  );
};

export default DashboardPage;
