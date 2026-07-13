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
    title: "Розвиток компаньйона",
    description: "Персонаж росте від реальних дій: їжі, води, цілей і спілкування.",
    level: "Рівень",
    xp: "XP",
    coins: "Монети",
    relationship: "Зв'язок",
    bond: "Довіра",
    stageLabel: "Стадія",
    stages: {
      spark: "Іскра знайомства",
      aware: "Вже розуміє ритм",
      trusted: "Надійний напарник",
      deep: "Глибокий контекст",
    },
    rituals: {
      complete_onboarding: "Завершіть анкету, щоб компаньйон отримав перший справжній контекст.",
      log_meal: "Додайте прийом їжі або скан продукту, щоб він краще бачив ваш день.",
      log_water: "Позначте воду кілька разів за день, щоб посилити зв'язок і нагадування.",
      keep_rhythm: "Тримайте ритм кілька днів поспіль, щоб відкривати глибші реакції.",
    },
    nextLevel: (value: number) => `До наступного рівня: ${value} XP`,
    maxLevel: "Максимальний рівень відкрито",
    achievementsTitle: "Останні досягнення",
    noAchievements: "Досягнення з'являться після перших реальних дій.",
  },
  pl: {
    title: "Rozwój companiona",
    description: "Postać rośnie dzięki realnym akcjom: jedzeniu, wodzie, celom i rozmowie.",
    level: "Poziom",
    xp: "XP",
    coins: "Monety",
    relationship: "Relacja",
    bond: "Więź",
    stageLabel: "Etap",
    stages: {
      spark: "Pierwsza iskra",
      aware: "Rozumie Twój rytm",
      trusted: "Zaufany partner",
      deep: "Głęboki kontekst",
    },
    rituals: {
      complete_onboarding: "Dokończ ankietę, aby companion dostał pierwszy prawdziwy kontekst.",
      log_meal: "Dodaj posiłek albo zeskanuj produkt, aby lepiej widział Twój dzień.",
      log_water: "Zapisz wodę kilka razy dziennie, aby wzmocnić więź i przypomnienia.",
      keep_rhythm: "Utrzymaj rytm przez kilka dni, aby odblokować głębsze reakcje.",
    },
    nextLevel: (value: number) => `Do następnego poziomu: ${value} XP`,
    maxLevel: "Maksymalny poziom odblokowany",
    achievementsTitle: "Ostatnie osiągnięcia",
    noAchievements: "Osiągnięcia pojawią się po pierwszych realnych akcjach.",
  },
  en: {
    title: "Companion evolution",
    description: "The character grows from real actions: food, water, goals, and conversation.",
    level: "Level",
    xp: "XP",
    coins: "Coins",
    relationship: "Bond",
    bond: "Trust",
    stageLabel: "Stage",
    stages: {
      spark: "First spark",
      aware: "Learning your rhythm",
      trusted: "Trusted partner",
      deep: "Deep context",
    },
    rituals: {
      complete_onboarding: "Finish the questionnaire so the companion gets its first real context.",
      log_meal: "Add a meal or scan a product so it can understand your day better.",
      log_water: "Log water a few times today to strengthen the bond and reminders.",
      keep_rhythm: "Keep the rhythm for a few days to unlock deeper reactions.",
    },
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

const getStageLabel = (
  copy: CompanionProgressCopy,
  stage: ReturnType<typeof buildCompanionProgressCardModel>["evolutionStage"]
) => {
  switch (stage) {
    case "deep":
      return copy.stages.deep;
    case "trusted":
      return copy.stages.trusted;
    case "aware":
      return copy.stages.aware;
    case "spark":
    default:
      return copy.stages.spark;
  }
};

const getRitualLabel = (
  copy: CompanionProgressCopy,
  ritual: ReturnType<typeof buildCompanionProgressCardModel>["nextRitual"]
) => {
  switch (ritual) {
    case "keep_rhythm":
      return copy.rituals.keep_rhythm;
    case "log_water":
      return copy.rituals.log_water;
    case "log_meal":
      return copy.rituals.log_meal;
    case "complete_onboarding":
    default:
      return copy.rituals.complete_onboarding;
  }
};

interface CompanionProgressCardProps {
  embedded?: boolean;
}

const CompanionProgressCard = ({ embedded = false }: CompanionProgressCardProps) => {
  const companionState = useSelector((state: RootState) => state.companion ?? null);
  const { appLanguage } = useLanguage();
  const copy = getCompanionProgressCopy(appLanguage);
  const model = buildCompanionProgressCardModel(companionState);
  const stageLabel = getStageLabel(copy, model.evolutionStage);
  const ritualLabel = getRitualLabel(copy, model.nextRitual);
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
            p: 1.6,
            borderRadius: 1,
            border: "1px solid var(--sn-border-strong)",
            background:
              "radial-gradient(circle at 92% 10%, var(--sn-accent-soft), transparent 32%), var(--sn-surface-glass)",
          }}
        >
          <Stack spacing={1.1}>
            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
              <Box sx={{ minWidth: 0 }}>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 900 }}>
                  {copy.stageLabel}
                </Typography>
                <Typography component="p" variant="h6" sx={{ fontWeight: 950 }}>
                  {stageLabel}
                </Typography>
              </Box>
              <Chip
                label={`${copy.bond}: ${model.bondPercent}%`}
                color="success"
                variant="outlined"
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={model.bondPercent}
              sx={{
                height: 8,
                borderRadius: 999,
                backgroundColor: "var(--sn-surface-muted)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, rgba(20,184,166,1) 0%, rgba(132,204,22,1) 100%)",
                },
              }}
            />
            <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {ritualLabel}
            </Typography>
          </Stack>
        </Box>

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
