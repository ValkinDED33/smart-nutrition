import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { AssistantRuntimeCard } from "../features/assistant/AssistantRuntimeCard";
import type { RootState } from "../app/store";
import { getAssistantRuntimeStatus } from "../shared/api/assistant";
import { AssistantAvatar } from "../shared/components/AssistantAvatar";
import { useLanguage } from "../shared/language";
import type { AssistantRuntimeStatus } from "../shared/types/assistant";

const aiCopy = {
  uk: {
    title: "AI Companion",
    subtitle:
      "Ваш Clippy 2.0 підказує по харчуванню, пояснює plateau, тримає контекст дня і дає наступну практичну дію.",
    runtimeTitle: "AI runtime",
    runtimeSubtitle:
      "Нижче видно реальний backend-ланцюжок провайдерів і fallback, який використовує асистент.",
    providerChain: "Ланцюжок fallback",
    configured: "AI backend готовий",
    fallbackOn: "Fallback увімкнено",
    fallbackOff: "Fallback вимкнено",
    cloudUnavailable:
      "Cloud runtime зараз недоступний. Сторінка залишає локальний preview, але бойовий AI не активний.",
    assistantSettings: "Поведінка companion береться з налаштувань профілю.",
    featuresTitle: "Що він вміє",
    features: [
      "рада по калоріях, білку і наступному прийому їжі",
      "підказки по воді, вазі, BMI, plateau і weekly check-in",
      "щоденні мотиваційні повідомлення та історія діалогу",
    ],
    primary: "Основний",
    backup: "Резерв",
  },
  pl: {
    title: "AI Companion",
    subtitle:
      "Twój Clippy 2.0 podpowiada w żywieniu, tłumaczy plateau, trzyma kontekst dnia i daje kolejną praktyczną akcję.",
    runtimeTitle: "AI runtime",
    runtimeSubtitle:
      "Niżej widać realny backendowy łańcuch providerów i fallback, którego używa asystent.",
    providerChain: "Łańcuch fallback",
    configured: "AI backend gotowy",
    fallbackOn: "Fallback aktywny",
    fallbackOff: "Fallback wyłączony",
    cloudUnavailable:
      "Cloud runtime jest teraz niedostępny. Strona zostawia local preview, ale produkcyjny AI nie jest aktywny.",
    assistantSettings: "Zachowanie companion bierze się z ustawień profilu.",
    featuresTitle: "Co potrafi",
    features: [
      "rada dotycząca kalorii, białka i kolejnego posiłku",
      "podpowiedzi o wodzie, wadze, BMI, plateau i weekly check-in",
      "codzienne wiadomości motywacyjne i historia rozmowy",
    ],
    primary: "Główny",
    backup: "Zapasowy",
  },
} as const;

const AiCompanionPage = () => {
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { language } = useLanguage();
  const copy = aiCopy[language];
  const [runtimeStatus, setRuntimeStatus] = useState<AssistantRuntimeStatus | null>(null);

  useEffect(() => {
    let active = true;

    void getAssistantRuntimeStatus().then((status) => {
      if (active) {
        setRuntimeStatus(status);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const providers = runtimeStatus?.providers ?? [];

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          color: "white",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.92) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <AssistantAvatar name={assistant.name} size={76} />
          <Stack spacing={1.2}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
              {assistant.name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {copy.title}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.84)" }}>{copy.subtitle}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={assistant.role} />
              <Chip label={assistant.tone} />
              <Chip label={copy.assistantSettings} />
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.7}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.runtimeTitle}
            </Typography>
            <Typography color="text.secondary">{copy.runtimeSubtitle}</Typography>
          </Stack>

          {runtimeStatus?.configured ? (
            <>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={copy.configured} color="success" variant="outlined" />
                <Chip
                  label={runtimeStatus.fallbackEnabled ? copy.fallbackOn : copy.fallbackOff}
                  color={runtimeStatus.fallbackEnabled ? "primary" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>{copy.providerChain}</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {providers.map((provider) => (
                    <Paper
                      key={provider.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 4,
                        borderColor: provider.primary
                          ? "rgba(15,118,110,0.25)"
                          : "rgba(15,23,42,0.08)",
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            color={provider.primary ? "success" : "default"}
                            label={provider.primary ? copy.primary : copy.backup}
                          />
                          <Chip size="small" variant="outlined" label={`#${provider.priority}`} />
                        </Stack>
                        <Typography sx={{ fontWeight: 800 }}>{provider.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {provider.model ?? provider.id}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            </>
          ) : (
            <Alert severity="warning">{copy.cloudUnavailable}</Alert>
          )}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255,255,255,0.86)",
        }}
      >
        <Stack spacing={1.2}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.featuresTitle}
          </Typography>
          {copy.features.map((item) => (
            <Typography key={item} color="text.secondary">
              • {item}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <AssistantRuntimeCard />
    </Stack>
  );
};

export default AiCompanionPage;
