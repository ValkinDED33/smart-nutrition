import { describe, expect, it, vi } from "vitest";
import { createPartnerService } from "./partnerService.mjs";

const createUser = (id, name) => ({
  id,
  name,
  email: `${id}@smart.test`,
  role: "USER",
});

const createProfile = (overrides = {}) => ({
  dailyCalories: 2000,
  womenHealth: {
    mode: "pregnant",
    pregnancyWeek: 20,
    dueDate: "2026-11-20",
    lastPeriodStartDate: "2026-02-13",
    doctorConfirmed: true,
    notes: "Private clinician note",
    updatedAt: "2026-07-10T12:00:00.000Z",
  },
  partnerSharing: {
    invites: [],
    links: [],
  },
  weightHistory: [{ date: "2026-07-10T12:00:00.000Z", weight: 67 }],
  ...overrides,
});

const createFixture = () => {
  const owner = createUser("owner-1", "Anna");
  const partner = createUser("partner-1", "Igor");
  const profiles = new Map([
    [owner.id, createProfile()],
    [partner.id, createProfile({ womenHealth: { mode: "none" } })],
  ]);
  const authRepository = {
    listUsers: vi.fn(async () => [owner, partner]),
    findUserById: vi.fn(async (userId) => (userId === owner.id ? owner : partner)),
    createAuditLog: vi.fn(async () => null),
  };
  const stateRepository = {
    getProfileStateByUserId: vi.fn(async (userId) => profiles.get(userId) ?? null),
    upsertProfileState: vi.fn(async (userId, profileState) => {
      profiles.set(userId, profileState);
      return profileState;
    }),
  };
  const emailService = {
    sendPartnerInviteEmail: vi.fn(async () => ({
      ok: true,
      messageId: "partner-email-1",
    })),
  };
  const service = createPartnerService({
    authRepository,
    stateRepository,
    emailService,
    config: {
      jwtSecret: "x".repeat(48),
      appBaseUrl: "https://smart-nutrition.club",
    },
  });

  return {
    authRepository,
    emailService,
    owner,
    partner,
    profiles,
    service,
    stateRepository,
  };
};

describe("partnerService", () => {
  it("creates a backend-confirmed partner invite and stores only a hash", async () => {
    const { owner, profiles, service } = createFixture();

    const invite = await service.createInvite(owner);
    const ownerProfile = profiles.get(owner.id);

    expect(invite.code).toMatch(/^SN-[A-Z0-9]{6,12}$/);
    expect(invite.inviteUrl).toContain(encodeURIComponent(invite.code));
    expect(ownerProfile.partnerSharing.invites).toHaveLength(1);
    expect(ownerProfile.partnerSharing.invites[0].codeHash).not.toBe(invite.code);
    expect(ownerProfile.partnerSharing.invites[0].permissions).toEqual([
      "pregnancy_timeline",
    ]);
  });

  it("can deliver the same partner invite by email without creating another sharing system", async () => {
    const { emailService, owner, profiles, service } = createFixture();

    const invite = await service.createInvite(owner, {
      partnerEmail: " Igor@Smart.Test ",
    });
    const ownerProfile = profiles.get(owner.id);

    expect(invite.email).toMatchObject({
      requested: true,
      delivered: true,
      target: "igor@smart.test",
      code: null,
    });
    expect(emailService.sendPartnerInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "igor@smart.test",
        inviterName: owner.name,
        inviteUrl: invite.inviteUrl,
        code: invite.code,
        expiresAt: invite.expiresAt,
      })
    );
    expect(ownerProfile.partnerSharing.invites).toHaveLength(1);
    expect(ownerProfile.partnerSharing.links).toHaveLength(0);
    expect(ownerProfile.partnerSharing.invites[0].codeHash).not.toBe(invite.code);
  });

  it("accepts an invite, links both profiles, and returns only pregnancy timeline data", async () => {
    const { owner, partner, profiles, service } = createFixture();
    const invite = await service.createInvite(owner);

    const result = await service.acceptInvite(partner, invite.code);
    const ownerProfile = profiles.get(owner.id);
    const partnerProfile = profiles.get(partner.id);

    expect(result.ok).toBe(true);
    expect(ownerProfile.partnerSharing.links[0]).toMatchObject({
      partnerUserId: partner.id,
      role: "owner",
      permissions: ["pregnancy_timeline"],
      status: "active",
    });
    expect(partnerProfile.partnerSharing.links[0]).toMatchObject({
      partnerUserId: owner.id,
      role: "partner",
      permissions: ["pregnancy_timeline"],
      status: "active",
    });
    expect(result.share).toMatchObject({
      owner: { id: owner.id, name: owner.name },
      pregnancy: {
        mode: "pregnant",
        pregnancyWeek: 20,
        dueDate: "2026-11-20",
      },
      baby: {
        sizeKey: "banana",
      },
    });
    expect(JSON.stringify(result.share)).not.toContain("Private clinician note");
    expect(JSON.stringify(result.share)).not.toContain("weightHistory");
    expect(JSON.stringify(result.share)).not.toContain("dailyCalories");
  });

  it("lists limited pregnancy shares for a linked partner", async () => {
    const { owner, partner, service } = createFixture();
    const invite = await service.createInvite(owner);
    await service.acceptInvite(partner, invite.code);

    const result = await service.listPregnancyShares(partner);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].owner.name).toBe("Anna");
    expect(result.items[0].pregnancy.pregnancyWeek).toBe(20);
  });

  it("derives partner pregnancy timeline from due date when week is missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T12:00:00.000Z"));

    try {
      const { owner, partner, profiles, service } = createFixture();
      profiles.set(
        owner.id,
        createProfile({
          womenHealth: {
            mode: "pregnant",
            pregnancyWeek: null,
            dueDate: "2026-11-20T00:00:00.000Z",
            lastPeriodStartDate: null,
            doctorConfirmed: true,
            notes: "Private clinician note",
            updatedAt: "2026-07-10T12:00:00.000Z",
          },
        })
      );
      const invite = await service.createInvite(owner);

      const result = await service.acceptInvite(partner, invite.code);

      expect(result.share.pregnancy.pregnancyWeek).toBe(21);
      expect(result.share.baby.sizeKey).toBe("banana");
      expect(JSON.stringify(result.share)).not.toContain("Private clinician note");
    } finally {
      vi.useRealTimers();
    }
  });
});
