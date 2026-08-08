import type { CompanionCatalogItem } from "../types";

const text = (uk: string, pl: string, en: string) => ({ uk, pl, en });

export const companionShopCatalog: CompanionCatalogItem[] = [
  {
    id: "robot-classic",
    category: "robot",
    title: text("Класичний робот", "Klasyczny robot", "Classic robot"),
    description: text(
      "Безкоштовний базовий образ: дружній, надійний і завжди поруч.",
      "Darmowy bazowy wygląd: przyjazny, pewny i zawsze obok.",
      "A free base look: friendly, reliable, and always nearby."
    ),
    tagLabel: text("безкоштовно", "za darmo", "free"),
    price: 0,
    rarity: "common",
    slot: "companion",
    companionKind: "robot",
    available: true,
  },
  {
    id: "robot-coach",
    category: "robot",
    title: text("Тренер", "Trener", "Coach"),
    description: text(
      "Людяний образ для чітких планів, звітів і спокійної дисципліни.",
      "Ludzki wygląd do planów, raportów i spokojnej dyscypliny.",
      "A human coach look for plans, reports, and calm discipline."
    ),
    tagLabel: text("база", "baza", "base"),
    price: 0,
    rarity: "common",
    slot: "companion",
    companionKind: "human",
    available: true,
  },
  {
    id: "cat-focus",
    category: "animal",
    title: text("Кіт", "Kot", "Cat"),
    description: text(
      "Спостережливий стиль для м'яких підказок і уважного трекінгу.",
      "Uważny styl do miękkich podpowiedzi i spokojnego śledzenia.",
      "An observant style for gentle nudges and careful tracking."
    ),
    tagLabel: text("увага", "uważność", "focus"),
    price: 90,
    rarity: "common",
    slot: "companion",
    companionKind: "cat",
    available: true,
  },
  {
    id: "dog-energy",
    category: "animal",
    title: text("Коргі", "Corgi", "Corgi"),
    description: text(
      "Енергійний образ для прогулянок, води й добрих щоденних серій.",
      "Energiczny wygląd do spacerów, wody i dobrych codziennych serii.",
      "An energetic look for walks, hydration, and daily streaks."
    ),
    tagLabel: text("рух", "ruch", "active"),
    price: 110,
    rarity: "rare",
    slot: "companion",
    companionKind: "corgi",
    available: true,
  },
  {
    id: "fox-smart",
    category: "animal",
    title: text("Лис", "Lis", "Fox"),
    description: text(
      "Кмітливий образ для пошуку продуктів, рецептів і швидких рішень.",
      "Sprytny wygląd do produktów, przepisów i szybkich decyzji.",
      "A clever look for products, recipes, and quick decisions."
    ),
    tagLabel: text("швидкий", "sprytny", "clever"),
    price: 120,
    rarity: "rare",
    slot: "companion",
    companionKind: "fox",
    available: true,
  },
  {
    id: "panda-calm",
    category: "animal",
    title: text("Панда", "Panda", "Panda"),
    description: text(
      "Спокійний образ для режиму без тиску, вагітності та відновлення.",
      "Spokojny wygląd do trybu bez presji, ciąży i regeneracji.",
      "A calm look for low-pressure mode, pregnancy, and recovery."
    ),
    tagLabel: text("спокій", "spokój", "calm"),
    price: 130,
    rarity: "rare",
    slot: "companion",
    companionKind: "panda",
    available: true,
  },
  {
    id: "owl-wise",
    category: "animal",
    title: text("Сова", "Sowa", "Owl"),
    description: text(
      "Мудрий образ для аналізів, пояснень і безпечних wellness-порад.",
      "Mądry wygląd do analiz, wyjaśnień i bezpiecznych porad wellness.",
      "A wise look for analyses, explanations, and safe wellness advice."
    ),
    tagLabel: text("аналіз", "analiza", "insight"),
    price: 150,
    rarity: "rare",
    slot: "companion",
    companionKind: "owl",
    available: true,
  },
  {
    id: "raccoon-resourceful",
    category: "animal",
    title: text("Єнот", "Szop", "Raccoon"),
    description: text(
      "Винахідливий образ для списків покупок, задач і дрібних справ.",
      "Pomysłowy wygląd do zakupów, zadań i drobnych spraw.",
      "A resourceful look for shopping lists, tasks, and errands."
    ),
    tagLabel: text("задачі", "zadania", "tasks"),
    price: 150,
    rarity: "rare",
    slot: "companion",
    companionKind: "raccoon",
    available: true,
  },
  {
    id: "lion-leader",
    category: "animal",
    title: text("Лев", "Lew", "Lion"),
    description: text(
      "Впевнений образ для цілей, сімейних челенджів і прогресу.",
      "Pewny wygląd do celów, rodzinnych wyzwań i progresu.",
      "A confident look for goals, family challenges, and progress."
    ),
    tagLabel: text("лідер", "lider", "leader"),
    price: 190,
    rarity: "epic",
    slot: "companion",
    companionKind: "lion",
    available: true,
  },
  {
    id: "wolf-focus",
    category: "animal",
    title: text("Вовк", "Wilk", "Wolf"),
    description: text(
      "Зібраний образ для плану на тиждень і стабільної рутини.",
      "Skupiony wygląd do planu tygodnia i stabilnej rutyny.",
      "A focused look for weekly plans and stable routines."
    ),
    tagLabel: text("рутина", "rutyna", "routine"),
    price: 190,
    rarity: "epic",
    slot: "companion",
    companionKind: "wolf",
    available: true,
  },
  {
    id: "tiger-drive",
    category: "animal",
    title: text("Тигр", "Tygrys", "Tiger"),
    description: text(
      "Динамічний образ для тренувань, кроків і активного дня.",
      "Dynamiczny wygląd do treningów, kroków i aktywnego dnia.",
      "A dynamic look for workouts, steps, and active days."
    ),
    tagLabel: text("драйв", "energia", "drive"),
    price: 220,
    rarity: "epic",
    slot: "companion",
    companionKind: "tiger",
    available: true,
  },
  {
    id: "rabbit-soft",
    category: "animal",
    title: text("Кролик", "Królik", "Rabbit"),
    description: text(
      "Ніжний образ для м'яких нагадувань, води й вечірнього ритму.",
      "Delikatny wygląd do łagodnych przypomnień, wody i wieczornego rytmu.",
      "A gentle look for soft reminders, water, and evening rhythm."
    ),
    tagLabel: text("ніжний", "delikatny", "gentle"),
    price: 140,
    rarity: "rare",
    slot: "companion",
    companionKind: "rabbit",
    available: true,
  },
  {
    id: "bear-steady",
    category: "animal",
    title: text("Ведмідь", "Niedźwiedź", "Bear"),
    description: text(
      "Надійний образ для спокійної сили, регулярності й сімейних цілей.",
      "Stabilny wygląd do spokojnej siły, regularności i celów rodzinnych.",
      "A steady look for calm strength, consistency, and family goals."
    ),
    tagLabel: text("стабільність", "stabilność", "steady"),
    price: 180,
    rarity: "epic",
    slot: "companion",
    companionKind: "bear",
    available: true,
  },
  {
    id: "otter-playful",
    category: "animal",
    title: text("Видра", "Wydra", "Otter"),
    description: text(
      "Грайливий образ для води, настрою і легких щоденних перемог.",
      "Zabawny wygląd do wody, nastroju i małych codziennych zwycięstw.",
      "A playful look for hydration, mood, and small daily wins."
    ),
    tagLabel: text("радість", "radość", "playful"),
    price: 160,
    rarity: "rare",
    slot: "companion",
    companionKind: "otter",
    available: true,
  },
  {
    id: "hedgehog-independent",
    category: "animal",
    title: text("Їжак", "Jeż", "Hedgehog"),
    description: text(
      "Зібраний образ для меж, м'яких нагадувань і режиму без тиску.",
      "Skupiony wygląd do granic, miękkich przypomnień i trybu bez presji.",
      "A focused look for boundaries, soft reminders, and low-pressure routines."
    ),
    tagLabel: text("межі", "granice", "boundaries"),
    price: 145,
    rarity: "rare",
    slot: "companion",
    companionKind: "hedgehog",
    available: true,
  },
  {
    id: "koala-recovery",
    category: "animal",
    title: text("Коала", "Koala", "Koala"),
    description: text(
      "М'який образ для сну, відновлення, вагітності та післяпологового темпу.",
      "Miękki wygląd do snu, regeneracji, ciąży i tempa po porodzie.",
      "A soft look for sleep, recovery, pregnancy, and postpartum rhythm."
    ),
    tagLabel: text("відновлення", "regeneracja", "recovery"),
    price: 170,
    rarity: "rare",
    slot: "companion",
    companionKind: "koala",
    available: true,
  },
  {
    id: "deer-gentle",
    category: "animal",
    title: text("Олень", "Jeleń", "Deer"),
    description: text(
      "Легкий образ для прогулянок, сімейного режиму і тихої підтримки.",
      "Lekki wygląd do spacerów, rodzinnego rytmu i cichego wsparcia.",
      "A light look for walks, family rhythm, and quiet support."
    ),
    tagLabel: text("легкість", "lekkość", "light"),
    price: 155,
    rarity: "rare",
    slot: "companion",
    companionKind: "deer",
    available: true,
  },
  {
    id: "turtle-patient",
    category: "animal",
    title: text("Черепаха", "Żółw", "Turtle"),
    description: text(
      "Терплячий образ для довгих цілей, поступового прогресу і звичок.",
      "Cierpliwy wygląd do długich celów, stopniowego progresu i nawyków.",
      "A patient look for long goals, gradual progress, and habits."
    ),
    tagLabel: text("терпіння", "cierpliwość", "patient"),
    price: 150,
    rarity: "rare",
    slot: "companion",
    companionKind: "turtle",
    available: true,
  },
  {
    id: "axolotl-wonder",
    category: "animal",
    title: text("Аксолотль", "Aksolotl", "Axolotl"),
    description: text(
      "Рідкісний веселий образ для AI Discovery, нових фактів і м'якої гри.",
      "Rzadki, pogodny wygląd do AI Discovery, nowych faktów i lekkiej gry.",
      "A rare playful look for AI Discovery, new facts, and gentle delight."
    ),
    tagLabel: text("диво", "ciekawość", "wonder"),
    price: 210,
    rarity: "epic",
    slot: "companion",
    companionKind: "axolotl",
    available: true,
  },
  {
    id: "capybara-season",
    category: "seasonal",
    title: text("Спокій капібари", "Spokój kapibary", "Capybara calm"),
    description: text(
      "Сезонний спокійний образ для режиму без стресу.",
      "Sezonowy spokojny wygląd do trybu bez stresu.",
      "A seasonal calm look for a lower-stress mode."
    ),
    tagLabel: text("сезон", "sezon", "seasonal"),
    price: 220,
    rarity: "epic",
    slot: "companion",
    companionKind: "capybara",
    available: true,
  },
  {
    id: "forest-spirit",
    category: "nature",
    title: text("Дух лісу", "Duch lasu", "Forest spirit"),
    description: text(
      "Природний образ для води, сну, відновлення і спокійних порад.",
      "Naturalny wygląd do wody, snu, regeneracji i spokojnych porad.",
      "A nature look for water, sleep, recovery, and calm guidance."
    ),
    tagLabel: text("природа", "natura", "nature"),
    price: 240,
    rarity: "epic",
    slot: "companion",
    companionKind: "forest_spirit",
    available: true,
  },
  {
    id: "chameleon-adaptive",
    category: "nature",
    title: text("Хамелеон", "Kameleon", "Chameleon"),
    description: text(
      "Адаптивний образ для підказок, що підлаштовуються під день.",
      "Adaptacyjny wygląd do podpowiedzi dopasowanych do dnia.",
      "An adaptive look for suggestions that adjust to the day."
    ),
    tagLabel: text("адаптивний", "adaptacja", "adaptive"),
    price: 230,
    rarity: "epic",
    slot: "companion",
    companionKind: "chameleon",
    available: true,
  },
  {
    id: "dragon-premium",
    category: "fantasy",
    title: text("Дракон", "Smok", "Dragon"),
    description: text(
      "Яскравий преміум-образ для потужнішої ігрової підтримки.",
      "Wyrazisty wygląd premium dla mocniejszego grywalnego wsparcia.",
      "A premium look for stronger playful support."
    ),
    tagLabel: text("преміум", "premium", "premium"),
    price: 260,
    rarity: "legendary",
    slot: "companion",
    companionKind: "dragon",
    available: true,
  },
  {
    id: "phoenix-renewal",
    category: "fantasy",
    title: text("Фенікс", "Feniks", "Phoenix"),
    description: text(
      "Образ перезапуску для повернення після пауз і нових стартів.",
      "Wygląd odnowy do powrotów po przerwach i nowych startów.",
      "A renewal look for returning after pauses and new starts."
    ),
    tagLabel: text("оновлення", "odnowa", "renewal"),
    price: 320,
    rarity: "legendary",
    slot: "companion",
    companionKind: "phoenix",
    available: true,
  },
  {
    id: "cosmic-beast",
    category: "fantasy",
    title: text("Космічний звір", "Kosmiczny zwierz", "Cosmic beast"),
    description: text(
      "Рідкісний космічний образ для AI Discovery і нічних режимів.",
      "Rzadki kosmiczny wygląd do AI Discovery i trybów nocnych.",
      "A rare cosmic look for AI Discovery and night modes."
    ),
    tagLabel: text("легенда", "legenda", "legend"),
    price: 360,
    rarity: "legendary",
    slot: "companion",
    companionKind: "cosmic_beast",
    available: true,
  },
  {
    id: "water-bottle",
    category: "accessory",
    title: text("Пляшка води", "Butelka wody", "Water bottle"),
    description: text(
      "Аксесуар для водного трекера і м'яких нагадувань.",
      "Akcesorium do trackera wody i łagodnych przypomnień.",
      "An accessory for water tracking and gentle reminders."
    ),
    tagLabel: text("вода", "woda", "hydrate"),
    price: 95,
    rarity: "common",
    slot: "accessory",
    available: false,
  },
];

export const getCompanionCatalogItemById = (itemId: string) =>
  companionShopCatalog.find((item) => item.id === itemId) ?? null;
