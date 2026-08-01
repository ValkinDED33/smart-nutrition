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
  it("routes owner user deletion through the canonical repository and audit log", async () => {
    const targetUser = {
      id: "user-test-delete",
      email: "deleted-test@example.com",
      role: "USER",
    };
    const adminRepository = {
      getAllUsers: vi.fn(async () => [targetUser]),
      deleteUser: vi.fn(async () => {}),
      createAuditLog: vi.fn(async () => {}),
    };
    const response = new MemoryResponse();

    await createAdminController({
      platformService: {},
      adminRepository,
      bodyLimitBytes: 1024,
      clientErrorStore: { list: vi.fn() },
    }).deleteUser({
      request: { method: "DELETE" },
      response,
      auth: { user: { id: "owner-1", role: "OWNER" } },
      params: { userId: targetUser.id },
    });

    expect(response.statusCode).toBe(204);
    expect(adminRepository.deleteUser).toHaveBeenCalledWith(targetUser.id);
    expect(adminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "owner-1",
        actorRole: "OWNER",
        action: "access.user_deleted",
        targetType: "user",
        targetId: targetUser.id,
        details: {
          email: targetUser.email,
          role: targetUser.role,
        },
      })
    );
  });

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
