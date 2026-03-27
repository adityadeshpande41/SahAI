import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

interface RAGQuery {
  query: string;
  memoryTypes?: string[]; // Filter by memory type
  topK?: number; // Number of results to return
}

interface RAGResult {
  content: string;
  memoryType: string;
  similarity: number;
  metadata: any;
}

export class RAGAgent extends BaseAgent {
  constructor() {
    super("RAGAgent");
  }

  async execute(input: RAGQuery, context: AgentContext): Promise<AgentResponse> {
    this.log(`RAG query: "${input.query}"`);

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(input.query);

      // Native pgvector ANN search — single SQL query, uses HNSW index
      // Falls back to JS cosine in MemStorage (dev/test)
      const results = await storage.searchVectorMemories(
        context.user.id,
        queryEmbedding,
        input.topK || 5,
        input.memoryTypes,
      );

      return {
        success: true,
        data: results,
        metadata: { retrieved: results.length },
      };
    } catch (error: any) {
      this.log(`Error in RAG retrieval: ${error.message}`, "error");
      return { success: false, message: "Failed to retrieve memories" };
    }
  }

  // Store new memory
  async storeMemory(
    userId: string,
    memoryType: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    this.log(`Storing memory: ${memoryType}`);

    try {
      const embedding = await this.generateEmbedding(content);
      
      await storage.createVectorMemory(userId, {
        memoryType,
        content,
        embedding,
        metadata,
      });

      this.log(`Memory stored successfully`);
    } catch (error: any) {
      this.log(`Error storing memory: ${error.message}`, "error");
      throw error;
    }
  }

  // Build context from RAG results for LLM
  buildContext(results: RAGResult[]): string {
    if (results.length === 0) {
      return "No relevant context found.";
    }

    return results
      .map((r, i) => `[${i + 1}] ${r.memoryType}: ${r.content}`)
      .join("\n\n");
  }
}
