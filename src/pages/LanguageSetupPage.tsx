import { useDispatch } from "react-redux";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../app/store";
import { useLanguage } from "../shared/language";
import { setProfileLanguage } from "../features/profile/profileSlice";

const cardStyle = {
  borderRadius: 6,
  p: { xs: 3, md: 4 },
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,250,252,0.92) 100%)",
} as const;

const LanguageSetupPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setLanguage } = useLanguage();

  const selectLanguage = (language: "uk" | "pl") => {
    setLanguage(language);
    dispatch(setProfileLanguage(language));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(30,136,229,0.18), transparent 28%), radial-gradient(circle at top right, rgba(67,160,71,0.22), transparent 32%), linear-gradient(180deg, #f5f7fb 0%, #eef6ef 100%)",
        px: 2,
      }}
    >
      <Paper elevation={0} sx={{ ...cardStyle, width: "100%", maxWidth: 760 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              Smart Nutrition + AI Companion
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mt: 1 }}>
              Choose your language
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
              Обери мову інтерфейсу та помічника. / Wybierz język interfejsu i
              przyszłego asystenta.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: "stretch" }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => selectLanguage("uk")}
              sx={{
                flex: 1,
                minHeight: 140,
                borderRadius: 5,
                textTransform: "none",
                fontWeight: 800,
                fontSize: "1.05rem",
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              🇺🇦 Українська
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => selectLanguage("pl")}
              sx={{
                flex: 1,
                minHeight: 140,
                borderRadius: 5,
                textTransform: "none",
                fontWeight: 800,
                fontSize: "1.05rem",
                borderColor: "rgba(15, 23, 42, 0.12)",
                color: "#14213d",
                backgroundColor: "rgba(255,255,255,0.7)",
              }}
            >
              🇵🇱 Polski
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LanguageSetupPage;
