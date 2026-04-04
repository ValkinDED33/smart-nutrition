import { useDispatch, useSelector } from "react-redux";
import {
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setAssistantCustomization } from "./profileSlice";
import { useLanguage } from "../../shared/language";

const assistantCopy = {
  uk: {
    title: "Assistant style",
    subtitle:
      "Set how the future AI helper should speak with you and how it should address you.",
    name: "Assistant name",
    role: "Role",
    tone: "Tone",
    humor: "Light humor",
    roleFriend: "Friend",
    roleAssistant: "Assistant",
    roleCoach: "Coach",
    toneGentle: "Gentle",
    tonePlayful: "Playful",
    toneFocused: "Focused",
  },
  pl: {
    title: "Assistant style",
    subtitle:
      "Set how the future AI helper should speak with you and how it should address you.",
    name: "Assistant name",
    role: "Role",
    tone: "Tone",
    humor: "Light humor",
    roleFriend: "Friend",
    roleAssistant: "Assistant",
    roleCoach: "Coach",
    toneGentle: "Gentle",
    tonePlayful: "Playful",
    toneFocused: "Focused",
  },
} as const;

export const AssistantCustomizationCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { language } = useLanguage();
  const copy = assistantCopy[language];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <BoxHeader title={copy.title} subtitle={copy.subtitle} />

        <TextField
          label={copy.name}
          value={assistant.name}
          onChange={(event) =>
            dispatch(setAssistantCustomization({ name: event.target.value }))
          }
          inputProps={{ maxLength: 32 }}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={copy.role}
            value={assistant.role}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  role: event.target.value as "friend" | "assistant" | "coach",
                })
              )
            }
          >
            <MenuItem value="friend">{copy.roleFriend}</MenuItem>
            <MenuItem value="assistant">{copy.roleAssistant}</MenuItem>
            <MenuItem value="coach">{copy.roleCoach}</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={copy.tone}
            value={assistant.tone}
            onChange={(event) =>
              dispatch(
                setAssistantCustomization({
                  tone: event.target.value as "gentle" | "playful" | "focused",
                })
              )
            }
          >
            <MenuItem value="gentle">{copy.toneGentle}</MenuItem>
            <MenuItem value="playful">{copy.tonePlayful}</MenuItem>
            <MenuItem value="focused">{copy.toneFocused}</MenuItem>
          </TextField>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={assistant.humorEnabled}
              onChange={(_, checked) =>
                dispatch(setAssistantCustomization({ humorEnabled: checked }))
              }
            />
          }
          label={copy.humor}
        />
      </Stack>
    </Paper>
  );
};

const BoxHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Stack spacing={0.8}>
    <Typography variant="h6" sx={{ fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography color="text.secondary">{subtitle}</Typography>
  </Stack>
);

export default AssistantCustomizationCard;
