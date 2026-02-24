import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "./use-geolocation";

// ============================================
// TWIN STATE
// ============================================

export function useTwinState() {
  return useQuery({
    queryKey: ["twin-state"],
    queryFn: api.getTwinState,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useStreaks() {
  return useQuery({
    queryKey: ["streaks"],
    queryFn: api.getStreaks,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useMotivation() {
  return useQuery({
    queryKey: ["motivation"],
    queryFn: api.getMotivation,
    refetchInterval: 3600000, // Refresh every hour
  });
}

export function useDailyQuote() {
  return useQuery({
    queryKey: ["daily-quote"],
    queryFn: api.getDailyQuote,
    staleTime: 86400000, // 24 hours - quote changes daily
  });
}

export function useFutureSelfPrediction() {
  return useQuery({
    queryKey: ["future-self"],
    queryFn: api.getFutureSelfPrediction,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useExerciseMotivation() {
  return useQuery({
    queryKey: ["exercise-motivation"],
    queryFn: api.getExerciseMotivation,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useVitalsMotivation() {
  return useQuery({
    queryKey: ["vitals-motivation"],
    queryFn: api.getVitalsMotivation,
    staleTime: 300000, // 5 minutes
  });
}

export function useSymptomsMotivation() {
  return useQuery({
    queryKey: ["symptoms-motivation"],
    queryFn: api.getSymptomsMotivation,
    staleTime: 300000, // 5 minutes
  });
}

export function useMedicationsMotivation() {
  return useQuery({
    queryKey: ["medications-motivation"],
    queryFn: api.getMedicationsMotivation,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// MEDICATIONS
// ============================================

export function useMedications() {
  return useQuery({
    queryKey: ["medications"],
    queryFn: api.getMedications,
  });
}

export function useTodayMedications() {
  return useQuery({
    queryKey: ["medications", "today"],
    queryFn: api.getTodayMedications,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useMarkMedicationTaken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ medicationId, takenAt }: { medicationId: string; takenAt?: Date }) =>
      api.markMedicationTaken(medicationId, takenAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Medication logged",
        description: "Your medication has been marked as taken.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSnoozeMedication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ medicationId, snoozeMinutes }: { medicationId: string; snoozeMinutes?: number }) =>
      api.snoozeMedication(medicationId, snoozeMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Medication snoozed",
        description: "Reminder will appear in 30 minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMedicationAdherence() {
  return useQuery({
    queryKey: ["medications", "adherence"],
    queryFn: api.getMedicationAdherence,
  });
}

// ============================================
// MEALS
// ============================================

export function useTodayMeals() {
  return useQuery({
    queryKey: ["meals", "today"],
    queryFn: api.getTodayMeals,
    refetchInterval: 30000,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.createMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Meal logged",
        description: "Your meal has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Meal deleted",
        description: "The meal entry has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: number; data: { foods?: string; estimatedCalories?: number } }) => 
      api.updateMeal(mealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast({
        title: "Meal updated",
        description: "Your meal has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// SYMPTOMS
// ============================================

export function useRecentSymptoms(days = 7) {
  return useQuery({
    queryKey: ["symptoms", "recent", days],
    queryFn: () => api.getRecentSymptoms(days),
  });
}

export function useCreateSymptom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.createSymptom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Symptom logged",
        description: "Your symptom has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// ACTIVITIES
// ============================================

export function useRecentActivities(count = 10) {
  return useQuery({
    queryKey: ["activities", "recent", count],
    queryFn: () => api.getRecentActivities(count),
  });
}

export function useTodayActivities() {
  return useQuery({
    queryKey: ["activities", "today"],
    queryFn: () => api.getTodayActivities(),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Activity logged",
        description: "Your activity has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// RISK ALERTS
// ============================================

export function useCurrentRisks() {
  return useQuery({
    queryKey: ["risks", "current"],
    queryFn: api.getCurrentRisks,
    refetchInterval: 60000,
  });
}

// ============================================
// CONTEXT
// ============================================

export function useCurrentContext() {
  return useQuery({
    queryKey: ["context", "current"],
    queryFn: api.getCurrentContext,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useWeather(location?: string) {
  // Get user's geolocation
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  
  // Get user profile for preferred location
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userLocation = (userData as any)?.user?.location;
  
  // Log geolocation status for debugging
  if (geoError) {
    console.warn("Geolocation error:", geoError);
  }
  
  // Priority: 1. Provided location, 2. User's saved location, 3. GPS coordinates
  const weatherLocation = location 
    ? location 
    : userLocation 
      ? userLocation 
      : (latitude && longitude ? `${latitude},${longitude}` : undefined);

  console.log("Weather location:", weatherLocation, "User location:", userLocation, "Coords:", latitude, longitude);

  return useQuery({
    queryKey: ["weather", weatherLocation],
    queryFn: () => api.getWeather(weatherLocation),
    refetchInterval: 600000, // Refresh every 10 minutes
    enabled: !geoLoading && !userLoading, // Wait for both geolocation and user data to finish
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache at all (renamed from cacheTime in React Query v5)
  });
}

// ============================================
// LEARNING & INSIGHTS
// ============================================

export function useUserPreferences() {
  return useQuery({
    queryKey: ["insights", "preferences"],
    queryFn: () => api.getUserPreferences(),
    staleTime: 300000, // 5 minutes
  });
}

export function useMealSuggestion() {
  return useQuery({
    queryKey: ["insights", "meal-suggestion"],
    queryFn: () => api.getMealSuggestion(),
    refetchInterval: 3600000, // Refresh every hour
  });
}

export function useSymptomPrediction() {
  return useQuery({
    queryKey: ["insights", "symptom-prediction"],
    queryFn: () => api.getSymptomPrediction(),
    refetchInterval: 1800000, // Refresh every 30 minutes
  });
}

export function useActivitySuggestion() {
  return useQuery({
    queryKey: ["insights", "activity-suggestion"],
    queryFn: () => api.getActivitySuggestion(),
    refetchInterval: 3600000, // Refresh every hour
  });
}

export function useMedicationTiming(medicationName: string) {
  return useQuery({
    queryKey: ["insights", "medication-timing", medicationName],
    queryFn: () => api.getMedicationTiming(medicationName),
    enabled: !!medicationName,
    staleTime: 86400000, // 24 hours
  });
}

// ============================================
// CHAT
// ============================================

export function useConversationHistory(limit = 50) {
  return useQuery({
    queryKey: ["conversation", "history", limit],
    queryFn: () => api.getConversationHistory(limit),
  });
}

export function useClearConversationHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.clearConversationHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      toast({
        title: "Chat cleared",
        description: "Your conversation history has been cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// SUMMARIES
// ============================================

export function useSummary(type: "morning" | "evening" | "weekly" | "doctor_visit") {
  return useQuery({
    queryKey: ["summary", type],
    queryFn: () => api.getSummary(type),
    staleTime: 3600000, // 1 hour
  });
}

// ============================================
// CAREGIVERS
// ============================================

export function useCaregivers() {
  return useQuery({
    queryKey: ["caregivers"],
    queryFn: api.getCaregivers,
  });
}

export function useCreateCaregiver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.createCaregiver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregivers"] });
      toast({
        title: "Caregiver added",
        description: "Caregiver contact has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendCaregiverUpdate() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ message, includeData }: { message?: string; includeData?: string[] }) =>
      api.sendCaregiverUpdate(message, includeData),
    onSuccess: (data) => {
      toast({
        title: "Update sent!",
        description: `Progress update sent to ${data.recipientCount} caregiver(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send update",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// NUTRITION
// ============================================

export function useNutritionRecommendations() {
  return useQuery({
    queryKey: ["nutrition", "recommendations"],
    queryFn: api.getNutritionRecommendations,
    staleTime: 3600000, // 1 hour
  });
}

export function useAnalyzeMealPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ imageUrl, mealType }: { imageUrl: string; mealType?: string }) =>
      api.analyzeMealPhoto(imageUrl, mealType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["twin-state"] });
      toast({
        title: "Meal analyzed",
        description: "Your meal photo has been analyzed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}


// ============================================
// FILE UPLOADS
// ============================================

export function useUploadPrescription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.uploadPrescription,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["medications", "today"] });
      toast({
        title: "Prescription uploaded",
        description: `Extracted ${data.extracted.medications?.length || 0} medications`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadMealPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, mealType }: { file: File; mealType?: string }) =>
      api.uploadMealPhoto(file, mealType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast({
        title: "Meal analyzed",
        description: `Health score: ${data.analysis.healthScore}/100`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}


// ============================================
// USER API
// ============================================

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: api.getCurrentUser,
    staleTime: 0, // Always refetch when invalidated
    gcTime: 0, // Don't cache at all (replaces cacheTime in v5)
    refetchOnMount: 'always', // Always refetch when component mounts
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name?: string; ageGroup?: string; language?: string; location?: string }) => {
      const userId = localStorage.getItem("sahai-user-id");
      if (!userId) throw new Error("User not found");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (responseData) => {
      console.log("Profile update success, returned data:", responseData);
      
      // Invalidate queries to force refetch with fresh data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["weather"] });
      
      console.log("Cache invalidated, will refetch fresh data");
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
}

// ============================================
// VOICE (TTS & STT)
// ============================================

export function useTextToSpeech() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ text, voiceId, options }: { text: string; voiceId?: string; options?: any }) =>
      api.textToSpeech(text, voiceId, options),
    onError: (error: Error) => {
      toast({
        title: "Voice synthesis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSpeechToText() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.speechToText,
    onError: (error: Error) => {
      toast({
        title: "Speech recognition failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAvailableVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: api.getAvailableVoices,
    staleTime: Infinity, // Voices don't change
  });
}

// ============================================
// HEALTH VITALS API
// ============================================

export function useTodayVitals(vitalType?: string) {
  return useQuery({
    queryKey: ["vitals", "today", vitalType],
    queryFn: () => api.getTodayVitals(vitalType),
  });
}

export function useRecentVitals(vitalType: string, count = 10) {
  return useQuery({
    queryKey: ["vitals", "recent", vitalType, count],
    queryFn: () => api.getRecentVitals(vitalType, count),
  });
}

export function useCreateVital() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    any,
    Error,
    Parameters<typeof api.createVital>[0]
  >({
    mutationFn: api.createVital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vitals"] });
      toast({
        title: "Vital logged",
        description: "Your health vital has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log vital",
        variant: "destructive",
      });
    },
  });
}
