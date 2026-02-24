import type { AgentContext, AgentResponse } from "./base-agent";
import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FutureSelfInput {
  action: "predict_paths";
}

interface PathPrediction {
  currentPath: {
    title: string;
    description: string;
    risks: string[];
    riskLevel: "low" | "medium" | "high";
    timeframe: string;
  };
  betterPath: {
    title: string;
    description: string;
    benefits: string[];
    actions: string[];
  };
  driftFactors: string[];
  urgency: "low" | "medium" | "high";
}

export class FutureSelfAgent {
  name = "FutureSelfAgent";

  async execute(
    input: FutureSelfInput,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      const { user, currentTime } = context;

      // Gather current state data
      const [medications, todayMeds, meals, vitals, symptoms, activities, streaks] = await Promise.all([
        storage.getUserMedications(user.id),
        storage.getTodayMedications(user.id),
        storage.getTodayMeals(user.id),
        storage.getTodayVitals(user.id),
        storage.getRecentSymptoms(user.id, 1),
        storage.getTodayActivities(user.id),
        storage.getUserStreaks(user.id),
      ]);

      // Analyze current state for drift factors
      const driftFactors: string[] = [];
      
      // Check medication adherence
      const missedMeds = todayMeds?.filter(m => !m.takenAt && new Date(m.scheduledTime) < currentTime) || [];
      if (missedMeds.length > 0) {
        driftFactors.push(`${missedMeds.length} medication${missedMeds.length > 1 ? 's' : ''} missed today`);
      }

      // Check meal patterns
      const currentHour = currentTime.getHours();
      const hasBreakfast = meals?.some(m => m.mealType === "breakfast");
      const hasLunch = meals?.some(m => m.mealType === "lunch");
      const hasDinner = meals?.some(m => m.mealType === "dinner");

      if (currentHour >= 10 && !hasBreakfast) {
        driftFactors.push("Breakfast skipped");
      }
      if (currentHour >= 14 && !hasLunch) {
        driftFactors.push("Lunch skipped");
      }
      if (currentHour >= 20 && !hasDinner) {
        driftFactors.push("Dinner not logged yet");
      }

      // Check hydration
      const totalHydration = meals?.reduce((sum, m) => sum + (Number(m.hydration) || 0), 0) || 0;
      if (totalHydration < 6 && currentHour >= 12) {
        driftFactors.push("Low water intake (less than 6 glasses)");
      }

      // Check physical activity
      if (activities?.length === 0 && currentHour >= 14) {
        driftFactors.push("No physical activity logged yet today");
      }

      // Check recent symptoms
      if (symptoms && symptoms.length > 0) {
        const recentSymptom = symptoms[0];
        if (recentSymptom.severity >= 4) {
          driftFactors.push(`Experiencing ${recentSymptom.symptom} (severity ${recentSymptom.severity}/5)`);
        }
      }

      // Check vitals
      const bloodSugar = vitals?.find(v => v.vitalType === "blood_sugar");
      const bloodPressure = vitals?.find(v => v.vitalType === "blood_pressure");
      
      if (bloodSugar && (bloodSugar.value < 70 || bloodSugar.value > 180)) {
        driftFactors.push(`Blood sugar ${bloodSugar.value < 70 ? 'low' : 'high'} (${bloodSugar.value} mg/dL)`);
      }

      // If no drift factors, user is on track
      if (driftFactors.length === 0) {
        return {
          success: true,
          data: {
            currentPath: {
              title: "You're on track! 🎯",
              description: "Your routine is going well. Keep up the great work!",
              risks: [],
              riskLevel: "low",
              timeframe: "next 6-12 hours",
            },
            betterPath: {
              title: "Stay consistent",
              description: "Continue following your routine to maintain your health momentum.",
              benefits: ["Stable energy levels", "Better sleep quality", "Improved well-being"],
              actions: [],
            },
            driftFactors: [],
            urgency: "low",
          },
        };
      }

      // Generate AI prediction based on drift factors
      const missedMedNames = missedMeds.map((m) => {
        const med = medications?.find(med => med.id === m.medicationId);
        return med?.name || "Medication";
      });
      
      const prediction = await this.generatePrediction(
        user.name || "User",
        driftFactors,
        currentHour,
        {
          missedMeds: missedMedNames,
          hasBreakfast,
          hasLunch,
          totalHydration,
          hasActivity: activities && activities.length > 0,
          recentSymptom: symptoms?.[0],
        }
      );

      return {
        success: true,
        data: prediction,
      };
    } catch (error: any) {
      console.error("Future Self prediction error:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async generatePrediction(
    userName: string,
    driftFactors: string[],
    currentHour: number,
    context: any
  ): Promise<PathPrediction> {
    const prompt = `You are a health prediction AI helping elderly users understand the consequences of their current health routine drift.

Current time: ${currentHour}:00
User: ${userName}
Drift factors detected:
${driftFactors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Additional context:
- Missed medications: ${context.missedMeds.join(', ') || 'none'}
- Meals today: ${context.hasBreakfast ? 'breakfast' : ''} ${context.hasLunch ? 'lunch' : ''}
- Water intake: ${context.totalHydration} glasses
- Physical activity: ${context.hasActivity ? 'yes' : 'no'}
${context.recentSymptom ? `- Recent symptom: ${context.recentSymptom.symptom} (severity ${context.recentSymptom.severity}/5)` : ''}

Generate a prediction in JSON format:
{
  "currentPath": {
    "title": "short title (4-6 words) describing the current trajectory",
    "description": "1-2 sentences explaining what will likely happen in next 6-12 hours if they continue",
    "risks": ["specific risk 1", "specific risk 2", "specific risk 3"],
    "riskLevel": "low|medium|high",
    "timeframe": "next 6-12 hours"
  },
  "betterPath": {
    "title": "short positive title (4-6 words)",
    "description": "1-2 sentences showing the better outcome",
    "benefits": ["benefit 1", "benefit 2", "benefit 3"],
    "actions": ["specific action 1", "specific action 2", "specific action 3"]
  },
  "urgency": "low|medium|high"
}

Keep language simple, caring, and non-judgmental. Focus on practical, immediate consequences.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a caring health advisor who helps elderly users understand health consequences through predictive simulations. Be specific, practical, and compassionate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const prediction = JSON.parse(response.choices[0].message.content || "{}");

    return {
      ...prediction,
      driftFactors,
    };
  }
}
