import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface TwinState {
  state: "routine" | "drift" | "concern";
  score: number; // 0-100
  message: string;
  driftReasons: string[];
}

interface DriftAnalysis {
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
  baseline: string;
  current: string;
}

export class RoutineTwinAgent extends BaseAgent {
  constructor() {
    super("RoutineTwinAgent");
  }

  async execute(input: { analysisType: "current_state" | "update_baseline" }, context: AgentContext): Promise<AgentResponse> {
    this.log(`Analyzing routine twin state for user ${context.user.id}`);

    try {
      if (input.analysisType === "update_baseline") {
        return await this.updateBaseline(context);
      }

      const twinState = await this.analyzeTwinState(context);
      return {
        success: true,
        data: twinState,
      };
    } catch (error: any) {
      this.log(`Error analyzing twin state: ${error.message}`, "error");
      return {
        success: false,
        message: "Failed to analyze routine twin state",
      };
    }
  }

  private async analyzeTwinState(context: AgentContext): Promise<TwinState> {
    // Get baseline
    const baseline = await storage.getRoutineBaseline(context.user.id);
    
    // Get today's data
    const todayMeds = await storage.getTodayMedications(context.user.id);
    const todayMeals = await storage.getTodayMeals(context.user.id);
    const todaySymptoms = await storage.getTodaySymptoms(context.user.id);
    const todayActivities = await storage.getTodayActivities(context.user.id);
    const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 7);

    // Analyze drifts
    const drifts = await this.detectDrifts(
      baseline,
      { meds: todayMeds, meals: todayMeals, symptoms: todaySymptoms, activities: todayActivities },
      context.currentTime
    );

    // Calculate score and state
    const score = this.calculateRoutineScore(drifts);
    const state = this.determineState(score, drifts);
    const message = this.generateStateMessage(drifts);

    return {
      state,
      score,
      message,
      driftReasons: drifts.map(d => d.description),
    };
  }

  private async detectDrifts(
    baseline: any,
    todayData: any,
    currentTime: Date
  ): Promise<DriftAnalysis[]> {
    const drifts: DriftAnalysis[] = [];
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Check meal timing
    if (baseline?.lunchWindowStart && baseline?.lunchWindowEnd) {
      const [lunchStartHour, lunchStartMin] = baseline.lunchWindowStart.split(":").map(Number);
      const [lunchEndHour, lunchEndMin] = baseline.lunchWindowEnd.split(":").map(Number);
      
      const lunchLogged = todayData.meals.some((m: any) => m.mealType === "lunch");
      const currentMinutes = currentHour * 60 + currentMinute;
      const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;

      if (!lunchLogged && currentMinutes > lunchEndMinutes + 60) {
        drifts.push({
          category: "meal_timing",
          severity: "medium",
          description: "Lunch is delayed by more than 1 hour",
          baseline: `Usually between ${baseline.lunchWindowStart} - ${baseline.lunchWindowEnd}`,
          current: "Not logged yet",
        });
      }
    }

    // Check medication adherence
    const medsDue = todayData.meds.filter((m: any) => {
      const scheduledTime = new Date(m.scheduledTime);
      return scheduledTime <= currentTime;
    });
    const medsTaken = medsDue.filter((m: any) => m.taken);
    const adherenceRate = medsDue.length > 0 ? (medsTaken.length / medsDue.length) * 100 : 100;

    if (adherenceRate < 80) {
      drifts.push({
        category: "medication_adherence",
        severity: adherenceRate < 50 ? "high" : "medium",
        description: `${medsDue.length - medsTaken.length} medication(s) not taken on time`,
        baseline: "All medications taken on schedule",
        current: `${Math.round(adherenceRate)}% adherence today`,
      });
    }

    // Check symptom patterns
    const symptomCounts: Record<string, number> = {};
    todayData.symptoms.forEach((s: any) => {
      symptomCounts[s.symptom] = (symptomCounts[s.symptom] || 0) + 1;
    });

    for (const [symptom, count] of Object.entries(symptomCounts)) {
      if (count >= 2) {
        drifts.push({
          category: "symptom_pattern",
          severity: "medium",
          description: `${symptom} reported ${count} times today`,
          baseline: "Occasional symptoms",
          current: `Recurring ${symptom}`,
        });
      }
    }

    return drifts;
  }

  private calculateRoutineScore(drifts: DriftAnalysis[]): number {
    let score = 100;

    for (const drift of drifts) {
      switch (drift.severity) {
        case "high":
          score -= 20;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineState(score: number, drifts: DriftAnalysis[]): "routine" | "drift" | "concern" {
    const hasHighSeverity = drifts.some(d => d.severity === "high");
    
    if (hasHighSeverity || score < 60) {
      return "concern";
    } else if (score < 85) {
      return "drift";
    }
    return "routine";
  }

  private generateStateMessage(drifts: DriftAnalysis[]): string {
    if (drifts.length === 0) {
      return "You're following your usual routine today";
    }

    const topDrift = drifts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })[0];

    return topDrift.description;
  }

  private async updateBaseline(context: AgentContext): Promise<AgentResponse> {
    this.log("Updating routine baseline from historical data");

    // Get last 30 days of data
    const historicalMeals = await storage.getHistoricalMeals(context.user.id, 30);
    const historicalMeds = await storage.getHistoricalMedications(context.user.id, 30);
    const historicalActivities = await storage.getHistoricalActivities(context.user.id, 30);

    // Calculate typical patterns
    const mealWindows = this.calculateMealWindows(historicalMeals);
    const medBehavior = this.calculateMedicationBehavior(historicalMeds);
    const activityPatterns = this.calculateActivityPatterns(historicalActivities);

    // Update baseline
    await storage.updateRoutineBaseline(context.user.id, {
      breakfastWindowStart: mealWindows.breakfast?.start,
      breakfastWindowEnd: mealWindows.breakfast?.end,
      lunchWindowStart: mealWindows.lunch?.start,
      lunchWindowEnd: mealWindows.lunch?.end,
      dinnerWindowStart: mealWindows.dinner?.start,
      dinnerWindowEnd: mealWindows.dinner?.end,
      medicationBehavior: medBehavior,
      activityPatterns: activityPatterns,
    });

    return {
      success: true,
      message: "Baseline updated successfully",
    };
  }

  private calculateMealWindows(meals: any[]): Record<string, { start: string; end: string }> {
    const windows: Record<string, { times: number[] }> = {
      breakfast: { times: [] },
      lunch: { times: [] },
      dinner: { times: [] },
    };

    meals.forEach(meal => {
      const time = new Date(meal.loggedAt);
      const minutes = time.getHours() * 60 + time.getMinutes();
      if (windows[meal.mealType]) {
        windows[meal.mealType].times.push(minutes);
      }
    });

    const result: Record<string, { start: string; end: string }> = {};
    
    for (const [mealType, data] of Object.entries(windows)) {
      if (data.times.length > 0) {
        data.times.sort((a, b) => a - b);
        const median = data.times[Math.floor(data.times.length / 2)];
        const startMinutes = Math.max(0, median - 30);
        const endMinutes = Math.min(1439, median + 30);
        
        result[mealType] = {
          start: this.minutesToTime(startMinutes),
          end: this.minutesToTime(endMinutes),
        };
      }
    }

    return result;
  }

  private calculateMedicationBehavior(meds: any[]): any {
    const total = meds.length;
    const taken = meds.filter(m => m.taken).length;
    const adherenceRate = total > 0 ? (taken / total) * 100 : 100;

    return {
      adherenceRate: Math.round(adherenceRate),
      totalScheduled: total,
      totalTaken: taken,
    };
  }

  private calculateActivityPatterns(activities: any[]): any {
    const patterns: Record<string, number> = {};
    
    activities.forEach(activity => {
      patterns[activity.activity] = (patterns[activity.activity] || 0) + 1;
    });

    return patterns;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  }
}
