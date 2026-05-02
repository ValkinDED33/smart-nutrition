# КАК НАСТРОИТЬ `.env`

Проект работает в двух режимах:

- без облачного AI: локальный preview-ассистент доступен и без ключей
- с облачным AI: backend включает `/api/ai` и хранит историю диалога в SQLite

Важно: текущая сборка не включает paid AI vision. Фото еды по-прежнему идут в manual draft mode с ручной проверкой.

## Шаг 1: Создай `.env`

Если у тебя чистый checkout, файла `.env` еще нет.

Windows:
```bash
copy .env.example .env
```

macOS / Linux:
```bash
cp .env.example .env
```

## Шаг 2: Заполни базовые переменные

Минимум проверь эти значения:

```env
NODE_ENV=development
SMART_NUTRITION_JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars
SMART_NUTRITION_API_PORT=8787
```

Если запускаешь production, обязательно поставь свой длинный `SMART_NUTRITION_JWT_SECRET`.

Для Vercel-фронтенда и отдельного backend-домена не используй `localhost` в
frontend build env. На Vercel поставь:

```env
VITE_SMART_NUTRITION_API_BASE_URL=https://your-api.example.com/api
```

На backend-хосте поставь:

```env
NODE_ENV=production
SMART_NUTRITION_APP_BASE_URL=https://smart-nutrition-nine.vercel.app
SMART_NUTRITION_CORS_ORIGINS=https://smart-nutrition-nine.vercel.app
SMART_NUTRITION_AUTH_COOKIE_SAME_SITE=None
SMART_NUTRITION_AUTH_COOKIE_SECURE=true
```

Если backend и frontend обслуживаются одним Node-процессом из `dist`, отдельный
`VITE_SMART_NUTRITION_API_BASE_URL` можно оставить пустым: приложение само
проверит `/api` на текущем origin.

## Шаг 3: Если нужен облачный ассистент, добавь `SMART_NUTRITION_ASSISTANT_*`

Для включения backend assistant runtime нужны как минимум:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=
SMART_NUTRITION_ASSISTANT_MODEL=
```

Остальные поля можно оставить из `.env.example` по умолчанию:

```env
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google
SMART_NUTRITION_ASSISTANT_TEMPERATURE=0.4
SMART_NUTRITION_ASSISTANT_MEMORY_LIMIT=16
SMART_NUTRITION_ASSISTANT_TIMEOUT_MS=20000
```

## Шаг 4: Выбери провайдера

Backend ожидает OpenAI-compatible Chat Completions API. Ниже готовые примеры.

### OpenAI
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-...
SMART_NUTRITION_ASSISTANT_MODEL=gpt-4.1-mini
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
```

### OpenRouter
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
```

### Groq
```env
SMART_NUTRITION_ASSISTANT_API_KEY=gsk_...
SMART_NUTRITION_ASSISTANT_MODEL=llama-3.1-8b-instant
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.groq.com/openai/v1
```

### Google AI Studio (OpenAI-compatible endpoint)
```env
SMART_NUTRITION_ASSISTANT_API_KEY=AIza...
SMART_NUTRITION_ASSISTANT_MODEL=gemini-2.5-flash
SMART_NUTRITION_ASSISTANT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

## Recommended priority for 3 providers

If you want:

- primary: OpenRouter
- secondary: Groq
- tertiary: Gemini

use:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google

SMART_NUTRITION_GROQ_API_KEY=gsk_...
SMART_NUTRITION_GROQ_MODEL=llama-3.3-70b-versatile

SMART_NUTRITION_GOOGLE_API_KEY=AIza...
SMART_NUTRITION_GOOGLE_MODEL=gemini-2.5-flash
```

## Шаг 5: Перезапусти backend

Если работаешь через Docker:

```bash
docker compose down
docker compose up -d
```

Если работаешь локально без Docker, просто перезапусти `npm run server:dev` или `npm run start`.

## Шаг 6: Проверь, что runtime поднялся

PowerShell:
```powershell
Invoke-RestMethod http://localhost:8787/api/health | Select-Object -ExpandProperty ai
```

`curl`:
```bash
curl http://localhost:8787/api/health
```

Ожидаемый результат:

- `configured` равно `true`
- `model` показывает выбранную модель

## Что это включает

- облачный `/api/ai`
- сохранение короткой истории диалога в SQLite
- backend-ответы для assistant card в UI

## Что это не включает

- AI-распознавание фото еды
- автоматическую nutrition vision analysis

Фото еды в этой сборке остаются low-confidence draft и требуют ручной проверки.
