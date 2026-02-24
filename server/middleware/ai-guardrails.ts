import type { Request, Response, NextFunction } from "express";
import { rateLimiter } from "../lib/rate-limiter";

/**
 * Middleware to enforce AI usage guardrails
 * Prevents misuse and overuse of AI features
 */
export function aiGuardrails(req: Request, res: Response, next: NextFunction) {
  // Get user ID from request (assuming it's set by auth middleware)
  const userId = (req as any).userId || req.headers["x-user-id"] as string;
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Unauthorized",
      message: "User authentication required for AI features"
    });
  }
  
  // Get endpoint path
  const endpoint = req.path;
  
  // Check rate limit
  const limitCheck = rateLimiter.checkLimit(userId, endpoint);
  
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: limitCheck.reason,
      retryAfter: limitCheck.retryAfter,
    });
  }
  
  // Get remaining requests
  const remaining = rateLimiter.getRemainingRequests(userId, endpoint);
  
  // Add rate limit info to response headers
  res.setHeader("X-RateLimit-Remaining-Hourly", remaining.hourly.toString());
  res.setHeader("X-RateLimit-Remaining-Daily", remaining.daily.toString());
  
  // Log AI usage for monitoring
  console.log(`[AI Guardrails] User ${userId} - ${endpoint} - Remaining: ${remaining.hourly}/hour, ${remaining.daily}/day`);
  
  next();
}

/**
 * Content filter to prevent inappropriate requests
 */
export function contentFilter(content: string): { safe: boolean; reason?: string } {
  const lowerContent = content.toLowerCase();
  
  // Block inappropriate content
  const blockedPatterns = [
    /\b(hack|exploit|bypass|jailbreak)\b/i,
    /\b(illegal|drug|weapon)\b/i,
    /\b(spam|scam|phishing)\b/i,
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        safe: false,
        reason: "Content contains inappropriate or potentially harmful keywords",
      };
    }
  }
  
  // Check content length (prevent extremely long requests)
  if (content.length > 5000) {
    return {
      safe: false,
      reason: "Content too long. Please keep requests under 5000 characters.",
    };
  }
  
  return { safe: true };
}
