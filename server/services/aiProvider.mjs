/**
 * AI Provider Configuration and Client Factory
 * 
 * Supports: OpenRouter, Groq, Google Gemini
 * Easily extensible for new providers
 */

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeout: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

export abstract class AIProvider {
  abstract sendMessage(messages: AIMessage[]): Promise<AIResponse>;
  abstract isConfigured(): boolean;
}

/**
 * OpenRouter.ai Client
 * https://openrouter.ai/keys
 */
export class OpenRouterClient extends AIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    super();
    this.config = config;
  }

  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://smart-nutrition.app',
        'X-Title': 'Smart Nutrition',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.4,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: this.config.model,
      provider: 'openrouter',
      tokensUsed: data.usage?.total_tokens,
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }
}

/**
 * Groq Client
 * https://console.groq.com/keys
 */
export class GroqClient extends AIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    super();
    this.config = config;
  }

  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.4,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: this.config.model,
      provider: 'groq',
      tokensUsed: data.usage?.total_tokens,
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }
}

/**
 * Google Gemini Client
 * https://aistudio.google.com/app/apikey
 */
export class GoogleGeminiClient extends AIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    super();
    this.config = config;
  }

  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch(`${this.config.baseUrl}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.4,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Google Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: this.config.model,
      provider: 'google',
      tokensUsed: data.usage?.total_tokens,
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }
}

/**
 * AI Provider Factory - creates the configured provider
 */
export class AIProviderFactory {
  static createProvider(providerName: string, config: Record<string, any>): AIProvider | null {
    switch (providerName.toLowerCase()) {
      case 'openrouter':
        return new OpenRouterClient({
          apiKey: config.SMART_NUTRITION_OPENROUTER_API_KEY,
          model: config.SMART_NUTRITION_OPENROUTER_MODEL,
          baseUrl: config.SMART_NUTRITION_OPENROUTER_BASE_URL,
          timeout: config.SMART_NUTRITION_OPENROUTER_TIMEOUT_MS || 30000,
        });

      case 'groq':
        return new GroqClient({
          apiKey: config.SMART_NUTRITION_GROQ_API_KEY,
          model: config.SMART_NUTRITION_GROQ_MODEL,
          baseUrl: config.SMART_NUTRITION_GROQ_BASE_URL,
          timeout: config.SMART_NUTRITION_GROQ_TIMEOUT_MS || 30000,
        });

      case 'google':
        return new GoogleGeminiClient({
          apiKey: config.SMART_NUTRITION_GOOGLE_API_KEY,
          model: config.SMART_NUTRITION_GOOGLE_MODEL,
          baseUrl: config.SMART_NUTRITION_GOOGLE_BASE_URL,
          timeout: config.SMART_NUTRITION_GOOGLE_TIMEOUT_MS || 30000,
        });

      default:
        return null;
    }
  }

  static getConfiguredProvider(env: Record<string, any>): AIProvider | null {
    const provider = env.SMART_NUTRITION_AI_PROVIDER || 'openrouter';
    return this.createProvider(provider, env);
  }
}
