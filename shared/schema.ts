import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  ageGroup: text("age_group"),
  language: text("language").default("English"),
  location: text("location"), // User's preferred city/location for weather
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Preferences
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  largeText: boolean("large_text").default(false),
  highContrast: boolean("high_contrast").default(false),
  simpleLanguage: boolean("simple_language").default(false),
  voiceFirst: boolean("voice_first").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Routine Baseline (Twin Memory)
export const routineBaseline = pgTable("routine_baseline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  wakeTimeUsual: text("wake_time_usual"),
  breakfastWindowStart: text("breakfast_window_start"),
  breakfastWindowEnd: text("breakfast_window_end"),
  lunchWindowStart: text("lunch_window_start"),
  lunchWindowEnd: text("lunch_window_end"),
  dinnerWindowStart: text("dinner_window_start"),
  dinnerWindowEnd: text("dinner_window_end"),
  sleepTimeUsual: text("sleep_time_usual"),
  activityPatterns: jsonb("activity_patterns"), // {morning_walk: true, afternoon_rest: true}
  medicationBehavior: jsonb("medication_behavior"), // adherence patterns
  symptomFrequency: jsonb("symptom_frequency"), // baseline symptom patterns
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medications
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dose: text("dose").notNull(),
  frequency: text("frequency").notNull(),
  beforeFood: boolean("before_food").default(false),
  timing: text("timing").notNull(), // "8:00 AM"
  active: boolean("active").default(true),
  prescriptionImageUrl: text("prescription_image_url"),
  extractionConfidence: real("extraction_confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medication Schedule (daily instances)
export const medicationSchedule = pgTable("medication_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: varchar("medication_id").notNull().references(() => medications.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scheduledTime: timestamp("scheduled_time").notNull(),
  taken: boolean("taken").default(false),
  takenAt: timestamp("taken_at"),
  snoozed: boolean("snoozed").default(false),
  missed: boolean("missed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("med_schedule_user_idx").on(table.userId),
  timeIdx: index("med_schedule_time_idx").on(table.scheduledTime),
}));

// Meal Logs
export const mealLogs = pgTable("meal_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  loggedAt: timestamp("logged_at").notNull(),
  foods: text("foods"),
  hydration: text("hydration"),
  photoUrl: text("photo_url"),
  nutritionData: jsonb("nutrition_data"), // {calories, protein, carbs, etc}
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("meal_logs_user_idx").on(table.userId),
  timeIdx: index("meal_logs_time_idx").on(table.loggedAt),
}));

// Symptom Logs
export const symptomLogs = pgTable("symptom_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symptom: text("symptom").notNull(),
  severity: integer("severity").notNull(), // 1-5
  loggedAt: timestamp("logged_at").notNull(),
  notes: text("notes"),
  contextSnapshot: jsonb("context_snapshot"), // weather, location, recent meals/meds
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("symptom_logs_user_idx").on(table.userId),
  timeIdx: index("symptom_logs_time_idx").on(table.loggedAt),
}));

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activity: text("activity").notNull(), // walking, resting, going out, back home
  loggedAt: timestamp("logged_at").notNull(),
  duration: integer("duration"), // minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("activity_logs_user_idx").on(table.userId),
  timeIdx: index("activity_logs_time_idx").on(table.loggedAt),
}));

// Health Vitals (Blood Sugar, Blood Pressure, etc.)
export const healthVitals = pgTable("health_vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vitalType: text("vital_type").notNull(), // blood_sugar, blood_pressure, weight, heart_rate
  // Blood Sugar fields
  bloodSugar: real("blood_sugar"), // mg/dL
  measurementType: text("measurement_type"), // fasting, post_meal, random
  // Blood Pressure fields
  systolic: integer("systolic"), // mmHg
  diastolic: integer("diastolic"), // mmHg
  // Other vitals
  weight: real("weight"), // kg
  heartRate: integer("heart_rate"), // bpm
  // Common fields
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("health_vitals_user_idx").on(table.userId),
  typeIdx: index("health_vitals_type_idx").on(table.vitalType),
  loggedAtIdx: index("health_vitals_logged_at_idx").on(table.loggedAt),
}));

// Context Snapshots
export const contextSnapshots = pgTable("context_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  capturedAt: timestamp("captured_at").notNull(),
  locationState: text("location_state"), // home, outside, traveling, unknown
  weather: jsonb("weather"), // {temp, condition, advisory}
  currentActivity: text("current_activity"),
  lastMeal: text("last_meal"),
  nextMed: text("next_med"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("context_snapshots_user_idx").on(table.userId),
  timeIdx: index("context_snapshots_time_idx").on(table.capturedAt),
}));

// Event Logs (Natural Language + Parsed)
export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rawInput: text("raw_input").notNull(),
  eventType: text("event_type").notNull(), // med_taken, meal_logged, symptom_reported, etc
  parsedData: jsonb("parsed_data").notNull(),
  confidence: real("confidence"),
  ambiguous: boolean("ambiguous").default(false),
  resolvedBy: varchar("resolved_by"), // reference to follow-up event
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("event_logs_user_idx").on(table.userId),
  typeIdx: index("event_logs_type_idx").on(table.eventType),
}));

// Risk Alerts
export const riskAlerts = pgTable("risk_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: text("level").notNull(), // low, medium, high
  title: text("title").notNull(),
  unusual: text("unusual").notNull(),
  why: text("why").notNull(),
  action: text("action").notNull(),
  baseline: text("baseline"),
  triggers: jsonb("triggers"), // array of trigger strings
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("risk_alerts_user_idx").on(table.userId),
  levelIdx: index("risk_alerts_level_idx").on(table.level),
}));

// Caregiver Contacts
export const caregiverContacts = pgTable("caregiver_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship"),
  phone: text("phone"),
  email: text("email"),
  sharingLevel: text("sharing_level").default("emergency_only"), // emergency_only, daily_summary, meds_only
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Caregiver Notifications
export const caregiverNotifications = pgTable("caregiver_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caregiverId: varchar("caregiver_id").notNull().references(() => caregiverContacts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(), // alert, summary
  content: text("content").notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Summaries
export const summaries = pgTable("summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summaryType: text("summary_type").notNull(), // morning, evening, weekly, doctor_visit
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // structured data used to generate summary
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("summaries_user_idx").on(table.userId),
  typeIdx: index("summaries_type_idx").on(table.summaryType),
}));

// Documents/Uploads
export const documentsUploads = pgTable("documents_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // prescription, meal_photo
  fileUrl: text("file_url").notNull(),
  extractedData: jsonb("extracted_data"),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ambiguity Aliases (User-specific shortcuts)
export const ambiguityAliases = pgTable("ambiguity_aliases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(), // "BP med", "it"
  resolvedTo: text("resolved_to").notNull(), // "Amlodipine"
  entityType: text("entity_type").notNull(), // medication, meal, activity
  usageCount: integer("usage_count").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vector Memory (RAG)
export const vectorMemory = pgTable("vector_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memoryType: text("memory_type").notNull(), // routine_pattern, medication_info, symptom_pattern
  content: text("content").notNull(),
  embedding: jsonb("embedding"), // store as JSON array for now, migrate to pgvector later
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("vector_memory_user_idx").on(table.userId),
  typeIdx: index("vector_memory_type_idx").on(table.memoryType),
}));

// Conversation History
export const conversationHistory = pgTable("conversation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // user, sahai
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // parsed intent, entities, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("conversation_history_user_idx").on(table.userId),
  timeIdx: index("conversation_history_time_idx").on(table.createdAt),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  ageGroup: true,
  language: true,
  location: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertRoutineBaselineSchema = createInsertSchema(routineBaseline).omit({ id: true, updatedAt: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });
export const insertMedicationScheduleSchema = createInsertSchema(medicationSchedule).omit({ id: true, createdAt: true });
export const insertMealLogSchema = createInsertSchema(mealLogs).omit({ id: true, createdAt: true });
export const insertSymptomLogSchema = createInsertSchema(symptomLogs).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertContextSnapshotSchema = createInsertSchema(contextSnapshots).omit({ id: true, createdAt: true });
export const insertEventLogSchema = createInsertSchema(eventLogs).omit({ id: true, createdAt: true });
export const insertRiskAlertSchema = createInsertSchema(riskAlerts).omit({ id: true, createdAt: true });
export const insertCaregiverContactSchema = createInsertSchema(caregiverContacts).omit({ id: true, createdAt: true });
export const insertConversationHistorySchema = createInsertSchema(conversationHistory).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type RoutineBaseline = typeof routineBaseline.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationSchedule = typeof medicationSchedule.$inferSelect;
export type MealLog = typeof mealLogs.$inferSelect;
export type SymptomLog = typeof symptomLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type ContextSnapshot = typeof contextSnapshots.$inferSelect;
export type EventLog = typeof eventLogs.$inferSelect;
export type RiskAlert = typeof riskAlerts.$inferSelect;
export type CaregiverContact = typeof caregiverContacts.$inferSelect;
export type ConversationHistory = typeof conversationHistory.$inferSelect;

// Push Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("push_subscriptions_user_idx").on(table.userId),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export type HealthVital = typeof healthVitals.$inferSelect;
export type InsertHealthVital = typeof healthVitals.$inferInsert;
