import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createStaticFileServer, staticFileRuntimeInternals } from "./staticFiles.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createRequest = (method = "GET") => ({ method });

describe("staticFiles runtime", () => {
  it("keeps hashed assets immutable but never stores app shell or service worker", () => {
    const root = path.join(tmpdir(), "smart-nutrition-static-test");

    expect(staticFileRuntimeInternals.getCacheControl(path.join(root, "assets", "app-123.js"))).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(staticFileRuntimeInternals.getCacheControl(path.join(root, "index.html"))).toBe(
      "no-store, max-age=0"
    );
    expect(staticFileRuntimeInternals.getCacheControl(path.join(root, "sw.js"))).toBe(
      "no-store, max-age=0"
    );
    expect(staticFileRuntimeInternals.getCacheControl(path.join(root, "manifest.webmanifest"))).toBe(
      "no-cache"
    );
  });

  it("serves SPA fallback with no-store cache headers", async () => {
    const staticDir = await mkdtemp(path.join(tmpdir(), "smart-nutrition-static-"));

    try {
      await mkdir(path.join(staticDir, "assets"));
      await writeFile(path.join(staticDir, "index.html"), "<div>app</div>");
      await writeFile(path.join(staticDir, "assets", "app-123.js"), "console.log('app')");

      const staticServer = await createStaticFileServer({
        staticDir,
        serveStatic: true,
      });
      const response = new MemoryResponse();
      const served = await staticServer.tryServeStatic(
        createRequest(),
        response,
        "/profile"
      );

      expect(served).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.headers["Cache-Control"]).toBe("no-store, max-age=0");
    } finally {
      await rm(staticDir, { force: true, recursive: true });
    }
  });
});
