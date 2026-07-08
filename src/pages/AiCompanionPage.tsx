import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { RootState } from "../app/store";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
import { selectDailyMacroTargets } from "../features/profile/selectors";
import { getAssistantRuntimeStatus } from "@shared/api/assistant";
import {
  Companion3DLoadingFallback,
  CompanionAvatar as AssistantAvatar,
  CompanionRenderModeControl,
} from "@features/assistant-3d";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionTabs,
} from "@shared/ui";
import type { AssistantRuntimeStatus } from "@domain/assistant/types";
import { getDaysSince } from "@domain/profile/bodyMetrics";
import {
  buildAssistantCoreSnapshot,
  type AssistantCoreEmotion,
  type AssistantCoreState,
  type AssistantRelationshipLevel,
} from "../core/assistant";
import { useCompanionRenderModePreference } from "../features/profile/useCompanionRenderModePreference";

const AssistantRuntimeCard = lazy(() =>
  import("../features/assistant/AssistantRuntimeCard").then((module) => ({
    default: module.AssistantRuntimeCard,
  }))
);
const NutritionCoachCard = lazy(() =>
  import("../features/meal/NutritionCoachCard").then((module) => ({
    default: module.NutritionCoachCard,
  }))
);
const SmartRecommendations = lazy(() =>
  import("../features/meal/SmartRecommendations").then((module) => ({
    default: module.SmartRecommendations,
  }))
);
const CompanionProgressCard = lazy(() =>
  import("../features/companion").then((module) => ({
    default: module.CompanionProgressCard,
  }))
);

const aiCopy = {
  uk: {
    title: "Помічник",
    subtitle:
      "Особистий companion для харчування, мотивації і щоденного ритму. Він тримає контекст, пам'ятає стиль підтримки і веде до наступної дії.",
    runtimeTitle: "Стан AI",
    runtimeSubtitle:
      "Нижче видно активних провайдерів і резервний маршрут, який використовує асистент.",
    providerChain: "Провайдери AI",
    configured: "Хмарний AI готовий",
    fallbackOn: "Резерв увімкнено",
    fallbackOff: "Без резерву",
    cloudUnavailable:
      "Хмарний AI зараз недоступний. Базові підказки лишаються доступними, але бойовий AI не активний.",
    assistantSettings: "Поведінка помічника береться з налаштувань профілю.",
    renderModeTitle: "Вигляд companion",
    renderMode2d: "Швидкий 2D",
    renderMode3d: "Живий 3D",
    renderModeHint:
      "3D завантажується тільки після вашого вибору. На телефонах і в режимі економії лишається 2D.",
    renderModeLoading: "Завантажую 3D",
    renderModeError: "3D не завантажився, залишив 2D",
    greeting: (name: string) => `Привіт, ${name}. Я вже дивлюся на ваш день.`,
    coreTitle: "Ядро помічника",
    coreSubtitle: "Це не окрема карточка з AI, а поточний стан особистого companion.",
    memoryGoals: "Цілі",
    memoryStruggles: "Що враховувати",
    memoryTriggers: "Як підтримувати",
    emptyMemory: "Після onboarding тут з'явиться більше особистого контексту.",
    relationshipLabels: {
      new_companion: "Новий companion",
      warming_up: "Знайомимось",
      trusted_companion: "Є довіра",
      deep_context: "Глибокий контекст",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Потрібен перший запис",
      hydration_attention: "Фокус на воді",
      protein_attention: "Фокус на білку",
      over_target: "День вище плану",
      weekly_check_in: "Час check-in",
      steady_day: "День стабільний",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Спокійно",
      encouraging: "Підтримую",
      focused: "Зібрано",
      concerned: "М'який контроль",
      celebrating: "Прогрес",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "Що зробити зараз",
    actionButton: "Відкрити",
    noMealTitle: "Додайте перший прийом їжі",
    noMealBody:
      "Почніть з одного продукту або швидкої порції, щоб AI мав реальний контекст дня.",
    waterTitle: (value: number) => `Вода: залишилося ${value} мл`,
    waterBody:
      "Закрийте норму маленькими порціями. Один клік по стакану оновить прогрес.",
    caloriesLowTitle: "Калорій ще мало",
    caloriesLowBody:
      "Додайте простий прийом їжі, щоб не зривати день ввечері.",
    caloriesHighTitle: "Калорії вище плану",
    caloriesHighBody:
      "Подивіться щоденник і зробіть решту дня легшою без різких рішень.",
    profileTitle: "Задайте ціль ваги",
    profileBody:
      "Ціль відкриє шкалу прогресу, точнішу норму води і кращі AI-поради.",
    primary: "Основний",
    backup: "Резерв",
    sections: {
      companion: "Компаньйон",
      progress: "Прогрес",
      memory: "Пам'ять",
      settings: "Налаштування",
    },
  },
  pl: {
    title: "Asystent",
    subtitle:
      "Osobisty companion do jedzenia, motywacji i codziennego rytmu. Trzyma kontekst, pamięta styl wsparcia i prowadzi do kolejnej akcji.",
    runtimeTitle: "Status AI",
    runtimeSubtitle:
      "Niżej widać aktywnych providerów i trasę zapasową, której używa asystent.",
    providerChain: "Providerzy AI",
    configured: "Chmurowy AI gotowy",
    fallbackOn: "Rezerwa aktywna",
    fallbackOff: "Bez rezerwy",
    cloudUnavailable:
      "Chmurowy AI jest teraz niedostępny. Podstawowe wskazówki zostają dostępne, ale produkcyjny AI nie jest aktywny.",
    assistantSettings: "Zachowanie asystenta bierze się z ustawień profilu.",
    renderModeTitle: "Wygląd companion",
    renderMode2d: "Szybki 2D",
    renderMode3d: "Żywy 3D",
    renderModeHint:
      "3D ładuje się dopiero po Twoim wyborze. Na telefonach i w trybie oszczędzania zostaje 2D.",
    renderModeLoading: "Ładuję 3D",
    renderModeError: "3D się nie załadowało, zostaje 2D",
    greeting: (name: string) => `Cześć, ${name}. Już patrzę na Twój dzień.`,
    coreTitle: "Rdzeń asystenta",
    coreSubtitle: "To nie osobna karta z AI, tylko bieżący stan osobistego companion.",
    memoryGoals: "Cele",
    memoryStruggles: "Co brać pod uwagę",
    memoryTriggers: "Jak wspierać",
    emptyMemory: "Po onboardingu pojawi się tu więcej osobistego kontekstu.",
    relationshipLabels: {
      new_companion: "Nowy companion",
      warming_up: "Poznajemy się",
      trusted_companion: "Jest zaufanie",
      deep_context: "Głęboki kontekst",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Potrzebny pierwszy wpis",
      hydration_attention: "Fokus na wodzie",
      protein_attention: "Fokus na białku",
      over_target: "Dzień ponad plan",
      weekly_check_in: "Czas na check-in",
      steady_day: "Dzień stabilny",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Spokojnie",
      encouraging: "Wspieram",
      focused: "Skupienie",
      concerned: "Łagodna kontrola",
      celebrating: "Progres",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "Co zrobić teraz",
    actionButton: "Otwórz",
    noMealTitle: "Dodaj pierwszy posiłek",
    noMealBody:
      "Zacznij od jednego produktu albo szybkiej porcji, żeby AI miało realny kontekst dnia.",
    waterTitle: (value: number) => `Woda: zostało ${value} ml`,
    waterBody:
      "Domknij normę małymi porcjami. Jedno kliknięcie w szklankę aktualizuje progres.",
    caloriesLowTitle: "Kalorii jest jeszcze mało",
    caloriesLowBody:
      "Dodaj prosty posiłek, żeby wieczorem nie nadrabiać chaotycznie.",
    caloriesHighTitle: "Kalorie są ponad plan",
    caloriesHighBody:
      "Sprawdź dziennik i ustaw resztę dnia lżej, bez ostrych skrętów.",
    profileTitle: "Ustaw cel wagi",
    profileBody:
      "Cel odblokuje skalę progresu, dokładniejszą normę wody i lepsze rady AI.",
    primary: "Główny",
    backup: "Zapasowy",
    sections: {
      companion: "Companion",
      progress: "Progres",
      memory: "Pamięć",
      settings: "Ustawienia",
    },
  },
  en: {
    title: "Assistant",
    subtitle:
      "A personal companion for nutrition, motivation, and daily rhythm. It keeps context, remembers your support style, and guides the next action.",
    runtimeTitle: "AI status",
    runtimeSubtitle:
      "Below you can see active providers and the fallback route used by the assistant.",
    providerChain: "AI providers",
    configured: "Cloud AI ready",
    fallbackOn: "Fallback enabled",
    fallbackOff: "No fallback",
    cloudUnavailable:
      "Cloud AI is unavailable right now. Basic guidance remains available, but production AI is not active.",
    assistantSettings: "Assistant behavior comes from your profile settings.",
    renderModeTitle: "Companion view",
    renderMode2d: "Fast 2D",
    renderMode3d: "Live 3D",
    renderModeHint:
      "3D loads only after your choice. Phones and data-saver mode stay in 2D.",
    renderModeLoading: "Loading 3D",
    renderModeError: "3D failed, staying in 2D",
    greeting: (name: string) => `Hi, ${name}. I am already reading your day.`,
    coreTitle: "Assistant Core",
    coreSubtitle: "This is not a separate AI card, but the current state of your personal companion.",
    memoryGoals: "Goals",
    memoryStruggles: "What to account for",
    memoryTriggers: "How to support you",
    emptyMemory: "More personal context will appear here after onboarding.",
    relationshipLabels: {
      new_companion: "New companion",
      warming_up: "Getting to know you",
      trusted_companion: "Trust is forming",
      deep_context: "Deep context",
    } satisfies Record<AssistantRelationshipLevel, string>,
    stateLabels: {
      needs_context: "Needs first log",
      hydration_attention: "Hydration focus",
      protein_attention: "Protein focus",
      over_target: "Day above plan",
      weekly_check_in: "Check-in due",
      steady_day: "Steady day",
    } satisfies Record<AssistantCoreState, string>,
    emotionLabels: {
      calm: "Calm",
      encouraging: "Encouraging",
      focused: "Focused",
      concerned: "Gentle control",
      celebrating: "Progress",
    } satisfies Record<AssistantCoreEmotion, string>,
    focusTitle: "What to do now",
    actionButton: "Open",
    noMealTitle: "Add the first meal",
    noMealBody:
      "Start with one product or quick portion so the assistant has real day context.",
    waterTitle: (value: number) => `Water: ${value} ml left`,
    waterBody:
      "Close the goal in small portions. One tap on a glass updates progress.",
    caloriesLowTitle: "Calories are still low",
    caloriesLowBody:
      "Add a simple meal so the evening does not become chaotic.",
    caloriesHighTitle: "Calories are above plan",
    caloriesHighBody:
      "Review the diary and make the rest of the day lighter without harsh decisions.",
    profileTitle: "Set a target weight",
    profileBody:
      "A target unlocks the progress scale, a better water goal, and sharper assistant guidance.",
    primary: "Primary",
    backup: "Backup",
    sections: {
      companion: "Companion",
      progress: "Progress",
      memory: "Memory",
      settings: "Settings",
    },
  },
} as const;

type AiCompanionSection = "companion" | "progress" | "memory" | "settings";

const AiCompanionPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const todayItems = useSelector(selectTodayMealItems);
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const { appLanguage } = useLanguage();
  const copy = aiCopy[appLanguage];
  const [runtimeStatus, setRuntimeStatus] = useState<AssistantRuntimeStatus | null>(null);
  const [activeSection, setActiveSection] = useState<AiCompanionSection>("companion");
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    copy.sections[activeSection]
  );
  const companionRenderModePreference = useCompanionRenderModePreference();
  const isCompactCompanionStage = useMediaQuery("(max-width: 599.95px)");
  const companionStageSize = isCompactCompanionStage ? 144 : 220;

  useEffect(() => {
    let active = true;

    void getAssistantRuntimeStatus().then((status) => {
      if (active) {
        setRuntimeStatus(status);
      }
    }).catch(() => {
      if (active) {
        setRuntimeStatus(null);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const providers = runtimeStatus?.providers ?? [];
  const calorieTarget = Math.max(profile.dailyCalories, 0);
  const calorieProgress =
    calorieTarget > 0 ? Math.min((todayTotals.calories / calorieTarget) * 100, 120) : 0;
  const remainingWaterMl = Math.max(water.dailyWaterGoal - water.consumedMl, 0);
  const weeklyCheckInDue =
    profile.weeklyCheckIn.enabled &&
    getDaysSince(profile.weeklyCheckIn.lastRecordedAt) >=
      profile.weeklyCheckIn.remindIntervalDays;
  const openMotivationTasks = profile.motivation.activeTasks.filter(
    (task) => !task.completedAt && !task.skippedWithDayOffAt
  ).length;
  const assistantCore = buildAssistantCoreSnapshot({
    userId: user?.id,
    userName: user?.name ?? "",
    goal: profile.goal,
    assistant,
    signals: {
      mealEntriesToday: todayItems.length,
      caloriesConsumed: todayTotals.calories,
      dailyCalories: profile.dailyCalories,
      proteinConsumed: todayTotals.protein,
      proteinTarget: macroTargets.protein,
      waterConsumedMl: water.consumedMl,
      waterTargetMl: water.dailyWaterGoal,
      completedMotivationTasks: profile.motivation.completedTasks,
      openMotivationTasks,
      weeklyCheckInDue,
    },
  });
  const actionCards = [
    ...(todayItems.length === 0
      ? [
          {
            id: "first-meal",
            title: copy.noMealTitle,
            body: copy.noMealBody,
            to: "/meals",
            progress: null,
          },
        ]
      : []),
    ...(remainingWaterMl > 0
      ? [
          {
            id: "water",
            title: copy.waterTitle(remainingWaterMl),
            body: copy.waterBody,
            to: "/progress",
            progress: water.dailyWaterGoal
              ? Math.min((water.consumedMl / water.dailyWaterGoal) * 100, 100)
              : 0,
          },
        ]
      : []),
    ...(calorieTarget > 0 && todayTotals.calories > calorieTarget * 1.08
      ? [
          {
            id: "calories-high",
            title: copy.caloriesHighTitle,
            body: copy.caloriesHighBody,
            to: "/meals",
            progress: Math.min(calorieProgress, 100),
          },
        ]
      : calorieTarget > 0 && todayTotals.calories < calorieTarget * 0.45
        ? [
            {
              id: "calories-low",
              title: copy.caloriesLowTitle,
              body: copy.caloriesLowBody,
              to: "/meals",
              progress: calorieProgress,
            },
          ]
        : []),
    ...(!profile.targetWeight
      ? [
          {
            id: "profile-target",
            title: copy.profileTitle,
            body: copy.profileBody,
            to: "/profile",
            progress: null,
          },
        ]
      : []),
  ].slice(0, 3);
  const memoryGroups = [
    {
      label: copy.memoryGoals,
      items: assistantCore.memory.goals,
    },
    {
      label: copy.memoryStruggles,
      items: assistantCore.memory.struggles,
    },
    {
      label: copy.memoryTriggers,
      items: assistantCore.memory.motivationTriggers,
    },
  ];
  const sections = [
    { id: "companion", label: copy.sections.companion },
    { id: "progress", label: copy.sections.progress },
    { id: "memory", label: copy.sections.memory },
    { id: "settings", label: copy.sections.settings },
  ];

  return (
    <PageShell title={copy.title} subtitle={copy.subtitle}>
      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as AiCompanionSection)}
        ariaLabel="Assistant companion sections"
      />

      {activeSection === "companion" ? (
        <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          color: "white",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.92) 100%)",
        }}
        >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 2.5, md: 3 }}
          alignItems={{ xs: "center", sm: "flex-start" }}
        >
          <Box
            sx={{
              width: companionStageSize,
              height: companionStageSize,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 58%, rgba(163,230,53,0.28), transparent 45%), radial-gradient(circle at 50% 50%, rgba(45,212,191,0.18), transparent 68%)",
              boxShadow:
                "0 26px 70px rgba(15,118,110,0.32), inset 0 0 52px rgba(255,255,255,0.08)",
            }}
          >
            <AssistantAvatar
              name={assistant.name}
              variant={assistant.companionKind}
              size={companionStageSize}
              renderMode={companionRenderModePreference.value}
              loadingFallback={
                <Companion3DLoadingFallback
                  label={copy.renderModeLoading}
                  size={companionStageSize}
                />
              }
              on3dLoadError={companionRenderModePreference.mark3dRuntimeError}
              mood={assistantCore.emotion === "celebrating" ? "celebrate" : "happy"}
              active
            />
          </Box>
          <Stack spacing={1.2} sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
              {assistant.name}
            </Typography>
            <Typography
              component="h2"
              variant="h4"
              sx={{ fontWeight: 900, fontSize: { xs: 38, md: 42 } }}
            >
              {assistant.name}
            </Typography>
            {user && (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 800,
                  overflowWrap: "anywhere",
                }}
              >
                {copy.greeting(user.name)}
              </Typography>
            )}
            <Typography sx={{ color: "rgba(255,255,255,0.84)", overflowWrap: "anywhere" }}>
              {copy.subtitle}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {[
                copy.relationshipLabels[assistantCore.relationshipLevel],
                copy.stateLabels[assistantCore.state],
                copy.emotionLabels[assistantCore.emotion],
              ].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  variant="outlined"
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.26)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
              <Chip
                label={copy.assistantSettings}
                variant="outlined"
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  color: "white",
                  borderColor: "rgba(255,255,255,0.26)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
            </Stack>
            <CompanionRenderModeControl
              value={companionRenderModePreference.value}
              onChange={companionRenderModePreference.changeRenderMode}
              loading={companionRenderModePreference.saving}
              error={companionRenderModePreference.hasError}
              disabled={companionRenderModePreference.saving}
              labels={{
                title: copy.renderModeTitle,
                twoD: copy.renderMode2d,
                threeD: copy.renderMode3d,
                hint: copy.renderModeHint,
                loading: copy.renderModeLoading,
                error: copy.renderModeError,
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {actionCards.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 1,
            border: "1px solid var(--sn-border-soft)",
            backgroundColor: "var(--sn-surface-glass)",
          }}
        >
          <Stack spacing={2}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.focusTitle}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              {actionCards.map((card) => (
                <Paper
                  key={card.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: "rgba(248,250,252,0.88)",
                  }}
                >
                  <Stack spacing={1.2} sx={{ height: "100%" }}>
                    <Typography sx={{ fontWeight: 900 }}>{card.title}</Typography>
                    <Typography color="text.secondary">{card.body}</Typography>
                    {card.progress !== null && (
                      <LinearProgress
                        variant="determinate"
                        value={card.progress}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="outlined"
                      onClick={() => navigate(card.to)}
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      {copy.actionButton}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Paper>
      )}
        </Stack>
      ) : null}

      {activeSection === "memory" ? (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          backgroundColor: "rgba(255,255,255,0.88)",
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.7}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.coreTitle}
            </Typography>
            <Typography color="text.secondary">{copy.coreSubtitle}</Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {memoryGroups.map((group) => (
              <Stack key={group.label} spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>{group.label}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {group.items.length > 0 ? (
                    group.items.map((item) => (
                      <Chip key={item} label={item} variant="outlined" />
                    ))
                  ) : (
                    <Typography color="text.secondary">{copy.emptyMemory}</Typography>
                  )}
                </Stack>
              </Stack>
            ))}
          </Box>
        </Stack>
      </Paper>
      ) : null}

      {activeSection === "settings" ? (
        <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          backgroundColor: "var(--sn-surface-glass)",
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.7}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.runtimeTitle}
            </Typography>
            <Typography color="text.secondary">{copy.runtimeSubtitle}</Typography>
          </Stack>

          {runtimeStatus?.configured ? (
            <>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={copy.configured} color="success" variant="outlined" />
                <Chip
                  label={runtimeStatus.fallbackEnabled ? copy.fallbackOn : copy.fallbackOff}
                  color={runtimeStatus.fallbackEnabled ? "primary" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>{copy.providerChain}</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {providers.map((provider) => (
                    <Paper
                      key={provider.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        borderColor: provider.primary
                          ? "rgba(15,118,110,0.25)"
                          : "rgba(15,23,42,0.08)",
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            color={provider.primary ? "success" : "default"}
                            label={provider.primary ? copy.primary : copy.backup}
                          />
                          <Chip size="small" variant="outlined" label={`#${provider.priority}`} />
                        </Stack>
                        <Typography sx={{ fontWeight: 800 }}>{provider.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {provider.model ?? provider.id}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            </>
          ) : (
            <Alert severity="warning">{copy.cloudUnavailable}</Alert>
          )}
        </Stack>
      </Paper>
          <LazyModuleBoundary
            errorTitle={recoveryCopy.errorTitle}
            errorBody={recoveryCopy.errorBody}
            reloadLabel={recoveryCopy.reloadLabel}
            resetKey="ai-companion:settings-runtime"
          >
            <Suspense fallback={<LoadingSkeleton cards={1} bodyRows={3} />}>
              <AssistantRuntimeCard />
            </Suspense>
          </LazyModuleBoundary>
        </Stack>
      ) : null}

      {activeSection === "progress" ? (
        <LazyModuleBoundary
          errorTitle={recoveryCopy.errorTitle}
          errorBody={recoveryCopy.errorBody}
          reloadLabel={recoveryCopy.reloadLabel}
          resetKey="ai-companion:progress"
        >
          <Suspense fallback={<LoadingSkeleton cards={3} chart bodyRows={3} />}>
            <Stack spacing={2.5}>
              <CompanionProgressCard />
              <SmartRecommendations />
              <NutritionCoachCard />
            </Stack>
          </Suspense>
        </LazyModuleBoundary>
      ) : null}
    </PageShell>
  );
};

export default AiCompanionPage;
