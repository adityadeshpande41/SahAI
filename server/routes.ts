import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AgentOrchestrator } from "./agents/orchestrator";
import { RoutineTwinAgent } from "./agents/routine-twin-agent";
import { RiskGuardAgent } from "./agents/risk-guard-agent";
import { MedicationAgent } from "./agents/medication-agent";
import type { User } from "@shared/schema";
import multer from "multer";
import { uploadFile } from "./lib/supabase-storage";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const orchestrator = new AgentOrchestrator();
const routineTwinAgent = new RoutineTwinAgent();
const riskGuardAgent = new RiskGuardAgent();
const medicationAgent = new MedicationAgent();

// Middleware to get user from session/auth (simplified for now)
async function getCurrentUser(req: any): Promise<User | null> {
  // Get or create demo user
  const userId = req.headers["x-user-id"];
  
  console.log("getCurrentUser called with userId:", userId);
  
  if (userId) {
    let user = await storage.getUser(userId);
    console.log("Fetched user from storage:", user ? `${user.name} (${user.id})` : "not found");
    if (user) return user;
  }

  // Auto-create demo user if none exists
  try {
    const demoUsername = "demo-user";
    let user = await storage.getUserByUsername(demoUsername);
    
    if (!user) {
      try {
        user = await storage.createUser({
          username: demoUsername,
          password: "demo",
          name: "Demo User",
          ageGroup: "65-74",
          language: "English",
        });
        console.log("✅ Created demo user:", user.id);
      } catch (createError: any) {
        // If user was created by another request, fetch it
        if (createError.code === '23505') {
          user = await storage.getUserByUsername(demoUsername);
          if (!user) return null;
        } else {
          throw createError;
        }
      }
    }
    
    console.log("Returning demo user:", user ? `${user.name} (${user.id})` : "null");
    return user || null;
  } catch (error) {
    console.error("Error getting/creating demo user:", error);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // AUTH API
  // ============================================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, ageGroup, language } = req.body;
      
      console.log("Registration attempt:", { username, name, ageGroup, language });
      
      if (!username || !password || !name || !ageGroup) {
        console.log("Missing fields");
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Username already exists:", username);
        return res.status(409).json({ error: "Username already taken" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password, // In production, hash this!
        name,
        ageGroup,
        language: language || "English",
      });

      console.log("User created successfully:", user.id);

      res.json({
        success: true,
        userId: user.id,
        username: user.username,
        name: user.name,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Registration failed" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Check if user exists
      let user = await storage.getUserByUsername(username);
      
      // For demo purposes, create user if doesn't exist
      if (!user) {
        user = await storage.createUser({
          username,
          password, // In production, hash this!
          name: username,
          ageGroup: "65-74",
          language: "English",
        });
      }

      res.json({
        success: true,
        userId: user.id,
        username: user.username,
        name: user.name,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // ============================================
  // USER PROFILE API
  // ============================================
  
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        ageGroup: user.ageGroup,
        language: user.language,
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, ageGroup, language, location } = req.body;
      
      console.log("PATCH /api/users - Before update:", { userId: user.id, currentName: user.name });
      console.log("PATCH /api/users - Update data:", { name, ageGroup, language, location });
      
      const updatedUser = await storage.updateUser(user.id, {
        name,
        ageGroup,
        language,
        location,
      });

      console.log("PATCH /api/users - After update:", { userId: updatedUser.id, newName: updatedUser.name, location: updatedUser.location });

      res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  
  // ============================================
  // CONVERSATION / CHAT API
  // ============================================
  
  app.post("/api/chat", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Fetch fresh user data to get latest language preference
      const freshUser = await storage.getUser(user.id);
      
      console.log("Chat request - User language:", freshUser?.language || "not set");

      const result = await orchestrator.execute(
        {
          userId: user.id,
          userInput: message,
        },
        {
          user: freshUser || user,
          currentTime: new Date(),
        }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversation/history", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getRecentConversation(user.id, limit);
      
      res.json({ history });
    } catch (error: any) {
      console.error("History error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/conversation/history", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await storage.clearConversationHistory(user.id);
      
      res.json({ success: true, message: "Chat history cleared" });
    } catch (error: any) {
      console.error("Clear history error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ROUTINE TWIN API
  // ============================================
  
  app.get("/api/twin/state", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await routineTwinAgent.execute(
        { analysisType: "current_state" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Twin state error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/twin/update-baseline", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await routineTwinAgent.execute(
        { analysisType: "update_baseline" },
        { user, currentTime: new Date() }
      );

      res.json({ success: result.success, message: result.message });
    } catch (error: any) {
      console.error("Update baseline error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // RISK ALERTS API
  // ============================================
  
  app.get("/api/risks/current", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const alerts = await storage.getActiveRiskAlerts(user.id);
      res.json({ alerts });
    } catch (error: any) {
      console.error("Risk alerts error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // VOICE API (TTS & STT)
  // ============================================
  
  app.post("/api/voice/tts", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { text, voiceId, options } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const { textToSpeech } = await import("./lib/voice-service");
      const audioBuffer = await textToSpeech(text, voiceId, options);

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/voice/stt", upload.single("audio"), async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      const { speechToText } = await import("./lib/voice-service");
      // Pass user's language preference to improve recognition accuracy
      const transcript = await speechToText(req.file.buffer, user.language || undefined);

      res.json({ transcript });
    } catch (error: any) {
      console.error("STT error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/voice/voices", async (req, res) => {
    try {
      const { getAvailableVoices } = await import("./lib/voice-service");
      const voices = await getAvailableVoices();
      res.json({ voices });
    } catch (error: any) {
      console.error("Get voices error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // FILE UPLOAD API
  // ============================================
  
  app.post("/api/upload/prescription", upload.single("file"), async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let imageUrl: string;
      
      try {
        // Try to upload to Supabase Storage
        const sanitizedName = req.file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_');
        
        const fileName = `prescriptions/${user.id}/${Date.now()}-${sanitizedName}`;
        imageUrl = await uploadFile(
          "sahai-uploads",
          fileName,
          req.file.buffer,
          req.file.mimetype
        );
      } catch (uploadError: any) {
        console.log("Supabase upload failed, using base64 fallback:", uploadError.message);
        // Fallback: Use base64 data URL for OpenAI Vision
        const base64 = req.file.buffer.toString('base64');
        imageUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      // Extract prescription data using OpenAI Vision
      const medicationAgent = new (await import("./agents/medication-agent")).MedicationAgent();
      const result = await medicationAgent.execute(
        {
          action: "extract_prescription",
          data: { imageUrl },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json({
        imageUrl: imageUrl.startsWith('data:') ? 'base64-image' : imageUrl,
        extracted: result.data,
      });
    } catch (error: any) {
      console.error("Prescription upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/upload/meal-photo", upload.single("file"), async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { mealType } = req.body;

      let imageUrl: string;
      
      try {
        // Try to upload to Supabase Storage
        const sanitizedName = req.file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_');

        const fileName = `meals/${user.id}/${Date.now()}-${sanitizedName}`;
        imageUrl = await uploadFile(
          "sahai-uploads",
          fileName,
          req.file.buffer,
          req.file.mimetype
        );
      } catch (uploadError: any) {
        console.log("Supabase upload failed, using base64 fallback:", uploadError.message);
        // Fallback: Use base64 data URL for OpenAI Vision
        const base64 = req.file.buffer.toString('base64');
        imageUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      // Analyze meal photo using OpenAI Vision
      const nutritionAgent = new (await import("./agents/nutrition-agent")).NutritionAgent();
      const result = await nutritionAgent.execute(
        {
          action: "analyze_photo",
          data: { imageUrl, mealType },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json({
        imageUrl,
        analysis: result.data,
      });
    } catch (error: any) {
      console.error("Meal photo upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MEDICATIONS API
  // ============================================
  
  app.get("/api/medications", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const medications = await storage.getUserMedications(user.id);
      res.json({ medications });
    } catch (error: any) {
      console.error("Medications error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const medication = await storage.createMedication(user.id, req.body);
      res.json({ medication });
    } catch (error: any) {
      console.error("Create medication error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/medications/today", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const schedule = await storage.getTodayMedications(user.id);
      res.json({ schedule });
    } catch (error: any) {
      console.error("Today medications error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medications/:id/take", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { takenAt } = req.body;
      
      await storage.markMedicationTaken(user.id, id, new Date(takenAt || Date.now()));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark medication taken error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medications/:id/snooze", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { snoozeMinutes = 30 } = req.body; // Default 30 minutes
      
      await storage.snoozeMedication(user.id, id, snoozeMinutes);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Snooze medication error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medications/explain", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { medicationName, language } = req.body;
      
      const result = await medicationAgent.execute(
        {
          action: "explain",
          data: { medicationName, language },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Explain medication error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medications/extract-prescription", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { imageUrl } = req.body;
      
      const result = await medicationAgent.execute(
        {
          action: "extract_prescription",
          data: { imageUrl },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Extract prescription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/medications/adherence", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await medicationAgent.execute(
        { action: "adherence_summary" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Adherence summary error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MEALS API
  // ============================================
  
  app.post("/api/meals", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate and convert loggedAt to Date
      const { mealType, foods, hydration, loggedAt } = req.body;
      
      if (!mealType) {
        return res.status(400).json({ error: "mealType is required" });
      }
      
      const mealData = {
        mealType,
        foods: foods || "",
        hydration,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      };

      const meal = await storage.createMealLog(user.id, mealData);
      res.json({ meal });
    } catch (error: any) {
      console.error("Create meal error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/meals/today", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const meals = await storage.getTodayMeals(user.id);
      res.json({ meals });
    } catch (error: any) {
      console.error("Today meals error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SYMPTOMS API
  // ============================================
  
  app.post("/api/symptoms", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate and convert loggedAt to Date
      const { symptom, severity, notes, loggedAt } = req.body;
      
      if (!symptom) {
        return res.status(400).json({ error: "symptom is required" });
      }
      
      const symptomData = {
        symptom,
        severity: severity || 3,
        notes,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      };

      const result = await storage.createSymptomLog(user.id, symptomData);
      res.json({ symptom: result });
    } catch (error: any) {
      console.error("Create symptom error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/symptoms/recent", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const days = parseInt(req.query.days as string) || 7;
      const symptoms = await storage.getRecentSymptoms(user.id, days);
      res.json({ symptoms });
    } catch (error: any) {
      console.error("Recent symptoms error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ACTIVITIES API
  // ============================================
  
  app.post("/api/activities", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate and convert loggedAt to Date
      const { activity, duration, loggedAt } = req.body;
      
      if (!activity) {
        return res.status(400).json({ error: "activity is required" });
      }
      
      const activityData = {
        activity,
        duration,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      };

      const result = await storage.createActivityLog(user.id, activityData);
      res.json({ activity: result });
    } catch (error: any) {
      console.error("Create activity error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities/recent", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const count = parseInt(req.query.count as string) || 10;
      const activities = await storage.getRecentActivities(user.id, count);
      res.json({ activities });
    } catch (error: any) {
      console.error("Recent activities error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities/today", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const activities = await storage.getTodayActivities(user.id);
      res.json({ activities });
    } catch (error: any) {
      console.error("Today activities error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // USER API
  // ============================================
  
  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json({ user });
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/me", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("GET /api/users/me - Returning user:", { userId: user.id, name: user.name });

      // Disable caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({ user });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // NUTRITION API
  // ============================================
  
  app.post("/api/nutrition/analyze-photo", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { imageUrl, mealType } = req.body;
      
      const nutritionAgent = new (await import("./agents/nutrition-agent")).NutritionAgent();
      const result = await nutritionAgent.execute(
        {
          action: "analyze_photo",
          data: { imageUrl, mealType },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Analyze photo error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/nutrition/recommendations", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const nutritionAgent = new (await import("./agents/nutrition-agent")).NutritionAgent();
      const result = await nutritionAgent.execute(
        { action: "get_recommendations" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Nutrition recommendations error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SUMMARIES API
  // ============================================
  
  app.get("/api/summaries/:type", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { type } = req.params;
      const validTypes = ["morning", "evening", "weekly", "doctor_visit"];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid summary type" });
      }

      const summaryAgent = new (await import("./agents/summary-agent")).SummaryAgent();
      const result = await summaryAgent.execute(
        { summaryType: type as any },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Summary generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/summaries/:type/history", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const summaries = await storage.getRecentSummaries(user.id, type, limit);
      res.json({ summaries });
    } catch (error: any) {
      console.error("Summary history error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // LEARNING & INSIGHTS API
  // ============================================
  
  app.get("/api/insights/preferences", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { LearningAgent } = await import("./agents/learning-agent");
      const learningAgent = new LearningAgent();
      
      const result = await learningAgent.execute(
        { action: "analyze_preferences" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Preferences analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights/meal-suggestion", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { LearningAgent } = await import("./agents/learning-agent");
      const learningAgent = new LearningAgent();
      
      const result = await learningAgent.execute(
        { action: "suggest_meal" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Meal suggestion error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights/medication-timing/:medicationName", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { medicationName } = req.params;
      const { LearningAgent } = await import("./agents/learning-agent");
      const learningAgent = new LearningAgent();
      
      const result = await learningAgent.execute(
        { action: "suggest_medication_time", data: { medicationName } },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Medication timing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights/symptom-prediction", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { LearningAgent } = await import("./agents/learning-agent");
      const learningAgent = new LearningAgent();
      
      const result = await learningAgent.execute(
        { action: "predict_symptom" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Symptom prediction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights/activity-suggestion", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { LearningAgent } = await import("./agents/learning-agent");
      const learningAgent = new LearningAgent();
      
      const result = await learningAgent.execute(
        { action: "suggest_activity" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Activity suggestion error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CAREGIVER API
  // ============================================
  
  app.get("/api/caregivers", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const caregivers = await storage.getCaregiverContacts(user.id);
      res.json({ caregivers });
    } catch (error: any) {
      console.error("Get caregivers error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/caregivers", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const caregiver = await storage.createCaregiverContact(user.id, req.body);
      res.json({ caregiver });
    } catch (error: any) {
      console.error("Create caregiver error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/caregivers/alert", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { riskAlert, urgency } = req.body;
      
      const caregiverAgent = new (await import("./agents/caregiver-agent")).CaregiverAgent();
      const result = await caregiverAgent.execute(
        {
          action: "generate_alert",
          data: { riskAlert, urgency },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Caregiver alert error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/caregivers/send-update", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message, includeData } = req.body;
      
      const caregiverAgent = new (await import("./agents/caregiver-agent")).CaregiverAgent();
      const result = await caregiverAgent.execute(
        {
          action: "send_progress_update",
          data: { customMessage: message, includeData },
        },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Send caregiver update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { subscription } = req.body;
      await storage.savePushSubscription(user.id, subscription);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/push/public-key", async (req, res) => {
    const { pushNotificationService } = await import("./services/push-notification");
    res.json({ publicKey: pushNotificationService.getPublicKey() });
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { endpoint } = req.body;
      await storage.removePushSubscription(user.id, endpoint);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CONTEXT API
  // ============================================
  
  app.get("/api/context/current", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const contextAgent = new (await import("./agents/context-agent")).ContextAgent();
      const result = await contextAgent.execute(
        { action: "get_current_context" },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Get context error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/context/weather", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const location = req.query.location as string;
      
      const contextAgent = new (await import("./agents/context-agent")).ContextAgent();
      const result = await contextAgent.execute(
        { action: "get_weather", data: { location } },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Get weather error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/context/location", async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { locationState } = req.body;
      
      const contextAgent = new (await import("./agents/context-agent")).ContextAgent();
      const result = await contextAgent.execute(
        { action: "update_location", data: { locationState } },
        { user, currentTime: new Date() }
      );

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Update location error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
