import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import {
  hasPreAuthOnboardingDraft,
  readPreAuthOnboardingDraft,
  writePreAuthOnboardingDraft,
} from "../features/onboarding/model/onboardingDraft";
import { useLanguage } from "../shared/language";
import { OnboardingAgePage } from "./onboarding/OnboardingAgePage";
import { OnboardingAssistantPage } from "./onboarding/OnboardingAssistantPage";
import { OnboardingFinishPage } from "./onboarding/OnboardingFinishPage";
import { OnboardingFrictionPage } from "./onboarding/OnboardingFrictionPage";
import { OnboardingGenderPage } from "./onboarding/OnboardingGenderPage";
import { OnboardingGoalPage } from "./onboarding/OnboardingGoalPage";
import { OnboardingGuide } from "./onboarding/OnboardingGuide";
import { OnboardingHeightPage } from "./onboarding/OnboardingHeightPage";
import { OnboardingMotivationPage } from "./onboarding/OnboardingMotivationPage";
import { OnboardingNamePage } from "./onboarding/OnboardingNamePage";
import { OnboardingWeightPage } from "./onboarding/OnboardingWeightPage";
import { OnboardingWelcomePage } from "./onboarding/OnboardingWelcomePage";
import { OnboardingWomenHealthPage } from "./onboarding/OnboardingWomenHealthPage";
import { OnboardingChoicePage } from "./onboarding/OnboardingChoicePage";
import {
  normalizeSelectedGoals,
  stepPaths,
  type OnboardingState,
} from "./onboarding/types";

const OnboardingPage = () => {
  const user = useSelector((rootState: RootState) => rootState.auth.user);
  const profile = useSelector((rootState: RootState) => rootState.profile);
  const { appLanguage } = useLanguage();
  const onboardingCompleted = Boolean(profile.assistant.onboarding.completedAt);
  const initialState = useMemo<OnboardingState>(
    () => {
      const draft = readPreAuthOnboardingDraft(appLanguage);
      const hasDraft = hasPreAuthOnboardingDraft();
      const profileAssistantName = profile.assistant.name.trim();
      const draftAssistantName = draft.assistantName.trim();
      const preferredName = profile.assistant.onboarding.preferredName.trim();
      const draftUserName = draft.userName.trim();

      return {
        assistantName:
          !onboardingCompleted && hasDraft && draftAssistantName
            ? draftAssistantName
            : profileAssistantName,
        assistantAvatar:
          !onboardingCompleted && hasDraft
            ? draft.assistantAvatar
            : profile.assistant.companionKind,
        personality: "supportive",
        name:
          !onboardingCompleted && hasDraft && draftUserName
            ? draftUserName
            : preferredName || user?.name || "",
        age: !onboardingCompleted && hasDraft ? draft.age : user?.age ?? 25,
        gender:
          !onboardingCompleted && hasDraft ? draft.gender : user?.gender ?? "male",
        womenHealthMode:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.womenHealthMode
            : "none",
        pregnancyWeek:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.pregnancyWeek
            : null,
        dueDate:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.dueDate
            : "",
        lastPeriodStartDate:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.lastPeriodStartDate
            : "",
        doctorConfirmed:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.doctorConfirmed
            : false,
        womenHealthNotes:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.womenHealthNotes
            : "",
        motherEyeColor:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.motherEyeColor
            : profile.personalDetails.eyeColor,
        partnerEyeColor:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.partnerEyeColor
            : profile.womenHealth.partnerEyeColor,
        motherZodiac:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.motherZodiac
            : profile.womenHealth.motherZodiac,
        fatherZodiac:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.fatherZodiac
            : profile.womenHealth.fatherZodiac,
        motherChineseZodiac:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.motherChineseZodiac
            : profile.womenHealth.motherChineseZodiac,
        fatherChineseZodiac:
          !onboardingCompleted && hasDraft && draft.gender === "female"
            ? draft.fatherChineseZodiac
            : profile.womenHealth.fatherChineseZodiac,
        height: !onboardingCompleted && hasDraft ? draft.height : user?.height ?? 175,
        goal:
          !onboardingCompleted && hasDraft
            ? draft.goal
            : user?.goal ?? profile.goal ?? "maintain",
        selectedGoals: normalizeSelectedGoals(
          !onboardingCompleted && hasDraft
            ? draft.selectedGoals
            : profile.assistant.onboarding.goalSelections.length > 0
              ? profile.assistant.onboarding.goalSelections
              : [
                  profile.assistant.onboarding.primaryGoalNote === "healthy"
                    ? "healthy"
                    : (user?.goal ?? profile.goal ?? "maintain"),
                ]
        ),
        primaryGoalNote:
          !onboardingCompleted && hasDraft
            ? draft.primaryGoalNote
            : profile.assistant.onboarding.primaryGoalNote,
        mainFriction:
          !onboardingCompleted && hasDraft
            ? draft.mainFriction
            : profile.assistant.onboarding.mainFriction,
        mainFrictions:
          !onboardingCompleted && hasDraft
            ? draft.mainFrictions
            : profile.assistant.onboarding.mainFrictions.filter(
                (friction) => friction !== "unknown"
              ),
        motivationStyle:
          !onboardingCompleted && hasDraft
            ? draft.motivationStyle
            : profile.assistant.onboarding.motivationStyle,
        motivationStyles:
          !onboardingCompleted && hasDraft
            ? draft.motivationStyles
            : profile.assistant.onboarding.motivationStyles,
        supportNote:
          !onboardingCompleted && hasDraft
            ? draft.supportNote
            : profile.assistant.onboarding.supportNote,
        weight: !onboardingCompleted && hasDraft
          ? draft.weight
          : user?.weight ?? profile.weightHistory.at(-1)?.weight ?? 70,
      };
    },
    [
      appLanguage,
      onboardingCompleted,
      profile.assistant.name,
      profile.assistant.companionKind,
      profile.assistant.onboarding,
      profile.goal,
      profile.personalDetails.eyeColor,
      profile.womenHealth.fatherChineseZodiac,
      profile.womenHealth.fatherZodiac,
      profile.womenHealth.motherChineseZodiac,
      profile.womenHealth.motherZodiac,
      profile.womenHealth.partnerEyeColor,
      profile.weightHistory,
      user,
    ]
  );
  const [state, setState] = useState(initialState);
  const updateState = (patch: Partial<OnboardingState>) =>
    setState((current) => ({ ...current, ...patch }));
  const stepProps = { state, updateState };

  useEffect(() => {
    if (onboardingCompleted) {
      return;
    }

    writePreAuthOnboardingDraft({
      language: appLanguage,
      assistantName: state.assistantName.trim(),
      assistantAvatar: state.assistantAvatar,
      assistantPersonality:
        state.personality === "strict"
          ? "focused"
          : state.personality === "energetic"
            ? "playful"
            : state.personality === "supportive"
              ? "gentle"
              : state.personality,
      userName: state.name.trim(),
      age: state.age,
      gender: state.gender,
      womenHealthMode: state.gender === "female" ? state.womenHealthMode : "none",
      pregnancyWeek:
        state.gender === "female" && state.womenHealthMode === "pregnant"
          ? state.pregnancyWeek
          : null,
      dueDate:
        state.gender === "female" && state.womenHealthMode === "pregnant"
          ? state.dueDate
          : "",
      lastPeriodStartDate:
        state.gender === "female" &&
        (state.womenHealthMode === "pregnant" ||
          state.womenHealthMode === "trying_to_conceive")
          ? state.lastPeriodStartDate
          : "",
      doctorConfirmed:
        state.gender === "female" &&
        (state.womenHealthMode === "pregnant" ||
          state.womenHealthMode === "trying_to_conceive")
          ? state.doctorConfirmed
          : false,
      womenHealthNotes: state.gender === "female" ? state.womenHealthNotes : "",
      motherEyeColor: state.gender === "female" ? state.motherEyeColor : "unknown",
      partnerEyeColor: state.gender === "female" ? state.partnerEyeColor : "unknown",
      motherZodiac: state.gender === "female" ? state.motherZodiac : "unknown",
      fatherZodiac: state.gender === "female" ? state.fatherZodiac : "unknown",
      motherChineseZodiac:
        state.gender === "female" ? state.motherChineseZodiac : "unknown",
      fatherChineseZodiac:
        state.gender === "female" ? state.fatherChineseZodiac : "unknown",
      height: state.height,
      weight: state.weight,
      goal: state.goal,
      selectedGoals: state.selectedGoals,
      primaryGoalNote: state.primaryGoalNote,
      mainFriction: state.mainFriction,
      mainFrictions: state.mainFrictions,
      motivationStyle: state.motivationStyle,
      motivationStyles: state.motivationStyles,
      supportNote: state.supportNote,
    });
  }, [appLanguage, onboardingCompleted, state]);

  if (user && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <OnboardingGuide state={state} />
      <Routes>
        <Route index element={<Navigate to={stepPaths.choice} replace />} />
        <Route path="welcome" element={<OnboardingWelcomePage />} />
        <Route path="choice" element={<OnboardingChoicePage />} />
        <Route path="assistant" element={<OnboardingAssistantPage {...stepProps} />} />
        <Route path="name" element={<OnboardingNamePage {...stepProps} />} />
        <Route path="age" element={<OnboardingAgePage {...stepProps} />} />
        <Route path="gender" element={<OnboardingGenderPage {...stepProps} />} />
        <Route path="women-health" element={<OnboardingWomenHealthPage {...stepProps} />} />
        <Route path="height" element={<OnboardingHeightPage {...stepProps} />} />
        <Route path="goal" element={<OnboardingGoalPage {...stepProps} />} />
        <Route path="weight" element={<OnboardingWeightPage {...stepProps} />} />
        <Route path="friction" element={<OnboardingFrictionPage {...stepProps} />} />
        <Route path="motivation" element={<OnboardingMotivationPage {...stepProps} />} />
        <Route path="finish" element={<OnboardingFinishPage {...stepProps} />} />
        <Route path="*" element={<Navigate to={stepPaths.assistant} replace />} />
      </Routes>
    </>
  );
};

export default OnboardingPage;
