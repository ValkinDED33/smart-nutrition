import { describe, expect, it, vi } from "vitest";
import { createAdminController } from "./admin.controller.mjs";

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

const createController = (clientErrorStore) =>
  createAdminController({
    platformService: {},
    adminRepository: {},
    bodyLimitBytes: 1024,
    clientErrorStore,
  });

describe("admin controller client errors", () => {
  it("returns recent client errors for admins only", async () => {
    const clientErrorStore = {
      list: vi.fn(() => [
        {
          id: "sn-mobile",
          route: "/progress",
          message: "Crash",
        },
      ]),
    };
    const response = new MemoryResponse();

    await createController(clientErrorStore).listClientErrors({
      response,
      auth: { user: { id: "admin-1", role: "ADMIN" } },
      url: new URL("https://smart-nutrition.club/api/admin/client-errors?id=sn-mobile&limit=5"),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      items: [{ id: "sn-mobile", route: "/progress", message: "Crash" }],
    });
    expect(clientErrorStore.list).toHaveBeenCalledWith({
      id: "sn-mobile",
      limit: "5",
    });
  });

  it("rejects client error diagnostics for regular users", async () => {
    await expect(
      createController({ list: vi.fn() }).listClientErrors({
        response: new MemoryResponse(),
        auth: { user: { id: "user-1", role: "USER" } },
        url: new URL("https://smart-nutrition.club/api/admin/client-errors"),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
