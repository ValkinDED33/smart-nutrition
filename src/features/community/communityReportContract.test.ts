import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

describe("community report contract", () => {
  it("confirms reports only after the moderation inbox accepts them", async () => {
    const source = await readSource("./CommunityHubCard.tsx");
    const reportPostStart = source.indexOf("const reportPost = async");
    const submitIndex = source.indexOf("await submitContentReport", reportPostStart);
    const localStateIndex = source.indexOf(
      "reportCommunityContent({",
      reportPostStart
    );
    const successIndex = source.indexOf("message: copy.reportSent", reportPostStart);

    expect(reportPostStart).toBeGreaterThanOrEqual(0);
    expect(submitIndex).toBeGreaterThan(reportPostStart);
    expect(localStateIndex).toBeGreaterThan(submitIndex);
    expect(successIndex).toBeGreaterThan(localStateIndex);
    expect(source).toContain("copy.reportSyncWarning");
    expect(source).not.toContain(
      "Report was saved in your community state, but the moderation inbox could not be notified."
    );
  });

  it("keeps the mobile community header compact", async () => {
    const source = await readSource("./CommunityHubCard.tsx");

    expect(source).toContain('spacing={{ xs: 1.1, md: 2 }}');
    expect(source).toContain('WebkitLineClamp: { xs: 1, md: "unset" }');
    expect(source).toContain('display: { xs: "none", md: "block" }');
    expect(source).toContain('flexWrap={{ xs: "nowrap", sm: "wrap" }}');
    expect(source).toContain('overflowX: { xs: "auto", sm: "visible" }');
    expect(source).toContain('minHeight: { xs: 38, md: 48 }');
  });
});
