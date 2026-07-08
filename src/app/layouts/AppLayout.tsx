import { lazy, Suspense, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, Moon, Sun } from "lucide-react";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  ButtonBase,
  Container,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
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
import PwaUpdateBanner from "@shared/components/PwaUpdateBanner";
import SyncStatusChip from "@widgets/SyncStatusChip";
import SyncFeedbackAlert from "@widgets/SyncFeedbackAlert";
import HabitReminderAgent from "@widgets/HabitReminderAgent";
import { LanguageMenuButton } from "@shared/components/LanguageMenuButton";
import { createAssistantScreenContext } from "@features/assistant/assistantScreen";
import {
  resolveAssistantContext,
  serializeAssistantDuties,
} from "@features/assistant/assistantContext";
import { clearSyncOutbox } from "@shared/lib/syncOutbox";
import ProfileLanguageAgent from "@widgets/ProfileLanguageAgent";
import { setProfileLanguage } from "@features/profile/model/store";
import { useProfileCloudAction } from "@features/profile/useProfileCloudAction";
import { useAppColorMode } from "@shared/theme/colorMode";
import type { AppLanguage } from "@shared/types/i18n";
import { trackRuntimeEvent } from "@integration/runtime/analyticsEvent";
import {
  desktopNavigationItems,
  getVisibleNavigationItems,
  mobileNavigationItems,
} from "@app/navigation/appNavigation";

const GlobalAssistantLayer = lazy(() => import("@widgets/GlobalAssistantLayer"));

const LANDING_AI_HREF = "/#ai-overview";
const LANDING_NUTRITION_HREF = "/#nutrition";
const LANDING_REMINDERS_HREF = "/#reminders";
const LANDING_COMMUNITY_HREF = "/#community";
const LANDING_FEATURES_HREF = "/#features";
const LANDING_ABOUT_HREF = "/#about";
const NAV_BACKDROP_FILTER = "blur(18px)";
const NAV_SURFACE_BACKGROUND = "var(--sn-nav-surface)";
const NAV_SOFT_BORDER = "1px solid var(--sn-border-soft)";
const BRAND_GRADIENT = "var(--sn-brand-gradient)";

const getLandingNavigationItems = (
  language: AppLanguage,
): Array<{ label: string; href: string }> => {
  if (language === "pl") {
    return [
      { label: "AI companion", href: LANDING_AI_HREF },
      { label: "Odżywianie", href: LANDING_NUTRITION_HREF },
      { label: "Przypomnienia", href: LANDING_REMINDERS_HREF },
      { label: "Community", href: LANDING_COMMUNITY_HREF },
      { label: "Funkcje", href: LANDING_FEATURES_HREF },
      { label: "O produkcie", href: LANDING_ABOUT_HREF },
    ];
  }

  if (language === "en") {
    return [
      { label: "AI Companion", href: LANDING_AI_HREF },
      { label: "Nutrition", href: LANDING_NUTRITION_HREF },
      { label: "Reminders", href: LANDING_REMINDERS_HREF },
      { label: "Community", href: LANDING_COMMUNITY_HREF },
      { label: "Features", href: LANDING_FEATURES_HREF },
      { label: "About", href: LANDING_ABOUT_HREF },
    ];
  }

  return [
    { label: "AI companion", href: LANDING_AI_HREF },
    { label: "Харчування", href: LANDING_NUTRITION_HREF },
    { label: "Нагадування", href: LANDING_REMINDERS_HREF },
    { label: "Community", href: LANDING_COMMUNITY_HREF },
    { label: "Можливості", href: LANDING_FEATURES_HREF },
    { label: "Про продукт", href: LANDING_ABOUT_HREF },
  ];
};

const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { appLanguage, languageLabels, setLanguage, t } = useLanguage();
  const { isDarkMode, mode, toggleMode } = useAppColorMode();
  const logoutLabel = t("nav.logout");
  const languageProfileAction = useProfileCloudAction();

  useEffect(() => {
    const assistantContext = resolveAssistantContext(location.pathname);
    const screenContext = createAssistantScreenContext(location.pathname);
    let cancelled = false;

    void import("@features/assistant/model/store")
      .then(({ useAssistantChatStore }) => {
        if (!cancelled) {
          useAssistantChatStore.getState().setCurrentScreen(screenContext);
        }
      })
      .catch((error: unknown) => {
        console.warn(
          "[assistant] screen context sync failed",
          error instanceof Error ? error.message : "unknown error"
        );
      });

    trackRuntimeEvent("screen_viewed", {
      path: location.pathname,
      authenticated: Boolean(user),
      assistantArea: assistantContext.area,
      assistantDuties: serializeAssistantDuties(assistantContext.duties),
      assistantScreenName: assistantContext.screenName,
      assistantTone: assistantContext.tone,
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, user]);

  const handleLogout = async () => {
    await logoutSession();
    clearSyncOutbox();
    dispatch(resetAppState());
    navigate("/");
  };

  const handleLanguageSelect = (nextLanguage: AppLanguage) => {
    if (nextLanguage === appLanguage || languageProfileAction.saving) {
      return;
    }

    if (!user) {
      setLanguage(nextLanguage);
      trackRuntimeEvent("language_changed", {
        language: nextLanguage,
        persisted: false,
      });
      return;
    }

    void languageProfileAction
      .runProfileAction(setProfileLanguage(nextLanguage))
      .then((nextProfile) => {
        if (!nextProfile) {
          return;
        }

        setLanguage(nextProfile.languagePreference);
        trackRuntimeEvent("language_changed", {
          language: nextProfile.languagePreference,
          persisted: true,
        });
      })
      .catch((error: unknown) => {
        console.warn(
          "[profile] language cloud sync failed",
          error instanceof Error ? error.message : "unknown error"
        );
      });
  };

  const handleBrandClick = () => {
    const homePath = user ? "/dashboard" : "/";

    trackRuntimeEvent("brand_home_clicked", {
      targetPath: homePath,
      currentPath: location.pathname,
      authenticated: Boolean(user),
    });

    if (location.pathname === homePath) {
      window.location.reload();
      return;
    }

    navigate(homePath);
  };

  const isLandingRoute = location.pathname === "/";
  const contentMaxWidth = isLandingRoute ? false : user ? "xl" : "sm";
  const landingTabs = getLandingNavigationItems(appLanguage);
  const visibleDesktopTabs = getVisibleNavigationItems(
    desktopNavigationItems,
    user?.role
  );
  const visibleMobileTabs = getVisibleNavigationItems(
    mobileNavigationItems,
    user?.role
  );
  const activeMobileTab =
    visibleMobileTabs.find((tab) => location.pathname.startsWith(tab.value))
      ?.value ?? "/dashboard";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: "var(--sn-page-gradient)",
      }}
    >
      <AppBar
        position={isLandingRoute && !user ? "absolute" : "sticky"}
        elevation={0}
        sx={{
          backdropFilter: NAV_BACKDROP_FILTER,
          backgroundColor:
            isLandingRoute && !user ? "transparent" : NAV_SURFACE_BACKGROUND,
          color:
            isLandingRoute && !user && isDarkMode
              ? "#ffffff"
              : "var(--sn-text-primary)",
          borderBottom:
            isLandingRoute && !user
              ? "1px solid transparent"
              : NAV_SOFT_BORDER,
          boxShadow: isLandingRoute && !user ? "none" : "var(--sn-shadow-soft)",
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
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
            <ButtonBase
              aria-label={t("navigation.brandHome")}
              onClick={handleBrandClick}
              sx={{
                borderRadius: 2,
                minWidth: 0,
                textAlign: "left",
                "&:focus-visible": {
                  outline: "3px solid rgba(20,184,166,0.28)",
                  outlineOffset: 3,
                },
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
                    background: BRAND_GRADIENT,
                    display: "grid",
                    placeItems: "center",
                    color: "#ffffff",
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  SN
                </Box>
                <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
                  <Typography
                    component="span"
                    sx={{
                      display: "inline-block",
                      color: "inherit",
                      fontWeight: 900,
                      fontSize: { xs: 18, sm: 20 },
                      letterSpacing: 0,
                    }}
                  >
                    {t("brand.name")}
                  </Typography>
                  <Typography
                    component="span"
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
            </ButtonBase>

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
                          ? "var(--sn-on-primary)"
                          : "var(--sn-text-secondary)",
                        bgcolor: selected
                          ? "var(--sn-primary)"
                          : "transparent",
                        "&:hover": {
                          bgcolor: selected
                            ? "var(--sn-primary-strong)"
                            : "var(--sn-accent-soft)",
                        },
                      }}
                    >
                      {t(tab.labelKey)}
                    </Button>
                  );
                })}
              </Stack>
            )}

            {!user && isLandingRoute ? (
              <Stack
                component="nav"
                aria-label="Product sections"
                direction="row"
                spacing={0.4}
                alignItems="center"
                sx={{
                  display: { xs: "none", lg: "flex" },
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  px: 1,
                  py: 0.6,
                  borderRadius: 999,
                  border: NAV_SOFT_BORDER,
                  backgroundColor: isDarkMode
                    ? "rgba(2, 6, 23, 0.32)"
                    : "rgba(255,255,255,0.36)",
                  backdropFilter: NAV_BACKDROP_FILTER,
                }}
              >
                {landingTabs.map((tab) => (
                  <Button
                    key={tab.href}
                    component={Link}
                    to={tab.href}
                    size="small"
                    sx={{
                      px: 1.2,
                      minHeight: 34,
                      color: isDarkMode ? "#e5eef7" : "#334155",
                      fontWeight: 850,
                      "&:hover": {
                        color: isDarkMode ? "#d9f99d" : "#0f766e",
                        bgcolor: isDarkMode
                          ? "rgba(94, 234, 212, 0.1)"
                          : "rgba(15, 118, 110, 0.08)",
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Stack>
            ) : null}

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

              <LanguageMenuButton
                id="language-menu-button"
                value={appLanguage}
                labels={languageLabels}
                ariaLabel={t("navigation.languageAria")}
                onChange={handleLanguageSelect}
                disabled={languageProfileAction.saving}
              />

              {user ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ display: { xs: "none", lg: "block" } }}>
                    <SyncStatusChip />
                  </Box>
                  <Tooltip title={t("navigation.accountSettings")}>
                    <IconButton
                      component={Link}
                      to="/profile#security"
                      aria-label={t("navigation.accountSettings")}
                      size="small"
                      sx={{
                        p: 0.25,
                        "&:focus-visible": {
                          outline: "3px solid rgba(20,184,166,0.28)",
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Avatar src={user.avatar} sx={{ width: 36, height: 36 }}>
                        {user.name[0]}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={logoutLabel}>
                    <IconButton
                      aria-label={logoutLabel}
                      onClick={handleLogout}
                      size="small"
                      sx={{
                        display: { xs: "inline-flex", sm: "none" },
                        width: 38,
                        height: 38,
                        color: isDarkMode ? "#5eead4" : "#0f766e",
                        border: isDarkMode
                          ? "1px solid rgba(94, 234, 212, 0.28)"
                          : "1px solid rgba(15, 118, 110, 0.24)",
                      }}
                    >
                      <LogOut size={18} />
                    </IconButton>
                  </Tooltip>
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
                    {logoutLabel}
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
                      background: BRAND_GRADIENT,
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
        disableGutters={isLandingRoute}
        sx={{
          px: isLandingRoute ? 0 : { xs: 2, sm: 3 },
          py: isLandingRoute ? 0 : { xs: 2, md: 4 },
          pb: user
            ? { xs: 16, md: 5 }
            : isLandingRoute
              ? 0
              : { xs: 3, md: 5 },
        }}
      >
        <PwaUpdateBanner />
        <BackendOfflineBanner />
        <SyncFeedbackAlert />
        <Box
          key={location.pathname}
          className="sn-page-transition"
          sx={{ minWidth: 0 }}
        >
          <Outlet />
        </Box>
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
            border: NAV_SOFT_BORDER,
            backdropFilter: NAV_BACKDROP_FILTER,
            backgroundColor: NAV_SURFACE_BACKGROUND,
            boxShadow: "var(--sn-shadow-strong)",
            ...(isDarkMode && {
              backgroundColor: NAV_SURFACE_BACKGROUND,
              borderColor: "var(--sn-border-soft)",
            }),
          }}
        >
          <BottomNavigation
            aria-label={t("navigation.mobilePrimaryAria")}
            showLabels
            value={activeMobileTab}
            onChange={(_, nextValue) => {
              if (typeof nextValue === "string") {
                trackRuntimeEvent("mobile_navigation_selected", {
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
                color: "var(--sn-primary)",
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
                  icon={
                    Icon ? (
                      <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
                    ) : null
                  }
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
      <Suspense fallback={null}>
        <GlobalAssistantLayer />
      </Suspense>
    </Box>
  );
};

export default Layout;
