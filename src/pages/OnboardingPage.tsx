import { useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { DEFAULT_ASSISTANT_NAME } from "../core/assistant";
import type { RootState } from "../app/store";
import { OnboardingAgePage } from "./onboarding/OnboardingAgePage";
import { OnboardingAssistantPage } from "./onboarding/OnboardingAssistantPage";
import { OnboardingFinishPage } from "./onboarding/OnboardingFinishPage";
import { OnboardingGenderPage } from "./onboarding/OnboardingGenderPage";
import { OnboardingGoalPage } from "./onboarding/OnboardingGoalPage";
import { OnboardingHeightPage } from "./onboarding/OnboardingHeightPage";
import { OnboardingNamePage } from "./onboarding/OnboardingNamePage";
import { OnboardingWeightPage } from "./onboarding/OnboardingWeightPage";
import { OnboardingWelcomePage } from "./onboarding/OnboardingWelcomePage";
import { stepPaths, type OnboardingState } from "./onboarding/types";

const OnboardingPage = () => {
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const profile = useSelector((rootState: RootState) => rootState.profile);
  const initialState = useMemo<OnboardingState>(
    () => ({
      assistantName: profile.assistant.name || DEFAULT_ASSISTANT_NAME,
      assistantAvatar: profile.assistant.companionKind,
      personality: "supportive",
      name: profile.assistant.onboarding.preferredName || user?.name || "",
      age: user?.age ?? 25,
      gender: user?.gender ?? "male",
      height: user?.height ?? 175,
      goal: user?.goal ?? profile.goal,
      primaryGoalNote: profile.assistant.onboarding.primaryGoalNote,
      mainFriction: profile.assistant.onboarding.mainFriction,
      motivationStyle: profile.assistant.onboarding.motivationStyle,
      supportNote: profile.assistant.onboarding.supportNote,
      weight: user?.weight ?? profile.weightHistory.at(-1)?.weight ?? 70,
    }),
    [
      profile.assistant.name,
      profile.assistant.companionKind,
      profile.assistant.onboarding,
      profile.goal,
      profile.weightHistory,
      user,
    ]
  );
  const [state, setState] = useState(initialState);
  const updateState = (patch: Partial<OnboardingState>) =>
    setState((current) => ({ ...current, ...patch }));
  const stepProps = { state, updateState };

  return (
    <Routes>
      <Route index element={<OnboardingWelcomePage />} />
      <Route path="welcome" element={<OnboardingWelcomePage />} />
      <Route path="assistant" element={<OnboardingAssistantPage {...stepProps} />} />
      <Route path="name" element={<OnboardingNamePage {...stepProps} />} />
      <Route path="age" element={<OnboardingAgePage {...stepProps} />} />
      <Route path="gender" element={<OnboardingGenderPage {...stepProps} />} />
      <Route path="height" element={<OnboardingHeightPage {...stepProps} />} />
      <Route path="goal" element={<OnboardingGoalPage {...stepProps} />} />
      <Route path="weight" element={<OnboardingWeightPage {...stepProps} />} />
      <Route path="finish" element={<OnboardingFinishPage {...stepProps} />} />
      <Route path="friction" element={<Navigate to={stepPaths.goal} replace />} />
      <Route path="motivation" element={<Navigate to={stepPaths.assistant} replace />} />
      <Route path="*" element={<Navigate to={stepPaths.assistant} replace />} />
    </Routes>
  );
};

export default OnboardingPage;
