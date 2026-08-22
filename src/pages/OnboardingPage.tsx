import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { Baby, HeartPulse, Sparkles, Target, UserRound } from "lucide-react";
import { hasWomenHealthContext } from "@domain/profile/womenHealth";
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
import { AIMasterBlueprintPanel, type AIMasterBlueprintPattern } from "../shared/ui";
import {
  normalizeSelectedGoals,
  stepPaths,
  type OnboardingState,
} from "./onboarding/types";

const ONBOARDING_BLUEPRINT_EYEBROW = "AI setup flow";

const onboardingBlueprintCopy = {
  uk: {
    eyebrow: ONBOARDING_BLUEPRINT_EYEBROW,
    title: "Помічник збирає живий профіль",
    description:
      "Кожен крок анкети одразу впливає на харчування, воду, жіноче здоров'я, мотивацію і майбутні підказки.",
    patterns: {
      assistant: ["Помічник", "Образ, стиль і ім'я без прив'язки назавжди."],
      identity: ["Профіль", "Ім'я, вік і стать для точних норм."],
      women: ["Жіноче здоров'я", "Вагітність, післяпологовий етап і сімейний контекст."],
      goal: ["Ціль", "Калорії, вага і напрям прогресу."],
      motivation: ["Підтримка", "Тригери, тон і стиль мотивації без тиску."],
    },
  },
  pl: {
    eyebrow: ONBOARDING_BLUEPRINT_EYEBROW,
    title: "Asystent składa żywy profil",
    description:
      "Każdy krok ankiety od razu wpływa na jedzenie, wodę, zdrowie kobiet, motywację i przyszłe wskazówki.",
    patterns: {
      assistant: ["Asystent", "Wygląd, styl i imię bez sztywnego przypięcia."],
      identity: ["Profil", "Imię, wiek i płeć dla dokładniejszych norm."],
      women: ["Zdrowie kobiet", "Ciąża, połóg i kontekst rodzinny."],
      goal: ["Cel", "Kalorie, waga i kierunek progresu."],
      motivation: ["Wsparcie", "Wyzwalacze, ton i motywacja bez presji."],
    },
  },
  en: {
    eyebrow: ONBOARDING_BLUEPRINT_EYEBROW,
    title: "The assistant builds a living profile",
    description:
      "Every onboarding step tunes food, water, women health, motivation, and future guidance.",
    patterns: {
      assistant: ["Assistant", "Look, style, and name without locking it forever."],
      identity: ["Profile", "Name, age, and gender for sharper targets."],
      women: ["Women health", "Pregnancy, postpartum, and family context."],
      goal: ["Goal", "Calories, weight, and progress direction."],
      motivation: ["Support", "Triggers, tone, and motivation without pressure."],
    },
  },
} as const;

const OnboardingPage = () => {
  const navigate = useNavigate();
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
      const shouldUseDraftWomenHealth =
        !onboardingCompleted && hasDraft && draft.gender === "female";
      const shouldUseProfileWomenHealth =
        !onboardingCompleted &&
        !shouldUseDraftWomenHealth &&
        (user?.gender === "female" || hasWomenHealthContext(profile.womenHealth));
      const profileDateInputValue = (value: string | null) =>
        value ? value.slice(0, 10) : "";

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
          !onboardingCompleted && hasDraft
            ? draft.gender
            : shouldUseProfileWomenHealth
              ? "female"
              : user?.gender ?? "male",
        womenHealthMode:
          shouldUseDraftWomenHealth
            ? draft.womenHealthMode
            : shouldUseProfileWomenHealth
              ? profile.womenHealth.mode
              : "none",
        pregnancyWeek:
          shouldUseDraftWomenHealth
            ? draft.pregnancyWeek
            : shouldUseProfileWomenHealth
              ? profile.womenHealth.pregnancyWeek
              : null,
        pregnancyDay:
          shouldUseDraftWomenHealth
            ? draft.pregnancyDay
            : shouldUseProfileWomenHealth
              ? profile.womenHealth.pregnancyDay
              : null,
        dueDate:
          shouldUseDraftWomenHealth
            ? draft.dueDate
            : shouldUseProfileWomenHealth
              ? profileDateInputValue(profile.womenHealth.dueDate)
              : "",
        lastPeriodStartDate:
          shouldUseDraftWomenHealth
            ? draft.lastPeriodStartDate
            : shouldUseProfileWomenHealth
              ? profileDateInputValue(profile.womenHealth.lastPeriodStartDate)
              : "",
        doctorConfirmed:
          shouldUseDraftWomenHealth
            ? draft.doctorConfirmed
            : shouldUseProfileWomenHealth
              ? profile.womenHealth.doctorConfirmed
              : false,
        womenHealthNotes:
          shouldUseDraftWomenHealth
            ? draft.womenHealthNotes
            : shouldUseProfileWomenHealth
              ? profile.womenHealth.notes
              : "",
        motherEyeColor:
          shouldUseDraftWomenHealth
            ? draft.motherEyeColor
            : profile.personalDetails.eyeColor,
        partnerEyeColor:
          shouldUseDraftWomenHealth
            ? draft.partnerEyeColor
            : profile.womenHealth.partnerEyeColor,
        motherZodiac:
          shouldUseDraftWomenHealth
            ? draft.motherZodiac
            : profile.womenHealth.motherZodiac,
        fatherZodiac:
          shouldUseDraftWomenHealth
            ? draft.fatherZodiac
            : profile.womenHealth.fatherZodiac,
        motherChineseZodiac:
          shouldUseDraftWomenHealth
            ? draft.motherChineseZodiac
            : profile.womenHealth.motherChineseZodiac,
        fatherChineseZodiac:
          shouldUseDraftWomenHealth
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
        personalizationCompleted:
          !onboardingCompleted && hasDraft ? draft.personalizationCompleted : false,
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
      profile.womenHealth,
      profile.weightHistory,
      user,
    ]
  );
  const hasEditedOnboardingRef = useRef(false);
  const [state, setState] = useState(initialState);
  const updateState = (patch: Partial<OnboardingState>) => {
    hasEditedOnboardingRef.current = true;
    setState((current) => ({ ...current, ...patch }));
  };
  const stepProps = { state, updateState };

  useEffect(() => {
    if (onboardingCompleted || hasEditedOnboardingRef.current) {
      return;
    }

    setState(initialState);
  }, [initialState, onboardingCompleted]);

  useEffect(() => {
    if (onboardingCompleted) {
      return;
    }

    if (!hasEditedOnboardingRef.current && !hasPreAuthOnboardingDraft()) {
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
      pregnancyDay:
        state.gender === "female" &&
        state.womenHealthMode === "pregnant" &&
        state.pregnancyWeek !== null
          ? state.pregnancyDay ?? 0
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
      personalizationCompleted: state.personalizationCompleted,
    });
  }, [appLanguage, onboardingCompleted, state]);

  if (user && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const blueprintCopy =
    appLanguage === "pl"
      ? onboardingBlueprintCopy.pl
      : appLanguage === "en"
        ? onboardingBlueprintCopy.en
        : onboardingBlueprintCopy.uk;
  const onboardingBlueprintPatterns: AIMasterBlueprintPattern[] = [
    {
      key: "assistant",
      label: blueprintCopy.patterns.assistant[0],
      description: blueprintCopy.patterns.assistant[1],
      icon: Sparkles,
      accent: "#22d3ee",
      onClick: () => navigate(stepPaths.assistant),
    },
    {
      key: "identity",
      label: blueprintCopy.patterns.identity[0],
      description: blueprintCopy.patterns.identity[1],
      icon: UserRound,
      accent: "#10b981",
      onClick: () => navigate(stepPaths.name),
    },
    {
      key: "women-health",
      label: blueprintCopy.patterns.women[0],
      description: blueprintCopy.patterns.women[1],
      icon: Baby,
      accent: "#f472b6",
      onClick: () => navigate(stepPaths.womenHealth),
    },
    {
      key: "goal",
      label: blueprintCopy.patterns.goal[0],
      description: blueprintCopy.patterns.goal[1],
      icon: Target,
      accent: "#84cc16",
      onClick: () => navigate(stepPaths.goal),
    },
    {
      key: "motivation",
      label: blueprintCopy.patterns.motivation[0],
      description: blueprintCopy.patterns.motivation[1],
      icon: HeartPulse,
      accent: "#a78bfa",
      onClick: () => navigate(stepPaths.friction),
    },
  ];

  return (
    <>
      <OnboardingGuide state={state} />
      <Box
        data-onboarding-ai-master-blueprint="true"
        sx={{
          display: { xs: "none", lg: "block" },
          width: "min(1180px, calc(100% - 48px))",
          margin: "24px auto 0",
        }}
      >
        <AIMasterBlueprintPanel
          eyebrow={blueprintCopy.eyebrow}
          title={blueprintCopy.title}
          description={blueprintCopy.description}
          patterns={onboardingBlueprintPatterns}
        />
      </Box>
      <Routes>
        <Route index element={<Navigate to={stepPaths.choice} replace />} />
        <Route path="welcome" element={<OnboardingWelcomePage />} />
        <Route path="choice" element={<OnboardingChoicePage {...stepProps} />} />
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
        <Route path="*" element={<Navigate to={stepPaths.choice} replace />} />
      </Routes>
    </>
  );
};

export default OnboardingPage;
