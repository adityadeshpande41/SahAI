export interface Medication {
  id: number;
  name: string;
  dose: string;
  timing: string;
  beforeFood: boolean;
  frequency: string;
  taken: boolean;
  snoozed: boolean;
  missed: boolean;
  confidence?: number;
}

export interface Meal {
  id: number;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  time: string;
  foods: string;
  hydration?: string;
  logged: boolean;
}

export interface SymptomEntry {
  id: number;
  symptom: string;
  severity: number;
  time: string;
  date: string;
  notes?: string;
}

export interface ActivityEntry {
  id: number;
  activity: string;
  time: string;
  date: string;
}

export interface ChatMessage {
  id: number;
  sender: "user" | "sahai";
  text: string;
  time: string;
}

export interface RiskGuidance {
  level: "low" | "medium" | "high";
  title: string;
  unusual: string;
  why: string;
  action: string;
  baseline: string;
  triggers: string[];
}

export interface StatusChip {
  id: string;
  label: string;
  type: "warning" | "caution" | "info" | "success";
  icon: string;
}

export const userProfile = {
  name: "Aditya",
  ageGroup: "65-74",
  language: "English",
  avatar: "",
};

export const medications: Medication[] = [
  { id: 1, name: "Metformin", dose: "500mg", timing: "8:00 AM", beforeFood: false, frequency: "Twice daily", taken: false, snoozed: false, missed: false, confidence: 95 },
  { id: 2, name: "Amlodipine", dose: "5mg", timing: "9:00 AM", beforeFood: true, frequency: "Once daily", taken: true, snoozed: false, missed: false, confidence: 98 },
  { id: 3, name: "Atorvastatin", dose: "10mg", timing: "9:00 PM", beforeFood: false, frequency: "Once daily", taken: false, snoozed: false, missed: false, confidence: 92 },
  { id: 4, name: "Vitamin D3", dose: "1000 IU", timing: "8:00 AM", beforeFood: false, frequency: "Once daily", taken: true, snoozed: false, missed: false, confidence: 99 },
  { id: 5, name: "Metformin", dose: "500mg", timing: "8:00 PM", beforeFood: false, frequency: "Twice daily", taken: false, snoozed: false, missed: false, confidence: 95 },
];

export const todayMeals: Meal[] = [
  { id: 1, type: "breakfast", time: "8:30 AM", foods: "Oatmeal with bananas, green tea", hydration: "1 glass water", logged: true },
  { id: 2, type: "lunch", time: "", foods: "", hydration: "", logged: false },
  { id: 3, type: "dinner", time: "", foods: "", hydration: "", logged: false },
];

export const recentSymptoms: SymptomEntry[] = [
  { id: 1, symptom: "Dizziness", severity: 2, time: "2:30 PM", date: "Today", notes: "Felt light-headed after standing up quickly" },
  { id: 2, symptom: "Fatigue", severity: 3, time: "11:00 AM", date: "Yesterday" },
  { id: 3, symptom: "Headache", severity: 1, time: "6:00 PM", date: "2 days ago", notes: "Mild tension headache" },
  { id: 4, symptom: "Dizziness", severity: 2, time: "3:15 PM", date: "3 days ago" },
];

export const recentActivities: ActivityEntry[] = [
  { id: 1, activity: "Walking", time: "7:00 AM", date: "Today" },
  { id: 2, activity: "Resting", time: "10:30 AM", date: "Today" },
  { id: 3, activity: "Walking", time: "6:30 AM", date: "Yesterday" },
  { id: 4, activity: "Going out", time: "4:00 PM", date: "Yesterday" },
  { id: 5, activity: "Back home", time: "5:30 PM", date: "Yesterday" },
];

export const statusChips: StatusChip[] = [
  { id: "med", label: "Med due soon", type: "warning", icon: "pill" },
  { id: "meal", label: "Lunch not logged", type: "caution", icon: "utensils" },
  { id: "hydration", label: "Drink water", type: "info", icon: "droplets" },
];

export const riskGuidance: RiskGuidance = {
  level: "medium",
  title: "Lunch is delayed and medication is due",
  unusual: "Your lunch is later than usual (typically 12:30 PM). Your evening Metformin should be taken after food.",
  why: "Delayed meals can affect blood sugar levels and medication timing. Metformin works best when taken consistently with food.",
  action: "Try to have lunch within the next 30 minutes, then take your Metformin as planned.",
  baseline: "You usually eat lunch between 12:00-12:45 PM",
  triggers: ["Lunch delayed by 1.5 hours", "Metformin 500mg due at 8 PM (after food)", "Blood sugar may be affected"],
};

export const twinState = {
  state: "drift" as "routine" | "drift" | "concern",
  message: "Lunch is delayed and medication is due soon",
  score: 72,
};

export const demoConversations: Record<string, ChatMessage[]> = {
  "I took my meds": [
    { id: 1, sender: "user", text: "I took my meds", time: "2:15 PM" },
    { id: 2, sender: "sahai", text: "Which medicine did you take?", time: "2:15 PM" },
    { id: 3, sender: "user", text: "The morning one", time: "2:16 PM" },
    { id: 4, sender: "sahai", text: "Got it! I've marked Metformin 500mg as taken. You took it a bit late today (usually 8 AM). Your next medication is Atorvastatin 10mg at 9 PM tonight.", time: "2:16 PM" },
  ],
  "I ate": [
    { id: 1, sender: "user", text: "I ate", time: "1:45 PM" },
    { id: 2, sender: "sahai", text: "Was that a meal or a snack?", time: "1:45 PM" },
    { id: 3, sender: "user", text: "Lunch", time: "1:46 PM" },
    { id: 4, sender: "sahai", text: "I've logged your lunch at 1:45 PM. That's a bit later than usual. What did you have? This will help me check if it works with your medication schedule.", time: "1:46 PM" },
  ],
  "I feel weird": [
    { id: 1, sender: "user", text: "I feel weird", time: "3:00 PM" },
    { id: 2, sender: "sahai", text: "I'm sorry to hear that. Can you tell me more? Are you feeling dizzy, weak, nauseous, or something else?", time: "3:00 PM" },
    { id: 3, sender: "user", text: "A bit dizzy", time: "3:01 PM" },
    { id: 4, sender: "sahai", text: "I've noted dizziness at 3 PM. You've reported dizziness twice this week, usually in the afternoon. This could be related to your delayed lunch today. Please sit down, drink some water, and eat something light. If it gets worse, I can alert your caregiver.", time: "3:01 PM" },
  ],
  "What's unusual today?": [
    { id: 1, sender: "user", text: "What's unusual today?", time: "2:00 PM" },
    { id: 2, sender: "sahai", text: "Here's what I've noticed today:\n\n1. Your lunch is delayed - you usually eat by 12:30 PM\n2. Morning Metformin was taken late (2:15 PM instead of 8 AM)\n3. You reported mild dizziness earlier\n\nOverall, your routine has drifted a bit from your usual pattern. I'd recommend having lunch soon and staying hydrated.", time: "2:00 PM" },
  ],
};

export const weatherData = {
  temp: "32C",
  condition: "Warm & Humid",
  advisory: "Stay hydrated. Avoid outdoor activity between 12-3 PM.",
  icon: "sun",
};

export const weeklyInsights = {
  medAdherence: 85,
  mealsLogged: 18,
  totalMeals: 21,
  symptomsReported: 4,
  driftEvents: 3,
  topSymptom: "Dizziness",
  averageRoutineScore: 78,
  trend: "stable" as "improving" | "stable" | "declining",
};

export const symptomQuickOptions = [
  "Dizzy", "Nausea", "Headache", "Pain", "Fatigue", "Weakness", "Breathless", "Other",
];

export const activityQuickOptions = [
  { label: "Walking", icon: "footprints" },
  { label: "Resting", icon: "bed" },
  { label: "Going out", icon: "door-open" },
  { label: "Back home", icon: "home" },
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
