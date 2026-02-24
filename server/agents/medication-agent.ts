import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";
import { RAGAgent } from "./rag-agent";

export class MedicationAgent extends BaseAgent {
  private ragAgent: RAGAgent;

  constructor() {
    super("MedicationAgent");
    this.ragAgent = new RAGAgent();
  }

  private async createScheduleEntry(userId: string, medication: any): Promise<void> {
    try {
      // Parse the timing to create a schedule entry for today
      const today = new Date();
      const timingParts = medication.timing.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      
      if (!timingParts) {
        this.log(`Could not parse timing: ${medication.timing}`, "warn");
        // Create a default schedule entry for 9 AM if timing can't be parsed
        const scheduledTime = new Date(today);
        scheduledTime.setHours(9, 0, 0, 0);
        
        await storage.createMedicationSchedule(userId, {
          medicationId: medication.id,
          scheduledTime,
          taken: false,
          snoozed: false,
          missed: false,
        });
        return;
      }
      
      let hours = parseInt(timingParts[1]);
      const minutes = parseInt(timingParts[2]);
      const meridiem = timingParts[3]?.toUpperCase();
      
      // Convert to 24-hour format
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      this.log(`Creating schedule entry for ${medication.name} at ${scheduledTime}`);
      
      // Create schedule entry
      await storage.createMedicationSchedule(userId, {
        medicationId: medication.id,
        scheduledTime,
        taken: false,
        snoozed: false,
        missed: false,
      });
      
      this.log(`Schedule entry created successfully for ${medication.name}`);
    } catch (error: any) {
      this.log(`Error creating schedule entry: ${error.message}`, "error");
      throw error;
    }
  }

  async execute(
    input: { 
      action: "explain" | "check_interactions" | "adherence_summary" | "extract_prescription";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Medication action: ${input.action}`);

    try {
      switch (input.action) {
        case "explain":
          return await this.explainMedication(input.data, context);
        case "check_interactions":
          return await this.checkInteractions(context);
        case "adherence_summary":
          return await this.getAdherenceSummary(context);
        case "extract_prescription":
          return await this.extractPrescription(input.data, context);
        default:
          return { success: false, message: "Unknown action" };
      }
    } catch (error: any) {
      this.log(`Error in medication agent: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async explainMedication(
    data: { medicationName: string; language?: string },
    context: AgentContext
  ): Promise<AgentResponse> {
    // Get medication info from RAG
    const ragResults = await this.ragAgent.execute(
      {
        query: `medication information for ${data.medicationName}`,
        memoryTypes: ["medication_info"],
        topK: 3,
      },
      context
    );

    const medication = await storage.getMedicationByName(
      context.user.id,
      data.medicationName
    );

    if (!medication) {
      return {
        success: false,
        message: "Medication not found",
      };
    }

    // Generate explanation using LLM + RAG context
    const ragContext = ragResults.success && ragResults.data 
      ? this.ragAgent.buildContext(ragResults.data)
      : "";

    const systemPrompt = `You are a medication explanation agent. Explain medications in simple, accessible language.

User preferences:
- Language: ${data.language || context.user.language || "English"}
- Age group: ${context.user.ageGroup}

Medication: ${medication.name} (${medication.dose})
Timing: ${medication.timing}
Before/After food: ${medication.beforeFood ? "Before" : "After"}

${ragContext ? `Additional context:\n${ragContext}` : ""}

Generate JSON:
{
  "simplePlain": "Simple explanation in plain language (2-3 sentences)",
  "translatedPlain": "Translation in user's preferred language if not English",
  "teachBack": "A teach-back question to verify understanding",
  "keyPoints": ["Important point 1", "Important point 2", "Important point 3"]
}

Focus on:
1. What the medicine does
2. When and how to take it
3. Important precautions (food, timing)
4. Common side effects to watch for

Use simple words. Avoid medical jargon.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Explain ${medication.name}` },
    ], {
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const explanation = JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      data: {
        medication,
        explanation,
      },
    };
  }

  private async checkInteractions(context: AgentContext): Promise<AgentResponse> {
    const medications = await storage.getUserMedications(context.user.id);
    const recentMeals = await storage.getRecentMeals(context.user.id, 3);
    const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 7);

    // Check for potential interactions using LLM
    const systemPrompt = `You are a medication interaction checker. Analyze potential interactions.

Current medications: ${medications.map(m => `${m.name} (${m.dose})`).join(", ")}
Recent meals: ${recentMeals.map(m => m.foods).join("; ")}
Recent symptoms: ${recentSymptoms.map(s => s.symptom).join(", ")}

Identify potential interactions and return JSON:
{
  "interactions": [
    {
      "type": "drug-drug" | "drug-food" | "drug-symptom",
      "severity": "low" | "medium" | "high",
      "description": "Clear description of the interaction",
      "recommendation": "What to do about it"
    }
  ],
  "overallRisk": "low" | "medium" | "high"
}

Only flag clinically significant interactions. Be conservative but not alarmist.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Check for interactions" },
    ], {
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const interactions = JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      data: interactions,
    };
  }

  private async getAdherenceSummary(context: AgentContext): Promise<AgentResponse> {
    const last7Days = await storage.getHistoricalMedications(context.user.id, 7);
    const last30Days = await storage.getHistoricalMedications(context.user.id, 30);

    const calculate = (meds: any[]) => {
      const total = meds.length;
      const taken = meds.filter(m => m.taken).length;
      const missed = meds.filter(m => m.missed).length;
      const rate = total > 0 ? (taken / total) * 100 : 100;
      return { total, taken, missed, rate: Math.round(rate) };
    };

    const week = calculate(last7Days);
    const month = calculate(last30Days);

    // Identify patterns
    const missedByMed: Record<string, number> = {};
    last30Days.filter(m => m.missed).forEach(m => {
      const key = m.medication?.name || "Unknown";
      missedByMed[key] = (missedByMed[key] || 0) + 1;
    });

    const mostMissed = Object.entries(missedByMed)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      success: true,
      data: {
        week,
        month,
        mostMissed,
        trend: week.rate >= month.rate ? "improving" : "declining",
      },
    };
  }

  private async extractPrescription(
    data: { imageUrl: string },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Extracting prescription from image: ${data.imageUrl}`);

    // Use OpenAI Vision API to extract prescription data
    const response = await this.callOpenAI([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract medication information from this prescription image. Return JSON:
{
  "medications": [
    {
      "name": "medication name",
      "dose": "dosage with unit",
      "frequency": "how often",
      "timing": "when to take (e.g., 8:00 AM)",
      "beforeFood": true/false,
      "duration": "how long to take",
      "instructions": "additional instructions"
    }
  ],
  "confidence": 0.0-1.0,
  "warnings": ["any warnings or unclear parts"]
}`,
          },
          {
            type: "image_url",
            image_url: { url: data.imageUrl },
          },
        ],
      },
    ], {
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const extracted = JSON.parse(response.choices[0].message.content);

    // Store extracted medications
    for (const med of extracted.medications) {
      // Ensure all required fields have values
      const medicationData = {
        name: med.name || "Unknown Medication",
        dose: med.dose || med.dosage || "As prescribed",
        frequency: med.frequency || "As directed",
        timing: med.timing || "9:00 AM", // Default timing if not specified
        beforeFood: med.beforeFood ?? false,
        prescriptionImageUrl: data.imageUrl,
        extractionConfidence: extracted.confidence,
        active: true,
      };

      const medication = await storage.createMedication(context.user.id, medicationData);

      // Create today's schedule entry for this medication
      await this.createScheduleEntry(context.user.id, medication);

      // Store in RAG for future reference
      await this.ragAgent.storeMemory(
        context.user.id,
        "medication_info",
        `${medication.name} (${medication.dose}): ${med.instructions || 'No additional instructions'}`,
        { source: "prescription", imageUrl: data.imageUrl }
      );
    }

    return {
      success: true,
      data: extracted,
    };
  }

  async getMedicationInsights(
    medicationName: string,
    context: AgentContext
  ): Promise<{ insights: string; tips: string[]; timing: string }> {
    const systemPrompt = `You are a medication expert helping elderly users understand their medications better. Provide clear, simple insights about:
1. What the medication does
2. Best practices for taking it
3. Simple tips to remember and optimize effectiveness

Be encouraging and use simple language.`;

    const userPrompt = `Medication: ${medicationName}

Provide helpful insights in JSON format:
{
  "insights": "2-3 sentences explaining what this medication does and why it's important",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "timing": "best time of day to take this medication and why"
}

Keep it simple and practical for elderly users.`;

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
