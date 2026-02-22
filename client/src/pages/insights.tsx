import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { weeklyInsights, weatherData, medications } from "@/lib/mock-data";

const trendIcon = {
  improving: ArrowUp,
  stable: Minus,
  declining: ArrowDown,
};

const trendColor = {
  improving: "text-emerald-600 dark:text-emerald-400",
  stable: "text-amber-600 dark:text-amber-400",
  declining: "text-red-600 dark:text-red-400",
};

export default function Insights() {
  const TrendIcon = trendIcon[weeklyInsights.trend];
  const takenToday = medications.filter(m => m.taken).length;
  const totalToday = medications.length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-insights-title">Insights & Summaries</h1>
        <p className="text-sm text-muted-foreground mt-1">Your health at a glance</p>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800" data-testid="card-morning-briefing">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm font-semibold">Morning Briefing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CloudSun className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{weatherData.temp} - {weatherData.condition}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Pill className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{totalToday} medications scheduled today ({takenToday} already taken)</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <span>{weatherData.advisory}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800" data-testid="card-evening-summary">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-sm font-semibold">Evening Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Pill className="w-3 h-3" /> Medications
              </div>
              <p className="text-sm font-medium">{takenToday}/{totalToday} taken</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UtensilsCrossed className="w-3 h-3" /> Meals
              </div>
              <p className="text-sm font-medium">1 of 3 logged</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" /> Symptoms
              </div>
              <p className="text-sm font-medium">1 reported</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="w-3 h-3" /> Drift Events
              </div>
              <p className="text-sm font-medium">{weeklyInsights.driftEvents} this week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-weekly-summary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Weekly Routine Twin Summary</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor[weeklyInsights.trend]}`} />
              <span className={`text-xs font-medium capitalize ${trendColor[weeklyInsights.trend]}`}>
                {weeklyInsights.trend}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-xs text-muted-foreground">Average Routine Score</span>
              <span className="text-sm font-bold text-primary">{weeklyInsights.averageRoutineScore}%</span>
            </div>
            <Progress value={weeklyInsights.averageRoutineScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Pill className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Med Adherence</span>
              </div>
              <p className="text-xl font-bold">{weeklyInsights.medAdherence}%</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium">Meals Logged</span>
              </div>
              <p className="text-xl font-bold">{weeklyInsights.mealsLogged}/{weeklyInsights.totalMeals}</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-medium">Top Symptom</span>
              </div>
              <p className="text-sm font-bold">{weeklyInsights.topSymptom}</p>
              <p className="text-xs text-muted-foreground">{weeklyInsights.symptomsReported} total</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs font-medium">Hydration</span>
              </div>
              <p className="text-sm font-bold">Moderate</p>
              <p className="text-xs text-muted-foreground">~5 glasses/day</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What changed this week</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <span>Lunch times shifted 30 minutes later on average</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                <span>Morning walk consistency improved</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span>Dizziness reported more frequently (afternoons)</span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-primary/5 dark:bg-primary/10 p-3">
            <p className="text-xs font-medium text-primary mb-1">Gentle Insight</p>
            <p className="text-sm text-muted-foreground">
              Your afternoon dizziness may be related to delayed lunches. Try eating by 12:30 PM this week and see if it helps.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
