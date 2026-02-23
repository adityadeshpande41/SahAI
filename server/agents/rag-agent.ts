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
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(input.query);

      // Retrieve relevant memories
      const memories = await storage.getVectorMemories(
        context.user.id,
        input.memoryTypes
      );

      // Calculate similarities and rank
      const results: RAGResult[] = memories
        .map(memory => ({
          content: memory.content,
          memoryType: memory.memoryType,
          similarity: this.cosineSimilarity(
            queryEmbedding,
            memory.embedding as number[]
          ),
          metadata: memory.metadata,
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.topK || 5);

      return {
        success: true,
        data: results,
        metadata: {
          totalMemories: memories.length,
          retrieved: results.length,
        },
      };
    } catch (error: any) {
      this.log(`Error in RAG retrieval: ${error.message}`, "error");
      return {
        success: false,
        message: "Failed to retrieve memories",
      };
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
