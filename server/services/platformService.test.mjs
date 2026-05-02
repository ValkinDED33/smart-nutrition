import { describe, expect, it, vi } from "vitest";
import { createPlatformService } from "./platformService.mjs";

const createPlatformFixture = () => {
  const platformRepository = {
    listCatalogProducts: vi.fn(() => []),
    listAuditLogs: vi.fn(() => []),
    countCatalogProductsByOwnerSince: vi.fn(() => 0),
    findCatalogDuplicateCandidates: vi.fn(() => []),
    insertCatalogProduct: vi.fn(),
    createCatalogProductVersion: vi.fn(),
    createAuditLog: vi.fn(),
  };
  const config = {
    productSubmissionDailyLimit: 10,
    superAdminEmail: "",
  };

  return {
    platformRepository,
    service: createPlatformService({ platformRepository, config }),
  };
};

const user = {
  id: "user-1",
  role: "USER",
};

const moderator = {
  id: "moderator-1",
  role: "MODERATOR",
};

const admin = {
  id: "admin-1",
  role: "ADMIN",
};

describe("platformService", () => {
  it("clamps public catalog query limits and trims search", () => {
    const { platformRepository, service } = createPlatformFixture();

    service.listVisibleCatalogProducts(user, {
      limit: "99999",
      search: "  high   protein   breakfast  ",
    });

    expect(platformRepository.listCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "high protein breakfast",
        limit: 120,
      })
    );
  });

  it("clamps moderation and audit limits server-side", () => {
    const { platformRepository, service } = createPlatformFixture();

    service.listModerationQueue(moderator, { limit: "99999" });
    service.listAuditLogs(admin, { limit: "99999" });

    expect(platformRepository.listCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 160 })
    );
    expect(platformRepository.listAuditLogs).toHaveBeenCalledWith(200);
  });

  it("drops unsafe catalog image URLs and caps nutrient values", () => {
    const { platformRepository, service } = createPlatformFixture();

    const result = service.submitCatalogProduct(user, {
      name: "Protein bowl",
      imageUrl: "javascript:alert(1)",
      calories: 99999999,
      protein: 25,
      fat: 10,
      carbs: 40,
      unit: "g",
    });

    expect(result.item.imageUrl).toBeNull();
    expect(result.item.nutrients.calories).toBe(100000);
    expect(platformRepository.insertCatalogProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: null,
        nutrients: expect.objectContaining({ calories: 100000 }),
      })
    );
  });
});
