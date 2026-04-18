# 🤖 AI Integration Guide

Smart Nutrition supports 3 powerful AI providers for intelligent nutrition analysis.

---

## 🚀 Quick Start

### 1. Get API Key

Choose one provider and get an API key:

| Provider | Link | Free Tier | Best For |
|---|---|---|---|
| **OpenRouter** | https://openrouter.ai/keys | Limited | 200+ models, production-ready |
| **Groq** | https://console.groq.com/keys | 1M tokens/day | Ultra-fast inference |
| **Google Gemini** | https://aistudio.google.com/app/apikey | Limited | Latest models, easiest setup |

### 2. Copy Environment File

```bash
cp .env.example .env
```

### 3. Add Your API Key

Edit `.env` and fill in your chosen provider:

**For OpenRouter:**
```env
SMART_NUTRITION_AI_PROVIDER=openrouter
SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-...
SMART_NUTRITION_OPENROUTER_MODEL=meta-llama/llama-2-70b-chat
```

**For Groq:**
```env
SMART_NUTRITION_AI_PROVIDER=groq
SMART_NUTRITION_GROQ_API_KEY=gsk_...
SMART_NUTRITION_GROQ_MODEL=mixtral-8x7b-32768
```

**For Google Gemini:**
```env
SMART_NUTRITION_AI_PROVIDER=google
SMART_NUTRITION_GOOGLE_API_KEY=AIzaSy...
SMART_NUTRITION_GOOGLE_MODEL=gemini-pro
```

### 4. Restart Server

```bash
docker compose down
docker compose up
```

---

## 📚 Provider Details

### OpenRouter.ai
- **URL:** https://openrouter.ai/keys
- **Strengths:** 200+ models to choose from, production-ready
- **Best for:** Experimenting with different models
- **Free tier:** Limited requests
- **Models:** llama-2-70b, mistral, claude, gpt-4, and more

### Groq
- **URL:** https://console.groq.com/keys
- **Strengths:** Fastest inference (sub-second responses)
- **Best for:** Real-time analysis, low latency
- **Free tier:** 1M tokens/day
- **Models:** Mixtral, Llama 2, and more

### Google Gemini
- **URL:** https://aistudio.google.com/app/apikey
- **Strengths:** Latest Google models, easiest to set up
- **Best for:** State-of-the-art capabilities
- **Free tier:** Limited requests
- **Models:** Gemini Pro, Gemini Pro Vision

---

## 🔧 Configuration

### Change Provider

Simply update `SMART_NUTRITION_AI_PROVIDER` to switch:

```env
SMART_NUTRITION_AI_PROVIDER=groq
```

Supported values: `openrouter`, `groq`, `google`

### Customize Models

Each provider has configurable models:

```env
# Try different OpenRouter models
SMART_NUTRITION_OPENROUTER_MODEL=mistral-7b-instruct
SMART_NUTRITION_OPENROUTER_MODEL=neural-chat-7b-v3-1
SMART_NUTRITION_OPENROUTER_MODEL=claude-instant
```

### Timeout Settings

Adjust timeout for slower connections:

```env
SMART_NUTRITION_OPENROUTER_TIMEOUT_MS=45000
SMART_NUTRITION_GROQ_TIMEOUT_MS=20000
SMART_NUTRITION_GOOGLE_TIMEOUT_MS=45000
```

---

## ⚙️ Server-Side Usage

### Initialize Assistant Service

```javascript
import { createAssistantService } from './services/assistantService.mjs';

const assistantService = createAssistantService(process.env);
```

### Analyze Nutrition

```javascript
const analysis = await assistantService.analyzeNutrition({
  totalNutrients: { calories: 1800, protein: 150, fat: 60, carbs: 200 },
  meals: meals,
  goal: 'cut',
  dailyTarget: 2000,
});

console.log(analysis.analysis); // AI recommendation
console.log(analysis.provider); // 'openrouter', 'groq', or 'google'
```

### Analyze Meal Photo

```javascript
const photoAnalysis = await assistantService.analyzeMealPhoto(
  imageBase64,
  existingMeals
);

console.log(photoAnalysis.analysis); // JSON with nutritional estimates
console.log(photoAnalysis.confidence); // 0-100% confidence score
```

### Get Recommendations

```javascript
const recommendations = await assistantService.getRecommendations(
  profile,
  currentMeals,
  goals
);

console.log(recommendations.recommendations); // Personalized advice
```

---

## 🛡️ Fallback Mode

If no AI provider is configured, the app falls back to local rule-based analysis:

```env
SMART_NUTRITION_ASSISTANT_FALLBACK_TO_LOCAL=true
```

This allows the app to work even without API keys.

---

## 🚨 Troubleshooting

### "No AI provider configured"

1. Check `.env` file exists
2. Verify `SMART_NUTRITION_AI_PROVIDER` is set
3. Check API key is correct and not empty
4. Restart server: `docker compose restart`

### "API Error: 401"

- Invalid API key
- API key for wrong provider
- API key has expired

**Solution:** Get a new API key from the provider's website

### "Timeout"

- Provider's API is slow
- Network issue
- Increase timeout in `.env`

```env
SMART_NUTRITION_GROQ_TIMEOUT_MS=45000
```

### "Rate limit exceeded"

- Using free tier with heavy traffic
- Upgrade to paid plan or switch provider

---

## 📊 API Key Management

### Never commit API keys

`.env` is gitignored, so your keys are safe.

```bash
# Verify .env is ignored
cat .gitignore | grep ".env"
```

### Rotate keys regularly

Get new API keys every 3-6 months for security.

---

## 💡 Recommended Setup

**For Development:**
- Use **Groq** (free tier, fast)
- Or **Google Gemini** (easiest setup)

**For Production:**
- Use **OpenRouter** (production-ready, reliable)
- With monitoring and error handling

---

## 🔗 Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/)

---

## Next Steps

1. Get API key from your chosen provider
2. Add key to `.env`
3. Restart server
4. AI features are now active! 🎉
