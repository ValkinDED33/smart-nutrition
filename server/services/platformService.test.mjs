import { describe, expect, it, vi } from "vitest";
import { createPlatformService } from "./platformService.mjs";

const createPlatformFixture = ({ productLookupService = null } = {}) => {
  const targetUser = {
    id: "target-user-1",
    email: "target@example.com",
    role: "USER",
    name: "Target User",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const platformRepository = {
    listCatalogProducts: vi.fn(() => []),
    listAuditLogs: vi.fn(() => []),
    listUsers: vi.fn(() => [targetUser]),
    findUserById: vi.fn(() => targetUser),
    updateUserRole: vi.fn(({ role }) => ({ ...targetUser, role })),
    updateUserBan: vi.fn(({ bannedAt, bannedReason }) => ({
      ...targetUser,
      bannedAt,
      bannedReason,
    })),
    countCatalogProductsByOwnerSince: vi.fn(() => 0),
    findCatalogDuplicateCandidates: vi.fn(() => []),
    insertCatalogProduct: vi.fn(),
    createCatalogProductVersion: vi.fn(),
    createAuditLog: vi.fn(),
  };
  const config = {
    productSubmissionDailyLimit: 10,
    superAdminEmail: "",
    catalogCacheTtlSeconds: 60,
  };

  return {
    platformRepository,
    service: createPlatformService({ platformRepository, config, productLookupService }),
  };
};

const user = {
  id: "user-1",
  role: "USER",
};

const helper = {
  id: "helper-1",
  role: "HELPER",
};

const nutritionist = {
  id: "nutritionist-1",
  role: "NUTRITIONIST",
};

const moderator = {
  id: "moderator-1",
  role: "MODERATOR",
};

const admin = {
  id: "admin-1",
  role: "ADMIN",
};

const owner = {
  id: "owner-1",
  role: "OWNER",
};

describe("platformService", () => {
  it("clamps public catalog query limits and trims search", async () => {
    const { platformRepository, service } = createPlatformFixture();

    await service.listVisibleCatalogProducts(user, {
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

  it("fills visible product search from external online providers when backend catalog is sparse", async () => {
    const catalogProduct = {
      id: "catalog-oats",
      ownerUserId: "user-1",
      name: "Oats",
      brand: null,
      barcode: null,
      source: "Manual",
      unit: "g",
      status: "approved",
      nutrients: {
        calories: 370,
        protein: 13,
        fat: 7,
        carbs: 60,
      },
    };
    const onlineProduct = {
      id: "openfoodfacts-yogurt",
      ownerUserId: null,
      name: "Greek yogurt",
      brand: "Online",
      barcode: "1234567890123",
      source: "OpenFoodFacts",
      unit: "g",
      status: "approved",
      nutrients: {
        calories: 92,
        protein: 10,
        fat: 2,
        carbs: 4,
      },
    };
    const productLookupService = {
      isConfigured: vi.fn(() => true),
      searchProducts: vi.fn(async () => [onlineProduct]),
    };
    const { platformRepository, service } = createPlatformFixture({
      productLookupService,
    });
    platformRepository.listCatalogProducts.mockResolvedValue([catalogProduct]);

    const results = await service.listVisibleCatalogProducts(user, {
      search: "protein",
      limit: "4",
    });

    expect(results).toEqual([catalogProduct, onlineProduct]);
    expect(productLookupService.searchProducts).toHaveBeenCalledWith({
      search: "protein",
      limit: 3,
    });
  });

  it("does not call external providers for unapproved catalog status views", async () => {
    const productLookupService = {
      isConfigured: vi.fn(() => true),
      searchProducts: vi.fn(async () => []),
    };
    const { service } = createPlatformFixture({ productLookupService });

    await service.listVisibleCatalogProducts(user, {
      status: "pending",
      search: "oats",
      limit: "4",
    });

    expect(productLookupService.searchProducts).not.toHaveBeenCalled();
  });

  it("clamps moderation and audit limits server-side", async () => {
    const { platformRepository, service } = createPlatformFixture();

    await service.listModerationQueue(moderator, { limit: "99999" });
    await service.listAuditLogs(admin, { limit: "99999" });

    expect(platformRepository.listCatalogProducts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 160 })
    );
    expect(platformRepository.listAuditLogs).toHaveBeenCalledWith(200);
  });

  it("drops unsafe catalog image URLs and caps nutrient values", async () => {
    const { platformRepository, service } = createPlatformFixture();

    const result = await service.submitCatalogProduct(user, {
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

  it.each([user, helper, nutritionist, moderator])(
    "blocks %s from strict admin operations",
    async (actor) => {
      const { service } = createPlatformFixture();

      await expect(service.listUsers(actor)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        service.updateUserRole(actor, "target-user-1", { role: "MODERATOR" })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        service.updateUserBan(actor, "target-user-1", { banned: true })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(service.listAuditLogs(actor)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
  );

  it("allows admins to use strict admin operations", async () => {
    const { platformRepository, service } = createPlatformFixture();

    await expect(service.listUsers(admin)).resolves.toHaveLength(1);
    await expect(
      service.updateUserRole(admin, "target-user-1", { role: "MODERATOR" })
    ).resolves.toMatchObject({
      role: "MODERATOR",
    });
    await expect(
      service.updateUserBan(admin, "target-user-1", { banned: true, reason: "Policy" })
    ).resolves.toMatchObject({
      bannedReason: "Policy",
    });
    await expect(service.listAuditLogs(admin)).resolves.toEqual([]);

    expect(platformRepository.listUsers).toHaveBeenCalledTimes(1);
    expect(platformRepository.updateUserRole).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "target-user-1",
        role: "MODERATOR",
        twoFactorRequired: false,
      })
    );
    expect(platformRepository.updateUserBan).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "target-user-1",
        bannedReason: "Policy",
      })
    );
    expect(platformRepository.listAuditLogs).toHaveBeenCalledWith(80);
  });

  it("allows only owners to assign admin access", async () => {
    const { service } = createPlatformFixture();

    await expect(
      service.updateUserRole(admin, "target-user-1", { role: "ADMIN" })
    ).rejects.toMatchObject({
      code: "ROLE_CHANGE_NOT_ALLOWED",
    });

    await expect(
      service.updateUserRole(owner, "target-user-1", { role: "ADMIN" })
    ).resolves.toMatchObject({
      role: "ADMIN",
    });
  });

  it("does not allow email verification to be assigned as a role", async () => {
    const { service } = createPlatformFixture();

    await expect(
      service.updateUserRole(owner, "target-user-1", { role: "VERIFIED_USER" })
    ).rejects.toMatchObject({
      code: "INVALID_ROLE",
    });
  });

  it("lets helpers review content reports without catalog moderation access", async () => {
    const { platformRepository, service } = createPlatformFixture();
    platformRepository.listAuditLogs.mockResolvedValue([
      {
        id: "report-1",
        actorUserId: "user-1",
        actorRole: "USER",
        action: "content.report_created",
        targetType: "post",
        targetId: "post-1",
        details: {
          reason: "Spam",
          reporterName: "Marta",
        },
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    await expect(service.listContentReports(helper)).resolves.toHaveLength(1);
    await expect(service.listModerationQueue(helper)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
