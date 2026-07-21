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
    expect(inviteSource).not.toContain("partnerInvite=");
    expect(inviteSource).not.toContain("localStorage");
  });

  it("keeps the partner invite page localized and limited to pregnancy sharing", async () => {
    const inviteSource = await readSource("src/pages/PartnerInvitePage.tsx");

    expect(inviteSource).toContain("partnerInviteCopy");
    expect(inviteSource).toContain("getPartnerInviteCopy(appLanguage)");
    expect(inviteSource).toContain("Сімейний доступ");
    expect(inviteSource).toContain("Dostęp rodzinny");
    expect(inviteSource).toContain("without full account synchronization");
    expect(inviteSource).toContain("без повної синхронізації акаунтів");
    expect(inviteSource).not.toContain("<Typography component=\"h1\" variant=\"h4\" sx={{ fontWeight: 900 }}>\n          Family access");
    expect(inviteSource).not.toContain("<Alert severity=\"info\" sx={{ width: \"100%\", borderRadius: 3 }}>\n            Connecting partner profiles...");
    expect(inviteSource).not.toContain("<Alert severity=\"success\" sx={{ width: \"100%\", borderRadius: 3 }}>\n            Partner profiles connected.");
  });
});
