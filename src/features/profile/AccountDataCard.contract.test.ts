import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { accountCopy } from "./accountDataCardCopy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(__dirname, "AccountDataCard.tsx"), "utf8");
const telegramConnectionSource = readFileSync(
  path.join(__dirname, "TelegramConnectionCard.tsx"),
  "utf8"
);
const profilePageSource = readFileSync(
  path.join(__dirname, "../../pages/ProfilePage.tsx"),
  "utf8"
);

describe("AccountDataCard production UX contracts", () => {
  it("does not report Telegram link creation as a confirmed connection", () => {
    expect(telegramConnectionSource).toContain(
      'setNotice({ type: "info", message: copy.telegramConnectPending });'
    );
    expect(source).not.toContain("telegramConnectSuccess");
    expect(telegramConnectionSource).not.toContain("telegramConnectSuccess");
  });

  it("keeps Telegram pending copy separate from confirmed connected copy", () => {
    Object.values(accountCopy).forEach((copy) => {
      expect(copy.telegramConnectPending).toBeTruthy();
      expect(copy.telegramConnectPending.toLowerCase()).not.toMatch(
        /connected|polaczono|підключено/
      );
      expect(copy.telegramConnected).not.toBe(copy.telegramConnectPending);
    });
  });

  it("keeps operational account details away from regular profile settings", () => {
    expect(source).toContain("canAccessAdminCenter(user?.role)");
    expect(source).toContain("if (!canSeeOperationalDetails)");
    expect(source).toContain("return undefined;");
    expect(source).toContain("const backupsLoading = canSeeOperationalDetails && backups === null");
    expect(source).toContain("{canSeeOperationalDetails && (");
    expect(source).toContain("runtimeLabels.provider");
    expect(source).toContain("{copy.backupsTitle}");
  });

  it("shows Telegram connect entrypoint in the first profile section for existing users", () => {
    expect(profilePageSource).toContain("const TelegramConnectionCard = lazy");
    expect(profilePageSource).toContain("<TelegramConnectionCard />");
    expect(profilePageSource.indexOf("<TelegramConnectionCard />")).toBeLessThan(
      profilePageSource.indexOf("<ProfileSectionTabs")
    );
    expect(telegramConnectionSource).toContain("createTelegramConnectLink");
    expect(telegramConnectionSource).toContain("getRemoteTelegramStatus");
    expect(telegramConnectionSource).toContain("disconnectTelegram");
  });

  it("keeps Telegram connection logic in one canonical profile component", () => {
    expect(source).not.toContain("createTelegramConnectLink");
    expect(source).not.toContain("getRemoteTelegramStatus");
    expect(source).not.toContain("disconnectTelegram");
    expect(telegramConnectionSource).toContain("createTelegramConnectLink");
    expect(telegramConnectionSource).toContain("getRemoteTelegramStatus");
    expect(telegramConnectionSource).toContain("disconnectTelegram");
  });
});
