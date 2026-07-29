import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const soundSource = () =>
  readFileSync(resolve(process.cwd(), "src/shared/lib/sound.ts"), "utf8");

describe("scanner sound contract", () => {
  it("does not decode embedded base64 audio in scanner or water feedback", () => {
    const source = soundSource();

    expect(source).not.toContain("atob");
    expect(source).not.toContain("base64");
    expect(source).not.toContain("data:audio");
    expect(source).not.toContain("Howl");
    expect(source).not.toContain("howler");
    expect(source).toContain("createOscillator");
    expect(source).toContain("playUiTickSound");
    expect(source).toContain("playAIDiscoverySound");
  });

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

  it("keeps AI discovery sound as a short oscillator chime", () => {
    const source = soundSource();
    const discoveryBlock = source.slice(source.indexOf("export const playAIDiscoverySound"));

    expect(discoveryBlock).toContain('type: "sine"');
    expect(discoveryBlock).toContain('type: "triangle"');
    expect(discoveryBlock).toContain("durationMs: 96");
    expect(discoveryBlock).not.toContain("Audio(");
  });
});
