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

const mobileTabs = [
  { value: "/home", label: "Home", icon: "🏠" },
  { value: "/meals", label: "Meals", icon: "🍽" },
  { value: "/ai", label: "AI", icon: "🤖" },
  { value: "/progress", label: "Progress", icon: "📊" },
  { value: "/profile", label: "Profile", icon: "👤" },
];

const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await logoutSession();
    clearSyncOutbox();
    dispatch(resetAppState());
    await persistor.flush();
    navigate("/");
  };

  const activeTab =
    mobileTabs.find((tab) => location.pathname.startsWith(tab.value))?.value ?? "/home";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(30,136,229,0.18), transparent 24%), radial-gradient(circle at top right, rgba(34,197,94,0.18), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eefaf4 100%)",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(248, 250, 252, 0.82)",
          color: "#14213d",
          borderBottom: "1px solid rgba(20, 33, 61, 0.08)",
        }}
      >
        <Container maxWidth="md">
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
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component={Link}
                  to={user ? "/home" : "/"}
                  sx={{
                    display: "inline-block",
                    textDecoration: "none",
                    color: "inherit",
                    fontWeight: 900,
                    fontSize: { xs: 18, sm: 20 },
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("brand.name")}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", color: "rgba(20,33,61,0.65)" }}>
                  {t("brand.tagline")}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
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
                  bgcolor: "rgba(255,255,255,0.9)",
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
                  <SyncStatusChip />
                  <Avatar src={user.avatar} sx={{ width: 36, height: 36 }}>
                    {user.name[0]}
                  </Avatar>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
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
        maxWidth="md"
        sx={{
          py: { xs: 2, md: 4 },
          pb: user ? { xs: 12, md: 14 } : { xs: 3, md: 5 },
        }}
      >
        <BackendOfflineBanner />
        <Outlet />
      </Container>

      {user && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 1200,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(20, 33, 61, 0.08)",
            backdropFilter: "blur(18px)",
            backgroundColor: "rgba(255,255,255,0.88)",
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

      {user && (
        <Button
          onClick={handleLogout}
          sx={{
            position: "fixed",
            top: 86,
            right: 16,
            zIndex: 1100,
            textTransform: "none",
            fontWeight: 800,
            color: "#0f766e",
          }}
        >
          {t("nav.logout")}
        </Button>
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
