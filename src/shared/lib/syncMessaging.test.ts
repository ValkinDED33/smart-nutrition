import { describe, expect, it } from "vitest";
import {
  formatQueuedSyncMessage,
  translateSyncErrorMessage,
} from "./syncMessaging";

describe("syncMessaging", () => {
  it("localizes known sync states", () => {
    expect(formatQueuedSyncMessage(1, "en")).toBe(
      "1 change is waiting for cloud confirmation."
    );
    expect(formatQueuedSyncMessage(3, "uk")).toBe(
      "3 змін очікують підтвердження з хмари."
    );
    expect(
      translateSyncErrorMessage(
        "Cloud data changed on another device. Pull the latest cloud version first.",
        "pl"
      )
    ).toBe(
      "Dane w chmurze zmieniły się na innym urządzeniu. Najpierw pobierz najnowszą wersję z chmury."
    );
  });

  it("does not leak raw backend or provider errors into regular sync UI", () => {
    expect(translateSyncErrorMessage("backend sleeping", "en")).toBe(
      "The latest changes are not confirmed yet. Try the action again in a few seconds."
    );
    expect(translateSyncErrorMessage("Provider unavailable.", "uk")).toBe(
      "Останні зміни поки не підтвердилися. Спробуйте повторити дію за кілька секунд."
    );
    expect(translateSyncErrorMessage("REMOTE_API_UNAVAILABLE", "pl")).toBe(
      "Ostatnie zmiany nie zostały jeszcze potwierdzone. Spróbuj powtórzyć akcję za kilka sekund."
    );
  });
});
