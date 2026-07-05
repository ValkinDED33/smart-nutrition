import type { PhotoMealAnalysis } from "../types/photo";
import { requiresPhotoMealConfirmation, shouldStartWithSuggestionsOnly } from "./photoDraft";

export type PhotoReviewState = "ready" | "review" | "needsDetails";

export const getPhotoReviewState = (analysis: PhotoMealAnalysis): PhotoReviewState => {
  if (shouldStartWithSuggestionsOnly(analysis)) {
    return "needsDetails";
  }

  return requiresPhotoMealConfirmation(analysis) ? "review" : "ready";
};

export const shouldShowPhotoInterpretationChoices = (analysis: PhotoMealAnalysis) =>
  !shouldStartWithSuggestionsOnly(analysis) &&
  Array.isArray(analysis.interpretations) &&
  analysis.interpretations.length > 1;

export const photoMealSaveButtonSx = {
  alignSelf: { xs: "stretch", sm: "flex-start" },
  position: { xs: "sticky", sm: "static" },
  bottom: { xs: 12, sm: "auto" },
  zIndex: 2,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 800,
  background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
} as const;
