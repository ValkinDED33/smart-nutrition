import { Workbox } from "workbox-window";

export const PWA_UPDATE_READY_EVENT = "smart-nutrition:pwa-update-ready";

export interface PwaUpdateReadyEventDetail {
  applyUpdate: () => void;
}

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
    let updateRequested = false;

    workbox.addEventListener("waiting", () => {
      window.dispatchEvent(
        new CustomEvent<PwaUpdateReadyEventDetail>(PWA_UPDATE_READY_EVENT, {
          detail: {
            applyUpdate: () => {
              updateRequested = true;
              workbox.messageSkipWaiting();
            },
          },
        })
      );
    });
    workbox.addEventListener("controlling", () => {
      if (updateRequested) {
        window.location.reload();
      }
    });

    workbox.register().catch(() => {
      // PWA install support is optional; the app must keep working without it.
    });
  });
};
