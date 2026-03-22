/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "uk" | "pl";

const STORAGE_KEY = "smart-nutrition.language";

const dictionaries = {
  uk: {
    "brand.name": "Smart Nutrition",
    "brand.tagline": "Розумне харчування без хаосу",
    "nav.dashboard": "Панель",
    "nav.meals": "Страви",
    "nav.profile": "Профіль",
    "nav.login": "Увійти",
    "nav.register": "Реєстрація",
    "nav.logout": "Вийти",
    "lang.label": "Мова",
    "lang.uk": "Українська",
    "lang.pl": "Polski",
    "landing.eyebrow": "Планування харчування",
    "landing.title":
      "Безпечна реєстрація, персональний профіль і контроль калорій в одному місці.",
    "landing.subtitle":
      "Створюйте акаунт, зберігайте цілі, відстежуйте денний прогрес і керуйте харчуванням у захищеному інтерфейсі.",
    "landing.primary": "Створити акаунт",
    "landing.secondary": "Увійти",
    "landing.card1.title": "Захищений доступ",
    "landing.card1.body":
      "Сесія відновлюється лише для валідного користувача, а невдалі спроби входу обмежуються.",
    "landing.card2.title": "Реєстрація без помилок",
    "landing.card2.body":
      "Перевіряємо унікальність email, силу пароля та коректність усіх даних ще до створення профілю.",
    "landing.card3.title": "Дві мови",
    "landing.card3.body":
      "Інтерфейс миттєво перемикається між українською та польською без перезавантаження.",
    "auth.demoHint": "Демо-акаунт: ivan@mail.com / StrongPass123!",
    "auth.loginTitle": "Безпечний вхід",
    "auth.loginSubtitle":
      "Увійдіть у свій профіль, щоб переглянути план харчування та прогрес.",
    "auth.registerTitle": "Створення профілю",
    "auth.registerSubtitle":
      "Реєстрація створює захищену локальну сесію та персональний профіль користувача.",
    "auth.haveAccount": "Вже маєте акаунт?",
    "auth.noAccount": "Ще немає акаунта?",
    "auth.loginLink": "Увійти",
    "auth.registerLink": "Зареєструватися",
    "auth.submitLogin": "Увійти в акаунт",
    "auth.submitRegister": "Створити акаунт",
    "auth.registerSuccess": "Реєстрацію завершено. Профіль готовий до роботи.",
    "auth.loginSuccess": "Вхід успішний.",
    "form.name": "Ім'я",
    "form.email": "Email",
    "form.password": "Пароль",
    "form.confirmPassword": "Підтвердження пароля",
    "form.age": "Вік",
    "form.weight": "Вага (кг)",
    "form.height": "Зріст (см)",
    "form.gender": "Стать",
    "form.activity": "Активність",
    "form.goal": "Мета",
    "form.dailyCalories": "Денна норма калорій",
    "form.save": "Зберегти зміни",
    "option.gender.male": "Чоловік",
    "option.gender.female": "Жінка",
    "option.activity.sedentary": "Мінімальна",
    "option.activity.light": "Легка",
    "option.activity.moderate": "Середня",
    "option.activity.active": "Висока",
    "option.activity.very_active": "Дуже висока",
    "option.goal.cut": "Схуднення",
    "option.goal.maintain": "Підтримка",
    "option.goal.bulk": "Набір маси",
    "validation.nameMin": "Ім'я має містити щонайменше 2 символи.",
    "validation.invalidEmail": "Вкажіть коректний email.",
    "validation.passwordMin": "Пароль має містити щонайменше 10 символів.",
    "validation.passwordUpper": "Додайте хоча б одну велику літеру.",
    "validation.passwordLower": "Додайте хоча б одну малу літеру.",
    "validation.passwordDigit": "Додайте хоча б одну цифру.",
    "validation.passwordSymbol": "Додайте хоча б один спеціальний символ.",
    "validation.passwordMatch": "Паролі не збігаються.",
    "validation.ageMin": "Вік має бути не менше 10 років.",
    "validation.weightMin": "Вага має бути не менше 30 кг.",
    "validation.heightMin": "Зріст має бути не менше 120 см.",
    "error.emailInUse": "Користувач з таким email вже існує.",
    "error.invalidCredentials": "Невірний email або пароль.",
    "error.tooManyAttempts": "Забагато невдалих спроб. Спробуйте пізніше.",
    "error.sessionExpired": "Сесія завершилась. Увійдіть повторно.",
    "error.genericLogin": "Не вдалося виконати вхід.",
    "error.genericRegister": "Не вдалося завершити реєстрацію.",
    "error.genericProfile": "Не вдалося зберегти профіль.",
    "dashboard.welcome": "Вітаємо, {name}",
    "dashboard.subtitle":
      "Ось ваш поточний баланс калорій та макроелементів за сьогодні.",
    "dashboard.dailyGoal": "Денна ціль",
    "dashboard.consumed": "Спожито",
    "dashboard.remaining": "Залишилось",
    "dashboard.goal": "Мета",
    "dashboard.age": "Вік",
    "dashboard.weight": "Вага",
    "dashboard.height": "Зріст",
    "dashboard.macros": "Макроелементи",
    "dashboard.protein": "Білки",
    "dashboard.fat": "Жири",
    "dashboard.carbs": "Вуглеводи",
    "dashboard.needLogin": "Будь ласка, увійдіть у систему.",
    "profile.title": "Профіль користувача",
    "profile.subtitle":
      "Оновіть фізичні параметри та ціль, щоб рекомендації були точнішими.",
    "profile.currentStats": "Поточні параметри",
    "profile.progress": "Прогрес за калоріями",
    "profile.measurements": "Заміри",
    "profile.notFound": "Користувача не знайдено.",
    "profile.saved": "Профіль збережено.",
    "notFound.title": "Сторінку не знайдено",
    "notFound.body": "Ймовірно, адреса змінилась або сторінка більше не існує.",
    "notFound.action": "Повернутися на головну",
    "meal.title": "Планувальник харчування",
    "meal.progress": "Прогрес за калоріями",
    "meal.summary": "Загальні нутрієнти",
    "meal.quantity": "Кількість",
    "meal.add": "Додати",
    "meal.invalidQuantity": "Вкажіть коректну кількість.",
    "common.kcal": "ккал",
    "common.kg": "кг",
    "common.cm": "см",
    "common.g": "г",
    "common.mg": "мг",
  },
  pl: {
    "brand.name": "Smart Nutrition",
    "brand.tagline": "Mądre odżywianie bez chaosu",
    "nav.dashboard": "Panel",
    "nav.meals": "Posiłki",
    "nav.profile": "Profil",
    "nav.login": "Zaloguj",
    "nav.register": "Rejestracja",
    "nav.logout": "Wyloguj",
    "lang.label": "Język",
    "lang.uk": "Ukraiński",
    "lang.pl": "Polski",
    "landing.eyebrow": "Planowanie żywienia",
    "landing.title":
      "Bezpieczna rejestracja, profil użytkownika i kontrola kalorii w jednym miejscu.",
    "landing.subtitle":
      "Twórz konto, zapisuj cele, śledź dzienny progres i zarządzaj odżywianiem w chronionym interfejsie.",
    "landing.primary": "Załóż konto",
    "landing.secondary": "Zaloguj się",
    "landing.card1.title": "Chroniony dostęp",
    "landing.card1.body":
      "Sesja jest przywracana tylko dla prawidłowego użytkownika, a nieudane logowania są ograniczane.",
    "landing.card2.title": "Rejestracja bez błędów",
    "landing.card2.body":
      "Sprawdzamy unikalność emaila, siłę hasła i poprawność danych jeszcze przed utworzeniem profilu.",
    "landing.card3.title": "Dwa języki",
    "landing.card3.body":
      "Interfejs przełącza się między ukraińskim a polskim natychmiast, bez odświeżania.",
    "auth.demoHint": "Konto demo: ivan@mail.com / StrongPass123!",
    "auth.loginTitle": "Bezpieczne logowanie",
    "auth.loginSubtitle":
      "Zaloguj się do swojego profilu, aby zobaczyć plan żywienia i postępy.",
    "auth.registerTitle": "Tworzenie profilu",
    "auth.registerSubtitle":
      "Rejestracja tworzy bezpieczną lokalną sesję i osobisty profil użytkownika.",
    "auth.haveAccount": "Masz już konto?",
    "auth.noAccount": "Nie masz jeszcze konta?",
    "auth.loginLink": "Zaloguj się",
    "auth.registerLink": "Zarejestruj się",
    "auth.submitLogin": "Zaloguj do konta",
    "auth.submitRegister": "Utwórz konto",
    "auth.registerSuccess": "Rejestracja zakończona. Profil jest gotowy.",
    "auth.loginSuccess": "Logowanie zakończone sukcesem.",
    "form.name": "Imię",
    "form.email": "Email",
    "form.password": "Hasło",
    "form.confirmPassword": "Potwierdź hasło",
    "form.age": "Wiek",
    "form.weight": "Waga (kg)",
    "form.height": "Wzrost (cm)",
    "form.gender": "Płeć",
    "form.activity": "Aktywność",
    "form.goal": "Cel",
    "form.dailyCalories": "Dzienne zapotrzebowanie",
    "form.save": "Zapisz zmiany",
    "option.gender.male": "Mężczyzna",
    "option.gender.female": "Kobieta",
    "option.activity.sedentary": "Minimalna",
    "option.activity.light": "Lekka",
    "option.activity.moderate": "Średnia",
    "option.activity.active": "Wysoka",
    "option.activity.very_active": "Bardzo wysoka",
    "option.goal.cut": "Redukcja",
    "option.goal.maintain": "Utrzymanie",
    "option.goal.bulk": "Masa",
    "validation.nameMin": "Imię musi mieć co najmniej 2 znaki.",
    "validation.invalidEmail": "Podaj poprawny adres email.",
    "validation.passwordMin": "Hasło musi mieć co najmniej 10 znaków.",
    "validation.passwordUpper": "Dodaj przynajmniej jedną wielką literę.",
    "validation.passwordLower": "Dodaj przynajmniej jedną małą literę.",
    "validation.passwordDigit": "Dodaj przynajmniej jedną cyfrę.",
    "validation.passwordSymbol": "Dodaj przynajmniej jeden znak specjalny.",
    "validation.passwordMatch": "Hasła nie są takie same.",
    "validation.ageMin": "Wiek musi wynosić co najmniej 10 lat.",
    "validation.weightMin": "Waga musi wynosić co najmniej 30 kg.",
    "validation.heightMin": "Wzrost musi wynosić co najmniej 120 cm.",
    "error.emailInUse": "Użytkownik z takim emailem już istnieje.",
    "error.invalidCredentials": "Nieprawidłowy email lub hasło.",
    "error.tooManyAttempts": "Za dużo nieudanych prób. Spróbuj ponownie później.",
    "error.sessionExpired": "Sesja wygasła. Zaloguj się ponownie.",
    "error.genericLogin": "Nie udało się zalogować.",
    "error.genericRegister": "Nie udało się zakończyć rejestracji.",
    "error.genericProfile": "Nie udało się zapisać profilu.",
    "dashboard.welcome": "Witaj, {name}",
    "dashboard.subtitle":
      "Tutaj widzisz aktualny bilans kalorii i makroskładników na dziś.",
    "dashboard.dailyGoal": "Cel dzienny",
    "dashboard.consumed": "Spożyto",
    "dashboard.remaining": "Pozostało",
    "dashboard.goal": "Cel",
    "dashboard.age": "Wiek",
    "dashboard.weight": "Waga",
    "dashboard.height": "Wzrost",
    "dashboard.macros": "Makroskładniki",
    "dashboard.protein": "Białko",
    "dashboard.fat": "Tłuszcze",
    "dashboard.carbs": "Węglowodany",
    "dashboard.needLogin": "Najpierw się zaloguj.",
    "profile.title": "Profil użytkownika",
    "profile.subtitle":
      "Zaktualizuj parametry i cel, aby rekomendacje były dokładniejsze.",
    "profile.currentStats": "Aktualne parametry",
    "profile.progress": "Postęp kalorii",
    "profile.measurements": "Pomiary",
    "profile.notFound": "Nie znaleziono użytkownika.",
    "profile.saved": "Profil został zapisany.",
    "notFound.title": "Nie znaleziono strony",
    "notFound.body": "Adres mógł się zmienić albo ta strona już nie istnieje.",
    "notFound.action": "Wróć na stronę główną",
    "meal.title": "Planer żywienia",
    "meal.progress": "Postęp kalorii",
    "meal.summary": "Podsumowanie składników",
    "meal.quantity": "Ilość",
    "meal.add": "Dodaj",
    "meal.invalidQuantity": "Podaj poprawną ilość.",
    "common.kcal": "kcal",
    "common.kg": "kg",
    "common.cm": "cm",
    "common.g": "g",
    "common.mg": "mg",
  },
} as const;

type TranslationKey = keyof (typeof dictionaries)["uk"];

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);
    return savedLanguage === "pl" ? "pl" : "uk";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => {
        let text: string = dictionaries[language][key];

        if (!vars) {
          return text;
        }

        Object.entries(vars).forEach(([name, value]) => {
          text = text.replace(`{${name}}`, String(value));
        });

        return text;
      },
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useLanguage must be used within I18nProvider");
  }

  return context;
};
