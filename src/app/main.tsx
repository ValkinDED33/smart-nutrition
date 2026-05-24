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

const container = document.getElementById("root")!;
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

bootstrap();
