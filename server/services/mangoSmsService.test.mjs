import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createMangoSmsService } from "./mangoSmsService.mjs";

const createConfig = (overrides = {}) => ({
  mangoSmsConfigured: true,
  mangoApiKey: "api-key",
  mangoApiSalt: "api-salt",
  mangoSmsEndpoint: "https://app.mango-office.ru/vpbx/commands/sms",
  mangoFromExtension: "101",
  mangoSmsSender: "SMARTNUTRI",
  mangoSmsTimeoutMs: 10_000,
  ...overrides,
});

const createResponse = ({ ok = true, status = 200, body = "" } = {}) => ({
  ok,
  status,
  text: async () => body,
});

describe("mangoSmsService", () => {
  it("sends signed form-encoded SMS requests to MANGO OFFICE", async () => {
    const fetchMock = vi.fn(async () =>
      createResponse({
        body: JSON.stringify({
          result: 1000,
          command_id: "provider-command-id",
        }),
      })
    );
    const service = createMangoSmsService({
      config: createConfig(),
      fetchImpl: fetchMock,
    });

    const result = await service.sendRegistrationVerificationSms({
      to: "+48 123 456 789",
      code: "123456",
      expiresAt: Date.now() + 15 * 60_000,
    });

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("provider-command-id");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://app.mango-office.ru/vpbx/commands/sms"
    );

    const request = fetchMock.mock.calls[0][1];
    const form = new URLSearchParams(request.body);
    const json = form.get("json");
    const payload = JSON.parse(json);
    const expectedSign = crypto
      .createHash("sha256")
      .update(`api-key${json}api-salt`)
      .digest("hex");

    expect(request.method).toBe("POST");
    expect(form.get("vpbx_api_key")).toBe("api-key");
    expect(form.get("sign")).toBe(expectedSign);
    expect(payload).toMatchObject({
      from_extension: "101",
      to_number: "48123456789",
      sms_sender: "SMARTNUTRI",
    });
    expect(payload.text).toContain("123456");
  });

  it("reports provider rejection codes", async () => {
    const fetchMock = vi.fn(async () =>
      createResponse({
        body: JSON.stringify({
          result: 4300,
          message: "SMS message could not be sent",
        }),
      })
    );
    const service = createMangoSmsService({
      config: createConfig(),
      fetchImpl: fetchMock,
    });

    const result = await service.sendSms({
      to: "74950001122",
      text: "Hello",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "MANGO_SMS_REJECTED",
      mangoCode: "4300",
    });
  });

  it("does not call the provider when credentials are absent", async () => {
    const fetchMock = vi.fn();
    const service = createMangoSmsService({
      config: createConfig({
        mangoSmsConfigured: false,
        mangoApiKey: null,
        mangoApiSalt: null,
      }),
      fetchImpl: fetchMock,
    });

    const result = await service.sendSms({
      to: "74950001122",
      text: "Hello",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "MANGO_SMS_NOT_CONFIGURED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
