import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

export class SummaryAgent extends BaseAgent {
  constructor() {
    super("SummaryAgent");
  }

  async execute(
    input: {
      summaryType: "morning" | "evening" | "weekly" | "doctor_visit";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Generating ${input.summaryType} summary`);

    try {
      let summary: any;

      switch (input.summaryType) {
        case "morning":
          summary = await this.generateMorningSummary(context);
          break;
        case "evening":
          summary = await this.generateEveningSummary(context);
          break;
        case "weekly":
          summary = await this.generateWeeklySummary(context);
          break;
        case "doctor_visit":
          summary = await this.generateDoctorVisitSummary(context);
          break;
        default:
          return { success: false, message: "Unknown summary type" };
      }

      // Store summary
      await storage.createSummary(context.user.id, {
        summaryType: input.summaryType,
        content: summary.content,
        metadata: summary.metadata,
      });

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      this.log(`Error generating summary: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async generateMorningSummary(context: AgentContext): Promise<any> {
    const todayMeds = await storage.getTodayMedications(context.user.id);
    const weather = await this.getWeather();
    const baseline = await storage.getRoutineBaseline(context.user.id);

    const systemPrompt = `Generate a warm, encouraging morning briefing. Return JSON:
{
  "greeting": "Personalized morning greeting",
  "todaySchedule": {
    "medications": "Summary of today's medications",
    "mealReminders": "Meal timing reminders based on baseline",
    "activities": "Suggested activities"
  },
  "weatherAdvisory": "Weather-based health advice",
  "motivationalMessage": "Encouraging message to start the day",
  "keyReminders": ["reminder 1", "reminder 2"]
}

User: ${context.user.name}
Medications today: ${todayMeds.length} scheduled
Weather: ${weather.temp}, ${weather.condition}
Usual breakfast time: ${baseline?.breakfastWindowStart || "8:00 AM"}

Tone: Warm, supportive, motivating. Keep it brief and actionable.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate morning briefing" },
    ], {
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const briefing = JSON.parse(response.choices[0].message.content);

    return {
      content: JSON.stringify(briefing),
      metadata: {
        medicationsCount: todayMeds.length,
        weather: weather,
        generatedAt: new Date(),
      },
    };
  }

  private async generateEveningSummary(context: AgentContext): Promise<any> {
    const todayMeds = await storage.getTodayMedications(context.user.id);
    const todayMeals = await storage.getTodayMeals(context.user.id);
    const todaySymptoms = await storage.getTodaySymptoms(context.user.id);
    const todayActivities = await storage.getTodayActivities(context.user.id);

    const medsTaken = todayMeds.filter(m => m.taken).length;
    const adherenceRate = todayMeds.length > 0 ? (medsTaken / todayMeds.length) * 100 : 100;

    const systemPrompt = `Generate a reflective evening summary. Return JSON:
{
  "dayReview": "Overall assessment of the day",
  "achievements": ["positive thing 1", "positive thing 2"],
  "medicationSummary": {
    "taken": number,
    "total": number,
    "message": "Encouraging message about adherence"
  },
  "mealsSummary": "Summary of meals logged",
  "symptomsSummary": "Any symptoms reported",
  "tomorrowPreview": "What to focus on tomorrow",
  "sleepReminder": "Gentle reminder about sleep routine"
}

Today's data:
- Medications: ${medsTaken}/${todayMeds.length} taken (${Math.round(adherenceRate)}%)
- Meals: ${todayMeals.length} logged
- Symptoms: ${todaySymptoms.length} reported
- Activities: ${todayActivities.length} logged

Tone: Reflective, encouraging, non-judgmental. Celebrate wins, gently address misses.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate evening summary" },
    ], {
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(response.choices[0].message.content);

    return {
      content: JSON.stringify(summary),
      metadata: {
        adherenceRate: Math.round(adherenceRate),
        mealsLogged: todayMeals.length,
        symptomsReported: todaySymptoms.length,
        generatedAt: new Date(),
      },
    };
  }

  private async generateWeeklySummary(context: AgentContext): Promise<any> {
    const weekMeds = await storage.getHistoricalMedications(context.user.id, 7);
    const weekMeals = await storage.getHistoricalMeals(context.user.id, 7);
    const weekSymptoms = await storage.getRecentSymptoms(context.user.id, 7);
    const weekActivities = await storage.getHistoricalActivities(context.user.id, 7);

    const medsTaken = weekMeds.filter(m => m.taken).length;
    const adherenceRate = weekMeds.length > 0 ? (medsTaken / weekMeds.length) * 100 : 100;

    // Symptom patterns
    const symptomCounts: Record<string, number> = {};
    weekSymptoms.forEach(s => {
      symptomCounts[s.symptom] = (symptomCounts[s.symptom] || 0) + 1;
    });
    const topSymptom = Object.entries(symptomCounts).sort(([, a], [, b]) => b - a)[0];

    const systemPrompt = `Generate a comprehensive weekly summary. Return JSON:
{
  "weekOverview": "High-level summary of the week",
  "medicationAdherence": {
    "rate": ${Math.round(adherenceRate)},
    "trend": "improving" | "stable" | "declining",
    "message": "Encouraging message"
  },
  "nutritionSummary": {
    "mealsLogged": ${weekMeals.length},
    "consistency": "good" | "fair" | "needs improvement",
    "highlights": ["positive 1", "positive 2"]
  },
  "healthPatterns": {
    "symptoms": "Summary of symptoms",
    "activities": "Activity patterns",
    "concerns": ["concern 1"] or []
  },
  "weeklyScore": 0-100,
  "nextWeekGoals": ["goal 1", "goal 2", "goal 3"],
  "celebrateWins": ["win 1", "win 2"]
}

Weekly data:
- Medications: ${medsTaken}/${weekMeds.length} taken (${Math.round(adherenceRate)}%)
- Meals: ${weekMeals.length} logged
- Symptoms: ${weekSymptoms.length} reported (top: ${topSymptom?.[0] || "none"})
- Activities: ${weekActivities.length} logged

Tone: Comprehensive but digestible. Celebrate progress, identify patterns, set achievable goals.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate weekly summary" },
    ], {
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(response.choices[0].message.content);

    return {
      content: JSON.stringify(summary),
      metadata: {
        adherenceRate: Math.round(adherenceRate),
        mealsLogged: weekMeals.length,
        symptomsReported: weekSymptoms.length,
        topSymptom: topSymptom?.[0],
        generatedAt: new Date(),
      },
    };
  }

  private async generateDoctorVisitSummary(context: AgentContext): Promise<any> {
    const monthMeds = await storage.getHistoricalMedications(context.user.id, 30);
    const monthMeals = await storage.getHistoricalMeals(context.user.id, 30);
    const monthSymptoms = await storage.getRecentSymptoms(context.user.id, 30);
    const medications = await storage.getUserMedications(context.user.id);

    const medsTaken = monthMeds.filter(m => m.taken).length;
    const adherenceRate = monthMeds.length > 0 ? (medsTaken / monthMeds.length) * 100 : 100;

    // Symptom patterns
    const symptomCounts: Record<string, number> = {};
    monthSymptoms.forEach(s => {
      symptomCounts[s.symptom] = (symptomCounts[s.symptom] || 0) + 1;
    });

    const systemPrompt = `Generate a doctor visit preparation summary. Return JSON:
{
  "executiveSummary": "Brief overview for doctor",
  "medicationAdherence": {
    "currentMedications": ["med 1", "med 2"],
    "adherenceRate": ${Math.round(adherenceRate)},
    "missedDoses": "Pattern of missed doses",
    "sideEffects": "Any reported side effects"
  },
  "symptomReport": {
    "recurring": [
      {
        "symptom": "name",
        "frequency": "X times in 30 days",
        "pattern": "timing/trigger pattern",
        "severity": "typical severity"
      }
    ],
    "new": ["new symptom 1"],
    "resolved": ["resolved symptom 1"]
  },
  "lifestyleFactors": {
    "diet": "Diet consistency and quality",
    "activity": "Activity levels",
    "sleep": "Sleep patterns if available"
  },
  "questionsToAsk": [
    "Should medication timing be adjusted?",
    "Is symptom X related to medication Y?",
    "Can we reduce/increase dosage?"
  ],
  "concernsToDiscuss": ["concern 1", "concern 2"]
}

Data (last 30 days):
- Current medications: ${medications.map(m => `${m.name} ${m.dose}`).join(", ")}
- Adherence: ${Math.round(adherenceRate)}%
- Symptoms: ${JSON.stringify(symptomCounts)}
- Meals logged: ${monthMeals.length}

Tone: Professional, factual, organized. Focus on patterns and actionable insights.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate doctor visit summary" },
    ], {
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const summary = JSON.parse(response.choices[0].message.content);

    return {
      content: JSON.stringify(summary),
      metadata: {
        adherenceRate: Math.round(adherenceRate),
        symptomsReported: monthSymptoms.length,
        dataRange: "30 days",
        generatedAt: new Date(),
      },
    };
  }

  private async getWeather(): Promise<any> {
    // Use context agent's real weather API
    const result = await this.contextAgent.execute(
      { action: "get_weather" },
      { user: {} as any, currentTime: new Date() }
    );
    return result.data || {
      temp: "32°C",
      condition: "Clear",
      advisory: "Weather data unavailable",
    };
  }
}
