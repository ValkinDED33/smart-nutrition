import { describe, expect, it } from "vitest";
import { createPhotoAnalysisService } from "./photoAnalysisService.mjs";

describe("photoAnalysisService", () => {
  it("accepts only bounded raster photo data URLs", async () => {
    const service = createPhotoAnalysisService();

    await expect(
      service.analyzePhoto({}, { imageDataUrl: "data:image/svg+xml;base64,PHN2Zy8+" })
    ).rejects.toMatchObject({
      code: "INVALID_PHOTO_PAYLOAD",
    });

    await expect(
      service.analyzePhoto(
        {},
        { imageDataUrl: `data:image/png;base64,${"a".repeat(1_700_000)}` }
      )
    ).rejects.toMatchObject({
      code: "INVALID_PHOTO_PAYLOAD",
    });

    await expect(
      service.analyzePhoto(
        { dietStyle: "balanced" },
        { imageDataUrl: "data:image/jpeg;base64,aaaa", mealType: "breakfast" }
      )
    ).resolves.toMatchObject({
      manualReviewRequired: true,
    });
  });
});
