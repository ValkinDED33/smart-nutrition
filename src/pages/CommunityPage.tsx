import { lazy, Suspense } from "react";
import { Stack, Typography } from "@mui/material";
import { CommunityHubCard } from "../features/community/CommunityHubCard";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
} from "../shared/ui";

const LearningHubCard = lazy(() =>
  import("../features/education/LearningHubCard").then((module) => ({
    default: module.LearningHubCard,
  }))
);

const CommunityPage = () => {
  const { appLanguage, t } = useLanguage();
  const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, "Learning Hub");

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.8}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 32, md: 40 } }}>
          {t("page.community.title")}
        </Typography>
        <Typography color="text.secondary">{t("page.community.subtitle")}</Typography>
      </Stack>
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
    </Stack>
  );
};

export default CommunityPage;
