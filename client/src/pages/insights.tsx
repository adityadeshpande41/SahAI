import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  TrendingUp,
  Pill,
  UtensilsCrossed,
  Activity,
  CloudSun,
  AlertTriangle,
  Droplets,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calculator,
  Flame,
  Scale,
  Sparkles,
  Brain,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSummary, useMedicationAdherence, useWeather, useTodayMedications, useTodayMeals, useUserPreferences, useMealSuggestion, useSymptomPrediction, useActivitySuggestion, useTodayActivities } from "@/hooks/use-api";

export default function Insights() {
  const { data: morningSummary, isLoading: morningLoading } = useSummary("morning");
  const { data: eveningSummary, isLoading: eveningLoading } = useSummary("evening");
  const { data: weeklySummary, isLoading: weeklyLoading } = useSummary("weekly");
  const { data: doctorSummary, isLoading: doctorLoading } = useSummary("doctor_visit");
  const { data: adherenceData } = useMedicationAdherence();
  const { data: weather } = useWeather();
  const { data: medicationsData } = useTodayMedications();
  const { data: mealsData } = useTodayMeals();
  const { data: activitiesData } = useTodayActivities();
  
  // Learning features
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const { data: mealSuggestion } = useMealSuggestion();
  const { data: symptomPrediction } = useSymptomPrediction();
  const { data: activitySuggestion } = useActivitySuggestion();

  // BMI Calculator state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  const medications = medicationsData?.schedule || [];
  const takenToday = medications.filter((m: any) => m.takenAt).length || 0;
  const totalToday = medications.length || 0;

  const meals = mealsData?.meals || [];
  const lastMeal = meals.length > 0 ? meals[meals.length - 1] : null;

  // Calculate workout stats
  const activities = activitiesData?.activities || [];
  const totalMinutes = activities.reduce((sum: number, a: any) => sum + (a.duration || 0), 0);
  const totalCaloriesBurned = activities.reduce((sum: number, a: any) => sum + (a.caloriesBurned || 0), 0);
  const weeklyGoal = 150; // WHO recommendation: 150 minutes per week
  const weeklyProgress = Math.min(100, Math.round((totalMinutes / weeklyGoal) * 100));

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const calculatedBMI = w / (heightInMeters * heightInMeters);
      setBmi(parseFloat(calculatedBMI.toFixed(1)));
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600 dark:text-blue-400" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-600 dark:text-amber-400" };
    return { label: "Obese", color: "text-red-600 dark:text-red-400" };
  };

  if (morningLoading || eveningLoading || weeklyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -m-6 p-6">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="text-insights-title">Insights & Summaries</h1>
          <p className="text-sm text-gray-600 mt-1">Your health at a glance</p>
        </div>

      {/* AI Learning Insights */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800" data-testid="card-ai-insights">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-sm font-semibold">AI Learning Insights</CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Symptom Prediction */}
          {symptomPrediction && (
            <div className={`p-3 rounded-lg border ${
              symptomPrediction.riskLevel === 'medium' 
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-start gap-2">
                {symptomPrediction.riskLevel === 'medium' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-1">Health Status</p>
                  <p className="text-sm">{symptomPrediction.message}</p>
                  {symptomPrediction.risks && symptomPrediction.risks.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {symptomPrediction.risks.map((risk: string, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground">• {risk}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meal Suggestion */}
          {mealSuggestion && mealSuggestion.suggestions && mealSuggestion.suggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-1">Meal Suggestion</p>
                  <p className="text-sm mb-2">{mealSuggestion.message}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mealSuggestion.suggestions.map((food: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs capitalize">
                        {food}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Suggestion */}
          {activitySuggestion && activitySuggestion.suggestions && activitySuggestion.suggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-1">Activity Suggestion</p>
                  <p className="text-sm mb-2">{activitySuggestion.message}</p>
                  <div className="space-y-1">
                    {activitySuggestion.suggestions.map((activity: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{activity.activity}</span>
                        <span className="text-muted-foreground">{activity.preferredTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Favorite Foods */}
          {preferences && preferences.favoriteFoods && preferences.favoriteFoods.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-2">Your Favorite Foods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.favoriteFoods.slice(0, 5).map((food: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs capitalize">
                        {food.food} ({food.count}x)
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Summary */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800" data-testid="card-workout-summary">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm font-semibold">Workout Summary</CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs">
              Today
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="w-3 h-3" /> Activities
                  </div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {activities.length}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> Minutes
                  </div>
                  <p className="text-lg font-bold text-primary">{totalMinutes}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3" /> Calories
                  </div>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {totalCaloriesBurned}
                  </p>
                </div>
              </div>

              {/* Weekly Goal Progress */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Weekly Goal Progress</span>
                  <span className="text-xs font-medium text-primary">{totalMinutes}/{weeklyGoal} min</span>
                </div>
                <Progress value={weeklyProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {weeklyProgress >= 100 
                    ? "🎉 Weekly goal achieved!" 
                    : `${weeklyGoal - totalMinutes} minutes to reach your weekly goal`}
                </p>
              </div>

              {/* Today's Activities List */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium mb-2">Today's Activities</p>
                <div className="space-y-1.5">
                  {activities.slice(0, 3).map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-md bg-background/60 border border-border/50">
                      <span className="capitalize font-medium">{activity.activity}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{activity.duration} min</span>
                        <span>•</span>
                        <span>{activity.caloriesBurned} cal</span>
                      </div>
                    </div>
                  ))}
                  {activities.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{activities.length - 3} more activities
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No workouts logged today</p>
              <p className="text-xs text-muted-foreground mt-1">Start tracking your activities!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BMI Calculator */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800" data-testid="card-bmi-calculator">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-sm font-semibold">BMI Calculator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height" className="text-xs">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <Button onClick={calculateBMI} size="sm" className="w-full">
            <Scale className="w-3.5 h-3.5 mr-1.5" />
            Calculate BMI
          </Button>
          {bmi !== null && (
            <div className="p-3 rounded-lg bg-background/60 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your BMI:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{bmi}</span>
                  <p className={`text-xs font-medium ${getBMICategory(bmi).color}`}>
                    {getBMICategory(bmi).label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Meal & Calories */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800" data-testid="card-nutrition">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-sm font-semibold">Nutrition Today</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastMeal ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Last Meal</span>
                  <Badge variant="secondary" className="text-xs">
                    {lastMeal.mealType}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{lastMeal.foods || "No details"}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(lastMeal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3" /> Est. Calories
                  </div>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {lastMeal.estimatedCalories || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UtensilsCrossed className="w-3 h-3" /> Meals Today
                  </div>
                  <p className="text-lg font-bold text-primary">{meals.length}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No meals logged today</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800" data-testid="card-morning-briefing">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm font-semibold">Morning Briefing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {morningSummary ? (
            <>
              {weather && (
                <div className="flex items-center gap-2 text-sm">
                  <CloudSun className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span>{weather.temperature}°C - {weather.condition}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Pill className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{totalToday} medications scheduled today ({takenToday} already taken)</span>
              </div>
              {morningSummary.summary && (
                <div className="text-sm">{morningSummary.summary}</div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No morning briefing available yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800" data-testid="card-evening-summary">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-sm font-semibold">Evening Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {eveningSummary ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Pill className="w-3 h-3" /> Medications
                  </div>
                  <p className="text-sm font-medium">{takenToday}/{totalToday} taken</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="w-3 h-3" /> Adherence
                  </div>
                  <p className="text-sm font-medium">{adherenceData?.adherenceRate || 0}%</p>
                </div>
              </div>
              {eveningSummary.summary && (
                <p className="text-sm mt-3">{eveningSummary.summary}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evening summary available yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200" data-testid="card-weekly-summary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Weekly Routine Twin Summary</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklySummary ? (
            <>
              {adherenceData && (
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs text-muted-foreground">Average Routine Score</span>
                    <span className="text-sm font-bold text-primary tabular-nums">{adherenceData.adherenceRate}%</span>
                  </div>
                  <Progress value={adherenceData.adherenceRate} className="h-2" />
                </div>
              )}
              {weeklySummary.summary && (
                <div className="rounded-md bg-primary/5 dark:bg-primary/10 p-3">
                  <p className="text-xs font-medium text-primary mb-1">Weekly Insights</p>
                  <p className="text-sm text-muted-foreground">{weeklySummary.summary}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No weekly summary available yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-doctor-prep">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Doctor Visit Prep</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {doctorSummary && doctorSummary.summary ? (
            <div className="text-sm">{doctorSummary.summary}</div>
          ) : (
            <p className="text-sm text-muted-foreground">No doctor visit summary available yet</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
