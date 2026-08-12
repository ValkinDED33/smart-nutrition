import { motion } from "framer-motion";
import { Box } from "@mui/material";
import {
  assistantAuraVariants,
  assistantAvatarHover,
  assistantAvatarRootVariants,
  assistantEyeBlinkTransition,
} from "@shared/ui/motion/assistant";
import type { AssistantAvatarMood, AssistantAvatarProps } from "./assistantAvatarTypes";
import {
  CompanionBodyParts,
  CompanionFaceParts,
  CompanionHeadParts,
} from "./assistantAvatarParts";
import {
  companionVisuals,
  getCompanionFaceRadius,
  isLetterCompanion,
} from "./assistantAvatarVisuals";

export type { AssistantAvatarMood, AssistantAvatarProps } from "./assistantAvatarTypes";

const clampLookOffset = (value: number) => Math.max(Math.min(value, 1), -1);

const round = (value: number) => Math.round(value);

const CENTER_X_TRANSFORM = "translateX(-50%)";

const moodGradients: Record<AssistantAvatarMood, string> = {
  idle:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.38), transparent 25%), linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
  happy:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.42), transparent 25%), linear-gradient(135deg, #0f766e 0%, #16a34a 54%, #f59e0b 100%)",
  coach:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.38), transparent 25%), linear-gradient(135deg, #0f766e 0%, #2563eb 56%, #7c3aed 100%)",
  concerned:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.34), transparent 25%), linear-gradient(135deg, #0f766e 0%, #ea580c 62%, #f59e0b 100%)",
  sleepy:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.28), transparent 25%), linear-gradient(135deg, #334155 0%, #0f766e 62%, #2563eb 100%)",
  celebrate:
    "radial-gradient(circle at 35% 26%, rgba(255,255,255,0.48), transparent 25%), linear-gradient(135deg, #16a34a 0%, #f59e0b 48%, #2563eb 100%)",
};

const getCompanionVisual = (variant: AssistantAvatarProps["variant"]) => {
  return companionVisuals[variant ?? "robot"] ?? companionVisuals.robot;
};

const getMoodGradient = (mood: AssistantAvatarMood) => {
  switch (mood) {
    case "happy":
      return moodGradients.happy;
    case "coach":
      return moodGradients.coach;
    case "concerned":
      return moodGradients.concerned;
    case "sleepy":
      return moodGradients.sleepy;
    case "celebrate":
      return moodGradients.celebrate;
    case "idle":
    default:
      return moodGradients.idle;
  }
};

const getMotionState = ({
  active,
  mood,
}: {
  active: boolean;
  mood: AssistantAvatarMood;
}) => {
  if (mood === "celebrate") {
    return "celebrate";
  }

  if (mood === "sleepy") {
    return "sleepy";
  }

  return active ? "active" : "idle";
};

const isRobotCompanion = (variant: AssistantAvatarProps["variant"]) =>
  (variant ?? "robot") === "robot";

const getRobotShellGradient = (mood: AssistantAvatarMood) => {
  if (mood === "concerned") {
    return "radial-gradient(circle at 32% 18%, rgba(255,255,255,0.98), transparent 24%), linear-gradient(145deg, #f8fafc 0%, #cbd5e1 48%, #94a3b8 100%)";
  }

  if (mood === "celebrate") {
    return "radial-gradient(circle at 32% 18%, rgba(255,255,255,1), transparent 24%), linear-gradient(145deg, #ffffff 0%, #dbeafe 46%, #86efac 100%)";
  }

  return "radial-gradient(circle at 32% 18%, rgba(255,255,255,1), transparent 24%), linear-gradient(145deg, #ffffff 0%, #e2e8f0 48%, #94a3b8 100%)";
};

export const AssistantAvatar = ({
  name,
  size = 64,
  variant = "robot",
  mood = "idle",
  lookOffset = { x: 0, y: 0 },
  active = false,
}: AssistantAvatarProps) => {
  const visual = getCompanionVisual(variant);
  const isRobot = isRobotCompanion(variant);
  const initial = name.trim()[0]?.toUpperCase() ?? "A";
  const eyeSize = Math.max(round(size * 0.1), 4);
  const eyeMovement = Math.max(round(size * 0.035), 2);
  const eyeX = clampLookOffset(lookOffset.x) * eyeMovement;
  const eyeY = clampLookOffset(lookOffset.y) * eyeMovement;
  const isSleepy = mood === "sleepy";
  const isConcerned = mood === "concerned";
  const isCelebrating = mood === "celebrate";
  const lineWidth = Math.max(round(size * 0.035), 2);
  const shouldUseMoodGradient = mood === "sleepy" || mood === "concerned";
  const motionState = getMotionState({ active, mood });
  const showInitial = isLetterCompanion(variant) && !isRobot;

  return (
    <Box
      component={motion.div}
      aria-hidden
      variants={assistantAvatarRootVariants}
      animate={motionState}
      whileHover={assistantAvatarHover}
      sx={{
        width: size,
        height: size,
        borderRadius: isRobot ? "34% 34% 40% 40%" : getCompanionFaceRadius(variant),
        position: "relative",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 900,
        fontSize: Math.max(round(size * 0.22), 12),
        background: isRobot
          ? getRobotShellGradient(mood)
          : shouldUseMoodGradient
            ? getMoodGradient(mood)
            : visual.face,
        boxShadow:
          isRobot
            ? "0 18px 36px rgba(15, 23, 42, 0.22), inset 0 -12px 24px rgba(15, 23, 42, 0.14), inset 0 12px 18px rgba(255, 255, 255, 0.78)"
            : mood === "concerned"
            ? "0 18px 36px rgba(234, 88, 12, 0.22)"
            : visual.shadow,
        overflow: "visible",
        transformOrigin: "50% 80%",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: isRobot ? Math.max(round(size * 0.08), 4) : Math.max(round(size * 0.12), 6),
          borderRadius: isRobot ? "34% 34% 42% 42%" : "50%",
          border: isRobot
            ? "1px solid rgba(255,255,255,0.64)"
            : "1px solid rgba(255,255,255,0.38)",
          zIndex: 2,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: round(size * 0.1),
          left: "50%",
          width: Math.max(round(size * 0.14), 7),
          height: Math.max(round(size * 0.07), 4),
          borderRadius: "999px 999px 0 0",
          transform: CENTER_X_TRANSFORM,
          borderTop: "2px solid rgba(255,255,255,0.72)",
          opacity: mood === "coach" || isCelebrating ? 1 : 0.72,
          zIndex: 3,
        },
      }}
    >
      {isRobot ? (
        <>
          <Box
            data-assistant-avatar-robot-shell="true"
            sx={{
              position: "absolute",
              left: "50%",
              bottom: -round(size * 0.48),
              width: round(size * 0.76),
              height: round(size * 0.58),
              borderRadius: "42% 42% 30% 30%",
              transform: CENTER_X_TRANSFORM,
              background:
                "radial-gradient(circle at 48% 22%, rgba(255,255,255,0.92), transparent 26%), linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 58%, #94a3b8 100%)",
              border: "1px solid rgba(255,255,255,0.54)",
              boxShadow:
                "0 18px 28px rgba(15,23,42,0.16), inset 0 -10px 18px rgba(15,23,42,0.12)",
              zIndex: 2,
            }}
          />
          <Box
            data-assistant-avatar-robot-arms="true"
            sx={{
              position: "absolute",
              left: "50%",
              bottom: -round(size * 0.3),
              width: round(size * 1.02),
              height: round(size * 0.32),
              transform: CENTER_X_TRANSFORM,
              pointerEvents: "none",
              zIndex: 1,
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: round(size * 0.05),
                width: round(size * 0.4),
                height: round(size * 0.12),
                borderRadius: 999,
                background: "linear-gradient(180deg, #e2e8f0, #94a3b8)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 10px 16px rgba(15,23,42,0.16)",
              },
              "&::before": {
                left: 0,
                transform: "rotate(34deg)",
              },
              "&::after": {
                right: 0,
                transform: "rotate(-34deg)",
              },
            }}
          />
          <Box
            data-assistant-avatar-heart-core="true"
            sx={{
              position: "absolute",
              left: "50%",
              bottom: -round(size * 0.27),
              width: Math.max(round(size * 0.2), 10),
              height: Math.max(round(size * 0.2), 10),
              transform: "translateX(-50%) rotate(-45deg)",
              borderRadius: "28% 28% 18% 28%",
              background:
                mood === "concerned"
                  ? "linear-gradient(135deg, #fb923c, #facc15)"
                  : "linear-gradient(135deg, #22d3ee, #86efac)",
              boxShadow:
                mood === "celebrate"
                  ? "0 0 18px rgba(132,204,22,0.76)"
                  : "0 0 14px rgba(34,211,238,0.56)",
              zIndex: 7,
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "inherit",
              },
              "&::before": {
                top: "-50%",
                left: 0,
              },
              "&::after": {
                top: 0,
                right: "-50%",
              },
            }}
          />
        </>
      ) : null}

      <Box
        component={motion.span}
        variants={assistantAuraVariants}
        animate={active ? "animate" : false}
        data-assistant-avatar-living-aura="true"
        sx={{
          position: "absolute",
          inset: -Math.max(round(size * 0.16), 8),
          borderRadius: isRobot ? "40%" : getCompanionFaceRadius(variant),
          background:
            mood === "concerned"
              ? "radial-gradient(circle, rgba(249,115,22,0.32), transparent 62%)"
              : mood === "celebrate"
                ? "radial-gradient(circle, rgba(132,204,22,0.38), transparent 64%)"
                : "radial-gradient(circle, rgba(34,211,238,0.28), transparent 64%)",
          filter: "blur(2px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        component={motion.span}
        animate={
          active
            ? {
                rotate: [0, 360],
              }
            : false
        }
        transition={{
          duration: mood === "celebrate" ? 5.2 : 8.4,
          ease: "linear",
          repeat: Infinity,
        }}
        data-assistant-avatar-orbit="true"
        sx={{
          position: "absolute",
          inset: -Math.max(round(size * 0.11), 6),
          borderRadius: isRobot ? "42%" : "50%",
          border: "1px solid rgba(34,211,238,0.22)",
          borderTopColor:
            mood === "concerned"
              ? "rgba(249,115,22,0.52)"
              : "rgba(132,204,22,0.52)",
          borderRightColor: "transparent",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <CompanionBodyParts variant={variant} size={size} visual={visual} />
      <CompanionHeadParts variant={variant} size={size} visual={visual} />
      <CompanionFaceParts variant={variant} size={size} visual={visual} />

      {(["left", "right"] as const).map((side) => (
        <Box
          key={side}
          sx={{
            position: "absolute",
            width: eyeSize,
            height: eyeSize,
            top: round(size * 0.38),
            left: side === "left" ? round(size * 0.34) : round(size * 0.55),
            transform: isSleepy
              ? "translateY(1px)"
              : `translate(${round(eyeX)}px, ${round(eyeY)}px)`,
            transition: "transform 120ms ease, opacity 180ms ease",
            zIndex: 5,
          }}
        >
          <Box
            component={motion.span}
            animate={{
              scaleY: isSleepy ? 0.22 : [1, 1, 0.12, 1, 1],
              opacity: isSleepy ? 0.78 : 1,
            }}
            transition={isSleepy ? { duration: 0.18 } : assistantEyeBlinkTransition}
            sx={{
              display: "block",
              width: "100%",
              height: "100%",
              borderRadius: 999,
              backgroundColor: visual.eye,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
              transformOrigin: "50% 50%",
            }}
          />
        </Box>
      ))}

      <Box
        sx={{
          position: "absolute",
          top: isRobot
            ? isConcerned
              ? round(size * 0.62)
              : round(size * 0.55)
            : isConcerned
              ? round(size * 0.62)
              : round(size * 0.58),
          left: "50%",
          width: isCelebrating
            ? round(size * 0.28)
            : isConcerned
              ? round(size * 0.2)
              : round(size * 0.24),
          height: isConcerned ? 0 : round(size * 0.12),
          borderBottom: isConcerned
            ? "none"
            : `${lineWidth}px solid rgba(255,255,255,0.9)`,
          borderTop: isConcerned
            ? `${lineWidth}px solid rgba(255,255,255,0.86)`
            : "none",
          borderRadius: isConcerned ? 999 : "0 0 999px 999px",
          transform: `translateX(-50%) rotate(${isConcerned ? "-6deg" : "0deg"})`,
          zIndex: 5,
        }}
      />

      {showInitial ? (
        <Box
          component="span"
          sx={{
            position: "absolute",
            bottom: Math.max(round(size * 0.09), 5),
            lineHeight: 1,
            opacity: 0.88,
            textShadow: "0 1px 8px rgba(15, 23, 42, 0.18)",
            zIndex: 6,
          }}
        >
          {initial}
        </Box>
      ) : null}
    </Box>
  );
};
