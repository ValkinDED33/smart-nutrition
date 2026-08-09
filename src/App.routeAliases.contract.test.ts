import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("App route aliases", () => {
  it("keeps direct scanner and photo URLs wired to the canonical meals capture flow", () => {
    expect(source).toContain('path="/scanner"');
    expect(source).toContain('to="/meals?mode=barcode"');
    expect(source).toContain('path="/photo-meal"');
    expect(source).toContain('to="/meals?mode=photo"');
  });

  it("keeps assistant URLs wired to the single project assistant surface", () => {
    expect(source).toContain('path="/ai"');
    expect(source).toContain('path="/assistant"');
    expect(source).toContain('to="/coach"');
  });
});
