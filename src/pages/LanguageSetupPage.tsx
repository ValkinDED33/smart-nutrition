import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch } from "../app/store";
import { useLanguage } from "../shared/language";
import { setProfileLanguage } from "../features/profile/profileSlice";

const cardStyle = {
  borderRadius: 6,
  p: { xs: 3, md: 4 },
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,250,252,0.92) 100%)",
} as const;

type OnboardingStep = "language" | "intro" | "auth";

const onboardingCopy = {
  uk: {
    eyebrow: "Перший запуск",
    brand: "Smart Nutrition + AI Companion",
    flowBody:
      "Smart Nutrition починається з короткого onboarding flow: мова, можливості та безпечний вхід без зайвого шуму.",
    steps: ["Мова", "Можливості", "Вхід"],
    languageTitle: "Оберіть мову інтерфейсу",
    languageBody:
      "Інтерфейс, помічник і підказки працюватимуть обраною мовою. Це займає кілька секунд.",
    introTitle: "Усе важливе зібрано в короткі мобільні екрани",
    introBody:
      "Платформа підлаштована під режим однієї руки: без довгих сторінок, з offline-first логікою і швидкими діями.",
    authTitle: "Готово. Переходимо до безпечного входу",
    authBody:
      "Токени не живуть у localStorage: сесія працює через backend, а дані підтягнуться після входу та синхронізації.",
    changeLanguage: "Змінити мову",
    continue: "Далі",
    back: "Назад",
    register: "Створити акаунт",
    login: "Увійти",
    authHint: "Після входу відкриється персональна Home-сторінка з цілями, їжею, водою та AI.",
    privacyPills: ["Коротка форма", "Показати пароль", "httpOnly session"],
    featureCards: [
      {
        title: "Їжа, вода, вага",
        body: "Додавайте прийоми їжі, стакани води, вагу та заміри без зайвих переходів.",
      },
      {
        title: "Clippy 2.0",
        body: "AI-компаньйон підказує, пояснює ІМТ і нагадує про рутину без нав'язливості.",
      },
      {
        title: "Offline-first",
        body: "Записи зберігаються локально, а при появі інтернету автоматично летять у sync.",
      },
    ],
  },
  pl: {
    eyebrow: "Pierwsze uruchomienie",
    brand: "Smart Nutrition + AI Companion",
    flowBody:
      "Smart Nutrition zaczyna się od krótkiego onboardingu: język, możliwości i bezpieczne logowanie bez zbędnego szumu.",
    steps: ["Język", "Możliwości", "Logowanie"],
    languageTitle: "Wybierz język interfejsu",
    languageBody:
      "Interfejs, asystent i podpowiedzi będą działać w wybranym języku. To zajmie tylko chwilę.",
    introTitle: "Najważniejsze rzeczy są podzielone na krótkie mobilne ekrany",
    introBody:
      "Platforma jest zbudowana pod obsługę jedną ręką: bez długich stron, z offline-first i szybkimi akcjami.",
    authTitle: "Gotowe. Przechodzimy do bezpiecznego logowania",
    authBody:
      "Tokeny nie są trzymane w localStorage: sesja działa przez backend, a dane wrócą po zalogowaniu i synchronizacji.",
    changeLanguage: "Zmień język",
    continue: "Dalej",
    back: "Wstecz",
    register: "Załóż konto",
    login: "Zaloguj się",
    authHint:
      "Po zalogowaniu otworzy się osobny ekran Home z celami, posiłkami, wodą i AI.",
    privacyPills: ["Krótki formularz", "Pokaż hasło", "Sesja httpOnly"],
    featureCards: [
      {
        title: "Posiłki, woda, waga",
        body: "Dodawaj posiłki, szklanki wody, wagę i pomiary bez zbędnego klikania.",
      },
      {
        title: "Clippy 2.0",
        body: "AI companion podpowiada, tłumaczy BMI i przypomina o rutynie bez bycia natrętnym.",
      },
      {
        title: "Offline-first",
        body: "Wpisy zapisują się lokalnie, a po powrocie internetu lecą do synchronizacji.",
      },
    ],
  },
} as const;

const LanguageSetupPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { language, setLanguage, completeOnboarding, hasExplicitChoice } = useLanguage();
  const [step, setStep] = useState<OnboardingStep>(hasExplicitChoice ? "intro" : "language");
  const copy = onboardingCopy[language];
  const stepOrder: OnboardingStep[] = ["language", "intro", "auth"];
  const activeStepIndex = stepOrder.indexOf(step);

  const selectLanguage = (language: "uk" | "pl") => {
    setLanguage(language);
    dispatch(setProfileLanguage(language));
    setStep("intro");
  };

  const openAuth = (path: "/register" | "/login") => {
    completeOnboarding();
    navigate(path, { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(30,136,229,0.18), transparent 28%), radial-gradient(circle at top right, rgba(67,160,71,0.22), transparent 32%), linear-gradient(180deg, #f5f7fb 0%, #eef6ef 100%)",
        px: 2,
      }}
    >
      <Paper elevation={0} sx={{ ...cardStyle, width: "100%", maxWidth: 760 }}>
        <Stack spacing={3.5}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {copy.brand}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mt: 1 }}>
              {copy.eyebrow}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
              {copy.flowBody}
            </Typography>
          </Box>

          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1}>
              {copy.steps.map((label, index) => {
                const isActive = index <= activeStepIndex;

                return (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: isActive ? "#0f766e" : "rgba(15, 23, 42, 0.08)",
                        transition: "background-color 160ms ease",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.8,
                        color: isActive ? "#0f766e" : "text.secondary",
                        fontWeight: isActive ? 800 : 600,
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Stack>

          {step === "language" ? (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {copy.languageTitle}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.75 }}>
                  {copy.languageBody}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ alignItems: "stretch" }}
              >
                <Button
                  variant={language === "uk" ? "contained" : "outlined"}
                  size="large"
                  onClick={() => selectLanguage("uk")}
                  sx={{
                    flex: 1,
                    minHeight: 136,
                    borderRadius: 5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    background:
                      language === "uk"
                        ? "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)"
                        : undefined,
                    borderColor: "rgba(15, 23, 42, 0.12)",
                    color: language === "uk" ? "#ffffff" : "#14213d",
                    backgroundColor:
                      language === "uk" ? undefined : "rgba(255,255,255,0.72)",
                  }}
                >
                  Українська
                </Button>
                <Button
                  variant={language === "pl" ? "contained" : "outlined"}
                  size="large"
                  onClick={() => selectLanguage("pl")}
                  sx={{
                    flex: 1,
                    minHeight: 136,
                    borderRadius: 5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    background:
                      language === "pl"
                        ? "linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%)"
                        : undefined,
                    borderColor: "rgba(15, 23, 42, 0.12)",
                    color: language === "pl" ? "#ffffff" : "#14213d",
                    backgroundColor:
                      language === "pl" ? undefined : "rgba(255,255,255,0.72)",
                  }}
                >
                  Polski
                </Button>
              </Stack>
            </Stack>
          ) : null}

          {step === "intro" ? (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {copy.introTitle}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.75 }}>
                  {copy.introBody}
                </Typography>
              </Box>

              <Stack spacing={1.4}>
                {copy.featureCards.map((feature, index) => (
                  <Paper
                    key={feature.title}
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: 4,
                      border: "1px solid rgba(15, 23, 42, 0.08)",
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(101,163,13,0.08))"
                          : "rgba(255,255,255,0.76)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800 }}>{feature.title}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                      {feature.body}
                    </Typography>
                  </Paper>
                ))}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setStep("auth")}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }}
                >
                  {copy.continue}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setStep("language")}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    borderColor: "rgba(15, 23, 42, 0.12)",
                    color: "#14213d",
                  }}
                >
                  {copy.changeLanguage}
                </Button>
              </Stack>
            </Stack>
          ) : null}

          {step === "auth" ? (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {copy.authTitle}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.75 }}>
                  {copy.authBody}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {copy.privacyPills.map((pill) => (
                  <Chip
                    key={pill}
                    label={pill}
                    sx={{
                      bgcolor: "rgba(15,118,110,0.08)",
                      color: "#0f766e",
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 4,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  background:
                    "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(255,255,255,0.92))",
                }}
              >
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {copy.authHint}
                </Typography>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => openAuth("/register")}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
                  }}
                >
                  {copy.register}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => openAuth("/login")}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    borderColor: "rgba(15, 23, 42, 0.12)",
                    color: "#14213d",
                  }}
                >
                  {copy.login}
                </Button>
              </Stack>

              <Button
                variant="text"
                onClick={() => setStep("intro")}
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#0f766e",
                }}
              >
                {copy.back}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
};

export default LanguageSetupPage;
