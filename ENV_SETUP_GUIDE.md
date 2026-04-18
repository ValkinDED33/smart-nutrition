# 🎯 КАК ИСПОЛЬЗОВАТЬ .env ФАЙЛ

## Шаг 1: Выбери провайдера

Открой `.env` файл и найди один из трёх вариантов:

### Вариант 1: OpenRouter (рекомендую) — https://openrouter.ai/keys
```
SMART_NUTRITION_AI_PROVIDER=openrouter
SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-ВСТАВЬ_ТВОЙ_КЛЮЧ_СЮДА
```

### Вариант 2: Groq (самый быстрый) — https://console.groq.com/keys
```
# SMART_NUTRITION_AI_PROVIDER=groq
# SMART_NUTRITION_GROQ_API_KEY=gsk_ВСТАВЬ_ТВОЙ_КЛЮЧ_СЮДА
```

### Вариант 3: Google Gemini (самый простой) — https://aistudio.google.com/app/apikey
```
# SMART_NUTRITION_AI_PROVIDER=google
# SMART_NUTRITION_GOOGLE_API_KEY=AIzaSyВСТАВЬ_ТВОЙ_КЛЮЧ_СЮДА
```

---

## Шаг 2: Получи API ключ

1. Переди по ссылке выбранного провайдера (см выше)
2. Создай API ключ
3. Скопируй его

---

## Шаг 3: Вставь ключ в .env

Замени `ВСТАВЬ_ТВОЙ_КЛЮЧ_СЮДА` на твой реальный ключ.

### Пример:
```env
# Было:
SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-ВСТАВЬ_ТВОЙ_КЛЮЧ_СЮДА

# Стало:
SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-d1234567890abcdefghijklmnopqrst
```

---

## Шаг 4: Раскомментируй (удали # в начале строк)

Если выбрал OpenRouter — сверху он уже не закомментирован.

Если выбрал Groq или Google — найди эти строки и удали # перед ними:

### Было (закомментировано):
```env
# SMART_NUTRITION_AI_PROVIDER=groq
# SMART_NUTRITION_GROQ_API_KEY=gsk_...
```

### Стало (раскомментировано):
```env
SMART_NUTRITION_AI_PROVIDER=groq
SMART_NUTRITION_GROQ_API_KEY=gsk_...
```

---

## Шаг 5: Закомментируй остальные провайдеры

Если выбрал Groq, то OpenRouter и Google должны быть закомментированы:

```env
SMART_NUTRITION_AI_PROVIDER=groq
SMART_NUTRITION_GROQ_API_KEY=gsk_...

# Закомментируй вот эти:
# SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-...
# SMART_NUTRITION_GOOGLE_API_KEY=AIzaSy...
```

---

## Шаг 6: Сохрани и перезагрузись

```bash
docker compose down
docker compose up -d
```

---

## Проверка

```bash
docker compose logs smart-nutrition | grep "AI Provider"
```

Должно показать:
```
✅ AI Provider initialized: openrouter
```

---

## Что дальше?

AI функции уже работают! 🎉

- Пользователь может получать рекомендации по питанию
- Может загружать фото еды для анализа
- Все работает автоматически
