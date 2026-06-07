import { describe, expect, it, vi } from "vitest";
import { createBrevoService } from "./brevoService.mjs";

const createConfig = (overrides = {}) => ({
  brevoApiKey: "brevo-key",
  brevoListId: 42,
  ...overrides,
});

const createResponse = ({ ok, status = 200, body = {} }) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Bad Request",
  json: vi.fn(async () => body),
});

describe("brevoService", () => {
  it("returns no-op success when Brevo is not configured", async () => {
    const fetchImpl = vi.fn();
    const service = createBrevoService({
      config: createConfig({ brevoApiKey: null, brevoListId: 0 }),
      fetchImpl,
    });

    await expect(
      service.upsertContact({ email: "user@example.com", name: "User" })
    ).resolves.toEqual({
      ok: true,
      skipped: true,
      code: "BREVO_NOT_CONFIGURED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(service.getStatus()).toEqual({
      configured: false,
      provider: "brevo",
      listIdConfigured: false,
    });
  });

  it("calls Brevo contacts API with email, name and listIds", async () => {
    const fetchImpl = vi.fn(async () => createResponse({ ok: true }));
    const service = createBrevoService({
      config: createConfig(),
      fetchImpl,
    });

    const result = await service.upsertContact({
      email: "USER@Example.com",
      name: "User Name",
    });

    expect(result).toEqual({
      ok: true,
      provider: "brevo",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/contacts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "api-key": "brevo-key",
          "Content-Type": "application/json",
        }),
      })
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      email: "user@example.com",
      attributes: {
        FIRSTNAME: "User Name",
      },
      listIds: [42],
      updateEnabled: true,
    });
  });

  it("handles existing contact responses safely", async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse({
        ok: false,
        status: 400,
        body: {
          code: "duplicate_parameter",
          message: "Contact already exist",
        },
      })
    );
    const service = createBrevoService({
      config: createConfig(),
      fetchImpl,
    });

    await expect(
      service.upsertContact({ email: "user@example.com", name: "User" })
    ).resolves.toEqual({
      ok: true,
      provider: "brevo",
      existingContact: true,
    });
  });

  it("logs safe warnings when Brevo fails", async () => {
    const logger = { warn: vi.fn() };
    const fetchImpl = vi.fn(async () =>
      createResponse({
        ok: false,
        status: 500,
        body: {
          code: "internal_error",
          message: "Provider failure",
        },
      })
    );
    const service = createBrevoService({
      config: createConfig(),
      logger,
      fetchImpl,
    });

    await expect(
      service.upsertContact({ email: "user@example.com", name: "User" })
    ).resolves.toEqual({
      ok: false,
      code: "BREVO_CONTACT_SYNC_FAILED",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[brevo] contact sync failed",
      expect.objectContaining({
        provider: "brevo",
        status: 500,
        code: "internal_error",
        message: "Provider failure",
      })
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("brevo-key");
  });
});
