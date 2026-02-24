// Rate limiter to prevent AI misuse and overuse
interface RateLimitEntry {
  count: number;
  resetAt: Date;
  lastRequest: Date;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  // Configuration
  private readonly MAX_REQUESTS_PER_HOUR = 30; // Max 30 AI requests per hour
  private readonly MAX_REQUESTS_PER_DAY = 100; // Max 100 AI requests per day
  private readonly COOLDOWN_MS = 3000; // 3 seconds between requests
  
  /**
   * Check if a user can make an AI request
   * @param userId - User ID
   * @param endpoint - API endpoint being called
   * @returns { allowed: boolean, reason?: string, retryAfter?: number }
   */
  checkLimit(userId: string, endpoint: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const key = `${userId}:${endpoint}`;
    const now = new Date();
    
    // Get or create entry
    let entry = this.limits.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        lastRequest: new Date(0),
      };
      this.limits.set(key, entry);
    }
    
    // Check cooldown period (prevent rapid-fire requests)
    const timeSinceLastRequest = now.getTime() - entry.lastRequest.getTime();
    if (timeSinceLastRequest < this.COOLDOWN_MS) {
      const retryAfter = Math.ceil((this.COOLDOWN_MS - timeSinceLastRequest) / 1000);
      return {
        allowed: false,
        reason: `Please wait ${retryAfter} seconds before making another AI request`,
        retryAfter,
      };
    }
    
    // Reset counter if time window has passed
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    }
    
    // Check hourly limit
    if (entry.count >= this.MAX_REQUESTS_PER_HOUR) {
      const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `AI request limit reached. You can make ${this.MAX_REQUESTS_PER_HOUR} requests per hour. Please try again later.`,
        retryAfter,
      };
    }
    
    // Check daily limit (using a separate key)
    const dailyKey = `${userId}:daily`;
    let dailyEntry = this.limits.get(dailyKey);
    
    if (!dailyEntry) {
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      dailyEntry = {
        count: 0,
        resetAt: tomorrow,
        lastRequest: new Date(0),
      };
      this.limits.set(dailyKey, dailyEntry);
    }
    
    if (now > dailyEntry.resetAt) {
      dailyEntry.count = 0;
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      dailyEntry.resetAt = tomorrow;
    }
    
    if (dailyEntry.count >= this.MAX_REQUESTS_PER_DAY) {
      const retryAfter = Math.ceil((dailyEntry.resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Daily AI request limit reached (${this.MAX_REQUESTS_PER_DAY} requests per day). Please try again tomorrow.`,
        retryAfter,
      };
    }
    
    // All checks passed - increment counters
    entry.count++;
    entry.lastRequest = now;
    dailyEntry.count++;
    dailyEntry.lastRequest = now;
    
    return { allowed: true };
  }
  
  /**
   * Get remaining requests for a user
   */
  getRemainingRequests(userId: string, endpoint: string): { hourly: number; daily: number } {
    const key = `${userId}:${endpoint}`;
    const dailyKey = `${userId}:daily`;
    
    const entry = this.limits.get(key);
    const dailyEntry = this.limits.get(dailyKey);
    
    return {
      hourly: this.MAX_REQUESTS_PER_HOUR - (entry?.count || 0),
      daily: this.MAX_REQUESTS_PER_DAY - (dailyEntry?.count || 0),
    };
  }
  
  /**
   * Clean up old entries (run periodically)
   */
  cleanup() {
    const now = new Date();
    const entries = Array.from(this.limits.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetAt && entry.count === 0) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Clean up every hour
setInterval(() => rateLimiter.cleanup(), 60 * 60 * 1000);
