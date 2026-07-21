import { useCallback, useMemo, useRef, useState } from "react";
import {
  createInitialMealActionFeedbackState,
  createMealActionConfirmedState,
  createMealActionFailedState,
  createMealActionSavingState,
  resolveMealActionNotice,
  type MealActionFeedbackCopy,
  type MealActionKind,
} from "./mealActionFeedbackModel";

const getFailedMealActionCopy = (
  copy: MealActionFeedbackCopy,
  kind: MealActionKind
) => {
  switch (kind) {
    case "add":
      return copy.failed.add;
    case "edit":
      return copy.failed.edit;
    case "delete":
      return copy.failed.delete;
    case "repeat":
      return copy.failed.repeat;
    case "saveTemplate":
      return copy.failed.saveTemplate;
    case "applyTemplate":
      return copy.failed.applyTemplate;
    case "saveProduct":
      return copy.failed.saveProduct;
  }
};

export const useMealActionFeedback = (copy: MealActionFeedbackCopy) => {
  const [feedback, setFeedback] = useState(createInitialMealActionFeedbackState);
  const retryActionRef = useRef<(() => Promise<unknown>) | null>(null);

  const notice = useMemo(
    () => resolveMealActionNotice(feedback, copy),
    [copy, feedback]
  );

  const clearFeedback = useCallback(() => {
    retryActionRef.current = null;
    setFeedback(createInitialMealActionFeedbackState());
  }, []);

  const runMealAction = useCallback(
    async ({
      actionId,
      kind,
      action,
    }: {
      actionId: string;
      kind: MealActionKind;
      action: () => Promise<unknown>;
    }) => {
      retryActionRef.current = null;
      setFeedback(createMealActionSavingState(kind, actionId));

      try {
        await action();
        setFeedback(createMealActionConfirmedState(kind, actionId));
        return true;
      } catch {
        retryActionRef.current = action;
        setFeedback(
          createMealActionFailedState({
            kind,
            actionId,
            message: getFailedMealActionCopy(copy, kind),
          })
        );
        return false;
      }
    },
    [copy]
  );

  const retryMealAction = useCallback(async () => {
    const retryAction = retryActionRef.current;

    if (!retryAction || feedback.status !== "failed") {
      return false;
    }

    return runMealAction({
      actionId: feedback.actionId,
      kind: feedback.kind,
      action: retryAction,
    });
  }, [feedback, runMealAction]);

  const isSavingAction = useCallback(
    (actionId: string) =>
      feedback.status === "saving" && feedback.actionId === actionId,
    [feedback]
  );

  return {
    feedback,
    notice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  };
};
