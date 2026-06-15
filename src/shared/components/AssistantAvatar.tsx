import { motion } from "framer-motion";
import { Box } from "@mui/material";
import type { AssistantCompanionKind } from "@domain/profile/types";
import {
  assistantAvatarHover,
  assistantAvatarRootVariants,
  assistantEyeBlinkTransition,
} from "@shared/ui/motion/assistant";

export type AssistantAvatarMood =
  | "idle"
  | "happy"
  | "coach"
  | "concerned"
  | "sleepy"
  | "celebrate";

interface AssistantAvatarProps {
  name: string;
  size?: number;
  variant?: AssistantCompanionKind;
  mood?: AssistantAvatarMood;
  lookOffset?: {
    x: number;
    y: number;
  };
  active?: boolean;
}

const clampLookOffset = (value: number) => Math.max(Math.min(value, 1), -1);

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

const companionAccent: Record<
  AssistantCompanionKind,
  {
    face: string;
    detail: string;
    shadow: string;
    muzzle: string;
    eye: string;
  }
> = {
  cat: {
    face: "linear-gradient(135deg, #f97316 0%, #fb923c 52%, #facc15 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.24)",
    muzzle: "rgba(255,237,213,0.82)",
    eye: "#fff7ed",
  },
  dog: {
    face: "linear-gradient(135deg, #7c3f16 0%, #b45309 52%, #f59e0b 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(161, 98, 7, 0.24)",
    muzzle: "rgba(254,243,199,0.88)",
    eye: "#fef3c7",
  },
  fox: {
    face: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #111827 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(234, 88, 12, 0.24)",
    muzzle: "rgba(255,247,237,0.9)",
    eye: "#fff7ed",
  },
  panda: {
    face: "linear-gradient(135deg, #111827 0%, #f8fafc 42%, #cbd5e1 100%)",
    detail: "#111827",
    shadow: "0 18px 36px rgba(15, 23, 42, 0.22)",
    muzzle: "rgba(255,255,255,0.94)",
    eye: "#f8fafc",
  },
  owl: {
    face: "linear-gradient(135deg, #78350f 0%, #ca8a04 50%, #fde68a 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(120, 53, 15, 0.22)",
    muzzle: "rgba(254,243,199,0.72)",
    eye: "#fff7ed",
  },
  human: {
    face: "linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #2563eb 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(20, 184, 166, 0.24)",
    muzzle: "rgba(219,234,254,0.2)",
    eye: "#eff6ff",
  },
  capybara: {
    face: "linear-gradient(135deg, #92400e 0%, #d97706 52%, #0f766e 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(146, 64, 14, 0.22)",
    muzzle: "rgba(254,243,199,0.78)",
    eye: "#fef3c7",
  },
  dragon: {
    face: "linear-gradient(135deg, #15803d 0%, #16a34a 38%, #7c3aed 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 36px rgba(22, 163, 74, 0.24)",
    muzzle: "rgba(187,247,208,0.36)",
    eye: "#dcfce7",
  },
  robot: {
    face: "linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(15, 118, 110, 0.28)",
    muzzle: "rgba(219,234,254,0.18)",
    eye: "#e0f2fe",
  },
};

const round = (value: number) => Math.round(value);

export const AssistantAvatar = ({
  name,
  size = 64,
  variant = "robot",
  mood = "idle",
  lookOffset = { x: 0, y: 0 },
  active = false,
}: AssistantAvatarProps) => {
  const initial = name.trim()[0]?.toUpperCase() ?? "A";
  const eyeSize = Math.max(Math.round(size * 0.1), 4);
  const eyeMovement = Math.max(Math.round(size * 0.035), 2);
  const eyeX = clampLookOffset(lookOffset.x) * eyeMovement;
  const eyeY = clampLookOffset(lookOffset.y) * eyeMovement;
  const isSleepy = mood === "sleepy";
  const isConcerned = mood === "concerned";
  const isCelebrating = mood === "celebrate";
  const lineWidth = Math.max(Math.round(size * 0.035), 2);
  const companion = companionAccent[variant];
  const shouldUseMoodGradient = mood === "sleepy" || mood === "concerned";
  const earSize = Math.max(Math.round(size * 0.22), 10);
  const hornSize = Math.max(Math.round(size * 0.16), 8);
  const faceRadius =
    variant === "robot"
      ? "28%"
      : variant === "fox"
        ? "44% 44% 58% 58%"
        : variant === "owl"
          ? "50% 50% 42% 42%"
        : variant === "dog"
          ? "48% 48% 55% 55%"
          : variant === "dragon"
            ? "46% 54% 56% 44% / 38% 42% 62% 58%"
            : "50%";
  const motionState = isCelebrating
    ? "celebrate"
    : isSleepy
      ? "sleepy"
      : active
        ? "active"
        : "idle";

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
        borderRadius: faceRadius,
        position: "relative",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 900,
        fontSize: Math.max(Math.round(size * 0.22), 12),
        background: shouldUseMoodGradient ? moodGradients[mood] : companion.face,
        boxShadow:
          mood === "concerned"
            ? "0 18px 36px rgba(234, 88, 12, 0.22)"
            : companion.shadow,
        overflow: "visible",
        transformOrigin: "50% 80%",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: Math.max(Math.round(size * 0.12), 6),
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.38)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: Math.round(size * 0.1),
          left: "50%",
          width: Math.max(Math.round(size * 0.14), 7),
          height: Math.max(Math.round(size * 0.07), 4),
          borderRadius: "999px 999px 0 0",
          transform: "translateX(-50%)",
          borderTop: "2px solid rgba(255,255,255,0.72)",
          opacity: mood === "coach" || isCelebrating ? 1 : 0.72,
        },
      }}
    >
      {(variant === "cat" || variant === "dog" || variant === "fox" || variant === "capybara" || variant === "panda") && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: variant === "capybara" || variant === "panda" ? round(size * 0.08) : -round(size * 0.02),
              left: variant === "panda" ? round(size * 0.08) : round(size * 0.12),
              width: earSize,
              height: variant === "dog" ? round(size * 0.32) : earSize,
              borderRadius:
                variant === "cat" || variant === "fox"
                  ? "70% 30% 55% 45%"
                  : variant === "dog"
                    ? "60% 60% 70% 70%"
                    : "50%",
              background: companion.detail,
              border: "1px solid rgba(255,255,255,0.34)",
              transform: variant === "cat" || variant === "fox" ? "rotate(-28deg)" : "rotate(-12deg)",
              opacity: 0.9,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: variant === "capybara" || variant === "panda" ? round(size * 0.08) : -round(size * 0.02),
              right: variant === "panda" ? round(size * 0.08) : round(size * 0.12),
              width: earSize,
              height: variant === "dog" ? round(size * 0.32) : earSize,
              borderRadius:
                variant === "cat" || variant === "fox"
                  ? "30% 70% 45% 55%"
                  : variant === "dog"
                    ? "60% 60% 70% 70%"
                    : "50%",
              background: companion.detail,
              border: "1px solid rgba(255,255,255,0.34)",
              transform: variant === "cat" || variant === "fox" ? "rotate(28deg)" : "rotate(12deg)",
              opacity: 0.9,
            }}
          />
        </>
      )}

      {variant === "owl" && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: -round(size * 0.03),
              left: round(size * 0.16),
              width: round(size * 0.24),
              height: round(size * 0.26),
              background: companion.detail,
              clipPath: "polygon(50% 0, 100% 100%, 0 78%)",
              transform: "rotate(-10deg)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: -round(size * 0.03),
              right: round(size * 0.16),
              width: round(size * 0.24),
              height: round(size * 0.26),
              background: companion.detail,
              clipPath: "polygon(50% 0, 100% 78%, 0 100%)",
              transform: "rotate(10deg)",
            }}
          />
        </>
      )}

      {variant === "dragon" && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: round(size * 0.22),
              left: -round(size * 0.12),
              width: round(size * 0.34),
              height: round(size * 0.4),
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.76), rgba(124,58,237,0.76))",
              clipPath: "polygon(100% 12%, 0 45%, 100% 88%)",
              borderRadius: "20% 0 0 50%",
              opacity: 0.82,
              filter: "drop-shadow(0 8px 12px rgba(22,163,74,0.22))",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: round(size * 0.22),
              right: -round(size * 0.12),
              width: round(size * 0.34),
              height: round(size * 0.4),
              background:
                "linear-gradient(225deg, rgba(34,197,94,0.76), rgba(124,58,237,0.76))",
              clipPath: "polygon(0 12%, 100% 45%, 0 88%)",
              borderRadius: "0 20% 50% 0",
              opacity: 0.82,
              filter: "drop-shadow(0 8px 12px rgba(22,163,74,0.22))",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: -Math.round(size * 0.03),
              left: Math.round(size * 0.24),
              width: hornSize,
              height: hornSize,
              borderRadius: "80% 20% 72% 28%",
              background: companion.detail,
              transform: "rotate(-32deg)",
              border: "1px solid rgba(255,255,255,0.42)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: -Math.round(size * 0.03),
              right: Math.round(size * 0.24),
              width: hornSize,
              height: hornSize,
              borderRadius: "20% 80% 28% 72%",
              background: companion.detail,
              transform: "rotate(32deg)",
              border: "1px solid rgba(255,255,255,0.42)",
            }}
          />
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                position: "absolute",
                top: round(size * (0.09 + index * 0.105)),
                left: "50%",
                width: round(size * 0.11),
                height: round(size * 0.12),
                backgroundColor: companion.detail,
                clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
                transform: "translateX(-50%)",
                opacity: 0.92 - index * 0.12,
              }}
            />
          ))}
        </>
      )}

      {variant === "robot" && (
        <Box
          sx={{
            position: "absolute",
            top: -Math.round(size * 0.02),
            left: "50%",
            width: Math.max(Math.round(size * 0.04), 2),
            height: Math.max(Math.round(size * 0.18), 9),
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.72)",
            transform: "translateX(-50%)",
            "&::after": {
              content: '""',
              position: "absolute",
              top: -Math.max(Math.round(size * 0.04), 2),
              left: "50%",
              width: Math.max(Math.round(size * 0.09), 5),
              height: Math.max(Math.round(size * 0.09), 5),
              borderRadius: "50%",
              backgroundColor: companion.detail,
              transform: "translateX(-50%)",
              boxShadow: "0 0 12px rgba(219,234,254,0.72)",
            },
          }}
        />
      )}

      {variant === "human" && (
        <Box
          sx={{
            position: "absolute",
            top: Math.round(size * 0.09),
            left: "50%",
            width: Math.round(size * 0.46),
            height: Math.round(size * 0.2),
            borderRadius: "999px 999px 55% 55%",
            backgroundColor: "rgba(15,23,42,0.32)",
            transform: "translateX(-50%)",
          }}
        />
      )}

      <Box
        sx={{
          position: "absolute",
          inset: Math.max(Math.round(size * 0.2), 10),
          top: Math.max(Math.round(size * 0.22), 10),
          bottom: Math.max(Math.round(size * 0.16), 8),
          borderRadius:
            variant === "fox"
              ? "42% 42% 68% 68%"
              : variant === "robot"
                ? "24%"
                : "46% 46% 52% 52%",
          background:
            variant === "panda"
              ? "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.52) 100%)"
              : variant === "owl"
                ? "radial-gradient(circle at 30% 38%, rgba(255,255,255,0.5) 0 18%, transparent 19%), radial-gradient(circle at 70% 38%, rgba(255,255,255,0.5) 0 18%, transparent 19%), linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)"
                : `linear-gradient(180deg, ${companion.muzzle} 0%, rgba(255,255,255,0.08) 100%)`,
          border: "1px solid rgba(255,255,255,0.24)",
        }}
      />

      {variant === "fox" && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: round(size * 0.2),
            width: round(size * 0.26),
            height: round(size * 0.2),
            transform: "translateX(-50%)",
            backgroundColor: companion.muzzle,
            clipPath: "polygon(50% 100%, 0 0, 100% 0)",
          }}
        />
      )}

      {variant === "dog" && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: round(size * 0.5),
            width: round(size * 0.24),
            height: round(size * 0.16),
            transform: "translateX(-50%)",
            borderRadius: "50%",
            backgroundColor: companion.muzzle,
          }}
        />
      )}

      {variant === "dragon" && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: round(size * 0.18),
              right: round(size * 0.05),
              width: round(size * 0.12),
              height: round(size * 0.52),
              background:
                "repeating-linear-gradient(180deg, rgba(187,247,208,0.94) 0 8px, rgba(124,58,237,0.72) 8px 14px)",
              clipPath:
                "polygon(100% 0, 0 12%, 100% 24%, 0 36%, 100% 48%, 0 60%, 100% 72%, 0 84%, 100% 100%)",
              opacity: 0.9,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              bottom: round(size * 0.17),
              width: round(size * 0.32),
              height: round(size * 0.18),
              transform: "translateX(-50%)",
              borderRadius: "55% 55% 70% 70%",
              backgroundColor: "rgba(187,247,208,0.62)",
              border: "1px solid rgba(255,255,255,0.26)",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: "46%",
                width: round(size * 0.035),
                height: round(size * 0.035),
                borderRadius: "50%",
                backgroundColor: "rgba(15,23,42,0.48)",
              },
              "&::before": {
                left: "33%",
              },
              "&::after": {
                right: "33%",
              },
            }}
          />
        </>
      )}

      {(["left", "right"] as const).map((side) => (
        <Box
          key={side}
          sx={{
            position: "absolute",
            width: eyeSize,
            height: eyeSize,
            top: Math.round(size * 0.38),
            left: side === "left" ? Math.round(size * 0.34) : Math.round(size * 0.55),
            transform: isSleepy
              ? "translateY(1px)"
              : `translate(${Math.round(eyeX)}px, ${Math.round(eyeY)}px)`,
            transition: "transform 120ms ease, opacity 180ms ease",
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
              backgroundColor: companion.eye,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
              transformOrigin: "50% 50%",
            }}
          />
        </Box>
      ))}

      <Box
        sx={{
          position: "absolute",
          top: isConcerned ? Math.round(size * 0.62) : Math.round(size * 0.58),
          left: "50%",
          width: isCelebrating
            ? Math.round(size * 0.28)
            : isConcerned
              ? Math.round(size * 0.2)
              : Math.round(size * 0.24),
          height: isConcerned ? 0 : Math.round(size * 0.12),
          borderBottom: isConcerned
            ? "none"
            : `${lineWidth}px solid rgba(255,255,255,0.9)`,
          borderTop: isConcerned
            ? `${lineWidth}px solid rgba(255,255,255,0.86)`
            : "none",
          borderRadius: isConcerned ? 999 : "0 0 999px 999px",
          transform: `translateX(-50%) rotate(${isConcerned ? "-6deg" : "0deg"})`,
        }}
      />

      <Box
        component="span"
        sx={{
          position: "absolute",
          bottom: Math.max(Math.round(size * 0.09), 5),
          lineHeight: 1,
          opacity: 0.88,
          textShadow: "0 1px 8px rgba(15, 23, 42, 0.18)",
        }}
      >
        {initial}
      </Box>
    </Box>
  );
};
