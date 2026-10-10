import { useId, useState, type ReactNode } from "react";
import {
  Box,
  ButtonBase,
  Collapse,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { AssistantCompanionKind } from "@domain/profile/types";
import { AssistantAvatar } from "../components/AssistantAvatar";
import { useAppColorMode } from "../theme/colorMode";
import { useLanguage } from "../language";

export type AIMasterBlueprintPattern = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  onClick: () => void;
};

type AIMasterBlueprintPanelProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  patterns: AIMasterBlueprintPattern[];
  assistantName?: string;
  assistantVariant?: AssistantCompanionKind;
};

const actionHubToggleCopy = {
  uk: { expand: "Показати більше дій", collapse: "Згорнути дії" },
  pl: { expand: "Pokaż więcej działań", collapse: "Zwiń działania" },
  en: { expand: "Show more actions", collapse: "Collapse actions" },
} as const;

const getActionHubToggleCopy = (language: string) => {
  switch (language) {
    case "pl":
      return actionHubToggleCopy.pl;
    case "en":
      return actionHubToggleCopy.en;
    case "uk":
    default:
      return actionHubToggleCopy.uk;
  }
};

const VISIBLE_ACTION_COUNT = 4;

export const AIMasterBlueprintPanel = ({
  eyebrow,
  title,
  description,
  patterns,
  assistantName = "SN",
  assistantVariant = "robot",
}: AIMasterBlueprintPanelProps) => {
  const { isDarkMode } = useAppColorMode();
  const { appLanguage } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const actionRegionId = useId();
  const toggleCopy = getActionHubToggleCopy(appLanguage);
  const visiblePatterns = patterns.slice(0, VISIBLE_ACTION_COUNT);
  const hiddenPatterns = patterns.slice(VISIBLE_ACTION_COUNT);
  const hasHiddenActions = hiddenPatterns.length > 0;
  const textColor = isDarkMode ? "#e5e7eb" : "#0f172a";
  const mutedColor = isDarkMode ? "rgba(203,213,225,0.76)" : "rgba(15,23,42,0.64)";
  const panelBackground = isDarkMode
    ? "linear-gradient(135deg, rgba(2,6,23,0.82), rgba(6,26,23,0.76))"
    : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,253,245,0.72))";
  const actionBackground = isDarkMode ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.72)";

  const renderAction = (pattern: AIMasterBlueprintPattern, index: number) => {
    const Icon = pattern.icon;

    return (
      <ButtonBase
        key={pattern.key}
        type="button"
        onClick={pattern.onClick}
        data-ai-action-hub-action={pattern.key}
        sx={{
          minWidth: 0,
          minHeight: { xs: 66, sm: 74 },
          p: { xs: 1, sm: 1.2 },
          borderRadius: 1,
          border: `1px solid ${pattern.accent}38`,
          color: textColor,
          background: actionBackground,
          textAlign: "left",
          alignItems: "stretch",
          justifyContent: "flex-start",
          overflow: "hidden",
          transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
          "&:hover": {
            borderColor: pattern.accent,
            transform: "translateY(-1px)",
            boxShadow: `0 14px 34px ${pattern.accent}20`,
          },
          "&:focus-visible": {
            outline: `3px solid ${pattern.accent}55`,
            outlineOffset: 2,
          },
        }}
      >
        <Stack spacing={0.65} sx={{ width: "100%", minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: "#020617",
                background: `linear-gradient(135deg, ${pattern.accent}, rgba(255,255,255,0.9))`,
                boxShadow: `0 0 22px ${pattern.accent}35`,
              }}
            >
              <Icon size={17} aria-hidden="true" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 950,
                  lineHeight: 1.15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {pattern.label}
              </Typography>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  color: mutedColor,
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </Typography>
            </Box>
          </Stack>
          <Typography
            component="span"
            sx={{
              color: mutedColor,
              fontSize: 12,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {pattern.description}
          </Typography>
        </Stack>
      </ButtonBase>
    );
  };

  return (
    <Paper
      elevation={0}
      data-ai-action-hub-panel="true"
      className="sn-companion-panel"
      sx={{
        p: { xs: 1.1, sm: 1.4, md: 1.8 },
        borderRadius: 1,
        border: "1px solid rgba(45,212,191,0.22)",
        color: textColor,
        background: panelBackground,
        boxShadow: isDarkMode
          ? "0 22px 70px rgba(2,6,23,0.34)"
          : "0 20px 58px rgba(15,118,110,0.12)",
        overflow: "hidden",
      }}
    >
      <Stack spacing={{ xs: 1, sm: 1.25 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 48, sm: 58 },
                height: { xs: 48, sm: 58 },
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.2), rgba(34,197,94,0.1) 56%, transparent 72%)",
              }}
            >
              <AssistantAvatar
                name={assistantName}
                size={42}
                variant={assistantVariant}
                mood="coach"
                active
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#22d3ee",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                {eyebrow}
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: 18, sm: 22 },
                  fontWeight: 950,
                  lineHeight: 1.05,
                  overflowWrap: "anywhere",
                }}
              >
                {title}
              </Typography>
            </Box>
          </Stack>
          {hasHiddenActions ? (
            <ButtonBase
              type="button"
              aria-expanded={isExpanded}
              aria-controls={actionRegionId}
              onClick={() => setIsExpanded((previous) => !previous)}
              data-ai-action-hub-toggle="true"
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1,
                border: "1px solid rgba(34,211,238,0.28)",
                color: textColor,
                flexShrink: 0,
                background: isDarkMode ? "rgba(34,211,238,0.12)" : "rgba(34,211,238,0.16)",
                "&:focus-visible": {
                  outline: "3px solid rgba(34,211,238,0.38)",
                  outlineOffset: 2,
                },
              }}
            >
              <ChevronDown
                size={18}
                aria-hidden="true"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            </ButtonBase>
          ) : null}
        </Stack>

        <Typography sx={{ color: mutedColor, fontWeight: 650, lineHeight: 1.45 }}>
          {description}
        </Typography>

        <Box
          data-ai-action-hub-actions="true"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 0.85,
          }}
        >
          {visiblePatterns.map(renderAction)}
        </Box>

        {hasHiddenActions ? (
          <Collapse in={isExpanded} timeout={180}>
            <Box
              id={actionRegionId}
              data-ai-action-hub-extra-actions="true"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 0.85,
                pt: 0.85,
              }}
            >
              {hiddenPatterns.map((pattern, index) =>
                renderAction(pattern, index + VISIBLE_ACTION_COUNT)
              )}
            </Box>
          </Collapse>
        ) : null}

        {hasHiddenActions ? (
          <ButtonBase
            type="button"
            aria-expanded={isExpanded}
            aria-controls={actionRegionId}
            onClick={() => setIsExpanded((previous) => !previous)}
            data-ai-action-hub-mobile-toggle="true"
            sx={{
              display: { xs: "flex", sm: "none" },
              justifyContent: "center",
              gap: 0.5,
              py: 0.65,
              borderRadius: 1,
              border: "1px solid rgba(34,211,238,0.22)",
              color: textColor,
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {isExpanded ? toggleCopy.collapse : toggleCopy.expand}
            <ChevronDown
              size={16}
              aria-hidden="true"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 160ms ease",
              }}
            />
          </ButtonBase>
        ) : null}
      </Stack>
    </Paper>
  );
};
