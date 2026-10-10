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
    expect(profilePageSource).toContain('data-telegram-entrypoint="true"');
    expect(profilePageSource).toContain("copy.telegramEntryAction");
    expect(profilePageSource).toContain('to="/profile#telegram-connect"');
    expect(telegramConnectionSource).toContain('id="telegram-connect"');
    expect(profilePageSource).toContain("<TelegramConnectionCard />");
    expect(profilePageSource.indexOf("<TelegramConnectionCard />")).toBeLessThan(
      profilePageSource.indexOf("<ProfileSectionTabs")
    );
    expect(telegramConnectionSource).toContain("createTelegramConnectLink");
    expect(telegramConnectionSource).toContain("getRemoteTelegramStatus");
    expect(telegramConnectionSource).toContain("disconnectTelegram");
  });

  it("keeps the profile landing header compact on mobile", () => {
    const sectionTabsSource = readFileSync(
      path.join(__dirname, "ProfileSectionTabs.tsx"),
      "utf8"
    );

    expect(profilePageSource).toContain("p: { xs: 1.25, md: 4 }");
    expect(profilePageSource).toContain("width: { xs: 56, md: 84 }");
    expect(profilePageSource).toContain('flexWrap={{ xs: "nowrap", sm: "wrap" }}');
    expect(profilePageSource).toContain('overflowX: { xs: "auto", sm: "visible" }');
    expect(profilePageSource).toContain('direction={{ xs: "row", sm: "row" }}');
    expect(profilePageSource).toContain('display: { xs: "none", md: "block" }');
    expect(sectionTabsSource).toContain("spacing={{ xs: 1.25, md: 2.5 }}");
  });

  it("keeps profile section navigation before the profile AI blueprint", () => {
    const tabsIndex = profilePageSource.indexOf("<ProfileSectionTabs");
    const blueprintIndex = profilePageSource.indexOf("<AIMasterBlueprintPanel");

    expect(tabsIndex).toBeGreaterThan(-1);
    expect(blueprintIndex).toBeGreaterThan(tabsIndex);
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
