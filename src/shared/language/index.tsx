/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppLanguage } from "../types/i18n";
import {
  getClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";

export type Language = AppLanguage;

const STORAGE_KEY = "smart-nutrition.language";
const ONBOARDING_STORAGE_KEY = "smart-nutrition.onboarding-complete";

const uk = {
  "brand.name": "Smart Nutrition",
  "brand.tagline": "Розумне харчування без хаосу",
  "nav.dashboard": "Панель",
  "nav.meals": "Страви",
  "nav.profile": "Профіль",
  "nav.login": "Увійти",
  "nav.register": "Реєстрація",
  "nav.logout": "Вийти",
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
    "Перевіряємо унікальність email, силу пароля та коректність даних ще до створення профілю.",
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
  "auth.noAccount": "Ще не маєте акаунта?",
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
  "validation.passwordSymbol":
    "Додайте хоча б один спеціальний символ.",
  "validation.passwordMatch": "Паролі не збігаються.",
  "validation.ageMin": "Вік має бути не менше 10 років.",
  "validation.weightMin": "Вага має бути не менше 30 кг.",
  "validation.heightMin": "Зріст має бути не менше 120 см.",
  "error.emailInUse": "Користувач із таким email уже існує.",
  "error.invalidCredentials": "Невірний email або пароль.",
  "error.tooManyAttempts":
    "Забагато невдалих спроб. Спробуйте пізніше.",
  "error.sessionExpired": "Сесія завершилась. Увійдіть повторно.",
  "error.backendUnavailable":
    "Cloud backend недоступний. Перевірте адресу API або спробуйте ще раз пізніше.",
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
  "profile.diary": "Щоденник харчування",
  "profile.diaryEmpty": "Записів поки немає.",
  "notFound.title": "Сторінку не знайдено",
  "notFound.body":
    "Ймовірно, адреса змінилась або сторінка більше не існує.",
  "notFound.action": "Повернутися на головну",
  "meal.title": "Планувальник харчування",
  "meal.progress": "Прогрес за калоріями",
  "meal.summary": "Загальні нутрієнти",
  "meal.quantity": "Кількість",
  "meal.mealType": "Тип прийому їжі",
  "meal.add": "Додати",
  "meal.repeatYesterday": "Повторити вчорашнє",
  "meal.invalidQuantity": "Вкажіть коректну кількість.",
  "mealType.breakfast": "Сніданок",
  "mealType.lunch": "Обід",
  "mealType.dinner": "Вечеря",
  "mealType.snack": "Перекус",
  "mealBuilder.title": "Щоденник харчування і швидке додавання страв",
  "mealBuilder.subtitle":
    "Будуйте прийоми їжі з кількох інгредієнтів, скануйте магазинні продукти і зберігайте готові рецепти до потрібного прийому їжі.",
  "mealBuilder.calories": "Калорії сьогодні",
  "mealBuilder.chooseMeal": "Оберіть тип прийому їжі",
  "mealBuilder.diary": "Сьогоднішній щоденник",
  "mealBuilder.noEntries": "Поки що немає записів.",
  "mealBuilder.remove": "Видалити",
  "mealBuilder.items": "продуктів",
  "adaptive.title": "Адаптивна ціль калорій",
  "adaptive.subtitle":
    "На основі споживання і змін ваги система пропонує точнішу денну ціль.",
  "adaptive.current": "Поточна ціль",
  "adaptive.suggested": "Рекомендована ціль",
  "adaptive.average": "Середнє споживання",
  "adaptive.apply": "Застосувати рекомендацію",
  "history.title": "Історія за днями",
  "history.subtitle":
    "Переглядайте записи за останні дні та денний баланс калорій.",
  "history.select": "День",
  "history.empty": "Для вибраного дня записів немає.",
  "weekly.title": "Аналітика за 7 днів",
  "weekly.average": "Середньо / день",
  "weekly.bestDay": "Найсильніший день",
  "weekly.protein": "Білок / день",
  "weekly.empty": "Поки замало даних для тижневої аналітики.",
  "productSearch.title": "Пошук продуктів",
  "productSearch.subtitle":
    "Шукайте за назвою, брендом і популярними варіантами написання. Результати поєднують локальний каталог і онлайн-бази.",
  "productSearch.placeholder":
    "Наприклад: сир, м'ясо, помідор, яйце, йогурт, рис",
  "productSearch.clear": "Очистити",
  "productSearch.featured": "Стартова добірка продуктів",
  "productSearch.categories": "Категорії",
  "productSearch.allCategories": "Усі",
  "productSearch.loading": "Шукаю продукти...",
  "productSearch.empty":
    "Продукти за цим запитом не знайдені. Спробуйте коротшу назву або інше слово.",
  "productCard.quickPortions": "Швидкі порції",
  "productCard.save": "Зберегти швидко",
  "productCard.remove": "Прибрати зі збережених",
  "productCard.details": "Показати склад",
  "productCard.hide": "Сховати склад",
  "productFacts.title": "Точний склад продукту",
  "productFacts.subtitle":
    "Показуємо лише значення, які реально є в джерелі даних. Приховані поля означають, що точної інформації немає.",
  "productFacts.perBase": "На 100 {unit}",
  "productFacts.noData":
    "Для цього продукту немає додаткових якісних позначок.",
  "quickShelf.title": "Швидкі продукти",
  "quickShelf.saved": "Збережені продукти",
  "quickShelf.recent": "Нещодавно використані або відскановані",
  "quickShelf.savedEmpty":
    "Збережіть кілька продуктів, щоб додавати їх одним кліком.",
  "quickShelf.recentEmpty":
    "Після пошуку, сканування або додавання продукти з'являться тут.",
  "composer.title": "Швидкий конструктор страви",
  "composer.subtitle":
    "Додайте одразу кілька інгредієнтів: сир, м'ясо, помідор, яйце або будь-яку іншу комбінацію.",
  "composer.ingredient": "Інгредієнт",
  "composer.quantity": "Кількість",
  "composer.addRow": "Додати інгредієнт",
  "composer.saveMeal": "Записати прийом їжі",
  "composer.summary": "Разом",
  "composer.remove": "Видалити",
  "recipes.title": "Корисні рецепти",
  "recipes.add": "Додати рецепт у щоденник",
  "recipes.ingredients": "Інгредієнти",
  "recommendations.title": "Рекомендації на день",
  "recommendations.empty":
    "Додайте більше записів, щоб отримати персональні підказки.",
  "recommendations.lowProtein":
    "Білка поки замало. Варто додати сир, грецький йогурт, яйця або м'ясо.",
  "recommendations.highCalories":
    "Калорії вже близько до ліміту. Наступний прийом їжі краще будувати на білку й овочах.",
  "recommendations.balanced":
    "Баланс дня виглядає стабільно. Тримайте подібний розподіл прийомів їжі до кінця дня.",
  "templates.title": "Шаблони прийомів їжі",
  "templates.subtitle":
    "Збережіть поточний прийом їжі як шаблон і повторюйте його одним натисканням.",
  "templates.placeholder": "Наприклад: білковий сніданок",
  "templates.save": "Зберегти шаблон",
  "templates.apply": "Повторити",
  "templates.remove": "Видалити",
  "templates.empty": "Для цього прийому їжі шаблонів поки немає.",
  "yesterday.title": "Повторити вчорашній прийом їжі",
  "yesterday.subtitle":
    "Якщо сьогодні раціон схожий, відновіть запис одним натисканням.",
  "yesterday.action": "Повторити вчорашнє",
  "yesterday.empty": "Учора для цього прийому їжі записів не було.",
  "scanner.title": "Сканер штрихкодів",
  "scanner.subtitle":
    "Відскануйте продукт або введіть код вручну. Після пошуку товар одразу потрапить у щоденник і з'явиться нижче.",
  "scanner.cameraHint":
    "Вкажіть, скільки грамів було з'їдено. Під час сканування камерою продукт додається автоматично після розпізнавання.",
  "scanner.barcode": "Штрихкод",
  "scanner.grams": "З'їдено грамів",
  "scanner.search": "Знайти і додати",
  "scanner.start": "Запустити сканер",
  "scanner.stop": "Зупинити сканер",
  "scanner.added": "Додано до щоденника",
  "scanner.notFound": "Продукт за цим кодом не знайдено",
  "scanner.failed": "Помилка під час пошуку продукту",
  "scanner.preview": "Останній знайдений продукт",
  "scanner.cameraIdle":
    "Після запуску сканера тут з'явиться камера.",
  "errorBoundary.title": "Щось пішло не так",
  "errorBoundary.action": "Перезавантажити застосунок",
  "common.kcal": "ккал",
  "common.kg": "кг",
  "common.cm": "см",
  "common.g": "г",
  "common.mg": "мг",
} as const;

const pl: Record<keyof typeof uk, string> = {
  "brand.name": "Smart Nutrition",
  "brand.tagline": "Mądre odżywianie bez chaosu",
  "nav.dashboard": "Panel",
  "nav.meals": "Posiłki",
  "nav.profile": "Profil",
  "nav.login": "Zaloguj",
  "nav.register": "Rejestracja",
  "nav.logout": "Wyloguj",
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
  "validation.passwordSymbol":
    "Dodaj przynajmniej jeden znak specjalny.",
  "validation.passwordMatch": "Hasła nie są takie same.",
  "validation.ageMin": "Wiek musi wynosić co najmniej 10 lat.",
  "validation.weightMin": "Waga musi wynosić co najmniej 30 kg.",
  "validation.heightMin": "Wzrost musi wynosić co najmniej 120 cm.",
  "error.emailInUse": "Użytkownik z takim emailem już istnieje.",
  "error.invalidCredentials": "Nieprawidłowy email lub hasło.",
  "error.tooManyAttempts":
    "Za dużo nieudanych prób. Spróbuj ponownie później.",
  "error.sessionExpired": "Sesja wygasła. Zaloguj się ponownie.",
  "error.backendUnavailable":
    "Backend cloud jest niedostępny. Sprawdź adres API albo spróbuj ponownie później.",
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
  "profile.diary": "Dziennik jedzenia",
  "profile.diaryEmpty": "Brak wpisów.",
  "notFound.title": "Nie znaleziono strony",
  "notFound.body": "Adres mógł się zmienić albo ta strona już nie istnieje.",
  "notFound.action": "Wróć na stronę główną",
  "meal.title": "Planer żywienia",
  "meal.progress": "Postęp kalorii",
  "meal.summary": "Podsumowanie składników",
  "meal.quantity": "Ilość",
  "meal.mealType": "Typ posiłku",
  "meal.add": "Dodaj",
  "meal.repeatYesterday": "Powtórz wczoraj",
  "meal.invalidQuantity": "Podaj poprawną ilość.",
  "mealType.breakfast": "Śniadanie",
  "mealType.lunch": "Obiad",
  "mealType.dinner": "Kolacja",
  "mealType.snack": "Przekąska",
  "mealBuilder.title": "Dziennik żywienia i szybkie dodawanie posiłków",
  "mealBuilder.subtitle":
    "Buduj posiłki z kilku składników, skanuj produkty sklepowe i zapisuj gotowe przepisy do odpowiedniego posiłku.",
  "mealBuilder.calories": "Kalorie dzisiaj",
  "mealBuilder.chooseMeal": "Wybierz typ posiłku",
  "mealBuilder.diary": "Dzisiejszy dziennik",
  "mealBuilder.noEntries": "Brak wpisów.",
  "mealBuilder.remove": "Usuń",
  "mealBuilder.items": "produktów",
  "adaptive.title": "Adaptacyjny cel kalorii",
  "adaptive.subtitle":
    "Na podstawie spożycia i zmian masy ciała system proponuje trafniejszy cel dzienny.",
  "adaptive.current": "Aktualny cel",
  "adaptive.suggested": "Rekomendowany cel",
  "adaptive.average": "Średnie spożycie",
  "adaptive.apply": "Zastosuj rekomendację",
  "history.title": "Historia dni",
  "history.subtitle":
    "Przeglądaj wpisy z ostatnich dni i sprawdzaj bilans kalorii.",
  "history.select": "Dzień",
  "history.empty": "Brak wpisów dla wybranego dnia.",
  "weekly.title": "Analityka 7 dni",
  "weekly.average": "Średnio / dzień",
  "weekly.bestDay": "Najmocniejszy dzień",
  "weekly.protein": "Białko / dzień",
  "weekly.empty": "Za mało danych do analityki tygodniowej.",
  "productSearch.title": "Wyszukiwanie produktów",
  "productSearch.subtitle":
    "Szukaj po nazwie, marce i popularnych aliasach. Wyniki łączą katalog lokalny i bazy online.",
  "productSearch.placeholder":
    "Np. ser, mięso, pomidor, jajko, jogurt, ryż",
  "productSearch.clear": "Wyczyść",
  "productSearch.featured": "Polecane produkty na start",
  "productSearch.categories": "Kategorie",
  "productSearch.allCategories": "Wszystkie",
  "productSearch.loading": "Szukam produktów...",
  "productSearch.empty":
    "Brak produktów dla tego zapytania. Spróbuj krótszej nazwy albo innego słowa.",
  "productCard.quickPortions": "Szybkie porcje",
  "productCard.save": "Zapisz szybko",
  "productCard.remove": "Usuń z zapisanych",
  "productCard.details": "Pokaż skład",
  "productCard.hide": "Ukryj skład",
  "productFacts.title": "Dokładny skład produktu",
  "productFacts.subtitle":
    "Wartości są pokazywane tylko dla danych dostępnych w źródle. Ukryte pola oznaczają brak dokładnej informacji.",
  "productFacts.perBase": "Na 100 {unit}",
  "productFacts.noData":
    "Brak dodatkowych danych jakościowych dla tego produktu.",
  "quickShelf.title": "Szybkie produkty",
  "quickShelf.saved": "Zapisane produkty",
  "quickShelf.recent": "Ostatnio używane lub zeskanowane",
  "quickShelf.savedEmpty":
    "Zapisz kilka produktów, aby dodawać je jednym kliknięciem.",
  "quickShelf.recentEmpty":
    "Po wyszukaniu, skanowaniu lub dodaniu produkty pojawią się tutaj.",
  "composer.title": "Szybki kreator posiłku",
  "composer.subtitle":
    "Dodaj od razu kilka składników: ser, mięso, pomidor, jajko albo dowolną inną kombinację.",
  "composer.ingredient": "Składnik",
  "composer.quantity": "Ilość",
  "composer.addRow": "Dodaj składnik",
  "composer.saveMeal": "Zapisz posiłek",
  "composer.summary": "Razem",
  "composer.remove": "Usuń",
  "recipes.title": "Przepisy fit",
  "recipes.add": "Dodaj przepis do dziennika",
  "recipes.ingredients": "Składniki",
  "recommendations.title": "Rekomendacje dnia",
  "recommendations.empty":
    "Dodaj więcej wpisów, aby otrzymać spersonalizowane wskazówki.",
  "recommendations.lowProtein":
    "Białko jest jeszcze nisko. Warto dodać twaróg, jogurt grecki, jajka albo mięso.",
  "recommendations.highCalories":
    "Kalorie są już blisko limitu. Kolejny posiłek lepiej oprzeć na białku i warzywach.",
  "recommendations.balanced":
    "Bilans dnia wygląda stabilnie. Utrzymaj podobny rozkład posiłków do końca dnia.",
  "templates.title": "Szablony posiłków",
  "templates.subtitle":
    "Zapisz aktualny posiłek jako szablon i odtwórz go jednym kliknięciem.",
  "templates.placeholder": "Np. białkowe śniadanie",
  "templates.save": "Zapisz szablon",
  "templates.apply": "Powtórz",
  "templates.remove": "Usuń",
  "templates.empty": "Brak zapisanych szablonów dla tego posiłku.",
  "yesterday.title": "Powtórz wczorajszy posiłek",
  "yesterday.subtitle":
    "Jeśli dziś jesz podobnie, odtwórz wpis jednym kliknięciem.",
  "yesterday.action": "Powtórz wczoraj",
  "yesterday.empty": "Wczoraj nie było wpisów dla tego posiłku.",
  "scanner.title": "Skaner kodów kreskowych",
  "scanner.subtitle":
    "Zeskanuj produkt lub wpisz kod ręcznie. Po znalezieniu produkt od razu trafi do dziennika i zostanie pokazany poniżej.",
  "scanner.cameraHint":
    "Podaj zjedzoną ilość w gramach. Przy skanowaniu kamerą produkt dodaje się automatycznie po rozpoznaniu.",
  "scanner.barcode": "Kod kreskowy",
  "scanner.grams": "Ilość zjedzona (g)",
  "scanner.search": "Znajdź i dodaj",
  "scanner.start": "Uruchom skaner",
  "scanner.stop": "Zatrzymaj skaner",
  "scanner.added": "Dodano do dziennika",
  "scanner.notFound": "Nie znaleziono produktu po tym kodzie",
  "scanner.failed": "Błąd podczas wyszukiwania produktu",
  "scanner.preview": "Ostatnio znaleziony produkt",
  "scanner.cameraIdle":
    "Po uruchomieniu skanera pojawi się tutaj podgląd kamery.",
  "errorBoundary.title": "Coś poszło nie tak",
  "errorBoundary.action": "Przeładuj aplikację",
  "common.kcal": "kcal",
  "common.kg": "kg",
  "common.cm": "cm",
  "common.g": "g",
  "common.mg": "mg",
};

const dictionaries = { uk, pl } as const;

type TranslationKey = keyof typeof uk;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  hasExplicitChoice: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  t: (key: TranslationKey | string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const savedLanguage = getClientStorageItem(STORAGE_KEY);
  const [language, setLanguageState] = useState<Language>(savedLanguage === "pl" ? "pl" : "uk");
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => Boolean(savedLanguage));
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    () => getClientStorageItem(ONBOARDING_STORAGE_KEY) === "true"
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setHasExplicitChoice(true);
        setLanguageState(nextLanguage);
        setClientStorageItem(STORAGE_KEY, nextLanguage);
      },
      hasExplicitChoice,
      hasCompletedOnboarding,
      completeOnboarding: () => {
        setHasExplicitChoice(true);
        setHasCompletedOnboarding(true);
        setClientStorageItem(STORAGE_KEY, language);
        setClientStorageItem(ONBOARDING_STORAGE_KEY, "true");
      },
      t: (key, vars) => {
        let text = dictionaries[language][key as TranslationKey] ?? key;

        if (!vars) {
          return text;
        }

        Object.entries(vars).forEach(([name, value]) => {
          text = text.replace(`{${name}}`, String(value));
        });

        return text;
      },
    }),
    [hasCompletedOnboarding, hasExplicitChoice, language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
};
