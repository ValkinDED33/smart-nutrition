import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../app/store";
import { setProfileLanguage } from "../features/profile/profileSlice";
import { appLanguages } from "../shared/i18n";
import { useLanguage } from "../shared/language";
import type { AppLanguage } from "../shared/types/i18n";

const languageFlags: Record<AppLanguage, string> = {
  pl: "🇵🇱",
  uk: "🇺🇦",
  en: "🇬🇧",
};

const languageButtonSx = {
  justifyContent: "flex-start",
  py: 1.5,
  borderRadius: 1,
  textTransform: "none",
  fontWeight: 900,
  fontSize: "1.04rem",
  opacity: 1,
  "&.MuiButton-outlined": {
    color: "#1f2937",
    borderColor: "rgba(15, 118, 110, 0.34)",
    bgcolor: "rgba(255,255,255,0.92)",
  },
  "&.MuiButton-outlined:hover": {
    borderColor: "rgba(15, 118, 110, 0.56)",
    bgcolor: "rgba(240,253,250,0.96)",
  },
  "&.Mui-disabled": {
    color: "rgba(31, 41, 55, 0.72)",
    borderColor: "rgba(15, 118, 110, 0.2)",
    bgcolor: "rgba(248,250,252,0.84)",
    opacity: 1,
  },
} as const;

const LanguageSetupPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();

  const selectLanguage = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    dispatch(setProfileLanguage(nextLanguage));
    navigate("/register", { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "72vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 4 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.94)",
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1} textAlign="center">
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              🌍 {t("language.selectTitle")}
            </Typography>
            <Typography color="text.secondary">{t("language.selectBody")}</Typography>
          </Stack>

          <Stack spacing={1.2}>
            {appLanguages.map((language) => (
              <Button
                key={language}
                variant={appLanguage === language ? "contained" : "outlined"}
                size="large"
                onClick={() => selectLanguage(language)}
                sx={languageButtonSx}
              >
                {languageFlags[language]} {languageLabels[language]}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LanguageSetupPage;
