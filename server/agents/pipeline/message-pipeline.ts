/**
 * MessagePipeline — layered pre-processing before any LLM call.
 *
 * Layer 1: Guardrails      — regex/keyword, <1ms, zero LLM cost
 * Layer 2: Action Detector — regex entity extraction, zero LLM cost
 * Layer 3: RAG Lookup      — vector similarity for known questions
 * Layer 4: LLM Classifier  — only ambiguous messages reach here
 *
 * Each layer returns a PipelineResult. If a layer resolves the message,
 * subsequent layers are skipped entirely.
 */

import type { AgentContext } from "../base-agent";
import type { ParsedIntent } from "../graph/agent-graph";

// ─── Result types ─────────────────────────────────────────────────────────────

export type PipelineResult =
  | { stage: "guardrail";   outcome: "off_topic" | "greeting" | "translation"; targetLanguage?: string }
  | { stage: "action";      outcome: "single_action" | "compound"; intents: ParsedIntent[] }
  | { stage: "rag";         outcome: "answered"; reply: string }
  | { stage: "llm_needed";  outcome: "classify" };

// ─── Layer 1: Guardrails ──────────────────────────────────────────────────────
// Hard rules. Zero LLM. Instant.

const OFF_TOPIC_PATTERNS = [
  // Politics & news
  /\b(election|vote|president|prime minister|parliament|congress|senate|politics|politician)\b/i,
  /\b(news|headline|breaking news|current events)\b/i,
  // Sports scores (not exercise)
  /\b(cricket score|football score|match result|ipl|nfl|nba score|who won the)\b/i,
  // Finance
  /\b(stock price|share price|crypto|bitcoin|invest|mutual fund|nifty|sensex)\b/i,
  // Entertainment
  /\b(movie review|box office|celebrity|actor|actress|bollywood|hollywood gossip)\b/i,
  // General knowledge unrelated to health
  /\b(capital of|population of|history of|who invented|when was .* born)\b/i,
  // Weather (pure forecast, not health-related)
  /\bweather (today|tomorrow|forecast|in \w+)\b/i,
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|hii|helo|heya|howdy|yo)\b/i,
  /^good (morning|afternoon|evening|night)\b/i,
  /^how are you/i,
  /^what'?s up/i,
  /^how'?s it going/i,
  /^namaste|namaskar|sat sri akal|vanakkam/i,
];

const TRANSLATION_PATTERN =
  /(?:translate|say that|repeat that|tell me that)\s+(?:in|to)\s+(\w+)/i;

export function guardrailCheck(text: string): PipelineResult | null {
  const lower = text.toLowerCase().trim();

  // Translation — check before off-topic
  const transMatch = text.match(TRANSLATION_PATTERN);
  if (transMatch)
    return { stage: "guardrail", outcome: "translation", targetLanguage: transMatch[1] };

  // Greeting
  if (GREETING_PATTERNS.some(p => p.test(lower)))
    return { stage: "guardrail", outcome: "greeting" };

  // Off-topic — only deny if a pattern matches AND no health signal present
  const hasOffTopic = OFF_TOPIC_PATTERNS.some(p => p.test(lower));
  const hasHealthSignal = HEALTH_SIGNAL_PATTERN.test(lower);
  if (hasOffTopic && !hasHealthSignal)
    return { stage: "guardrail", outcome: "off_topic" };

  return null;
}

// Health signal — if present, don't deny even if off-topic pattern matched
const HEALTH_SIGNAL_PATTERN =
  /\b(medicine|medication|tablet|pill|dose|symptom|pain|dizzy|sugar|bp|blood|meal|eat|food|exercise|walk|sleep|doctor|hospital|fever|headache|nausea|fatigue|weight|heart|pressure)\b/i;

// ─── Layer 2: Action Detector ─────────────────────────────────────────────────
// Regex-based entity extraction. No LLM. Handles the most common logging patterns.

interface ActionPattern {
  intentType: string;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, text: string) => Record<string, any>;
}

const MEAL_TYPES = "(breakfast|lunch|dinner|snack|brunch|supper)";
const FOOD_WORDS = "([\\w\\s,]+?)";
const TIME_WORDS = "(?:at\\s+[\\d:apm\\s]+|just now|this morning|this evening|tonight)?";

const ACTION_PATTERNS: ActionPattern[] = [
  // ── Meals ──────────────────────────────────────────────────────────────────
  {
    intentType: "meal_logged",
    patterns: [
      new RegExp(`(?:i (?:ate|had|eaten|just ate|just had)|ate|had)\\s+${FOOD_WORDS}\\s+(?:for\\s+)?${MEAL_TYPES}`, "i"),
      new RegExp(`(?:i (?:ate|had|eaten|just ate|just had)|ate|had)\\s+${MEAL_TYPES}\\s*[:-]?\\s*${FOOD_WORDS}`, "i"),
      new RegExp(`(?:i (?:ate|had|eaten|just ate|just had)|ate|had)\\s+${FOOD_WORDS}`, "i"),
      new RegExp(`(?:my|had)\\s+${MEAL_TYPES}\\s+(?:was|is)?\\s*${FOOD_WORDS}`, "i"),
      new RegExp(`(?:logged?|log)\\s+${MEAL_TYPES}`, "i"),
    ],
    extract: (match, text) => {
      const mealTypeMatch = text.match(new RegExp(MEAL_TYPES, "i"));
      const mealType = mealTypeMatch ? mealTypeMatch[1].toLowerCase() : inferMealType();
      // Extract foods — everything that isn't a meal type keyword
      const foods = match[1]?.replace(new RegExp(MEAL_TYPES, "gi"), "").trim() ||
                    match[2]?.trim() || "";
      return { mealType, foods: foods.replace(/^(for|with|and)\s+/i, "").trim() };
    },
  },

  // ── Vitals ─────────────────────────────────────────────────────────────────
  {
    intentType: "vital_logged",
    patterns: [
      // Blood sugar: "sugar is 160", "blood sugar 160 mg/dl", "glucose 140"
      /(?:blood\s+)?(?:sugar|glucose)\s+(?:is|was|=|:)?\s*(\d+\.?\d*)\s*(mg\/dl|mmol\/l)?/i,
      // Blood pressure: "bp 120/80", "blood pressure is 130/85"
      /(?:blood\s+pressure|bp)\s+(?:is|was|=|:)?\s*(\d+\/\d+)\s*(mmhg)?/i,
      // Heart rate: "pulse 72", "heart rate is 80 bpm"
      /(?:heart\s+rate|pulse|hr)\s+(?:is|was|=|:)?\s*(\d+)\s*(bpm)?/i,
      // Weight: "weight 70 kg", "i weigh 65"
      /(?:weight|weigh(?:s|ed)?)\s+(?:is|was|=|:)?\s*(\d+\.?\d*)\s*(kg|lbs?|pounds?)?/i,
      // Temperature: "temp 98.6", "fever 101"
      /(?:temperature|temp|fever)\s+(?:is|was|=|:)?\s*(\d+\.?\d*)\s*(°?[cf]|celsius|fahrenheit)?/i,
      // Oxygen: "spo2 98", "oxygen 96%"
      /(?:spo2|oxygen|o2)\s+(?:is|was|=|:)?\s*(\d+)\s*(%)?/i,
    ],
    extract: (match, text) => {
      const lower = text.toLowerCase();
      let vitalType = "blood_sugar";
      if (/blood\s+pressure|bp\b/.test(lower)) vitalType = "blood_pressure";
      else if (/heart\s+rate|pulse|\bhr\b/.test(lower)) vitalType = "heart_rate";
      else if (/\bweigh|\bweight/.test(lower)) vitalType = "weight";
      else if (/temp|fever/.test(lower)) vitalType = "temperature";
      else if (/spo2|oxygen|o2/.test(lower)) vitalType = "oxygen";
      return { vitalType, value: match[1], unit: match[2] || undefined };
    },
  },

  // ── Medications ────────────────────────────────────────────────────────────
  {
    intentType: "med_taken",
    patterns: [
      /(?:i\s+)?(?:took|taken|had|swallowed|consumed)\s+(?:my\s+)?(?:the\s+)?([\w\s]+?)(?:\s+(?:tablet|pill|capsule|dose|mg|ml)s?)?(?:\s+(?:just now|this morning|at \d+))?$/i,
      /(?:medicine|medication|tablet|pill)\s+(?:taken|done|completed)/i,
    ],
    extract: (match) => ({
      medication: match[1]?.trim().replace(/\s+(tablet|pill|capsule|dose)s?$/i, "") || "unknown",
    }),
  },

  // ── Symptoms ───────────────────────────────────────────────────────────────
  {
    intentType: "symptom_reported",
    patterns: [
      /(?:i\s+(?:am|feel|have|got|feeling|experiencing)|feeling|having)\s+(?:a\s+)?(?:bit\s+|very\s+|really\s+)?(headache|dizziness|dizzy|nausea|nauseous|pain|fatigue|tired|weakness|weak|fever|cough|cold|vomiting|chest\s+pain|shortness\s+of\s+breath|breathless|swelling|rash|itching|anxiety|stress|depression)/i,
      /(?:my\s+)?(head|chest|stomach|back|leg|arm|knee|joint)\s+(?:is\s+)?(?:hurts?|aching|painful|sore|swollen)/i,
    ],
    extract: (match) => {
      const symptom = match[1] || match[0];
      return { symptom: symptom.trim().toLowerCase(), severity: 3 };
    },
  },

  // ── Activities ─────────────────────────────────────────────────────────────
  {
    intentType: "activity_logged",
    patterns: [
      /(?:i\s+)?(?:went\s+for|did|completed|finished|just\s+did)\s+(?:a\s+)?(\d+\s+(?:min|minute|hour)s?\s+)?(?:of\s+)?(walk(?:ing)?|run(?:ning)?|jog(?:ging)?|yoga|exercise|gym|swim(?:ming)?|cycling|stretching|meditation)/i,
      /(?:walked|ran|jogged|exercised|swam|cycled)\s+(?:for\s+)?(\d+\s+(?:min|minute|hour)s?)?/i,
    ],
    extract: (match, text) => {
      const activityMatch = text.match(/(walk(?:ing)?|run(?:ning)?|jog(?:ging)?|yoga|exercise|gym|swim(?:ming)?|cycling|stretching|meditation)/i);
      const durationMatch = text.match(/(\d+)\s*(?:min|minute|hour)s?/i);
      return {
        activity: activityMatch?.[1]?.toLowerCase() || "exercise",
        duration: durationMatch ? parseInt(durationMatch[1]) : undefined,
      };
    },
  },
];

export function actionDetect(text: string): PipelineResult | null {
  const matched: ParsedIntent[] = [];

  for (const ap of ACTION_PATTERNS) {
    for (const pattern of ap.patterns) {
      const match = text.match(pattern);
      if (match) {
        // Avoid duplicate intent types
        if (!matched.find(m => m.type === ap.intentType)) {
          matched.push({
            type: ap.intentType,
            entities: ap.extract(match, text),
            confidence: 0.85, // regex match = high confidence
          });
        }
        break; // first matching pattern wins for this intent type
      }
    }
  }

  if (matched.length === 0) return null;
  if (matched.length === 1) return { stage: "action", outcome: "single_action", intents: matched };
  return { stage: "action", outcome: "compound", intents: matched };
}

// ─── Layer 3: RAG Lookup ──────────────────────────────────────────────────────
// For questions only. If we have a high-similarity memory, answer from it.
// Skips LLM entirely for repeated / similar questions.

const RAG_CONFIDENCE_THRESHOLD = 0.82; // cosine similarity — tune this

export async function ragLookup(
  text: string,
  context: AgentContext,
  ragAgent: any,
): Promise<PipelineResult | null> {
  // Only run for question-shaped messages
  if (!isQuestion(text)) return null;

  try {
    const result = await ragAgent.execute({ query: text, topK: 1 }, context);
    if (!result.success || !result.data?.length) return null;

    const top = result.data[0];
    if (top.similarity >= RAG_CONFIDENCE_THRESHOLD) {
      return {
        stage: "rag",
        outcome: "answered",
        reply: top.content,
      };
    }
  } catch {
    // RAG failure is non-fatal — fall through to LLM
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isQuestion(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return (
    lower.endsWith("?") ||
    /^(what|how|when|why|can|should|is|are|do|does|will|would|could)\b/.test(lower)
  );
}

function inferMealType(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

// ─── Off-topic reply pool ─────────────────────────────────────────────────────

const OFF_TOPIC_REPLIES = [
  "I'm focused on your health — medications, meals, symptoms, and how you're feeling. What can I help you with?",
  "That's outside what I can help with. I'm here for your health and wellness. Ask me about your medications, meals, or how you're doing today.",
  "I'm your health companion, so I stick to health topics. Is there something about your routine, symptoms, or medications I can help with?",
];

export function offTopicReply(): string {
  return OFF_TOPIC_REPLIES[Math.floor(Math.random() * OFF_TOPIC_REPLIES.length)];
}
