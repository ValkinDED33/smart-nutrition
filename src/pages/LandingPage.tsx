import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useLanguage } from "../shared/language";

const landingCopy = {
  uk: {
    eyebrow: "Calories, water, weight, AI",
    title: "Smart Nutrition",
    subtitle:
      "Your daily nutrition dashboard: track food fast, see calories and macros, log water, follow weight progress, and get one useful AI tip for the next step.",
    primary: "Start Free",
    secondary: "Login",
    heroChips: ["5-second dashboard", "AI coach", "Phone, tablet, desktop"],
    previewToday: "Today",
    previewCalories: "Calories",
    previewWater: "Water",
    previewWeight: "Weight",
    previewAi: "AI tip",
    previewAiText: "Protein is low. Add eggs, yogurt, or chicken at the next meal.",
    benefitsTitle: "Everything important, without opening five apps.",
    benefitsSubtitle:
      "The first version focuses on clarity and retention: users always know what to do next.",
    benefits: [
      {
        title: "Clear daily control",
        body: "Calories, macros, water, and weight live together so the day is easy to scan.",
      },
      {
        title: "Fast food logging",
        body: "Search, saved products, recent foods, and quick portions keep the diary moving.",
      },
      {
        title: "AI next action",
        body: "The assistant gives small contextual nudges instead of generic motivation text.",
      },
      {
        title: "Responsive from day one",
        body: "The interface is arranged for thumb use on phone, focused work on tablet, and dense overview on desktop.",
      },
    ],
    devicesTitle: "One product, three screens.",
    devices: [
      { title: "Phone", body: "Bottom navigation, big actions, compact stats." },
      { title: "Tablet", body: "Two-column planning with readable cards." },
      { title: "Desktop", body: "Full dashboard width and faster scanning." },
    ],
    ctaTitle: "Start with the simplest win today.",
    ctaBody: "Create a profile, add one meal, drink one glass of water, and let the assistant guide the rest.",
  },
  pl: {
    eyebrow: "Calories, water, weight, AI",
    title: "Smart Nutrition",
    subtitle:
      "Your daily nutrition dashboard: track food fast, see calories and macros, log water, follow weight progress, and get one useful AI tip for the next step.",
    primary: "Start Free",
    secondary: "Login",
    heroChips: ["5-second dashboard", "AI coach", "Phone, tablet, desktop"],
    previewToday: "Today",
    previewCalories: "Calories",
    previewWater: "Water",
    previewWeight: "Weight",
    previewAi: "AI tip",
    previewAiText: "Protein is low. Add eggs, yogurt, or chicken at the next meal.",
    benefitsTitle: "Everything important, without opening five apps.",
    benefitsSubtitle:
      "The first version focuses on clarity and retention: users always know what to do next.",
    benefits: [
      {
        title: "Clear daily control",
        body: "Calories, macros, water, and weight live together so the day is easy to scan.",
      },
      {
        title: "Fast food logging",
        body: "Search, saved products, recent foods, and quick portions keep the diary moving.",
      },
      {
        title: "AI next action",
        body: "The assistant gives small contextual nudges instead of generic motivation text.",
      },
      {
        title: "Responsive from day one",
        body: "The interface is arranged for thumb use on phone, focused work on tablet, and dense overview on desktop.",
      },
    ],
    devicesTitle: "One product, three screens.",
    devices: [
      { title: "Phone", body: "Bottom navigation, big actions, compact stats." },
      { title: "Tablet", body: "Two-column planning with readable cards." },
      { title: "Desktop", body: "Full dashboard width and faster scanning." },
    ],
    ctaTitle: "Start with the simplest win today.",
    ctaBody: "Create a profile, add one meal, drink one glass of water, and let the assistant guide the rest.",
  },
} as const;

const appPreviewStats = [
  { label: "Protein", value: "62%", color: "#14b8a6" },
  { label: "Water", value: "6/8", color: "#38bdf8" },
  { label: "Goal", value: "-4.2 kg", color: "#f97316" },
];

const AppPreview = ({ compact = false }: { compact?: boolean }) => {
  const { language } = useLanguage();
  const copy = landingCopy[language];

  return (
    <Paper
      elevation={0}
      sx={{
        width: compact ? "100%" : { xs: 320, sm: 420, md: 540 },
        borderRadius: compact ? 1 : 2,
        border: "1px solid rgba(255,255,255,0.2)",
        bgcolor: "rgba(255,255,255,0.94)",
        color: "#14213d",
        overflow: "hidden",
        boxShadow: compact ? "none" : "0 28px 80px rgba(2, 6, 23, 0.34)",
      }}
    >
      <Box sx={{ p: compact ? 1.5 : 2, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack spacing={0.2}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {copy.previewToday}
            </Typography>
            <Typography sx={{ fontWeight: 900 }}>Smart Nutrition</Typography>
          </Stack>
          <Chip size="small" label="AI ready" color="success" variant="outlined" />
        </Stack>
      </Box>

      <Box sx={{ p: compact ? 1.5 : 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr" : "1.25fr 0.75fr",
            gap: 1.5,
          }}
        >
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography sx={{ fontWeight: 900 }}>{copy.previewCalories}</Typography>
                <Typography sx={{ fontWeight: 900, color: "#0f766e" }}>1,420 / 2,050</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={69}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(15,23,42,0.08)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#0f766e" },
                }}
              />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                {appPreviewStats.map((item) => (
                  <Box key={item.label}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>{copy.previewWater}</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.7 }}>
                {Array.from({ length: 8 }, (_, index) => (
                  <Box
                    key={`water-${index}`}
                    sx={{
                      height: 32,
                      borderRadius: 1,
                      border: "1px solid rgba(56,189,248,0.34)",
                      bgcolor: index < 6 ? "#38bdf8" : "rgba(226,232,240,0.82)",
                    }}
                  />
                ))}
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Paper
          variant="outlined"
          sx={{ mt: 1.5, p: 1.5, borderRadius: 1, borderColor: "rgba(249,115,22,0.2)" }}
        >
          <Stack direction="row" spacing={1.2} alignItems="flex-start">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "#0f766e",
                color: "#ffffff",
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              AI
            </Box>
            <Stack spacing={0.4}>
              <Typography sx={{ fontWeight: 900 }}>{copy.previewAi}</Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.previewAiText}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Paper>
  );
};

const DevicePreview = ({
  title,
  body,
  variant,
}: {
  title: string;
  body: string;
  variant: "phone" | "tablet" | "desktop";
}) => {
  const frameWidth = variant === "phone" ? 170 : variant === "tablet" ? 250 : "100%";
  const frameHeight = variant === "phone" ? 310 : variant === "tablet" ? 280 : 260;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        bgcolor: "rgba(255,255,255,0.9)",
        height: "100%",
      }}
    >
      <Stack spacing={1.8} sx={{ height: "100%" }}>
        <Box
          sx={{
            mx: "auto",
            width: frameWidth,
            maxWidth: "100%",
            height: frameHeight,
            borderRadius: variant === "phone" ? 3 : 1,
            border: "8px solid #14213d",
            bgcolor: "#f8fafc",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 1.2 }}>
            <AppPreview compact />
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {body}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

const LandingPage = () => {
  const { language } = useLanguage();
  const copy = landingCopy[language];

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Box
        component="section"
        sx={{
          mx: { xs: -2, sm: -3 },
          mt: { xs: -2, md: -3 },
          minHeight: { xs: 600, md: 620 },
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          bgcolor: "#14342f",
          background:
            "linear-gradient(135deg, #14342f 0%, #0f766e 42%, #84cc16 76%, #f97316 100%)",
          display: "grid",
          alignItems: "center",
          px: { xs: 2, sm: 4, md: 7 },
          py: { xs: 5, md: 7 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.52) 42%, rgba(15,23,42,0.08) 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: { xs: -150, sm: -70, lg: 64 },
            bottom: { xs: -86, sm: -60, md: 58 },
            opacity: { xs: 0.28, sm: 0.46, md: 1 },
            transform: { xs: "rotate(-5deg)", md: "rotate(-2deg)" },
            pointerEvents: "none",
          }}
        >
          <AppPreview />
        </Box>

        <Stack spacing={2.8} sx={{ position: "relative", maxWidth: 680 }}>
          <Chip
            label={copy.eyebrow}
            sx={{
              alignSelf: "flex-start",
              bgcolor: "rgba(255,255,255,0.16)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.24)",
            }}
          />
          <Stack spacing={1.5}>
            <Typography
              component="h1"
              variant="h1"
              sx={{
                fontSize: { xs: "3rem", sm: "4rem", md: "5.7rem" },
                lineHeight: 0.96,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              {copy.title}
            </Typography>
            <Typography
              sx={{
                maxWidth: 620,
                fontSize: { xs: "1.03rem", md: "1.2rem" },
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {copy.subtitle}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {copy.heroChips.map((item) => (
              <Chip
                key={item}
                label={item}
                sx={{
                  bgcolor: "rgba(255,255,255,0.14)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                px: 3.4,
                py: 1.5,
                bgcolor: "#ffffff",
                color: "#14342f",
                "&:hover": { bgcolor: "#f8fafc" },
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
                px: 3.4,
                py: 1.5,
                borderColor: "rgba(255,255,255,0.42)",
                color: "#ffffff",
                "&:hover": {
                  borderColor: "#ffffff",
                  bgcolor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              {copy.secondary}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={1}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 900, lineHeight: 1.08, fontSize: { xs: "2.4rem", md: "3rem" } }}
            >
              {copy.benefitsTitle}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.7 }}>
              {copy.benefitsSubtitle}
            </Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {copy.benefits.map((card, index) => (
              <Paper
                key={card.title}
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 1,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  bgcolor: "rgba(255,255,255,0.9)",
                }}
              >
                <Stack spacing={1}>
                  <Chip
                    label={`0${index + 1}`}
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: index % 2 === 0 ? "rgba(20,184,166,0.12)" : "rgba(249,115,22,0.12)",
                      color: index % 2 === 0 ? "#0f766e" : "#c2410c",
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {card.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {card.body}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Stack component="section" spacing={2}>
        <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "2.4rem", md: "3rem" } }}>
          {copy.devicesTitle}
        </Typography>
        <Grid container spacing={2.5} alignItems="stretch">
          {copy.devices.map((device, index) => (
            <Grid key={device.title} size={{ xs: 12, md: 4 }}>
              <DevicePreview
                title={device.title}
                body={device.body}
                variant={index === 0 ? "phone" : index === 1 ? "tablet" : "desktop"}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          bgcolor: "#14213d",
          color: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.8}>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {copy.ctaTitle}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.78)", maxWidth: 760 }}>
              {copy.ctaBody}
            </Typography>
          </Stack>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{ bgcolor: "#84cc16", color: "#14213d", "&:hover": { bgcolor: "#a3e635" } }}
          >
            {copy.primary}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default LandingPage;
