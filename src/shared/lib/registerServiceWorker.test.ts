import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const registerServiceWorkerSource = () =>
  readFileSync(
    resolve(process.cwd(), "src/shared/lib/registerServiceWorker.ts"),
    "utf8"
  );

describe("registerServiceWorker update contract", () => {
  it("publishes an app-level update event instead of silently forcing a reload", () => {
    const source = registerServiceWorkerSource();

    expect(source).toContain("PWA_UPDATE_READY_EVENT");
    expect(source).toContain("new CustomEvent<PwaUpdateReadyEventDetail>");
    expect(source).toContain("applyUpdate");
    expect(source).toContain("workbox.messageSkipWaiting()");
  });

  it("reloads only after the app explicitly requested the update", () => {
    const source = registerServiceWorkerSource();
    const controllingBlock = source.slice(
      source.indexOf('workbox.addEventListener("controlling"'),
      source.indexOf("workbox.register()")
    );

    expect(controllingBlock).toContain("if (updateRequested)");
    expect(controllingBlock).toContain("reloadAfterUpdate()");
    expect(source).toContain("window.location.reload()");
  });

  it("keeps a fallback reload path if the service worker handoff stalls", () => {
    const source = registerServiceWorkerSource();

    expect(source).toContain("PWA_UPDATE_RELOAD_FALLBACK_MS");
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source).toContain("reloadAfterUpdate");
  });
});
