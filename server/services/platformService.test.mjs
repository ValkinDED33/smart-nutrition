import { describe, expect, it, vi } from "vitest";
import { createPlatformService } from "./platformService.mjs";

const createPlatformFixture = () => {
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

  it.each([user, nutritionist, moderator])(
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
});
