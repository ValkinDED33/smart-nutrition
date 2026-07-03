import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearRegisterDraftHint,
  readAuthIdentityHint,
  writeAuthIdentityHint,
  writeRegisterDraftHint,
} from "./authIdentity";

describe("authIdentity", () => {
  afterEach(() => {
    clearRegisterDraftHint();
    vi.useRealTimers();
  });

  it("stores a normalized auth identity hint for the current browser session", () => {
    writeAuthIdentityHint({
      name: "  Igor  ",
      email: "  IGOR@EXAMPLE.COM ",
    });

    expect(readAuthIdentityHint()).toEqual({
      name: "Igor",
      email: "igor@example.com",
    });
  });

  it("uses the same real storage path for register draft hints", () => {
    writeRegisterDraftHint({
      email: "draft@example.com",
    });

    expect(readAuthIdentityHint()).toEqual({
      email: "draft@example.com",
    });
  });

  it("expires old hints instead of keeping stale identity forever", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T10:00:00.000Z"));
    writeAuthIdentityHint({ email: "old@example.com" });

    vi.setSystemTime(new Date("2026-06-22T10:00:01.000Z"));

    expect(readAuthIdentityHint()).toEqual({});
  });
});
