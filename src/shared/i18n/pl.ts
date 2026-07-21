import { assistant } from "./assistant";
import { navigation } from "./navigation";
import { onboarding } from "./onboarding";

export const pl = {
  "errorBoundary.title": "Coś poszło nie tak",
  "errorBoundary.subtitle":
    "Możesz spróbować wrócić do ekranu, odświeżyć aplikację albo bezpiecznie naprawić widok. Sesja konta nie zostanie usunięta.",
  "errorBoundary.action": "Przeładuj aplikację",
  "errorBoundary.retry": "Spróbuj ponownie",
  "errorBoundary.safeReset": "Bezpiecznie napraw",
  "errorBoundary.home": "Na stronę główną",
  "errorBoundary.diagnostic": "Kod diagnostyczny",
  "errorBoundary.recovering": "Odświeżamy aplikację i przywracamy stabilny ekran...",
  "errorBoundary.resetting": "Naprawiamy widok bez wylogowania z konta...",
  "auth.forgotPassword": "Zapomniałeś hasła?",
  "auth.showPassword": "Pokaż hasło",
  "auth.hidePassword": "Ukryj hasło",
  "auth.notVerified": "Potwierdź email przyciskiem w wiadomości przed logowaniem.",
  "auth.accountBanned": "Konto zostało zablokowane przez administratora.",
  "auth.registrationNote":
    "Utwórz konto i potwierdź email przyciskiem w wiadomości. Potem asystent spokojnie przeprowadzi krótką konfigurację profilu.",
  "auth.registrationAssistantIntro":
    "Po potwierdzeniu zapytam o 7 rzeczy: imię, wiek, płeć, wzrost, wagę i główny cel.",
  "auth.checkingAvailability": "Sprawdzamy dostępność...",
  "auth.nameAvailable": "Imię jest dostępne.",
  "auth.emailAvailable": "Email jest dostępny.",
  "auth.nameInUse": "To imię jest już używane.",
  "auth.availabilityUnavailable": "Nie udało się sprawdzić dostępności. Spróbuj ponownie.",
  "auth.resend": "Wyślij ponownie",
  "auth.confirmationSent": "Wysłaliśmy link potwierdzający na {target}.",
  "auth.openConfirmationEmail": "Otwórz wiadomość i kliknij przycisk potwierdzenia emaila.",
  "auth.invalidConfirmationLink": "Nieprawidłowy albo wygasły link potwierdzający.",
  "auth.deliveryUnavailable":
    "Nie udało się wysłać emaila potwierdzającego. Spróbuj ponownie za chwilę albo skontaktuj się ze wsparciem.",
  "auth.verifyTitle": "Potwierdzamy email",
  "auth.verifyBody":
    "Poczekaj kilka sekund. Po potwierdzeniu od razu otworzymy onboarding asystenta.",
  "auth.verifySuccess": "Email potwierdzony. Uruchamiamy asystenta...",
  "auth.verifyGeneric": "Nie udało się potwierdzić emaila. Wyślij wiadomość jeszcze raz.",
  "auth.backToRegister": "Wróć do rejestracji",
  "auth.forgotTitle": "Reset hasła",
  "auth.forgotSubtitle":
    "Podaj email konta, a przygotujemy link do ustawienia nowego hasła.",
  "auth.forgotSubmit": "Wyślij link resetu",
  "auth.forgotSending": "Przygotowuję link...",
  "auth.forgotSuccess":
    "Jeśli konto z tym adresem email istnieje, wysłaliśmy link resetu hasła.",
  "auth.backToLogin": "Wróć do logowania",
  "auth.forgotGenericError": "Nie udało się przygotować linku resetu.",
  "auth.resetDeliveryUnavailable":
    "Reset hasła przez email jest chwilowo niedostępny. Spróbuj później.",
  "auth.resetTitle": "Nowe hasło",
  "auth.resetSubtitle":
    "Ustaw nowe hasło. Link resetu jest jednorazowy i ma ograniczony czas ważności.",
  "auth.resetSubmit": "Zapisz nowe hasło",
  "auth.resetSaving": "Zapisuję...",
  "auth.resetSuccess": "Hasło zostało zaktualizowane. Możesz zalogować się nowym hasłem.",
  "auth.invalidResetToken": "Link resetu jest nieprawidłowy albo już wygasł.",
  "auth.weakResetPassword":
    "Hasło musi mieć co najmniej 10 znaków, wielką, małą literę, cyfrę i symbol.",
  "auth.missingResetToken":
    "Brakuje tokenu resetu. Otwórz stronę z linku z maila.",
  navigation: navigation.pl,
  onboarding: onboarding.pl,
  assistant: assistant.pl,
  language: {
    label: "Język",
    current: "Polski",
    selectTitle: "Wybierz język",
    selectBody: "Asystent i cały interfejs będą używać tego języka.",
    add: "Dodaj język",
    uk: "Українська",
    pl: "Polski",
    en: "English",
  },
  page: {
    food: {
      title: "Jedzenie",
      subtitle: "Wyszukiwanie, kod kreskowy, szybkie składanie posiłku i historia.",
    },
    recipes: {
      title: "Przepisy",
      subtitle: "Przepisy, lodówka i inteligentne rekomendacje poza dziennikiem jedzenia.",
    },
    community: {
      title: "Społeczność",
      subtitle: "Doświadczenia, progres i wsparcie innych użytkowników.",
    },
  },
} as const;
