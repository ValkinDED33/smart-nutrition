import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Award, Droplets, Scale, Sparkles, TrendingUp, Utensils, type LucideIcon } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { SectionCard, SectionHeader } from "@shared/ui";
import { fadeUpVariants } from "@shared/ui/motion";
import { buildCompanionProgressCardModel } from "./companionProgressCardModel";

const companionProgressCopy = {
  uk: {
    title: "Прогрес компаньйона",
    description: "Ваш компаньйон росте разом із вашими звичками.",
    level: "Рівень",
    xp: "XP",
    coins: "Монети",
    relationship: "Зв'язок",
    nextLevel: (value: number) => `До наступного рівня: ${value} XP`,
    maxLevel: "Максимальний рівень відкрито",
    achievementsTitle: "Останні досягнення",
    noAchievements: "Досягнення з'являться після перших реальних дій.",
  },
  pl: {
    title: "Postęp companiona",
    description: "Twój companion rośnie razem z Twoimi nawykami.",
    level: "Poziom",
    xp: "XP",
    coins: "Monety",
    relationship: "Relacja",
    nextLevel: (value: number) => `Do następnego poziomu: ${value} XP`,
    maxLevel: "Maksymalny poziom odblokowany",
    achievementsTitle: "Ostatnie osiągnięcia",
    noAchievements: "Osiągnięcia pojawią się po pierwszych realnych akcjach.",
  },
  en: {
    title: "Companion progress",
    description: "Your companion grows alongside your habits.",
    level: "Level",
    xp: "XP",
    coins: "Coins",
    relationship: "Bond",
    nextLevel: (value: number) => `${value} XP to the next level`,
    maxLevel: "Maximum level unlocked",
    achievementsTitle: "Recent achievements",
    noAchievements: "Achievements will appear after the first real actions.",
  },
} as const;

const achievementIconMap: Record<string, LucideIcon> = {
  award: Award,
  droplets: Droplets,
  "level-up": TrendingUp,
  scale: Scale,
  sparkles: Sparkles,
  utensils: Utensils,
};

type CompanionProgressCopy = (typeof companionProgressCopy)[AppLanguage];

const getCompanionProgressCopy = (language: AppLanguage): CompanionProgressCopy => {
  switch (language) {
    case "pl":
      return companionProgressCopy.pl;
    case "en":
      return companionProgressCopy.en;
    case "uk":
    default:
      return companionProgressCopy.uk;
  }
};

const getAchievementIcon = (icon: string | undefined) =>
  icon ? Object.entries(achievementIconMap).find(([iconName]) => iconName === icon)?.[1] : undefined;

interface CompanionProgressCardProps {
  embedded?: boolean;
}

export const CompanionProgressCard = ({ embedded = false }: CompanionProgressCardProps) => {
  const companionState = useSelector((state: RootState) => state.companion ?? null);
  const { appLanguage } = useLanguage();
  const copy = getCompanionProgressCopy(appLanguage);
  const model = buildCompanionProgressCardModel(companionState);
  const stats = [
    { label: copy.level, value: model.level.toString() },
    { label: copy.xp, value: model.xp.toString() },
    { label: copy.coins, value: model.coins.toString() },
    { label: copy.relationship, value: model.relationshipLevel.toString() },
  ];
  const content = (
    <Box
      component={motion.div}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      <Stack spacing={2}>
        <SectionHeader title={copy.title} description={copy.description} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
            gap: 1,
          }}
        >
          {stats.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 1.4,
                borderRadius: 1,
                border: "1px solid var(--sn-border-soft)",
                backgroundColor: embedded
                  ? "var(--sn-surface-elevated)"
                  : "var(--sn-surface-glass)",
                minWidth: 0,
              }}
            >
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 800 }}>
                {stat.label}
              </Typography>
              <Typography component="p" variant="h6" sx={{ fontWeight: 900 }}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack spacing={0.8}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>
              {model.nextLevelXp === null
                ? copy.maxLevel
                : `${model.xp} / ${model.nextLevelXp} ${copy.xp}`}
            </Typography>
            <Typography color="text.secondary" sx={{ fontWeight: 800 }}>
              {model.progressPercent}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={model.progressPercent}
            sx={{
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(15, 23, 42, 0.08)",
              "& .MuiLinearProgress-bar": {
                background:
                  "linear-gradient(135deg, rgba(15,118,110,1) 0%, rgba(101,163,13,1) 100%)",
              },
            }}
          />
          <Typography color="text.secondary">
            {model.nextLevelXp === null ? copy.maxLevel : copy.nextLevel(model.xpToNextLevel)}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 900 }}>{copy.achievementsTitle}</Typography>
          {model.recentAchievements.length > 0 ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {model.recentAchievements.map((achievement) => {
                const Icon = getAchievementIcon(achievement.icon);

                return (
                  <Chip
                    key={achievement.id}
                    icon={Icon ? <Icon size={14} /> : undefined}
                    label={achievement.title}
                    variant="outlined"
                    color="success"
                  />
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary">{copy.noAchievements}</Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );

  if (embedded) {
    return content;
  }

  return <SectionCard tone="premium">{content}</SectionCard>;
};

export default CompanionProgressCard;
