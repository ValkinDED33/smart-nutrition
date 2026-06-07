import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@shared/ui";

const HomePage = lazy(() => import("./HomePage"));

const DashboardPage = () => (
  <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={2} />}>
    <HomePage />
  </Suspense>
);

export default DashboardPage;
