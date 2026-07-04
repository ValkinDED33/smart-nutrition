import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scannerSource = () =>
  readFileSync(
    resolve(process.cwd(), "src/features/meal/BarcodeScanner.tsx"),
    "utf8"
  );

describe("BarcodeScanner mobile preview layout", () => {
  it("keeps camera preview height controlled by a stable shell, not video metadata", () => {
    const source = scannerSource();

    expect(source).toContain("scannerPreviewSx");
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_ASPECT_RATIO");
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS");
    expect(source).toContain('height: "100%"');
    expect(source).toContain('maxHeight: "100%"');
    expect(source).not.toContain("minHeight: 240");
  });

  it("offers recovery actions when scanning does not detect a barcode", () => {
    const source = scannerSource();

    expect(source).toContain("BARCODE_SCAN_NO_RESULT_TIMEOUT_MS");
    expect(source).toContain("scanTimedOut");
    expect(source).toContain("noResultSoundPlayedRef");
    expect(source).toContain("copy.retryScanner");
    expect(source).toContain("copy.enterManually");
    expect(source).toContain("copy.addManually");
  });

  it("keeps scanner sound feedback user-controlled and non-persistent", () => {
    const source = scannerSource();

    expect(source).toContain("scannerSoundEnabled");
    expect(source).toContain("setScannerSoundEnabled");
    expect(source).toContain("copy.muteSound");
    expect(source).toContain("copy.unmuteSound");
    expect(source).not.toContain("localStorage.setItem");
    expect(source).not.toContain("sessionStorage.setItem");
  });
});
