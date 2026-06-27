import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthSurface } from "./AuthSurface";

describe("AuthSurface", () => {
  it("renders auth content inside the shared premium surface", () => {
    const html = renderToString(
      <AuthSurface>
        <h1>Sign in</h1>
      </AuthSurface>
    );

    expect(html).toContain("Sign in");
    expect(html).toContain("var(--sn-surface-elevated)");
    expect(html).toContain("var(--sn-border-soft)");
  });
});
