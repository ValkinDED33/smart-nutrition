import { Box } from "@mui/material";

interface AssistantAvatarProps {
  name: string;
  size?: number;
}

export const AssistantAvatar = ({ name, size = 64 }: AssistantAvatarProps) => {
  const initial = name.trim()[0]?.toUpperCase() ?? "A";
  const eyeSize = Math.max(Math.round(size * 0.08), 3);

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
        fontSize: Math.max(Math.round(size * 0.34), 16),
        background:
          "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.36), transparent 24%), linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
        boxShadow: "0 18px 36px rgba(15, 118, 110, 0.28)",
        overflow: "hidden",
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
          width: eyeSize,
          height: eyeSize,
          borderRadius: "50%",
          top: Math.round(size * 0.34),
          left: Math.round(size * 0.34),
          backgroundColor: "rgba(255,255,255,0.86)",
          boxShadow: `${Math.round(size * 0.2)}px 0 0 rgba(255,255,255,0.86)`,
        },
      }}
    >
      <Box component="span" sx={{ transform: `translateY(${Math.round(size * 0.08)}px)` }}>
        {initial}
      </Box>
    </Box>
  );
};
