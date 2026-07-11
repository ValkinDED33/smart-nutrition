import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("PartnerInvitePage contract", () => {
  it("routes QR partner invites through a dedicated page instead of public register redirects", async () => {
    const appSource = await readSource("src/App.tsx");
    const serviceSource = await readSource("server/services/partnerService.mjs");

    expect(appSource).toContain('path="/partner-invite"');
    expect(serviceSource).toContain("/partner-invite?code=");
    expect(serviceSource).not.toContain("/register?partnerInvite=");
  });

  it("connects existing and newly verified accounts through the backend invite contract", async () => {
    const inviteSource = await readSource("src/pages/PartnerInvitePage.tsx");
    const loginSource = await readSource("src/pages/LoginPage.tsx");
    const verifySource = await readSource("src/pages/VerifyEmailPage.tsx");

    expect(inviteSource).toContain("PENDING_PARTNER_INVITE_KEY");
    expect(inviteSource).toContain("acceptRemotePartnerInvite");
    expect(loginSource).toContain("acceptRemotePartnerInvite(pendingPartnerInvite)");
    expect(verifySource).toContain("acceptRemotePartnerInvite(pendingPartnerInvite)");
    expect(inviteSource).not.toContain("localStorage");
  });
});
