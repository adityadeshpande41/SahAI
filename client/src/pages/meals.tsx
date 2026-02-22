import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UtensilsCrossed,
  Plus,
  Camera,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Droplets,
  Pill,
  Check,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { todayMeals as initialMeals, type Meal } from "@/lib/mock-data";

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

export default function Meals() {
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [addingMeal, setAddingMeal] = useState<string | null>(null);
  const [mealText, setMealText] = useState("");
  const [showPhotoDemo, setShowPhotoDemo] = useState(false);

  const logMeal = (mealType: string) => {
    setMeals(prev => prev.map(m =>
      m.type === mealType
        ? { ...m, logged: true, foods: mealText || "Quick meal logged", time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) }
        : m
    ));
    setAddingMeal(null);
    setMealText("");
    toast({ title: "Meal logged", description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} has been recorded.` });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-meals-title">Meals & Nutrition</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your meals and hydration</p>
      </div>

      <Card data-testid="card-nutrition-summary">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-primary">1</p>
              <p className="text-xs text-muted-foreground">Meals logged</p>
            </div>
            <div>
              <p className="text-xl font-bold text-sky-600 dark:text-sky-400">2</p>
              <p className="text-xs text-muted-foreground">Glasses water</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">~420</p>
              <p className="text-xs text-muted-foreground">Est. calories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Today's Meals</h2>
        <div className="space-y-3">
          {meals.map(meal => {
            const Icon = mealIcons[meal.type] || UtensilsCrossed;
            return (
              <Card key={meal.id} data-testid={`card-meal-${meal.type}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${mealColors[meal.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm capitalize">{meal.type}</h3>
                        {meal.logged ? (
                          <Badge variant="secondary" className="text-xs no-default-active-elevate bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Check className="w-3 h-3 mr-0.5" /> Logged
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs no-default-active-elevate">Not logged</Badge>
                        )}
                      </div>
                      {meal.logged ? (
                        <div className="mt-1.5 space-y-1">
                          <p className="text-sm">{meal.foods}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{meal.time}</span>
                            {meal.hydration && (
                              <span className="flex items-center gap-0.5">
                                <Droplets className="w-3 h-3" /> {meal.hydration}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {addingMeal === meal.type ? (
                            <div className="space-y-2 animate-slide-up">
                              <Textarea
                                placeholder="What did you eat?"
                                value={mealText}
                                onChange={e => setMealText(e.target.value)}
                                className="text-sm resize-none"
                                rows={2}
                                data-testid={`textarea-meal-${meal.type}`}
                              />
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => logMeal(meal.type)} data-testid={`button-log-${meal.type}`}>
                                  <Check className="w-3.5 h-3.5 mr-1" /> Log Meal
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => { setAddingMeal(null); setMealText(""); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setAddingMeal(meal.type)} data-testid={`button-add-${meal.type}`}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => { logMeal(meal.type); }} data-testid={`button-quick-${meal.type}`}>
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
          <Button variant="secondary" className="w-full" onClick={() => {
            setMeals(prev => [...prev, { id: Date.now(), type: "snack", time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }), foods: "Snack", hydration: "", logged: true }]);
            toast({ title: "Snack logged" });
          }} data-testid="button-add-snack">
            <Cookie className="w-4 h-4 mr-2" /> Quick Add Snack
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Meal Photo Analysis</h2>
        {!showPhotoDemo ? (
          <Button variant="secondary" className="w-full h-auto py-4" onClick={() => setShowPhotoDemo(true)} data-testid="button-upload-meal-photo">
            <Camera className="w-5 h-5 mr-2" /> Upload Meal Photo
          </Button>
        ) : (
          <Card className="animate-slide-up" data-testid="card-photo-analysis">
            <CardContent className="p-4 space-y-4">
              <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">lunch_photo.jpg</p>
                  <p className="text-xs text-muted-foreground">Analyzing...</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Analysis Complete</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground">Detected</span>
                    <span className="text-sm font-medium">Sandwich + Tea</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground">Classified as</span>
                    <Badge variant="secondary" className="no-default-active-elevate">Light meal</Badge>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20">
                    <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Counts as food for after-food meds. Your evening Metformin can be taken after this.
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => { setShowPhotoDemo(false); toast({ title: "Meal logged from photo" }); }} data-testid="button-confirm-photo">
                  <Check className="w-3.5 h-3.5 mr-1" /> Confirm & Log
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card data-testid="card-med-link">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Pill className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Medication-Meal Link</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your Metformin (8 PM) needs to be taken after food. Make sure to have dinner before taking it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
