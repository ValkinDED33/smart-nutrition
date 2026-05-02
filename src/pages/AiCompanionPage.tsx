import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { AssistantRuntimeCard } from "../features/assistant/AssistantRuntimeCard";
import type { RootState } from "../app/store";
import {
  selectTodayMealItems,
  selectTodayMealTotalNutrients,
} from "../features/meal/selectors";
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
    greeting: (name: string) => `Привіт, ${name}. Я вже дивлюся на ваш день.`,
    focusTitle: "Що зробити зараз",
    actionButton: "Відкрити",
    noMealTitle: "Додайте перший прийом їжі",
    noMealBody:
      "Почніть з одного продукту або швидкої порції, щоб AI мав реальний контекст дня.",
    waterTitle: (value: number) => `Вода: залишилося ${value} мл`,
    waterBody:
      "Закрийте норму маленькими порціями. Один клік по стакану оновить прогрес.",
    caloriesLowTitle: "Калорій ще мало",
    caloriesLowBody:
      "Додайте простий прийом їжі, щоб не зривати день ввечері.",
    caloriesHighTitle: "Калорії вище плану",
    caloriesHighBody:
      "Подивіться щоденник і зробіть решту дня легшою без різких рішень.",
    profileTitle: "Задайте ціль ваги",
    profileBody:
      "Ціль відкриє шкалу прогресу, точнішу норму води і кращі AI-поради.",
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
    greeting: (name: string) => `Cześć, ${name}. Już patrzę na Twój dzień.`,
    focusTitle: "Co zrobić teraz",
    actionButton: "Otwórz",
    noMealTitle: "Dodaj pierwszy posiłek",
    noMealBody:
      "Zacznij od jednego produktu albo szybkiej porcji, żeby AI miało realny kontekst dnia.",
    waterTitle: (value: number) => `Woda: zostało ${value} ml`,
    waterBody:
      "Domknij normę małymi porcjami. Jedno kliknięcie w szklankę aktualizuje progres.",
    caloriesLowTitle: "Kalorii jest jeszcze mało",
    caloriesLowBody:
      "Dodaj prosty posiłek, żeby wieczorem nie nadrabiać chaotycznie.",
    caloriesHighTitle: "Kalorie są ponad plan",
    caloriesHighBody:
      "Sprawdź dziennik i ustaw resztę dnia lżej, bez ostrych skrętów.",
    profileTitle: "Ustaw cel wagi",
    profileBody:
      "Cel odblokuje skalę progresu, dokładniejszą normę wody i lepsze rady AI.",
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
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const todayItems = useSelector(selectTodayMealItems);
  const todayTotals = useSelector(selectTodayMealTotalNutrients);
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
  const calorieTarget = Math.max(profile.dailyCalories, 0);
  const calorieProgress =
    calorieTarget > 0 ? Math.min((todayTotals.calories / calorieTarget) * 100, 120) : 0;
  const remainingWaterMl = Math.max(water.dailyTargetMl - water.consumedMl, 0);
  const actionCards = [
    ...(todayItems.length === 0
      ? [
          {
            id: "first-meal",
            title: copy.noMealTitle,
            body: copy.noMealBody,
            to: "/meals",
            progress: null,
          },
        ]
      : []),
    ...(remainingWaterMl > 0
      ? [
          {
            id: "water",
            title: copy.waterTitle(remainingWaterMl),
            body: copy.waterBody,
            to: "/progress",
            progress: water.dailyTargetMl
              ? Math.min((water.consumedMl / water.dailyTargetMl) * 100, 100)
              : 0,
          },
        ]
      : []),
    ...(calorieTarget > 0 && todayTotals.calories > calorieTarget * 1.08
      ? [
          {
            id: "calories-high",
            title: copy.caloriesHighTitle,
            body: copy.caloriesHighBody,
            to: "/meals",
            progress: Math.min(calorieProgress, 100),
          },
        ]
      : calorieTarget > 0 && todayTotals.calories < calorieTarget * 0.45
        ? [
            {
              id: "calories-low",
              title: copy.caloriesLowTitle,
              body: copy.caloriesLowBody,
              to: "/meals",
              progress: calorieProgress,
            },
          ]
        : []),
    ...(!profile.targetWeight
      ? [
          {
            id: "profile-target",
            title: copy.profileTitle,
            body: copy.profileBody,
            to: "/profile",
            progress: null,
          },
        ]
      : []),
  ].slice(0, 3);

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          color: "white",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,118,110,0.92) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <AssistantAvatar name={assistant.name} size={76} />
          <Stack spacing={1.2} sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)" }}>
              {assistant.name}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, fontSize: { xs: 38, md: 42 } }}
            >
              {copy.title}
            </Typography>
            {user && (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 800,
                  overflowWrap: "anywhere",
                }}
              >
                {copy.greeting(user.name)}
              </Typography>
            )}
            <Typography sx={{ color: "rgba(255,255,255,0.84)", overflowWrap: "anywhere" }}>
              {copy.subtitle}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {[assistant.role, assistant.tone].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  variant="outlined"
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.26)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
              <Chip
                label={copy.assistantSettings}
                variant="outlined"
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  color: "white",
                  borderColor: "rgba(255,255,255,0.26)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {actionCards.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 1,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.86)",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {copy.focusTitle}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              {actionCards.map((card) => (
                <Paper
                  key={card.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: "rgba(248,250,252,0.88)",
                  }}
                >
                  <Stack spacing={1.2} sx={{ height: "100%" }}>
                    <Typography sx={{ fontWeight: 900 }}>{card.title}</Typography>
                    <Typography color="text.secondary">{card.body}</Typography>
                    {card.progress !== null && (
                      <LinearProgress
                        variant="determinate"
                        value={card.progress}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="outlined"
                      onClick={() => navigate(card.to)}
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 999,
                      }}
                    >
                      {copy.actionButton}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 1,
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
                        borderRadius: 1,
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
          p: { xs: 2, md: 3 },
          borderRadius: 1,
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
