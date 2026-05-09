import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./app/store";
import { LanguageProvider } from "./shared/language";
import { initializeClientPersistence } from "./shared/lib/clientPersistence";
import { registerServiceWorker } from "./shared/lib/registerServiceWorker";
import { AppThemeProvider } from "./shared/theme/AppThemeProvider";

const container = document.getElementById("root")!;
const root = createRoot(container);

await initializeClientPersistence();

root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <AppThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AppThemeProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);

registerServiceWorker();
