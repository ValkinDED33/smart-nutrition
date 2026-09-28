import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AssistantAvatar } from "./AssistantAvatar";

const renderAvatar = (props: Record<string, unknown>) =>
  renderToStaticMarkup(
    AssistantAvatar({
      name: "Smart",
      size: 120,
      active: true,
      ...props,
    } as never)
  );

describe("AssistantAvatar robot rendering", () => {
  it("renders a full-body robot with visor, ears, arms and heart core", () => {
    const html = renderAvatar({ variant: "robot" });

    expect(html).toContain('data-assistant-avatar-robot-fullbody="true"');
    expect(html).toContain('data-assistant-avatar-robot-shell="true"');
    expect(html).toContain('data-assistant-avatar-robot-headset="true"');
    expect(html).toContain('data-assistant-avatar-robot-arms="true"');
    expect(html).toContain('data-assistant-avatar-heart-core="true"');
    expect(html).toContain('data-assistant-avatar-living-aura="true"');
  });

  it("keeps premium robot skins themed through the shared skin palettes", () => {
    const premium = renderAvatar({ variant: "robot_cosmos" });
    const classic = renderAvatar({ variant: "robot" });

    expect(premium).toContain("129,140,248");
    expect(premium).not.toBe(classic);
  });

  it("keeps animal companions on the animal avatar path", () => {
    const panda = renderAvatar({ variant: "panda" });

    expect(panda).not.toContain('data-assistant-avatar-robot-fullbody="true"');
  });
});
