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

const buildTheme = (mode: AppColorMode) =>
  createTheme({
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
        default: mode === "dark" ? "#020617" : "#f5f7fb",
        paper: mode === "dark" ? "#0f172a" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#e5eef7" : "#14213d",
        secondary: mode === "dark" ? "#a7b5c8" : "#64748b",
      },
      divider:
        mode === "dark"
          ? "rgba(148, 163, 184, 0.2)"
          : "rgba(15, 23, 42, 0.08)",
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

const darkModeGlobalStyles = (
  <GlobalStyles
    styles={{
      "body[data-sn-color-mode='dark']": {
        backgroundColor: "#020617",
        color: "#e5eef7",
        colorScheme: "dark",
      },
      "body[data-sn-color-mode='dark'] .MuiPaper-root, body[data-sn-color-mode='dark'] .MuiCard-root":
        {
          backgroundColor: "rgba(15, 23, 42, 0.88) !important",
          borderColor: "rgba(148, 163, 184, 0.2) !important",
          color: "#e5eef7",
        },
      "body[data-sn-color-mode='dark'] .MuiTypography-colorTextSecondary": {
        color: "#a7b5c8 !important",
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

  useEffect(() => {
    document.body.dataset.snColorMode = mode;
  }, [mode]);

  return (
    <AppColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {darkModeGlobalStyles}
        {children}
      </ThemeProvider>
    </AppColorModeContext.Provider>
  );
};
