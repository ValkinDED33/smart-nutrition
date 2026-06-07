import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@shared/ui";

const MealBuilderPage = lazy(() => import("./MealBuilderPage"));

const MealsPage = () => (
  <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={4} />}>
    <MealBuilderPage />
  </Suspense>
);

export default MealsPage;
