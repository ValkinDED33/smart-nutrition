import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useLanguage } from "../shared/i18n/I18nProvider";

const featureKeys = ["landing.card1", "landing.card2", "landing.card3"] as const;

const LandingPage = () => {
  const { t } = useLanguage();

  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="stretch">
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                minHeight: "100%",
                borderRadius: 8,
                color: "#f8fafc",
                background:
                  "linear-gradient(140deg, #0f172a 0%, #134e4a 48%, #65a30d 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.12), transparent 25%)",
                }}
              />
              <Stack spacing={3} sx={{ position: "relative" }}>
                <Chip
                  label={t("landing.eyebrow")}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "rgba(255,255,255,0.14)",
                    color: "inherit",
                    fontWeight: 700,
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    lineHeight: 1.04,
                    letterSpacing: "-0.04em",
                    fontSize: { xs: "2.4rem", md: "4rem" },
                    maxWidth: "11ch",
                  }}
                >
                  {t("landing.title")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "1rem", md: "1.15rem" },
                    maxWidth: "56ch",
                    color: "rgba(248,250,252,0.86)",
                    lineHeight: 1.7,
                  }}
                >
                  {t("landing.subtitle")}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: "#f8fafc",
                      color: "#0f172a",
                    }}
                  >
                    {t("landing.primary")}
                  </Button>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 800,
                      borderColor: "rgba(248,250,252,0.4)",
                      color: "#f8fafc",
                    }}
                  >
                    {t("landing.secondary")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              {featureKeys.map((featureKey, index) => (
                <Paper
                  key={featureKey}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 6,
                    flex: 1,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    backgroundColor: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: "#0f766e", fontWeight: 800, letterSpacing: "0.14em" }}
                  >
                    0{index + 1}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2 }}>
                    {t(`${featureKey}.title`)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t(`${featureKey}.body`)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
