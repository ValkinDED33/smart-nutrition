import { Box } from "@mui/material";

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

export const AssistantAvatar = ({
  name,
  size = 64,
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
        background: moodGradients[mood],
        boxShadow:
          mood === "concerned"
            ? "0 18px 36px rgba(234, 88, 12, 0.22)"
            : "0 18px 36px rgba(15, 118, 110, 0.28)",
        overflow: "hidden",
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
