import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceWorkerSource = () =>
  readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("service worker recovery contract", () => {
  it("bypasses browser cache for navigations and hashed assets", () => {
    const source = serviceWorkerSource();

    expect(source).toContain('fetch(request, { cache: "reload" })');
    expect(source).toContain('fetch(request, { cache: "no-store" })');
  });

  it("does not force takeover during install before the app asks to update", () => {
    const source = serviceWorkerSource();
    const installBlock = source.slice(
      source.indexOf('self.addEventListener("install"'),
      source.indexOf('self.addEventListener("activate"')
    );

    expect(installBlock).not.toContain("skipWaiting()");
    expect(source).toContain('event.data?.type === "SKIP_WAITING"');
  });
});
