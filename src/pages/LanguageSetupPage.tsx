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
    color: "text.primary",
    borderColor: "var(--sn-border-strong)",
    bgcolor: "var(--sn-surface-elevated)",
  },
  "&.MuiButton-outlined:hover": {
    borderColor: "primary.main",
    bgcolor: "var(--sn-accent-soft)",
  },
  "&.Mui-disabled": {
    color: "text.secondary",
    borderColor: "var(--sn-border-soft)",
    bgcolor: "var(--sn-surface-muted)",
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
          border: "1px solid var(--sn-border-soft)",
          backgroundColor: "var(--sn-surface-glass)",
          boxShadow: "var(--sn-shadow-card)",
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
