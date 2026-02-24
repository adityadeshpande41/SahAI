import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { NLPParserAgent } from "./nlp-parser-agent";
import { AmbiguityHandlerAgent } from "./ambiguity-handler-agent";
import { RoutineTwinAgent } from "./routine-twin-agent";
import { RiskGuardAgent } from "./risk-guard-agent";
import { RAGAgent } from "./rag-agent";
import { MedicationAgent } from "./medication-agent";
import { NutritionAgent } from "./nutrition-agent";
import { SummaryAgent } from "./summary-agent";
import { CaregiverAgent } from "./caregiver-agent";
import { ContextAgent } from "./context-agent";
import { storage } from "../storage";
import type { User } from "@shared/schema";

interface OrchestratorInput {
  userId: string;
  userInput: string;
  conversationId?: string;
}

interface OrchestratorResponse {
  reply: string;
  needsFollowUp: boolean;
  followUpQuestion?: string;
  data?: any;
  actions?: string[]; // What actions were taken
}

export class AgentOrchestrator extends BaseAgent {
  private nlpParser: NLPParserAgent;
  private ambiguityHandler: AmbiguityHandlerAgent;
  private routineTwin: RoutineTwinAgent;
  private riskGuard: RiskGuardAgent;
  private ragAgent: RAGAgent;
  private medicationAgent: MedicationAgent;
  private nutritionAgent: NutritionAgent;
  private summaryAgent: SummaryAgent;
  private caregiverAgent: CaregiverAgent;
  private contextAgent: ContextAgent;

  constructor() {
    super("AgentOrchestrator");
    this.nlpParser = new NLPParserAgent();
    this.ambiguityHandler = new AmbiguityHandlerAgent();
    this.routineTwin = new RoutineTwinAgent();
    this.riskGuard = new RiskGuardAgent();
    this.ragAgent = new RAGAgent();
    this.medicationAgent = new MedicationAgent();
    this.nutritionAgent = new NutritionAgent();
    this.summaryAgent = new SummaryAgent();
    this.caregiverAgent = new CaregiverAgent();
    this.contextAgent = new ContextAgent();
  }

  async execute(input: OrchestratorInput, context: AgentContext): Promise<AgentResponse> {
    this.log(`Orchestrating request for user ${input.userId}`);
    this.log(`User language preference: ${context.user.language || "not set"}`);
    this.log(`User object: ${JSON.stringify(context.user)}`);

    try {
      // Store user message
      await storage.createConversationMessage(input.userId, {
        sender: "user",
        message: input.userInput,
        metadata: {},
      });

      // Get conversation history for context
      const conversationHistory = await storage.getRecentConversation(input.userId, 10);

      // Step 1: Check if this is a translation request
      const translationMatch = input.userInput.match(/translate\s+(?:the\s+)?last\s+message\s+to\s+(\w+)/i);
      if (translationMatch) {
        const targetLanguage = translationMatch[1];
        this.log(`Translation request detected: ${targetLanguage}`);
        
        // Get the last AI message from conversation history
        const lastAIMessage = [...conversationHistory].reverse().find(msg => msg.sender === "sahai");
        
        if (lastAIMessage) {
          // Use LLM to translate
          const translationResult = await this.callOpenAI([
            { 
              role: "system", 
              content: `You are a professional translator. Translate the given text to ${targetLanguage}. 
              
CRITICAL RULES:
- Provide ONLY the translation in ${targetLanguage}
- Do NOT add any explanations, apologies, or meta-commentary
- Do NOT say things like "I can only communicate in English"
- Just translate the text directly and naturally
- Maintain the same tone and meaning as the original` 
            },
            { 
              role: "user", 
              content: `Translate this to ${targetLanguage}:\n\n${lastAIMessage.message}` 
            }
          ], {
            temperature: 0.3,
            max_tokens: 500,
          });

          const translation = translationResult.choices[0].message.content.trim();
          
          await storage.createConversationMessage(input.userId, {
            sender: "sahai",
            message: translation,
            metadata: { isTranslation: true, targetLanguage },
          });
          
          return {
            success: true,
            data: {
              reply: translation,
              needsFollowUp: false,
            },
          };
        } else {
          const noMessageReply = "I don't have a previous message to translate. Please ask me a question first!";
          await storage.createConversationMessage(input.userId, {
            sender: "sahai",
            message: noMessageReply,
            metadata: {},
          });
          
          return {
            success: true,
            data: {
              reply: noMessageReply,
              needsFollowUp: false,
            },
          };
        }
      }

      // Step 2: Check if question is health-related
      const isHealthRelated = await this.checkHealthTopic(input.userInput);
      
      if (!isHealthRelated) {
        const politeDecline = this.getPoliteDecline(context.user.language || undefined);
        await storage.createConversationMessage(input.userId, {
          sender: "sahai",
          message: politeDecline,
          metadata: { offTopic: true },
        });
        
        return {
          success: true,
          data: {
            reply: politeDecline,
            needsFollowUp: false,
          },
        };
      }

      // Step 2: Parse user input with NLP
      const parseResult = await this.nlpParser.execute(
        { text: input.userInput },
        context
      );

      // Always treat as question and use full context - simpler and more reliable
      this.log("Processing as contextual question with user data");
      const response = await this.handleQuestion(
        { type: "question", entities: { question: input.userInput } },
        context,
        []
      );
      
      await storage.createConversationMessage(input.userId, {
        sender: "sahai",
        message: response.reply,
        metadata: {},
      });
      
      // Update routine twin and check risks (async, don't wait)
      this.updateTwinAndCheckRisks(context).catch(err => 
        this.log(`Background twin/risk update failed: ${err.message}`, "error")
      );
      
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      this.log(`Orchestration error: ${error.message}`, "error");
      
      // Fallback response
      const fallbackMessage = this.getFallbackResponse(context.user.language || undefined);
      await storage.createConversationMessage(input.userId, {
        sender: "sahai",
        message: fallbackMessage,
        metadata: { error: true },
      });
      
      return {
        success: true,
        data: {
          reply: fallbackMessage,
          needsFollowUp: false,
        },
      };
    }
  }

  private async checkHealthTopic(userInput: string): Promise<boolean> {
    // Allow translation requests - they should always pass through
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes("translate") && lowerInput.includes("last message")) {
      this.log("Translation request detected - allowing through");
      return true;
    }
    
    // Allow other language-related requests
    if (lowerInput.includes("say that in") ||
        lowerInput.includes("in hindi") ||
        lowerInput.includes("in my language") ||
        lowerInput.includes("repeat")) {
      return true;
    }
    
    // Allow greetings and casual conversation starters - be friendly!
    const greetings = [
      "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
      "how are you", "what's up", "how's it going", "how do you do",
      "greetings", "howdy", "sup", "yo"
    ];
    
    if (greetings.some(greeting => lowerInput.includes(greeting))) {
      this.log("Greeting detected - allowing through for friendly response");
      return true;
    }
    
    try {
      const response = await this.callOpenAI([
        {
          role: "system",
          content: `You are a health topic classifier for a senior health companion app. Determine if the user's message is related to health, wellness, medical topics, or daily living activities.

IMPORTANT: The user may write in ANY language (English, Hindi, Marathi, Tamil, etc.). You must understand and classify messages in all languages.

CRITICAL: Be WELCOMING and CONVERSATIONAL. Greetings, check-ins, and casual conversation are ALWAYS allowed.

Health-related topics include:
- Medications, symptoms, pain, discomfort
- Meals, nutrition, diet, hydration, food (ANY food questions like "can I eat pizza", "should I eat X", "is Y healthy")
- Activities, exercise, mobility, workout
- Sleep, rest, fatigue
- Doctor visits, medical appointments
- General wellbeing, mood, feelings
- Daily routines, habits
- Caregiving, family health concerns
- Questions about what to eat, drink, or do for health
- Food choices and meal planning (e.g., "can I eat pizza", "should I have pasta")
- Greetings and check-ins (e.g., "how are you", "hello", "good morning")
- Casual conversation about their day or wellbeing

CRITICAL: ANY question about eating, food, meals, or nutrition is ALWAYS health-related, even if it's about pizza, burgers, or any other food.
CRITICAL: Greetings and friendly check-ins are ALWAYS allowed - we want to be warm and welcoming!

Non-health topics include:
- Politics, news, current events (unless health-related)
- Sports scores, entertainment (unless asking about exercise)
- Weather (unless related to health impact)
- General knowledge questions unrelated to health
- Technology help (unless health device)
- Financial advice
- Travel planning (unless health-related)

Examples:
- "Hey, how are you?" - YES (friendly greeting)
- "Good morning!" - YES (greeting)
- "Can I eat pizza now?" - YES (food/nutrition)
- "Should I eat pasta for dinner?" - YES (meal planning)
- "What should I eat for protein?" - YES (nutrition)
- "Is it okay to have ice cream?" - YES (food choice)
- "Who won the election?" - NO (politics)
- "What's the capital of France?" - NO (general knowledge)
- "How do I fix my phone?" - NO (technology)

Respond with ONLY "yes" or "no".`
        },
        {
          role: "user",
          content: userInput
        }
      ], {
        temperature: 0.1,
        max_tokens: 10,
      });

      const answer = response.choices[0].message.content.toLowerCase().trim();
      const isHealthRelated = answer.includes("yes");
      this.log(`Health topic check for "${userInput}": ${isHealthRelated ? "YES" : "NO"}`);
      return isHealthRelated;
    } catch (error) {
      // If classification fails, allow the message (fail open)
      this.log(`Health topic check failed: ${error}`, "error");
      return true;
    }
  }

  private getPoliteDecline(language?: string): string {
    // If not English, use the LLM to generate the response in the user's language
    if (language && language !== "English") {
      // For now, return a generic message that will be handled by the main LLM
      // This is a fallback - ideally this shouldn't be called often
      return `I'm here to help with your health and wellness. Let's talk about your medications, meals, or how you're feeling today!`;
    }
    
    const responses = [
      "I'm here to help with your health and wellness. Let's talk about your medications, meals, or how you're feeling today!",
      "I focus on health topics to give you the best support. How about we discuss your routine, symptoms, or nutrition?",
      "That's outside my area of expertise. I'm best at helping with your health, medications, and daily wellness. What can I help you with today?",
      "I'm your health companion, so I focus on wellness topics. Would you like to talk about your meals, medications, or how you're feeling?",
      "Let's keep our conversation focused on your health and wellbeing. Is there anything about your routine, symptoms, or medications I can help with?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getFallbackResponse(language?: string): string {
    // For non-English, return generic message - the main LLM will handle translation
    if (language && language !== "English") {
      return "I'm having a bit of trouble understanding. Could you rephrase that? Or try asking about your medications, meals, or how you're feeling.";
    }
    
    const responses = [
      "I'm having a bit of trouble understanding. Could you rephrase that? Or try asking about your medications, meals, or how you're feeling.",
      "Hmm, I didn't quite catch that. Can you tell me more? I'm here to help with your health and daily routine.",
      "I want to make sure I understand you correctly. Could you say that differently? I can help with medications, symptoms, meals, and more.",
      "Let me make sure I got that right. Could you explain a bit more? I'm here for your health questions and daily check-ins.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private async routeToAgent(intent: any, context: AgentContext): Promise<OrchestratorResponse> {
    const actions: string[] = [];

    switch (intent.type) {
      case "med_taken":
        return await this.handleMedicationTaken(intent, context, actions);
      
      case "meal_logged":
        return await this.handleMealLogged(intent, context, actions);
      
      case "symptom_reported":
        return await this.handleSymptomReported(intent, context, actions);
      
      case "activity_started":
      case "activity_ended":
        return await this.handleActivity(intent, context, actions);
      
      case "question":
        return await this.handleQuestion(intent, context, actions);
      
      default:
        return {
          reply: "I noted that. Is there anything else I can help you with?",
          needsFollowUp: false,
          actions,
        };
    }
  }

  private async handleMedicationTaken(intent: any, context: AgentContext, actions: string[]): Promise<OrchestratorResponse> {
    const medName = intent.entities.medication;
    const time = intent.entities.time || new Date();

    // Find the medication
    const medication = await storage.getMedicationByName(context.user.id, medName);
    if (!medication) {
      return {
        reply: `Hmm, I don't see ${medName} in your medication list. Would you like me to add it? Or maybe you meant a different name?`,
        needsFollowUp: true,
      };
    }

    // Mark as taken
    await storage.markMedicationTaken(context.user.id, medication.id, time);
    actions.push("medication_logged");

    // Check if taken late
    const scheduled = await storage.getTodayMedicationSchedule(context.user.id, medication.id);
    const scheduledTime = scheduled ? new Date(scheduled.scheduledTime) : null;
    const isLate = scheduledTime && (new Date(time).getTime() - scheduledTime.getTime()) > 3600000; // 1 hour

    let reply = `Great! I've logged ${medication.name} ${medication.dose}. `;
    
    if (isLate) {
      reply += `I noticed you took it a bit later than your usual ${medication.timing} time. Everything okay? `;
    } else {
      reply += `Right on schedule! `;
    }

    // Get next medication
    const nextMed = await storage.getNextMedication(context.user.id);
    if (nextMed) {
      reply += `Your next dose is ${nextMed.name} ${nextMed.dose} at ${nextMed.timing}.`;
    } else {
      reply += `You're all caught up with medications for now!`;
    }

    return { reply, needsFollowUp: false, actions };
  }

  private async handleMealLogged(intent: any, context: AgentContext, actions: string[]): Promise<OrchestratorResponse> {
    const mealType = intent.entities.mealType;
    const foods = intent.entities.foods || "";
    const time = intent.entities.time || new Date();

    await storage.createMealLog(context.user.id, {
      mealType,
      foods,
      loggedAt: time,
      hydration: intent.entities.hydration,
    });
    actions.push("meal_logged");

    // Check if late
    const baseline = await storage.getRoutineBaseline(context.user.id);
    const isLate = this.isMealLate(mealType, time, baseline);

    const timeStr = new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    
    let reply = `Perfect! I've logged your ${mealType}`;
    if (foods) {
      reply += ` (${foods})`;
    }
    reply += ` at ${timeStr}. `;

    if (isLate) {
      reply += `That's a bit later than your usual time. Busy day? `;
    }

    // Check for pending after-food medications
    const afterFoodMeds = await storage.getPendingAfterFoodMedications(context.user.id);
    if (afterFoodMeds.length > 0) {
      reply += `Don't forget to take your ${afterFoodMeds[0].name} after eating!`;
    } else {
      reply += `Hope you enjoyed it!`;
    }

    return { reply, needsFollowUp: false, actions };
  }

  private async handleSymptomReported(intent: any, context: AgentContext, actions: string[]): Promise<OrchestratorResponse> {
    const symptom = intent.entities.symptom;
    const severity = intent.entities.severity || 3;
    const notes = intent.entities.notes;

    // Get context snapshot
    const contextSnapshot = await this.captureContext(context);

    await storage.createSymptomLog(context.user.id, {
      symptom,
      severity,
      loggedAt: new Date(),
      notes,
      contextSnapshot,
    });
    actions.push("symptom_logged");

    // Check for patterns
    const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 7);
    const sameSymptomCount = recentSymptoms.filter(s => s.symptom === symptom).length;

    let reply = `I've noted that you're experiencing ${symptom}`;
    if (severity >= 4) {
      reply += ` (severity ${severity}/5). `;
    } else {
      reply += `. `;
    }

    if (sameSymptomCount >= 2) {
      reply += `I've noticed you've reported ${symptom} ${sameSymptomCount} times this week. There might be a pattern here - it usually happens in the afternoon and could be related to your meal timing. `;
    }

    if (severity >= 4) {
      reply += `This sounds uncomfortable. Please sit down and rest. If it gets worse or doesn't improve soon, I can alert your caregiver. Would you like me to do that?`;
    } else {
      reply += `Take it easy and let me know if it gets worse. I'm keeping track of this for you.`;
    }

    return { reply, needsFollowUp: severity >= 4, actions };
  }

  private async handleActivity(intent: any, context: AgentContext, actions: string[]): Promise<OrchestratorResponse> {
    const activity = intent.entities.activity;

    await storage.createActivityLog(context.user.id, {
      activity,
      loggedAt: new Date(),
    });
    actions.push("activity_logged");

    const reply = `Noted! You're ${activity === "resting" ? "resting" : activity}.`;
    return { reply, needsFollowUp: false, actions };
  }

  private async handleQuestion(intent: any, context: AgentContext, actions: string[]): Promise<OrchestratorResponse> {
    try {
      // Get user data
      const todayMeds = await storage.getTodayMedications(context.user.id);
      const todayMeals = await storage.getTodayMeals(context.user.id);
      const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 7);
      const recentActivities = await storage.getRecentActivities(context.user.id, 5);
      const routineBaseline = await storage.getRoutineBaseline(context.user.id);
      
      // Use RAG to find relevant context
      let ragContext = "";
      try {
        const ragResult = await this.ragAgent.execute(
          {
            query: intent.entities.question || intent.entities.text,
            topK: 5,
          },
          context
        );
        ragContext = ragResult.success ? this.ragAgent.buildContext(ragResult.data) : "";
      } catch (ragError: any) {
        this.log(`RAG retrieval failed: ${ragError.message}`, "warn");
      }

      // Build user context summary
      const userProfile = `Name: ${context.user.name || 'User'}, Age Group: ${context.user.ageGroup || 'not specified'}, Language: ${context.user.language || 'English'}`;
      
      const medsContext = todayMeds.length > 0 
        ? todayMeds.map((m: any) => `${m.name} ${m.dose} at ${m.timing} (${m.takenAt ? 'taken' : 'pending'})`).join(', ')
        : 'No medications scheduled today';
      
      const mealsContext = todayMeals.length > 0 
        ? todayMeals.map((m: any) => `${m.mealType} at ${new Date(m.loggedAt).toLocaleTimeString()}`).join(', ')
        : 'No meals logged today';
      
      const symptomsContext = recentSymptoms.length > 0
        ? recentSymptoms.map((s: any) => `${s.symptom} (severity ${s.severity}/5) on ${new Date(s.reportedAt).toLocaleDateString()}`).join(', ')
        : 'No symptoms reported recently';
      
      const activitiesContext = recentActivities.length > 0
        ? recentActivities.map((a: any) => `${a.activity} at ${new Date(a.loggedAt).toLocaleTimeString()}`).join(', ')
        : 'No recent activities logged';

      // Generate answer using LLM
      const userLanguage = context.user.language || "English";
      
      this.log(`User language preference: ${userLanguage}`);
      
      // Build language-specific instruction (generic for all languages)
      let languageInstruction = "";
      if (userLanguage !== "English") {
        languageInstruction = `🚨🚨🚨 CRITICAL LANGUAGE REQUIREMENT 🚨🚨🚨
YOU MUST RESPOND 100% IN ${userLanguage.toUpperCase()}.
ABSOLUTELY NO ENGLISH WORDS. NOT EVEN ONE WORD IN ENGLISH.
DO NOT MATCH THE USER'S INPUT LANGUAGE. ONLY USE ${userLanguage.toUpperCase()}.

The user's preferred language is ${userLanguage}. Every single word in your response must be in ${userLanguage}.
Even if the user asks in a different language, you MUST respond in ${userLanguage}.

Example of WRONG response (DO NOT DO THIS):
"I'm sorry, but I can only respond in ${userLanguage}."
[Responding in the same language as the user's question]

Example of CORRECT response:
[Respond naturally and completely in ${userLanguage} about their health question, regardless of what language they asked in]

REMEMBER: Every single word must be in ${userLanguage}. Ignore the language of the user's question.`;
      } else {
        languageInstruction = `The user's preferred language is English. Always respond in English, even if they ask questions in other languages.`;
      }
      
      const systemPrompt = `You are SahAI, a warm and supportive health companion for seniors.

${languageInstruction}

${userLanguage !== "English" ? `⚠️ LANGUAGE REQUIREMENT: Your entire response must be in ${userLanguage}. Not a single word in English. ⚠️` : ""}

PERSONALITY:
- Warm, friendly, conversational
- Simple, clear language
- Empathetic and encouraging
- Direct and helpful

USER PROFILE:
${userProfile}

USER'S CURRENT DATA:
Medications Today: ${medsContext}
Meals Today: ${mealsContext}
Recent Symptoms (past week): ${symptomsContext}
Recent Activities: ${activitiesContext}
${routineBaseline ? `Usual routine: Wakes around ${routineBaseline.wakeTimeUsual || 'not set'}, sleeps around ${routineBaseline.sleepTimeUsual || 'not set'}` : ''}

${ragContext ? `\nRelevant past conversations:\n${ragContext}` : ''}

INSTRUCTIONS:
- Answer the question directly and helpfully using the user's profile and data
- For nutrition questions (protein, calories, etc.), provide age-appropriate recommendations based on their age group
- For seniors (65+), recommend: 1.0-1.2g protein per kg body weight, moderate exercise, balanced diet
- For middle-aged adults (45-64), recommend: 0.8-1.0g protein per kg body weight, regular exercise
- If specific body weight isn't available, provide general ranges and encourage them to consult their doctor for personalized advice
- Use the user's actual medication, meal, and activity data when relevant
- If data is missing, provide general helpful advice and encourage them to log information
- Be conversational and natural (2-4 sentences typically)
- Always be encouraging and supportive
- Don't make up data - if you don't have specific information, say so and give general guidance

${userLanguage !== "English" ? `\n🚨 FINAL REMINDER: Respond in ${userLanguage} ONLY. Zero English words. 🚨` : ""}`;

      const response = await this.callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: intent.entities.question || intent.entities.text },
      ], {
        temperature: 0.7,
        max_tokens: 400,
      });

      const reply = response.choices[0].message.content;
      return { reply, needsFollowUp: false, actions };
    } catch (error: any) {
      this.log(`Error in handleQuestion: ${error.message}`, "error");
      throw error; // Re-throw to be caught by main execute
    }
  }

  private async updateTwinAndCheckRisks(context: AgentContext): Promise<void> {
    // Update twin state
    await this.routineTwin.execute({ analysisType: "current_state" }, context);

    // Check risks
    const contextSnapshot = await this.captureContext(context);
    await this.riskGuard.execute({ contextSnapshot }, context);
  }

  private async captureContext(context: AgentContext): Promise<any> {
    const result = await this.contextAgent.execute(
      { action: "capture_snapshot" },
      context
    );
    return result.data;
  }

  private async getWeather(): Promise<any> {
    const result = await this.contextAgent.execute(
      { action: "get_weather" },
      { user: {} as any, currentTime: new Date() }
    );
    return result.data;
  }

  private isMealLate(mealType: string, time: Date, baseline: any): boolean {
    if (!baseline) return false;

    const hour = time.getHours();
    const minute = time.getMinutes();
    const totalMinutes = hour * 60 + minute;

    const windowKey = `${mealType}WindowEnd`;
    const windowEnd = baseline[windowKey];
    
    if (!windowEnd) return false;

    const [endHour, endMin] = windowEnd.split(":").map(Number);
    const endMinutes = endHour * 60 + endMin;

    return totalMinutes > endMinutes + 60; // 1 hour late
  }

  private createErrorResponse(message: string): AgentResponse {
    return {
      success: false,
      message,
      data: {
        reply: message,
        needsFollowUp: false,
      },
    };
  }
}
