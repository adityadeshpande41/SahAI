import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTodayActivities, useCreateActivity } from "@/hooks/use-api";

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

  const [selectedExercise, setSelectedExercise] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -m-6 p-6">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="text-exercise-title">
            Exercise & Activity
          </h1>
          <p className="text-sm text-gray-600 mt-1">Track your physical activities</p>
        </div>

      {/* Today's Summary */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
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
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Weekly Goal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">150 minutes per week</span>
            <span className="font-bold text-primary">{totalDuration} / 150 min</span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min((totalDuration / 150) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            WHO recommends 150 minutes of moderate activity per week
          </p>
        </CardContent>
      </Card>

      {/* Quick Log Exercises */}
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {exerciseTypes.map((exercise) => {
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
        <Card className="bg-white shadow-lg border border-gray-200 animate-slide-up">
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
                  {exerciseTypes.map((exercise) => (
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
                        (exerciseTypes.find((e) => e.name === selectedExercise)?.caloriesPerMin || 5)
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
          <Card className="bg-white shadow-lg border border-gray-200">
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
                <Card key={activity.id} className="bg-white shadow-lg border border-gray-200">
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

      {/* Health Tip */}
      <Card className="bg-white shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
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
    </div>
  );
}
