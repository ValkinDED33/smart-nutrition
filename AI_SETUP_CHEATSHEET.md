# ⚡ AI Setup Cheat Sheet

## Copy-Paste Instructions

### 1️⃣ Create .env file
```bash
cp .env.example .env
```

### 2️⃣ Get API Key (Choose ONE)

**OpenRouter (Most flexible):**
- Visit: https://openrouter.ai/keys
- Click "Create Key"
- Copy the key

**Groq (Fastest, Free tier):**
- Visit: https://console.groq.com/keys
- Click "Create API Key"
- Copy the key

**Google Gemini (Easiest):**
- Visit: https://aistudio.google.com/app/apikey
- Click "Create API Key"
- Copy the key

### 3️⃣ Edit .env

**If using OpenRouter:**
```env
SMART_NUTRITION_AI_PROVIDER=openrouter
SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-xxx-your-key-here
SMART_NUTRITION_OPENROUTER_MODEL=meta-llama/llama-2-70b-chat
```

**If using Groq:**
```env
SMART_NUTRITION_AI_PROVIDER=groq
SMART_NUTRITION_GROQ_API_KEY=gsk-xxx-your-key-here
SMART_NUTRITION_GROQ_MODEL=mixtral-8x7b-32768
```

**If using Google:**
```env
SMART_NUTRITION_AI_PROVIDER=google
SMART_NUTRITION_GOOGLE_API_KEY=AIzaSyxxx-your-key-here
SMART_NUTRITION_GOOGLE_MODEL=gemini-pro
```

### 4️⃣ Restart Server
```bash
docker compose down
docker compose up -d
```

### 5️⃣ Check if it works
```bash
docker compose logs smart-nutrition | grep "AI Provider"
```

Should show: `✅ AI Provider initialized: openrouter/groq/google`

---

## Common Issues

| Issue | Fix |
|---|---|
| No key in .env | Run `cp .env.example .env` and add your key |
| Wrong key | Get new key from provider, paste into .env |
| Provider not set | Add `SMART_NUTRITION_AI_PROVIDER=openrouter` (or groq/google) |
| Still getting "No AI provider" | Restart with `docker compose restart` |
| API Error 401 | Key is invalid, get a new one |
| Timeout | Increase timeout: `SMART_NUTRITION_OPENROUTER_TIMEOUT_MS=45000` |

---

## File Structure

What was created:

```
server/services/
├── aiProvider.mjs          ← 3 AI client implementations
├── assistantService.mjs    ← Coordinates AI + nutrition data
└── aiConfig.mjs            ← Config validation

.env.example               ← Template (UPDATED)
AI_INTEGRATION_SETUP.md    ← Full guide
AI_SETUP_CHEATSHEET.md     ← This file
```

---

## Test Your Setup

After restarting, server will log:

✅ = AI is working
⚠️ = Using local analysis only

---

## Need Help?

1. Check `.env` file exists
2. Run `docker compose logs smart-nutrition` to see startup logs
3. Verify API key is valid at provider's website
4. See `AI_INTEGRATION_SETUP.md` for detailed troubleshooting
