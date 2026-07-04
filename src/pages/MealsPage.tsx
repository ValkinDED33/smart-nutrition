import { lazy, Suspense } from "react";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
} from "@shared/ui";
import { useLanguage } from "../shared/language";

const MealBuilderPage = lazy(() => import("./MealBuilderPage"));

const MealsPage = () => {
  const { appLanguage, t } = useLanguage();
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    t("nav.food")
  );

  return (
    <LazyModuleBoundary
      errorTitle={recoveryCopy.errorTitle}
      errorBody={recoveryCopy.errorBody}
      reloadLabel={recoveryCopy.reloadLabel}
      resetKey="route:meals"
    >
      <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={4} />}>
        <MealBuilderPage />
      </Suspense>
    </LazyModuleBoundary>
  );
};

export default MealsPage;
