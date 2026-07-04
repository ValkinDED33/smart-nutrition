import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const soundSource = () =>
  readFileSync(resolve(process.cwd(), "src/shared/lib/sound.ts"), "utf8");

describe("scanner sound contract", () => {
  it("uses a calm soft failure tone instead of an alarm-like oscillator", () => {
    const source = soundSource();
    const failureBlock = source.slice(
      source.indexOf("export const playScanErrorSound"),
      source.indexOf("export const playGentleClickSound")
    );

    expect(failureBlock).toContain('type: "sine"');
    expect(failureBlock).toContain('type: "triangle"');
    expect(failureBlock).not.toContain('type: "sawtooth"');
    expect(failureBlock).toContain("gain: 0.024");
  });
});
