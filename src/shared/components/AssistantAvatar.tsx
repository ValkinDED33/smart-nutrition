import { Box } from "@mui/material";
import type { AssistantCompanionKind } from "@domain/profile/types";

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
  }
> = {
  cat: {
    face: "linear-gradient(135deg, #f97316 0%, #f59e0b 52%, #0f766e 100%)",
    detail: "#fed7aa",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.24)",
  },
  dog: {
    face: "linear-gradient(135deg, #a16207 0%, #f59e0b 50%, #2563eb 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(161, 98, 7, 0.24)",
  },
  fox: {
    face: "linear-gradient(135deg, #ea580c 0%, #f97316 48%, #0f766e 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(234, 88, 12, 0.24)",
  },
  human: {
    face: "linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #2563eb 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(20, 184, 166, 0.24)",
  },
  capybara: {
    face: "linear-gradient(135deg, #92400e 0%, #d97706 52%, #0f766e 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(146, 64, 14, 0.22)",
  },
  dragon: {
    face: "linear-gradient(135deg, #16a34a 0%, #2563eb 54%, #7c3aed 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 36px rgba(22, 163, 74, 0.24)",
  },
  robot: {
    face: "linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(15, 118, 110, 0.28)",
  },
};

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

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
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
        animation:
          active || isCelebrating
            ? "snMascotBob 1.8s ease-in-out infinite"
            : isSleepy
              ? "snMascotBreathe 3.2s ease-in-out infinite"
              : "none",
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
        "@keyframes snMascotBob": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "45%": { transform: "translateY(-4px) rotate(-2deg)" },
          "70%": { transform: "translateY(1px) rotate(1deg)" },
        },
        "@keyframes snMascotBreathe": {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: 0.92 },
          "50%": { transform: "translateY(2px) scale(0.985)", opacity: 0.78 },
        },
      }}
    >
      {(variant === "cat" || variant === "dog" || variant === "fox" || variant === "capybara") && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: variant === "capybara" ? Math.round(size * 0.08) : -Math.round(size * 0.02),
              left: Math.round(size * 0.12),
              width: earSize,
              height: variant === "dog" ? Math.round(size * 0.3) : earSize,
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
              top: variant === "capybara" ? Math.round(size * 0.08) : -Math.round(size * 0.02),
              right: Math.round(size * 0.12),
              width: earSize,
              height: variant === "dog" ? Math.round(size * 0.3) : earSize,
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

      {variant === "dragon" && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: Math.round(size * 0.02),
              left: Math.round(size * 0.24),
              width: hornSize,
              height: hornSize,
              borderRadius: "70% 30% 70% 30%",
              background: companion.detail,
              transform: "rotate(-28deg)",
              border: "1px solid rgba(255,255,255,0.42)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: Math.round(size * 0.02),
              right: Math.round(size * 0.24),
              width: hornSize,
              height: hornSize,
              borderRadius: "30% 70% 30% 70%",
              background: companion.detail,
              transform: "rotate(28deg)",
              border: "1px solid rgba(255,255,255,0.42)",
            }}
          />
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
          borderRadius: "46% 46% 52% 52%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)",
          border: "1px solid rgba(255,255,255,0.24)",
        }}
      />

      {(["left", "right"] as const).map((side) => (
        <Box
          key={side}
          sx={{
            position: "absolute",
            width: eyeSize,
            height: isSleepy ? Math.max(Math.round(size * 0.025), 2) : eyeSize,
            borderRadius: 999,
            top: Math.round(size * 0.38),
            left: side === "left" ? Math.round(size * 0.34) : Math.round(size * 0.55),
            backgroundColor: "rgba(255,255,255,0.92)",
            transform: isSleepy
              ? "translateY(1px)"
              : `translate(${Math.round(eyeX)}px, ${Math.round(eyeY)}px)`,
            transition: "transform 120ms ease, height 180ms ease, opacity 180ms ease",
            opacity: isSleepy ? 0.78 : 1,
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
          }}
        />
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
