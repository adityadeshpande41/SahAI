import { 
  type User, 
  type InsertUser,
  type Medication,
  type MedicationSchedule,
  type MealLog,
  type SymptomLog,
  type ActivityLog,
  type RoutineBaseline,
  type ConversationHistory,
  type RiskAlert,
  type CaregiverContact,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Medications
  getUserMedications(userId: string): Promise<Medication[]>;
  getMedicationByName(userId: string, name: string): Promise<Medication | undefined>;
  createMedication(userId: string, data: any): Promise<Medication>;
  createMedicationSchedule(userId: string, data: any): Promise<MedicationSchedule>;
  getTodayMedications(userId: string): Promise<MedicationSchedule[]>;
  getTodayMedicationSchedule(userId: string, medicationId: string): Promise<MedicationSchedule | undefined>;
  markMedicationTaken(userId: string, medicationId: string, takenAt: Date): Promise<void>;
  snoozeMedication(userId: string, medicationId: string, snoozeMinutes: number): Promise<void>;
  getNextMedication(userId: string): Promise<Medication | undefined>;
  getPendingAfterFoodMedications(userId: string): Promise<Medication[]>;
  getHistoricalMedications(userId: string, days: number): Promise<MedicationSchedule[]>;

  // Meals
  createMealLog(userId: string, data: any): Promise<MealLog>;
  getTodayMeals(userId: string): Promise<MealLog[]>;
  getRecentMeals(userId: string, count: number): Promise<MealLog[]>;
  getHistoricalMeals(userId: string, days: number): Promise<MealLog[]>;
  deleteMealLog(mealId: number, userId: string): Promise<void>;
  updateMealLog(mealId: number, userId: string, data: { foods?: string; estimatedCalories?: number }): Promise<MealLog>;
  getMealStreak(userId: string): Promise<number>;

  // Symptoms
  createSymptomLog(userId: string, data: any): Promise<SymptomLog>;
  getTodaySymptoms(userId: string): Promise<SymptomLog[]>;
  getRecentSymptoms(userId: string, days: number): Promise<SymptomLog[]>;

  // Activities
  createActivityLog(userId: string, data: any): Promise<ActivityLog>;
  getTodayActivities(userId: string): Promise<ActivityLog[]>;
  getRecentActivities(userId: string, count: number): Promise<ActivityLog[]>;
  getHistoricalActivities(userId: string, days: number): Promise<ActivityLog[]>;

  // Routine Baseline
  getRoutineBaseline(userId: string): Promise<RoutineBaseline | undefined>;
  updateRoutineBaseline(userId: string, data: any): Promise<void>;

  // Conversation
  createConversationMessage(userId: string, data: any): Promise<ConversationHistory>;
  getRecentConversation(userId: string, count: number): Promise<ConversationHistory[]>;
  clearConversationHistory(userId: string): Promise<void>;

  // Push Notifications
  savePushSubscription(userId: string, subscription: any): Promise<void>;
  getPushSubscriptions(userId: string): Promise<any[]>;
  removePushSubscription(userId: string, endpoint: string): Promise<void>;

  // Risk Alerts
  createRiskAlert(userId: string, data: any): Promise<RiskAlert>;
  getActiveRiskAlerts(userId: string): Promise<RiskAlert[]>;

  // Aliases
  getUserAliases(userId: string): Promise<any[]>;
  createAlias(userId: string, data: any): Promise<void>;

  // Vector Memory (RAG)
  getVectorMemories(userId: string, memoryTypes?: string[]): Promise<any[]>;
  createVectorMemory(userId: string, data: any): Promise<void>;

  // Caregivers
  getCaregiverContacts(userId: string): Promise<CaregiverContact[]>;
  createCaregiverContact(userId: string, data: any): Promise<CaregiverContact>;
  createCaregiverNotification(caregiverId: string, userId: string, data: any): Promise<void>;

  // Summaries
  createSummary(userId: string, data: any): Promise<void>;
  getRecentSummaries(userId: string, summaryType: string, count: number): Promise<any[]>;

  // Context Snapshots
  createContextSnapshot(userId: string, data: any): Promise<void>;
  getContextSnapshots(userId: string, count: number): Promise<any[]>;

  // Health Vitals
  createHealthVital(userId: string, data: any): Promise<any>;
  getTodayVitals(userId: string, vitalType?: string): Promise<any[]>;
  getRecentVitals(userId: string, vitalType: string, count: number): Promise<any[]>;
  getVitalsStreak(userId: string): Promise<number>;
  getMedicationStreak(userId: string): Promise<number>;
  getUserStreaks(userId: string): Promise<{ medication: number; meals: number; vitals: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private medications: Map<string, Medication>;
  private medicationSchedules: Map<string, MedicationSchedule>;
  private mealLogs: Map<string, MealLog>;
  private symptomLogs: Map<string, SymptomLog>;
  private activityLogs: Map<string, ActivityLog>;
  private routineBaselines: Map<string, RoutineBaseline>;
  private conversations: Map<string, ConversationHistory>;
  private riskAlerts: Map<string, RiskAlert>;
  private aliases: Map<string, any>;
  private vectorMemories: Map<string, any>;
  private caregiverContacts: Map<string, CaregiverContact>;
  private caregiverNotifications: Map<string, any>;
  private summaries: Map<string, any>;
  private contextSnapshots: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.medicationSchedules = new Map();
    this.mealLogs = new Map();
    this.symptomLogs = new Map();
    this.activityLogs = new Map();
    this.routineBaselines = new Map();
    this.conversations = new Map();
    this.riskAlerts = new Map();
    this.aliases = new Map();
    this.vectorMemories = new Map();
    this.caregiverContacts = new Map();
    this.caregiverNotifications = new Map();
    this.summaries = new Map();
    this.contextSnapshots = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    console.log("MemStorage.getUser - Looking for:", id);
    console.log("MemStorage.getUser - Found:", user ? `${user.name} (${user.id})` : "NOT FOUND");
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    } as User;
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    console.log("MemStorage.updateUser - Looking for user:", id);
    console.log("MemStorage.updateUser - Found user:", user ? `${user.name} (${user.id})` : "NOT FOUND");
    console.log("MemStorage.updateUser - All users in memory:", Array.from(this.users.keys()));
    
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    
    console.log("MemStorage.updateUser - Updated user:", `${updatedUser.name} (${updatedUser.id})`);
    console.log("MemStorage.updateUser - Verification - user in map:", this.users.get(id)?.name);
    
    return updatedUser;
  }

  // Medications
  async getUserMedications(userId: string): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(m => m.userId === userId && m.active);
  }

  async getMedicationByName(userId: string, name: string): Promise<Medication | undefined> {
    return Array.from(this.medications.values()).find(
      m => m.userId === userId && m.name.toLowerCase() === name.toLowerCase() && m.active
    );
  }

  async createMedication(userId: string, data: any): Promise<Medication> {
    const id = randomUUID();
    const medication: Medication = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as Medication;
    this.medications.set(id, medication);
    return medication;
  }

  async createMedicationSchedule(userId: string, data: any): Promise<MedicationSchedule> {
    const id = `schedule-${Date.now()}-${Math.random()}`;
    const schedule = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as MedicationSchedule;
    this.medicationSchedules.set(id, schedule);
    return schedule;
  }

  async getTodayMedications(userId: string): Promise<MedicationSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = Array.from(this.medicationSchedules.values()).filter(
      m => m.userId === userId && 
      new Date(m.scheduledTime) >= today && 
      new Date(m.scheduledTime) < tomorrow
    );

    // Enrich with medication details
    return schedules.map(schedule => {
      const medication = this.medications.get(schedule.medicationId);
      return {
        ...schedule,
        name: medication?.name,
        dose: medication?.dose,
        dosage: medication?.dose, // Alias for frontend compatibility
        frequency: medication?.frequency,
        timing: medication?.timing,
        beforeFood: medication?.beforeFood,
        instructions: medication?.beforeFood ? 'Before food' : 'After food',
      } as any;
    });
  }

  async getTodayMedicationSchedule(userId: string, medicationId: string): Promise<MedicationSchedule | undefined> {
    const today = await this.getTodayMedications(userId);
    return today.find(m => m.medicationId === medicationId);
  }

  async markMedicationTaken(userId: string, medicationId: string, takenAt: Date): Promise<void> {
    const schedule = await this.getTodayMedicationSchedule(userId, medicationId);
    if (schedule) {
      schedule.taken = true;
      schedule.takenAt = takenAt;
      this.medicationSchedules.set(schedule.id, schedule);
    }
  }

  async snoozeMedication(userId: string, medicationId: string, snoozeMinutes: number): Promise<void> {
    const schedule = await this.getTodayMedicationSchedule(userId, medicationId);
    if (schedule) {
      schedule.snoozed = true;
      const newTime = new Date(schedule.scheduledTime);
      newTime.setMinutes(newTime.getMinutes() + snoozeMinutes);
      schedule.scheduledTime = newTime;
      this.medicationSchedules.set(schedule.id, schedule);
    }
  }

  async getNextMedication(userId: string): Promise<Medication | undefined> {
    const schedules = await this.getTodayMedications(userId);
    const upcoming = schedules
      .filter(s => !s.taken && new Date(s.scheduledTime) > new Date())
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    
    if (upcoming.length > 0) {
      return this.medications.get(upcoming[0].medicationId);
    }
    return undefined;
  }

  async getPendingAfterFoodMedications(userId: string): Promise<Medication[]> {
    const schedules = await this.getTodayMedications(userId);
    const pending = schedules.filter(s => !s.taken && new Date(s.scheduledTime) <= new Date());
    
    const meds: Medication[] = [];
    for (const schedule of pending) {
      const med = this.medications.get(schedule.medicationId);
      if (med && !med.beforeFood) {
        meds.push(med);
      }
    }
    return meds;
  }

  async getHistoricalMedications(userId: string, days: number): Promise<MedicationSchedule[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.medicationSchedules.values()).filter(
      m => m.userId === userId && new Date(m.scheduledTime) >= cutoff
    );
  }

  // Meals
  async createMealLog(userId: string, data: any): Promise<MealLog> {
    const id = randomUUID();
    const meal: MealLog = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as MealLog;
    this.mealLogs.set(id, meal);
    return meal;
  }

  async getTodayMeals(userId: string): Promise<MealLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.mealLogs.values())
      .filter(m => m.userId === userId && new Date(m.loggedAt) >= today)
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  }

  async getRecentMeals(userId: string, count: number): Promise<MealLog[]> {
    return Array.from(this.mealLogs.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, count);
  }

  async getHistoricalMeals(userId: string, days: number): Promise<MealLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.mealLogs.values()).filter(
      m => m.userId === userId && new Date(m.loggedAt) >= cutoff
    );
  }

  async deleteMealLog(mealId: number, userId: string): Promise<void> {
    const meal = this.mealLogs.get(mealId);
    if (!meal || meal.userId !== userId) {
      throw new Error("Meal not found or unauthorized");
    }
    this.mealLogs.delete(mealId);
  }

  async updateMealLog(mealId: number, userId: string, data: { foods?: string; estimatedCalories?: number }): Promise<MealLog> {
    const meal = this.mealLogs.get(mealId);
    if (!meal || meal.userId !== userId) {
      throw new Error("Meal not found or unauthorized");
    }
    
    const updated = {
      ...meal,
      ...data,
    };
    
    this.mealLogs.set(mealId, updated);
    return updated;
  }

  // Symptoms
  async createSymptomLog(userId: string, data: any): Promise<SymptomLog> {
    const id = randomUUID();
    const symptom: SymptomLog = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as SymptomLog;
    this.symptomLogs.set(id, symptom);
    return symptom;
  }

  async getTodaySymptoms(userId: string): Promise<SymptomLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.symptomLogs.values()).filter(
      s => s.userId === userId && new Date(s.loggedAt) >= today
    );
  }

  async getRecentSymptoms(userId: string, days: number): Promise<SymptomLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.symptomLogs.values())
      .filter(s => s.userId === userId && new Date(s.loggedAt) >= cutoff)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  }

  // Activities
  async createActivityLog(userId: string, data: any): Promise<ActivityLog> {
    const id = randomUUID();
    const activity: ActivityLog = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as ActivityLog;
    this.activityLogs.set(id, activity);
    return activity;
  }

  async getTodayActivities(userId: string): Promise<ActivityLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.activityLogs.values()).filter(
      a => a.userId === userId && new Date(a.loggedAt) >= today
    );
  }

  async getRecentActivities(userId: string, count: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, count);
  }

  async getHistoricalActivities(userId: string, days: number): Promise<ActivityLog[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.activityLogs.values()).filter(
      a => a.userId === userId && new Date(a.loggedAt) >= cutoff
    );
  }

  // Routine Baseline
  async getRoutineBaseline(userId: string): Promise<RoutineBaseline | undefined> {
    return Array.from(this.routineBaselines.values()).find(r => r.userId === userId);
  }

  async updateRoutineBaseline(userId: string, data: any): Promise<void> {
    const existing = await this.getRoutineBaseline(userId);
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
      this.routineBaselines.set(existing.id, existing);
    } else {
      const id = randomUUID();
      const baseline: RoutineBaseline = {
        id,
        userId,
        ...data,
        updatedAt: new Date(),
      } as RoutineBaseline;
      this.routineBaselines.set(id, baseline);
    }
  }

  // Conversation
  async createConversationMessage(userId: string, data: any): Promise<ConversationHistory> {
    const id = randomUUID();
    const message: ConversationHistory = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as ConversationHistory;
    this.conversations.set(id, message);
    return message;
  }

  async getRecentConversation(userId: string, count: number): Promise<ConversationHistory[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count)
      .reverse();
  }

  async clearConversationHistory(userId: string): Promise<void> {
    // Remove all conversations for this user
    const conversationsToDelete: string[] = [];
    this.conversations.forEach((conversation, id) => {
      if (conversation.userId === userId) {
        conversationsToDelete.push(id);
      }
    });
    conversationsToDelete.forEach(id => this.conversations.delete(id));
  }

  // Push Notifications
  private pushSubscriptions: Map<string, any> = new Map();

  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    const id = `${userId}-${subscription.endpoint}`;
    this.pushSubscriptions.set(id, { userId, ...subscription, createdAt: new Date() });
  }

  async getPushSubscriptions(userId: string): Promise<any[]> {
    return Array.from(this.pushSubscriptions.values()).filter(s => s.userId === userId);
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    const id = `${userId}-${endpoint}`;
    this.pushSubscriptions.delete(id);
  }

  // Risk Alerts
  async createRiskAlert(userId: string, data: any): Promise<RiskAlert> {
    const id = randomUUID();
    const alert: RiskAlert = {
      id,
      userId,
      ...data,
      dismissed: false,
      createdAt: new Date(),
    } as RiskAlert;
    this.riskAlerts.set(id, alert);
    return alert;
  }

  async getActiveRiskAlerts(userId: string): Promise<RiskAlert[]> {
    return Array.from(this.riskAlerts.values())
      .filter(a => a.userId === userId && !a.dismissed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Aliases
  async getUserAliases(userId: string): Promise<any[]> {
    return Array.from(this.aliases.values()).filter(a => a.userId === userId);
  }

  async createAlias(userId: string, data: any): Promise<void> {
    const id = randomUUID();
    const alias = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.aliases.set(id, alias);
  }

  // Vector Memory
  async getVectorMemories(userId: string, memoryTypes?: string[]): Promise<any[]> {
    let memories = Array.from(this.vectorMemories.values()).filter(m => m.userId === userId);
    
    if (memoryTypes && memoryTypes.length > 0) {
      memories = memories.filter(m => memoryTypes.includes(m.memoryType));
    }
    
    return memories;
  }

  async createVectorMemory(userId: string, data: any): Promise<void> {
    const id = randomUUID();
    const memory = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.vectorMemories.set(id, memory);
  }

  // Caregivers
  async getCaregiverContacts(userId: string): Promise<CaregiverContact[]> {
    return Array.from(this.caregiverContacts.values()).filter(c => c.userId === userId);
  }

  async createCaregiverContact(userId: string, data: any): Promise<CaregiverContact> {
    const id = randomUUID();
    const contact: CaregiverContact = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    } as CaregiverContact;
    this.caregiverContacts.set(id, contact);
    return contact;
  }

  async createCaregiverNotification(caregiverId: string, userId: string, data: any): Promise<void> {
    const id = randomUUID();
    const notification = {
      id,
      caregiverId,
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.caregiverNotifications.set(id, notification);
  }

  // Summaries
  async createSummary(userId: string, data: any): Promise<void> {
    const id = randomUUID();
    const summary = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.summaries.set(id, summary);
  }

  async getRecentSummaries(userId: string, summaryType: string, count: number): Promise<any[]> {
    return Array.from(this.summaries.values())
      .filter(s => s.userId === userId && s.summaryType === summaryType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count);
  }

  // Context Snapshots
  async createContextSnapshot(userId: string, data: any): Promise<void> {
    const id = randomUUID();
    const snapshot = {
      id,
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.contextSnapshots.set(id, snapshot);
  }

  async getContextSnapshots(userId: string, count: number): Promise<any[]> {
    return Array.from(this.contextSnapshots.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, count);
  }

  // Health Vitals
  private healthVitals: Map<string, any> = new Map();

  async createHealthVital(userId: string, data: any): Promise<any> {
    const id = randomUUID();
    const vital = {
      id,
      userId,
      ...data,
      loggedAt: data.loggedAt || new Date(),
      createdAt: new Date(),
    };
    this.healthVitals.set(id, vital);
    return vital;
  }

  async getTodayVitals(userId: string, vitalType?: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.healthVitals.values())
      .filter(v => {
        const matchesUser = v.userId === userId;
        const matchesDate = new Date(v.loggedAt) >= today;
        const matchesType = !vitalType || v.vitalType === vitalType;
        return matchesUser && matchesDate && matchesType;
      })
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  }

  async getRecentVitals(userId: string, vitalType: string, count: number): Promise<any[]> {
    return Array.from(this.healthVitals.values())
      .filter(v => v.userId === userId && v.vitalType === vitalType)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, count);
  }

  async getMealStreak(userId: string): Promise<number> {
    const meals = Array.from(this.mealLogs.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    
    return this.calculateStreak(meals.map(m => m.loggedAt));
  }

  async getVitalsStreak(userId: string): Promise<number> {
    const vitals = Array.from(this.healthVitals.values())
      .filter(v => v.userId === userId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    
    return this.calculateStreak(vitals.map(v => v.loggedAt));
  }

  async getMedicationStreak(userId: string): Promise<number> {
    const schedules = Array.from(this.medicationSchedules.values())
      .filter(s => s.userId === userId && s.takenAt)
      .sort((a, b) => new Date(b.takenAt!).getTime() - new Date(a.takenAt!).getTime());
    
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

import { DatabaseStorage } from "./storage-db";

// Use database if available, otherwise use in-memory storage
function createStorage(): IStorage {
  try {
    if (process.env.DATABASE_URL) {
      console.log("Using PostgreSQL database storage");
      return new DatabaseStorage();
    }
  } catch (error) {
    console.warn("Failed to initialize database, falling back to memory storage:", error);
  }
  
  console.log("Using in-memory storage");
  return new MemStorage();
}

export const storage = createStorage();
