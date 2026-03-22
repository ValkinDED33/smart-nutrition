import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import type { RootState } from "../../app/store";
import { logout as clearAuthState } from "../../features/auth/authSlice";
import { resetProfile } from "../../features/profile/profileSlice";
import { clearMeal } from "../../features/meal/mealSlice";
import { logout as logoutSession } from "../api/auth";
import { useLanguage } from "../i18n/I18nProvider";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await logoutSession();
    dispatch(clearAuthState());
    dispatch(resetProfile());
    dispatch(clearMeal());
    navigate("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(30,136,229,0.18), transparent 28%), radial-gradient(circle at top right, rgba(67,160,71,0.22), transparent 32%), linear-gradient(180deg, #f5f7fb 0%, #eef6ef 100%)",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(247, 250, 252, 0.78)",
          color: "#14213d",
          borderBottom: "1px solid rgba(20, 33, 61, 0.08)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              minHeight: 82,
              gap: 2,
              px: 0,
              py: 1.25,
              alignItems: "stretch",
              flexDirection: "column",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              sx={{ width: "100%" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flexGrow={1}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  SN
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component={Link}
                    to="/"
                    sx={{
                      display: "inline-block",
                      textDecoration: "none",
                      color: "inherit",
                      fontWeight: 800,
                      fontSize: { xs: 18, sm: 22 },
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {t("brand.name")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "rgba(20,33,61,0.65)",
                      whiteSpace: "normal",
                    }}
                  >
                    {t("brand.tagline")}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent={{ xs: "stretch", md: "flex-end" }}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={language}
                  onChange={(_, nextLanguage) => {
                    if (nextLanguage) {
                      setLanguage(nextLanguage);
                    }
                  }}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.9)",
                    borderRadius: 999,
                    alignSelf: { xs: "stretch", sm: "center" },
                    "& .MuiToggleButton-root": {
                      border: 0,
                      px: 1.4,
                      py: 0.6,
                      textTransform: "none",
                      fontWeight: 700,
                    },
                  }}
                >
                  <ToggleButton value="uk">UA</ToggleButton>
                  <ToggleButton value="pl">PL</ToggleButton>
                </ToggleButtonGroup>

                {user ? (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Chip
                      avatar={<Avatar src={user.avatar}>{user.name[0]}</Avatar>}
                      label={user.name}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.9)",
                        borderRadius: 999,
                        fontWeight: 700,
                        maxWidth: { xs: "100%", sm: 220 },
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleLogout}
                      sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 700,
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      {t("nav.logout")}
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      component={Link}
                      to="/login"
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      {t("nav.login")}
                    </Button>
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 999,
                        px: 2.4,
                        width: { xs: "100%", sm: "auto" },
                        background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                      }}
                    >
                      {t("nav.register")}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Stack>

            {user && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                sx={{ width: "100%" }}
              >
                <Button component={Link} to="/dashboard" color="inherit">
                  {t("nav.dashboard")}
                </Button>
                <Button component={Link} to="/meal-builder" color="inherit">
                  {t("nav.meals")}
                </Button>
                <Button component={Link} to="/profile" color="inherit">
                  {t("nav.profile")}
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;
