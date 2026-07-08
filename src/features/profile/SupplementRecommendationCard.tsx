import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { BellPlus, ChevronDown, Sparkles } from "lucide-react";
import type { RootState } from "@app/store";
import { selectTodayMealItems } from "@features/meal/selectors";
import { createRemoteReminder } from "@shared/api/reminders";
import { getLocalDateKey } from "@shared/lib/date";
import { useLanguage } from "@shared/language";
import { SectionCard } from "@shared/ui";
import {
  buildSupplementRecommendations,
  getPrimarySupplementRecommendation,
  type SupplementRecommendation,
} from "./supplementRecommendationModel";
import { dispatchReminderUpserted } from "./reminderEvents";

const supplementCardCopy = {
  uk: {
    title: "Wellness-оператор добавок",
    subtitle:
      "Асистент зв'язує добавки з їжею, водою, сном, кофеїном і нагадуваннями. Це не медичне призначення.",
    primary: "Зараз найважливіше",
    why: "Чому",
    context: "Що я врахував",
    blockers: "Взаємодії",
    examples: "UX-приклади",
    deeper: "Глибше",
    createReminder: "Створити нагадування",
    creating: "Створюю...",
    created: "Нагадування створено.",
    createError: "Не вдалося створити нагадування. Спробуйте ще раз.",
    noBlockers: "Критичних взаємодій у видимому контексті немає.",
    confidence: {
      high: "висока впевненість",
      medium: "потрібно перевірити",
      low: "бракує даних",
    },
    safeNote:
      "Дози, ліки, вагітність і симптоми завжди перевіряються з лікарем. Я допомагаю з контекстом і рутиною.",
  },
  pl: {
    title: "Operator suplementów",
    subtitle:
      "Asystent łączy suplementy z jedzeniem, wodą, snem, kofeiną i przypomnieniami. To nie jest zalecenie medyczne.",
    primary: "Najważniejsze teraz",
    why: "Dlaczego",
    context: "Co uwzględniam",
    blockers: "Interakcje",
    examples: "Przykłady UX",
    deeper: "Głębiej",
    createReminder: "Utwórz przypomnienie",
    creating: "Tworzę...",
    created: "Przypomnienie utworzone.",
    createError: "Nie udało się utworzyć przypomnienia. Spróbuj ponownie.",
    noBlockers: "Nie widzę krytycznych interakcji w dostępnym kontekście.",
    confidence: {
      high: "wysoka pewność",
      medium: "warto sprawdzić",
      low: "brakuje danych",
    },
    safeNote:
      "Dawki, leki, ciąża i objawy zawsze wymagają konsultacji z lekarzem. Pomagam z kontekstem i rutyną.",
  },
  en: {
    title: "Supplement wellness operator",
    subtitle:
      "The assistant connects supplements with meals, water, sleep, caffeine, and reminders. This is not medical prescribing.",
    primary: "Most important now",
    why: "Why",
    context: "Context used",
    blockers: "Interactions",
    examples: "UX examples",
    deeper: "Deeper",
    createReminder: "Create reminder",
    creating: "Creating...",
    created: "Reminder created.",
    createError: "Could not create the reminder. Try again.",
    noBlockers: "No critical interactions are visible in the current context.",
    confidence: {
      high: "high confidence",
      medium: "check first",
      low: "missing data",
    },
    safeNote:
      "Doses, medication, pregnancy, and symptoms must be checked with a clinician. I help with context and routine.",
  },
} as const;

const confidenceColor = {
  high: "success",
  medium: "warning",
  low: "info",
} as const;

const formatSurfaceLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const RecommendationPanel = ({
  item,
  copy,
  onCreateReminder,
  creatingId,
}: {
  item: SupplementRecommendation;
  copy: (typeof supplementCardCopy)[keyof typeof supplementCardCopy];
  onCreateReminder: (item: SupplementRecommendation) => void;
  creatingId: string | null;
}) => (
  <Box
    sx={{
      p: 2,
      border: "1px solid var(--sn-border-soft)",
      borderRadius: 1,
      bgcolor: "var(--sn-surface-elevated)",
    }}
  >
    <Stack spacing={1.2}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        <Chip label={item.title} color="primary" />
        <Chip label={item.timing} variant="outlined" />
        <Chip
          label={copy.confidence[item.confidence]}
          color={confidenceColor[item.confidence]}
          variant="outlined"
        />
      </Stack>

      <Typography sx={{ fontWeight: 900 }}>{item.action}</Typography>
      <Typography color="text.secondary">{item.assistantReasoning}</Typography>

      <Box>
        <Typography sx={{ fontWeight: 800 }}>{copy.why}</Typography>
        <Typography color="text.secondary">{item.why}</Typography>
      </Box>

      <Stack spacing={0.8}>
        <Typography sx={{ fontWeight: 800 }}>{copy.context}</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {item.context.map((contextLine) => (
            <Chip key={contextLine} label={contextLine} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>

      <Alert severity={item.blockers.length > 0 ? "warning" : "info"}>
        <Typography sx={{ fontWeight: 800 }}>{copy.blockers}</Typography>
        <Stack spacing={0.4} sx={{ mt: 0.5 }}>
          {(item.blockers.length > 0 ? item.blockers : [copy.noBlockers]).map((blocker) => (
            <Typography key={blocker} variant="body2">
              {blocker}
            </Typography>
          ))}
        </Stack>
      </Alert>

      <Box component="details">
        <Box
          component="summary"
          sx={{
            cursor: "pointer",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 0.6,
          }}
        >
          <ChevronDown size={16} />
          {copy.deeper}
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {item.deeperExplanation}
        </Typography>
      </Box>

      <Box component="details">
        <Box
          component="summary"
          sx={{
            cursor: "pointer",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 0.6,
          }}
        >
          <Sparkles size={16} />
          {copy.examples}
        </Box>
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {Object.entries(item.surfaces).map(([surface, text]) => (
            <Typography key={surface} variant="body2" color="text.secondary">
              <strong>{formatSurfaceLabel(surface)}:</strong> {text}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Button
        variant="contained"
        startIcon={<BellPlus size={18} />}
        disabled={creatingId === item.id}
        onClick={() => onCreateReminder(item)}
        sx={{
          alignSelf: { xs: "stretch", sm: "flex-start" },
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
        }}
      >
        {creatingId === item.id ? copy.creating : copy.createReminder}
      </Button>
    </Stack>
  </Box>
);

export const SupplementRecommendationCard = () => {
  const { appLanguage } = useLanguage();
  const copy = supplementCardCopy[appLanguage];
  const meals = useSelector(selectTodayMealItems);
  const { dietStyle, allergies, excludedIngredients, womenHealth } = useSelector(
    (state: RootState) => state.profile
  );
  const water = useSelector((state: RootState) => state.water);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(
    null
  );
  const todayKey = getLocalDateKey(new Date());
  const waterConsumedMl = water.lastLoggedOn === todayKey ? water.consumedMl : 0;
  const recommendations = useMemo(
    () =>
      buildSupplementRecommendations({
        meals,
        waterConsumedMl,
        waterTargetMl: water.dailyWaterGoal,
        dietStyle,
        allergies,
        excludedIngredients,
        womenHealth,
      }),
    [
      allergies,
      dietStyle,
      excludedIngredients,
      meals,
      water.dailyWaterGoal,
      waterConsumedMl,
      womenHealth,
    ]
  );
  const primary = getPrimarySupplementRecommendation(recommendations);
  const secondary = recommendations
    .filter((item) => item.id !== primary?.id)
    .slice(0, 3);

  const handleCreateReminder = async (item: SupplementRecommendation) => {
    setCreatingId(item.id);
    setNotice(null);

    try {
      const reminder = await createRemoteReminder(item.reminder);
      dispatchReminderUpserted(reminder);
      setNotice({ severity: "success", text: copy.created });
    } catch {
      setNotice({ severity: "error", text: copy.createError });
    } finally {
      setCreatingId(null);
    }
  };

  if (!primary) {
    return null;
  }

  return (
    <SectionCard title={copy.title} description={copy.subtitle} tone="info">
      <Stack spacing={2}>
        {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
        <Alert severity="info">{copy.safeNote}</Alert>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 900 }}>{copy.primary}</Typography>
          <RecommendationPanel
            item={primary}
            copy={copy}
            onCreateReminder={(item) => {
              void handleCreateReminder(item);
            }}
            creatingId={creatingId}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
            gap: 1.2,
          }}
        >
          {secondary.map((item) => (
            <RecommendationPanel
              key={item.id}
              item={item}
              copy={copy}
              onCreateReminder={(recommendation) => {
                void handleCreateReminder(recommendation);
              }}
              creatingId={creatingId}
            />
          ))}
        </Box>
      </Stack>
    </SectionCard>
  );
};

export default SupplementRecommendationCard;
