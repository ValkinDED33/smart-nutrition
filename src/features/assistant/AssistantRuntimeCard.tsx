import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
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
  buildAssistantWelcomeMessage,
  clearAssistantRuntimeMemory,
  createAssistantRuntimeContext,
  getAssistantHonestyNote,
  loadAssistantConversationHistory,
  getAssistantModeLabel,
} from "../../shared/lib/assistant/assistantRuntime";
import { useLanguage } from "../../shared/language";
import {
  selectMealItems,
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../meal/selectors";
import { generateNutritionCoachAnalysis } from "../../shared/lib/nutritionCoach";
import { selectDailyMacroTargets } from "../profile/selectors";
import { assistantQuickQuestionIds } from "../../shared/types/assistant";
import type {
  AssistantConversationMessage,
  AssistantQuickQuestionId,
  AssistantRuntimeContext,
  AssistantRuntimeMode,
} from "../../shared/types/assistant";

type ChatMessage = AssistantConversationMessage & {
  mode?: AssistantRuntimeMode;
};

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

const cardCopy = {
  uk: {
    title: "Assistant Runtime",
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
  },
  pl: {
    title: "Assistant Runtime",
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
  const { language } = useLanguage();
  const copy = cardCopy[language];

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

  const context = useMemo<AssistantRuntimeContext>(
    () =>
      createAssistantRuntimeContext({
        language,
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
      }),
    [
      coach,
      coachPrimaryInsight,
      language,
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyReady, setHistoryReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!userId) {
      setMessages([]);
      setHistoryReady(true);
      return () => {
        active = false;
      };
    }

    const welcomeMessage = getWelcomeMessage();

    setHistoryReady(false);
    setError(null);

    void loadAssistantConversationHistory()
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
  }, [userId]);

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
    setMessages((current) => [
      ...current,
      {
        id: createId("user"),
        role: "user",
        text: trimmedQuestion,
      },
    ]);
    setQuestion("");

    try {
      const response = await askAssistantRuntimeQuestion({
        question: trimmedQuestion,
        quickQuestionId: quickQuestionId ?? null,
        context,
      });

      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          text: response.text,
          mode: response.mode,
          followUpQuestionIds: response.followUpQuestionIds,
        },
      ]);
    } catch {
      setError(copy.error);
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
      await clearAssistantRuntimeMemory();
    } finally {
      setMessages([createWelcomeMessage(context)]);
      setLoading(false);
    }
  };

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const latestAssistantMode = latestAssistantMessage?.mode ?? "local-preview";
  const honestyNote = getAssistantHonestyNote(context, latestAssistantMode);
  const followUpQuestionIds =
    latestAssistantMessage?.followUpQuestionIds ??
    (latestAssistantMessage ? assistantQuickQuestionIds : []);

  return (
    <Paper
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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
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

        <Stack spacing={1.2}>
          {messages.length === 0 ? (
            <Typography color="text.secondary">
              {historyReady ? copy.empty : copy.loadingHistory}
            </Typography>
          ) : (
            messages.map((message) => (
              <Paper
                key={message.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  alignSelf: message.role === "user" ? "flex-end" : "stretch",
                  maxWidth: message.role === "user" ? { xs: "100%", md: "78%" } : "100%",
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
                  <Typography color="text.primary">{message.text}</Typography>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>

        {followUpQuestionIds.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.followUpTitle}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {followUpQuestionIds.map((id) => (
                <Chip
                  key={id}
                  clickable
                  disabled={loading || !historyReady}
                  variant="outlined"
                  label={copy.quickQuestions[id]}
                  onClick={() => {
                    void handleAsk(copy.quickQuestions[id], id);
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {error && <Alert severity="warning">{error}</Alert>}

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
