import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface RiskAssessment {
  level: "low" | "medium" | "high";
  title: string;
  unusual: string;
  why: string;
  action: string;
  baseline: string;
  triggers: string[];
  shouldAlert: boolean;
  alertCaregiver: boolean;
}

export class RiskGuardAgent extends BaseAgent {
  constructor() {
    super("RiskGuardAgent");
  }

  async execute(input: { contextSnapshot: any }, context: AgentContext): Promise<AgentResponse> {
    this.log("Assessing live situation risk");

    try {
      // Get all relevant context
      const baseline = await storage.getRoutineBaseline(context.user.id);
      const todayMeds = await storage.getTodayMedications(context.user.id);
      const todayMeals = await storage.getTodayMeals(context.user.id);
      const todaySymptoms = await storage.getTodaySymptoms(context.user.id);
      const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 7);
      const weather = input.contextSnapshot.weather;

      // Assess risk
      const assessment = await this.assessRisk({
        baseline,
        todayMeds,
        todayMeals,
        todaySymptoms,
        recentSymptoms,
        weather,
        currentTime: context.currentTime,
      });

      // Store alert if needed
      if (assessment.shouldAlert) {
        await storage.createRiskAlert(context.user.id, {
          level: assessment.level,
          title: assessment.title,
          unusual: assessment.unusual,
          why: assessment.why,
          action: assessment.action,
          baseline: assessment.baseline,
          triggers: assessment.triggers,
        });
      }

      return {
        success: true,
        data: assessment,
      };
    } catch (error: any) {
      this.log(`Error assessing risk: ${error.message}`, "error");
      return {
        success: false,
        message: "Failed to assess risk",
      };
    }
  }

  private async assessRisk(data: any): Promise<RiskAssessment> {
    const triggers: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Critical safety rules (deterministic)
    const criticalRisks = this.checkCriticalRisks(data);
    if (criticalRisks.length > 0) {
      return this.buildCriticalRiskAssessment(criticalRisks);
    }

    // Check medication + food timing
    const medFoodRisk = this.checkMedicationFoodTiming(data);
    if (medFoodRisk) {
      triggers.push(medFoodRisk.trigger);
      riskLevel = this.escalateRisk(riskLevel, medFoodRisk.level);
    }

    // Check symptom patterns
    const symptomRisk = this.checkSymptomPatterns(data);
    if (symptomRisk) {
      triggers.push(symptomRisk.trigger);
      riskLevel = this.escalateRisk(riskLevel, symptomRisk.level);
    }

    // Check weather + medication interactions
    const weatherRisk = this.checkWeatherInteractions(data);
    if (weatherRisk) {
      triggers.push(weatherRisk.trigger);
      riskLevel = this.escalateRisk(riskLevel, weatherRisk.level);
    }

    // If no triggers, return low risk
    if (triggers.length === 0) {
      return {
        level: "low",
        title: "Everything looks good",
        unusual: "No unusual patterns detected",
        why: "Your routine is on track",
        action: "Keep up the good work!",
        baseline: "Following your usual routine",
        triggers: [],
        shouldAlert: false,
        alertCaregiver: false,
      };
    }

    // Generate contextual explanation using LLM
    const explanation = await this.generateRiskExplanation(data, triggers, riskLevel);

    return {
      level: riskLevel,
      ...explanation,
      triggers,
      shouldAlert: riskLevel !== "low",
      alertCaregiver: riskLevel === "high",
    };
  }

  private checkCriticalRisks(data: any): string[] {
    const critical: string[] = [];

    // Multiple high-severity symptoms in short time
    const highSeveritySymptoms = data.todaySymptoms.filter((s: any) => s.severity >= 4);
    if (highSeveritySymptoms.length >= 2) {
      critical.push("Multiple severe symptoms reported today");
    }

    // Missed critical medications
    const criticalMeds = ["insulin", "blood pressure", "heart"];
    const missedCritical = data.todayMeds.filter((m: any) => 
      m.missed && criticalMeds.some(c => m.name.toLowerCase().includes(c))
    );
    if (missedCritical.length > 0) {
      critical.push(`Critical medication missed: ${missedCritical[0].name}`);
    }

    return critical;
  }

  private buildCriticalRiskAssessment(criticalRisks: string[]): RiskAssessment {
    return {
      level: "high",
      title: "Immediate attention needed",
      unusual: criticalRisks.join(". "),
      why: "These patterns indicate a potentially serious situation that requires immediate attention.",
      action: "Please contact your doctor or caregiver immediately. If symptoms worsen, seek emergency care.",
      baseline: "This is significantly different from your normal patterns",
      triggers: criticalRisks,
      shouldAlert: true,
      alertCaregiver: true,
    };
  }

  private checkMedicationFoodTiming(data: any): { trigger: string; level: "medium" | "high" } | null {
    const currentHour = data.currentTime.getHours();
    
    // Check for medications that need food
    const afterFoodMeds = data.todayMeds.filter((m: any) => 
      !m.beforeFood && !m.taken && new Date(m.scheduledTime) <= data.currentTime
    );

    if (afterFoodMeds.length > 0) {
      const lastMeal = data.todayMeals[data.todayMeals.length - 1];
      const lastMealTime = lastMeal ? new Date(lastMeal.loggedAt) : null;
      const hoursSinceLastMeal = lastMealTime 
        ? (data.currentTime - lastMealTime) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceLastMeal > 4) {
        return {
          trigger: `${afterFoodMeds[0].name} should be taken after food, but last meal was ${Math.round(hoursSinceLastMeal)} hours ago`,
          level: "medium",
        };
      }
    }

    return null;
  }

  private checkSymptomPatterns(data: any): { trigger: string; level: "medium" | "high" } | null {
    // Check for recurring symptoms
    const symptomCounts: Record<string, number> = {};
    data.recentSymptoms.forEach((s: any) => {
      symptomCounts[s.symptom] = (symptomCounts[s.symptom] || 0) + 1;
    });

    for (const [symptom, count] of Object.entries(symptomCounts)) {
      if (count >= 3) {
        return {
          trigger: `${symptom} reported ${count} times in the past week`,
          level: "medium",
        };
      }
    }

    return null;
  }

  private checkWeatherInteractions(data: any): { trigger: string; level: "medium" } | null {
    if (!data.weather) return null;

    const temp = data.weather.temp;
    const tempValue = parseInt(temp);

    // High heat + certain medications
    if (tempValue > 30) {
      const heatSensitiveMeds = data.todayMeds.filter((m: any) => 
        ["diuretic", "blood pressure", "beta blocker"].some(type => 
          m.name.toLowerCase().includes(type)
        )
      );

      if (heatSensitiveMeds.length > 0) {
        return {
          trigger: `High temperature (${temp}) may affect ${heatSensitiveMeds[0].name}`,
          level: "medium",
        };
      }
    }

    return null;
  }

  private escalateRisk(current: "low" | "medium" | "high", newLevel: "medium" | "high"): "low" | "medium" | "high" {
    const levels = { low: 0, medium: 1, high: 2 };
    return levels[newLevel] > levels[current] ? newLevel : current;
  }

  private async generateRiskExplanation(data: any, triggers: string[], level: string): Promise<any> {
    const systemPrompt = `You are a health risk assessment agent. Generate a clear, actionable explanation for the user.

Risk level: ${level}
Triggers: ${triggers.join("; ")}

User's baseline: ${JSON.stringify(data.baseline)}
Today's medications: ${data.todayMeds.length} scheduled, ${data.todayMeds.filter((m: any) => m.taken).length} taken
Today's meals: ${data.todayMeals.map((m: any) => m.mealType).join(", ")}

Generate JSON:
{
  "title": "Short, clear title (max 8 words)",
  "unusual": "What's different from their normal routine (1-2 sentences)",
  "why": "Why this matters for their health (1-2 sentences)",
  "action": "Specific, actionable next step (1-2 sentences)",
  "baseline": "What their normal pattern is (1 sentence)"
}

Use simple, supportive language. Be specific and actionable. Don't alarm unnecessarily.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate risk explanation" },
    ], {
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
