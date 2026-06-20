import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { AppDispatch } from "../../app/store";
import { setProfileLanguage } from "../../features/profile/profileSlice";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { cardSx, shellSx, stepPaths } from "./types";

export const OnboardingWelcomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();

  const handleLanguageChange = (value: AppLanguage) => {
    setLanguage(value);
    dispatch(setProfileLanguage(value));
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
              Smart Nutrition
            </Typography>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {t("onboarding.welcomeTitle")}
            </Typography>
            <Typography color="text.secondary">{t("onboarding.welcomeBody")}</Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{t("onboarding.languageTitle")}</Typography>
            <FormControl fullWidth>
              <Select
                value={appLanguage}
                sx={{
                  "& .MuiSelect-select": {
                    color: "text.primary",
                    fontWeight: 800,
                  },
                }}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue === "uk" || nextValue === "pl" || nextValue === "en") {
                    handleLanguageChange(nextValue);
                  }
                }}
              >
                <MenuItem value="pl">🇵🇱 {languageLabels.pl}</MenuItem>
                <MenuItem value="uk">🇺🇦 {languageLabels.uk}</MenuItem>
                <MenuItem value="en">🇬🇧 {languageLabels.en}</MenuItem>
                <MenuItem
                  disabled
                  value="add"
                  sx={{
                    opacity: "1 !important",
                    color: "text.secondary",
                    fontWeight: 800,
                  }}
                >
                  + {t("language.add")}
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(stepPaths.assistant)}
            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
          >
            {t("onboarding.start")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
