import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Baby, BookOpen, HeartHandshake, MessageCircle, Sparkles, Users } from "lucide-react";
import type { RootState } from "../app/store";
import { CommunityHubCard } from "../features/community/CommunityHubCard";
import { useLanguage } from "../shared/language";
import {
  AIMasterBlueprintPanel,
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
} from "../shared/ui";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";
import type { AppLanguage } from "@shared/types/i18n";

const LearningHubCard = lazy(() =>
  import("../features/education/LearningHubCard").then((module) => ({
    default: module.LearningHubCard,
  }))
);

const COMMUNITY_BLUEPRINT_EYEBROW = "Smart Nutrition Family";

const communityBlueprintCopy = {
  uk: {
    eyebrow: COMMUNITY_BLUEPRINT_EYEBROW,
    title: "Сімейна wellness-система",
    subtitle:
      "Спільнота, сімейний режим, навчання, вагітність, Telegram і підтримка помічника працюють як одна екосистема.",
    family: "Родина",
    familyDescription:
      "Партнерські зв'язки, спільні цілі, вагітність, дитина і сімейна підтримка.",
    community: "Спільнота",
    communityDescription: "Люди, виклики, питання і безпечна підтримка в одному місці.",
    learning: "Навчання",
    learningDescription:
      "Короткі освітні картки пояснюють їжу, звички і контекст здоров'я.",
    assistant: "Помічник",
    assistantDescription: "Запитати того самого працівника проекту, а не окремого бота.",
    pregnancy: "Вагітність",
    pregnancyDescription: "Тижневий розвиток дитини і сімейний контекст для партнера.",
    discovery: "AI-відкриття",
    discoveryDescription:
      "Помічник сам приносить корисні знахідки, щоб користувач не шукав навмання.",
  },
  pl: {
    eyebrow: COMMUNITY_BLUEPRINT_EYEBROW,
    title: "Rodzinny system wellness",
    subtitle:
      "Społeczność, tryb rodzinny, nauka, ciąża, Telegram i wsparcie asystenta działają jako jeden ekosystem.",
    family: "Rodzina",
    familyDescription:
      "Połączenia partnerskie, wspólne cele, ciąża, dziecko i wsparcie rodziny.",
    community: "Społeczność",
    communityDescription: "Ludzie, wyzwania, pytania i bezpieczne wsparcie w jednym miejscu.",
    learning: "Nauka",
    learningDescription:
      "Krótkie karty edukacyjne wyjaśniają jedzenie, nawyki i kontekst zdrowia.",
    assistant: "Asystent",
    assistantDescription: "Zapytaj tego samego pracownika projektu, nie osobnego bota.",
    pregnancy: "Ciąża",
    pregnancyDescription: "Tygodniowy rozwój dziecka i kontekst rodzinny dla partnera.",
    discovery: "AI odkrycia",
    discoveryDescription:
      "Asystent sam przynosi użyteczne obserwacje, zamiast zmuszać do szukania.",
  },
  en: {
    eyebrow: COMMUNITY_BLUEPRINT_EYEBROW,
    title: "Family wellness system",
    subtitle:
      "Community, family mode, learning, pregnancy, Telegram, and assistant support stay connected as one ecosystem.",
    family: "Family",
    familyDescription:
      "Partner links, shared goals, pregnancy, baby, and family support.",
    community: "Community",
    communityDescription: "People, challenges, questions, and safe support in one place.",
    learning: "Learning",
    learningDescription: "Short education cards explain food, habits, and health context.",
    assistant: "Assistant",
    assistantDescription: "Ask the same project worker for help, not a separate bot.",
    pregnancy: "Pregnancy",
    pregnancyDescription: "Weekly baby development and partner-visible family context.",
    discovery: "AI discovery",
    discoveryDescription:
      "The assistant brings useful discoveries instead of making users hunt.",
  },
} as const;

const getCommunityBlueprintCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return communityBlueprintCopy.pl;
    case "en":
      return communityBlueprintCopy.en;
    case "uk":
    default:
      return communityBlueprintCopy.uk;
  }
};

const CommunityPage = () => {
  const navigate = useNavigate();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage, t } = useLanguage();
  const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, "Learning Hub");
  const blueprintCopy = getCommunityBlueprintCopy(appLanguage);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
  const communityBlueprintPatterns = [
    {
      key: "family",
      label: blueprintCopy.family,
      description: blueprintCopy.familyDescription,
      icon: HeartHandshake,
      accent: "#fb7185",
      onClick: () => navigate("/profile#women-health"),
    },
    {
      key: "community",
      label: blueprintCopy.community,
      description: blueprintCopy.communityDescription,
      icon: Users,
      accent: "#22c55e",
      onClick: () => navigate("/community"),
    },
    {
      key: "learning",
      label: blueprintCopy.learning,
      description: blueprintCopy.learningDescription,
      icon: BookOpen,
      accent: "#22d3ee",
      onClick: () => navigate("/community"),
    },
    {
      key: "assistant",
      label: blueprintCopy.assistant,
      description: blueprintCopy.assistantDescription,
      icon: MessageCircle,
      accent: "#a78bfa",
      onClick: () => navigate("/coach"),
    },
    {
      key: "pregnancy",
      label: blueprintCopy.pregnancy,
      description: blueprintCopy.pregnancyDescription,
      icon: Baby,
      accent: "#f59e0b",
      onClick: () => navigate("/profile#women-health"),
    },
    {
      key: "discovery",
      label: blueprintCopy.discovery,
      description: blueprintCopy.discoveryDescription,
      icon: Sparkles,
      accent: "#60a5fa",
      onClick: () => navigate("/dashboard"),
    },
  ];

  return (
    <PageShell
      title={t("page.community.title")}
      subtitle={t("page.community.subtitle")}
      assistantHint={<EcosystemPulse focus="community" />}
    >
      <AIMasterBlueprintPanel
        eyebrow={blueprintCopy.eyebrow}
        title={blueprintCopy.title}
        description={blueprintCopy.subtitle}
        patterns={communityBlueprintPatterns}
        assistantName={assistantDisplayName}
        assistantVariant={assistant.companionKind}
      />
      <CommunityHubCard />
      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey="community:learning-hub"
      >
        <Suspense fallback={<LoadingSkeleton bodyRows={5} />}>
          <LearningHubCard />
        </Suspense>
      </LazyModuleBoundary>
    </PageShell>
  );
};

export default CommunityPage;
