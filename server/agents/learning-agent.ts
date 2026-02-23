import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface UserPreferences {
  favoriteFoods: { food: string; count: number }[];
  optimalMedicationTimes: { medicationName: string; optimalTime: string; adherenceRate: number }[];
  sleepPattern: { averageBedtime: string; averageWakeTime: string; averageDuration: number };
  moodPatterns: { mood: string; triggers: string[] }[];
  activityPreferences: { activity: string; preferredTime: string; frequency: number }[];
}

export class LearningAgent extends BaseAgent {
  constructor() {
    super("LearningAgent");
  }

  async execute(
    input: {
      action: "analyze_preferences" | "suggest_meal" | "suggest_medication_time" | "predict_symptom" | "suggest_activity";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Learning action: ${input.action}`);

    try {
      switch (input.action) {
        case "analyze_preferences":
          return await this.analyzeUserPreferences(context);
        case "suggest_meal":
          return await this.suggestMeal(context);
        case "suggest_medication_time":
          return await this.suggestOptimalMedicationTime(input.data?.medicationName, context);
        case "predict_symptom":
          return await this.predictSymptomRisk(context);
        case "suggest_activity":
          return await this.suggestActivity(context);
        default:
          return { success: false, message: "Unknown action" };
      }
    } catch (error: any) {
      this.log(`Error in learning agent: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async analyzeUserPreferences(context: AgentContext): Promise<AgentResponse> {
    this.log("Analyzing user preferences from historical data");

    const preferences: UserPreferences = {
      favoriteFoods: await this.analyzeFavoriteFoods(context.user.id),
      optimalMedicationTimes: await this.analyzeOptimalMedicationTimes(context.user.id),
      sleepPattern: await this.analyzeSleepPattern(context.user.id),
      moodPatterns: await this.analyzeMoodPatterns(context.user.id),
      activityPreferences: await this.analyzeActivityPreferences(context.user.id),
    };

    return {
      success: true,
      data: preferences,
    };
  }

  private async analyzeFavoriteFoods(userId: string): Promise<{ food: string; count: number }[]> {
    const meals = await storage.getHistoricalMeals(userId, 30);
    const foodCounts: Record<string, number> = {};

    meals.forEach(meal => {
      if (!meal.foods) return;
      
      // Parse foods from the meal
      const foods = meal.foods.split(",").map(f => f.trim().toLowerCase());
      foods.forEach(food => {
        // Extract just the food name (remove portions in parentheses)
        const foodName = food.split("(")[0].trim();
        if (foodName) {
          foodCounts[foodName] = (foodCounts[foodName] || 0) + 1;
        }
      });
    });

    // Sort by frequency and return top 10
    return Object.entries(foodCounts)
      .map(([food, count]) => ({ food, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async analyzeOptimalMedicationTimes(userId: string): Promise<{ medicationName: string; optimalTime: string; adherenceRate: number }[]> {
    const schedules = await storage.getHistoricalMedications(userId, 30);
    const medications = await storage.getUserMedications(userId);
    
    // Create a map of medication IDs to names
    const medNameMap = new Map(medications.map(m => [m.id, m.name]));
    
    const medData: Record<string, { taken: number; total: number; times: number[] }> = {};

    schedules.forEach(schedule => {
      const medName = medNameMap.get(schedule.medicationId) || "Unknown";
      
      if (!medData[medName]) {
        medData[medName] = { taken: 0, total: 0, times: [] };
      }
      medData[medName].total++;
      if (schedule.taken && schedule.takenAt) {
        medData[medName].taken++;
        const takenTime = new Date(schedule.takenAt);
        const minutes = takenTime.getHours() * 60 + takenTime.getMinutes();
        medData[medName].times.push(minutes);
      }
    });

    return Object.entries(medData).map(([medicationName, data]) => {
      const adherenceRate = data.total > 0 ? (data.taken / data.total) * 100 : 0;
      let optimalTime = "Not enough data";
      
      if (data.times.length > 0) {
        // Calculate median time when medication is actually taken
        data.times.sort((a, b) => a - b);
        const median = data.times[Math.floor(data.times.length / 2)];
        optimalTime = this.minutesToTime(median);
      }

      return { medicationName, optimalTime, adherenceRate: Math.round(adherenceRate) };
    });
  }

  private async analyzeSleepPattern(userId: string): Promise<{ averageBedtime: string; averageWakeTime: string; averageDuration: number }> {
    // For now, return placeholder - would need sleep logging feature
    return {
      averageBedtime: "10:30 PM",
      averageWakeTime: "7:00 AM",
      averageDuration: 8.5,
    };
  }

  private async analyzeMoodPatterns(userId: string): Promise<{ mood: string; triggers: string[] }[]> {
    // Analyze symptoms as mood indicators
    const symptoms = await storage.getRecentSymptoms(userId, 30);
    const moodData: Record<string, Set<string>> = {};

    symptoms.forEach(symptom => {
      const mood = this.symptomToMood(symptom.symptom);
      if (!moodData[mood]) {
        moodData[mood] = new Set();
      }
      
      // Analyze potential triggers from notes
      if (symptom.notes) {
        const triggers = this.extractTriggers(symptom.notes);
        triggers.forEach(trigger => moodData[mood].add(trigger));
      }
    });

    return Object.entries(moodData).map(([mood, triggers]) => ({
      mood,
      triggers: Array.from(triggers),
    }));
  }

  private async analyzeActivityPreferences(userId: string): Promise<{ activity: string; preferredTime: string; frequency: number }[]> {
    const activities = await storage.getHistoricalActivities(userId, 30);
    const activityData: Record<string, { times: number[]; count: number }> = {};

    activities.forEach(activity => {
      if (!activityData[activity.activity]) {
        activityData[activity.activity] = { times: [], count: 0 };
      }
      activityData[activity.activity].count++;
      
      const time = new Date(activity.loggedAt);
      const minutes = time.getHours() * 60 + time.getMinutes();
      activityData[activity.activity].times.push(minutes);
    });

    return Object.entries(activityData).map(([activity, data]) => {
      let preferredTime = "Anytime";
      if (data.times.length > 0) {
        data.times.sort((a, b) => a - b);
        const median = data.times[Math.floor(data.times.length / 2)];
        preferredTime = this.minutesToTime(median);
      }

      return { activity, preferredTime, frequency: data.count };
    }).sort((a, b) => b.frequency - a.frequency);
  }

  private async suggestMeal(context: AgentContext): Promise<AgentResponse> {
    const favoriteFoods = await this.analyzeFavoriteFoods(context.user.id);
    const currentHour = context.currentTime.getHours();
    const todayMeals = await storage.getTodayMeals(context.user.id);
    
    // Determine meal type
    let mealType = "snack";
    if (currentHour < 11) mealType = "breakfast";
    else if (currentHour < 16) mealType = "lunch";
    else if (currentHour < 21) mealType = "dinner";

    // Check if meal already logged
    const alreadyLogged = todayMeals.some(m => m.mealType === mealType);
    
    if (alreadyLogged) {
      return {
        success: true,
        data: {
          message: `You've already logged ${mealType} today!`,
          suggestions: [],
        },
      };
    }

    // Get top 3 favorite foods
    const suggestions = favoriteFoods.slice(0, 3).map(f => f.food);

    return {
      success: true,
      data: {
        mealType,
        message: `Time for ${mealType}! Based on your preferences, you might enjoy:`,
        suggestions: suggestions.length > 0 ? suggestions : ["Eggs", "Salad", "Chicken"],
      },
    };
  }

  private async suggestOptimalMedicationTime(medicationName: string, context: AgentContext): Promise<AgentResponse> {
    const optimalTimes = await this.analyzeOptimalMedicationTimes(context.user.id);
    const medData = optimalTimes.find(m => m.medicationName === medicationName);

    if (!medData) {
      return {
        success: false,
        message: "No historical data for this medication",
      };
    }

    return {
      success: true,
      data: {
        medicationName,
        currentAdherence: medData.adherenceRate,
        suggestedTime: medData.optimalTime,
        message: medData.adherenceRate < 80 
          ? `You tend to take ${medicationName} around ${medData.optimalTime}. Consider scheduling it for this time to improve adherence.`
          : `Great job! You're ${medData.adherenceRate}% adherent with ${medicationName}.`,
      },
    };
  }

  private async predictSymptomRisk(context: AgentContext): Promise<AgentResponse> {
    const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 14);
    const todayMeals = await storage.getTodayMeals(context.user.id);
    const todayMeds = await storage.getTodayMedications(context.user.id);
    
    const risks: string[] = [];
    
    // Check for meal-related symptom patterns
    const currentHour = context.currentTime.getHours();
    const lunchLogged = todayMeals.some(m => m.mealType === "lunch");
    
    if (currentHour > 14 && !lunchLogged) {
      const dizzinessAfterSkippingLunch = recentSymptoms.filter(s => 
        s.symptom.toLowerCase().includes("dizz") || s.symptom.toLowerCase().includes("weak")
      ).length;
      
      if (dizzinessAfterSkippingLunch > 0) {
        risks.push("You've skipped lunch and have experienced dizziness before when doing this. Consider eating soon.");
      }
    }

    // Check medication adherence
    const medsDue = todayMeds.filter(m => new Date(m.scheduledTime) <= context.currentTime);
    const medsTaken = medsDue.filter(m => m.taken);
    
    if (medsDue.length > medsTaken.length) {
      risks.push(`You have ${medsDue.length - medsTaken.length} medication(s) pending. Missing doses may increase symptom risk.`);
    }

    return {
      success: true,
      data: {
        riskLevel: risks.length > 0 ? "medium" : "low",
        risks,
        message: risks.length > 0 
          ? "I've noticed some patterns that might affect how you feel today."
          : "You're doing great today! Keep up with your routine.",
      },
    };
  }

  private async suggestActivity(context: AgentContext): Promise<AgentResponse> {
    const activityPrefs = await this.analyzeActivityPreferences(context.user.id);
    const currentHour = context.currentTime.getHours();
    const todayActivities = await storage.getTodayActivities(context.user.id);

    // Find activities typically done at this time
    const currentMinutes = currentHour * 60 + context.currentTime.getMinutes();
    const suggestions = activityPrefs.filter(pref => {
      const prefTime = this.timeToMinutes(pref.preferredTime);
      return Math.abs(prefTime - currentMinutes) < 120; // Within 2 hours
    });

    // Filter out already done activities
    const alreadyDone = new Set(todayActivities.map(a => a.activity));
    const availableSuggestions = suggestions.filter(s => !alreadyDone.has(s.activity));

    return {
      success: true,
      data: {
        suggestions: availableSuggestions.slice(0, 3),
        message: availableSuggestions.length > 0
          ? "Based on your routine, you usually do these activities around this time:"
          : "You're ahead of schedule today! Consider trying something new.",
      },
    };
  }

  // Helper methods
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  }

  private timeToMinutes(timeStr: string): number {
    if (timeStr === "Anytime" || timeStr === "Not enough data") return 720; // Default to noon
    
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 720;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }

  private symptomToMood(symptom: string): string {
    const lower = symptom.toLowerCase();
    if (lower.includes("anxious") || lower.includes("worry")) return "anxious";
    if (lower.includes("sad") || lower.includes("depress")) return "sad";
    if (lower.includes("tired") || lower.includes("fatigue")) return "tired";
    if (lower.includes("pain") || lower.includes("ache")) return "uncomfortable";
    return "neutral";
  }

  private extractTriggers(notes: string): string[] {
    const triggers: string[] = [];
    const lower = notes.toLowerCase();
    
    if (lower.includes("skip") && lower.includes("meal")) triggers.push("skipped meal");
    if (lower.includes("stress")) triggers.push("stress");
    if (lower.includes("sleep")) triggers.push("poor sleep");
    if (lower.includes("weather") || lower.includes("hot") || lower.includes("cold")) triggers.push("weather");
    
    return triggers;
  }
}
