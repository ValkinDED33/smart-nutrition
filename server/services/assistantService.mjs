/**
 * Smart Nutrition Assistant Service
 * 
 * Coordinates AI analysis with local nutrition data
 * Supports multiple AI providers with fallback
 */

import { AIProviderFactory } from './aiProvider.mjs';

export class AssistantService {
  constructor(
    private aiProvider,
    private env
  ) {}

  /**
   * Analyze nutrition for the day and provide recommendations
   */
  async analyzeNutrition(mealData) {
    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildNutritionAnalysisPrompt(mealData);

    try {
      const response = await this.aiProvider.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      return {
        analysis: response.content,
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
      };
    } catch (error) {
      console.error('AI analysis failed:', error.message);

      if (this.env.SMART_NUTRITION_ASSISTANT_FALLBACK_TO_LOCAL) {
        return this.providLocalAnalysis(mealData);
      }

      throw error;
    }
  }

  /**
   * Analyze meal photo and estimate nutritional content
   */
  async analyzeMealPhoto(imageBase64, existingMeals) {
    const systemPrompt = this.buildPhotoAnalysisSystemPrompt();
    const userMessage = this.buildPhotoAnalysisPrompt(imageBase64, existingMeals);

    try {
      const response = await this.aiProvider.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      return {
        analysis: response.content,
        provider: response.provider,
        confidence: this.extractConfidence(response.content),
      };
    } catch (error) {
      console.error('Photo analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get personalized nutrition recommendations
   */
  async getRecommendations(profile, currentMeals, goals) {
    const systemPrompt = this.buildRecommendationSystemPrompt(profile);
    const userMessage = this.buildRecommendationPrompt(currentMeals, goals, profile);

    try {
      const response = await this.aiProvider.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      return {
        recommendations: response.content,
        provider: response.provider,
      };
    } catch (error) {
      console.error('Recommendations generation failed:', error.message);
      throw error;
    }
  }

  // ==================== PROMPT BUILDERS ====================

  private buildSystemPrompt() {
    return `You are a smart nutrition assistant for the Smart Nutrition app.
Your role is to analyze user's daily nutrition and provide actionable, specific advice.

Key principles:
1. Be supportive but honest
2. Provide specific, measurable recommendations (not generic advice)
3. Consider user's goals (cut/bulk/maintain)
4. Highlight both positive and areas to improve
5. Keep responses concise and actionable

Format your response as a friendly analysis with 2-3 main points.`;
  }

  private buildPhotoAnalysisSystemPrompt() {
    return `You are a nutrition expert analyzing food photos.
Your task is to:
1. Identify the dish/meal
2. Estimate portion size
3. Provide estimated nutritional breakdown
4. Rate your confidence level (1-100%)

Be specific with estimates. Format as JSON with fields:
{
  "dish": "name of dish",
  "portion": "estimated weight in grams",
  "calories": approximate number,
  "protein": grams,
  "fat": grams,
  "carbs": grams,
  "confidence": percentage (0-100),
  "notes": "any important notes"
}`;
  }

  private buildRecommendationSystemPrompt(profile) {
    return `You are a personalized nutrition coach for a user with the following profile:
- Goal: ${profile.goal} (cut/bulk/maintain)
- Daily calorie target: ${profile.dailyCalories}
- Diet style: ${profile.dietStyle}
- Allergies: ${profile.allergies?.join(', ') || 'None'}

Provide specific, actionable recommendations that help them reach their goals.`;
  }

  // ==================== PROMPT CONTENT ====================

  private buildNutritionAnalysisPrompt(mealData) {
    const { totalNutrients, meals, goal, dailyTarget } = mealData;

    return `Analyze today's nutrition:

Total consumed:
- Calories: ${totalNutrients.calories.toFixed(0)} / ${dailyTarget} kcal
- Protein: ${totalNutrients.protein.toFixed(1)}g
- Fat: ${totalNutrients.fat.toFixed(1)}g
- Carbs: ${totalNutrients.carbs.toFixed(1)}g

Meals logged: ${meals.length}

Goal: ${goal} (${goal === 'cut' ? 'lose weight' : goal === 'bulk' ? 'gain muscle' : 'maintain weight'})

Provide 2-3 specific, actionable recommendations for the rest of the day.`;
  }

  private buildPhotoAnalysisPrompt(imageBase64, existingMeals) {
    return `Analyze this meal photo and provide nutritional estimates.

Context: User has already logged ${existingMeals.length} meals today.

Image: [Image data provided]

Provide detailed nutritional breakdown as JSON.`;
  }

  private buildRecommendationPrompt(currentMeals, goals, profile) {
    const totalCalories = currentMeals.reduce(
      (sum, m) => sum + (m.product.nutrients.calories * m.quantity) / 100,
      0
    );

    return `Based on today's meals, provide recommendations:

Current status:
- Meals: ${currentMeals.length}
- Total calories: ${totalCalories.toFixed(0)} / ${profile.dailyCalories}
- Progress: ${((totalCalories / profile.dailyCalories) * 100).toFixed(0)}%

Provide 2-3 specific suggestions to optimize remaining meals.`;
  }

  // ==================== HELPERS ====================

  private providLocalAnalysis(mealData) {
    // Fallback local analysis without AI
    const { totalNutrients, goal, dailyTarget } = mealData;
    const calorieProgress = (totalNutrients.calories / dailyTarget) * 100;

    let analysis = '';

    if (calorieProgress < 80) {
      analysis += `You're at ${calorieProgress.toFixed(0)}% of your daily goal. Consider adding more food.\n`;
    } else if (calorieProgress > 110) {
      analysis += `You've exceeded your goal by ${(calorieProgress - 100).toFixed(0)}%. Try lighter meals for the rest of the day.\n`;
    } else {
      analysis += `Great! You're right on track with your calorie goal.\n`;
    }

    if (totalNutrients.protein < 50) {
      analysis += `Protein intake is low (${totalNutrients.protein.toFixed(0)}g). Add protein-rich foods.`;
    }

    return {
      analysis: analysis || 'Keep up with your nutrition tracking!',
      provider: 'local',
      model: 'rule-based',
    };
  }

  private extractConfidence(response) {
    const match = response.match(/"confidence":\s*(\d+)/);
    return match ? parseInt(match[1]) : 50;
  }
}

/**
 * Initialize Assistant Service
 */
export function createAssistantService(env) {
  const aiProvider = AIProviderFactory.getConfiguredProvider(env);

  if (!aiProvider || !aiProvider.isConfigured()) {
    console.warn('⚠️  No AI provider configured. Using local analysis only.');
    return new AssistantService(null, env);
  }

  console.log(`✅ AI Provider initialized: ${env.SMART_NUTRITION_AI_PROVIDER}`);
  return new AssistantService(aiProvider, env);
}
