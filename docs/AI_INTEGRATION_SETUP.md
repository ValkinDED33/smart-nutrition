# AI Integration Guide

Smart Nutrition currently has two assistant modes:

- `local-preview`: default mode, no cloud key required
- `remote-cloud`: optional backend runtime for `/api/ai`

The cloud runtime uses an OpenAI-compatible Chat Completions endpoint for the primary provider and can keep additional providers configured as automatic fallbacks. That means you can point the main runtime at OpenAI, Groq, OpenRouter, or Google AI Studio and keep the others ready as backups.

Important limitation:

- the current build does not enable paid AI vision for food photos
- `/api/photo-analysis` still returns a low-confidence manual draft

## Quick Start

### 1. Copy `.env.example` to `.env`

Windows:
```bash
copy .env.example .env
```

macOS / Linux:
```bash
cp .env.example .env
```

### 2. Fill in the assistant runtime fields

Required:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=
SMART_NUTRITION_ASSISTANT_MODEL=
```

Optional, with safe defaults already provided in `.env.example`:

```env
SMART_NUTRITION_ASSISTANT_PROVIDER=
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google
SMART_NUTRITION_ASSISTANT_TEMPERATURE=0.4
SMART_NUTRITION_ASSISTANT_MEMORY_LIMIT=16
SMART_NUTRITION_ASSISTANT_TIMEOUT_MS=20000
SMART_NUTRITION_ASSISTANT_RETRY_COOLDOWN_MS=300000
```

`SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER` controls the fallback order. Providers with recent failures are temporarily cooled down so the backend does not retry a broken provider on every request.

### 3. Pick a provider

| Provider | Key format | Base URL | Example model |
|---|---|---|---|
| OpenAI | `sk-...` | `https://api.openai.com/v1` | `gpt-4.1-mini` |
| OpenRouter | `sk-or-...` | `https://openrouter.ai/api/v1` | `openai/gpt-5.4-mini` |
| Groq | `gsk_...` | `https://api.groq.com/openai/v1` | `llama-3.1-8b-instant` |
| Google AI Studio | `AIza...` | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` |

Examples:

OpenAI:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-...
SMART_NUTRITION_ASSISTANT_MODEL=gpt-4.1-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openai
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.openai.com/v1
```

OpenRouter:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
```

Groq:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=gsk_...
SMART_NUTRITION_ASSISTANT_MODEL=llama-3.1-8b-instant
SMART_NUTRITION_ASSISTANT_PROVIDER=groq
SMART_NUTRITION_ASSISTANT_BASE_URL=https://api.groq.com/openai/v1
```

Google AI Studio:
```env
SMART_NUTRITION_ASSISTANT_API_KEY=AIza...
SMART_NUTRITION_ASSISTANT_MODEL=gemini-2.5-flash
SMART_NUTRITION_ASSISTANT_PROVIDER=google
SMART_NUTRITION_ASSISTANT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

### 3a. Configure all three providers together

If you want one primary provider plus automatic fallbacks, keep the primary provider in `SMART_NUTRITION_ASSISTANT_*` and add provider-specific backup credentials.

Recommended role split:

- primary: OpenRouter for versatility
- secondary: Groq for speed
- tertiary: Google AI Studio for diversity

Example:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=sk-or-...
SMART_NUTRITION_ASSISTANT_MODEL=openai/gpt-5.4-mini
SMART_NUTRITION_ASSISTANT_PROVIDER=openrouter
SMART_NUTRITION_ASSISTANT_BASE_URL=https://openrouter.ai/api/v1
SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER=openrouter,groq,google

SMART_NUTRITION_OPENROUTER_HTTP_REFERER=http://localhost:5173
SMART_NUTRITION_OPENROUTER_TITLE=Smart Nutrition

SMART_NUTRITION_GROQ_API_KEY=gsk_...
SMART_NUTRITION_GROQ_MODEL=llama-3.3-70b-versatile
SMART_NUTRITION_GROQ_BASE_URL=https://api.groq.com/openai/v1

SMART_NUTRITION_GOOGLE_API_KEY=AIza...
SMART_NUTRITION_GOOGLE_MODEL=gemini-2.5-flash
SMART_NUTRITION_GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

### 4. Restart the backend

Docker:
```bash
docker compose down
docker compose up -d
```

Local backend:
```bash
npm run server:dev
```

## Verification

### Health endpoint

PowerShell:
```powershell
Invoke-RestMethod http://localhost:8787/api/health | Select-Object -ExpandProperty ai
```

`curl`:
```bash
curl http://localhost:8787/api/health
```

When the cloud runtime is configured correctly:

- `ai.configured` is `true`
- `ai.model` matches the current primary provider
- `ai.providers` lists the configured providers, priority, recent failures, and cooldown status
- `POST /api/ai` returns a `remote-cloud` response

## What the Cloud Runtime Adds

- assistant answers generated through the backend
- short multi-turn conversation memory in SQLite
- history retrieval via `GET /api/ai`
- history reset via `DELETE /api/ai`

## What Stays Local

- photo draft analysis
- all offline/local preview assistant behavior
- the app remains usable without any cloud key

## Troubleshooting

### `ai.configured` is `false`

Make sure both of these are set:

```env
SMART_NUTRITION_ASSISTANT_API_KEY=...
SMART_NUTRITION_ASSISTANT_MODEL=...
```

### Provider returns 401

- API key is invalid
- key belongs to a different provider
- base URL points at the wrong provider
- OpenRouter-specific fallback fields such as `SMART_NUTRITION_OPENROUTER_API_KEY` are not set when that provider is in the fallback chain

### Provider returns 404

Check:

```env
SMART_NUTRITION_ASSISTANT_BASE_URL=...
SMART_NUTRITION_ASSISTANT_API_PATH=/chat/completions
```

### Requests time out

Increase:

```env
SMART_NUTRITION_ASSISTANT_TIMEOUT_MS=45000
```

For provider-specific fallbacks you can also raise:

```env
SMART_NUTRITION_OPENROUTER_TIMEOUT_MS=45000
SMART_NUTRITION_GROQ_TIMEOUT_MS=45000
SMART_NUTRITION_GOOGLE_TIMEOUT_MS=45000
```

### Container keeps the old config

Use `docker compose down` followed by `docker compose up -d` so the container is recreated with the new environment.

## Security Notes

- `.env` is gitignored
- never commit real API keys
- rotate cloud keys regularly

## Recommended Defaults

- development: Groq or OpenAI small models
- production: OpenAI or another stable OpenAI-compatible provider
