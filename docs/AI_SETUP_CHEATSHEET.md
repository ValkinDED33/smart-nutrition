# AI Setup Cheat Sheet

## 1. Create `.env`

Windows:
```bash
copy .env.example .env
```

macOS / Linux:
```bash
cp .env.example .env
```

## 2. Pick an OpenAI-compatible provider

- OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- OpenRouter: [https://openrouter.ai/keys](https://openrouter.ai/keys)
- Groq: [https://console.groq.com/keys](https://console.groq.com/keys)
- Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## 3. Paste one of these blocks into `.env`

OpenAI:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-...
SMART_NUTRITION_ASSISTANT_MODEL=gpt-4.1-mini
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

OpenRouter:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

Groq:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=gsk_...
SMART_NUTRITION_ASSISTANT_MODEL=llama-3.1-8b-instant
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.groq.com/openai/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

Google AI Studio:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=AIza...
SMART_NUTRITION_ASSISTANT_MODEL=gemini-2.5-flash
SMART_NUTRITION_ASSISTANT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

Recommended 3-provider priority:

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

## 4. Restart the backend

Docker:
```bash
docker compose down
docker compose up -d
```

Local Node server:
```bash
npm run server:dev
```

## 5. Verify

PowerShell:
```powershell
Invoke-RestMethod http://localhost:8787/api/health | Select-Object -ExpandProperty ai
```

Expected:

- `configured` is `true`
- `model` matches your selected model

## Common Issues

| Issue | Fix |
|---|---|
| `configured` is `false` | Set both `SMART_NUTRITION_ASSISTANT_API_KEY` and `SMART_NUTRITION_ASSISTANT_MODEL` |
| 401 from provider | Check the API key and provider base URL |
| 404 from provider | Check `SMART_NUTRITION_ASSISTANT_BASE_URL` and `SMART_NUTRITION_ASSISTANT_API_PATH` |
| timeout | Increase `SMART_NUTRITION_ASSISTANT_TIMEOUT_MS` |
| backend still uses old values | Recreate the container instead of just `restart` |

## Honest Note

- local preview assistant still works without cloud keys
- this build does not turn photo uploads into AI vision analysis
