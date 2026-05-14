import { Workbox } from "workbox-window";

export const registerServiceWorker = () => {
  if (
    !import.meta.env.PROD ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener("load", () => {
    const workbox = new Workbox("/sw.js");

    workbox.register().catch(() => {
      // PWA install support is optional; the app must keep working without it.
    });
  });
};
