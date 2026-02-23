import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface ParsedIntent {
  type: "med_taken" | "med_missed" | "meal_logged" | "symptom_reported" | "activity_started" | "activity_ended" | "location_update" | "question" | "unknown";
  entities: Record<string, any>;
  confidence: number;
  ambiguous: boolean;
  ambiguityReason?: string;
}

export class NLPParserAgent extends BaseAgent {
  constructor() {
    super("NLPParserAgent");
  }

  async execute(input: { text: string }, context: AgentContext): Promise<AgentResponse> {
    this.log(`Parsing user input: "${input.text}"`);

    try {
      // Get user's medication and activity context for better parsing
      const userMeds = await storage.getUserMedications(context.user.id);
      const recentActivities = await storage.getRecentActivities(context.user.id, 5);
      const aliases = await storage.getUserAliases(context.user.id);

      // Build context for LLM
      const systemPrompt = this.buildSystemPrompt(userMeds, aliases);
      const parsed = await this.parseWithLLM(input.text, systemPrompt);

      // Check if we need disambiguation
      if (parsed.ambiguous) {
        return {
          success: true,
          data: parsed,
          needsFollowUp: true,
          followUpQuestion: this.generateFollowUpQuestion(parsed),
          confidence: parsed.confidence,
        };
      }

      return {
        success: true,
        data: parsed,
        confidence: parsed.confidence,
      };
    } catch (error: any) {
      this.log(`Error parsing input: ${error.message}`, "error");
      return {
        success: false,
        message: "Failed to parse input",
        confidence: 0,
      };
    }
  }

  private buildSystemPrompt(medications: any[], aliases: any[]): string {
    const medList = medications.map(m => `${m.name} (${m.dose})`).join(", ");
    const aliasList = aliases.map(a => `"${a.alias}" = ${a.resolvedTo}`).join(", ");

    return `You are a natural language parser for a health tracking app. Parse user input into structured intents.

User's medications: ${medList || "None"}
User's known aliases: ${aliasList || "None"}

Parse the input and return JSON with:
{
  "type": "med_taken" | "med_missed" | "meal_logged" | "symptom_reported" | "activity_started" | "activity_ended" | "location_update" | "question" | "unknown",
  "entities": {
    // Extract relevant entities based on type
    // For med_taken: { "medication": "name", "time": "ISO timestamp or null" }
    // For meal_logged: { "mealType": "breakfast|lunch|dinner|snack", "foods": "description", "time": "ISO timestamp or null" }
    // For symptom_reported: { "symptom": "name", "severity": 1-5, "notes": "optional" }
    // For activity: { "activity": "walking|resting|going out|back home" }
    // For location: { "location": "home|outside|traveling" }
  },
  "confidence": 0.0-1.0,
  "ambiguous": true/false,
  "ambiguityReason": "why it's ambiguous (if applicable)"
}

Examples:
- "I took my meds" → ambiguous if multiple meds, need to ask which one
- "I took Metformin" → clear, med_taken
- "I ate" → ambiguous, need to ask meal or snack
- "I had lunch" → clear, meal_logged
- "I feel dizzy" → symptom_reported
- "Going for a walk" → activity_started

Mark as ambiguous ONLY if it affects safety, correctness, or personalization.`;
  }

  private async parseWithLLM(text: string, systemPrompt: string): Promise<ParsedIntent> {
    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ], {
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed as ParsedIntent;
  }

  private generateFollowUpQuestion(parsed: ParsedIntent): string {
    switch (parsed.type) {
      case "med_taken":
        return "Which medicine did you take?";
      case "meal_logged":
        if (!parsed.entities.mealType) {
          return "Was that a meal or a snack?";
        }
        return "What did you eat?";
      case "symptom_reported":
        if (!parsed.entities.symptom) {
          return "Can you tell me more? Are you feeling dizzy, weak, nauseous, or something else?";
        }
        return "How severe is it, on a scale of 1 to 5?";
      case "activity_started":
        return "What activity are you doing?";
      default:
        return "Can you tell me more about that?";
    }
  }
}
