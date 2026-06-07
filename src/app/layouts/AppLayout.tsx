import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  BarChart3,
  Bot,
  Globe2,
  Moon,
  ShieldCheck,
  Sun,
  Utensils,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  resetAppState,
  type AppDispatch,
  type RootState,
} from "../../app/store";
import { logout as logoutSession } from "@shared/api/auth";
import { useLanguage } from "@shared/language";
import BackendOfflineBanner from "@shared/components/BackendOfflineBanner";
import SyncStatusChip from "@widgets/SyncStatusChip";
import SyncFeedbackAlert from "@widgets/SyncFeedbackAlert";
import HabitReminderAgent from "@widgets/HabitReminderAgent";
import { ContextAssistantWidget } from "@widgets/ContextAssistantWidget";
import { createAssistantScreenContext } from "@features/assistant/assistantScreen";
import { useAssistantChatStore } from "@features/assistant/model/store";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import ProfileLanguageAgent from "@widgets/ProfileLanguageAgent";
import { setProfileLanguage } from "@features/profile/model/store";
import { useAppColorMode } from "@shared/theme/colorMode";
import type { AppLanguage } from "@shared/types/i18n";
import { captureRuntimeEvent } from "@integration/runtime/analytics";

const mobileTabs = [
  { value: "/meals", labelKey: "navigation.food", icon: Utensils },
  { value: "/recipes", labelKey: "navigation.recipes", icon: BookOpen },
  { value: "/coach", labelKey: "navigation.coach", icon: Bot },
  { value: "/community", labelKey: "navigation.community", icon: UsersRound },
  { value: "/progress", labelKey: "navigation.progress", icon: BarChart3 },
  { value: "/profile", labelKey: "navigation.profile", icon: UserRound },
];

const desktopTabs = [
  { value: "/dashboard", labelKey: "navigation.dashboard" },
  { value: "/meals", labelKey: "navigation.food" },
  { value: "/recipes", labelKey: "navigation.recipes" },
  { value: "/coach", labelKey: "navigation.coach" },
  { value: "/community", labelKey: "navigation.community" },
  { value: "/progress", labelKey: "navigation.progress" },
  { value: "/profile", labelKey: "navigation.profile" },
];

const languageOptions: Array<{ value: AppLanguage; code: string }> = [
  { value: "pl", code: "🇵🇱" },
  { value: "uk", code: "🇺🇦" },
  { value: "en", code: "🇬🇧" },
];

const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();
  const { isDarkMode, mode, toggleMode } = useAppColorMode();
  const setAssistantCurrentScreen = useAssistantChatStore(
    (state) => state.setCurrentScreen,
  );

  useEffect(() => {
    setAssistantCurrentScreen(createAssistantScreenContext(location.pathname));
    captureRuntimeEvent("screen_viewed", {
      path: location.pathname,
      authenticated: Boolean(user),
    });
  }, [location.pathname, setAssistantCurrentScreen, user]);

  const handleLogout = async () => {
    await logoutSession();
    clearSyncOutbox();
    dispatch(resetAppState());
    navigate("/");
  };

  const activeTab =
    mobileTabs.find((tab) => location.pathname.startsWith(tab.value))?.value ??
    "/dashboard";
  const contentMaxWidth = user || location.pathname === "/" ? "xl" : "sm";
  const canAccessAdmin =
    user &&
    ["NUTRITIONIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  const visibleDesktopTabs = canAccessAdmin
    ? [...desktopTabs, { value: "/admin", labelKey: "navigation.admin" }]
    : desktopTabs;
  const visibleMobileTabs = canAccessAdmin
    ? [
        ...mobileTabs,
        { value: "/admin", labelKey: "navigation.admin", icon: ShieldCheck },
      ]
    : mobileTabs;
  const activeMobileTab =
    visibleMobileTabs.find((tab) => location.pathname.startsWith(tab.value))
      ?.value ?? activeTab;

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
          <Toolbar
            sx={{
              minHeight: 72,
              px: 0,
              gap: 1.5,
              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              minWidth={0}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
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
                  to={user ? "/dashboard" : "/"}
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
                aria-label={t("navigation.primaryAria")}
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                {visibleDesktopTabs.map((tab) => {
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
                      {t(tab.labelKey)}
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
              <Tooltip
                title={
                  mode === "dark"
                    ? t("navigation.themeLight")
                    : t("navigation.themeDark")
                }
              >
                <IconButton
                  onClick={toggleMode}
                  size="small"
                  aria-label={
                    mode === "dark"
                      ? t("navigation.switchToLight")
                      : t("navigation.switchToDark")
                  }
                  sx={{
                    width: 40,
                    height: 40,
                    color: isDarkMode ? "#e5eef7" : "#0f766e",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(148, 163, 184, 0.32)"
                      : "rgba(15, 118, 110, 0.24)",
                  }}
                >
                  {mode === "dark" ? (
                    <Sun size={18} aria-hidden="true" />
                  ) : (
                    <Moon size={18} aria-hidden="true" />
                  )}
                </IconButton>
              </Tooltip>

              <Stack
                direction="row"
                spacing={0.6}
                alignItems="center"
                sx={{
                  px: 0.6,
                  py: 0.4,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(148, 163, 184, 0.32)"
                    : "rgba(15, 118, 110, 0.18)",
                  bgcolor: isDarkMode
                    ? "rgba(15, 23, 42, 0.9)"
                    : "rgba(255,255,255,0.9)",
                }}
              >
                <Globe2 size={16} aria-hidden="true" />
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={appLanguage}
                  aria-label={t("navigation.languageAria")}
                  onChange={(_, nextLanguage) => {
                    if (
                      nextLanguage === "uk" ||
                      nextLanguage === "pl" ||
                      nextLanguage === "en"
                    ) {
                      setLanguage(nextLanguage);
                      dispatch(setProfileLanguage(nextLanguage));
                      captureRuntimeEvent("language_changed", {
                        language: nextLanguage,
                      });
                    }
                  }}
                  sx={{
                    gap: 0.25,
                    "& .MuiToggleButtonGroup-grouped": {
                      width: 34,
                      height: 30,
                      border: 0,
                      borderRadius: "999px !important",
                      m: 0,
                      px: 0,
                      color: isDarkMode ? "#cbd5e1" : "#334155",
                      fontWeight: 900,
                      fontSize: 12,
                      "&.Mui-selected": {
                        color: "#ffffff",
                        bgcolor: "#0f766e",
                        "&:hover": { bgcolor: "#115e59" },
                      },
                    },
                  }}
                >
                  {languageOptions.map((option) => (
                    <ToggleButton
                      key={option.value}
                      value={option.value}
                      aria-label={languageLabels[option.value]}
                    >
                      {option.code}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

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
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ display: { xs: "none", sm: "flex" } }}
                >
                  <Button
                    component={Link}
                    to="/login"
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
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
                      background:
                        "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
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
        component="main"
        maxWidth={contentMaxWidth}
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, md: location.pathname === "/" ? 3 : 4 },
          pb: user ? { xs: 16, md: 5 } : { xs: 3, md: 5 },
        }}
      >
        <BackendOfflineBanner />
        <SyncFeedbackAlert />
        <Outlet />
      </Container>

      {user && (
        <Paper
          component="nav"
          aria-label={t("navigation.mobileAria")}
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
            aria-label={t("navigation.mobilePrimaryAria")}
            showLabels
            value={activeMobileTab}
            onChange={(_, nextValue) => {
              if (typeof nextValue === "string") {
                captureRuntimeEvent("mobile_navigation_selected", {
                  path: nextValue,
                });
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
            {visibleMobileTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <BottomNavigationAction
                  key={tab.value}
                  value={tab.value}
                  label={t(tab.labelKey)}
                  icon={<Icon size={21} strokeWidth={2.2} aria-hidden="true" />}
                  sx={{
                    px: 0.4,
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: 11,
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              );
            })}
          </BottomNavigation>
        </Paper>
      )}

      <ProfileLanguageAgent />
      <HabitReminderAgent />
      <ContextAssistantWidget />
    </Box>
  );
};

export default Layout;
