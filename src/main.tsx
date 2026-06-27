import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { LanguageProvider } from "./shared/language";
import { initializeClientPersistence } from "./shared/lib/clientPersistence";
import { registerServiceWorker } from "./shared/lib/registerServiceWorker";
import { AppThemeProvider } from "./shared/theme/AppThemeProvider";
import { SmoothScrollAgent } from "./shared/components/SmoothScrollAgent";
import { queryClient } from "./shared/query/client";

const container = document.getElementById("root")!;
const root = createRoot(container);

await initializeClientPersistence();

const initializeRuntimeIntegrationsAfterPaint = () => {
  const start = () => {
    void import("./integration/runtime/native")
      .then(({ initializeRuntimeIntegrations }) =>
        initializeRuntimeIntegrations()
      )
      .catch((error: unknown) => {
        console.warn(
          "[runtime] optional integrations failed to initialize",
          error instanceof Error ? error.message : "unknown error"
        );
      });
  };

  const idleWindow = window as Window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  };

  if (typeof idleWindow.requestIdleCallback === "function") {
    idleWindow.requestIdleCallback(start, { timeout: 2_500 });
    return;
  }

  window.setTimeout(start, 0);
};

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <HelmetProvider>
          <AppThemeProvider>
            <LanguageProvider>
              <SmoothScrollAgent />
              <App />
              <SonnerToaster richColors closeButton position="top-right" />
              <HotToaster position="bottom-center" />
            </LanguageProvider>
          </AppThemeProvider>
        </HelmetProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);

initializeRuntimeIntegrationsAfterPaint();
registerServiceWorker();
