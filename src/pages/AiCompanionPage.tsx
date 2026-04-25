import { Stack, Typography } from "@mui/material";
import { AssistantRuntimeCard } from "../features/assistant/AssistantRuntimeCard";

const AiCompanionPage = () => {
  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        AI Companion
      </Typography>
      <Typography color="text.secondary">
        Ask for nutrition advice, day analysis, plateau explanations, and next actions.
      </Typography>
      <AssistantRuntimeCard />
    </Stack>
  );
};

export default AiCompanionPage;
