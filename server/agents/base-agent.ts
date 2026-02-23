import type { User } from "@shared/schema";

export interface AgentContext {
  user: User;
  conversationHistory?: any[];
  currentTime: Date;
  timezone?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  message?: string;
  needsFollowUp?: boolean;
  followUpQuestion?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract execute(input: any, context: AgentContext): Promise<AgentResponse>;

  protected log(message: string, level: "info" | "warn" | "error" = "info") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);
  }

  protected async callOpenAI(messages: any[], options: any = {}): Promise<any> {
    // OpenAI integration placeholder
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    return response.json();
  }

  protected async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  protected cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
