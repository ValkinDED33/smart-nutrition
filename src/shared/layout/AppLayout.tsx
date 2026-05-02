import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { persistor, resetAppState, type AppDispatch, type RootState } from "../../app/store";
import { logout as logoutSession } from "../api/auth";
import { useLanguage } from "../language";
import BackendOfflineBanner from "../components/BackendOfflineBanner";
import SyncStatusChip from "../components/SyncStatusChip";
import SyncOutboxAgent from "../components/SyncOutboxAgent";
import SyncFeedbackSnackbar from "../components/SyncFeedbackSnackbar";
import HabitReminderAgent from "../components/HabitReminderAgent";
import { ContextAssistantWidget } from "../components/ContextAssistantWidget";
import LocalRealtimeSyncAgent from "../components/LocalRealtimeSyncAgent";
import RemoteStatePullAgent from "../components/RemoteStatePullAgent";
import { clearSyncOutbox } from "../lib/syncOutbox";
import ProfileLanguageAgent from "../components/ProfileLanguageAgent";
import { setProfileLanguage } from "../../features/profile/profileSlice";
import { useAppColorMode } from "../theme/colorMode";

const mobileTabs = [
  { value: "/home", label: "Home", icon: "🏠" },
  { value: "/meals", label: "Meals", icon: "🍽" },
  { value: "/ai", label: "AI", icon: "🤖" },
  { value: "/progress", label: "Progress", icon: "📊" },
  { value: "/profile", label: "Profile", icon: "👤" },
];

const desktopTabs = [
  { value: "/home", label: "Dashboard" },
  { value: "/meals", label: "Food" },
  { value: "/progress", label: "Progress" },
  { value: "/ai", label: "AI Coach" },
  { value: "/profile", label: "Profile" },
];

const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, mode, toggleMode } = useAppColorMode();

  const handleLogout = async () => {
    await logoutSession();
    clearSyncOutbox();
    dispatch(resetAppState());
    await persistor.flush();
    navigate("/");
  };

  const activeTab =
    mobileTabs.find((tab) => location.pathname.startsWith(tab.value))?.value ?? "/home";
  const contentMaxWidth = user || location.pathname === "/" ? "xl" : "sm";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDarkMode
          ? "radial-gradient(circle at top left, rgba(20,184,166,0.14), transparent 24%), radial-gradient(circle at top right, rgba(132,204,22,0.1), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 100%)"
          : "radial-gradient(circle at top left, rgba(30,136,229,0.18), transparent 24%), radial-gradient(circle at top right, rgba(34,197,94,0.18), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eefaf4 100%)",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(18px)",
          backgroundColor: isDarkMode
            ? "rgba(2, 6, 23, 0.82)"
            : "rgba(248, 250, 252, 0.82)",
          color: isDarkMode ? "#e5eef7" : "#14213d",
          borderBottom: isDarkMode
            ? "1px solid rgba(148, 163, 184, 0.16)"
            : "1px solid rgba(20, 33, 61, 0.08)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ minHeight: 72, px: 0, gap: 1.5, justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                SN
              </Box>
              <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
                <Typography
                  component={Link}
                  to={user ? "/home" : "/"}
                  sx={{
                    display: "inline-block",
                    textDecoration: "none",
                    color: "inherit",
                    fontWeight: 900,
                    fontSize: { xs: 18, sm: 20 },
                    letterSpacing: 0,
                  }}
                >
                  {t("brand.name")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: isDarkMode
                      ? "rgba(226,232,240,0.68)"
                      : "rgba(20,33,61,0.65)",
                  }}
                >
                  {t("brand.tagline")}
                </Typography>
              </Box>
            </Stack>

            {user && (
              <Stack
                component="nav"
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                {desktopTabs.map((tab) => {
                  const selected = location.pathname.startsWith(tab.value);

                  return (
                    <Button
                      key={tab.value}
                      component={Link}
                      to={tab.value}
                      variant={selected ? "contained" : "text"}
                      size="small"
                      sx={{
                        px: 1.6,
                        color: selected
                          ? "#ffffff"
                          : isDarkMode
                            ? "#cbd5e1"
                            : "#334155",
                        bgcolor: selected ? "#0f766e" : "transparent",
                        "&:hover": {
                          bgcolor: selected
                            ? "#115e59"
                            : isDarkMode
                              ? "rgba(148, 163, 184, 0.12)"
                              : "rgba(15, 118, 110, 0.08)",
                        },
                      }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Stack>
            )}

            <Stack
              direction="row"
              spacing={{ xs: 0.5, sm: 1 }}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
                <Button
                  onClick={toggleMode}
                  variant="outlined"
                  size="small"
                  aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  sx={{
                    minWidth: { xs: 40, sm: 48 },
                    px: { xs: 1, sm: 1.2 },
                    color: isDarkMode ? "#e5eef7" : "#0f766e",
                    borderColor: isDarkMode
                      ? "rgba(148, 163, 184, 0.32)"
                      : "rgba(15, 118, 110, 0.24)",
                  }}
                >
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    {mode === "dark" ? "Light" : "Dark"}
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    {mode === "dark" ? "☀" : "☾"}
                  </Box>
                </Button>
              </Tooltip>

              <ToggleButtonGroup
                exclusive
                size="small"
                value={language}
                onChange={(_, nextLanguage) => {
                  if (nextLanguage) {
                    setLanguage(nextLanguage);
                    dispatch(setProfileLanguage(nextLanguage));
                  }
                }}
                sx={{
                  bgcolor: isDarkMode
                    ? "rgba(15, 23, 42, 0.9)"
                    : "rgba(255,255,255,0.9)",
                  borderRadius: 999,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    px: 1.2,
                    py: 0.4,
                    textTransform: "none",
                    fontWeight: 700,
                  },
                }}
              >
                <ToggleButton value="uk">UA</ToggleButton>
                <ToggleButton value="pl">PL</ToggleButton>
              </ToggleButtonGroup>

              {user ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ display: { xs: "none", lg: "block" } }}>
                    <SyncStatusChip />
                  </Box>
                  <Avatar src={user.avatar} sx={{ width: 36, height: 36 }}>
                    {user.name[0]}
                  </Avatar>
                  <Button
                    onClick={handleLogout}
                    size="small"
                    variant="outlined"
                    sx={{
                      display: { xs: "none", sm: "inline-flex" },
                      color: isDarkMode ? "#5eead4" : "#0f766e",
                      borderColor: isDarkMode
                        ? "rgba(94, 234, 212, 0.28)"
                        : "rgba(15, 118, 110, 0.24)",
                    }}
                  >
                    {t("nav.logout")}
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
                  <Button component={Link} to="/login" sx={{ textTransform: "none", fontWeight: 800 }}>
                    {t("nav.login")}
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                    }}
                  >
                    {t("nav.register")}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth={contentMaxWidth}
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, md: location.pathname === "/" ? 3 : 4 },
          pb: user ? { xs: 16, md: 5 } : { xs: 3, md: 5 },
        }}
      >
        <BackendOfflineBanner />
        <Outlet />
      </Container>

      {user && (
        <Paper
          elevation={0}
          sx={{
            display: { xs: "block", md: "none" },
            position: "fixed",
            left: 12,
            right: 12,
            bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
            zIndex: 1200,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(20, 33, 61, 0.08)",
            backdropFilter: "blur(18px)",
            backgroundColor: "rgba(255,255,255,0.88)",
            ...(isDarkMode && {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderColor: "rgba(148, 163, 184, 0.18)",
            }),
          }}
        >
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(_, nextValue) => {
              if (typeof nextValue === "string") {
                navigate(nextValue);
              }
            }}
            sx={{
              height: 74,
              bgcolor: "transparent",
              "& .MuiBottomNavigationAction-root": {
                minWidth: 0,
              },
              "& .Mui-selected": {
                color: "#0f766e",
              },
            }}
          >
            {mobileTabs.map((tab) => (
              <BottomNavigationAction
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<span>{tab.icon}</span>}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      <SyncFeedbackSnackbar />
      <SyncOutboxAgent />
      <ProfileLanguageAgent />
      <LocalRealtimeSyncAgent />
      <RemoteStatePullAgent />
      <HabitReminderAgent />
      <ContextAssistantWidget />
    </Box>
  );
};

export default Layout;
