import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot } from "lucide-react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "@app/store";
import type { AssistantArea } from "@features/assistant/assistantManifest";
import { AssistantAvatar } from "@shared/components/AssistantAvatar";
import { useLanguage } from "@shared/language";
import {
  assistantSpeechBubbleVariants,
  assistantSpeechStaggerVariants,
  fadeUpVariants,
} from "@shared/ui/motion";
import { captureRuntimeEvent } from "@integration/runtime/analytics";
import { resolveGlobalAssistantLayerModel } from "./globalAssistantLayerModel";

const layerCopy = {
  uk: {
    eyebrow: "Асистент поруч",
    fallbackTitle: "Готовий допомогти",
    fallbackBody:
      "Я підлаштовую підказки під поточний екран, профіль і вашу ціль.",
    action: "Відкрити AI",
    mobileLabel: "Відкрити асистента",
    duties: {
      guide: "веде",
      explain: "пояснює",
      warn: "попереджає",
      motivate: "мотивує",
      suggest: "радить",
      remind: "нагадує",
      analyze: "аналізує",
      navigate: "веде далі",
    },
  },
  pl: {
    eyebrow: "Asystent jest obok",
    fallbackTitle: "Gotowy do pomocy",
    fallbackBody:
      "Dopasowuję podpowiedzi do bieżącego ekranu, profilu i celu.",
    action: "Otwórz AI",
    mobileLabel: "Otwórz asystenta",
    duties: {
      guide: "prowadzi",
      explain: "wyjaśnia",
      warn: "ostrzega",
      motivate: "motywuje",
      suggest: "podpowiada",
      remind: "przypomina",
      analyze: "analizuje",
      navigate: "prowadzi dalej",
    },
  },
  en: {
    eyebrow: "Assistant nearby",
    fallbackTitle: "Ready to help",
    fallbackBody:
      "I adapt guidance to the current screen, profile, and goal.",
    action: "Open AI",
    mobileLabel: "Open assistant",
    duties: {
      guide: "guide",
      explain: "explain",
      warn: "warn",
      motivate: "motivate",
      suggest: "suggest",
      remind: "remind",
      analyze: "analyze",
      navigate: "navigate",
    },
  },
} as const;

const moodByAreaTone: Record<
  AssistantArea,
  "happy" | "coach" | "concerned" | "celebrate"
> = {
  onboarding: "happy",
  home: "happy",
  meals: "coach",
  coach: "happy",
  progress: "coach",
  profile: "happy",
  community: "celebrate",
  recipes: "coach",
  water: "concerned",
  admin: "coach",
  unknown: "happy",
};

export const GlobalAssistantLayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = layerCopy[appLanguage];
  const layerModel = useMemo(
    () => resolveGlobalAssistantLayerModel(location.pathname),
    [location.pathname]
  );
  const { area, defaultAction, duties, primaryCapability } = layerModel;

  if (
    !user ||
    !assistant.widgetEnabled ||
    !layerModel.isVisibleOnAuthenticatedRoute ||
    !defaultAction
  ) {
    return null;
  }

  const handleOpenAssistant = () => {
    captureRuntimeEvent("global_assistant_opened", {
      area,
      path: location.pathname,
      capability: primaryCapability?.id ?? "unknown",
      actionRoute: defaultAction.route,
    });
    navigate(defaultAction.route);
  };

  return (
    <AnimatePresence initial={false}>
      <Box
        key={area}
        component={motion.aside}
        layout
        variants={assistantSpeechStaggerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        aria-label={copy.eyebrow}
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: {
            xs: "calc(env(safe-area-inset-bottom, 0px) + 94px)",
            md: 24,
          },
          zIndex: 1190,
          display: "grid",
          gap: 1.2,
          justifyItems: "end",
          pointerEvents: "none",
        }}
      >
        <Paper
          component={motion.div}
          layout
          variants={assistantSpeechBubbleVariants}
          elevation={8}
          sx={{
            display: { xs: "none", md: "block" },
            width: 330,
            p: 2,
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,249,255,0.94) 100%)",
            boxShadow: "0 18px 48px rgba(15,23,42,0.16)",
            pointerEvents: "auto",
          }}
        >
          <Stack spacing={1.2}>
            <Stack
              component={motion.div}
              variants={fadeUpVariants}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              useFlexGap
            >
              <Typography
                variant="overline"
                sx={{ color: "#0f766e", fontWeight: 900 }}
              >
                {copy.eyebrow}
              </Typography>
              <Chip
                size="small"
                label={area}
                variant="outlined"
                color="success"
              />
            </Stack>

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              sx={{ m: 0, fontWeight: 900 }}
            >
              {primaryCapability?.id ?? copy.fallbackTitle}
            </Typography>

            <Typography
              component={motion.p}
              variants={fadeUpVariants}
              color="text.secondary"
              sx={{ m: 0 }}
            >
              {primaryCapability?.description ?? copy.fallbackBody}
            </Typography>

            {duties.length > 0 && (
              <Stack
                component={motion.div}
                variants={fadeUpVariants}
                direction="row"
                spacing={0.8}
                useFlexGap
                flexWrap="wrap"
              >
                {duties.slice(0, 4).map((duty) => (
                  <Chip
                    key={duty}
                    size="small"
                    label={copy.duties[duty]}
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}

            <Button
              component={motion.button}
              variants={fadeUpVariants}
              type="button"
              onClick={handleOpenAssistant}
              startIcon={<Bot size={18} />}
              variant="contained"
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {defaultAction.label || copy.action}
            </Button>
          </Stack>
        </Paper>

        <Box
          component={motion.button}
          type="button"
          layout
          variants={fadeUpVariants}
          onClick={handleOpenAssistant}
          aria-label={copy.mobileLabel}
          sx={{
            width: { xs: 58, md: 66 },
            height: { xs: 58, md: 66 },
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            p: 0,
            background: "transparent",
            pointerEvents: "auto",
          }}
        >
          <AssistantAvatar
            name={assistant.name}
            variant={assistant.companionKind}
            mood={moodByAreaTone[area]}
            active
          />
        </Box>
      </Box>
    </AnimatePresence>
  );
};

export default GlobalAssistantLayer;
