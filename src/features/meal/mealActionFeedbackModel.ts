export type MealActionKind =
  | "add"
  | "edit"
  | "delete"
  | "repeat"
  | "saveTemplate"
  | "applyTemplate"
  | "saveProduct";

export type MealActionFeedbackState =
  | { status: "idle" }
  | { status: "saving"; actionId: string; kind: MealActionKind }
  | { status: "confirmed"; actionId: string; kind: MealActionKind }
  | {
      status: "failed";
      actionId: string;
      kind: MealActionKind;
      message: string;
    };

export interface MealActionNotice {
  severity: "info" | "success" | "warning";
  text: string;
  retryable?: boolean;
}

export type MealActionFeedbackCopy = {
  saving: Record<MealActionKind, string>;
  confirmed: Record<MealActionKind, string>;
  failed: Record<MealActionKind, string>;
  retry: string;
};

export const createInitialMealActionFeedbackState = (): MealActionFeedbackState => ({
  status: "idle",
});

export const createMealActionSavingState = (
  kind: MealActionKind,
  actionId: string
): MealActionFeedbackState => ({
  status: "saving",
  kind,
  actionId,
});

export const createMealActionConfirmedState = (
  kind: MealActionKind,
  actionId: string
): MealActionFeedbackState => ({
  status: "confirmed",
  kind,
  actionId,
});

export const createMealActionFailedState = ({
  kind,
  actionId,
  message,
}: {
  kind: MealActionKind;
  actionId: string;
  message: string;
}): MealActionFeedbackState => ({
  status: "failed",
  kind,
  actionId,
  message,
});

export const resolveMealActionNotice = (
  state: MealActionFeedbackState,
  copy: MealActionFeedbackCopy
): MealActionNotice | null => {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "saving") {
    return {
      severity: "info",
      text: copy.saving[state.kind],
    };
  }

  if (state.status === "confirmed") {
    return {
      severity: "success",
      text: copy.confirmed[state.kind],
    };
  }

  return {
    severity: "warning",
    text: `${copy.failed[state.kind]} ${copy.retry}`,
    retryable: true,
  };
};
