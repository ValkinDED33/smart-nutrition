import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { useLanguage } from "../shared/i18n/I18nProvider";

const NotFoundPage = () => {
  const { t } = useLanguage();

  return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 560,
          width: "100%",
          p: { xs: 3, md: 5 },
          textAlign: "center",
          borderRadius: 7,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.88)",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Typography
            variant="h1"
            sx={{ fontWeight: 900, lineHeight: 1, color: "#0f766e" }}
          >
            404
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("notFound.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
            {t("notFound.body")}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            sx={{
              mt: 1,
              px: 3,
              py: 1.3,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {t("notFound.action")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default NotFoundPage;
