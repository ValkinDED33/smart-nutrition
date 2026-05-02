import { describe, expect, it } from "vitest";
import { sendError } from "./http.mjs";

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

describe("http response helpers", () => {
  it("sends API errors with a stable compatibility shape", () => {
    const response = new MemoryResponse();

    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON.");

    expect(response.statusCode).toBe(400);
    expect(response.headers["Content-Type"]).toBe("application/json; charset=utf-8");
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      code: "INVALID_JSON",
      error: "Request body must be valid JSON.",
      message: "Request body must be valid JSON.",
    });
  });
});
