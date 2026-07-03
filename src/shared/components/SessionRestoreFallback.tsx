import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Cloud, RefreshCw, ShieldCheck } from "lucide-react";
import { useLanguage } from "../language";

const restoreCopy = {
  uk: {
    title: "Відновлюю вхід",
    checkingTitle: "Повертаю вашу сесію",
    body:
      "Схоже, хмарний сервер прокидається. Я пробую повернути вашу сесію без повторної реєстрації.",
    checkingBody:
      "Безпечно перевіряю cookie-сесію та хмарні дані. Приватні дії відкриються одразу після підтвердження входу.",
    status: "Backend прокидається · сесія перевіряється",
    retry: "Спробувати ще раз",
    forget: "Увійти вручну",
  },
  pl: {
    title: "Przywracam logowanie",
    checkingTitle: "Przywracam Twoją sesję",
    body:
      "Wygląda na to, że serwer w chmurze się budzi. Próbuję przywrócić sesję bez ponownej rejestracji.",
    checkingBody:
      "Bezpiecznie sprawdzam sesję cookie i dane w chmurze. Prywatne akcje odblokują się po potwierdzeniu logowania.",
    status: "Backend się budzi · sesja jest sprawdzana",
    retry: "Spróbuj ponownie",
    forget: "Zaloguj ręcznie",
  },
  en: {
    title: "Restoring your session",
    checkingTitle: "Bringing your session back",
    body:
      "The cloud server looks like it is waking up. I am trying to bring your session back without registration.",
    checkingBody:
      "Safely checking your cookie session and cloud data. Private actions unlock as soon as sign-in is confirmed.",
    status: "Backend waking up · session check in progress",
    retry: "Try again",
    forget: "Log in manually",
  },
} as const;

interface SessionRestoreFallbackProps {
  onForgetSession: () => void;
  onRetry: () => void;
  status?: "checking" | "unavailable";
}

export const SessionRestoreFallback = ({
  onForgetSession,
  onRetry,
  status = "unavailable",
}: SessionRestoreFallbackProps) => {
  const { appLanguage } = useLanguage();
  const copy = restoreCopy[appLanguage];
  const isChecking = status === "checking";

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: "min(100vh, 720px)",
        px: { xs: 2, sm: 3 },
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(100%, 520px)",
          p: { xs: 2.5, sm: 3 },
          borderRadius: 1,
          border: "1px solid var(--sn-border-soft)",
          bgcolor: "var(--sn-surface-glass)",
          boxShadow: "var(--sn-shadow-card)",
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.4} alignItems="center">
            <Box
              aria-hidden
              sx={{
                width: 54,
                height: 54,
                borderRadius: "18px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: "#ffffff",
                fontWeight: 950,
                letterSpacing: 0,
                background:
                  "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.42), transparent 24%), linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
                boxShadow: "0 18px 36px rgba(15, 118, 110, 0.22)",
              }}
            >
              SN
            </Box>
            <Stack spacing={0.25} minWidth={0}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                {isChecking ? (
                  <Cloud size={21} color="#0f766e" />
                ) : (
                  <ShieldCheck size={21} color="#0f766e" />
                )}
                <Typography component="h1" variant="h5" sx={{ fontWeight: 950 }}>
                  {isChecking ? copy.checkingTitle : copy.title}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          <Typography color="text.secondary">
            {isChecking ? copy.checkingBody : copy.body}
          </Typography>
          <Box
            sx={{
              px: 1.2,
              py: 0.8,
              borderRadius: 999,
              width: "fit-content",
              color: "#0f766e",
              bgcolor: "rgba(20,184,166,0.1)",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {copy.status}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              startIcon={<RefreshCw size={17} />}
              onClick={onRetry}
              disabled={isChecking}
            >
              {copy.retry}
            </Button>
            <Button variant="outlined" onClick={onForgetSession}>
              {copy.forget}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default SessionRestoreFallback;
