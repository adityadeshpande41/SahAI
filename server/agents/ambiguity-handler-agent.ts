import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface AmbiguityResolution {
  originalIntent: any;
  followUpAnswer: string;
  resolvedIntent: any;
  shouldCreateAlias: boolean;
  aliasMapping?: { alias: string; resolvedTo: string; entityType: string };
}

export class AmbiguityHandlerAgent extends BaseAgent {
  constructor() {
    super("AmbiguityHandlerAgent");
  }

  async execute(
    input: { originalIntent: any; followUpAnswer: string; conversationContext: any[] },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Resolving ambiguity for intent type: ${input.originalIntent.type}`);

    try {
      const resolution = await this.resolveAmbiguity(
        input.originalIntent,
        input.followUpAnswer,
        input.conversationContext,
        context
      );

      // Learn from this interaction - create alias if appropriate
      if (resolution.shouldCreateAlias && resolution.aliasMapping) {
        await storage.createAlias(context.user.id, resolution.aliasMapping);
        this.log(`Created alias: "${resolution.aliasMapping.alias}" → ${resolution.aliasMapping.resolvedTo}`);
      }

      return {
        success: true,
        data: resolution.resolvedIntent,
        metadata: {
          aliasCreated: resolution.shouldCreateAlias,
        },
      };
    } catch (error: any) {
      this.log(`Error resolving ambiguity: ${error.message}`, "error");
      return {
        success: false,
        message: "Failed to resolve ambiguity",
      };
    }
  }

  private async resolveAmbiguity(
    originalIntent: any,
    followUpAnswer: string,
    conversationContext: any[],
    context: AgentContext
  ): Promise<AmbiguityResolution> {
    const userMeds = await storage.getUserMedications(context.user.id);
    const aliases = await storage.getUserAliases(context.user.id);

    const systemPrompt = `You are an ambiguity resolution agent. The user gave an ambiguous input, we asked a follow-up question, and now we need to resolve it.

Original intent: ${JSON.stringify(originalIntent)}
Follow-up answer: "${followUpAnswer}"

User's medications: ${userMeds.map(m => `${m.name} (${m.dose})`).join(", ")}
Known aliases: ${aliases.map(a => `"${a.alias}" = ${a.resolvedTo}`).join(", ")}

Resolve the ambiguity and return JSON:
{
  "resolvedIntent": {
    "type": "same as original",
    "entities": { /* fully resolved entities */ },
    "confidence": 0.0-1.0
  },
  "shouldCreateAlias": true/false,
  "aliasMapping": {
    "alias": "what user said (e.g., 'it', 'BP med', 'morning one')",
    "resolvedTo": "actual entity name",
    "entityType": "medication|meal|activity"
  }
}

Create an alias if:
1. User used a shorthand that's likely to be reused ("BP med", "morning one", "it")
2. The alias is unambiguous in context
3. It's not a one-time reference

Examples:
- Original: "I took my meds" (ambiguous), Follow-up: "The morning one" → resolve to specific med, create alias
- Original: "I ate" (ambiguous), Follow-up: "Lunch" → resolve to meal_logged with mealType=lunch, no alias needed
- Original: "I took it" (ambiguous), Follow-up: "Metformin" → resolve to med_taken, create alias "it"→"Metformin"`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Resolve this ambiguity` },
    ], {
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const resolution = JSON.parse(response.choices[0].message.content);
    return resolution as AmbiguityResolution;
  }
}
