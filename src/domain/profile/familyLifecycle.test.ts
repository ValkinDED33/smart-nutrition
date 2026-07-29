import { describe, expect, it } from "vitest";
import type { PartnerSharingState } from "./types";
import { createDefaultWomenHealthState } from "./womenHealth";
import { resolveFamilyLifecycleMode } from "./familyLifecycle";

const emptyPartnerSharing: PartnerSharingState = {
  invites: [],
  links: [],
};

const activePregnancyPartnerSharing: PartnerSharingState = {
  invites: [],
  links: [
    {
      id: "link-1",
      partnerUserId: "owner-1",
      role: "partner",
      permissions: ["pregnancy_timeline"],
      status: "active",
      connectedAt: "2026-07-25T12:00:00.000Z",
      revokedAt: null,
    },
  ],
};

describe("family lifecycle domain", () => {
  it("lets canonical women health state own pregnancy lifecycle", () => {
    const mode = resolveFamilyLifecycleMode({
      explicitMode: "personal",
      womenHealth: {
        ...createDefaultWomenHealthState(),
        mode: "pregnant",
      },
      partnerSharing: emptyPartnerSharing,
    });

    expect(mode).toBe("pregnant");
  });

  it("keeps breastfeeding as a postpartum sub-mode only when postpartum is active", () => {
    const mode = resolveFamilyLifecycleMode({
      explicitMode: "breastfeeding",
      womenHealth: {
        ...createDefaultWomenHealthState(),
        mode: "postpartum",
      },
      partnerSharing: emptyPartnerSharing,
    });

    expect(mode).toBe("breastfeeding");
  });

  it("recognizes partner mode from an active permission-scoped pregnancy link", () => {
    const mode = resolveFamilyLifecycleMode({
      explicitMode: "personal",
      womenHealth: createDefaultWomenHealthState(),
      partnerSharing: activePregnancyPartnerSharing,
    });

    expect(mode).toBe("partner");
  });
});
