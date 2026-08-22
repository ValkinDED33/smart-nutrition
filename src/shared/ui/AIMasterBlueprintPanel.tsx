import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import type { AssistantCompanionKind } from "@domain/profile/types";
import { AssistantAvatar } from "../components/AssistantAvatar";
import { useAppColorMode } from "../theme/colorMode";

const SOFT_GLASS_BLUR = "blur(18px)";
const BLUEPRINT_BORDER = "1px solid rgba(45, 212, 191, 0.22)";
const BLUEPRINT_GOLD_BORDER = "1px solid rgba(245, 158, 11, 0.28)";
const BLUEPRINT_SURFACE = "rgba(7, 17, 31, 0.78)";
const BLUEPRINT_SURFACE_SOFT = "rgba(15, 31, 48, 0.72)";
const BLUEPRINT_TEXT = "#e5e7eb";
const BLUEPRINT_MUTED = "rgba(203, 213, 225, 0.72)";
const BLUEPRINT_GREEN = "#22c55e";
const BLUEPRINT_CYAN = "#22d3ee";
const BLUEPRINT_LEFT_WIDE_COLUMN = { xs: "1", md: "1 / span 4" };
const BLUEPRINT_RIGHT_NARROW_COLUMN = { xs: "1", md: "5 / span 3" };
const BLUEPRINT_FULL_COLUMN = { xs: "1", md: "1 / span 7" };

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

const interactionHints = [
  "Tap / press",
  "Swipe / slide",
  "Drag / reorder",
  "Long press",
  "Double tap",
];

const assistantStates = [
  { label: "IDLE", mood: "idle" as const },
  { label: "LISTENING", mood: "coach" as const },
  { label: "THINKING", mood: "concerned" as const },
  { label: "SUCCESS", mood: "happy" as const },
  { label: "CELEBRATE", mood: "celebrate" as const },
  { label: "SLEEP", mood: "sleepy" as const },
];

const blueprintModules = [
  { label: "Confirm", value: "delete", color: "#ef4444" },
  { label: "Portion", value: "150 g", color: BLUEPRINT_GREEN },
  { label: "Water", value: "1.4 / 2 l", color: BLUEPRINT_CYAN },
  { label: "Success", value: "saved", color: BLUEPRINT_GREEN },
  { label: "Offline", value: "retry", color: "#94a3b8" },
];

const motionPrinciples = [
  "Fast feedback",
  "Living cards",
  "Shared transitions",
  "Bottom sheets",
  "Safe mobile",
];

const platformFrames = [
  { label: "Desktop", detail: "1440+", columns: 4, height: 112 },
  { label: "Tablet", detail: "1024", columns: 3, height: 96 },
  { label: "Mobile", detail: "375", columns: 1, height: 126 },
];

const sideRailModules = [
  "Home",
  "AI",
  "Food",
  "Water",
  "Health",
  "Family",
  "Tasks",
  "Admin",
];

const productModules = [
  { label: "Calories", value: "1590 / 2100", color: BLUEPRINT_GREEN },
  { label: "Protein", value: "102 / 140 g", color: BLUEPRINT_CYAN },
  { label: "Water", value: "1.4 / 2 l", color: "#38bdf8" },
  { label: "Health", value: "120 / 80", color: "#f472b6" },
];

const modalPatterns = [
  "Confirm delete",
  "Add water",
  "Barcode scanner",
  "Medication reminder",
  "Recipe filters",
];

const domainWindows = [
  { label: "Women's health", detail: "cycle, pregnancy, partner access" },
  { label: "Admin center", detail: "users, online, roles, audit status" },
  { label: "Telegram worker", detail: "photos, tasks, pills, pressure logs" },
];

export const AIMasterBlueprintPanel = ({
  eyebrow,
  title,
  description,
  patterns,
  assistantName = "SN",
  assistantVariant = "robot",
}: AIMasterBlueprintPanelProps) => {
  const { isDarkMode } = useAppColorMode();
  const boardBackground = isDarkMode
    ? "radial-gradient(circle at 72% 4%, rgba(34,211,238,0.14), transparent 24%), radial-gradient(circle at 42% 58%, rgba(34,197,94,0.13), transparent 34%), linear-gradient(135deg, #020617 0%, #07111f 48%, #061a17 100%)"
    : "radial-gradient(circle at 74% 4%, rgba(34,211,238,0.18), transparent 24%), radial-gradient(circle at 42% 58%, rgba(34,197,94,0.13), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #ecfeff 52%, #f0fdf4 100%)";
  const textColor = isDarkMode ? BLUEPRINT_TEXT : "#0f172a";
  const mutedColor = isDarkMode ? BLUEPRINT_MUTED : "rgba(15,23,42,0.62)";
  const panelSurface = isDarkMode ? BLUEPRINT_SURFACE : "rgba(255,255,255,0.76)";
  const panelSurfaceSoft = isDarkMode ? BLUEPRINT_SURFACE_SOFT : "rgba(255,255,255,0.62)";

  return (
    <Paper
      elevation={0}
      data-ai-master-blueprint-board="true"
      data-ai-master-blueprint-patterns="true"
      className="sn-companion-panel"
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 1.1, sm: 1.4, lg: 1.8 },
        borderRadius: 1,
        border: BLUEPRINT_BORDER,
        background: boardBackground,
        boxShadow: isDarkMode
          ? "0 28px 90px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(148,163,184,0.06)"
          : "0 24px 70px rgba(15,118,110,0.16), inset 0 0 0 1px rgba(255,255,255,0.64)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(rgba(45,212,191,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.28))",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: "10% 16% auto auto",
          width: 360,
          height: 360,
          pointerEvents: "none",
          borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.18)",
          boxShadow: "0 0 90px rgba(34,211,238,0.11)",
          transform: "rotate(-18deg)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr)" },
          gap: 1.1,
        }}
      >
        <Stack
          spacing={1.2}
          sx={{
            minHeight: { lg: 420 },
            p: 1.2,
            borderRadius: 1,
            border: BLUEPRINT_BORDER,
            background: panelSurface,
            backdropFilter: SOFT_GLASS_BLUR,
          }}
        >
          <Box>
            <Typography
              component="p"
              sx={{
                color: textColor,
                fontSize: 22,
                fontWeight: 950,
                lineHeight: 0.95,
                letterSpacing: 0,
                textTransform: "uppercase",
              }}
            >
              Smart Nutrition
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: BLUEPRINT_CYAN,
                fontWeight: 850,
                textTransform: "uppercase",
              }}
            >
              Interaction & Motion System
            </Typography>
          </Box>

          <Box sx={{ display: "grid", placeItems: "center", py: 0.8 }}>
            <Box
              sx={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                width: 126,
                height: 126,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.18), rgba(34,197,94,0.1) 54%, transparent 72%)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "1px solid rgba(34,211,238,0.52)",
                  boxShadow: "0 0 38px rgba(34,211,238,0.24)",
                },
              }}
            >
              <AssistantAvatar
                name={assistantName}
                size={92}
                variant={assistantVariant}
                mood="happy"
                active
              />
            </Box>
          </Box>

          <Typography sx={{ color: mutedColor, fontWeight: 650, lineHeight: 1.45 }}>
            {description}
          </Typography>

          <Stack
            spacing={0.6}
            sx={{
              mt: "auto",
              p: 1,
              borderRadius: 1,
              border: BLUEPRINT_BORDER,
              background: isDarkMode ? "rgba(2,6,23,0.42)" : "rgba(255,255,255,0.52)",
            }}
          >
            {interactionHints.map((hint) => (
              <Stack key={hint} direction="row" spacing={0.8} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: BLUEPRINT_GREEN,
                    boxShadow: "0 0 14px rgba(34,197,94,0.7)",
                  }}
                />
                <Typography variant="caption" sx={{ color: textColor, fontWeight: 800 }}>
                  {hint}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(7, minmax(0, 1fr))" },
            gridAutoRows: "minmax(124px, auto)",
            gap: 1,
          }}
        >
          {patterns.map((pattern, index) => {
            const Icon = pattern.icon;

            return (
              <Paper
                key={pattern.key}
                component={motion.button}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={pattern.onClick}
                data-ai-master-blueprint-pattern={pattern.key}
                elevation={0}
                sx={{
                  minHeight: 124,
                  p: 1,
                  borderRadius: 1,
                  border: index < 7 ? BLUEPRINT_GOLD_BORDER : `1px solid ${pattern.accent}40`,
                  cursor: "pointer",
                  color: textColor,
                  textAlign: "left",
                  background: panelSurfaceSoft,
                  backdropFilter: SOFT_GLASS_BLUR,
                  transition:
                    "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
                  "&:hover": {
                    borderColor: pattern.accent,
                    boxShadow: `0 18px 44px ${pattern.accent}24`,
                    background: isDarkMode
                      ? "rgba(15,23,42,0.82)"
                      : "rgba(255,255,255,0.92)",
                  },
                  "&:focus-visible": {
                    outline: `3px solid ${pattern.accent}`,
                    outlineOffset: 3,
                  },
                }}
              >
                <Stack spacing={0.8} sx={{ height: "100%" }}>
                  <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="space-between">
                    <Typography
                      variant="caption"
                      sx={{
                        color: textColor,
                        fontWeight: 950,
                        textTransform: "uppercase",
                      }}
                    >
                      {index + 1}. {pattern.label}
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        color: "#020617",
                        background: `linear-gradient(135deg, ${pattern.accent}, rgba(255,255,255,0.88))`,
                        boxShadow: `0 0 28px ${pattern.accent}44`,
                      }}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </Box>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: mutedColor,
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {pattern.description}
                  </Typography>
                  <Box
                    sx={{
                      mt: "auto",
                      height: 34,
                      borderRadius: 1,
                      border: `1px solid ${pattern.accent}33`,
                      background:
                        "linear-gradient(135deg, rgba(15,23,42,0.36), rgba(34,211,238,0.08))",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 10,
                        right: 10,
                        top: "50%",
                        height: 3,
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${pattern.accent}, transparent)`,
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: `${18 + (index % 4) * 16}%`,
                        top: 9,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: pattern.accent,
                        boxShadow: `0 0 18px ${pattern.accent}`,
                      },
                    }}
                  />
                </Stack>
              </Paper>
            );
          })}

          <Box
            sx={{
              gridColumn: BLUEPRINT_LEFT_WIDE_COLUMN,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            {blueprintModules.map((module) => (
              <Paper
                key={module.label}
                elevation={0}
                sx={{
                  p: 1,
                  minHeight: 96,
                  borderRadius: 1,
                  border: `1px solid ${module.color}42`,
                  background: panelSurface,
                  color: textColor,
                  display: "grid",
                  alignContent: "space-between",
                }}
              >
                <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950 }}>
                  {module.label}
                </Typography>
                <Typography sx={{ fontWeight: 950, color: module.color }}>{module.value}</Typography>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${module.color}, rgba(148,163,184,0.18))`,
                  }}
                />
              </Paper>
            ))}
          </Box>

          <Paper
            elevation={0}
            sx={{
              gridColumn: BLUEPRINT_RIGHT_NARROW_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}>
              Assistant states
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 0.8,
                mt: 0.8,
              }}
            >
              {assistantStates.map((state) => (
                <Stack key={state.label} spacing={0.3} alignItems="center">
                  <AssistantAvatar
                    name={assistantName}
                    size={42}
                    variant={assistantVariant}
                    mood={state.mood}
                    active
                  />
                  <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 850, fontSize: 10 }}>
                    {state.label}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              gridColumn: BLUEPRINT_LEFT_WIDE_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}>
              Flow
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1, overflowX: "auto", pb: 0.2 }}>
              {[eyebrow, title, "AI анализ", "Подтверждение", "Cloud OK"].map((step, index) => (
                <Stack key={`${index}-${String(step)}`} direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      minWidth: 126,
                      p: 0.9,
                      borderRadius: 1,
                      border: BLUEPRINT_BORDER,
                      background: panelSurfaceSoft,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 850 }}>
                      {index + 1}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>{step}</Typography>
                  </Box>
                  {index < 4 && (
                    <Box
                      sx={{
                        width: 28,
                        height: 2,
                        flex: "0 0 auto",
                        background: `linear-gradient(90deg, ${BLUEPRINT_GREEN}, ${BLUEPRINT_CYAN})`,
                      }}
                    />
                  )}
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              gridColumn: BLUEPRINT_RIGHT_NARROW_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_GOLD_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}>
              Motion principles
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7, mt: 1 }}>
              {motionPrinciples.map((principle) => (
                <Box
                  key={principle}
                  sx={{
                    px: 0.9,
                    py: 0.45,
                    borderRadius: 99,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 850,
                    border: "1px solid rgba(34,211,238,0.24)",
                    background: "rgba(34,211,238,0.08)",
                  }}
                >
                  {principle}
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            data-ai-master-blueprint-product-map="true"
            sx={{
              gridColumn: BLUEPRINT_FULL_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1}
              alignItems="stretch"
            >
              <Stack
                data-ai-master-blueprint-side-rail="true"
                spacing={0.55}
                sx={{
                  width: { xs: "100%", lg: 148 },
                  flex: "0 0 auto",
                  p: 0.75,
                  borderRadius: 1,
                  border: BLUEPRINT_BORDER,
                  background: isDarkMode ? "rgba(2,6,23,0.44)" : "rgba(255,255,255,0.5)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}
                >
                  Unified rail
                </Typography>
                {sideRailModules.map((module, index) => (
                  <Stack
                    key={module}
                    direction="row"
                    spacing={0.7}
                    alignItems="center"
                    sx={{
                      px: 0.75,
                      py: 0.55,
                      borderRadius: 1,
                      color: index === 0 ? textColor : mutedColor,
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(20,184,166,0.28), rgba(34,197,94,0.18))"
                          : "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: index === 0 ? BLUEPRINT_GREEN : "rgba(148,163,184,0.5)",
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                      {module}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Box
                data-ai-master-blueprint-platforms="true"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.25fr 0.95fr 0.72fr" },
                  gap: 1,
                }}
              >
                {platformFrames.map((frame, frameIndex) => (
                  <Paper
                    key={frame.label}
                    elevation={0}
                    data-ai-master-blueprint-platform={frame.label.toLowerCase()}
                    sx={{
                      minHeight: frame.height,
                      p: 0.9,
                      borderRadius: 1,
                      border:
                        frameIndex === 0
                          ? BLUEPRINT_GOLD_BORDER
                          : "1px solid rgba(45,212,191,0.18)",
                      background: panelSurfaceSoft,
                      overflow: "hidden",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.8 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 950, lineHeight: 1 }}>
                          {frame.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 800 }}>
                          {frame.detail}
                        </Typography>
                      </Box>
                      <AssistantAvatar
                        name={assistantName}
                        size={frameIndex === 2 ? 34 : 40}
                        variant={assistantVariant}
                        mood="coach"
                        active
                      />
                    </Stack>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${frame.columns}, minmax(0, 1fr))`,
                        gap: 0.6,
                      }}
                    >
                      {productModules.slice(0, frame.columns).map((module) => (
                        <Box
                          key={`${frame.label}-${module.label}`}
                          sx={{
                            p: 0.65,
                            minHeight: 54,
                            borderRadius: 1,
                            border: `1px solid ${module.color}33`,
                            background: isDarkMode
                              ? "rgba(15,23,42,0.66)"
                              : "rgba(255,255,255,0.68)",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 850 }}>
                            {module.label}
                          </Typography>
                          <Typography sx={{ fontWeight: 950, color: textColor, fontSize: 13 }}>
                            {module.value}
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.45,
                              height: 4,
                              borderRadius: 999,
                              background: `linear-gradient(90deg, ${module.color}, rgba(148,163,184,0.2))`,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            data-ai-master-blueprint-modals="true"
            sx={{
              gridColumn: BLUEPRINT_LEFT_WIDE_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}>
              Modals / bottom sheets
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(5, minmax(0, 1fr))" },
                gap: 0.75,
                mt: 0.8,
              }}
            >
              {modalPatterns.map((modal, index) => (
                <Box
                  key={modal}
                  data-ai-master-blueprint-modal={modal}
                  sx={{
                    p: 0.75,
                    minHeight: 66,
                    borderRadius: 1,
                    border: `1px solid ${index === 0 ? "#ef4444" : BLUEPRINT_CYAN}33`,
                    background: isDarkMode
                      ? "rgba(2,6,23,0.48)"
                      : "rgba(255,255,255,0.62)",
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 12, lineHeight: 1.15 }}>
                    {modal}
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.8,
                      height: 6,
                      width: `${42 + index * 9}%`,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${index === 0 ? "#ef4444" : BLUEPRINT_GREEN}, ${BLUEPRINT_CYAN})`,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            data-ai-master-blueprint-domain-windows="true"
            sx={{
              gridColumn: BLUEPRINT_RIGHT_NARROW_COLUMN,
              p: 1.1,
              borderRadius: 1,
              border: BLUEPRINT_GOLD_BORDER,
              background: panelSurface,
              color: textColor,
            }}
          >
            <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 950, textTransform: "uppercase" }}>
              Product domains
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.8 }}>
              {domainWindows.map((window, index) => (
                <Box
                  key={window.label}
                  data-ai-master-blueprint-domain={window.label}
                  sx={{
                    p: 0.8,
                    borderRadius: 1,
                    border: "1px solid rgba(45,212,191,0.18)",
                    background:
                      index === 0
                        ? "linear-gradient(135deg, rgba(236,72,153,0.14), rgba(34,211,238,0.08))"
                        : "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,197,94,0.08))",
                  }}
                >
                  <Typography sx={{ fontWeight: 950, fontSize: 13 }}>{window.label}</Typography>
                  <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 760 }}>
                    {window.detail}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};
