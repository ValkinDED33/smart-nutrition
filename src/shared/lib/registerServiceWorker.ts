import { Workbox } from "workbox-window";

export const PWA_UPDATE_READY_EVENT = "smart-nutrition:pwa-update-ready";
const PWA_UPDATE_RELOAD_FALLBACK_MS = 8_000;

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
    let reloadFallbackId: number | null = null;

    const reloadAfterUpdate = () => {
      if (reloadFallbackId !== null) {
        window.clearTimeout(reloadFallbackId);
        reloadFallbackId = null;
      }

      window.location.reload();
    };

    workbox.addEventListener("waiting", () => {
      window.dispatchEvent(
        new CustomEvent<PwaUpdateReadyEventDetail>(PWA_UPDATE_READY_EVENT, {
          detail: {
            applyUpdate: () => {
              updateRequested = true;
              workbox.messageSkipWaiting();

              if (reloadFallbackId === null) {
                reloadFallbackId = window.setTimeout(
                  reloadAfterUpdate,
                  PWA_UPDATE_RELOAD_FALLBACK_MS
                );
              }
            },
          },
        })
      );
    });
    workbox.addEventListener("controlling", () => {
      if (updateRequested) {
        reloadAfterUpdate();
      }
    });

    workbox.register().catch(() => {
      // PWA install support is optional; the app must keep working without it.
    });
  });
};
