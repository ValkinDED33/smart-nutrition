import { describe, expect, it } from "vitest";
import {
  createInitialMealActionFeedbackState,
  createMealActionConfirmedState,
  createMealActionFailedState,
  createMealActionSavingState,
  resolveMealActionNotice,
  type MealActionKind,
  type MealActionFeedbackCopy,
} from "./mealActionFeedbackModel";

const createCopy = (): MealActionFeedbackCopy => ({
  saving: {
    add: "Saving add",
    edit: "Saving edit",
    delete: "Saving delete",
    repeat: "Saving repeat",
    saveTemplate: "Saving template",
    applyTemplate: "Applying template",
    saveProduct: "Saving product",
  },
  confirmed: {
    add: "Confirmed add",
    edit: "Confirmed edit",
    delete: "Confirmed delete",
    repeat: "Confirmed repeat",
    saveTemplate: "Confirmed template",
    applyTemplate: "Confirmed apply",
    saveProduct: "Confirmed product",
  },
  failed: {
    add: "Failed add",
    edit: "Failed edit",
    delete: "Failed delete",
    repeat: "Failed repeat",
    saveTemplate: "Failed template",
    applyTemplate: "Failed apply",
    saveProduct: "Failed product",
  },
  retry: "Retry",
});

describe("mealActionFeedbackModel", () => {
  it("does not show a notice while idle", () => {
    expect(
      resolveMealActionNotice(createInitialMealActionFeedbackState(), createCopy())
    ).toBeNull();
  });

  it("shows action-specific saving and confirmed text", () => {
    const copy = createCopy();

    expect(
      resolveMealActionNotice(createMealActionSavingState("repeat", "repeat-day"), copy)
    ).toEqual({
      severity: "info",
      text: "Saving repeat",
    });
    expect(
      resolveMealActionNotice(
        createMealActionConfirmedState("applyTemplate", "template-1"),
        copy
      )
    ).toEqual({
      severity: "success",
      text: "Confirmed apply",
    });
  });

  it("keeps every supported meal action kind on the same feedback contract", () => {
    const copy = createCopy();
    const actionKinds: MealActionKind[] = [
      "add",
      "edit",
      "delete",
      "repeat",
      "saveTemplate",
      "applyTemplate",
      "saveProduct",
    ];

    actionKinds.forEach((kind) => {
      expect(
        resolveMealActionNotice(createMealActionSavingState(kind, `saving-${kind}`), copy)
      ).toMatchObject({
        severity: "info",
        text: copy.saving[kind],
      });
      expect(
        resolveMealActionNotice(
          createMealActionConfirmedState(kind, `confirmed-${kind}`),
          copy
        )
      ).toMatchObject({
        severity: "success",
        text: copy.confirmed[kind],
      });
      expect(
        resolveMealActionNotice(
          createMealActionFailedState({
            kind,
            actionId: `failed-${kind}`,
            message: "backend sleeping",
          }),
          copy
        )
      ).toMatchObject({
        severity: "warning",
        text: `${copy.failed[kind]} backend sleeping`,
        retryable: true,
      });
    });
  });

  it("keeps failed actions retryable with backend error details", () => {
    expect(
      resolveMealActionNotice(
        createMealActionFailedState({
          kind: "delete",
          actionId: "delete-entry",
          message: "backend sleeping",
        }),
        createCopy()
      )
    ).toEqual({
      severity: "warning",
      text: "Failed delete backend sleeping",
      retryable: true,
    });
  });
});
