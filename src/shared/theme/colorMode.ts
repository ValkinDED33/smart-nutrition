import { createContext, useContext } from "react";

export type AppColorMode = "light" | "dark";

export interface AppColorModeContextValue {
  mode: AppColorMode;
  isDarkMode: boolean;
  setMode: (mode: AppColorMode) => void;
  toggleMode: () => void;
}

export const AppColorModeContext =
  createContext<AppColorModeContextValue | null>(null);

export const useAppColorMode = () => {
  const context = useContext(AppColorModeContext);

  if (!context) {
    throw new Error("useAppColorMode must be used within AppThemeProvider");
  }

  return context;
};
