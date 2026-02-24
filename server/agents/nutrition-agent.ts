import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";
import { RAGAgent } from "./rag-agent";

export class NutritionAgent extends BaseAgent {
  private ragAgent: RAGAgent;

  constructor() {
    super("NutritionAgent");
    this.ragAgent = new RAGAgent();
  }

  async execute(
    input: {
      action: "analyze_photo" | "get_recommendations" | "track_nutrition" | "check_diet_compliance";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Nutrition action: ${input.action}`);

    try {
      switch (input.action) {
        case "analyze_photo":
          return await this.analyzeMealPhoto(input.data, context);
        case "get_recommendations":
          return await this.getNutritionRecommendations(context);
        case "track_nutrition":
          return await this.trackNutrition(input.data, context);
        case "check_diet_compliance":
          return await this.checkDietCompliance(context);
        default:
          return { success: false, message: "Unknown action" };
      }
    } catch (error: any) {
      this.log(`Error in nutrition agent: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async analyzeMealPhoto(
    data: { imageUrl: string; mealType?: string },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Analyzing meal photo: ${data.imageUrl}`);

    // Use OpenAI Vision to analyze meal
    const response = await this.callOpenAI([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this meal photo and return detailed JSON:
{
  "foodItems": [
    {
      "name": "food name",
      "quantity": "estimated quantity (e.g., 1 cup, 200g, 2 pieces)",
      "calories": estimated_calories_number,
      "protein": grams,
      "carbs": grams,
      "fat": grams
    }
  ],
  "detectedFoods": ["simple list of food names"],
  "estimatedCalories": total_calories,
  "nutritionEstimate": {
    "calories": total_number,
    "protein": total_grams,
    "carbs": total_grams,
    "fat": total_grams,
    "fiber": total_grams
  },
  "dietaryFlags": ["vegetarian", "high-sodium", "high-sugar", etc],
  "healthScore": 0-100,
  "recommendations": ["suggestion 1", "suggestion 2"],
  "medicationGuidance": "any relevant guidance about medications and this meal",
  "confidence": 0.0-1.0
}

Be realistic with estimates. Provide specific quantities and per-item calories. If unclear, indicate lower confidence.`,
          },
          {
            type: "image_url",
            image_url: { url: data.imageUrl },
          },
        ],
      },
    ], {
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Don't auto-save - let user edit first
    // The frontend will call createMeal after user confirms/edits

    // Store in RAG for future reference
    await this.ragAgent.storeMemory(
      context.user.id,
      "nutrition_pattern",
      `${data.mealType || "meal"}: ${analysis.detectedFoods?.join(", ") || analysis.foodItems?.map((f: any) => f.name).join(", ")} - ${analysis.healthScore}/100 health score`,
      { 
        source: "photo_analysis",
        imageUrl: data.imageUrl,
        nutrition: analysis.nutritionEstimate,
      }
    );

    return {
      success: true,
      data: analysis,
    };
  }

  private async getNutritionRecommendations(context: AgentContext): Promise<AgentResponse> {
    // Get recent meals
    const recentMeals = await storage.getRecentMeals(context.user.id, 7);
    const medications = await storage.getUserMedications(context.user.id);

    // Aggregate nutrition data
    const totalNutrition = recentMeals.reduce((acc, meal) => {
      if (meal.nutritionData) {
        const data = meal.nutritionData as any;
        acc.calories += data.calories || 0;
        acc.protein += data.protein || 0;
        acc.carbs += data.carbs || 0;
        acc.fat += data.fat || 0;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Get personalized recommendations
    const systemPrompt = `You are a nutrition advisor for a health app. Provide personalized recommendations.

User's recent nutrition (last 7 days):
- Total calories: ${totalNutrition.calories}
- Protein: ${totalNutrition.protein}g
- Carbs: ${totalNutrition.carbs}g
- Fat: ${totalNutrition.fat}g

Medications: ${medications.map(m => m.name).join(", ")}
Age group: ${context.user.ageGroup}

Generate JSON:
{
  "recommendations": [
    {
      "category": "hydration" | "protein" | "vegetables" | "sodium" | "sugar",
      "priority": "high" | "medium" | "low",
      "message": "Clear, actionable recommendation",
      "reason": "Why this matters for their health"
    }
  ],
  "weeklyGoals": {
    "calories": "target range",
    "protein": "target grams",
    "vegetables": "servings per day"
  },
  "foodsToAvoid": ["food 1", "food 2"],
  "foodsToInclude": ["food 1", "food 2"]
}

Consider medication interactions (e.g., blood thinners + leafy greens, diabetes + sugar).`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate nutrition recommendations" },
    ], {
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const recommendations = JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      data: recommendations,
    };
  }

  private async trackNutrition(
    data: { mealType: string; foods: string; manualNutrition?: any },
    context: AgentContext
  ): Promise<AgentResponse> {
    // If manual nutrition provided, use it
    if (data.manualNutrition) {
      await storage.createMealLog(context.user.id, {
        mealType: data.mealType,
        foods: data.foods,
        loggedAt: new Date(),
        nutritionData: data.manualNutrition,
      });

      return {
        success: true,
        data: { logged: true, nutrition: data.manualNutrition },
      };
    }

    // Otherwise, estimate from food description
    const systemPrompt = `Estimate nutrition for this meal. Return JSON:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "confidence": 0.0-1.0
}`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Meal: ${data.foods}` },
    ], {
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const nutrition = JSON.parse(response.choices[0].message.content);

    await storage.createMealLog(context.user.id, {
      mealType: data.mealType,
      foods: data.foods,
      loggedAt: new Date(),
      nutritionData: nutrition,
    });

    return {
      success: true,
      data: { logged: true, nutrition },
    };
  }

  private async checkDietCompliance(context: AgentContext): Promise<AgentResponse> {
    const recentMeals = await storage.getRecentMeals(context.user.id, 7);
    const baseline = await storage.getRoutineBaseline(context.user.id);

    // Check against dietary preferences/restrictions
    const dietaryPreferences = baseline?.activityPatterns as any || {};
    
    const systemPrompt = `Analyze diet compliance. Return JSON:
{
  "complianceScore": 0-100,
  "violations": [
    {
      "type": "high-sodium" | "high-sugar" | "missed-vegetables",
      "severity": "low" | "medium" | "high",
      "description": "What was violated",
      "recommendation": "How to improve"
    }
  ],
  "positives": ["good habit 1", "good habit 2"],
  "weeklyTrend": "improving" | "stable" | "declining"
}`;

    const mealsDescription = recentMeals.map(m => 
      `${m.mealType}: ${m.foods}`
    ).join("\n");

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Recent meals:\n${mealsDescription}\n\nDietary preferences: ${JSON.stringify(dietaryPreferences)}` },
    ], {
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const compliance = JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      data: compliance,
    };
  }

  async getMealImprovementSuggestions(
    mealData: { foods: string; mealType: string; estimatedCalories?: number },
    context: AgentContext
  ): Promise<{ suggestions: string[]; macroAnalysis: string; improvements: string }> {
    const systemPrompt = `You are a nutrition expert helping elderly users improve their meals. Analyze the meal and provide:
1. Macro-nutrient balance assessment
2. Specific, actionable improvements
3. Simple suggestions they can implement

Be encouraging and practical. Focus on adding nutrients, not removing foods.`;

    const userPrompt = `Meal: ${mealData.foods}
Meal Type: ${mealData.mealType}
${mealData.estimatedCalories ? `Estimated Calories: ${mealData.estimatedCalories}` : ''}

Provide:
1. Quick macro-nutrient analysis (protein, carbs, fats, fiber)
2. 3-4 specific improvements to achieve better nutrition
3. Simple additions or swaps to balance the meal

Format as JSON:
{
  "macroAnalysis": "brief analysis of protein/carbs/fats/fiber balance",
  "improvements": "paragraph with specific actionable improvements",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
