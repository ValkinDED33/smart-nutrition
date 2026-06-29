import { describe, expect, it } from "vitest";
import {
  normalizeProductLookupQuery,
  resolveProductLookupUiState,
  shouldRunOnlineProductLookup,
} from "./productLookupUiModel";

describe("productLookupUiModel", () => {
  it("normalizes product lookup queries for stable backend requests", () => {
    expect(normalizeProductLookupQuery("  куряче   філе  ")).toBe("куряче філе");
  });

  it("does not run online lookup for empty or one-letter input", () => {
    expect(shouldRunOnlineProductLookup("")).toBe(false);
    expect(shouldRunOnlineProductLookup("a")).toBe(false);
    expect(shouldRunOnlineProductLookup("ab")).toBe(true);
  });

  it("keeps lookup states distinct for idle/searching/error/empty/ready", () => {
    expect(
      resolveProductLookupUiState({
        query: "",
        isFetching: false,
        isError: false,
        resultCount: 0,
      })
    ).toBe("idle");
    expect(
      resolveProductLookupUiState({
        query: "rice",
        isFetching: true,
        isError: false,
        resultCount: 0,
      })
    ).toBe("searching");
    expect(
      resolveProductLookupUiState({
        query: "rice",
        isFetching: false,
        isError: true,
        resultCount: 0,
      })
    ).toBe("error");
    expect(
      resolveProductLookupUiState({
        query: "rice",
        isFetching: false,
        isError: false,
        resultCount: 0,
      })
    ).toBe("empty");
    expect(
      resolveProductLookupUiState({
        query: "rice",
        isFetching: false,
        isError: false,
        resultCount: 2,
      })
    ).toBe("ready");
  });
});
