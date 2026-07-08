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
    expect(source).toContain('data-scanner-preview-shell="stable"');
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_ASPECT_RATIO");
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS");
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_TABLET_HEIGHT_CSS");
    expect(source).toContain("BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS");
    expect(source).toContain('height: "100%"');
    expect(source).toContain('minHeight: "100%"');
    expect(source).toContain('maxWidth: "100%"');
    expect(source).toContain('maxHeight: "100%"');
    expect(source).toContain('objectFit: "cover"');
    expect(source).not.toContain("minHeight: 240");
  });

  it("keeps the video node mounted and decouples camera lifecycle from meal state changes", () => {
    const source = scannerSource();

    expect(source).toContain("scannerVideoStyle");
    expect(source).toContain("handleLookupRef");
    expect(source).toContain("await handleLookupRef.current?.(code, true)");
    expect(source).toContain("refreshTorchAvailabilityRef.current()");
  });

  it("confirms scanner meal adds only through canonical backend intake", () => {
    const source = scannerSource();

    expect(source).toContain("addProductIntakeToCloud");
    expect(source).toContain("intakeResult.outcomes?.mealAdded");
    expect(source).toContain('"cameraStarting"');
    expect(source).toContain('"scanning"');
    expect(source).toContain('"resolving"');
    expect(source).toContain('"addConfirmed"');
    expect(source).toContain('"notFound"');
    expect(source).toContain('"saveFailed"');
    expect(source).not.toContain("await addMealEntriesToCloud(dispatch, nextMeal");
    expect(source).not.toContain("await saveMealProductToCloud(dispatch, nextMeal");
  });

  it("offers recovery actions when scanning does not detect a barcode", () => {
    const source = scannerSource();

    expect(source).toContain("BARCODE_SCAN_NO_RESULT_TIMEOUT_MS");
    expect(source).toContain("scanTimedOut");
    expect(source).toContain("noResultSoundPlayedRef");
    expect(source).toContain("scheduleNoResultTimeout");
    expect(source).toContain("handleNoResultTimeout");
    expect(source).toContain("copy.retryScanner");
    expect(source).toContain("copy.enterManually");
    expect(source).toContain("copy.addManually");
    expect(source).toContain("copy.fullProductSearch");
    expect(source).toContain("onOpenProductSearch");
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

  it("makes torch control stateful instead of a silent no-op button", () => {
    const source = scannerSource();

    expect(source).toContain("torchToggling");
    expect(source).toContain("torchMessage");
    expect(source).toContain("copy.torchTurningOn");
    expect(source).toContain("copy.torchFailed");
    expect(source).toContain("aria-pressed={torchEnabled}");
    expect(source).toContain("disabled={torchToggling}");
    expect(source).toContain("resolveBarcodeTorchAvailable");
    expect(source).toContain("Torch state was not applied");
  });
});
