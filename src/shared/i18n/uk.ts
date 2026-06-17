import { assistant } from "./assistant";
import { navigation } from "./navigation";
import { onboarding } from "./onboarding";

export const uk = {
  "errorBoundary.title": "Щось пішло не так",
  "errorBoundary.action": "Перезавантажити застосунок",
  "errorBoundary.recovering": "Оновлюємо застосунок і очищаємо старий кеш...",
  "auth.forgotPassword": "Забули пароль?",
  "auth.showPassword": "Показати пароль",
  "auth.hidePassword": "Сховати пароль",
  "auth.notVerified": "Підтвердіть email кнопкою в листі перед входом.",
  "auth.accountBanned": "Акаунт заблоковано адміністратором.",
  "auth.registrationNote":
    "Створіть акаунт і підтвердіть email кнопкою в листі. Далі Алекс проведе коротке налаштування профілю.",
  "auth.registrationAssistantIntro":
    "Після підтвердження я запитаю 7 речей: ім'я, вік, стать, зріст, вагу і головну ціль.",
  "auth.resend": "Надіслати ще раз",
  "auth.confirmationSent": "Ми надіслали посилання для підтвердження на {target}.",
  "auth.openConfirmationEmail": "Відкрийте лист і натисніть кнопку підтвердження email.",
  "auth.invalidConfirmationLink": "Недійсне або застаріле посилання підтвердження.",
  "auth.deliveryUnavailable":
    "Доставка листа підтвердження тимчасово недоступна на backend.",
  "auth.verifyTitle": "Підтверджуємо email",
  "auth.verifyBody":
    "Зачекайте кілька секунд. Після підтвердження ми одразу відкриємо онбординг помічника.",
  "auth.verifySuccess": "Email підтверджено. Запускаємо помічника...",
  "auth.verifyGeneric": "Не вдалося підтвердити email. Спробуйте надіслати лист ще раз.",
  "auth.backToRegister": "Повернутися до реєстрації",
  "auth.forgotTitle": "Відновлення пароля",
  "auth.forgotSubtitle":
    "Введіть email акаунта, і ми підготуємо посилання для скидання пароля.",
  "auth.forgotSubmit": "Надіслати посилання",
  "auth.forgotSending": "Готую посилання...",
  "auth.forgotSuccess":
    "Якщо акаунт з таким email існує, ми надіслали посилання для скидання пароля.",
  "auth.backToLogin": "Повернутися до входу",
  "auth.forgotGenericError": "Не вдалося підготувати посилання.",
  "auth.resetDeliveryUnavailable":
    "На сервері ще не налаштована email-доставка для скидання пароля.",
  "auth.resetTitle": "Новий пароль",
  "auth.resetSubtitle":
    "Встановіть новий пароль. Посилання для скидання одноразове і має обмежений час дії.",
  "auth.resetSubmit": "Зберегти новий пароль",
  "auth.resetSaving": "Зберігаю...",
  "auth.resetSuccess": "Пароль оновлено. Тепер можна увійти з новим паролем.",
  "auth.invalidResetToken": "Посилання для скидання недійсне або вже прострочене.",
  "auth.weakResetPassword":
    "Пароль має містити щонайменше 10 символів, велику, малу літеру, цифру та символ.",
  "auth.missingResetToken":
    "Тут немає reset-токена. Відкрийте сторінку з посилання з листа.",
  navigation: navigation.uk,
  onboarding: onboarding.uk,
  assistant: assistant.uk,
  language: {
    label: "Мова",
    current: "Українська",
    selectTitle: "Оберіть мову",
    selectBody: "Помічник і весь інтерфейс працюватимуть цією мовою.",
    add: "Додати мову",
    uk: "Українська",
    pl: "Polski",
    en: "English",
  },
  page: {
    food: {
      title: "Їжа",
      subtitle: "Пошук, штрихкод, швидке складання страви та історія харчування.",
    },
    recipes: {
      title: "Рецепти",
      subtitle: "Рецепти, холодильник і розумні рекомендації окремо від щоденника їжі.",
    },
    community: {
      title: "Спільнота",
      subtitle: "Досвід, прогрес і підтримка інших користувачів.",
    },
  },
} as const;
