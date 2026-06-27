import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  getClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";
import {
  AppColorModeContext,
  type AppColorMode,
  type AppColorModeContextValue,
} from "./colorMode";

const STORAGE_KEY = "smart-nutrition.color-mode";

const visualTokens = {
  light: {
    pageGradient:
      "radial-gradient(circle at 8% 0%, rgba(34,197,94,0.18), transparent 30%), radial-gradient(circle at 92% 8%, rgba(20,184,166,0.16), transparent 34%), linear-gradient(180deg, #f8fbff 0%, #edfdf7 58%, #f7fbff 100%)",
    backgroundDefault: "#f8fbff",
    backgroundPaper: "rgba(255,255,255,0.84)",
    surfaceGlass: "rgba(255,255,255,0.78)",
    surfaceElevated: "rgba(255,255,255,0.92)",
    surfaceSoft: "rgba(240,253,250,0.74)",
    navSurface: "rgba(248, 250, 252, 0.78)",
    border: "rgba(15, 23, 42, 0.08)",
    borderStrong: "rgba(15,118,110,0.22)",
    shadow: "0 22px 80px rgba(15, 23, 42, 0.09)",
    shadowStrong: "0 28px 110px rgba(15, 118, 110, 0.18)",
    textPrimary: "#14213d",
    textSecondary: "#64748b",
    accent: "#0f766e",
    accentSoft: "rgba(20,184,166,0.14)",
    glow: "0 0 42px rgba(132,204,22,0.22)",
    heroGradient:
      "radial-gradient(circle at 70% 34%, rgba(132,204,22,0.28), transparent 24%), radial-gradient(circle at 86% 4%, rgba(45,212,191,0.22), transparent 24%), linear-gradient(135deg, #07111f 0%, #0f172a 46%, #0f766e 100%)",
  },
  dark: {
    pageGradient:
      "radial-gradient(circle at 8% 0%, rgba(20,184,166,0.16), transparent 28%), radial-gradient(circle at 94% 10%, rgba(132,204,22,0.12), transparent 34%), linear-gradient(180deg, #020617 0%, #08111f 58%, #0a1220 100%)",
    backgroundDefault: "#020617",
    backgroundPaper: "rgba(10, 18, 35, 0.8)",
    surfaceGlass: "rgba(10, 18, 35, 0.72)",
    surfaceElevated: "rgba(15, 23, 42, 0.9)",
    surfaceSoft: "rgba(20,184,166,0.1)",
    navSurface: "rgba(2, 6, 23, 0.78)",
    border: "rgba(148, 163, 184, 0.18)",
    borderStrong: "rgba(94,234,212,0.28)",
    shadow: "0 24px 90px rgba(0, 0, 0, 0.28)",
    shadowStrong: "0 28px 120px rgba(20, 184, 166, 0.16)",
    textPrimary: "#e5eef7",
    textSecondary: "#a7b5c8",
    accent: "#5eead4",
    accentSoft: "rgba(94,234,212,0.12)",
    glow: "0 0 48px rgba(132,204,22,0.18)",
    heroGradient:
      "radial-gradient(circle at 72% 32%, rgba(132,204,22,0.24), transparent 24%), radial-gradient(circle at 88% 4%, rgba(45,212,191,0.18), transparent 24%), linear-gradient(135deg, #020617 0%, #07111f 48%, #0f2f2c 100%)",
  },
} as const;

const getInitialMode = (): AppColorMode => {
  const storedMode = getClientStorageItem(STORAGE_KEY);

  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

const buildTheme = (mode: AppColorMode) => {
  const tokens = visualTokens[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#0f766e",
        light: "#14b8a6",
        dark: "#115e59",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#65a30d",
        light: "#84cc16",
        dark: "#4d7c0f",
        contrastText: "#ffffff",
      },
      background: {
        default: tokens.backgroundDefault,
        paper: tokens.backgroundPaper,
      },
      text: {
        primary: tokens.textPrimary,
        secondary: tokens.textSecondary,
      },
      divider: tokens.border,
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily:
        '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      h1: { fontWeight: 900, letterSpacing: 0 },
      h2: { fontWeight: 900, letterSpacing: 0 },
      h3: { fontWeight: 900, letterSpacing: 0 },
      h4: { fontWeight: 900, letterSpacing: 0 },
      h5: { fontWeight: 850, letterSpacing: 0 },
      h6: { fontWeight: 800, letterSpacing: 0 },
      button: {
        textTransform: "none",
        fontWeight: 800,
        letterSpacing: 0,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            minHeight: 40,
          },
          containedPrimary: {
            background:
              "linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #65a30d 100%)",
            boxShadow: tokens.glow,
            "&:hover": {
              background:
                "linear-gradient(135deg, #115e59 0%, #0f766e 48%, #4d7c0f 100%)",
              boxShadow: tokens.shadowStrong,
            },
          },
          outlinedPrimary: {
            borderColor: tokens.borderStrong,
            backgroundColor: tokens.surfaceGlass,
            backdropFilter: "blur(16px)",
            "&:hover": {
              borderColor: tokens.accent,
              backgroundColor: tokens.accentSoft,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "none",
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 999,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderColor: theme.palette.divider,
            backdropFilter: "blur(18px)",
          }),
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 800,
          },
        },
      },
    },
  });
};

const buildGlobalStyles = (mode: AppColorMode) => {
  const tokens = visualTokens[mode];

  return (
    <GlobalStyles
      styles={{
        ":root": {
          "--sn-page-gradient": tokens.pageGradient,
          "--sn-hero-gradient": tokens.heroGradient,
          "--sn-bg-app": tokens.backgroundDefault,
          "--sn-surface-glass": tokens.surfaceGlass,
          "--sn-surface-elevated": tokens.surfaceElevated,
          "--sn-surface-soft": tokens.surfaceSoft,
          "--sn-nav-surface": tokens.navSurface,
          "--sn-border-soft": tokens.border,
          "--sn-border-strong": tokens.borderStrong,
          "--sn-shadow-soft": tokens.shadow,
          "--sn-shadow-strong": tokens.shadowStrong,
          "--sn-text-primary": tokens.textPrimary,
          "--sn-text-secondary": tokens.textSecondary,
          "--sn-accent": tokens.accent,
          "--sn-accent-soft": tokens.accentSoft,
          "--sn-glow": tokens.glow,
        },
        body: {
          background: "var(--sn-page-gradient)",
          color: "var(--sn-text-primary)",
        },
        "::selection": {
          backgroundColor:
            mode === "dark"
              ? "rgba(94,234,212,0.28)"
              : "rgba(20,184,166,0.24)",
        },
        ".MuiPaper-root, .MuiCard-root": {
          borderColor: "var(--sn-border-soft)",
          boxShadow: "var(--sn-shadow-soft)",
        },
        "body[data-sn-color-mode='light'] .MuiPaper-root, body[data-sn-color-mode='light'] .MuiCard-root":
          {
            backgroundColor: "var(--sn-surface-glass)",
          },
        "body[data-sn-color-mode='dark']": {
          background: "var(--sn-page-gradient)",
          color: "var(--sn-text-primary)",
          colorScheme: "dark",
        },
        "body[data-sn-color-mode='dark'] .MuiPaper-root, body[data-sn-color-mode='dark'] .MuiCard-root":
          {
            backgroundColor: "var(--sn-surface-glass) !important",
            borderColor: "var(--sn-border-soft) !important",
            color: "var(--sn-text-primary)",
          },
        "body[data-sn-color-mode='dark'] .MuiTypography-colorTextSecondary": {
          color: "var(--sn-text-secondary) !important",
        },
        "body[data-sn-color-mode='dark'] .MuiOutlinedInput-root": {
          backgroundColor: "rgba(2, 6, 23, 0.46)",
        },
        "body[data-sn-color-mode='dark'] .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(148, 163, 184, 0.28)",
        },
        "body[data-sn-color-mode='dark'] .MuiBottomNavigation-root": {
          color: "#e5eef7",
        },
        "body[data-sn-color-mode='dark'] .MuiBottomNavigationAction-root": {
          color: "#a7b5c8",
        },
        "body[data-sn-color-mode='dark'] .MuiBottomNavigationAction-root.Mui-selected":
          {
            color: "#5eead4",
          },
      }}
    />
  );
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppColorMode>(getInitialMode);

  const colorMode = useMemo<AppColorModeContextValue>(
    () => ({
      mode,
      isDarkMode: mode === "dark",
      setMode: (nextMode) => {
        setModeState(nextMode);
        setClientStorageItem(STORAGE_KEY, nextMode);
      },
      toggleMode: () => {
        const nextMode = mode === "dark" ? "light" : "dark";
        setModeState(nextMode);
        setClientStorageItem(STORAGE_KEY, nextMode);
      },
    }),
    [mode]
  );
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const globalStyles = useMemo(() => buildGlobalStyles(mode), [mode]);

  useEffect(() => {
    document.body.dataset.snColorMode = mode;
  }, [mode]);

  return (
    <AppColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {globalStyles}
        {children}
      </ThemeProvider>
    </AppColorModeContext.Provider>
  );
};
