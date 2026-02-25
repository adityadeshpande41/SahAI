import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UtensilsCrossed,
  Plus,
  Camera,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Pill,
  Check,
  Loader2,
  Mic,
  Zap,
  Pencil,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTodayMeals, useCreateMeal, useUploadMealPhoto, useUpdateMeal } from "@/hooks/use-api";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import * as api from "@/lib/api-client";

const mealIcons: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  lunch: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  dinner: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  snack: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

// Default common foods - can be customized
const defaultCommonFoods = [
  { name: "Eggs", emoji: "🍳", calories: 150, quantity: "2 eggs" },
  { name: "Toast", emoji: "🍞", calories: 80, quantity: "1 slice" },
  { name: "Cereal", emoji: "🥣", calories: 200, quantity: "1 bowl" },
  { name: "Salad", emoji: "🥗", calories: 100, quantity: "1 bowl" },
  { name: "Sandwich", emoji: "🥪", calories: 250, quantity: "1 sandwich" },
  { name: "Pasta", emoji: "🍝", calories: 350, quantity: "1 plate" },
  { name: "Chicken", emoji: "🍗", calories: 300, quantity: "1 piece" },
  { name: "Fish", emoji: "🐟", calories: 250, quantity: "1 fillet" },
  { name: "Fruit", emoji: "🍎", calories: 80, quantity: "1 piece" },
  { name: "Yogurt", emoji: "🥛", calories: 120, quantity: "1 cup" },
  { name: "Soup", emoji: "🍲", calories: 150, quantity: "1 bowl" },
  { name: "Snack", emoji: "🍪", calories: 100, quantity: "1 serving" },
];

export default function Meals() {
  const { toast } = useToast();
  const { data: meals, isLoading: mealsLoading } = useTodayMeals();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const uploadMealPhoto = useUploadMealPhoto();
  const { isRecording, startRecording, stopRecording, transcript } = useVoiceRecording();
  
  const [addingMeal, setAddingMeal] = useState<string | null>(null);
  const [mealText, setMealText] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch");
  const [customizingQuickLog, setCustomizingQuickLog] = useState(false);
  const [commonFoods, setCommonFoods] = useState(defaultCommonFoods);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", emoji: "", calories: 0, quantity: "" });
  const [mealMotivation, setMealMotivation] = useState<string | null>(null);
  const [photoMotivation, setPhotoMotivation] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  const [customMeal, setCustomMeal] = useState({ name: "", emoji: "🍽️", calories: 0, quantity: "" });
  const [nutritionGoals, setNutritionGoals] = useState({ calories: 2000, protein: 50, carbs: 250, fat: 65 });

  const logMeal = async (mealType: string, foods?: string, estimatedCalories?: number) => {
    await createMeal.mutateAsync({
      mealType,
      foods: foods || mealText || "Quick meal logged",
      loggedAt: new Date(),
      estimatedCalories: estimatedCalories,
    });
    setAddingMeal(null);
    setMealText("");
    
    // Fetch meal-specific motivation
    try {
      const response = await fetch("/api/motivation/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodItems: foods || mealText || "meal",
          calories: estimatedCalories || 200,
        }),
      });
      const data = await response.json();
      if (data.message) {
        setMealMotivation(data.message);
        setTimeout(() => setMealMotivation(null), 10000); // Clear after 10 seconds
      }
    } catch (error) {
      console.error("Failed to fetch meal motivation:", error);
    }
    
    toast({
      title: "Meal logged",
      description: `${mealType} has been recorded.`,
    });
  };

  const addMoreToMeal = async (meal: any) => {
    if (!mealText.trim()) {
      toast({
        title: "Please enter food items",
        description: "Describe what else you ate",
        variant: "destructive",
      });
      return;
    }

    // Append new food to existing meal
    const updatedFoods = `${meal.foods}, ${mealText}`;
    
    await updateMeal.mutateAsync({
      mealId: meal.id,
      data: {
        foods: updatedFoods,
        estimatedCalories: (meal.estimatedCalories || 200) + 200, // Add estimated calories
      },
    });
    
    setAddingMeal(null);
    setMealText("");
    
    toast({
      title: "Meal updated",
      description: "Additional food has been added to your meal.",
    });
  };

  const quickLogFood = async (foodName: string, calories: number, quantity: string) => {
    const currentMealType = getCurrentMealType();
    await logMeal(currentMealType, `${foodName} (${quantity})`, calories);
  };

  const learnWithAI = async (foods: string, mealType: string, calories?: number) => {
    setLoadingInsights(true);
    try {
      const insights = await api.getMealAIInsights({
        foods,
        mealType,
        estimatedCalories: calories,
      });
      setAiInsights({ ...insights, mealType }); // Store which meal was analyzed
    } catch (error: any) {
      toast({
        title: "AI Insights failed",
        description: error.message || "Failed to get AI insights",
        variant: "destructive",
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 16) return "lunch";
    if (hour < 21) return "dinner";
    return "snack";
  };

  const handleVoiceLog = async () => {
    if (isRecording) {
      stopRecording();
      // Wait a moment for transcript to finalize
      setTimeout(() => {
        if (transcript) {
          // Use the transcript as meal description
          const currentMealType = getCurrentMealType();
          logMeal(currentMealType, transcript, 200); // Default 200 cal for voice logs
          toast({
            title: "Voice meal logged",
            description: `Logged: ${transcript}`,
          });
        } else {
          toast({
            title: "No speech detected",
            description: "Please try again and speak clearly.",
            variant: "destructive",
          });
        }
      }, 500);
    } else {
      startRecording();
      toast({
        title: "Recording started",
        description: "Describe what you ate...",
      });
    }
  };

  const startEditingFood = (index: number) => {
    const food = commonFoods[index];
    setEditingFoodIndex(index);
    setEditForm({ ...food });
  };

  const saveEditedFood = () => {
    if (editingFoodIndex !== null) {
      const updated = [...commonFoods];
      updated[editingFoodIndex] = editForm;
      setCommonFoods(updated);
      setEditingFoodIndex(null);
      toast({
        title: "Food updated",
        description: "Quick log item has been updated.",
      });
    }
  };

  const deleteFood = (index: number) => {
    const updated = commonFoods.filter((_, i) => i !== index);
    setCommonFoods(updated);
    toast({
      title: "Food removed",
      description: "Quick log item has been removed.",
    });
  };

  const addNewFood = () => {
    setCommonFoods([...commonFoods, { name: "New Food", emoji: "🍽️", calories: 100, quantity: "1 serving" }]);
    startEditingFood(commonFoods.length);
  };

  const resetToDefaults = () => {
    setCommonFoods(defaultCommonFoods);
    toast({
      title: "Reset complete",
      description: "Quick log items reset to defaults.",
    });
  };

  const addCustomMealToQuickLog = () => {
    if (!customMeal.name || !customMeal.calories || !customMeal.quantity) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newFood = {
      name: customMeal.name,
      emoji: customMeal.emoji || "🍽️",
      calories: customMeal.calories,
      quantity: customMeal.quantity,
    };

    setCommonFoods([...commonFoods, newFood]);
    setShowCreateCustom(false);
    setCustomMeal({ name: "", emoji: "🍽️", calories: 0, quantity: "" });
    
    toast({
      title: "Custom meal added",
      description: `${newFood.emoji} ${newFood.name} added to quick log`,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set meal type based on current time when uploading photo
    setSelectedMealType(getCurrentMealType());
    
    setUploadingPhoto(true);
    setPhotoMotivation(null);
    try {
      const result = await uploadMealPhoto.mutateAsync({ file, mealType: "lunch" });
      console.log("Photo analysis result:", result.analysis);
      setPhotoAnalysis(result.analysis);
      
      // Fetch AI motivation for this food
      const foodItems = result.analysis.foodItems?.map((item: any) => item.name).join(", ") 
        || result.analysis.foods?.join(", ") 
        || result.analysis.detectedFoods?.join(", ") 
        || "food";
      const calories = result.analysis.foodItems?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0)
        || result.analysis.nutritionEstimate?.calories 
        || result.analysis.estimatedCalories 
        || 300;
      
      try {
        const motivationResponse = await fetch("/api/motivation/meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodItems, calories }),
        });
        const motivationData = await motivationResponse.json();
        if (motivationData.message) {
          setPhotoMotivation(motivationData.message);
        }
      } catch (error) {
        console.error("Failed to fetch photo motivation:", error);
      }
    } catch (error) {
      console.error("Photo upload failed:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const todayMealsData = meals?.meals || [];
  const mealsLogged = todayMealsData.length;
  const estimatedCalories = todayMealsData.reduce((sum: number, m: any) => {
    return sum + (m.estimatedCalories || m.nutritionData?.calories || 200);
  }, 0);
  
  // Load nutrition goals from API
  useEffect(() => {
    fetch('/api/health-goals', { credentials: 'include' })
      .then(res => res.json())
      .then(goals => {
        if (goals && goals.calories) {
          setNutritionGoals({
            calories: goals.calories,
            protein: goals.protein,
            carbs: goals.carbs,
            fat: goals.fat,
          });
        }
      })
      .catch(err => console.error('Failed to load nutrition goals:', err));
  }, []);
  
  // Get unique meal types for the selector
  const uniqueMealTypes = useMemo(() => 
    Array.from(new Set(todayMealsData.map((m: any) => m.mealType))),
    [todayMealsData]
  );
  const defaultMealType = aiInsights?.mealType || uniqueMealTypes[0];
  
  // Calculate calorie goal based on nutrition goals
  const calorieGoal = nutritionGoals.calories;
  const calorieProgress = (estimatedCalories / calorieGoal) * 100;
  const isOverGoal = estimatedCalories > calorieGoal;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-meals-title">Meals & Nutrition</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your meals and hydration</p>
      </div>

      {/* Meal Motivation Card */}
      {mealMotivation && (
        <Card className="card-elevated bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🥗</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-relaxed">
                  {mealMotivation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calorie Goal Card */}
      <Card className="card-elevated" data-testid="card-calorie-goal">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Calorie Goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {estimatedCalories} / {calorieGoal} kcal
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums ${isOverGoal ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                {Math.round(calorieProgress)}%
              </p>
              <p className={`text-xs ${isOverGoal ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                {isOverGoal ? `+${estimatedCalories - calorieGoal} over` : `${calorieGoal - estimatedCalories} left`}
              </p>
            </div>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                isOverGoal
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : calorieProgress >= 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : calorieProgress >= 80 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-primary/80 to-primary'
              }`}
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
          {isOverGoal ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-red-700 dark:text-red-300">
                You've exceeded your daily calorie goal by {estimatedCalories - calorieGoal} calories.
              </p>
            </div>
          ) : calorieProgress >= 100 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Goal reached! Great job staying on track today.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-nutrition-summary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Today's Nutrition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-primary/8 dark:bg-primary/15 p-3">
              <p className="text-xl font-bold text-primary tabular-nums">{mealsLogged}</p>
              <p className="text-xs text-muted-foreground">Meals</p>
            </div>
            <div className="rounded-xl bg-sky-500/8 dark:bg-sky-500/15 p-3">
              <p className="text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">-</p>
              <p className="text-xs text-muted-foreground">Water</p>
            </div>
            <div className="rounded-xl bg-amber-500/8 dark:bg-amber-500/15 p-3">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">~{estimatedCalories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
          </div>

          {/* Macro Distribution Pie Chart */}
          {estimatedCalories > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground text-center">Macro Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Protein', 
                        value: Math.round(estimatedCalories * 0.25), 
                        grams: Math.round(estimatedCalories * 0.25 / 4),
                        color: '#3b82f6'
                      },
                      { 
                        name: 'Carbs', 
                        value: Math.round(estimatedCalories * 0.50), 
                        grams: Math.round(estimatedCalories * 0.50 / 4),
                        color: '#10b981'
                      },
                      { 
                        name: 'Fat', 
                        value: Math.round(estimatedCalories * 0.25), 
                        grams: Math.round(estimatedCalories * 0.25 / 9),
                        color: '#f59e0b'
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {[
                      { color: '#3b82f6' },
                      { color: '#10b981' },
                      { color: '#f59e0b' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                            <p className="text-xs font-medium">{data.name}</p>
                            <p className="text-xs text-muted-foreground">{data.grams}g ({Math.round((data.value / estimatedCalories) * 100)}%)</p>
                            <p className="text-xs text-muted-foreground">{data.value} cal</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    content={({ payload }) => (
                      <div className="flex justify-center gap-4 mt-2">
                        {payload?.map((entry: any, index: number) => (
                          <div key={`legend-${index}`} className="flex items-center gap-1.5">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs text-muted-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Macronutrients */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Macronutrients (estimated)</p>
            
            {/* Protein */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Protein</span>
                <span className="font-medium">~{Math.round(estimatedCalories * 0.25 / 4)}g / {nutritionGoals.protein}g</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${Math.min((estimatedCalories * 0.25 / 4 / nutritionGoals.protein) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Carbs</span>
                <span className="font-medium">~{Math.round(estimatedCalories * 0.50 / 4)}g / {nutritionGoals.carbs}g</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{ width: `${Math.min((estimatedCalories * 0.50 / 4 / nutritionGoals.carbs) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fat</span>
                <span className="font-medium">~{Math.round(estimatedCalories * 0.25 / 9)}g / {nutritionGoals.fat}g</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                  style={{ width: `${Math.min((estimatedCalories * 0.25 / 9 / nutritionGoals.fat) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Fiber */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fiber</span>
                <span className="font-medium">~{Math.round(estimatedCalories * 0.015)}g / 30g</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                  style={{ width: `${Math.min((estimatedCalories * 0.015 / 30) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Macros are estimated based on typical food composition
          </p>
        </CardContent>
      </Card>

      {/* Quick Log Section */}
      <Card className="card-elevated bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-quick-log">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Quick Log</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={customizingQuickLog} onOpenChange={setCustomizingQuickLog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Customize Quick Log</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {commonFoods.map((food, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-muted/50">
                        {editingFoodIndex === index ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Emoji</Label>
                                <Input
                                  value={editForm.emoji}
                                  onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Calories</Label>
                                <Input
                                  type="number"
                                  value={editForm.calories}
                                  onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  value={editForm.quantity}
                                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditedFood} className="flex-1">
                                <Check className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingFoodIndex(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{food.emoji}</span>
                              <div>
                                <p className="text-sm font-medium">{food.name}</p>
                                <p className="text-xs text-muted-foreground">{food.quantity} • {food.calories} cal</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => startEditingFood(index)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteFood(index)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={addNewFood} className="flex-1">
                        <Plus className="w-3 h-3 mr-1" /> Add Food
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetToDefaults}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "secondary"}
                onClick={handleVoiceLog}
                className={isRecording ? "animate-pulse" : ""}
              >
                <Mic className="w-3.5 h-3.5 mr-1" />
                {isRecording ? "Stop" : "Voice"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isRecording && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 animate-pulse">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                🎤 Recording... Describe what you ate
              </p>
              {transcript && (
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  "{transcript}"
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {commonFoods.map((food, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => quickLogFood(food.name, food.calories, food.quantity)}
                disabled={createMeal.isPending}
                className="h-auto py-2 flex-col gap-0.5 text-xs"
              >
                <span className="text-lg">{food.emoji}</span>
                <span className="font-medium leading-tight">{food.name}</span>
                <span className="text-[10px] text-muted-foreground">{food.quantity}</span>
                <span className="text-[10px] text-muted-foreground">{food.calories} cal</span>
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateCustom} onOpenChange={setShowCreateCustom}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Custom Meal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Meal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-name">Meal Name</Label>
                    <Input
                      id="custom-name"
                      placeholder="e.g., Chicken Biryani, Dal Tadka"
                      value={customMeal.name}
                      onChange={(e) => setCustomMeal({ ...customMeal, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-emoji">Emoji (optional)</Label>
                    <Input
                      id="custom-emoji"
                      placeholder="🍽️"
                      value={customMeal.emoji}
                      onChange={(e) => setCustomMeal({ ...customMeal, emoji: e.target.value })}
                      maxLength={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Common: 🍛 🍜 🍲 🥘 🍱 🥗 🍕 🍔 🌮 🥙 🍝 🍣
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="custom-quantity">Quantity</Label>
                      <Input
                        id="custom-quantity"
                        placeholder="e.g., 1 plate, 2 cups"
                        value={customMeal.quantity}
                        onChange={(e) => setCustomMeal({ ...customMeal, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-calories">Calories</Label>
                      <Input
                        id="custom-calories"
                        type="number"
                        placeholder="e.g., 350"
                        value={customMeal.calories || ""}
                        onChange={(e) => setCustomMeal({ ...customMeal, calories: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={addCustomMealToQuickLog} className="flex-1">
                      <Check className="w-4 h-4 mr-1" /> Add to Quick Log
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateCustom(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Tap a food to log it instantly, use voice, or customize your quick log items
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Today's Meals</h2>
        {mealsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {["breakfast", "lunch", "dinner"].map(mealType => {
              // Get ALL meals of this type and combine them
              const mealsOfType = todayMealsData.filter((m: any) => m.mealType === mealType);
              const hasMeals = mealsOfType.length > 0;
              
              // Combine all foods and calories
              const combinedFoods = mealsOfType.map((m: any) => m.foods).join(", ");
              const totalCalories = mealsOfType.reduce((sum: number, m: any) => 
                sum + (m.estimatedCalories || m.nutritionData?.calories || 200), 0
              );
              const latestTime = hasMeals 
                ? new Date(Math.max(...mealsOfType.map((m: any) => new Date(m.loggedAt).getTime())))
                : null;
              
              // Use the most recent meal for the "Add More" functionality
              const meal = mealsOfType[mealsOfType.length - 1];
              const Icon = mealIcons[mealType] || UtensilsCrossed;
              return (
                <Card key={mealType} className="card-elevated" data-testid={`card-meal-${mealType}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${mealColors[mealType]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm capitalize">{mealType}</h3>
                          {hasMeals ? (
                            <Badge variant="secondary" className="text-xs no-default-active-elevate bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <Check className="w-3 h-3 mr-0.5" /> Logged
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs no-default-active-elevate">Not logged</Badge>
                          )}
                        </div>
                        {hasMeals ? (
                          <div className="mt-1.5 space-y-2">
                            <p className="text-sm">{combinedFoods}</p>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{latestTime?.toLocaleTimeString()}</span>
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  ~{totalCalories} cal
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setAddingMeal(mealType)}
                                className="h-7 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add More
                              </Button>
                            </div>
                            {addingMeal === mealType && (
                              <div className="space-y-2 animate-slide-up pt-2 border-t">
                                <Textarea
                                  placeholder="What else did you eat?"
                                  value={mealText}
                                  onChange={e => setMealText(e.target.value)}
                                  className="text-sm resize-none"
                                  rows={2}
                                  data-testid={`textarea-meal-${mealType}`}
                                />
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => addMoreToMeal(meal)} 
                                    disabled={updateMeal.isPending}
                                    data-testid={`button-log-${mealType}`}
                                  >
                                    {updateMeal.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                                    Log Additional Food
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => { setAddingMeal(null); setMealText(""); }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2">
                            {addingMeal === mealType ? (
                              <div className="space-y-2 animate-slide-up">
                                <Textarea
                                  placeholder="What did you eat?"
                                  value={mealText}
                                  onChange={e => setMealText(e.target.value)}
                                  className="text-sm resize-none"
                                  rows={2}
                                  data-testid={`textarea-meal-${mealType}`}
                                />
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => logMeal(mealType)} 
                                    disabled={createMeal.isPending}
                                    data-testid={`button-log-${mealType}`}
                                  >
                                    {createMeal.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                                    Log Meal
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => { setAddingMeal(null); setMealText(""); }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setAddingMeal(mealType)} data-testid={`button-add-${mealType}`}>
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  onClick={() => logMeal(mealType)} 
                                  disabled={createMeal.isPending}
                                  data-testid={`button-quick-${mealType}`}
                                >
                                  Quick log
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Meal Photo Analysis</h2>
        <Card className="animate-slide-up" data-testid="card-photo-analysis">
          <CardContent className="p-4 space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="meal-photo-upload"
            />
            <label htmlFor="meal-photo-upload" className="block">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer transition-colors bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/5 dark:to-primary/10 hover:border-primary/50">
                {uploadingPhoto ? (
                  <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-2" />
                ) : (
                  <Camera className="w-8 h-8 mx-auto text-primary/60 mb-2" />
                )}
                <p className="text-sm font-medium">
                  {uploadingPhoto ? "Analyzing meal photo..." : "Upload Meal Photo"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Tap to select image</p>
              </div>
            </label>

            {photoAnalysis && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Analysis Complete</span>
                </div>
                
                {/* Editable Food Items */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Detected Food Items</Label>
                  {(photoAnalysis.foodItems && photoAnalysis.foodItems.length > 0) ? (
                    // New format with foodItems array
                    photoAnalysis.foodItems.map((item: any, idx: number) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Food Name</Label>
                            <Input 
                              defaultValue={item.name} 
                              className="text-sm h-8"
                              placeholder="e.g., Rice, Chicken Curry"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Quantity</Label>
                              <Input 
                                defaultValue={item.quantity} 
                                className="text-sm h-8"
                                placeholder="e.g., 1 cup, 200g"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Calories</Label>
                              <Input 
                                type="number"
                                defaultValue={item.calories} 
                                className="text-sm h-8"
                                placeholder="e.g., 250"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : photoAnalysis.foods && photoAnalysis.foods.length > 0 ? (
                    // Old format with foods array and estimatedPortions
                    photoAnalysis.foods.map((foodName: string, idx: number) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Food Name</Label>
                            <Input 
                              defaultValue={foodName} 
                              className="text-sm h-8"
                              placeholder="e.g., Rice, Chicken Curry"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Quantity</Label>
                              <Input 
                                defaultValue={photoAnalysis.estimatedPortions?.[foodName] || "1 serving"} 
                                className="text-sm h-8"
                                placeholder="e.g., 1 cup, 200g"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Est. Calories</Label>
                              <Input 
                                type="number"
                                defaultValue={Math.round((photoAnalysis.nutritionEstimate?.calories || photoAnalysis.estimatedCalories || 300) / photoAnalysis.foods.length)} 
                                className="text-sm h-8"
                                placeholder="e.g., 250"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // Fallback for detectedFoods
                    (photoAnalysis.detectedFoods || ["Food items"]).map((foodName: string, idx: number) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Food Name</Label>
                            <Input 
                              defaultValue={foodName} 
                              className="text-sm h-8"
                              placeholder="e.g., Rice, Chicken Curry"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Quantity</Label>
                              <Input 
                                defaultValue="1 serving" 
                                className="text-sm h-8"
                                placeholder="e.g., 1 cup, 200g"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Est. Calories</Label>
                              <Input 
                                type="number"
                                defaultValue={Math.round((photoAnalysis.estimatedCalories || 300) / (photoAnalysis.detectedFoods?.length || 1))} 
                                className="text-sm h-8"
                                placeholder="e.g., 250"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Nutrition Summary */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Calories</span>
                    <span className="font-semibold tabular-nums">
                      {photoAnalysis.foodItems?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) 
                        || photoAnalysis.nutritionEstimate?.calories 
                        || photoAnalysis.estimatedCalories 
                        || 300} kcal
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Health Score</span>
                    <Badge variant="secondary" className="no-default-active-elevate">{photoAnalysis.healthScore}/100</Badge>
                  </div>
                </div>

                {photoAnalysis.medicationGuidance && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {photoAnalysis.medicationGuidance}
                    </p>
                  </div>
                )}

                {/* AI Motivation for this food */}
                {photoMotivation && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 animate-slide-up">
                    <div className="text-lg">🥗</div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-900 dark:text-green-100 leading-relaxed">
                        {photoMotivation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Meal Type Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Add to Meal</Label>
                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4" />
                          <span>Breakfast</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="lunch">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          <span>Lunch</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dinner">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          <span>Dinner</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="snack">
                        <div className="flex items-center gap-2">
                          <Cookie className="w-4 h-4" />
                          <span>Snack</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => {
                    // Save the meal with edited values and selected meal type
                    
                    // Calculate total calories from all food items
                    let totalCalories = 0;
                    let foodsText = "";
                    
                    if (photoAnalysis.foodItems && photoAnalysis.foodItems.length > 0) {
                      totalCalories = photoAnalysis.foodItems.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
                      foodsText = photoAnalysis.foodItems.map((item: any) => `${item.name} (${item.quantity})`).join(", ");
                    } else if (photoAnalysis.foods && photoAnalysis.foods.length > 0) {
                      totalCalories = photoAnalysis.nutritionEstimate?.calories || photoAnalysis.estimatedCalories || 300;
                      foodsText = photoAnalysis.foods.map((name: string) => {
                        const portion = photoAnalysis.estimatedPortions?.[name];
                        return portion ? `${name} (${portion})` : name;
                      }).join(", ");
                    } else {
                      totalCalories = photoAnalysis.estimatedCalories || 300;
                      foodsText = photoAnalysis.detectedFoods?.join(", ") || "Food items";
                    }
                    
                    logMeal(selectedMealType, foodsText, totalCalories);
                    setPhotoAnalysis(null);
                  }}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Save Meal
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setPhotoAnalysis(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learn with AI Card */}
      <Card className="card-elevated bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800" data-testid="card-learn-ai">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-sm">Learn with AI</h3>
            </div>
            {todayMealsData.length > 0 && (
              <div className="flex items-center gap-2">
                <Select 
                  value={defaultMealType}
                  onValueChange={(mealType) => {
                    // Get all meals of this type and combine them
                    const mealsOfType = todayMealsData.filter((m: any) => m.mealType === mealType);
                    const combinedFoods = mealsOfType.map((m: any) => m.foods).join(", ");
                    const totalCalories = mealsOfType.reduce((sum: number, m: any) => 
                      sum + (m.estimatedCalories || m.nutritionData?.calories || 200), 0
                    );
                    learnWithAI(combinedFoods, mealType, totalCalories);
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueMealTypes.map((mealType: any) => (
                      <SelectItem key={mealType} value={mealType}>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const mealType = defaultMealType;
                    // Get all meals of this type and combine them
                    const mealsOfType = todayMealsData.filter((m: any) => m.mealType === mealType);
                    const combinedFoods = mealsOfType.map((m: any) => m.foods).join(", ");
                    const totalCalories = mealsOfType.reduce((sum: number, m: any) => 
                      sum + (m.estimatedCalories || m.nutritionData?.calories || 200), 0
                    );
                    learnWithAI(combinedFoods, mealType, totalCalories);
                  }}
                  disabled={loadingInsights}
                  data-testid="button-learn-ai"
                >
                  {loadingInsights ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1" /> Get Insights</>
                  )}
                </Button>
              </div>
            )}
            {todayMealsData.length === 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => learnWithAI("Chicken salad with vegetables", "lunch", 350)}
                disabled={loadingInsights}
                data-testid="button-learn-ai"
              >
                {loadingInsights ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 mr-1" /> Get Insights</>
                )}
              </Button>
            )}
          </div>
            
            {aiInsights && (
              <div className="space-y-3 animate-slide-up">
                <div className="rounded-md bg-white/60 dark:bg-black/20 p-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Macro Analysis</p>
                    <p className="text-sm mt-1">{aiInsights.macroAnalysis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Improvements</p>
                    <p className="text-sm mt-1">{aiInsights.improvements}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Quick Tips</p>
                    <ul className="space-y-1 mt-1">
                      {aiInsights.suggestions.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {!aiInsights && !loadingInsights && (
              <p className="text-xs text-muted-foreground">
                {meals && meals.meals && meals.meals.length > 0 
                  ? "Get AI-powered insights on your last meal to improve nutrition and achieve better macro balance."
                  : "Log a meal first, then get AI-powered insights to improve your nutrition and achieve better macro balance."}
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
