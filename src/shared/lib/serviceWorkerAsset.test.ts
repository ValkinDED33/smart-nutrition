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
});
