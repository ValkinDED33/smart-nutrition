import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "../App";

import { Provider } from "react-redux";
import { store } from "./store";

import { LanguageProvider } from "../shared/language";
import { initializeClientPersistence } from "../shared/lib/clientPersistence";
import { registerServiceWorker } from "../shared/lib/registerServiceWorker";
import { AppThemeProvider } from "../shared/theme/AppThemeProvider";
import {
  installGlobalClientErrorReporting,
  renderBootstrapFailureFallback,
  reportClientRuntimeError,
} from "./runtime/clientErrorReporting";

installGlobalClientErrorReporting();

const container = document.getElementById("root");

if (!container) {
  const fallbackContainer = document.createElement("div");
  document.body.appendChild(fallbackContainer);
  const diagnostic = reportClientRuntimeError(
    new Error("Smart Nutrition root container was not found."),
    { source: "bootstrap" }
  );
  renderBootstrapFailureFallback(fallbackContainer, diagnostic);
} else {
  const root = createRoot(container);

  const bootstrap = async () => {
    await initializeClientPersistence();

    root.render(
      <StrictMode>
        <Provider store={store}>
          <AppThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </AppThemeProvider>
        </Provider>
      </StrictMode>
    );

    registerServiceWorker();
  };

  bootstrap().catch((error: unknown) => {
    const diagnostic = reportClientRuntimeError(error, { source: "bootstrap" });
    renderBootstrapFailureFallback(container, diagnostic);
  });
}
