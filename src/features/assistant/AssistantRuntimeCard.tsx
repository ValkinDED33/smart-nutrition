import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { RootState } from "../../app/store";
import {
  askAssistantRuntimeQuestion,
  buildGuidedAssistantReply,
  buildAssistantWelcomeMessage,
  clearAssistantRuntimeMemory,
  createAssistantRuntimeContext,
  getAssistantHonestyNote,
  loadAssistantConversationHistory,
  saveAssistantConversationHistory,
  getAssistantModeLabel,
} from "@assistant/engine/assistantRuntime";
import { useLanguage } from "../../shared/language";
import {
  selectMealItems,
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../meal/selectors";
import { generateNutritionCoachAnalysis } from "@domain/meal/nutritionCoach";
import { buildDailyContext } from "@domain/meal/dailyContext";
import { selectDailyMacroTargets } from "../profile/selectors";
import { assistantQuickQuestionIds } from "@domain/assistant/types";
import { useAssistantChatStore } from "@features/assistant/model/store";
import type {
  AssistantConversationMessage,
  AssistantQuickQuestionId,
  AssistantRuntimeContext,
} from "@domain/assistant/types";
import {
  assistantSpeechBubbleVariants,
  assistantSpeechStaggerVariants,
  fadeUpVariants,
  pageSectionVariants,
} from "@shared/ui/motion";
import { captureRuntimeEvent } from "@integration/runtime/analytics";
import { resolveAssistantPromptContext } from "./assistantPromptContext";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createWelcomeMessage = (
  context: AssistantRuntimeContext
): AssistantConversationMessage => {
  const welcome = buildAssistantWelcomeMessage(context);

  return {
    id: createId("assistant"),
    role: "assistant",
    text: welcome.text,
    mode: welcome.mode,
    followUpQuestionIds: welcome.followUpQuestionIds,
  };
};

const AssistantMessageMarkdown = ({ text }: { text: string }) => (
  <Box
    sx={{
      color: "text.primary",
      "& p": { m: 0 },
      "& p + p": { mt: 1 },
      "& ul, & ol": { m: 0, pl: 2.4 },
      "& li + li": { mt: 0.4 },
      "& table": {
        width: "100%",
        borderCollapse: "collapse",
        mt: 1,
        overflow: "hidden",
      },
      "& th, & td": {
        border: "1px solid rgba(15, 23, 42, 0.12)",
        px: 1,
        py: 0.7,
        textAlign: "left",
        verticalAlign: "top",
      },
      "& th": { bgcolor: "rgba(15, 118, 110, 0.08)", fontWeight: 800 },
      "& code": {
        px: 0.45,
        py: 0.15,
        borderRadius: 0.5,
        bgcolor: "rgba(15, 23, 42, 0.08)",
        fontFamily: "monospace",
        fontSize: "0.92em",
      },
      "& pre": {
        m: 0,
        mt: 1,
        p: 1.2,
        borderRadius: 1,
        overflowX: "auto",
        bgcolor: "rgba(15, 23, 42, 0.9)",
        color: "white",
      },
      "& pre code": {
        p: 0,
        bgcolor: "transparent",
        color: "inherit",
      },
    }}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
  </Box>
);

const cardCopy = {
  uk: {
    title: "Помічник",
    subtitle:
      "Швидкий діалоговий блок відповідає по калоріях, білку, coach-аналітиці та мотивації на базі ваших поточних даних.",
    inputLabel: "Поставте швидке питання",
    inputPlaceholder: "Наприклад: що мені краще зробити далі сьогодні?",
    ask: "Запитати",
    thinking: "Думаю...",
    loadingHistory: "Підтягуємо попередній діалог...",
    resetConversation: "Новий діалог",
    quickTitle: "Швидкі питання",
    followUpTitle: "Що ще можна уточнити",
    quickQuestions: {
      day_status: "Як виглядає день?",
      protein_help: "Що з білком?",
      water_help: "Що з водою?",
      weight_help: "Що з вагою?",
      next_meal: "Що з'їсти зараз?",
      coach_focus: "Який зараз focus коуча?",
      motivation_focus: "Що з мотивацією?",
    } satisfies Record<AssistantQuickQuestionId, string>,
    empty: "Поставте питання або оберіть один зі швидких варіантів.",
    error: "Не вдалося отримати відповідь. Спробуйте ще раз за секунду.",
    localFallback:
      "Хмарний AI зараз недоступний, тому я відповів з локального контексту.",
  },
  pl: {
    title: "Asystent",
    subtitle:
      "Szybki blok dialogowy odpowiada na podstawie bieżących kalorii, białka, analizy coacha i motywacji.",
    inputLabel: "Zadaj szybkie pytanie",
    inputPlaceholder: "Na przykład: co najlepiej zrobić dalej dzisiaj?",
    ask: "Zapytaj",
    thinking: "Myślę...",
    loadingHistory: "Wczytuję wcześniejszą rozmowę...",
    resetConversation: "Nowa rozmowa",
    quickTitle: "Szybkie pytania",
    followUpTitle: "Co warto dopytać dalej",
    quickQuestions: {
      day_status: "Jak wygląda dzień?",
      protein_help: "Co z białkiem?",
      water_help: "Co z wodą?",
      weight_help: "Co z wagą?",
      next_meal: "Co zjeść teraz?",
      coach_focus: "Jaki jest fokus coacha?",
      motivation_focus: "Co z motywacją?",
    } satisfies Record<AssistantQuickQuestionId, string>,
    empty: "Zadaj pytanie albo wybierz jeden z szybkich wariantów.",
    error: "Nie udało się pobrać odpowiedzi. Spróbuj jeszcze raz za chwilę.",
    localFallback:
      "Chmurowy AI jest teraz niedostępny, więc odpowiedź powstała z lokalnego kontekstu.",
  },
  en: {
    title: "Assistant",
    subtitle:
      "A quick chat block answers from your current calories, protein, coach analysis, and motivation state.",
    inputLabel: "Ask a quick question",
    inputPlaceholder: "For example: what is the best next move today?",
    ask: "Ask",
    thinking: "Thinking...",
    loadingHistory: "Loading previous conversation...",
    resetConversation: "New conversation",
    quickTitle: "Quick questions",
    followUpTitle: "What else to ask",
    quickQuestions: {
      day_status: "How does today look?",
      protein_help: "What about protein?",
      water_help: "What about water?",
      weight_help: "What about weight?",
      next_meal: "What should I eat now?",
      coach_focus: "What is the coach focus?",
      motivation_focus: "What about motivation?",
    } satisfies Record<AssistantQuickQuestionId, string>,
    empty: "Ask a question or choose one of the quick options.",
    error: "Could not get an answer. Try again in a moment.",
    localFallback:
      "Cloud AI is unavailable right now, so I answered from local context.",
  },
} as const;

export const AssistantRuntimeCard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const items = useSelector(selectMealItems);
  const todayItems = useSelector(selectTodayMealItems);
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const { appLanguage } = useLanguage();
  const copy = cardCopy[appLanguage];
  const activeUserId = useAssistantChatStore((state) => state.activeUserId);
  const currentScreen = useAssistantChatStore((state) => state.currentScreen);
  const messages = useAssistantChatStore((state) => state.messages);
  const historyReady = useAssistantChatStore((state) => state.historyReady);
  const setActiveUserId = useAssistantChatStore((state) => state.setActiveUserId);
  const setMessages = useAssistantChatStore((state) => state.setMessages);
  const setHistoryReady = useAssistantChatStore((state) => state.setHistoryReady);
  const resetConversationState = useAssistantChatStore(
    (state) => state.resetConversationState
  );

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coach = useMemo(
    () =>
      generateNutritionCoachAnalysis({
        items,
        dailyCalories: profile.dailyCalories,
        goal: profile.goal,
        dietStyle: profile.dietStyle,
        weight: user?.weight ?? 0,
        weightHistory: profile.weightHistory,
        waterHistory: water.history,
      }),
    [
      items,
      profile.dailyCalories,
      profile.dietStyle,
      profile.goal,
      profile.weightHistory,
      user?.weight,
      water.history,
    ]
  );

  const coachPrimaryInsight = coach.insights[0]?.code ?? "on_track";
  const dailyContext = useMemo(
    () =>
      buildDailyContext({
        items,
        dailyCalories: profile.dailyCalories,
        macroTargets,
        waterConsumedMl: water.consumedMl,
        waterTargetMl: water.dailyWaterGoal,
      }),
    [
      items,
      macroTargets,
      profile.dailyCalories,
      water.consumedMl,
      water.dailyWaterGoal,
    ]
  );

  const context = useMemo<AssistantRuntimeContext>(
    () => {
      const promptContext = resolveAssistantPromptContext(currentScreen.currentPath);

      return createAssistantRuntimeContext({
        language: appLanguage,
        screen: currentScreen.screen,
        currentPath: currentScreen.currentPath,
        promptContext,
        user,
        profile,
        water,
        todayTotals: {
          caloriesConsumed: todayTotals.calories,
          proteinConsumed: todayTotals.protein,
          fatConsumed: todayTotals.fat,
          carbsConsumed: todayTotals.carbs,
        },
        todayMealEntriesCount: todayItems.length,
        macroTargets,
        coach,
        coachPrimaryInsight,
        dailyContext,
      });
    },
    [
      coach,
      coachPrimaryInsight,
      dailyContext,
      appLanguage,
      currentScreen.currentPath,
      currentScreen.screen,
      macroTargets,
      profile,
      todayItems.length,
      todayTotals,
      user,
      water,
    ]
  );
  const getWelcomeMessage = useEffectEvent(() => createWelcomeMessage(context));
  const userId = user?.id ?? null;

  useEffect(() => {
    let active = true;

    if (!userId) {
      resetConversationState();
      return () => {
        active = false;
      };
    }

    if (activeUserId === userId && historyReady) {
      return () => {
        active = false;
      };
    }

    const welcomeMessage = getWelcomeMessage();

    setActiveUserId(userId);
    setHistoryReady(false);

    void loadAssistantConversationHistory(userId)
      .then((history) => {
        if (!active) {
          return;
        }

        setMessages(history.length > 0 ? history : [welcomeMessage]);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setMessages([welcomeMessage]);
      })
      .finally(() => {
        if (active) {
          setHistoryReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [
    activeUserId,
    historyReady,
    resetConversationState,
    setActiveUserId,
    setHistoryReady,
    setMessages,
    userId,
  ]);

  if (!user) {
    return null;
  }

  const handleAsk = async (
    nextQuestion: string,
    quickQuestionId?: AssistantQuickQuestionId
  ) => {
    const trimmedQuestion = nextQuestion.trim();

    if (!trimmedQuestion || loading || !historyReady) {
      return;
    }

    setLoading(true);
    setError(null);
    const userMessage: AssistantConversationMessage = {
      id: createId("user"),
      role: "user",
      text: trimmedQuestion,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    void saveAssistantConversationHistory(nextMessages, userId);
    setQuestion("");

    try {
      const response = await askAssistantRuntimeQuestion({
        question: trimmedQuestion,
        quickQuestionId: quickQuestionId ?? null,
        context,
      });

      const assistantMessage: AssistantConversationMessage = {
        id: createId("assistant"),
        role: "assistant",
        text: response.text,
        mode: response.mode,
        followUpQuestionIds: response.followUpQuestionIds,
      };
      const savedMessages = [...nextMessages, assistantMessage];

      setMessages(savedMessages);
      void saveAssistantConversationHistory(savedMessages, userId);
    } catch {
      const fallback = buildGuidedAssistantReply({
        question: trimmedQuestion,
        quickQuestionId: quickQuestionId ?? null,
        context,
      });
      const assistantMessage: AssistantConversationMessage = {
        id: createId("assistant"),
        role: "assistant",
        text: fallback.text,
        mode: fallback.mode,
        followUpQuestionIds: fallback.followUpQuestionIds,
      };
      const savedMessages = [...nextMessages, assistantMessage];

      setMessages(savedMessages);
      void saveAssistantConversationHistory(savedMessages, userId);
      setError(copy.localFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = async () => {
    if (loading || !historyReady) {
      return;
    }

    setLoading(true);
    setError(null);
    setQuestion("");

    try {
      await clearAssistantRuntimeMemory(userId);
    } finally {
      setMessages([createWelcomeMessage(context)]);
      setLoading(false);
    }
  };

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const latestAssistantMode = latestAssistantMessage?.mode ?? "guided";
  const honestyNote = getAssistantHonestyNote(context, latestAssistantMode);
  const followUpQuestionIds =
    latestAssistantMessage?.followUpQuestionIds ??
    (latestAssistantMessage ? assistantQuickQuestionIds : []);

  const handleFollowUpClick = (id: AssistantQuickQuestionId) => {
    captureRuntimeEvent("assistant_followup_clicked", {
      quickQuestionId: id,
      area: context.promptContext.area,
      screenName: context.promptContext.screenName,
      path: context.currentPath,
      mode: latestAssistantMode,
    });
    void handleAsk(copy.quickQuestions[id], id);
  };

  return (
    <Paper
      component={motion.div}
      layout
      variants={pageSectionVariants}
      initial="initial"
      animate="animate"
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.6}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={getAssistantModeLabel(context, latestAssistantMode)}
              color={latestAssistantMode === "remote-cloud" ? "success" : "default"}
              variant="outlined"
            />
            <Button
              variant="outlined"
              size="small"
              disabled={loading || !historyReady}
              onClick={() => {
                void handleResetConversation();
              }}
              sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
            >
              {copy.resetConversation}
            </Button>
          </Stack>
        </Stack>

        <Alert severity={latestAssistantMode === "remote-cloud" ? "success" : "info"}>
          {honestyNote}
        </Alert>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.quickTitle}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {(Object.keys(copy.quickQuestions) as AssistantQuickQuestionId[]).map((key) => (
              <Chip
                key={key}
                clickable
                disabled={loading || !historyReady}
                label={copy.quickQuestions[key]}
                onClick={() => {
                  void handleAsk(copy.quickQuestions[key], key);
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Stack
          component={motion.div}
          layout
          variants={assistantSpeechStaggerVariants}
          initial="initial"
          animate="animate"
          spacing={1.2}
        >
          {messages.length === 0 ? (
            <Typography component={motion.p} variants={fadeUpVariants} color="text.secondary">
              {historyReady ? copy.empty : copy.loadingHistory}
            </Typography>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <Paper
                  key={message.id}
                  component={motion.div}
                  layout
                  variants={assistantSpeechBubbleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    alignSelf: message.role === "user" ? "flex-end" : "stretch",
                    maxWidth:
                      message.role === "user" ? { xs: "100%", md: "78%" } : "100%",
                    borderColor:
                      message.role === "user"
                        ? "rgba(15, 118, 110, 0.2)"
                        : "rgba(15, 23, 42, 0.08)",
                    background:
                      message.role === "user"
                        ? "linear-gradient(135deg, rgba(240,249,255,0.94) 0%, rgba(236,253,245,0.92) 100%)"
                        : "rgba(248,250,252,0.9)",
                  }}
                >
                  <Stack spacing={0.6}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: message.role === "user" ? "#0f766e" : "#475569",
                      }}
                    >
                      {message.role === "user" ? user.name : profile.assistant.name}
                    </Typography>
                    {message.role === "assistant" ? (
                      <AssistantMessageMarkdown text={message.text} />
                    ) : (
                      <Typography color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                        {message.text}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </AnimatePresence>
          )}
        </Stack>

        <AnimatePresence initial={false}>
          {followUpQuestionIds.length > 0 && (
            <Stack
              key="follow-ups"
              component={motion.div}
              layout
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              spacing={1}
            >
              <Typography sx={{ fontWeight: 700 }}>{copy.followUpTitle}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {followUpQuestionIds.map((id) => (
                  <Chip
                    key={id}
                    clickable
                    disabled={loading || !historyReady}
                    variant="outlined"
                    label={copy.quickQuestions[id]}
                    onClick={() => handleFollowUpClick(id)}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {error && (
            <Box
              key="assistant-runtime-error"
              component={motion.div}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Alert severity="warning">{error}</Alert>
            </Box>
          )}
        </AnimatePresence>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            label={copy.inputLabel}
            placeholder={copy.inputPlaceholder}
            value={question}
            disabled={!historyReady}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleAsk(question);
              }
            }}
            multiline
            minRows={2}
            maxRows={4}
          />
          <Button
            variant="contained"
            disabled={!question.trim() || loading || !historyReady}
            onClick={() => {
              void handleAsk(question);
            }}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              minWidth: 140,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {loading ? copy.thinking : copy.ask}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
