import { eq, and, gte, desc, sql, isNotNull } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { IStorage } from "./storage";
import type {
  User,
  InsertUser,
  Medication,
  MedicationSchedule,
  MealLog,
  SymptomLog,
  ActivityLog,
  RoutineBaseline,
  ConversationHistory,
  RiskAlert,
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private db = getDb();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!this.db) return undefined;
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    console.log("DatabaseStorage.getUser - Raw result from DB:", JSON.stringify(result[0]));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) return undefined;
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    if (!result[0]) throw new Error("User not found");
    return result[0];
  }

  // Medications
  async getUserMedications(userId: string): Promise<Medication[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.medications)
      .where(and(eq(schema.medications.userId, userId), eq(schema.medications.active, true)));
  }

  async getMedicationByName(userId: string, name: string): Promise<Medication | undefined> {
    if (!this.db) return undefined;
    const result = await this.db.select().from(schema.medications)
      .where(and(
        eq(schema.medications.userId, userId),
        sql`LOWER(${schema.medications.name}) = LOWER(${name})`,
        eq(schema.medications.active, true)
      ))
      .limit(1);
    return result[0];
  }

  async createMedication(userId: string, data: any): Promise<Medication> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.medications)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async createMedicationSchedule(userId: string, data: any): Promise<MedicationSchedule> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.medicationSchedule)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async getTodayMedications(userId: string): Promise<MedicationSchedule[]> {
    if (!this.db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Join with medications table to get full medication details
    const schedules = await this.db
      .select({
        id: schema.medicationSchedule.id,
        medicationId: schema.medicationSchedule.medicationId,
        userId: schema.medicationSchedule.userId,
        scheduledTime: schema.medicationSchedule.scheduledTime,
        taken: schema.medicationSchedule.taken,
        takenAt: schema.medicationSchedule.takenAt,
        snoozed: schema.medicationSchedule.snoozed,
        missed: schema.medicationSchedule.missed,
        createdAt: schema.medicationSchedule.createdAt,
        // Include medication details
        name: schema.medications.name,
        dose: schema.medications.dose,
        dosage: schema.medications.dose, // Alias for frontend compatibility
        frequency: schema.medications.frequency,
        timing: schema.medications.timing,
        beforeFood: schema.medications.beforeFood,
        instructions: sql<string>`CASE WHEN ${schema.medications.beforeFood} THEN 'Before food' ELSE 'After food' END`,
      })
      .from(schema.medicationSchedule)
      .innerJoin(
        schema.medications,
        eq(schema.medicationSchedule.medicationId, schema.medications.id)
      )
      .where(and(
        eq(schema.medicationSchedule.userId, userId),
        gte(schema.medicationSchedule.scheduledTime, today),
        sql`${schema.medicationSchedule.scheduledTime} < ${tomorrow}`
      ));

    return schedules as any;
  }

  async getTodayMedicationSchedule(userId: string, medicationId: string): Promise<MedicationSchedule | undefined> {
    const today = await this.getTodayMedications(userId);
    return today.find(m => m.medicationId === medicationId);
  }

  async markMedicationTaken(userId: string, medicationId: string, takenAt: Date): Promise<void> {
    if (!this.db) return;
    const schedule = await this.getTodayMedicationSchedule(userId, medicationId);
    if (schedule) {
      await this.db.update(schema.medicationSchedule)
        .set({ taken: true, takenAt })
        .where(eq(schema.medicationSchedule.id, schedule.id));
    }
  }

  async snoozeMedication(userId: string, medicationId: string, snoozeMinutes: number): Promise<void> {
    if (!this.db) return;
    const schedule = await this.getTodayMedicationSchedule(userId, medicationId);
    if (schedule) {
      const newTime = new Date(schedule.scheduledTime);
      newTime.setMinutes(newTime.getMinutes() + snoozeMinutes);
      await this.db.update(schema.medicationSchedule)
        .set({ snoozed: true, scheduledTime: newTime })
        .where(eq(schema.medicationSchedule.id, schedule.id));
    }
  }

  async getNextMedication(userId: string): Promise<Medication | undefined> {
    if (!this.db) return undefined;
    const schedules = await this.getTodayMedications(userId);
    const upcoming = schedules
      .filter(s => !s.taken && new Date(s.scheduledTime) > new Date())
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    
    if (upcoming.length > 0) {
      const result = await this.db.select().from(schema.medications)
        .where(eq(schema.medications.id, upcoming[0].medicationId))
        .limit(1);
      return result[0];
    }
    return undefined;
  }

  async getPendingAfterFoodMedications(userId: string): Promise<Medication[]> {
    if (!this.db) return [];
    const schedules = await this.getTodayMedications(userId);
    const pending = schedules.filter(s => !s.taken && new Date(s.scheduledTime) <= new Date());
    
    const meds: Medication[] = [];
    for (const schedule of pending) {
      const result = await this.db.select().from(schema.medications)
        .where(and(
          eq(schema.medications.id, schedule.medicationId),
          eq(schema.medications.beforeFood, false)
        ))
        .limit(1);
      if (result[0]) meds.push(result[0]);
    }
    return meds;
  }

  async getHistoricalMedications(userId: string, days: number): Promise<MedicationSchedule[]> {
    if (!this.db) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return await this.db.select().from(schema.medicationSchedule)
      .where(and(
        eq(schema.medicationSchedule.userId, userId),
        gte(schema.medicationSchedule.scheduledTime, cutoff)
      ));
  }

  // Meals
  async createMealLog(userId: string, data: any): Promise<MealLog> {
    if (!this.db) throw new Error("Database not available");
    
    // Ensure loggedAt is a proper Date object
    const mealData = {
      userId,
      mealType: data.mealType,
      foods: data.foods,
      hydration: data.hydration,
      photoUrl: data.photoUrl,
      nutritionData: data.nutritionData,
      loggedAt: data.loggedAt instanceof Date ? data.loggedAt : new Date(data.loggedAt),
    };
    
    const result = await this.db.insert(schema.mealLogs)
      .values(mealData)
      .returning();
    return result[0];
  }

  async getTodayMeals(userId: string): Promise<MealLog[]> {
    if (!this.db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await this.db.select().from(schema.mealLogs)
      .where(and(
        eq(schema.mealLogs.userId, userId),
        gte(schema.mealLogs.loggedAt, today)
      ))
      .orderBy(schema.mealLogs.loggedAt);
  }

  async getRecentMeals(userId: string, count: number): Promise<MealLog[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.mealLogs)
      .where(eq(schema.mealLogs.userId, userId))
      .orderBy(desc(schema.mealLogs.loggedAt))
      .limit(count);
  }

  async getHistoricalMeals(userId: string, days: number): Promise<MealLog[]> {
    if (!this.db) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return await this.db.select().from(schema.mealLogs)
      .where(and(
        eq(schema.mealLogs.userId, userId),
        gte(schema.mealLogs.loggedAt, cutoff)
      ));
  }

  async deleteMealLog(mealId: number, userId: string): Promise<void> {
    if (!this.db) throw new Error("Database not available");
    
    await this.db.delete(schema.mealLogs)
      .where(and(
        eq(schema.mealLogs.id, mealId),
        eq(schema.mealLogs.userId, userId)
      ));
  }

  async updateMealLog(mealId: number, userId: string, data: { foods?: string; estimatedCalories?: number }): Promise<MealLog> {
    if (!this.db) throw new Error("Database not available");
    
    const [updated] = await this.db.update(schema.mealLogs)
      .set(data)
      .where(and(
        eq(schema.mealLogs.id, mealId),
        eq(schema.mealLogs.userId, userId)
      ))
      .returning();
    
    if (!updated) {
      throw new Error("Meal not found or unauthorized");
    }
    
    return updated;
  }

  // Symptoms
  async createSymptomLog(userId: string, data: any): Promise<SymptomLog> {
    if (!this.db) throw new Error("Database not available");
    
    // Ensure loggedAt is a proper Date object
    const symptomData = {
      userId,
      symptom: data.symptom,
      severity: data.severity,
      notes: data.notes,
      contextSnapshot: data.contextSnapshot,
      loggedAt: data.loggedAt instanceof Date ? data.loggedAt : new Date(data.loggedAt),
    };
    
    const result = await this.db.insert(schema.symptomLogs)
      .values(symptomData)
      .returning();
    return result[0];
  }

  async getTodaySymptoms(userId: string): Promise<SymptomLog[]> {
    if (!this.db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await this.db.select().from(schema.symptomLogs)
      .where(and(
        eq(schema.symptomLogs.userId, userId),
        gte(schema.symptomLogs.loggedAt, today)
      ));
  }

  async getRecentSymptoms(userId: string, days: number): Promise<SymptomLog[]> {
    if (!this.db) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return await this.db.select().from(schema.symptomLogs)
      .where(and(
        eq(schema.symptomLogs.userId, userId),
        gte(schema.symptomLogs.loggedAt, cutoff)
      ))
      .orderBy(desc(schema.symptomLogs.loggedAt));
  }

  // Activities
  async createActivityLog(userId: string, data: any): Promise<ActivityLog> {
    if (!this.db) throw new Error("Database not available");
    
    // Ensure loggedAt is a proper Date object
    const activityData = {
      userId,
      activity: data.activity,
      duration: data.duration,
      location: data.location,
      loggedAt: data.loggedAt instanceof Date ? data.loggedAt : new Date(data.loggedAt),
    };
    
    const result = await this.db.insert(schema.activityLogs)
      .values(activityData)
      .returning();
    return result[0];
  }

  async getTodayActivities(userId: string): Promise<ActivityLog[]> {
    if (!this.db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await this.db.select().from(schema.activityLogs)
      .where(and(
        eq(schema.activityLogs.userId, userId),
        gte(schema.activityLogs.loggedAt, today)
      ));
  }

  async getRecentActivities(userId: string, count: number): Promise<ActivityLog[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.loggedAt))
      .limit(count);
  }

  async getHistoricalActivities(userId: string, days: number): Promise<ActivityLog[]> {
    if (!this.db) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return await this.db.select().from(schema.activityLogs)
      .where(and(
        eq(schema.activityLogs.userId, userId),
        gte(schema.activityLogs.loggedAt, cutoff)
      ));
  }

  // Routine Baseline
  async getRoutineBaseline(userId: string): Promise<RoutineBaseline | undefined> {
    if (!this.db) return undefined;
    const result = await this.db.select().from(schema.routineBaseline)
      .where(eq(schema.routineBaseline.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateRoutineBaseline(userId: string, data: any): Promise<void> {
    if (!this.db) return;
    const existing = await this.getRoutineBaseline(userId);
    if (existing) {
      await this.db.update(schema.routineBaseline)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.routineBaseline.id, existing.id));
    } else {
      await this.db.insert(schema.routineBaseline)
        .values({ userId, ...data });
    }
  }

  // Conversation
  async createConversationMessage(userId: string, data: any): Promise<ConversationHistory> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.conversationHistory)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async getRecentConversation(userId: string, count: number): Promise<ConversationHistory[]> {
    if (!this.db) return [];
    const messages = await this.db.select().from(schema.conversationHistory)
      .where(eq(schema.conversationHistory.userId, userId))
      .orderBy(desc(schema.conversationHistory.createdAt))
      .limit(count);
    return messages.reverse();
  }

  async clearConversationHistory(userId: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete(schema.conversationHistory)
      .where(eq(schema.conversationHistory.userId, userId));
  }

  // Push Notifications
  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    if (!this.db) return;
    // Check if subscription already exists
    const existing = await this.db.select().from(schema.pushSubscriptions)
      .where(and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, subscription.endpoint)
      ))
      .limit(1);
    
    if (existing.length === 0) {
      await this.db.insert(schema.pushSubscriptions)
        .values({
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        });
    }
  }

  async getPushSubscriptions(userId: string): Promise<any[]> {
    if (!this.db) return [];
    const subs = await this.db.select().from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userId));
    
    return subs.map(s => ({
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh,
        auth: s.auth,
      },
    }));
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete(schema.pushSubscriptions)
      .where(and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, endpoint)
      ));
  }

  // Risk Alerts
  async createRiskAlert(userId: string, data: any): Promise<RiskAlert> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.riskAlerts)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async getActiveRiskAlerts(userId: string): Promise<RiskAlert[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.riskAlerts)
      .where(and(
        eq(schema.riskAlerts.userId, userId),
        eq(schema.riskAlerts.dismissed, false)
      ))
      .orderBy(desc(schema.riskAlerts.createdAt));
  }

  // Aliases
  async getUserAliases(userId: string): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.ambiguityAliases)
      .where(eq(schema.ambiguityAliases.userId, userId));
  }

  async createAlias(userId: string, data: any): Promise<void> {
    if (!this.db) return;
    await this.db.insert(schema.ambiguityAliases)
      .values({ userId, ...data });
  }

  // Vector Memory
  async getVectorMemories(userId: string, memoryTypes?: string[]): Promise<any[]> {
    if (!this.db) return [];
    
    if (memoryTypes && memoryTypes.length > 0) {
      return await this.db.select().from(schema.vectorMemory)
        .where(and(
          eq(schema.vectorMemory.userId, userId),
          sql`${schema.vectorMemory.memoryType} = ANY(${memoryTypes})`
        ));
    }
    
    return await this.db.select().from(schema.vectorMemory)
      .where(eq(schema.vectorMemory.userId, userId));
  }

  async createVectorMemory(userId: string, data: any): Promise<void> {
    if (!this.db) return;
    await this.db.insert(schema.vectorMemory)
      .values({ userId, ...data });
  }

  // Caregivers
  async getCaregiverContacts(userId: string): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.caregiverContacts)
      .where(eq(schema.caregiverContacts.userId, userId));
  }

  async createCaregiverContact(userId: string, data: any): Promise<any> {
    if (!this.db) throw new Error("Database not available");
    const result = await this.db.insert(schema.caregiverContacts)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async createCaregiverNotification(caregiverId: string, userId: string, data: any): Promise<void> {
    if (!this.db) return;
    await this.db.insert(schema.caregiverNotifications)
      .values({ caregiverId, userId, ...data });
  }

  // Summaries
  async createSummary(userId: string, data: any): Promise<void> {
    if (!this.db) return;
    await this.db.insert(schema.summaries)
      .values({ userId, ...data });
  }

  async getRecentSummaries(userId: string, summaryType: string, count: number): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.summaries)
      .where(and(
        eq(schema.summaries.userId, userId),
        eq(schema.summaries.summaryType, summaryType)
      ))
      .orderBy(desc(schema.summaries.createdAt))
      .limit(count);
  }

  // Context Snapshots
  async createContextSnapshot(userId: string, data: any): Promise<void> {
    if (!this.db) return;
    await this.db.insert(schema.contextSnapshots)
      .values({ userId, ...data });
  }

  async getContextSnapshots(userId: string, count: number): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.contextSnapshots)
      .where(eq(schema.contextSnapshots.userId, userId))
      .orderBy(desc(schema.contextSnapshots.capturedAt))
      .limit(count);
  }

  // Health Vitals
  async createHealthVital(userId: string, data: any): Promise<any> {
    if (!this.db) throw new Error("Database not available");
    
    const vitalData = {
      userId,
      vitalType: data.vitalType,
      bloodSugar: data.bloodSugar,
      measurementType: data.measurementType,
      systolic: data.systolic,
      diastolic: data.diastolic,
      weight: data.weight,
      heartRate: data.heartRate,
      notes: data.notes,
      loggedAt: data.loggedAt instanceof Date ? data.loggedAt : new Date(data.loggedAt || Date.now()),
    };
    
    const result = await this.db.insert(schema.healthVitals)
      .values(vitalData)
      .returning();
    return result[0];
  }

  async getTodayVitals(userId: string, vitalType?: string): Promise<any[]> {
    if (!this.db) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const conditions = [
      eq(schema.healthVitals.userId, userId),
      gte(schema.healthVitals.loggedAt, today)
    ];
    
    if (vitalType) {
      conditions.push(eq(schema.healthVitals.vitalType, vitalType));
    }
    
    return await this.db.select().from(schema.healthVitals)
      .where(and(...conditions))
      .orderBy(desc(schema.healthVitals.loggedAt));
  }

  async getRecentVitals(userId: string, vitalType: string, count: number): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.select().from(schema.healthVitals)
      .where(and(
        eq(schema.healthVitals.userId, userId),
        eq(schema.healthVitals.vitalType, vitalType)
      ))
      .orderBy(desc(schema.healthVitals.loggedAt))
      .limit(count);
  }

  async getMealStreak(userId: string): Promise<number> {
    if (!this.db) return 0;
    const meals = await this.db.select().from(schema.mealLogs)
      .where(eq(schema.mealLogs.userId, userId))
      .orderBy(desc(schema.mealLogs.loggedAt));
    
    return this.calculateStreak(meals.map(m => m.loggedAt));
  }

  async getVitalsStreak(userId: string): Promise<number> {
    if (!this.db) return 0;
    const vitals = await this.db.select().from(schema.healthVitals)
      .where(eq(schema.healthVitals.userId, userId))
      .orderBy(desc(schema.healthVitals.loggedAt));
    
    return this.calculateStreak(vitals.map(v => v.loggedAt));
  }

  async getMedicationStreak(userId: string): Promise<number> {
    if (!this.db) return 0;
    const schedules = await this.db.select().from(schema.medicationSchedule)
      .where(and(
        eq(schema.medicationSchedule.userId, userId),
        isNotNull(schema.medicationSchedule.takenAt)
      ))
      .orderBy(desc(schema.medicationSchedule.takenAt));
    
    return this.calculateStreak(schedules.map(s => s.takenAt!));
  }

  async getUserStreaks(userId: string): Promise<{ medication: number; meals: number; vitals: number }> {
    const [medication, meals, vitals] = await Promise.all([
      this.getMedicationStreak(userId),
      this.getMealStreak(userId),
      this.getVitalsStreak(userId),
    ]);
    
    return { medication, meals, vitals };
  }

  async getHealthGoals(userId: string): Promise<any | undefined> {
    if (!this.db) return undefined;
    
    const [goals] = await this.db
      .select()
      .from(schema.healthGoals)
      .where(eq(schema.healthGoals.userId, userId))
      .limit(1);
    
    return goals;
  }

  async saveHealthGoals(userId: string, data: any): Promise<any> {
    if (!this.db) throw new Error("Database not available");
    
    const existing = await this.getHealthGoals(userId);
    
    if (existing) {
      // Update existing
      const [updated] = await this.db
        .update(schema.healthGoals)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.healthGoals.userId, userId))
        .returning();
      return updated;
    } else {
      // Insert new
      const [created] = await this.db
        .insert(schema.healthGoals)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  async saveCaregiverToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    if (!this.db) return;
    
    await this.db
      .insert(schema.caregiverTokens)
      .values({ userId, token, expiresAt })
      .onConflictDoUpdate({
        target: schema.caregiverTokens.token,
        set: { expiresAt, createdAt: new Date() }
      });
  }

  async validateCaregiverToken(token: string): Promise<{ userId: string } | undefined> {
    if (!this.db) {
      // Fallback for in-memory: decode token
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const userId = decoded.split('-')[0];
        return { userId };
      } catch {
        return undefined;
      }
    }
    
    const [tokenData] = await this.db
      .select()
      .from(schema.caregiverTokens)
      .where(eq(schema.caregiverTokens.token, token))
      .limit(1);
    
    if (!tokenData) return undefined;
    
    // Check if expired
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
      return undefined;
    }
    
    return { userId: tokenData.userId };
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's an entry today or yesterday (to allow for current streak)
    const mostRecent = new Date(dates[0]);
    mostRecent.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) return 0; // Streak broken
    
    // Count consecutive days
    const uniqueDays = new Set<string>();
    for (const date of dates) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      uniqueDays.add(d.toISOString().split('T')[0]);
    }
    
    const sortedDays = Array.from(uniqueDays).sort().reverse();
    
    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = new Date(sortedDays[i]);
      const expectedDay = new Date(today);
      expectedDay.setDate(expectedDay.getDate() - i);
      expectedDay.setHours(0, 0, 0, 0);
      
      if (currentDay.toISOString().split('T')[0] === expectedDay.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

