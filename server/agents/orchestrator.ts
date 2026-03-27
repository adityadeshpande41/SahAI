import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { runAgentGraph, type ParsedIntent } from "./graph/agent-graph";
import {
  guardrailCheck,
  actionDetect,
  ragLookup,
  offTopicReply,
} from "./pipeline/message-pipeline";
import { RAGAgent } from "./rag-agent";
import { RoutineTwinAgent } from "./routine-twin-agent";
import { ContextAgent } from "./context-agent";
import { MedicationAgent } from "./medication-agent";
import { NutritionAgent } from "./nutrition-agent";
import { storage } from "../storage";
import type { User } from "@shared/schema";

interface OrchestratorInput {
  userId: string;
  userInput: string;
}

// ─── Route classification result ─────────────────────────────────────────────
// One LLM call that does BOTH health-check AND intent extraction.
// Returns route so the orchestrator can dispatch without a second call.

type Route =
  | { type: "off_topic" }
  | { type: "greeting" }
  | { type: "translation"; targetLanguage: string }
  | { type: "simple_question" }
  | { type: "single_action"; intent: ParsedIntent }
  | { type: "compound"; intents: ParsedIntent[] };

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export class AgentOrchestrator extends BaseAgent {
  private ragAgent        = new RAGAgent();
  private routineTwin     = new RoutineTwinAgent();
  private contextAgent    = new ContextAgent();
  private medicationAgent = new MedicationAgent();
  private nutritionAgent  = new NutritionAgent();

  constructor() { super("AgentOrchestrator"); }

  async execute(input: OrchestratorInput, context: AgentContext): Promise<AgentResponse> {
    this.log(`Routing: "${input.userInput}"`);

    // Persist user message + fetch ALL context IN PARALLEL — zero sequential overhead
    const [, conversationHistory, userMeds, todayMeds, recentMeals, recentSymptoms, recentVitals] = await Promise.all([
      storage.createConversationMessage(input.userId, {
        sender: "user", message: input.userInput, metadata: {},
      }),
      storage.getRecentConversation(input.userId, 8),
      storage.getUserMedications(input.userId),
      storage.getTodayMedications(input.userId),
      storage.getRecentMeals(input.userId, 1),
      storage.getRecentSymptoms(input.userId, 1),
      storage.getRecentVitals(input.userId, "blood_sugar", 1).catch(() => [] as any[]),
    ]);

    let reply: string;

    try {
      // ── Layer 1: Guardrails (regex, <1ms, zero LLM) ──────────────────────
      const guardrail = guardrailCheck(input.userInput);
      if (guardrail) {
        this.log(`Guardrail hit: ${guardrail.outcome}`);
        switch (guardrail.outcome) {
          case "off_topic":
            reply = offTopicReply();
            break;
          case "greeting":
            reply = await this.handleGreeting(input.userInput, context);
            break;
          case "translation":
            reply = await this.handleTranslation(guardrail.targetLanguage!, conversationHistory);
            break;
        }
        return this.saveAndReturn(input.userId, reply!, context, { stage: "guardrail" });
      }

      // ── Layer 2: Action Detector (regex entity extraction, zero LLM) ─────
      const actionResult = actionDetect(input.userInput);
      if (actionResult && actionResult.stage === "action") {
        this.log(`Action detected via regex: ${actionResult.outcome} — ${actionResult.intents.map(i => i.type).join(", ")}`);
        if (actionResult.outcome === "single_action") {
          reply = await this.dispatchSingleAction(actionResult.intents[0], input.userInput, context);
        } else {
          const graphResult = await runAgentGraph(actionResult.intents, input.userInput, context);
          reply = graphResult.reply;
        }
        return this.saveAndReturn(input.userId, reply, context, { stage: "action" });
      }

      // ── Layer 3: RAG Lookup (vector similarity, no LLM for known questions) ─
      const ragResult = await ragLookup(input.userInput, context, this.ragAgent);
      if (ragResult && ragResult.stage === "rag") {
        this.log(`RAG hit (similarity >= threshold) — answering from memory`);
        return this.saveAndReturn(input.userId, ragResult.reply, context, { stage: "rag" });
      }

      // ── Layer 4: LLM Classifier (only ambiguous messages reach here) ──────
      this.log(`Falling through to LLM classifier`);
      const snapshot = this.buildContextSnapshot(todayMeds, recentMeals, recentSymptoms, recentVitals);
      const route = await this.classify(input.userInput, userMeds, conversationHistory, snapshot);
      this.log(`LLM route: ${route.type}`);

      switch (route.type) {
        case "off_topic":
          reply = offTopicReply();
          break;
        case "greeting":
          reply = await this.handleGreeting(input.userInput, context);
          break;
        case "translation":
          reply = await this.handleTranslation(route.targetLanguage!, conversationHistory);
          break;
        case "simple_question":
          reply = await this.answerQuestion(input.userInput, context, conversationHistory);
          break;
        case "single_action":
          reply = await this.dispatchSingleAction(route.intent, input.userInput, context);
          break;
        case "compound":
          const graphResult = await runAgentGraph(route.intents, input.userInput, context);
          reply = graphResult.reply;
          break;
        default:
          reply = await this.answerQuestion(input.userInput, context, conversationHistory);
      }
    } catch (err: any) {
      this.log(`Orchestration error: ${err.message}`, "error");
      reply = this.fallbackReply(context.user.language);
    }

    return this.saveAndReturn(input.userId, reply!, context, {});
  }

  private async saveAndReturn(
    userId: string,
    reply: string,
    context: AgentContext,
    metadata: Record<string, any>,
  ): Promise<AgentResponse> {
    await storage.createConversationMessage(userId, {
      sender: "sahai", message: reply, metadata,
    });
    this.backgroundJobs(context);
    return { success: true, data: { reply, needsFollowUp: false } };
  }

  // ─── Classifier ─────────────────────────────────────────────────────────────
  // One call. Returns a discriminated union so the switch above is exhaustive.

  private async classify(
    text: string,
    userMeds: any[],
    history: any[],
    snapshot: string,
  ): Promise<Route> {
    const medList = userMeds.map(m => `${m.name} (${m.dose})`).join(", ") || "none";
    const lastAI = [...history].reverse().find(m => m.sender === "sahai")?.message || "";

    const res = await this.callOpenAI([
      {
        role: "system",
        content: `You are a health message router for a senior health app.
Classify the message and return JSON.

User medications: ${medList}
Last AI message: "${lastAI.slice(0, 200)}"
Recent activity snapshot:
${snapshot}

Intent types for actions:
- meal_logged      → entities: { mealType, foods }
- vital_logged     → entities: { vitalType (blood_sugar|blood_pressure|weight|heart_rate|temperature|oxygen), value, unit? }
- med_taken        → entities: { medication, time? }
- symptom_reported → entities: { symptom, severity (1-5) }
- activity_logged  → entities: { activity, duration? }

Return ONE of these shapes:
{ "route": "off_topic" }
{ "route": "greeting" }
{ "route": "translation", "targetLanguage": "Hindi" }
{ "route": "simple_question" }
{ "route": "single_action", "intent": { "type": "...", "entities": {...}, "confidence": 0.9 } }
{ "route": "compound", "intents": [ { "type": "...", "entities": {...}, "confidence": 0.9 }, ... ] }

Rules:
- Use the snapshot to resolve ambiguous references like "same as yesterday", "that one", "it again", "took it late"
- off_topic: politics, sports scores, general knowledge unrelated to health
- greeting: hi, hello, how are you, good morning
- translation: "translate last message to X" or "say that in X"
- simple_question: health question with no logging action
- single_action: exactly one logging action (may also contain a question — that's fine)
- compound: 2+ distinct logging actions in one message
- When in doubt, prefer simple_question over off_topic`,
      },
      { role: "user", content: text },
    ], { temperature: 0.1, max_tokens: 200, response_format: { type: "json_object" } });

    const parsed = JSON.parse(res.choices[0].message.content);
    return this.normalizeRoute(parsed);
  }

  // Builds a compact 4-line context string — cheap to compute, high classifier value
  private buildContextSnapshot(
    todayMeds: any[],
    recentMeals: any[],
    recentSymptoms: any[],
    recentVitals: any[],
  ): string {
    const lines: string[] = [];

    const pendingMeds = todayMeds.filter((m: any) => !m.takenAt);
    if (pendingMeds.length > 0)
      lines.push(`Pending meds: ${pendingMeds.map((m: any) => `${m.name} ${m.dose}`).join(", ")}`);

    const takenMeds = todayMeds.filter((m: any) => m.takenAt);
    if (takenMeds.length > 0)
      lines.push(`Taken today: ${takenMeds.map((m: any) => m.name).join(", ")}`);

    if (recentMeals.length > 0) {
      const m = recentMeals[0];
      const ago = this.timeAgo(new Date(m.loggedAt));
      lines.push(`Last meal: ${m.mealType}${m.foods ? ` - ${m.foods}` : ""} (${ago})`);
    }

    if (recentSymptoms.length > 0) {
      const s = recentSymptoms[0];
      const ago = this.timeAgo(new Date(s.loggedAt));
      lines.push(`Last symptom: ${s.symptom} severity ${s.severity}/5 (${ago})`);
    }

    if (recentVitals.length > 0) {
      const v = recentVitals[0];
      const ago = this.timeAgo(new Date(v.loggedAt));
      lines.push(`Last vital: ${v.vitalType} ${v.value} ${v.unit || ""} (${ago})`);
    }

    return lines.length > 0 ? lines.join("\n") : "No recent activity logged today";
  }

  private timeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private normalizeRoute(raw: any): Route {
    switch (raw.route) {
      case "off_topic":    return { type: "off_topic" };
      case "greeting":     return { type: "greeting" };
      case "translation":  return { type: "translation", targetLanguage: raw.targetLanguage || "English" };
      case "simple_question": return { type: "simple_question" };
      case "single_action":
        if (raw.intent) return { type: "single_action", intent: raw.intent };
        return { type: "simple_question" }; // fallback
      case "compound":
        if (Array.isArray(raw.intents) && raw.intents.length > 1)
          return { type: "compound", intents: raw.intents };
        if (Array.isArray(raw.intents) && raw.intents.length === 1)
          return { type: "single_action", intent: raw.intents[0] };
        return { type: "simple_question" };
      default:
        return { type: "simple_question" };
    }
  }

  // ─── Simple question handler ─────────────────────────────────────────────────

  private async answerQuestion(
    question: string,
    context: AgentContext,
    history: any[],
  ): Promise<string> {
    // ── Medication education intent detection ─────────────────────────────
    // Catches: "tell me about metformin", "what is amlodipine", "explain my BP pill",
    //          "how does insulin work", "side effects of aspirin", "teach me about X"
    const medName = this.extractMedicationEducationIntent(question, context);
    if (medName) {
      this.log(`Medication education intent detected for: ${medName}`);
      return this.explainMedication(medName, question, context);
    }

    // ── Food education intent detection ───────────────────────────────────
    // Catches: "what does spinach contain", "is banana good for diabetics",
    //          "nutrition in brown rice", "how much protein in eggs"
    const foodName = this.extractFoodEducationIntent(question);
    if (foodName) {
      this.log(`Food education intent detected for: ${foodName}`);
      const result = await this.nutritionAgent.execute(
        { action: "explain_food", data: { foodName, question } },
        context,
      );
      if (result.success) return result.data.reply;
    }

    // ── Generic question handler ──────────────────────────────────────────
    const [todayMeds, todayMeals, recentSymptoms, recentActivities, ragResult] = await Promise.all([
      storage.getTodayMedications(context.user.id),
      storage.getTodayMeals(context.user.id),
      storage.getRecentSymptoms(context.user.id, 7),
      storage.getRecentActivities(context.user.id, 5),
      this.ragAgent.execute({ query: question, topK: 3 }, context).catch(() => null),
    ]);

    const ragContext = ragResult?.success ? this.ragAgent.buildContext(ragResult.data) : "";
    const lang = context.user.language || "English";
    const langInstruction = lang !== "English"
      ? `CRITICAL: Respond entirely in ${lang}. Zero English words.`
      : "Respond in English.";

    const res = await this.callOpenAI([
      {
        role: "system",
        content: `You are SahAI, a warm health companion for seniors. ${langInstruction}

User: ${context.user.name}, age group: ${context.user.ageGroup}
Medications today: ${todayMeds.map((m: any) => `${m.name} ${m.dose} (${m.takenAt ? "taken" : "pending"})`).join(", ") || "none"}
Meals today: ${todayMeals.map((m: any) => m.mealType).join(", ") || "none"}
Recent symptoms: ${recentSymptoms.slice(0, 3).map((s: any) => s.symptom).join(", ") || "none"}
${ragContext ? `Relevant history:\n${ragContext}` : ""}

Answer directly and warmly in 2-3 sentences.`,
      },
      // Inject last 6 turns of conversation so the model has thread memory
      ...history.slice(-6).map((m: any) => ({
        role: m.sender === "sahai" ? "assistant" : "user" as "assistant" | "user",
        content: m.message,
      })),
      { role: "user", content: question },
    ], { temperature: 0.7, max_tokens: 300 });

    return res.choices[0].message.content.trim();
  }

  // Detects "tell me about X", "what is X", "explain X", "how does X work",
  // "side effects of X", "teach me about X" where X is a medication name.
  // Returns the medication name if detected, null otherwise.
  private extractMedicationEducationIntent(
    question: string,
    context: AgentContext,
  ): string | null {
    const lower = question.toLowerCase();

    // Education trigger phrases
    const educationTriggers = [
      /(?:tell me about|explain|what is|what are|how does|teach me about|info(?:rmation)? (?:about|on)|learn about|side effects? of|uses? of|purpose of|why (?:do i|am i) taking)\s+(.+)/i,
      /(?:what does|how do i take|when should i take|can i take)\s+(.+?)(?:\s+do|\s+work|\s+help|\?|$)/i,
    ];

    for (const pattern of educationTriggers) {
      const match = question.match(pattern);
      if (match) {
        const candidate = match[1].trim()
          .replace(/\?$/, "")
          .replace(/\s+(tablet|pill|capsule|medicine|medication|drug)s?$/i, "")
          .trim();

        // Check if it matches a known medication name (fuzzy)
        if (candidate.length > 1) return candidate;
      }
    }

    // Also catch "my [medication]" patterns — "explain my metformin"
    const myMedMatch = lower.match(/(?:my|the)\s+([\w\s]+?)(?:\s+medication|\s+pill|\s+tablet|\s+medicine|\?|$)/i);
    if (myMedMatch && educationTriggers.some(p => p.test(lower))) {
      return myMedMatch[1].trim();
    }

    return null;
  }

  // Detects food education questions: "what does X contain", "is X good for diabetics",
  // "nutrition in X", "how much protein in X", "calories in X", "is X healthy"
  private extractFoodEducationIntent(question: string): string | null {
    const foodEducationPatterns = [
      /(?:what(?:'s| is| are)(?: in| does)?\s+|nutrition(?:al)?\s+(?:value|info|content)\s+(?:of|in)\s+|calories?\s+in\s+|protein\s+in\s+|carbs?\s+in\s+|how\s+(?:much|many)\s+\w+\s+(?:is\s+in|does|in)\s+)([\w\s]+?)(?:\s+contain|\s+have|\s+provide|\?|$)/i,
      /(?:is|are)\s+([\w\s]+?)\s+(?:good|bad|healthy|safe|okay|ok)\s+(?:for|to eat)/i,
      /(?:tell me about|explain|what about)\s+([\w\s]+?)\s+(?:nutrition|nutrients|benefits|health benefits)/i,
      /(?:can i eat|should i eat|is it okay to eat)\s+([\w\s]+?)(?:\?|$)/i,
    ];

    // Common food words to validate the match is actually a food
    const FOOD_SIGNALS = /\b(rice|wheat|dal|lentil|spinach|banana|apple|mango|milk|egg|chicken|fish|bread|roti|chapati|oats|quinoa|broccoli|carrot|tomato|potato|sweet potato|avocado|almond|walnut|yogurt|paneer|tofu|beans|chickpea|pasta|sugar|salt|oil|ghee|butter|fruit|vegetable|grain|protein|fiber|vitamin|mineral)\b/i;

    for (const pattern of foodEducationPatterns) {
      const match = question.match(pattern);
      if (match) {
        const candidate = match[1].trim().replace(/\?$/, "").trim();
        // Must be at least 2 chars and either match a known food word or be a short noun phrase
        if (candidate.length >= 2 && (FOOD_SIGNALS.test(candidate) || candidate.split(" ").length <= 3)) {
          return candidate;
        }
      }
    }

    return null;
  }

  // Routes to MedicationAgent.explainMedication, falls back gracefully
  // if the medication isn't in the user's list (unknown med — still explain it)
  private async explainMedication(
    medName: string,
    originalQuestion: string,
    context: AgentContext,
  ): Promise<string> {
    // First try the dedicated MedicationAgent (uses RAG + structured output)
    const result = await this.medicationAgent.execute(
      { action: "explain", data: { medicationName: medName, language: context.user.language || "English" } },
      context,
    );

    if (result.success && result.data?.explanation) {
      const { simplePlain, keyPoints, teachBack } = result.data.explanation;
      let reply = simplePlain;
      if (keyPoints?.length) reply += `\n\nKey points:\n${keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}`;
      if (teachBack) reply += `\n\n${teachBack}`;
      return reply;
    }

    // Medication not in user's list — fall back to general LLM explanation
    // Still better than the generic answerQuestion path because it's focused
    this.log(`${medName} not in user's medication list — using general explanation`);
    const lang = context.user.language || "English";
    const res = await this.callOpenAI([
      {
        role: "system",
        content: `You are a medication educator for a senior health app. Explain medications clearly and simply.
Language: ${lang}. Age group: ${context.user.ageGroup}.
Cover: what it does, how to take it, common side effects, important precautions.
Keep it to 4-5 sentences. No medical jargon.`,
      },
      { role: "user", content: originalQuestion },
    ], { temperature: 0.6, max_tokens: 400 });

    return res.choices[0].message.content.trim();
  }

  // ─── Single action dispatcher ────────────────────────────────────────────────
  // Direct dispatch — no graph, no synthesis overhead.

  private async dispatchSingleAction(
    intent: ParsedIntent,
    originalText: string,
    context: AgentContext,
  ): Promise<string> {
    const { type, entities } = intent;

    switch (type) {
      case "meal_logged":
        return this.logMeal(entities, context);
      case "vital_logged":
        return this.logVital(entities, context);
      case "med_taken":
        return this.logMedication(entities, context);
      case "symptom_reported":
        return this.logSymptom(entities, context);
      case "activity_logged":
        return this.logActivity(entities, context);
      default:
        return this.answerQuestion(originalText, context, []);
    }
  }

  private async logMeal(entities: any, context: AgentContext): Promise<string> {
    const { mealType = "meal", foods = "" } = entities;
    await storage.createMealLog(context.user.id, { mealType, foods, loggedAt: new Date() });

    const afterFoodMeds = await storage.getPendingAfterFoodMedications(context.user.id);
    let reply = `Got it! Logged your ${mealType}${foods ? ` (${foods})` : ""}.`;
    if (afterFoodMeds.length > 0)
      reply += ` Don't forget to take ${afterFoodMeds[0].name} after eating.`;
    return reply;
  }

  private async logVital(entities: any, context: AgentContext): Promise<string> {
    const { vitalType, value, unit } = entities;
    const resolvedUnit = unit || ({ blood_sugar: "mg/dL", blood_pressure: "mmHg", weight: "kg", heart_rate: "bpm" } as any)[vitalType] || "";

    await storage.createHealthVital(context.user.id, {
      vitalType, value: String(value), unit: resolvedUnit, loggedAt: new Date(),
    });

    // Simple threshold check without LLM
    let note = "";
    if (vitalType === "blood_sugar" && parseFloat(value) > 180)
      note = " That's on the higher side — keep an eye on it and stay hydrated.";
    else if (vitalType === "blood_pressure") {
      const systolic = parseInt(String(value).split("/")[0]);
      if (systolic > 140) note = " That's elevated — consider resting and checking again in 30 minutes.";
    }

    return `Logged your ${vitalType.replace("_", " ")}: ${value} ${resolvedUnit}.${note}`;
  }

  private async logMedication(entities: any, context: AgentContext): Promise<string> {
    const { medication } = entities;
    const med = await storage.getMedicationByName(context.user.id, medication);

    if (!med)
      return `I don't see "${medication}" in your list. Want me to add it?`;

    await storage.markMedicationTaken(context.user.id, med.id, new Date());
    const next = await storage.getNextMedication(context.user.id);
    let reply = `Marked ${med.name} ${med.dose} as taken.`;
    if (next) reply += ` Next up: ${next.name} at ${next.timing}.`;
    return reply;
  }

  private async logSymptom(entities: any, context: AgentContext): Promise<string> {
    const { symptom, severity = 3 } = entities;
    await storage.createSymptomLog(context.user.id, { symptom, severity, loggedAt: new Date() });

    const recent = await storage.getRecentSymptoms(context.user.id, 7);
    const count = recent.filter(s => s.symptom === symptom).length;

    let reply = `Noted — logged ${symptom} (severity ${severity}/5).`;
    if (count >= 3) reply += ` This is the ${count}rd time this week. Worth mentioning to your doctor.`;
    else if (severity >= 4) reply += ` That sounds uncomfortable — rest and let me know if it gets worse.`;
    return reply;
  }

  private async logActivity(entities: any, context: AgentContext): Promise<string> {
    const { activity, duration } = entities;
    await storage.createActivityLog(context.user.id, { activity, duration, loggedAt: new Date() });
    return `Great! Logged ${activity}${duration ? ` for ${duration} minutes` : ""}.`;
  }

  // ─── Greeting handler ────────────────────────────────────────────────────────

  private async handleGreeting(text: string, context: AgentContext): Promise<string> {
    const [todayMeds, todayMeals] = await Promise.all([
      storage.getTodayMedications(context.user.id),
      storage.getTodayMeals(context.user.id),
    ]);

    const pendingMeds = todayMeds.filter((m: any) => !m.takenAt);
    const name = context.user.name?.split(" ")[0] || "there";

    let reply = `Hey ${name}! `;
    if (pendingMeds.length > 0)
      reply += `You have ${pendingMeds.length} medication${pendingMeds.length > 1 ? "s" : ""} pending today. `;
    else if (todayMeals.length === 0)
      reply += `You haven't logged any meals yet today. `;
    else
      reply += `You're doing great today! `;
    reply += `How are you feeling?`;
    return reply;
  }

  // ─── Translation handler ─────────────────────────────────────────────────────

  private async handleTranslation(targetLanguage: string, history: any[]): Promise<string> {
    const lastAI = [...history].reverse().find(m => m.sender === "sahai");
    if (!lastAI) return "I don't have a previous message to translate.";

    const res = await this.callOpenAI([
      { role: "system", content: `Translate to ${targetLanguage}. Return ONLY the translation, nothing else.` },
      { role: "user", content: lastAI.message },
    ], { temperature: 0.2, max_tokens: 400 });

    return res.choices[0].message.content.trim();
  }

  // ─── Background jobs (fire and forget) ───────────────────────────────────────

  private backgroundJobs(context: AgentContext): void {
    this.routineTwin.execute({ analysisType: "current_state" }, context)
      .catch(e => this.log(`Twin update failed: ${e.message}`, "error"));
  }

  // ─── Static replies ───────────────────────────────────────────────────────────

  private fallbackReply(lang?: string | null): string {
    return "I had a bit of trouble with that. Could you rephrase? I can help with medications, meals, symptoms, and how you're feeling.";
  }
}
