import { useMemo, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Bot, ChevronDown, Droplets, Lightbulb, Sparkles, Utensils } from "lucide-react";
import type { DailyContext } from "./dailyContext";
import type {
  AssistantHomeAction,
  AssistantHomeIntelligence,
} from "./assistantHomeIntelligence";
import {
  buildAIDiscoveryCards,
  buildAIDiscoveryTimeline,
  type AIDiscoveryTimelineItem,
} from "./aiDiscoveryCardsModel";
import { useLanguage } from "../../shared/language";

interface AIDiscoveryCardsProps {
  context: DailyContext;
  intelligence: AssistantHomeIntelligence;
  onRunAction: (action: AssistantHomeAction) => void;
}

const toneColor = {
  focus: "#0f766e",
  care: "#b45309",
  celebrate: "#4d7c0f",
} as const;

const toneBackground = {
  focus:
    "linear-gradient(135deg, rgba(20,184,166,0.14), rgba(14,165,233,0.08))",
  care:
    "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(20,184,166,0.08))",
  celebrate:
    "linear-gradient(135deg, rgba(132,204,22,0.18), rgba(20,184,166,0.1))",
} as const;

const timelineToneColor = {
  food: "#0f766e",
  ai: "#2563eb",
  water: "#0284c7",
  action: "#4d7c0f",
} as const;

const SN_BORDER_SOFT = "var(--sn-border-soft)";

const copy = {
  uk: {
    title: "Живі AI-картки",
    subtitle: "День розгортається як історія: дані, спостереження і одна дія.",
    expand: "Розгорнути",
    collapse: "Згорнути",
    timelineTitle: "AI-історія дня",
  },
  pl: {
    title: "Żywe karty AI",
    subtitle: "Dzień rozwija się jak historia: dane, obserwacja i jeden krok.",
    expand: "Rozwiń",
    collapse: "Zwiń",
    timelineTitle: "AI-historia dnia",
  },
  en: {
    title: "Living AI cards",
    subtitle: "The day unfolds as a story: data, an observation, and one action.",
    expand: "Expand",
    collapse: "Collapse",
    timelineTitle: "AI day story",
  },
} as const;

const getCopy = (language: keyof typeof copy) => {
  switch (language) {
    case "pl":
      return copy.pl;
    case "en":
      return copy.en;
    case "uk":
    default:
      return copy.uk;
  }
};

const getTimelineIcon = (item: AIDiscoveryTimelineItem) => {
  switch (item.tone) {
    case "food":
      return <Utensils size={17} aria-hidden="true" />;
    case "water":
      return <Droplets size={17} aria-hidden="true" />;
    case "action":
      return <Lightbulb size={17} aria-hidden="true" />;
    case "ai":
    default:
      return <Bot size={17} aria-hidden="true" />;
  }
};

export const AIDiscoveryCards = ({
  context,
  intelligence,
  onRunAction,
}: AIDiscoveryCardsProps) => {
  const { appLanguage } = useLanguage();
  const text = getCopy(appLanguage);
  const cards = useMemo(
    () =>
      buildAIDiscoveryCards({
        context,
        language: appLanguage,
        primaryAction: intelligence.primaryAction,
        secondaryActions: intelligence.secondaryActions,
      }),
    [appLanguage, context, intelligence.primaryAction, intelligence.secondaryActions]
  );
  const timeline = useMemo(
    () =>
      buildAIDiscoveryTimeline({
        context,
        language: appLanguage,
        primaryAction: intelligence.primaryAction,
      }),
    [appLanguage, context, intelligence.primaryAction]
  );
  const [expandedId, setExpandedId] = useState(cards[0]?.id ?? "");

  if (cards.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.45, md: 1.8 },
        borderRadius: 1,
        border: `1px solid ${SN_BORDER_SOFT}`,
        background:
          "linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
        boxShadow: "var(--sn-shadow-soft)",
        overflow: "hidden",
      }}
    >
      <Stack spacing={1.35}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#07111f",
              background: "linear-gradient(135deg, #a3e635, #22d3ee)",
            }}
          >
            <Sparkles size={17} aria-hidden="true" />
          </Box>
          <Stack spacing={0.15} minWidth={0}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 950 }}>
              {text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.45 }}>
              {text.subtitle}
            </Typography>
          </Stack>
        </Stack>

        <Box
          aria-label={text.timelineTitle}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {timeline.map((item, index) => {
            const accent = timelineToneColor[item.tone];
            const isAction = Boolean(item.action);

            return (
              <Paper
                key={item.id}
                component={isAction ? "button" : "article"}
                type={isAction ? "button" : undefined}
                onClick={item.action ? () => onRunAction(item.action as AssistantHomeAction) : undefined}
                variant="outlined"
                sx={{
                  position: "relative",
                  minHeight: 158,
                  p: 1.25,
                  borderRadius: 1,
                  textAlign: "left",
                  color: "text.primary",
                  borderColor: SN_BORDER_SOFT,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.72), var(--sn-surface-glass))",
                  overflow: "hidden",
                  cursor: isAction ? "pointer" : "default",
                  transition: "transform 160ms ease, border-color 160ms ease",
                  "&:hover": isAction
                    ? {
                        transform: "translateY(-1px)",
                        borderColor: accent,
                      }
                    : undefined,
                  "&:focus-visible": {
                    outline: `2px solid ${accent}`,
                    outlineOffset: 2,
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: { xs: 23, sm: "auto" },
                    right: { xs: "auto", sm: -12 },
                    top: { xs: "auto", sm: 33 },
                    bottom: { xs: -12, sm: "auto" },
                    width: { xs: 2, sm: 24 },
                    height: { xs: 24, sm: 2 },
                    backgroundColor:
                      index === timeline.length - 1 ? "transparent" : SN_BORDER_SOFT,
                  },
                }}
              >
                <Stack spacing={0.85} sx={{ height: "100%" }}>
                  <Stack direction="row" spacing={0.85} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color: "#ffffff",
                        bgcolor: accent,
                        boxShadow: `0 10px 24px ${accent}33`,
                      }}
                    >
                      {getTimelineIcon(item)}
                    </Box>
                    <Stack spacing={0.2} minWidth={0}>
                      <Typography variant="caption" sx={{ color: accent, fontWeight: 950 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                        {item.metric}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography sx={{ fontWeight: 950, lineHeight: 1.18 }}>
                    {item.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.body}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.18fr 0.82fr" },
            gap: 1,
          }}
        >
          {cards.map((card) => {
            const expanded = expandedId === card.id;
            const accent = toneColor[card.tone];

            return (
              <Paper
                key={card.id}
                variant="outlined"
                sx={{
                  p: 1.35,
                  borderRadius: 1,
                  borderColor: expanded ? accent : "var(--sn-border-soft)",
                  background: toneBackground[card.tone],
                  transition: "border-color 160ms ease, transform 160ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    borderColor: accent,
                  },
                }}
              >
                <Stack spacing={1.05}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Stack spacing={0.55} minWidth={0} flex={1}>
                      <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                        <Chip
                          size="small"
                          label={card.eyebrow}
                          sx={{
                            color: accent,
                            borderColor: accent,
                            fontWeight: 900,
                          }}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`${card.metricLabel}: ${card.metricValue}`}
                          sx={{ fontWeight: 850 }}
                        />
                      </Stack>
                      <Typography sx={{ fontWeight: 950, lineHeight: 1.18 }}>
                        {card.title}
                      </Typography>
                    </Stack>
                    <Button
                      type="button"
                      size="small"
                      aria-expanded={expanded}
                      onClick={() => setExpandedId(expanded ? "" : card.id)}
                      endIcon={
                        <ChevronDown
                          size={16}
                          style={{
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 160ms ease",
                          }}
                        />
                      }
                      sx={{
                        minWidth: 112,
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 900,
                      }}
                    >
                      {expanded ? text.collapse : text.expand}
                    </Button>
                  </Stack>

                  <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {card.body}
                  </Typography>

                  {expanded ? (
                    <Stack spacing={0.8}>
                      {card.steps.map((step, index) => (
                        <Stack
                          key={`${card.id}-step-${step}`}
                          direction="row"
                          spacing={1}
                          alignItems="flex-start"
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                              color: "#ffffff",
                              bgcolor: accent,
                              fontSize: 12,
                              fontWeight: 950,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography sx={{ lineHeight: 1.5 }}>{step}</Typography>
                        </Stack>
                      ))}
                      <Button
                        type="button"
                        variant="contained"
                        onClick={() => onRunAction(card.action)}
                        sx={{
                          alignSelf: "flex-start",
                          borderRadius: 1,
                          textTransform: "none",
                          fontWeight: 950,
                        }}
                      >
                        {card.action.label}
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
};
