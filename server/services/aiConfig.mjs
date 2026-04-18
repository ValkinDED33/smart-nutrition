/**
 * AI Configuration Validator
 * 
 * Validates that all required AI environment variables are set
 * Provides clear error messages if configuration is missing
 */

export function validateAIConfig(env) {
  const provider = env.SMART_NUTRITION_AI_PROVIDER || 'openrouter';
  const errors = [];

  console.log(`📋 Validating AI configuration for provider: ${provider.toUpperCase()}`);

  // Check which provider is configured
  if (provider.toLowerCase() === 'openrouter') {
    if (!env.SMART_NUTRITION_OPENROUTER_API_KEY) {
      errors.push('Missing: SMART_NUTRITION_OPENROUTER_API_KEY');
    }
    if (!env.SMART_NUTRITION_OPENROUTER_MODEL) {
      errors.push('Missing: SMART_NUTRITION_OPENROUTER_MODEL');
    }
  } else if (provider.toLowerCase() === 'groq') {
    if (!env.SMART_NUTRITION_GROQ_API_KEY) {
      errors.push('Missing: SMART_NUTRITION_GROQ_API_KEY');
    }
    if (!env.SMART_NUTRITION_GROQ_MODEL) {
      errors.push('Missing: SMART_NUTRITION_GROQ_MODEL');
    }
  } else if (provider.toLowerCase() === 'google') {
    if (!env.SMART_NUTRITION_GOOGLE_API_KEY) {
      errors.push('Missing: SMART_NUTRITION_GOOGLE_API_KEY');
    }
    if (!env.SMART_NUTRITION_GOOGLE_MODEL) {
      errors.push('Missing: SMART_NUTRITION_GOOGLE_MODEL');
    }
  }

  if (errors.length > 0) {
    console.warn('⚠️  AI Configuration Issues:');
    errors.forEach((err) => console.warn(`   - ${err}`));
    console.warn('\n📖 To configure AI:');
    console.warn('   1. Get API keys from:');
    console.warn('      - OpenRouter: https://openrouter.ai/keys');
    console.warn('      - Groq: https://console.groq.com/keys');
    console.warn('      - Google: https://aistudio.google.com/app/apikey');
    console.warn('   2. Copy .env.example to .env');
    console.warn('   3. Add your API keys to .env');
    console.warn('   4. Restart the server\n');

    if (env.SMART_NUTRITION_ASSISTANT_FALLBACK_TO_LOCAL) {
      console.warn('   ℹ️  Falling back to local analysis (no AI)\n');
    }
  } else {
    console.log(`✅ AI Configuration valid for ${provider}`);
  }

  return errors.length === 0;
}

/**
 * Get provider display name
 */
export function getProviderName(providerCode) {
  const names = {
    openrouter: 'OpenRouter.ai',
    groq: 'Groq',
    google: 'Google Gemini',
  };
  return names[providerCode?.toLowerCase()] || 'Unknown';
}

/**
 * Get provider info
 */
export function getProviderInfo(providerCode) {
  const info = {
    openrouter: {
      name: 'OpenRouter.ai',
      url: 'https://openrouter.ai/keys',
      defaultModel: 'meta-llama/llama-2-70b-chat',
      description: '200+ models, production-ready',
    },
    groq: {
      name: 'Groq',
      url: 'https://console.groq.com/keys',
      defaultModel: 'mixtral-8x7b-32768',
      description: 'Ultra-fast inference, free tier',
    },
    google: {
      name: 'Google Gemini',
      url: 'https://aistudio.google.com/app/apikey',
      defaultModel: 'gemini-pro',
      description: 'Latest models, free tier',
    },
  };

  return info[providerCode?.toLowerCase()] || null;
}
