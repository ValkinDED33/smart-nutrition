import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useLanguage } from "../shared/language";

const landingCopy = {
  uk: {
    eyebrow: "Nutrition under control",
    title: "Plan meals, track progress, and keep every important detail in one place.",
    subtitle:
      "Smart Nutrition helps you organize daily meals, calories, macros, and target weight without the usual chaos of notes and spreadsheets.",
    primary: "Start planning",
    secondary: "Open my profile",
    pills: ["Calories and macros", "Barcode scanning", "Weight progress"],
    stats: [
      { value: "1 day", label: "of nutrition visible at a glance" },
      { value: "4 zones", label: "breakfast, lunch, dinner, and snacks" },
      { value: "100%", label: "clear progress toward your goal" },
    ],
    previewEyebrow: "Why it helps",
    previewTitle: "Instead of scattered notes, you instantly see the full picture of your day.",
    previewPoints: [
      "What has already been eaten for breakfast, lunch, dinner, and snacks.",
      "How many calories and macros are left before you hit the daily goal.",
      "How your current weight is moving toward the result you want.",
    ],
    cards: [
      {
        title: "Daily focus",
        body: "Add products fast, build meals, and keep your nutrition routine easy to follow.",
      },
      {
        title: "Visible progress",
        body: "Calories, meal history, and target-weight progress live inside one clean view.",
      },
      {
        title: "Practical workflow",
        body: "Saved foods, scanning, and manual add make the diary feel fast in real use.",
      },
    ],
  },
  pl: {
    eyebrow: "Nutrition under control",
    title: "Plan meals, track progress, and keep every important detail in one place.",
    subtitle:
      "Smart Nutrition helps you organize daily meals, calories, macros, and target weight without the usual chaos of notes and spreadsheets.",
    primary: "Start planning",
    secondary: "Open my profile",
    pills: ["Calories and macros", "Barcode scanning", "Weight progress"],
    stats: [
      { value: "1 day", label: "of nutrition visible at a glance" },
      { value: "4 zones", label: "breakfast, lunch, dinner, and snacks" },
      { value: "100%", label: "clear progress toward your goal" },
    ],
    previewEyebrow: "Why it helps",
    previewTitle: "Instead of scattered notes, you instantly see the full picture of your day.",
    previewPoints: [
      "What has already been eaten for breakfast, lunch, dinner, and snacks.",
      "How many calories and macros are left before you hit the daily goal.",
      "How your current weight is moving toward the result you want.",
    ],
    cards: [
      {
        title: "Daily focus",
        body: "Add products fast, build meals, and keep your nutrition routine easy to follow.",
      },
      {
        title: "Visible progress",
        body: "Calories, meal history, and target-weight progress live inside one clean view.",
      },
      {
        title: "Practical workflow",
        body: "Saved foods, scanning, and manual add make the diary feel fast in real use.",
      },
    ],
  },
} as const;

const LandingPage = () => {
  const { language } = useLanguage();
  const copy = landingCopy[language];

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
                  "linear-gradient(145deg, #07131f 0%, #0f766e 52%, #65a30d 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at 82% 78%, rgba(255,255,255,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
                }}
              />

              <Stack spacing={3} sx={{ position: "relative" }}>
                <Chip
                  label={copy.eyebrow}
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
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    fontSize: { xs: "2.5rem", md: "4.15rem" },
                    maxWidth: "11ch",
                  }}
                >
                  {copy.title}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: "1rem", md: "1.1rem" },
                    maxWidth: "58ch",
                    color: "rgba(248,250,252,0.88)",
                    lineHeight: 1.75,
                  }}
                >
                  {copy.subtitle}
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {copy.pills.map((pill) => (
                    <Chip
                      key={pill}
                      label={pill}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: "inherit",
                        border: "1px solid rgba(255,255,255,0.16)",
                      }}
                    />
                  ))}
                </Stack>

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
                    {copy.primary}
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
                    {copy.secondary}
                  </Button>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 1.5,
                    pt: 1,
                  }}
                >
                  {copy.stats.map((stat) => (
                    <Paper
                      key={stat.label}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 4,
                        bgcolor: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "inherit",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: "1.15rem" }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ color: "rgba(248,250,252,0.82)", lineHeight: 1.6 }}>
                        {stat.label}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.2,
                  borderRadius: 6,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(236,253,245,0.88) 100%)",
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: "#0f766e", fontWeight: 800, letterSpacing: "0.14em" }}
                >
                  {copy.previewEyebrow}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, mb: 2 }}>
                  {copy.previewTitle}
                </Typography>
                <Stack spacing={1.4}>
                  {copy.previewPoints.map((point, index) => (
                    <Stack key={point} direction="row" spacing={1.2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                          bgcolor: "rgba(15,118,110,0.14)",
                          color: "#0f766e",
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {copy.cards.map((card, index) => (
                <Paper
                  key={card.title}
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
                    {card.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {card.body}
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
