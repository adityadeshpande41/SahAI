/**
 * LangGraph-style stateful agent graph — compound query handler.
 *
 * Only invoked for compound queries (2+ actionable intents).
 * Domain nodes run in PARALLEL. RiskGuard is CONDITIONAL (skipped if nothing logged).
 * Synthesis produces one unified natural response.
 *
 * Flow:
 *   [MealNode]  ──┐
 *   [VitalNode] ──┤ parallel → [RiskGuardNode?] → [SynthesisNode]
 *   [MedNode]   ──┤
 *   [SymptomNode]─┘
 */

import type { AgentContext } from "../base-agent";
import { BaseAgent } from "../base-agent";
import { storage } from "../../storage";

// ─── Shared graph state ───────────────────────────────────────────────────────

export interface ParsedIntent {
  type: string;
  entities: Record<string, any>;
  confidence: number;
}

export interface NodeResult {
  logged: boolean;
  summary: string;
  data?: any;
}

export interface GraphState {
  input: string;
  context: AgentContext;
  intents: ParsedIntent[];
  nodeResults: Record<string, NodeResult>;
  riskAssessment?: { level: "low" | "medium" | "high"; flags: string[]; advice: string };
  finalReply?: string;
}

// ─── Abstract graph node ──────────────────────────────────────────────────────

abstract class GraphNode extends BaseAgent {
  // GraphNodes don't use the BaseAgent execute signature — they use run()
  async execute(_input: any, _context: AgentContext) { return { success: true }; }
  abstract run(state: GraphState): Promise<Partial<GraphState>>;
}

// ─── Domain nodes (run in parallel) ──────────────────────────────────────────

class MealNode extends GraphNode {
  constructor() { super("MealNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const intent = state.intents.find(i => i.type === "meal_logged");
    if (!intent) return {};

    const { mealType = "meal", foods = "" } = intent.entities;

    // Estimate nutrition inline — small focused call
    const nutritionRes = await this.callOpenAI([
      {
        role: "system",
        content: `Estimate nutrition. Return JSON only: { "calories": number, "carbs": number, "protein": number, "fat": number, "glycemicLoad": "low|medium|high" }`,
      },
      { role: "user", content: `${mealType}: ${foods}` },
    ], { temperature: 0.1, max_tokens: 80, response_format: { type: "json_object" } });

    const nutrition = JSON.parse(nutritionRes.choices[0].message.content);

    await storage.createMealLog(state.context.user.id, {
      mealType, foods, loggedAt: new Date(), nutritionData: nutrition,
    });

    return {
      nodeResults: {
        ...state.nodeResults,
        meal_logged: {
          logged: true,
          summary: `Logged ${mealType}: ${foods} (~${nutrition.calories} cal, glycemic load: ${nutrition.glycemicLoad})`,
          data: { mealType, foods, nutrition },
        },
      },
    };
  }
}

class VitalNode extends GraphNode {
  constructor() { super("VitalNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const intent = state.intents.find(i => i.type === "vital_logged");
    if (!intent) return {};

    const { vitalType, value, unit } = intent.entities;
    const resolvedUnit = unit || this.defaultUnit(vitalType);

    await storage.createHealthVital(state.context.user.id, {
      vitalType, value: String(value), unit: resolvedUnit, loggedAt: new Date(),
    });

    const recent = await storage.getRecentVitals(state.context.user.id, vitalType, 3);
    const trend = this.trend(recent, parseFloat(value));

    return {
      nodeResults: {
        ...state.nodeResults,
        vital_logged: {
          logged: true,
          summary: `Logged ${vitalType}: ${value} ${resolvedUnit} (trend: ${trend})`,
          data: { vitalType, value: parseFloat(value), unit: resolvedUnit, trend },
        },
      },
    };
  }

  private defaultUnit(t: string) {
    return ({ blood_sugar: "mg/dL", blood_pressure: "mmHg", weight: "kg", heart_rate: "bpm", temperature: "°C", oxygen: "%" } as any)[t] || "";
  }

  private trend(recent: any[], current: number): string {
    if (recent.length < 2) return "first reading";
    const prev = parseFloat(recent[1]?.value);
    if (isNaN(prev)) return "unknown";
    const d = current - prev;
    return Math.abs(d) < 5 ? "stable" : d > 0 ? "rising" : "falling";
  }
}

class MedicationNode extends GraphNode {
  constructor() { super("MedicationNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const intent = state.intents.find(i => i.type === "med_taken");
    if (!intent) return {};

    const { medication } = intent.entities;
    const med = await storage.getMedicationByName(state.context.user.id, medication);
    if (med) await storage.markMedicationTaken(state.context.user.id, med.id, new Date());

    return {
      nodeResults: {
        ...state.nodeResults,
        med_taken: {
          logged: !!med,
          summary: med ? `Marked ${med.name} ${med.dose} as taken` : `"${medication}" not found in medication list`,
          data: { medication, found: !!med, med },
        },
      },
    };
  }
}

class SymptomNode extends GraphNode {
  constructor() { super("SymptomNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const intent = state.intents.find(i => i.type === "symptom_reported");
    if (!intent) return {};

    const { symptom, severity = 3 } = intent.entities;
    await storage.createSymptomLog(state.context.user.id, { symptom, severity, loggedAt: new Date() });

    return {
      nodeResults: {
        ...state.nodeResults,
        symptom_reported: {
          logged: true,
          summary: `Logged symptom: ${symptom} (severity ${severity}/5)`,
          data: { symptom, severity },
        },
      },
    };
  }
}

// ─── Risk guard node (conditional — only runs when something was logged) ──────

class RiskGuardNode extends GraphNode {
  constructor() { super("RiskGuardNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const logged = Object.values(state.nodeResults).filter(r => r.logged);
    if (logged.length === 0) return {};

    const flags: string[] = [];

    // Deterministic cross-domain rules (zero LLM cost)
    const meal = state.nodeResults["meal_logged"]?.data;
    const vital = state.nodeResults["vital_logged"]?.data;
    const symptom = state.nodeResults["symptom_reported"]?.data;
    const med = state.nodeResults["med_taken"]?.data;

    if (meal && vital?.vitalType === "blood_sugar") {
      const sugar = vital.value;
      if (sugar > 180) flags.push(`Blood sugar ${sugar} mg/dL is significantly elevated`);
      else if (sugar > 140 && meal.nutrition?.glycemicLoad === "high")
        flags.push(`High glycemic meal (${meal.foods}) with elevated blood sugar (${sugar} mg/dL) — monitor closely`);
    }

    if (vital?.vitalType === "blood_pressure" && symptom) {
      const systolic = parseInt(String(vital.value).split("/")[0]);
      if (systolic > 140 && ["headache", "dizziness", "chest pain"].some(s => symptom.symptom?.toLowerCase().includes(s)))
        flags.push(`High BP (${vital.value}) with ${symptom.symptom} — consider contacting your doctor`);
    }

    if (med && symptom && !med.found)
      flags.push(`Unrecognized medication "${med.medication}" reported alongside symptom`);

    // Only call LLM if deterministic rules didn't already catch a high-risk pattern
    let level: "low" | "medium" | "high" = flags.length > 0 ? "medium" : "low";
    let advice = flags.length > 0 ? flags[0] : "Everything looks okay. Keep it up!";

    if (flags.length === 0 && logged.length > 1) {
      // LLM for nuanced cross-domain reasoning only when needed
      const res = await this.callOpenAI([
        {
          role: "system",
          content: `Health risk assessor. Given logged data, identify cross-domain risks. Be concise.
Return JSON: { "level": "low|medium|high", "flags": ["..."], "advice": "1 sentence" }`,
        },
        {
          role: "user",
          content: logged.map(r => r.summary).join("\n"),
        },
      ], { temperature: 0.2, max_tokens: 150, response_format: { type: "json_object" } });

      const llm = JSON.parse(res.choices[0].message.content);
      level = llm.level || "low";
      advice = llm.advice || advice;
      if (llm.flags?.length) flags.push(...llm.flags);
    }

    return { riskAssessment: { level, flags, advice } };
  }
}

// ─── Synthesis node ───────────────────────────────────────────────────────────

class SynthesisNode extends GraphNode {
  constructor() { super("SynthesisNode"); }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    const loggedSummaries = Object.values(state.nodeResults)
      .filter(r => r.logged).map(r => r.summary);

    const questionIntent = state.intents.find(i => i.type === "question");
    const risk = state.riskAssessment;
    const lang = state.context.user.language || "English";

    const res = await this.callOpenAI([
      {
        role: "system",
        content: `You are SahAI, a warm health companion. Write a single natural response that:
1. Briefly confirms what was logged
2. Answers any question asked
3. Includes risk advice only if level is medium or high
Keep it to 2-4 sentences. Language: ${lang}.`,
      },
      {
        role: "user",
        content: `Message: "${state.input}"
Logged: ${loggedSummaries.join("; ")}
Question: ${questionIntent?.entities?.question || "none"}
Risk: ${risk?.level || "low"} — ${risk?.advice || "none"}`,
      },
    ], { temperature: 0.7, max_tokens: 200 });

    return { finalReply: res.choices[0].message.content.trim() };
  }
}

// ─── Singleton nodes ──────────────────────────────────────────────────────────

const DOMAIN_NODES: Record<string, GraphNode> = {
  meal_logged:      new MealNode(),
  vital_logged:     new VitalNode(),
  med_taken:        new MedicationNode(),
  symptom_reported: new SymptomNode(),
};

const riskGuard  = new RiskGuardNode();
const synthesis  = new SynthesisNode();

// ─── Public graph runner ──────────────────────────────────────────────────────

export async function runAgentGraph(
  intents: ParsedIntent[],
  input: string,
  context: AgentContext,
): Promise<{ reply: string; riskLevel: string }> {
  let state: GraphState = { input, context, intents, nodeResults: {} };

  // Fan out to all matching domain nodes IN PARALLEL
  const domainTypes = intents.map(i => i.type).filter(t => t in DOMAIN_NODES);

  const results = await Promise.allSettled(
    domainTypes.map(type => DOMAIN_NODES[type].run(state))
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.nodeResults) {
      state = { ...state, nodeResults: { ...state.nodeResults, ...r.value.nodeResults } };
    }
  }

  // Conditional risk guard
  state = { ...state, ...(await riskGuard.run(state)) };

  // Synthesize
  state = { ...state, ...(await synthesis.run(state)) };

  return {
    reply: state.finalReply || "Got it, I've logged everything for you.",
    riskLevel: state.riskAssessment?.level || "low",
  };
}
