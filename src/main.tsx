import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./app/store";
import { I18nProvider } from "./shared/i18n/I18nProvider";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
