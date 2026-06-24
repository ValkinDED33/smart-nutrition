export const selectInputValue = (target: EventTarget | null) => {
  const maybeInput = target as
    | {
        querySelector?: (selector: string) => unknown;
        select?: () => void;
      }
    | null;
  const selectable =
    typeof maybeInput?.select === "function"
      ? maybeInput
      : maybeInput?.querySelector?.("input, textarea");

  if (!selectable || typeof (selectable as { select?: () => void }).select !== "function") {
    return;
  }

  globalThis.setTimeout(() => {
    (selectable as { select: () => void }).select();
  }, 0);
};
