import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Activity,
  Plus,
  Clock,
  Flame,
  TrendingUp,
  Check,
  Loader2,
  Dumbbell,
  Heart,
  Footprints,
  Bike,
  Waves,
  Target,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTodayActivities, useCreateActivity, useExerciseMotivation } from "@/hooks/use-api";
import * as api from "@/lib/api-client";

const exerciseTypes = [
  { name: "Walking", icon: Footprints, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", caloriesPerMin: 4 },
  { name: "Running", icon: Activity, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", caloriesPerMin: 10 },
  { name: "Cycling", icon: Bike, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", caloriesPerMin: 8 },
  { name: "Swimming", icon: Waves, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300", caloriesPerMin: 9 },
  { name: "Yoga", icon: Heart, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", caloriesPerMin: 3 },
  { name: "Gym", icon: Dumbbell, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", caloriesPerMin: 6 },
];

export default function Exercise() {
  const { toast } = useToast();
  const { data: activities, isLoading } = useTodayActivities();
  const createActivity = useCreateActivity();
  const { data: exerciseMotivation } = useExerciseMotivation();

  const [selectedExercise, setSelectedExercise] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customExercises, setCustomExercises] = useState(exerciseTypes);
  const [weeklyGoal, setWeeklyGoal] = useState(150);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [activityMotivation, setActivityMotivation] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const todayActivities = activities?.activities || [];
  const totalDuration = todayActivities.reduce((sum: number, a: any) => sum + (a.duration || 0), 0);
  const totalCalories = todayActivities.reduce((sum: number, a: any) => {
    const exercise = exerciseTypes.find(e => e.name.toLowerCase() === a.activity.toLowerCase());
    return sum + ((a.duration || 0) * (exercise?.caloriesPerMin || 5));
  }, 0);

  const handleQuickLog = async (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setShowForm(true);
  };

  const learnWithAI = async (activity: string, duration?: number) => {
    setLoadingInsights(true);
    try {
      const insights = await api.getActivityAIInsights({ activity, duration });
      setAiInsights({ ...insights, activity }); // Store which activity was analyzed
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

  const handleSubmit = async () => {
    if (!selectedExercise || !duration) {
      toast({
        title: "Missing information",
        description: "Please select exercise and duration",
        variant: "destructive",
      });
      return;
    }

    const durationNum = parseInt(duration);
    await createActivity.mutateAsync({
      activity: selectedExercise,
      duration: durationNum,
      loggedAt: new Date(),
    });

    // Fetch AI motivation for this activity
    try {
      const response = await fetch("/api/motivation/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: selectedExercise,
          duration: durationNum,
        }),
      });
      const data = await response.json();
      if (data.message) {
        setActivityMotivation(data.message);
        setTimeout(() => setActivityMotivation(null), 15000); // Clear after 15 seconds
      }
    } catch (error) {
      console.error("Failed to fetch activity motivation:", error);
    }

    setSelectedExercise("");
    setDuration("");
    setNotes("");
    setShowForm(false);

    toast({
      title: "Exercise logged",
      description: `${selectedExercise} for ${durationNum} minutes has been recorded.`,
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-exercise-title">
          Exercise & Activity
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your physical activities</p>
      </div>

      {/* Exercise Motivation Card */}
      {exerciseMotivation?.message && (
        <Card className="card-elevated bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{exerciseMotivation.hasExercisedToday ? "🎉" : "💪"}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 leading-relaxed">
                  {exerciseMotivation.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity-Specific Motivation (after logging) */}
      {activityMotivation && (
        <Card className="card-elevated bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⭐</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
                  {activityMotivation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary */}
      <Card className="card-elevated bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-background/60 p-3">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {todayActivities.length}
              </p>
              <p className="text-xs text-muted-foreground">Activities</p>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {totalDuration}
              </p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="rounded-xl bg-background/60 p-3">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                {Math.round(totalCalories)}
              </p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Weekly Goal</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setShowGoalEdit(!showGoalEdit)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showGoalEdit ? (
            <div className="space-y-3 p-3 rounded-lg border bg-muted/50">
              <div className="space-y-2">
                <Label className="text-xs">Weekly Goal (minutes)</Label>
                <Input
                  type="number"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 150)}
                  min="30"
                  max="1000"
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  WHO recommends 150 minutes per week
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  setShowGoalEdit(false);
                  toast({
                    title: "Goal updated",
                    description: `Your weekly goal is now ${weeklyGoal} minutes`,
                  });
                }}
                className="w-full"
              >
                Save Goal
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{weeklyGoal} minutes per week</span>
                <span className="font-bold text-primary">{totalDuration} / {weeklyGoal} min</span>
              </div>
              <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min((totalDuration / weeklyGoal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {totalDuration >= weeklyGoal 
                  ? "🎉 Weekly goal achieved!" 
                  : `${weeklyGoal - totalDuration} minutes to reach your goal`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Log Exercises */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Quick Log</CardTitle>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Pencil className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Customize Quick Log</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {customExercises.map((exercise, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded-lg border">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Exercise Name</Label>
                          <Input
                            value={exercise.name}
                            onChange={(e) => {
                              const updated = [...customExercises];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setCustomExercises(updated);
                            }}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Calories/min</Label>
                          <Input
                            type="number"
                            value={exercise.caloriesPerMin}
                            onChange={(e) => {
                              const updated = [...customExercises];
                              updated[idx] = { ...updated[idx], caloriesPerMin: parseInt(e.target.value) || 0 };
                              setCustomExercises(updated);
                            }}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button onClick={() => setShowSettings(false)} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {customExercises.map((exercise) => {
              const Icon = exercise.icon;
              return (
                <Button
                  key={exercise.name}
                  variant="secondary"
                  onClick={() => handleQuickLog(exercise.name)}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${exercise.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-sm">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ~{exercise.caloriesPerMin} cal/min
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Log Form */}
      {showForm && (
        <Card className="card-elevated animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Log Exercise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Exercise Type</Label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {customExercises.map((exercise) => (
                    <SelectItem key={exercise.name} value={exercise.name}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div>

            {duration && selectedExercise && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Calories</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    ~{Math.round(
                      parseInt(duration) *
                        (customExercises.find((e) => e.name === selectedExercise)?.caloriesPerMin || 5)
                    )}{" "}
                    cal
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createActivity.isPending} className="flex-1">
                {createActivity.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Log Exercise
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedExercise("");
                  setDuration("");
                  setNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Activities */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-primary inline-block" />
          Today's Activities
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : todayActivities.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No activities logged today</p>
              <p className="text-xs text-muted-foreground mt-1">Start by logging an exercise above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayActivities.map((activity: any) => {
              const exercise = exerciseTypes.find(
                (e) => e.name.toLowerCase() === activity.activity.toLowerCase()
              );
              const Icon = exercise?.icon || Activity;
              const calories = (activity.duration || 0) * (exercise?.caloriesPerMin || 5);

              return (
                <Card key={activity.id} className="card-elevated">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                          exercise?.color || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{activity.activity}</h3>
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-0.5" /> Completed
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{activity.duration || 0} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              ~{Math.round(calories)} cal
                            </span>
                          </div>
                          <span>{new Date(activity.loggedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Learn with AI Card */}
      <Card className="card-elevated bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800" data-testid="card-learn-ai-exercise">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-sm">Learn with AI</h3>
            </div>
            {todayActivities.length > 0 && (
              <div className="flex items-center gap-2">
                <Select 
                  value={aiInsights?.activity || todayActivities[0]?.activity}
                  onValueChange={(activity) => {
                    const selectedActivity = todayActivities.find(a => a.activity === activity);
                    if (selectedActivity) {
                      learnWithAI(selectedActivity.activity, selectedActivity.duration);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {todayActivities.map((activity: any, idx: number) => (
                      <SelectItem key={idx} value={activity.activity}>
                        {activity.activity} ({activity.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const activity = aiInsights?.activity || todayActivities[0]?.activity;
                    const selectedActivity = todayActivities.find(a => a.activity === activity);
                    if (selectedActivity) {
                      learnWithAI(selectedActivity.activity, selectedActivity.duration);
                    }
                  }}
                  disabled={loadingInsights}
                  data-testid="button-learn-ai-exercise"
                >
                  {loadingInsights ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1" /> Get Insights</>
                  )}
                </Button>
              </div>
            )}
            {todayActivities.length === 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => learnWithAI("Walking", 30)}
                disabled={loadingInsights}
                data-testid="button-learn-ai-exercise"
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
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Benefits</p>
                    <p className="text-sm mt-1">{aiInsights.insights}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Tips for You</p>
                    <ul className="space-y-1 mt-1">
                      {aiInsights.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Try Next</p>
                    <p className="text-sm mt-1">{aiInsights.complementary}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!aiInsights && !loadingInsights && (
              <p className="text-xs text-muted-foreground">
                {todayActivities.length > 0 
                  ? "Get AI-powered insights on your last activity to optimize your exercise routine and stay safe."
                  : "Get AI-powered insights about exercises to optimize your routine and stay safe. Start by logging an activity above!"}
              </p>
            )}
          </CardContent>
        </Card>

      {/* Health Tip */}
      <Card className="card-elevated bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Health Tip</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regular physical activity helps manage blood sugar, improves heart health, and boosts mood.
                Even 10-minute walks count toward your weekly goal!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
