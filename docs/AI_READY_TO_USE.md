# AI Integration Ready

The repo is ready for an optional cloud assistant runtime.

What already works:

- local preview assistant without any paid API keys
- backend route `POST /api/ai`
- backend history routes on `GET` / `DELETE /api/ai`
- short conversation memory stored in SQLite

What you still need to do:

1. Copy `.env.example` to `.env`
2. Set `SMART_NUTRITION_ASSISTANT_API_KEY`
3. Set `SMART_NUTRITION_ASSISTANT_MODEL`
4. Set `SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google` if you want the recommended 3-provider chain
5. If you are not using OpenAI, point `SMART_NUTRITION_ASSISTANT_BASE_URL` at an OpenAI-compatible endpoint
6. Restart the backend

Minimal OpenAI example:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-...
SMART_NUTRITION_ASSISTANT_MODEL=gpt-4.1-mini
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

OpenRouter example:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google
```

Groq example:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=gsk_...
SMART_NUTRITION_ASSISTANT_MODEL=llama-3.1-8b-instant
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.groq.com/openai/v1
```

Google AI Studio example:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=AIza...
SMART_NUTRITION_ASSISTANT_MODEL=gemini-2.5-flash
SMART_NUTRITION_ASSISTANT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

Recommended 3-provider chain:

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

Verification:

PowerShell:
```powershell
Invoke-RestMethod http://localhost:8787/api/health | Select-Object -ExpandProperty ai
```

Expected:

- `configured` is `true`
- `model` matches your selected model

Important limitation:

- this build does not enable paid AI photo recognition
- photo uploads still stay in manual draft mode

See:

- `AI_SETUP_CHEATSHEET.md` for the short version
- `AI_INTEGRATION_SETUP.md` for the full walkthrough
