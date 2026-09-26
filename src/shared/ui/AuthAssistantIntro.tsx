import type { ReactNode } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Bot, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import {
  AssistantAvatar,
  type AssistantAvatarMood,
} from "@shared/components/AssistantAvatar";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

interface AuthAssistantIntroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  mood?: AssistantAvatarMood;
  size?: number;
  capabilities?: readonly ReactNode[];
}

const authAssistantIntroCopy: Record<
  AppLanguage,
  {
    worker: string;
    defaultCapabilities: readonly string[];
  }
> = {
  uk: {
    worker: "AI-працівник",
    defaultCapabilities: ["Пошта", "Безпека", "Профіль"],
  },
  pl: {
    worker: "Pracownik AI",
    defaultCapabilities: ["Poczta", "Bezpieczeństwo", "Profil"],
  },
  en: {
    worker: "AI worker",
    defaultCapabilities: ["Email", "Security", "Profile"],
  },
};

const getAuthAssistantIntroCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return authAssistantIntroCopy.pl;
    case "en":
      return authAssistantIntroCopy.en;
    case "uk":
    default:
      return authAssistantIntroCopy.uk;
  }
};

const capabilityIcons = [MailCheck, ShieldCheck, Bot] as const;

export const AuthAssistantIntro = ({
  eyebrow,
  title,
  subtitle,
  mood = "coach",
  size = 76,
  capabilities,
}: AuthAssistantIntroProps) => {
  const { appLanguage } = useLanguage();
  const copy = getAuthAssistantIntroCopy(appLanguage);
  const visibleCapabilities =
    capabilities && capabilities.length > 0 ? capabilities : copy.defaultCapabilities;

  return (
    <Stack
      data-auth-ai-worker-intro="true"
      spacing={{ xs: 1.25, sm: 2 }}
      sx={{
        position: "relative",
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-strong)",
        background:
          "radial-gradient(circle at 82% 18%, rgba(132,204,22,0.22), transparent 30%), radial-gradient(circle at 8% 0%, rgba(20,184,166,0.18), transparent 34%), rgba(255,255,255,0.08)",
        overflow: "hidden",
        "& > *": {
          position: "relative",
          zIndex: 1,
        },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1.25, sm: 2 }}
        alignItems="center"
      >
        <Box
          sx={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            "&::before": {
              content: '""',
              position: "absolute",
              width: { xs: 70, sm: size + 32 },
              height: { xs: 70, sm: size + 32 },
              borderRadius: "50%",
              background: "var(--sn-portal-ring)",
              opacity: 0.78,
            },
          }}
        >
          <AssistantAvatar
            name="Smart Nutrition AI"
            variant="robot"
            mood={mood}
            size={Math.min(size, 76)}
            active
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ mb: { xs: 0.3, sm: 0.6 }, flexWrap: "wrap" }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "var(--sn-accent)",
                fontWeight: 900,
                lineHeight: 1,
                fontSize: { xs: 10, sm: 12 },
              }}
            >
              {eyebrow}
            </Typography>
            <Chip
              icon={<Sparkles size={14} />}
              label={copy.worker}
              size="small"
              data-auth-ai-worker-badge="true"
              sx={{
                border: "1px solid var(--sn-border-soft)",
                backgroundColor: "var(--sn-surface-glass)",
                color: "var(--sn-text-primary)",
                fontWeight: 850,
                height: { xs: 24, sm: 28 },
              }}
            />
          </Stack>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 950,
              mb: { xs: 0.45, sm: 0.8 },
              fontSize: { xs: 25, sm: 34 },
              lineHeight: { xs: 1.06, sm: 1.12 },
              textWrap: "balance",
            }}
          >
            {title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              lineHeight: { xs: 1.35, sm: 1.6 },
              fontSize: { xs: 14, sm: 16 },
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        data-auth-ai-worker-capabilities="true"
      >
        {visibleCapabilities.map((capability, index) => {
          const Icon = capabilityIcons[index % capabilityIcons.length] ?? Bot;

          return (
            <Chip
              key={index}
              icon={<Icon size={14} />}
              label={capability}
              size="small"
              sx={{
                border: "1px solid var(--sn-border-soft)",
                backgroundColor: "var(--sn-surface-glass)",
                color: "var(--sn-text-primary)",
                fontWeight: 850,
                height: { xs: 24, sm: 28 },
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};
