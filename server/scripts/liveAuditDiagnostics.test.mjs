import { describe, expect, it } from "vitest";
import {
  describeBackendDriftHint,
  describeBackendHealth,
  describeCorsResponse,
  describeDeploymentDriftHint,
  describeHealthResponse,
  hasExposedRequestId,
  isRenderCloudHealth,
} from "./liveAuditDiagnostics.mjs";

const createResponse = ({ status = 200, headers = {} } = {}) => ({
  status,
  headers: new Headers(headers),
});

describe("live audit diagnostics", () => {
  it("describes stale backend health with deployment evidence", () => {
    const response = createResponse();
    const health = {
      ok: true,
      mode: "remote-cloud",
      auth: "httpOnly-cookie-session",
      storage: { engine: "mongodb" },
      email: { configured: true },
    };

    expect(describeBackendHealth({ response, health })).toBe(
      "status=200 ok=true mode=remote-cloud auth=httpOnly-cookie-session storage=mongodb email=true deployment=missing commit=missing"
    );
    expect(describeBackendDriftHint({ response, health })).toContain(
      "Likely stale Render deploy"
    );
    expect(isRenderCloudHealth(health)).toBe(false);
  });

  it("accepts only the safe Render cloud health fingerprint", () => {
    expect(
      isRenderCloudHealth({
        ok: true,
        mode: "remote-cloud",
        auth: "httpOnly-cookie-session",
        storage: { engine: "postgres" },
        email: { configured: true },
        deployment: { provider: "render", commit: "abc1234" },
      })
    ).toBe(true);

    expect(
      isRenderCloudHealth({
        ok: true,
        mode: "remote-cloud",
        auth: "httpOnly-cookie-session",
        storage: { engine: "mongodb" },
        email: { configured: true },
        deployment: { provider: "local" },
      })
    ).toBe(false);
  });

  it("requires request-id to be explicitly exposed as a response header token", () => {
    expect(
      hasExposedRequestId(
        createResponse({
          headers: {
            "Access-Control-Expose-Headers":
              "Retry-After, X-Request-Id, X-RateLimit-Remaining",
          },
        })
      )
    ).toBe(true);

    expect(
      hasExposedRequestId(
        createResponse({
          headers: {
            "Access-Control-Expose-Headers": "X-Request-Id-Deprecated",
          },
        })
      )
    ).toBe(false);
  });

  it("prints complete CORS evidence for live audit failures", () => {
    expect(
      describeCorsResponse(
        createResponse({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://smart-nutrition.club",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Device-Id, X-State-Version",
          },
        })
      )
    ).toBe(
      "status=204 ACAO=https://smart-nutrition.club ACAC=true ACAM=GET, POST, PUT, PATCH, DELETE, OPTIONS ACAH=Content-Type, Authorization, X-Device-Id, X-State-Version ACEH=missing"
    );
  });

  it("describes authenticated health failures with the same deployment drift hint", () => {
    const response = createResponse();
    const data = {
      ok: true,
      mode: "remote-cloud",
      auth: "httpOnly-cookie-session",
      storage: { engine: "mongodb" },
      email: { configured: true },
    };

    expect(describeHealthResponse({ response, data })).toBe(
      "status=200 ok=true mode=remote-cloud auth=httpOnly-cookie-session storage=mongodb email=true deployment=missing commit=missing ACEH=missing"
    );
    expect(describeDeploymentDriftHint({ response, data })).toContain(
      "authenticated smoke is unsafe"
    );
  });
});
