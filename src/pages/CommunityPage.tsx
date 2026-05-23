import { Stack, Typography } from "@mui/material";
import { CommunityHubCard } from "../features/community/CommunityHubCard";
import { LearningHubCard } from "../features/education/LearningHubCard";
import { useLanguage } from "../shared/language";

const CommunityPage = () => {
  const { t } = useLanguage();

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.8}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 32, md: 40 } }}>
          {t("page.community.title")}
        </Typography>
        <Typography color="text.secondary">{t("page.community.subtitle")}</Typography>
      </Stack>
      <CommunityHubCard />
      <LearningHubCard />
    </Stack>
  );
};

export default CommunityPage;
