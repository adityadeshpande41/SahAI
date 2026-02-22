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
  Calendar,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { weeklyInsights, weatherData, medications, todayVsUsual, doctorVisitSummary } from "@/lib/mock-data";

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
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-insights-title">Insights & Summaries</h1>
        <p className="text-sm text-muted-foreground mt-1">Your health at a glance</p>
      </div>

      <Card className="card-elevated bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800" data-testid="card-morning-briefing">
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

      <Card className="card-elevated bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800" data-testid="card-evening-summary">
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

      <Card className="card-elevated" data-testid="card-weekly-summary">
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
              <span className="text-sm font-bold text-primary tabular-nums">{weeklyInsights.averageRoutineScore}%</span>
            </div>
            <Progress value={weeklyInsights.averageRoutineScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary/8 dark:bg-primary/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Pill className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Med Adherence</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{weeklyInsights.medAdherence}%</p>
            </div>
            <div className="rounded-xl bg-amber-500/8 dark:bg-amber-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium">Meals Logged</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{weeklyInsights.mealsLogged}/{weeklyInsights.totalMeals}</p>
            </div>
            <div className="rounded-xl bg-red-500/8 dark:bg-red-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-medium">Top Symptom</span>
              </div>
              <p className="text-sm font-bold">{weeklyInsights.topSymptom}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{weeklyInsights.symptomsReported} total</p>
            </div>
            <div className="rounded-xl bg-sky-500/8 dark:bg-sky-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs font-medium">Hydration</span>
              </div>
              <p className="text-sm font-bold">Moderate</p>
              <p className="text-xs text-muted-foreground tabular-nums">~5 glasses/day</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-3 rounded-full bg-primary inline-block" />What changed this week</h3>
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

      <Card className="card-elevated" data-testid="card-today-vs-usual">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Today vs Your Usual</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {todayVsUsual.map((item, i) => {
              const statusColor = item.status === "on track"
                ? "text-emerald-600 dark:text-emerald-400"
                : item.status === "delayed" || item.status === "partial"
                ? "text-red-500 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400";
              const StatusIcon = item.status === "on track" ? CheckCircle : item.status === "delayed" ? AlertCircle : AlertTriangle;
              return (
                <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0" data-testid={`row-compare-${i}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${statusColor}`} />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{item.usual}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className={`font-medium ${statusColor}`}>{item.today}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-doctor-prep">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Doctor Visit Prep</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs no-default-active-elevate">
              <Calendar className="w-3 h-3 mr-0.5" /> {doctorVisitSummary.nextVisit}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Key Points to Discuss</p>
            <div className="space-y-1.5">
              {doctorVisitSummary.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Questions</p>
            <div className="space-y-1.5">
              {doctorVisitSummary.questionsToAsk.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
