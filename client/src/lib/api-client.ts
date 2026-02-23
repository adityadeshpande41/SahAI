// API Client for SahAI Backend

const API_BASE = "/api";

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(), // Temporary auth
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Temporary user ID management (replace with real auth later)
function getUserId(): string {
  const userId = localStorage.getItem("sahai-user-id");
  return userId || ""; // Return empty string if no user ID, don't auto-create
}

// ============================================
// CHAT / CONVERSATION API
// ============================================

export async function sendMessage(message: string) {
  return apiCall<{ reply: string; needsFollowUp: boolean; followUpQuestion?: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getConversationHistory(limit = 50) {
  return apiCall<{ history: any[] }>(`/conversation/history?limit=${limit}`);
}

export async function clearConversationHistory() {
  return apiCall<{ success: boolean; message: string }>("/conversation/history", {
    method: "DELETE",
  });
}

// ============================================
// ROUTINE TWIN API
// ============================================

export async function getTwinState() {
  return apiCall<{
    state: "routine" | "drift" | "concern";
    score: number;
    message: string;
    driftReasons: string[];
  }>("/twin/state");
}

export async function updateTwinBaseline() {
  return apiCall<{ success: boolean; message: string }>("/twin/update-baseline", {
    method: "POST",
  });
}

// ============================================
// RISK ALERTS API
// ============================================

export async function getCurrentRisks() {
  return apiCall<{ alerts: any[] }>("/risks/current");
}

// ============================================
// MEDICATIONS API
// ============================================

export async function getMedications() {
  return apiCall<{ medications: any[] }>("/medications");
}

export async function createMedication(data: any) {
  return apiCall<{ medication: any }>("/medications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTodayMedications() {
  return apiCall<{ schedule: any[] }>("/medications/today");
}

export async function markMedicationTaken(medicationId: string, takenAt?: Date) {
  return apiCall<{ success: boolean }>(`/medications/${medicationId}/take`, {
    method: "POST",
    body: JSON.stringify({ takenAt: takenAt?.toISOString() }),
  });
}

export async function snoozeMedication(medicationId: string, snoozeMinutes: number = 30) {
  return apiCall<{ success: boolean }>(`/medications/${medicationId}/snooze`, {
    method: "POST",
    body: JSON.stringify({ snoozeMinutes }),
  });
}

export async function explainMedication(medicationName: string, language?: string) {
  return apiCall<any>("/medications/explain", {
    method: "POST",
    body: JSON.stringify({ medicationName, language }),
  });
}

export async function extractPrescription(imageUrl: string) {
  return apiCall<any>("/medications/extract-prescription", {
    method: "POST",
    body: JSON.stringify({ imageUrl }),
  });
}

export async function getMedicationAdherence() {
  return apiCall<{
    week: any;
    month: any;
    mostMissed: any[];
    trend: string;
  }>("/medications/adherence");
}

// ============================================
// MEALS API
// ============================================

export async function createMeal(data: {
  mealType: string;
  foods: string;
  loggedAt: Date | string;
  hydration?: string;
  estimatedCalories?: number;
}) {
  try {
    const loggedAtISO = data.loggedAt instanceof Date 
      ? data.loggedAt.toISOString() 
      : new Date(data.loggedAt).toISOString();
    
    return apiCall<{ meal: any }>("/meals", {
      method: "POST",
      body: JSON.stringify({
        mealType: data.mealType,
        foods: data.foods,
        loggedAt: loggedAtISO,
        hydration: data.hydration,
        estimatedCalories: data.estimatedCalories,
      }),
    });
  } catch (error: any) {
    console.error("Error creating meal:", error);
    throw new Error(error.message || "Failed to log meal");
  }
}

export async function getTodayMeals() {
  return apiCall<{ meals: any[] }>("/meals/today");
}

// ============================================
// SYMPTOMS API
// ============================================

export async function createSymptom(data: {
  symptom: string;
  severity: number;
  loggedAt: Date | string;
  notes?: string;
}) {
  try {
    const loggedAtISO = data.loggedAt instanceof Date 
      ? data.loggedAt.toISOString() 
      : new Date(data.loggedAt).toISOString();
    
    return apiCall<{ symptom: any }>("/symptoms", {
      method: "POST",
      body: JSON.stringify({
        symptom: data.symptom,
        severity: data.severity,
        notes: data.notes,
        loggedAt: loggedAtISO,
      }),
    });
  } catch (error: any) {
    console.error("Error creating symptom:", error);
    throw new Error(error.message || "Failed to log symptom");
  }
}

export async function getRecentSymptoms(days = 7) {
  return apiCall<{ symptoms: any[] }>(`/symptoms/recent?days=${days}`);
}

// ============================================
// ACTIVITIES API
// ============================================

export async function createActivity(data: {
  activity: string;
  loggedAt: Date | string;
  duration?: number;
}) {
  try {
    const loggedAtISO = data.loggedAt instanceof Date 
      ? data.loggedAt.toISOString() 
      : new Date(data.loggedAt).toISOString();
    
    return apiCall<{ activity: any }>("/activities", {
      method: "POST",
      body: JSON.stringify({
        activity: data.activity,
        duration: data.duration,
        loggedAt: loggedAtISO,
      }),
    });
  } catch (error: any) {
    console.error("Error creating activity:", error);
    throw new Error(error.message || "Failed to log activity");
  }
}

export async function getRecentActivities(count = 10) {
  return apiCall<{ activities: any[] }>(`/activities/recent?count=${count}`);
}

export async function getTodayActivities() {
  return apiCall<{ activities: any[] }>("/activities/today");
}

// ============================================
// NUTRITION API
// ============================================

export async function analyzeMealPhoto(imageUrl: string, mealType?: string) {
  return apiCall<any>("/nutrition/analyze-photo", {
    method: "POST",
    body: JSON.stringify({ imageUrl, mealType }),
  });
}

export async function getNutritionRecommendations() {
  return apiCall<any>("/nutrition/recommendations");
}

// ============================================
// SUMMARIES API
// ============================================

export async function getSummary(type: "morning" | "evening" | "weekly" | "doctor_visit") {
  return apiCall<any>(`/summaries/${type}`);
}

export async function getSummaryHistory(type: string, limit = 10) {
  return apiCall<{ summaries: any[] }>(`/summaries/${type}/history?limit=${limit}`);
}

// ============================================
// CAREGIVER API
// ============================================

export async function getCaregivers() {
  return apiCall<{ caregivers: any[] }>("/caregivers");
}

export async function createCaregiver(data: any) {
  return apiCall<{ caregiver: any }>("/caregivers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendCaregiverAlert(riskAlert: any, urgency: "low" | "medium" | "high") {
  return apiCall<any>("/caregivers/alert", {
    method: "POST",
    body: JSON.stringify({ riskAlert, urgency }),
  });
}

export async function sendCaregiverUpdate(message?: string, includeData?: string[]) {
  return apiCall<any>("/caregivers/send-update", {
    method: "POST",
    body: JSON.stringify({ message, includeData }),
  });
}

// ============================================
// CONTEXT API
// ============================================

export async function getCurrentContext() {
  return apiCall<any>("/context/current");
}

export async function getWeather(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : "";
  return apiCall<any>(`/context/weather${query}`);
}

// ============================================
// LEARNING & INSIGHTS API
// ============================================

export async function getUserPreferences() {
  return apiCall<any>("/insights/preferences");
}

export async function getMealSuggestion() {
  return apiCall<any>("/insights/meal-suggestion");
}

export async function getSymptomPrediction() {
  return apiCall<any>("/insights/symptom-prediction");
}

export async function getActivitySuggestion() {
  return apiCall<any>("/insights/activity-suggestion");
}

export async function getMedicationTiming(medicationName: string) {
  return apiCall<any>(`/insights/medication-timing/${encodeURIComponent(medicationName)}`);
}

export async function updateLocation(locationState: "home" | "outside" | "traveling" | "unknown") {
  return apiCall<any>("/context/location", {
    method: "POST",
    body: JSON.stringify({ locationState }),
  });
}

// ============================================
// VOICE API (TTS & STT)
// ============================================

export async function textToSpeech(text: string, voiceId?: string, options?: any) {
  const response = await fetch(`${API_BASE}/voice/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
    },
    body: JSON.stringify({ text, voiceId, options }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "TTS failed" }));
    throw new Error(error.error || `TTS failed: ${response.status}`);
  }

  return response.blob();
}

export async function speechToText(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${API_BASE}/voice/stt`, {
    method: "POST",
    headers: {
      "x-user-id": getUserId(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "STT failed" }));
    throw new Error(error.error || `STT failed: ${response.status}`);
  }

  return response.json();
}

export async function getAvailableVoices() {
  return apiCall<{ voices: any[] }>("/voice/voices");
}

// ============================================
// FILE UPLOAD API
// ============================================

export async function uploadPrescription(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload/prescription`, {
    method: "POST",
    headers: {
      "x-user-id": getUserId(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function uploadMealPhoto(file: File, mealType?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (mealType) {
    formData.append("mealType", mealType);
  }

  const response = await fetch(`${API_BASE}/upload/meal-photo`, {
    method: "POST",
    headers: {
      "x-user-id": getUserId(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || `Upload failed: ${response.status}`);
  }

  return response.json();
}

// ============================================
// USER API
// ============================================

export async function createUser(data: {
  username: string;
  password: string;
  name?: string;
  ageGroup?: string;
  language?: string;
}) {
  return apiCall<{ user: any }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser() {
  return apiCall<{ user: any }>("/users/me");
}
